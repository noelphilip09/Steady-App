/* Steady sign-in pages: one per app, each talking to its own session on the server. */
(function (global) {
  'use strict';
  function safeNext(app, next) { if (!next) return '/' + app + '/'; if (next.indexOf('/' + app + '/') === 0 || (app === 'dashboard' && next.indexOf('/demo/') === 0)) return next; return '/' + app + '/'; }
  global.SteadyLogin = {
    init: function (cfg) {
      var app = cfg.app; var form = document.getElementById('login'); var err = document.getElementById('err'); var btn = form.querySelector('button[type=submit]');
      var params = new URLSearchParams(location.search); var next = safeNext(app, params.get('next'));
      if (params.get('signedout')) show('You have been signed out.', 'info');
      function show(msg, kind) { err.textContent = msg; err.className = 'note ' + (kind || 'red') + ' login-note show'; err.hidden = false; }
      function hide() { err.hidden = true; err.className = 'note login-note'; }
      document.querySelectorAll('[data-demo-email]').forEach(function (b) {
        b.addEventListener('click', function () { form.email.value = b.getAttribute('data-demo-email'); form.password.value = b.getAttribute('data-demo-password') || ''; form.password.focus(); hide(); });
      });
      var toggle = document.getElementById('togglepw'); if (toggle) toggle.addEventListener('click', function () { var p = form.password; p.type = p.type === 'password' ? 'text' : 'password'; toggle.textContent = p.type === 'password' ? 'Show' : 'Hide'; });
      var gbtn = document.getElementById('gbtn'); var gpick = document.getElementById('gpick'); var gchoose = document.getElementById('gchoose');
      if (gbtn && gpick) {
        // Simulated Google sign-in. Two demo profiles are offered: Sam, the walkthrough profile (every sign-out sends
        // the next sign-in back through onboarding), and Ava, a regular member. The choice is made before continuing.
        var profs = gchoose ? [].slice.call(gchoose.querySelectorAll('.gprof')) : []; var glabel = document.getElementById('gbtnLabel'); var KEY = 'steady.google.profile';
        var profOf = function (b) { return b ? { name: b.getAttribute('data-g-name'), email: b.getAttribute('data-g-email'), dob: b.getAttribute('data-g-dob') || '', av: b.getAttribute('data-g-av') || 'av01' } : null; };
        var selected = function () { return profOf(profs.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0]); };
        var select = function (b, focus) {
          profs.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = (!b || x === b) ? 0 : -1; });
          var p = profOf(b); if (glabel) glabel.textContent = p ? 'Continue with Google as ' + p.name.split(' ')[0] : 'Continue with Google';
          if (p) { try { localStorage.setItem(KEY, p.email); } catch (e) {} }
          if (focus && b) b.focus(); hide();
        };
        profs.forEach(function (b, i) {
          b.addEventListener('click', function () { select(b); });
          b.addEventListener('keydown', function (e) { var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0; if (!d) return; e.preventDefault(); select(profs[(i + d + profs.length) % profs.length], true); });
        });
        try { var last = localStorage.getItem(KEY); var remembered = profs.filter(function (b) { return b.getAttribute('data-g-email') === last; })[0]; if (remembered) select(remembered); } catch (e) {}
        var gtimer = null;
        var start = function (prof) {
          clearTimeout(gtimer); hide(); gpick.hidden = false; gbtn.setAttribute('aria-expanded', 'true'); gbtn.disabled = true; profs.forEach(function (b) { b.disabled = true; });
          var fail = function (msg) { gpick.hidden = true; gbtn.disabled = false; gbtn.setAttribute('aria-expanded', 'false'); profs.forEach(function (b) { b.disabled = false; }); show(msg); };
          document.getElementById('gav').src = '/assets/img/' + prof.av + '.png'; document.getElementById('gname').textContent = prof.name; document.getElementById('gemail').textContent = prof.email; document.getElementById('gstatus').textContent = 'Signing you in…';
          gtimer = setTimeout(function () {
            fetch('/api/' + app + '/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ provider: 'google', email: prof.email, name: prof.name, dob: prof.dob }) })
              .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
              .then(function (r) {
                if (!r.ok) { fail(r.data.error || 'Sign-in failed'); return; }
                document.getElementById('gstatus').textContent = 'Welcome, ' + prof.name.split(' ')[0];
                var dest = (r.data.me && r.data.me.onboarded === false) ? '/' + app + '/?onboard=1' : next;
                document.documentElement.classList.add('leaving'); setTimeout(function () { location.href = dest; }, 300);
              })
              .catch(function () { fail('Could not reach the server. Check your connection and try again.'); });
          }, 1400);
        };
        gbtn.addEventListener('click', function () {
          var p = selected();
          if (!p && profs.length) { show('Choose Sam or Ava first, then continue with Google.', 'info'); if (gchoose) { gchoose.classList.add('shake'); setTimeout(function () { gchoose.classList.remove('shake'); }, 500); } profs[0].focus(); return; }
          start(p);
        });
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault(); hide();
        var email = form.email.value.trim(); var password = form.password.value;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { show('Enter a valid email address.'); form.email.focus(); form.classList.add('shake'); setTimeout(function () { form.classList.remove('shake'); }, 500); return; }
        if (!password) { show('Enter your password.'); form.password.focus(); return; }
        btn.disabled = true; btn.classList.add('busy');
        fetch('/api/' + app + '/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email: email, password: password }) })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); })
          .then(function (r) {
            if (!r.ok) { btn.disabled = false; btn.classList.remove('busy'); show(r.data.error || 'Sign-in failed'); form.classList.add('shake'); setTimeout(function () { form.classList.remove('shake'); }, 500); return; }
            document.documentElement.classList.add('leaving'); setTimeout(function () { location.href = next; }, 220);
          })
          .catch(function () { btn.disabled = false; btn.classList.remove('busy'); show('Could not reach the server. Check your connection and try again.'); });
      });
    }
  };
})(typeof window !== 'undefined' ? window : this);
