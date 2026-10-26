'use strict';
/* Steady server: serves the three apps (Couch Surfer, Host, Dashboard), each with its own sign-in,
   and keeps one shared, persistent dataset that every signed-in app reads and updates live over SSE.
   No npm dependencies: Node's http, fs, zlib and crypto only. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { JsonFile } = require('./store');
const auth = require('./auth');
const core = require('./core-node');

const ROOT = path.join(__dirname, '..');
const APPS_DIR = path.join(ROOT, 'apps');
const SHARED_DIR = path.join(ROOT, 'shared');
const DATA_DIR = process.env.STEADY_DATA_DIR || path.join(__dirname, 'data');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DEMO_PASSWORD = process.env.STEADY_DEMO_PASSWORD || 'steady-demo';
const VERSION = (() => { try { return require(path.join(ROOT, 'package.json')).version; } catch (e) { return '0'; } })();

const APPS = {
  couchsurfer: { cookie: 'steady_cs', title: 'Couch Surfer', mode: 'cs', register: true },
  host: { cookie: 'steady_host', title: 'Host', mode: 'host', register: true },
  dashboard: { cookie: 'steady_dash', title: 'Dashboard', mode: 'gov', register: false }
};
const DEMO_ACCOUNTS = [
  { app: 'couchsurfer', email: 'jordan@steady.demo', name: 'Jordan Lee', participantId: 'p_jordan' },
  { app: 'couchsurfer', email: 'sam@steady.demo', name: 'Sam Rivera', participantId: 'p_sam' },
  { app: 'couchsurfer', email: 'mia@steady.demo', name: 'Mia Okonkwo', participantId: 'p_mia' },
  { app: 'host', email: 'priya@steady.demo', name: 'Priya Natarajan', hostId: 'h_priya' },
  { app: 'host', email: 'marcus@steady.demo', name: 'Marcus Tran', hostId: 'h_marcus' },
  { app: 'dashboard', email: 'analyst@steady.demo', name: 'Program analyst', role: 'analyst' },
  { app: 'dashboard', email: 'viewer@steady.demo', name: 'Program viewer', role: 'viewer' },
  { app: 'dashboard', email: 'admin@steady.demo', name: 'Program administrator', role: 'admin' }
];

/* ---------------- persistence ---------------- */
const stateFile = new JsonFile(path.join(DATA_DIR, 'state.json'), null);
const accountsFile = new JsonFile(path.join(DATA_DIR, 'accounts.json'), () => ({ accounts: [] }));
const sessions = new auth.Sessions(new JsonFile(path.join(DATA_DIR, 'sessions.json'), () => ({ sessions: {} })));
const loginLimiter = new auth.RateLimiter(10, 15 * 60e3);

let accounts = accountsFile.load().accounts || [];
let state = stateFile.load();
let seededNow = false;
if (!state || !state.db) { state = { rev: 1, dayOffset: 0, db: core.seedDb(), updatedAt: Date.now(), seededAt: Date.now() }; seededNow = true; }
const DB_SHAPE = (() => { const seed = core.seedDb(); const shape = {}; for (const k in seed) shape[k] = Array.isArray(seed[k]) ? 'array' : typeof seed[k]; return shape; })();

function ensureDemoAccounts() {
  let changed = false;
  for (const d of DEMO_ACCOUNTS) {
    if (accounts.some(a => a.app === d.app && a.email === d.email)) continue;
    const { salt, hash } = auth.hashPassword(DEMO_PASSWORD);
    accounts.push(Object.assign({ id: 'acc_' + crypto.randomBytes(6).toString('hex'), createdAt: Date.now(), demo: true, salt, hash }, d));
    changed = true;
  }
  if (changed) accountsFile.save({ accounts });
}
ensureDemoAccounts();
{ const keys = core.ensureRecords(state.db, accounts); if (keys.length || seededNow) { state.rev++; state.updatedAt = Date.now(); stateFile.save(state); } }

function saveState(immediate) { state.updatedAt = Date.now(); stateFile.save(state, immediate ? 0 : 400); }

/* ---------------- live clients (SSE) ---------------- */
const clients = new Set();
function broadcast(event, data) {
  const msg = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
  for (const c of clients) { try { c.res.write(msg); } catch (e) { clients.delete(c); } }
}
function presence() { broadcast('presence', { clients: clients.size }); }
setInterval(() => { for (const c of clients) { try { c.res.write(': ping\n\n'); } catch (e) { clients.delete(c); } } }, 25000).unref();

