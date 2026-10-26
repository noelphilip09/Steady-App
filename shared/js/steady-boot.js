/* Steady app boot: paints the skeleton first, then loads the runtime, the app template and the signed-in
   account's shared data in parallel, and only then mounts. Also handles guest onboarding and screen restore. */
(function (global) {
  'use strict';
  var SCREENS = {
    cs: ['home', 'find', 'listing', 'request', 'status', 'stay', 'checkout', 'feedback', 'passport', 'budget', 'payments', 'pathways', 'help', 'sos', 'report', 'notifications', 'more', 'profile'],
    host: ['dashboard', 'listings', 'listingEdit', 'requests', 'stays', 'tasks', 'issues', 'feedback', 'subsidy', 'notifications', 'profile', 'more'],
    gov: ['overview', 'geo', 'finance', 'outcomes', 'planning', 'reports', 'settings', 'audit']
  };
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = res; s.onerror = function () { rej(new Error('Failed to load ' + src)); }; document.head.appendChild(s); });
  }
  function getJson(url, opts) {
    return fetch(url, Object.assign({ credentials: 'same-origin', headers: { 'Accept': 'application/json' } }, opts || {})).then(function (r) {
      if (r.status === 401) return { status: 401, data: null };
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return r.json().then(function (d) { return { status: r.status, data: d }; });
    });
  }
  function fail(msg) {
    var sk = document.getElementById('skeleton'); if (!sk) return;
    sk.innerHTML = '<div class="boot-error"><div class="h3">Steady could not start</div><p class="small">' + msg + '</p><button class="btn primary" onclick="location.reload()">Try again</button></div>';
  }
  function minDelay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  global.SteadyBoot = {
    start: function (cfg) {
      var app = cfg.app, mode = cfg.mode; var t0 = performance.now();
      var params = new URLSearchParams(location.search); var wantsOnboard = params.has('onboard');
      var loginUrl = '/' + app + '/login';
      global.SteadyLive && global.SteadyLive.configure({ app: app, mode: mode, loginUrl: loginUrl });

      var scripts = loadScript('/assets/js/preact.min.js?v=' + cfg.v).then(function () { return loadScript('/assets/js/core.js?v=' + cfg.v); }).then(function () { return loadScript('/assets/js/runtime.js?v=' + cfg.v); }).then(function () { return loadScript('/assets/js/steady-live.js?v=' + cfg.v); });
      var template = fetch(cfg.template + '?v=' + cfg.v, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('template ' + r.status); return r.json(); });
      var session = getJson('/api/' + app + '/me').then(function (r) {
        if (r.status === 401 || !r.data || !r.data.me) {
          if (wantsOnboard && (mode === 'cs' || mode === 'host')) return { me: null, state: null };
          location.replace(loginUrl + '?next=' + encodeURIComponent(location.pathname + location.search)); return new Promise(function () {});
        }
        return getJson('/api/' + app + '/state').then(function (s) { if (s.status === 401) { location.replace(loginUrl); return new Promise(function () {}); } return { me: r.data.me, state: s.data }; });
      });

      Promise.all([scripts, template, session, minDelay(cfg.minSkeletonMs || 350)]).then(function (res) {
        var tpl = res[1], sess = res[2]; var me = sess.me, state = sess.state;
        global.SteadyLive.configure({ app: app, mode: mode, loginUrl: loginUrl });
        var saved = null; try { saved = JSON.parse(sessionStorage.getItem('steady.' + app + '.ui') || 'null'); } catch (e) {}
        var logic = global.SteadySite.mount({
          mode: mode, template: tpl, root: '#app',
          init: function (L) {
            var s = L.state;
            if (me) { s.me = me; s.db = state.db; s.dayOffset = state.dayOffset || 0; L.animTargets = {}; }
            if (mode === 'cs') {
              s.cs = Object.assign({}, s.cs, { screen: (!me || wantsOnboard) ? 'onboard' : (saved && SCREENS.cs.indexOf(saved.screen) >= 0 ? saved.screen : 'home'), obStep: 0, idv: 'idle', obErr: '', obInvalid: {} });
              s.role = 'cs';
            } else if (mode === 'host') {
              s.host = Object.assign({}, s.host, { screen: (!me || wantsOnboard) ? 'onboard' : (saved && SCREENS.host.indexOf(saved.screen) >= 0 ? saved.screen : 'dashboard'), obStep: 0, idv: 'idle', obErr: '', obInvalid: {}, reqSel: null });
              s.role = 'host';
            } else if (mode === 'gov') {
              s.gov = Object.assign({}, s.gov, { role: (me && me.role) || 'viewer', screen: saved && SCREENS.gov.indexOf(saved.screen) >= 0 ? saved.screen : 'overview' });
              s.role = 'gov';
            } else { s.role = 'bench'; }
            if (me) s.live = { status: 'connecting' };
          },
          onMounted: function (L) {
            if (me) global.SteadyLive.attach(L, me, state); else global.SteadyLive.guest = true, global.SteadyLive.logic = L;
            if (wantsOnboard) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
            document.documentElement.classList.add('app-ready');
            var sk = document.getElementById('skeleton'); if (sk) setTimeout(function () { sk.remove(); }, 600);
            if (cfg.debug) console.info('Steady ' + app + ' ready in ' + Math.round(performance.now() - t0) + 'ms');
          },
          onError: function (e) { fail('A screen failed to render: ' + (e && e.message)); }
        });
        return logic;
      }).catch(function (e) { console.error(e); fail((e && e.message) || 'Unknown error'); });
    }
  };
})(typeof window !== 'undefined' ? window : this);
