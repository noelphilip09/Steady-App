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