/* ---------------- helpers ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.map': 'application/json' };
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|manifest))/;
const gzipCache = new Map();

function send(res, status, body, headers) {
  const h = Object.assign({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }, headers || {});
  res.writeHead(status, h); res.end(body);
}
function json(res, status, obj, extra) { send(res, status, JSON.stringify(obj), Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {})); }
function redirect(res, to, status) { send(res, status || 302, '', { Location: to, 'Cache-Control': 'no-store' }); }
function acceptsGzip(req) { return /\bgzip\b/.test(req.headers['accept-encoding'] || ''); }
function maybeGzip(req, res, body, type, headers) {
  const h = Object.assign({ 'Content-Type': type, Vary: 'Accept-Encoding' }, headers || {});
  if (acceptsGzip(req) && COMPRESSIBLE.test(type) && body.length > 1024) { h['Content-Encoding'] = 'gzip'; return send(res, 200, zlib.gzipSync(body, { level: 6 }), h); }
  return send(res, 200, body, h);
}
function serveFile(req, res, abs, cacheControl) {
  let st; try { st = fs.statSync(abs); } catch (e) { return notFound(res); }
  if (!st.isFile()) return notFound(res);
  const ext = path.extname(abs).toLowerCase(); const type = MIME[ext] || 'application/octet-stream';
  const etag = 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
  if (req.headers['if-none-match'] === etag) return send(res, 304, '', { ETag: etag, 'Cache-Control': cacheControl });
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': cacheControl, Vary: 'Accept-Encoding' };
  if (ext === '.html') headers['X-Frame-Options'] = 'SAMEORIGIN';
  if (acceptsGzip(req) && COMPRESSIBLE.test(type) && st.size > 1024) {
    const key = abs + '|' + etag; let gz = gzipCache.get(key);
    if (!gz) { gz = zlib.gzipSync(fs.readFileSync(abs), { level: 6 }); if (gzipCache.size > 200) gzipCache.clear(); gzipCache.set(key, gz); }
    headers['Content-Encoding'] = 'gzip'; return send(res, 200, gz, headers);
  }
  if (req.method === 'HEAD') { headers['Content-Length'] = st.size; return send(res, 200, '', headers); }
  res.writeHead(200, Object.assign({ 'Content-Length': st.size, 'X-Content-Type-Options': 'nosniff' }, headers));
  fs.createReadStream(abs).pipe(res);
}
function notFound(res) { send(res, 404, '<!doctype html><meta charset="utf-8"><title>Not found</title><body style="font-family:system-ui;padding:40px"><h1>Not found</h1><p><a href="/">Back to Steady</a></p>', { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); }
function safeJoin(base, rel) { const p = path.normalize(path.join(base, rel)); return p.startsWith(base + path.sep) || p === base ? p : null; }
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Request body too large'), { status: 413 })); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve(null); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function publicAccount(a) {
  const me = { id: a.id, app: a.app, email: a.email, name: a.name, demo: !!a.demo };
  if (a.participantId) me.participantId = a.participantId; if (a.hostId) me.hostId = a.hostId; if (a.role) me.role = a.role;
  return me;
}
function sessionAccount(req, app) {
  const cookies = auth.parseCookies(req); const token = cookies[APPS[app].cookie];
  const s = sessions.get(token, app); if (!s) return null;
  const a = accounts.find(x => x.id === s.accountId); return a ? { account: a, token } : null;
}
function sameOrigin(req) {
  const origin = req.headers.origin; if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host; try { return new URL(origin).host === host; } catch (e) { return false; }
}
function clientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ---------------- API ---------------- */
async function handleApi(req, res, u) {
  const parts = u.pathname.split('/').filter(Boolean); // ['api', app, ...rest]
  if (parts[1] === 'health') return json(res, 200, { ok: true, version: VERSION, rev: state.rev, clients: clients.size, accounts: accounts.length, uptime: Math.round(process.uptime()) });
  const app = parts[1]; const cfg = APPS[app]; if (!cfg) return json(res, 404, { error: 'Unknown app' });
  const rest = parts.slice(2).join('/'); const method = req.method;
  const mutating = method !== 'GET' && method !== 'HEAD';
  if (mutating && !sameOrigin(req)) return json(res, 403, { error: 'Cross-origin request blocked' });
  if (mutating && method !== 'DELETE' && !/^application\/json/.test(req.headers['content-type'] || '') && req.headers['content-length'] && req.headers['content-length'] !== '0') return json(res, 415, { error: 'Send JSON' });

  if (rest === 'login' && method === 'POST') {
    const body = await readBody(req, 64e3) || {}; const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
    const key = clientIp(req) + '|' + email;
    if (!loginLimiter.check(key)) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const a = accounts.find(x => x.app === app && x.email === email);
    if (!a || !auth.verifyPassword(password, a.salt, a.hash)) return json(res, 401, { error: 'That email and password don’t match a ' + cfg.title + ' account.' });
    loginLimiter.reset(key);
    const token = sessions.create(app, a.id); auth.setCookie(res, req, cfg.cookie, token, auth.SESSION_DAYS * 86400);
    return json(res, 200, { me: publicAccount(a) });
  }
  if (rest === 'register' && method === 'POST') {
    if (!cfg.register) return json(res, 403, { error: 'Dashboard access is provisioned by the program administrator.' });
    const body = await readBody(req, 64e3) || {}; const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || ''); const name = String(body.name || '').trim().slice(0, 80);
    if (!EMAIL_RE.test(email)) return json(res, 400, { error: 'Enter a valid email address.' });
    if (password.length < 8) return json(res, 400, { error: 'Use a password of at least 8 characters.' });
    if (accounts.some(x => x.app === app && x.email === email)) return json(res, 409, { error: 'An account with this email already exists. Sign in instead.' });
    const { salt, hash } = auth.hashPassword(password);
    const a = { id: 'acc_' + crypto.randomBytes(6).toString('hex'), app, email, name: name || (app === 'host' ? 'New host' : 'New member'), createdAt: Date.now(), demo: false, salt, hash };
    if (app === 'couchsurfer') { a.participantId = 'p_' + crypto.randomBytes(5).toString('hex'); state.db.participants = state.db.participants.concat([core.newParticipant(a.participantId, { name: a.name, email }, core.today())]); }
    if (app === 'host') { a.hostId = 'h_' + crypto.randomBytes(5).toString('hex'); a.phone = String(body.phone || '').slice(0, 40); state.db.hosts = state.db.hosts.concat([core.newHost(a.hostId, { name: a.name, email, phone: a.phone }, core.today())]); }
    accounts.push(a); accountsFile.save({ accounts });
    state.rev++; saveState(false);
    broadcast('patch', { rev: state.rev, origin: 'server', db: app === 'host' ? { hosts: state.db.hosts } : { participants: state.db.participants } });
    const token = sessions.create(app, a.id); auth.setCookie(res, req, cfg.cookie, token, auth.SESSION_DAYS * 86400);
    return json(res, 201, { me: publicAccount(a) });
  }
  if (rest === 'logout' && method === 'POST') {
    const sa = sessionAccount(req, app); if (sa) sessions.destroy(sa.token);
    auth.setCookie(res, req, cfg.cookie, '', 0); return send(res, 204, '', { 'Cache-Control': 'no-store' });
  }

  const sa = sessionAccount(req, app);
  if (!sa && rest === 'me' && method === 'GET') return json(res, 200, { me: null });
  if (!sa) return json(res, 401, { error: 'Sign in to continue' });
  const me = sa.account;

  if (rest === 'me' && method === 'GET') return json(res, 200, { me: publicAccount(me) });
  if (rest === 'me' && method === 'PATCH') {
    const body = await readBody(req, 16e3) || {}; if (typeof body.name === 'string' && body.name.trim()) { me.name = body.name.trim().slice(0, 80); accountsFile.save({ accounts }); }
    return json(res, 200, { me: publicAccount(me) });
  }
  if (rest === 'state' && method === 'GET') {
    const body = JSON.stringify({ rev: state.rev, dayOffset: state.dayOffset || 0, db: state.db });
    return maybeGzip(req, res, body, 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }
  if (rest === 'state' && method === 'PATCH') {
    const body = await readBody(req, 6e6) || {};
    const patch = body.db && typeof body.db === 'object' ? body.db : {}; const applied = {};
    for (const k in patch) {
      if (!DB_SHAPE[k]) return json(res, 400, { error: 'Unknown collection ' + k });
      const v = patch[k]; const kind = Array.isArray(v) ? 'array' : typeof v;
      if (kind !== DB_SHAPE[k]) return json(res, 400, { error: 'Bad shape for ' + k });
      state.db[k] = v; applied[k] = v;
    }
    let offsetChanged = false;
    if (typeof body.dayOffset === 'number' && isFinite(body.dayOffset) && body.dayOffset !== state.dayOffset) { state.dayOffset = Math.round(body.dayOffset); offsetChanged = true; }
    if (!Object.keys(applied).length && !offsetChanged) return json(res, 200, { rev: state.rev });
    state.rev++; saveState(false);
    const msg = { rev: state.rev, origin: String(body.clientId || ''), db: applied, by: me.app }; if (offsetChanged) msg.dayOffset = state.dayOffset;
    broadcast('patch', msg);
    return json(res, 200, { rev: state.rev });
  }
  if (rest === 'state/reset' && method === 'POST') {
    state.db = core.seedDb(); state.dayOffset = 0; core.ensureRecords(state.db, accounts); state.rev++; state.seededAt = Date.now(); saveState(true);
    broadcast('reset', { rev: state.rev, by: me.app });
    return json(res, 200, { rev: state.rev });
  }
  if (rest === 'events' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const client = { res, app, accountId: me.id };
    clients.add(client); res.write('event: hello\ndata: ' + JSON.stringify({ rev: state.rev, clients: clients.size }) + '\n\n'); presence();
    req.on('close', () => { clients.delete(client); presence(); });
    return;
  }
  return json(res, 404, { error: 'Not found' });
}

