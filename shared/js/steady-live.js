/* Steady live layer: real accounts and a shared, server-backed dataset for the Couch Surfer, Host and Dashboard apps.
   Loaded after core.js. It wraps makeSteadyCore so every app gets: sign-in aware state, server-backed registration
   inside the onboarding flows, live sync of the shared records over Server-Sent Events, and sign out. */
(function (global) {
  'use strict';
  var APPS = { cs: 'couchsurfer', host: 'host', gov: 'dashboard', bench: 'dashboard' };
  var Live = {
    app: null, mode: null, logic: null, clientId: Math.random().toString(36).slice(2) + Date.now().toString(36),
    rev: 0, es: null, lastDb: null, lastJson: {}, lastOffset: null, pushTimer: null, pushing: false, retry: 0, status: 'idle', guest: false, loginUrl: '/',
    configure: function (o) { this.app = o.app; this.mode = o.mode; this.loginUrl = o.loginUrl || ('/' + o.app + '/login'); this.appUrl = o.appUrl || ('/' + o.app + '/'); },
    api: function (method, path, body) {
      var opts = { method: method, headers: { 'Accept': 'application/json' }, credentials: 'same-origin' };
      if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      return fetch('/api/' + this.app + path, opts).then(function (r) {
        if (r.status === 204) return { ok: true, status: 204, data: null };
        return r.text().then(function (t) { var data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = { error: t }; } return { ok: r.ok, status: r.status, data: data }; });
      });
    },
    /* ---- attach after sign-in: remember what the server has, then listen for changes ---- */
    attach: function (logic, me, state) {
      var self = this; this.logic = logic; this.guest = false;
      this.rev = state.rev || 0; this.snapshot(state.db, state.dayOffset);
      this.setStatus('live'); this.listen();
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') self.resync(); });
      global.addEventListener('online', function () { self.resync(true); });
      if (!this.verifyTimer && typeof setInterval === 'function') this.verifyTimer = setInterval(function () { self.verify(); }, 45000);
    },
    snapshot: function (db, dayOffset) { var j = {}; for (var k in db) j[k] = JSON.stringify(db[k]); this.lastJson = j; this.lastDb = db; this.lastOffset = dayOffset == null ? 0 : dayOffset; },
    setStatus: function (s) { if (this.status === s) return; this.status = s; if (this.logic) this.logic.setState(function (st) { return { live: Object.assign({}, st.live || {}, { status: s }) }; }); },
    listen: function () {
      var self = this; if (this.es) { try { this.es.close(); } catch (e) {} }
      if (typeof EventSource === 'undefined') return;
      var es = new EventSource('/api/' + this.app + '/events'); this.es = es;
      es.addEventListener('hello', function (e) { var d = JSON.parse(e.data); if (d.rev !== self.rev) self.resync(true); self.setStatus('live'); });
      es.addEventListener('patch', function (e) { self.onPatch(JSON.parse(e.data)); });
      es.addEventListener('reset', function (e) { self.onReset(JSON.parse(e.data)); });
      es.addEventListener('presence', function (e) { var d = JSON.parse(e.data); if (self.logic) self.logic.setState(function (st) { return { live: Object.assign({}, st.live || {}, { clients: d.clients }) }; }); });
      es.onerror = function () { self.setStatus('reconnecting'); };
      es.onopen = function () { self.setStatus('live'); };
    },
    onPatch: function (msg) {
      var self = this; if (!this.logic) return;
      if (msg.rev != null) this.rev = msg.rev;
      if (msg.origin === this.clientId) return;
      var db = msg.db || {}; var keys = Object.keys(db);
      var prev = this.logic.state.db; var newNotifs = [];
      if (db.notifications) {
        var seen = {}; (prev.notifications || []).forEach(function (n) { seen[n.id] = 1; });
        db.notifications.forEach(function (n) { if (!seen[n.id] && self.isMine(n)) newNotifs.push(n); });
      }
      keys.forEach(function (k) { self.lastJson[k] = JSON.stringify(db[k]); });
      var hasOffset = msg.dayOffset != null && msg.dayOffset !== this.logic.state.dayOffset;
      if (hasOffset) this.lastOffset = msg.dayOffset;
      this.logic.setState(function (st) {
        var patch = { db: Object.assign({}, st.db, db) };
        if (hasOffset) patch.dayOffset = msg.dayOffset;
        return patch;
      });
      this.lastDb = null; // forces the next diff to compare by content
      newNotifs.slice(0, 2).forEach(function (n) { self.logic.toast('info', n.title + (n.text ? ': ' + n.text : '')); });
    },
    isMine: function (n) {
      var m = this.mode; if (m === 'bench') return false;
      if (m === 'cs') return n.to === 'cs' && (!n.forId || n.forId === this.logic.csId());
      if (m === 'host') return n.to === 'host' && (!n.forId || n.forId === this.logic.hostId());
      return false;
    },
    onReset: function (msg) {
      var self = this;
      this.api('GET', '/state').then(function (r) {
        if (!r.ok) return;
        self.rev = r.data.rev; self.snapshot(r.data.db, r.data.dayOffset);
        self.logic.animTargets = {}; self.logic.tw = {};
        self.logic.setState({ db: r.data.db, dayOffset: r.data.dayOffset || 0, modal: null });
        self.logic.toast('success', 'Demo data was reset to the seeded scenario');
      });
    },
    resync: function (force) {
      var self = this; if (!this.logic || this.guest) return;
      var now = Date.now(); if (!force && now - (this.lastResync || 0) < 8000) return; this.lastResync = now;
      this.api('GET', '/state').then(function (r) {
        if (r.status === 401) { self.toLogin(); return; }
        if (!r.ok) return;
        if (r.data.rev === self.rev) { self.setStatus('live'); return; }
        self.rev = r.data.rev; self.snapshot(r.data.db, r.data.dayOffset);
        self.logic.setState({ db: r.data.db, dayOffset: r.data.dayOffset || 0 }); self.setStatus('live');
      }).catch(function () { self.setStatus('offline'); });
    },
    /* ---- periodic consistency check: if the server's copy differs from what this client believes it has, take the server's ---- */
    verify: function () {
      var self = this; if (!this.logic || this.guest || this.pushing || this.pushTimer) return;
      this.api('GET', '/state').then(function (r) {
        if (!r.ok || !self.logic) return; var db = r.data.db; var drift = []; var patch = {};
        for (var k in db) { var j = JSON.stringify(db[k]); if (j !== self.lastJson[k]) { drift.push(k); patch[k] = db[k]; self.lastJson[k] = j; } }
        self.rev = r.data.rev;
        if (!drift.length) return;
        console.warn('Steady: local copy drifted from the server for ' + drift.join(', ') + '; taking the server\u2019s version');
        self.logic.setState(function (st) { return { db: Object.assign({}, st.db, patch), dayOffset: r.data.dayOffset || 0 }; }); self.lastDb = null; self.lastOffset = r.data.dayOffset || 0;
      }).catch(function () {});
    },
    /* ---- push local changes: only the top-level collections whose content actually changed ---- */
    schedulePush: function () { var self = this; if (this.guest || !this.logic) return; clearTimeout(this.pushTimer); this.pushTimer = setTimeout(function () { self.push(); }, 120); },
    push: function () {
      var self = this; if (this.pushing || this.guest || !this.logic) { if (this.pushing) this.schedulePush(); return; }
      var st = this.logic.state; var db = st.db; var patch = {}; var any = false;
      for (var k in db) {
        if (this.lastDb && this.lastDb[k] === db[k]) continue;
        var j = JSON.stringify(db[k]);
        if (j !== this.lastJson[k]) { patch[k] = db[k]; this.lastJson[k] = j; any = true; }
      }
      this.lastDb = db;
      var body = { clientId: this.clientId, rev: this.rev };
      if (any) body.db = patch;
      if (st.dayOffset !== this.lastOffset) { body.dayOffset = st.dayOffset; this.lastOffset = st.dayOffset; any = true; }
      if (!any) return;
      this.pushing = true; this.setStatus('syncing');
      this.api('PATCH', '/state', body).then(function (r) {
        self.pushing = false;
        if (r.status === 401) { self.toLogin(); return; }
        if (!r.ok) throw new Error(r.data && r.data.error || 'sync failed');
        self.rev = r.data.rev; self.retry = 0; self.setStatus('live');
      }).catch(function () {
        self.pushing = false; self.setStatus('offline');
        // undo the optimistic bookkeeping so the same keys are retried
        Object.keys(patch).forEach(function (k) { delete self.lastJson[k]; }); self.lastDb = null;
        var wait = Math.min(15000, 800 * Math.pow(2, self.retry++));
        setTimeout(function () { self.schedulePush(); }, wait);
      });
    },
    toLogin: function () { var next = location.pathname + location.search; location.href = this.loginUrl + '?next=' + encodeURIComponent(next); },
    /* ---- accounts ---- */
    register: function (payload) { return this.api('POST', '/register', payload); },
    afterAuth: function (logic, me) {
      var self = this;
      return this.api('GET', '/state').then(function (r) {
        if (!r.ok) throw new Error('Could not load the shared data');
        logic.setState({ me: me, db: r.data.db, dayOffset: r.data.dayOffset || 0 });
        self.attach(logic, me, r.data);
        return me;
      });
    },
    signOut: function () { var self = this; this.api('POST', '/logout').then(function () { try { sessionStorage.removeItem('steady.' + self.app + '.ui'); } catch (e) {} location.href = self.loginUrl; }); }
  };
  global.SteadyLive = Live;

  /* ---------- core patches ---------- */
  var _make = global.makeSteadyCore;
  global.makeSteadyCore = function (DCLogic) {
    var Core = _make(DCLogic); var P = Core.prototype;

    var _fresh = P.freshState;
    P.freshState = function (today) { var s = _fresh.call(this, today); s.me = null; s.live = { status: 'idle' }; return s; };

    P.isGuest = function () { return !this.state.me; };
    P.meEmail = function () { return (this.state.me && this.state.me.email) || ''; };
    P.signOut = function () { Live.signOut(); };
    P.goLogin = function () { location.href = Live.loginUrl; };

    /* values available to every template */
    var _rvCommon = P.rvCommon;
    P.rvCommon = function () {
      var out = _rvCommon.call(this); var me = this.state.me; var live = this.state.live || {}; var st = live.status || 'idle';
      out.meEmail = me ? me.email : ''; out.meName = me ? me.name : ''; out.isGuest = !me; out.signOut = function () { Live.signOut(); };
      out.liveStatus = st === 'live' ? 'Live' : st === 'syncing' ? 'Saving…' : st === 'reconnecting' ? 'Reconnecting…' : st === 'offline' ? 'Offline' : me ? 'Connecting…' : 'Not signed in';
      out.liveCls = st; out.liveBadgeCls = st === 'live' ? 'verified' : st === 'syncing' ? 'info' : st === 'idle' ? 'neutral' : 'review';
      out.gCanSwitchRole = !!(me && me.role === 'admin'); out.gLoadingCls = this.state.gov && this.state.gov.loading ? 'loading' : '';
      return out;
    };

    /* persist the current screen per app so a refresh lands where you were */
    var _didUpdate = P.componentDidUpdate;
    P.componentDidUpdate = function (pp, ps) {
      if (_didUpdate) _didUpdate.call(this, pp, ps);
      var s = this.state;
      if (ps.db !== s.db || ps.dayOffset !== s.dayOffset) Live.schedulePush();
      try {
        var key = 'steady.' + Live.app + '.ui'; var ui = Live.mode === 'cs' ? s.cs : Live.mode === 'host' ? s.host : s.gov; var pui = Live.mode === 'cs' ? ps.cs : Live.mode === 'host' ? ps.host : ps.gov;
        if (ui && pui && ui.screen !== pui.screen && Live.mode !== 'bench') sessionStorage.setItem(key, JSON.stringify({ screen: ui.screen }));
      } catch (e) {}
    };

    /* ---- registration inside the designed onboarding flows ---- */
    function regError(r) { return (r && r.data && r.data.error) || 'Could not create the account. Please try again.'; }
    var _obNext = P.obNext;
    P.obNext = function () {
      var self = this; var step = this.state.cs.obStep;
      if (step !== 2 || !this.isGuest() || Live.mode !== 'cs') return _obNext.call(this);
      var v = this.obValidate(2); if (v.err) { this.setCs({ obErr: v.err, obInvalid: v.inv }); this.toast('error', v.err); return; }
      if (this.state.busy) return; this.setState({ busy: 'obNext' });
      var f = this.state.forms;
      Live.register({ email: f.ob_email.trim(), password: f.ob_password }).then(function (r) {
        if (!r.ok) { self.setState({ busy: null }); var msg = regError(r); self.setCs({ obErr: msg, obInvalid: { ob_email: 1 } }); self.toast('error', msg); return; }
        return Live.afterAuth(self, r.data.me).then(function () { self.setState({ busy: null }); self.setCs({ obStep: 3, obErr: '', obInvalid: {} }); self.toast('success', 'Account created. You are signed in.'); });
      }).catch(function (e) { self.setState({ busy: null }); self.toast('error', e.message || 'Something went wrong'); });
    };
    var _obBack = P.obBack;
    P.obBack = function () { var step = this.state.cs.obStep; if (step === 0) { if (this.isGuest()) this.goLogin(); else this.setCs({ screen: 'more' }); return; } return _obBack.call(this); };
    var _obProvider = P.obProvider;
    P.obProvider = function () {
      var self = this; if (!this.isGuest() || Live.mode !== 'cs') return _obProvider.call(this);
      if (this.state.busy) return; this.setState({ busy: 'obNext' });
      var email = 'provider-' + Math.random().toString(36).slice(2, 8) + '@steady.demo'; var pw = 'provider-' + Math.random().toString(36).slice(2, 12);
      Live.register({ email: email, password: pw, name: 'New member' }).then(function (r) {
        if (!r.ok) { self.setState({ busy: null }); self.toast('error', regError(r)); return; }
        self.setForms({ ob_email: email, ob_password: pw });
        return Live.afterAuth(self, r.data.me).then(function () { self.setState({ busy: null }); self.setCs({ obStep: 3, obErr: '' }); self.toast('info', 'Signed in with a demo provider. No real account was used.'); });
      }).catch(function (e) { self.setState({ busy: null }); self.toast('error', e.message || 'Something went wrong'); });
    };
    var _obFinish = P.obFinish;
    P.obFinish = function () {
      var r = _obFinish.apply(this, arguments); var f = this.state.forms; var name = (f.ob_legalname || f.ob_prefname || '').trim(); var self = this;
      if (name) this.setDb(function (db) { var pid = self.csId(); db.participants = db.participants.map(function (p) { return p.id === pid ? Object.assign({}, p, { name: name }) : p; }); });
      if (!this.isGuest() && name) Live.api('PATCH', '/me', { name: name }).then(function (res) { if (res.ok && global.SteadySite.logic) global.SteadySite.logic.setState({ me: res.data.me }); });
      return r;
    };

    var _hobNext = P.hobNext;
    P.hobNext = function () {
      var self = this; var step = this.state.host.obStep;
      if (step !== 1 || !this.isGuest() || Live.mode !== 'host') return _hobNext.call(this);
      var v = this.hobValidate(1); if (v.err) { this.setHost({ obErr: v.err, obInvalid: v.inv }); this.toast('error', v.err); return; }
      if (this.state.busy) return; this.setState({ busy: 'hobNext' });
      var f = this.state.forms;
      Live.register({ email: f.hob_email.trim(), password: f.hob_password, name: f.hob_name.trim(), phone: f.hob_phone.trim() }).then(function (r) {
        if (!r.ok) { self.setState({ busy: null }); var msg = regError(r); self.setHost({ obErr: msg, obInvalid: { hob_email: 1 } }); self.toast('error', msg); return; }
        return Live.afterAuth(self, r.data.me).then(function () { self.setState({ busy: null }); self.setHost({ obStep: 2, obErr: '', obInvalid: {} }); self.toast('success', 'Host account created. You are signed in.'); });
      }).catch(function (e) { self.setState({ busy: null }); self.toast('error', e.message || 'Something went wrong'); });
    };
    var _hobBack = P.hobBack;
    P.hobBack = function () { var step = this.state.host.obStep; if (step === 0) { if (this.isGuest()) this.goLogin(); else this.setHost({ screen: 'more' }); return; } return _hobBack.call(this); };
    var _hobFinish = P.hobFinish;
    P.hobFinish = function () {
      var self = this; var r = _hobFinish.apply(this, arguments); var name = (this.state.forms.hob_name || '').trim();
      this.setDb(function (db) { var hid = self.hostId(); db.hosts = db.hosts.map(function (h) { return h.id === hid ? Object.assign({}, h, { status: 'approved' }) : h; }); });
      if (!this.isGuest() && name) Live.api('PATCH', '/me', { name: name }).then(function (res) { if (res.ok && global.SteadySite.logic) global.SteadySite.logic.setState({ me: res.data.me }); });
      return r;
    };

    /* ---- dashboard: the role comes from the account; administrators may view as another role ---- */
    var _gSetRole = P.gSetRole;
    P.gSetRole = function (role) { var me = this.state.me; if (me && me.role !== 'admin') { this.toast('info', 'Your access level is set by the program administrator.'); return; } return _gSetRole.call(this, role); };

    /* ---- resetting the shared demo data goes through the server so every app follows ---- */
    P.askReset = function () {
      var self = this;
      this.confirm('Reset demo data?', 'This restores the seeded demo dataset for every app and account on this server, and clears everything anyone changed. Accounts you created are kept.', 'Reset demo data', function () {
        if (self.isGuest()) { var today = Core.helpers.isoOf(new Date()); var fresh = self.freshState(today); fresh.role = self.state.role; self.setState(fresh); return; }
        Live.api('POST', '/state/reset').then(function (r) { if (!r.ok) self.toast('error', (r.data && r.data.error) || 'Reset failed'); });
      }, true);
    };

    return Core;
  };
})(typeof window !== 'undefined' ? window : this);
