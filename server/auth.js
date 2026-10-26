'use strict';
/* Passwords (scrypt), per-app sessions in httpOnly cookies, and a small login rate limiter. */
const crypto = require('crypto');

const SESSION_DAYS = 30;

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(password, salt, hash) {
  try { const h = crypto.scryptSync(String(password), salt, 64); return crypto.timingSafeEqual(h, Buffer.from(hash, 'hex')); } catch (e) { return false; }
}

function parseCookies(req) {
  const out = {}; const raw = req.headers.cookie; if (!raw) return out;
  raw.split(';').forEach(part => { const i = part.indexOf('='); if (i < 0) return; const k = part.slice(0, i).trim(); const v = part.slice(i + 1).trim(); if (k) out[k] = decodeURIComponent(v); });
  return out;
}
function isSecure(req) {
  if (process.env.COOKIE_SECURE === '1') return true;
  if (process.env.COOKIE_SECURE === '0') return false;
  return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}
function setCookie(res, req, name, value, maxAgeSec) {
  const parts = [name + '=' + encodeURIComponent(value), 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAgeSec != null) parts.push('Max-Age=' + maxAgeSec);
  if (isSecure(req)) parts.push('Secure');
  const prev = res.getHeader('Set-Cookie'); const list = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  list.push(parts.join('; ')); res.setHeader('Set-Cookie', list);
}

class Sessions {
  constructor(file) { this.file = file; this.data = file.load() || { sessions: {} }; if (!this.data.sessions) this.data.sessions = {}; this.sweep(); }
  sweep() { const now = Date.now(); let n = 0; for (const t in this.data.sessions) { if (this.data.sessions[t].expiresAt < now) { delete this.data.sessions[t]; n++; } } if (n) this.file.save(this.data); }
  create(app, accountId) {
    const token = crypto.randomBytes(32).toString('hex'); const now = Date.now();
    this.data.sessions[token] = { app, accountId, createdAt: now, expiresAt: now + SESSION_DAYS * 864e5 };
    this.file.save(this.data); return token;
  }
  get(token, app) {
    const s = token && this.data.sessions[token]; if (!s) return null;
    if (s.expiresAt < Date.now() || s.app !== app) return null;
    return s;
  }
  destroy(token) { if (token && this.data.sessions[token]) { delete this.data.sessions[token]; this.file.save(this.data); } }
  destroyForAccount(accountId) { for (const t in this.data.sessions) if (this.data.sessions[t].accountId === accountId) delete this.data.sessions[t]; this.file.save(this.data); }
}

/* 10 attempts per 15 minutes per address+email */
class RateLimiter {
  constructor(max, windowMs) { this.max = max; this.windowMs = windowMs; this.hits = new Map(); }
  check(key) {
    const now = Date.now(); const h = this.hits.get(key);
    if (!h || now - h.first > this.windowMs) { this.hits.set(key, { first: now, count: 1 }); return true; }
    h.count++; if (this.hits.size > 5000) this.hits.clear();
    return h.count <= this.max;
  }
  reset(key) { this.hits.delete(key); }
}

module.exports = { hashPassword, verifyPassword, parseCookies, setCookie, Sessions, RateLimiter, SESSION_DAYS };
