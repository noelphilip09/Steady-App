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
      var gbtn = document.getElementById('gbtn'); var gpick = document.getElementById('gpick');
      if (gbtn && gpick) {
        var STOCK = [
          { name: 'Taylor Morgan', email: 'taylor.morgan.demo@gmail.com', dob: '2004-09-12', av: 'av09' }, { name: 'Riley Chen', email: 'riley.chen.demo@gmail.com', dob: '2005-02-03', av: 'av10' },
          { name: 'Jess Patel', email: 'jess.patel.demo@gmail.com', dob: '2003-11-21', av: 'av11' }, { name: 'Noah Williams', email: 'noah.williams.demo@gmail.com', dob: '2006-04-18', av: 'av13' },
          { name: 'Ava Nguyen', email: 'ava.nguyen.demo@gmail.com', dob: '2004-07-30', av: 'av15' }, { name: 'Kai Thompson', email: 'kai.thompson.demo@gmail.com', dob: '2005-12-09', av: 'av16' }
        ];
        var stock = function (fresh) { var key = 'steady.google.stock'; try { if (!fresh) { var s = JSON.parse(localStorage.getItem(key) || 'null'); if (s && s.email) return s; } } catch (e) {} var p = STOCK[Math.floor(Math.random() * STOCK.length)]; try { localStorage.setItem(key, JSON.stringify(p)); } catch (e) {} return p; };
        var gtimer = null;
        var start = function (prof) {
          clearTimeout(gtimer); hide(); gpick.hidden = false; gbtn.setAttribute('aria-expanded', 'true');
          document.getElementById('gav').src = '/assets/img/' + prof.av + '.png'; document.getElementById('gname').textContent = prof.name; document.getElementById('gemail').textContent = prof.email; document.getElementById('gstatus').textContent = 'Signing you in\u2026';
          gtimer = setTimeout(function () {
            fetch('/api/' + app + '/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ provider: 'google', email: prof.email, name: prof.name, dob: prof.dob }) })
              .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
              .then(function (r) {
                if (!r.ok) { gpick.hidden = true; show(r.data.error || 'Sign-in failed'); return; }
                document.getElementById('gstatus').textContent = 'Welcome, ' + prof.name.split(' ')[0];
                var dest = (r.data.me && r.data.me.onboarded === false) ? '/' + app + '/?onboard=1' : next;
                document.documentElement.classList.add('leaving'); setTimeout(function () { location.href = dest; }, 300);
              })
              .catch(function () { gpick.hidden = true; show('Could not reach the server. Check your connection and try again.'); });
          }, 1400);
        };
        gbtn.addEventListener('click', function () { start(stock(false)); });
        var gother = document.getElementById('gother'); if (gother) gother.addEventListener('click', function () { start(stock(true)); });
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