/* ---------------- pages ---------------- */
function appGate(req, res, u, app) {
  const sa = sessionAccount(req, app);
  if (sa) return true;
  if (APPS[app].register && u.searchParams.has('onboard')) return true;
  redirect(res, '/' + app + '/login?next=' + encodeURIComponent(u.pathname + u.search)); return false;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = u.pathname;
  try {
    if (p.startsWith('/api/')) return await handleApi(req, res, u);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain' });

    if (p.startsWith('/assets/')) {
      const abs = safeJoin(SHARED_DIR, decodeURIComponent(p.slice('/assets/'.length))); if (!abs) return notFound(res);
      const img = /\.(png|jpg|svg|ico|woff2)$/i.test(abs);
      return serveFile(req, res, abs, img ? 'public, max-age=604800' : (u.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'no-cache'));
    }
    if (p === '/' || p === '/index.html') return serveFile(req, res, path.join(APPS_DIR, 'landing', 'index.html'), 'no-cache');
    if (p === '/government' || p.startsWith('/government/')) return redirect(res, '/dashboard' + p.slice('/government'.length) + u.search, 301);
    if (p === '/demo' || p === '/demo/' || p === '/demo/index.html') {
      if (!sessionAccount(req, 'dashboard')) return redirect(res, '/dashboard/login?next=' + encodeURIComponent('/demo/'));
      return serveFile(req, res, path.join(APPS_DIR, 'demo', 'index.html'), 'no-cache');
    }
    if (p.startsWith('/demo/')) { const abs = safeJoin(path.join(APPS_DIR, 'demo'), decodeURIComponent(p.slice('/demo/'.length))); return abs ? serveFile(req, res, abs, 'no-cache') : notFound(res); }

    const seg = p.split('/')[1];
    if (APPS[seg]) {
      const app = seg; const rest = p.slice(app.length + 1); // '' | '/' | '/login' | '/file'
      if (rest === '') return redirect(res, '/' + app + '/' + u.search, 301);
      if (rest === '/login' || rest === '/login/' || rest === '/login.html') {
        if (sessionAccount(req, app)) return redirect(res, '/' + app + '/');
        return serveFile(req, res, path.join(APPS_DIR, app, 'login.html'), 'no-cache');
      }
      if (rest === '/' || rest === '/index.html') { if (!appGate(req, res, u, app)) return; return serveFile(req, res, path.join(APPS_DIR, app, 'index.html'), 'no-cache'); }
      const abs = safeJoin(path.join(APPS_DIR, app), decodeURIComponent(rest.slice(1))); if (!abs) return notFound(res);
      return serveFile(req, res, abs, /\.json$/.test(abs) ? (u.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'no-cache') : 'no-cache');
    }
    return notFound(res);
  } catch (e) {
    const status = e.status || 500; if (status >= 500) console.error('[steady] ' + req.method + ' ' + p, e);
    if (p.startsWith('/api/')) return json(res, status, { error: status >= 500 ? 'Server error' : e.message });
    return send(res, status, 'Error', { 'Content-Type': 'text/plain' });
  }
});

server.listen(PORT, HOST, () => {
  const base = 'http://localhost:' + PORT;
  console.log('Steady v' + VERSION + ' listening on ' + base + (HOST !== '0.0.0.0' ? ' (' + HOST + ')' : ''));
  console.log('  Couch Surfer  ' + base + '/couchsurfer/   (sign in: ' + base + '/couchsurfer/login)');
  console.log('  Host          ' + base + '/host/          (sign in: ' + base + '/host/login)');
  console.log('  Dashboard     ' + base + '/dashboard/     (sign in: ' + base + '/dashboard/login)');
  console.log('  Data dir      ' + DATA_DIR + (seededNow ? '  (seeded fresh)' : '') + ' · rev ' + state.rev + ' · ' + accounts.length + ' accounts');
});
function shutdown() { try { stateFile.flush(); } catch (e) {} process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
