/* Steady Couch Surfer flow layer: identity verification with a selfie inside onboarding, a simulated Google
   account, the 24-hour first-week payment window after a host accepts, automatic host acceptance with a
   "what happens next" summary, and a direct chat with the host. Loaded after cs-journey.js. */
(function (global) {
  'use strict';
  var _make = global.makeSteadyCore;
  global.makeSteadyCore = function (DCLogic) {
    var Core = _make(DCLogic); var P = Core.prototype; var H = Core.helpers; var Live = global.SteadyLive;
    var IMG = H.IMG, money = H.money, fmtDate = H.fmtDate, fmtShort = H.fmtShort, fmtDT = H.fmtDT, uid = H.uid, byId = H.byId, upd = H.upd, clamp = H.clamp, avatarOf = H.avatarOf;
    var pic = function (n) { return (n && IMG[n]) || ('/assets/img/' + n + '.png'); };
    var HOUR = 36e5, PAY_WINDOW = 24 * HOUR;
    var STOCK = [
      { name: 'Taylor Morgan', email: 'taylor.morgan.demo@gmail.com', dob: '2004-09-12', av: 'av09' }, { name: 'Riley Chen', email: 'riley.chen.demo@gmail.com', dob: '2005-02-03', av: 'av10' },
      { name: 'Jess Patel', email: 'jess.patel.demo@gmail.com', dob: '2003-11-21', av: 'av11' }, { name: 'Noah Williams', email: 'noah.williams.demo@gmail.com', dob: '2006-04-18', av: 'av13' },
      { name: 'Ava Nguyen', email: 'ava.nguyen.demo@gmail.com', dob: '2004-07-30', av: 'av15' }, { name: 'Kai Thompson', email: 'kai.thompson.demo@gmail.com', dob: '2005-12-09', av: 'av16' }
    ];
    var METHODS = [
      { id: 'digital', label: 'Digital ID', sub: 'Verify through a connected digital identity provider. About a minute.', img: 'obj_shield' },
      { id: 'scan', label: 'Scan an ID document', sub: 'Driver licence, passport or photo card, with your camera.', img: 'obj_passport' },
      { id: 'support', label: 'A support worker verifies me', sub: 'If digital verification isn’t accessible for you.', img: 'ill_support' }
    ];
    var PORTRAITS = ['por_beanie', 'por_hat', 'por_guitar', 'por_cat', 'por_garden'];
    function stockProfile(fresh) {
      var key = 'steady.google.stock';
      try { if (!fresh && typeof localStorage !== 'undefined') { var s = JSON.parse(localStorage.getItem(key) || 'null'); if (s && s.email) return s; } } catch (e) {}
      var p = STOCK[Math.floor(Math.random() * STOCK.length)];
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(p)); } catch (e) {}
      return p;
    }
    function fmtLeft(ms) { ms = Math.max(0, ms); var h = Math.floor(ms / HOUR), m = Math.floor((ms % HOUR) / 60000), s = Math.floor((ms % 60000) / 1000); var pad = function (n) { return (n < 10 ? '0' : '') + n; }; return pad(h) + ':' + pad(m) + ':' + pad(s); }
    function portraitFor(id) { var n = 0; String(id).split('').forEach(function (c) { n += c.charCodeAt(0); }); return PORTRAITS[n % PORTRAITS.length]; }

    /* ---------- state ---------- */
    var _fresh = P.freshState;
    P.freshState = function (today) { var s = _fresh.call(this, today); s.cs = Object.assign({}, s.cs, { payTick: 0, chatTyping: false, gsign: null }); s.forms = Object.assign({}, s.forms, { chat_text: '' }); return s; };
    var _toast = P.toast;
    P.toast = function () { if (this._muteToast) return; return _toast.apply(this, arguments); };

    /* ---------- onboarding: verification step (ID + selfie) ---------- */
    P.ob2Steps = function () { var o = this.state.cs.ob2 || {}; return ['account', 'phone'].concat(o.method === 'email' ? ['about'] : []).concat(['verify', 'situation', 'emergency', 'areas', 'education']); };
    P.ob2PickMethod = function (id) { this.setOb2({ idMethod: id }); this.setCs({ obErr: '' }); };
    P.ob2DigitalId = function () { var self = this; if (this.state.cs.idv === 'pending') return; this.setCs({ idv: 'pending', obErr: '' }); this.later(function () { self.setCs({ idv: 'verified' }); self.setOb2({ docDone: true }); self.toast('success', 'Identity confirmed by the digital ID provider (simulated).'); }, 1800); };
    P.ob2ScanId = function () { this.setCs({ idv: 'idle', obErr: '' }); this.openScan('cs'); };
    P.ob2AskSupport = function () { this.setCs({ idv: 'referred', obErr: '' }); this.setOb2({ idMethod: 'support' }); this.notify('cs', 'Support worker verification requested', 'A support worker will confirm your identity with you. Nothing else is needed from you now.', 'home'); this.toast('success', 'We’ll ask a support worker to verify you. You can keep going.'); };
    var _scanVerifyAfter = P.scanVerifyAfter;
    P.scanVerifyAfter = function (who, viaScan) { var self = this; _scanVerifyAfter.call(this, who, viaScan); if (who === 'cs') this.later(function () { if (self.state.cs.idv === 'verified' && self.state.cs.screen === 'onboard') self.setOb2({ docDone: true }); }, 1900); };
    P.ob2Selfie = function () { var seq = (this._selfieSeq = (this._selfieSeq || 0) + 1); this.setOb2({ selfieState: 'search', selfieSeq: seq }); this.setState({ modal: { kind: 'selfie', title: 'Quick selfie', sub: 'We match it to your ID. Never shown to hosts; deleted after the check.' } }); this.selfieTick(seq); };
    P.selfieAlive = function (seq) { var m = this.state.modal; return !!(m && m.kind === 'selfie' && (this.state.cs.ob2 || {}).selfieSeq === seq); };
    P.selfieTick = function (seq) { var self = this; this.later(function () { if (!self.selfieAlive(seq)) return; self.setOb2({ selfieState: 'found' }); self.later(function () { if (!self.selfieAlive(seq)) return; self.setOb2({ selfieState: 'done' }); }, 1600); }, 1300); };
    P.selfieRetake = function () { var seq = (this._selfieSeq = (this._selfieSeq || 0) + 1); this.setOb2({ selfieState: 'search', selfieSeq: seq }); this.selfieTick(seq); };
    P.selfieUse = function () { var o = this.state.cs.ob2 || {}; if (o.selfieState !== 'done') return; this.setOb2({ selfieDone: true }); this.setState({ modal: null }); if (this.state.cs.idv !== 'verified' && this.state.cs.idv !== 'referred') this.setCs({ idv: 'verified' }); this.toast('success', 'Selfie matched your ID. You’re verified.'); };
    P.selfieToggleUse = function () { var o = this.state.cs.ob2 || {}; this.setOb2({ useAsPhoto: o.useAsPhoto === false }); };
    var _ob2Next = P.ob2Next;
    P.ob2Next = function () {
      if (this.ob2Key() === 'verify') {
        var o = this.state.cs.ob2 || {}; var idv = this.state.cs.idv;
        var ok = idv === 'referred' || (!!o.docDone && !!o.selfieDone);
        if (!ok) { this.ob2Err(o.docDone ? 'Take a quick selfie to finish verification.' : 'Verify your ID first, or ask a support worker to verify you.'); return; }
        this.ob2Go(this.state.cs.obStep + 1); return;
      }
      return _ob2Next.call(this);
    };
    var _ob2Finish = P.ob2Finish;
    P.ob2Finish = function () {
      var o = this.state.cs.ob2 || {}; var idv = this.state.cs.idv; var r = _ob2Finish.apply(this, arguments);
      if (this.state.busy !== 'obNext') return r;
      if (o.docDone && o.selfieDone) { var patch = { idStatus: 'verified', idVerifiedAt: this.nowMs() }; if (o.useAsPhoto !== false) patch.avatarSrc = pic(portraitFor(this.csId())); this.updateMe(patch); }
      else if (idv === 'referred') this.updateMe({ idStatus: 'support' });
      return r;
    };

    /* ---------- Google sign-in with a simulated (stock) account ---------- */
    var _ob2Google = P.ob2Google;
    P.ob2Google = function () {
      var self = this; if (!this.isGuest()) return _ob2Google.call(this);
      var prof = stockProfile(false);
      this.setState({ modal: { kind: 'gsign', title: 'Sign in with Google', sub: 'Demo: a simulated Google account. Nothing is sent to Google.' }, cs: Object.assign({}, this.state.cs, { gsign: { name: prof.name, email: prof.email, dob: prof.dob, av: pic(prof.av), status: 'Signing you in…' } }) });
      this.later(function () { var g = self.state.cs.gsign; var m = self.state.modal; if (!g || !m || m.kind !== 'gsign') return; self.ob2GooglePick({ name: g.name, email: g.email, dob: g.dob }); }, 1500);
    };
    P.gsignSwitch = function () { var prof = stockProfile(true); this.setCs({ gsign: null }); this.setState({ modal: null }); this.toast('info', 'Switched to ' + prof.name + '. Tap Continue with Google again.'); };

    /* ---------- first-week payment window ---------- */
    P.firstPayment = function (st) { return (this.state.db.payments || []).find(function (p) { return p.stayId === st.id && p.kind === 'first-week'; }) || null; };
    P.payState = function () {
      var st = this.currentStay(); if (!st || st.status !== 'awaiting_agreement') return null;
      var paid = this.firstPayment(st); var due = (st.hostAgreedAt || st.confirmedAt || this.nowMs()) + PAY_WINDOW; var left = due - this.nowMs();
      return { stay: st, paid: !!paid, payment: paid, due: due, left: left, expired: !paid && left <= 0, pct: clamp(Math.round((PAY_WINDOW - Math.max(0, left)) / PAY_WINDOW * 100), 0, 100) };
    };
    P.openPay = function () { var ps = this.payState(); if (!ps) return; if (ps.paid) { this.toast('info', 'Your first week is already paid.'); return; } this.setState({ modal: { kind: 'pay', title: 'Pay your first week', sub: 'This secures the room. A$30 is Steady’s service fee; A$20 goes straight into your savings.' } }); };
    P.payFirstWeek = function () {
      var self = this; var ps = this.payState(); if (!ps || ps.paid) return; var me = this.participant();
      if (!me.paymentMethod) { this.toast('info', 'Add a card first (any 16 digits work in the demo).'); this.openPayMethod(); return; }
      if (ps.expired) { this.toast('error', 'The 24-hour window has passed.'); return; }
      this.run('pay', 1200, function () {
        var at = self.nowMs(); var st = ps.stay; var l = self.listingOf(st.listingId); var a = self.state.db.assumptions; var pid = self.csId();
        self.setDb(function (db) {
          db.payments = (db.payments || []).concat([{ id: uid('pay'), participantId: pid, stayId: st.id, requestId: st.requestId, kind: 'first-week', amount: a.stayFeeWeek || 50, service: a.contributionService || 30, savings: a.contributionSavings || 20, at: at, method: me.paymentMethod.brand + ' •••• ' + me.paymentMethod.last4, receiptNo: 'FW-' + String(at).slice(-6) }]);
          db.stays = upd(db.stays, st.id, { firstPaymentAt: at });
          db.audit = [{ id: uid('au'), at: at, actor: 'Participant', action: 'First week paid', detail: money(a.stayFeeWeek || 50, true) + ' for ' + l.title + ' (A$30 service, A$20 savings); simulated card charge' }].concat(db.audit);
        });
        self.setState({ modal: null });
        self.notifyTo('host', st.hostId, 'First week paid', self.csName() + ' paid the first weekly contribution for ' + l.title + '. Awaiting their agreement confirmation.', 'stays');
        self.toast('success', 'Paid. A$20 is already in your savings. Now confirm the agreement.');
      });
    };
    var _savePayMethod = P.savePayMethod;
    P.reopenPayWhenFree = function (tries) { var self = this; var ps = this.payState(); if (!ps || ps.paid || !this.participant().paymentMethod) return; if (this.state.modal) { if (tries > 0) this.later(function () { self.reopenPayWhenFree(tries - 1); }, 400); return; } this.openPay(); };
    P.savePayMethod = function () { var self = this; var r = _savePayMethod.apply(this, arguments); this.later(function () { self.reopenPayWhenFree(6); }, 1300); return r; };
    var _openAgreement = P.openAgreement;
    P.openAgreement = function () { var ps = this.mode() === 'cs' ? this.payState() : null; if (ps && !ps.paid) { this.toast('info', 'Pay the first week to unlock the agreement.'); this.openPay(); return; } return _openAgreement.apply(this, arguments); };
    var _csConfirmAgreement = P.csConfirmAgreement;
    P.csConfirmAgreement = function () { var ps = this.mode() === 'cs' ? this.payState() : null; if (ps && !ps.paid) { this.toast('info', 'Pay the first week first.'); this.openPay(); return; } return _csConfirmAgreement.apply(this, arguments); };
    P.expireUnpaid = function (st) {
      var at = this.nowMs(); var l = this.listingOf(st.listingId);
      this.setDb(function (db) {
        db.stays = upd(db.stays, st.id, { status: 'expired', expiredAt: at });
        db.requests = upd(db.requests, st.requestId, { status: 'expired', history: (byId(db.requests, st.requestId) || { history: [] }).history.concat([{ label: 'Released: first week not paid within 24 hours', when: fmtDT(at), cls: 'warn' }]) });
        db.audit = [{ id: uid('au'), at: at, actor: 'System', action: 'Booking released', detail: 'First weekly contribution not paid within 24 hours of acceptance: ' + l.title }].concat(db.audit);
      });
      this.notify('cs', 'Booking released', 'The 24-hour payment window for ' + l.title + ' passed, so the room was released. You can request again any time.', 'home');
      this.notifyTo('host', st.hostId, 'Booking released', 'The guest did not pay the first week within 24 hours; the room is available again.', 'requests');
      this.toast('info', 'Booking released: the payment window passed.');
    };
    var _didMount = P.componentDidMount;
    P.componentDidMount = function () { var self = this; if (_didMount) _didMount.call(this); if (this.mode() === 'cs' && typeof setInterval === 'function') this._payTimer = setInterval(function () { var ps = self.payState(); if (!ps || ps.paid) return; if (ps.expired) { if (!ps.stay.expiredAt) self.expireUnpaid(ps.stay); return; } self.setState({ cs: Object.assign({}, self.state.cs, { payTick: Date.now() }) }); }, 1000); };
    var _unmount = P.componentWillUnmount;
    P.componentWillUnmount = function () { if (this._payTimer) clearInterval(this._payTimer); if (_unmount) _unmount.call(this); };

    /* contributions include the first week paid upfront */
    P.contributions = function () {
      var pid = this.csId(); var db = this.state.db; var a = db.assumptions; var svc = a.contributionService || 30, sav = a.contributionSavings || 20; var self = this;
      var pays = (db.payments || []).filter(function (p) { return p.participantId === pid && p.kind === 'first-week'; }); var prepaid = {}; pays.forEach(function (p) { prepaid[p.stayId] = p; });
      var rows = db.stayFeeLedger.filter(function (e) { return e.participantId === pid && !e.duplicate && e.status !== 'refunded' && !(e.weekNo === 1 && prepaid[e.stayId]); });
      var list = rows.map(function (e) { var credited = e.status === 'paid' || e.status === 'late'; var st = db.stays.find(function (s) { return s.id === e.stayId; }); var l = st ? self.listingOf(st.listingId) : null; return { id: e.id, stayId: e.stayId, weekNo: e.weekNo, date: e.dueDate, at: H.parseIso(e.dueDate).getTime(), stay: l ? l.title : 'Stay', credited: credited, status: credited ? 'Paid' : (e.status === 'scheduled' ? 'Upcoming' : 'Processing'), cls: credited ? 'verified' : 'pending', amount: e.amount, svc: svc, sav: sav }; });
      pays.forEach(function (p) { var st = db.stays.find(function (s) { return s.id === p.stayId; }); var l = st ? self.listingOf(st.listingId) : null; list.push({ id: p.id, stayId: p.stayId, weekNo: 1, date: H.isoOf(new Date(p.at)), at: p.at, stay: l ? l.title : 'Stay', credited: true, status: 'Paid upfront', cls: 'verified', amount: p.amount, svc: p.service, sav: p.savings }); });
      list.sort(function (x, y) { return y.at - x.at; });
      var credited = list.filter(function (x) { return x.credited; });
      var tx = (db.savingsTx || []).filter(function (t) { return t.participantId === pid; }).sort(function (x, y) { return y.at - x.at; });
      var out = H.sum(tx.filter(function (t) { return (t.kind === 'redeem' && t.status === 'paid') || (t.kind === 'emergency' && t.status === 'approved'); }), function (t) { return t.amount; });
      var pending = H.sum(tx.filter(function (t) { return t.status === 'requested'; }), function (t) { return t.amount; });
      var total = H.sum(credited, function (x) { return x.sav; });
      return { list: list, credited: credited.length, weeks: list.length, total: total, service: H.sum(credited, function (x) { return x.svc; }), redeemed: out, pending: pending, available: Math.max(0, total - out - pending), tx: tx, svc: svc, sav: sav };
    };

    /* ---------- automatic host acceptance, summary and chat ---------- */
    var _submitRequest = P.submitRequest;
    P.submitRequest = function () {
      var self = this; var before = this.myRequests().length; var r = _submitRequest.apply(this, arguments);
      if (this.mode() !== 'cs') return r;
      this.later(function () { if (self.myRequests().length <= before) return; var reqs = self.myRequests().filter(function (x) { return x.status === 'pending'; }).sort(function (a, b) { return b.at - a.at; }); if (reqs.length) self.autoAccept(reqs[0].id); }, 1150);
      return r;
    };
    P.autoAccept = function (id) {
      var self = this; var r = byId(this.state.db.requests, id); if (!r || r.status !== 'pending') return;
      if (this.state.busy) { this.later(function () { self.autoAccept(id); }, 1200); return; }
      this._muteToast = true; var prevRm = this.rm; this.rm = true; // instant: the host side accepts without a simulated delay
      try { this.acceptRequest(id); } catch (e) { this._muteToast = false; this.rm = prevRm; console.warn('Steady: auto-accept failed', e); return; }
      this.rm = prevRm;
      this.later(function () { self._muteToast = false; var st = self.currentStay(); if (st && st.status === 'awaiting_agreement' && st.requestId === id) { self.csGo('home'); self.onAccepted(st); } }, 120);
    };
    P.onAccepted = function (st) {
      var self = this; var l = this.listingOf(st.listingId); var h = this.hostOf(st.hostId); var pid = this.csId(); var at = this.nowMs();
      var rules = (l.rules || []).slice(0, 3); var chores = (l.chores || []).slice(0, 2).map(function (c) { return c.name.toLowerCase() + ' (' + c.frequency.toLowerCase() + ')'; });
      var opening = [
        'Hi ' + self.csName() + '! Happy to have you from ' + fmtShort(st.start) + '. I\u2019m ' + this.hostLabel(h) + '. Message me here any time.',
        'A few house rules so there are no surprises: ' + (rules.length ? rules.join('; ') : 'treat the place as your own and let me know if plans change') + '.',
        'Chores are light: ' + (chores.length ? chores.join(' and ') : 'just keep shared spaces tidy') + '. ' + (l.noise ? 'Quiet hours: ' + l.noise.toLowerCase() + '. ' : '') + 'Check-in is from 4pm on ' + fmtDate(st.start) + '; text me when you\u2019re ten minutes away.'
      ];
      this.setDb(function (db) { db.messages = (db.messages || []).concat(opening.map(function (text, i) { return { id: uid('msg'), stayId: st.id, participantId: pid, hostId: st.hostId, from: 'host', text: text, at: at + i * 1000, readCs: false, readHost: true }; })); });
      this.toast('success', this.hostLabel(h) + ' accepted your request for ' + l.title + '.');
      this.openAcceptedSummary();
    };
    P.openAcceptedSummary = function () { var st = this.currentStay(); if (!st) return; var h = this.hostOf(st.hostId); var l = this.listingOf(st.listingId); this.setState({ modal: { kind: 'accepted', title: 'You’re in!', sub: this.hostLabel(h) + ' accepted your request for ' + l.title + '. Here is what happens next.' } }); };
    P.chatStay = function () { var st = this.currentStay(); if (st) return st; var done = this.latestCompletedStay(); return done && done.csCheckout && (this.nowMs() - done.csCheckout.at < 7 * 864e5) ? done : null; };
    P.chatThread = function (st) { var id = st.id; return (this.state.db.messages || []).filter(function (m) { return m.stayId === id; }).sort(function (a, b) { return a.at - b.at; }); };
    P.openChat = function () { var st = this.chatStay(); if (!st) return; var h = this.hostOf(st.hostId); this.setState({ modal: { kind: 'chat', title: this.hostLabel(h), sub: this.listingOf(st.listingId).title } }); this.markChatRead(st); };
    P.markChatRead = function (st) { var id = st.id; var any = (this.state.db.messages || []).some(function (m) { return m.stayId === id && m.from === 'host' && !m.readCs; }); if (!any) return; this.setDb(function (db) { db.messages = (db.messages || []).map(function (m) { return m.stayId === id && m.from === 'host' && !m.readCs ? Object.assign({}, m, { readCs: true }) : m; }); }); };
    P.sendChat = function () {
      var st = this.chatStay(); var text = (this.state.forms.chat_text || '').trim(); if (!st || !text) return; var at = this.nowMs(); var pid = this.csId();
      this.setDb(function (db) { db.messages = (db.messages || []).concat([{ id: uid('msg'), stayId: st.id, participantId: pid, hostId: st.hostId, from: 'cs', text: text, at: at, readCs: true, readHost: false }]); });
      this.setForms({ chat_text: '' });
      this.notifyTo('host', st.hostId, 'Message from ' + this.csName(), text.slice(0, 90), 'stays');
      this.hostReply(st, text);
    };
    P.hostReply = function (st, text) {
      var self = this; var h = this.hostOf(st.hostId); var l = this.listingOf(st.listingId) || {}; var t = text.toLowerCase(); var reply;
      if (/check.?in|arriv|what time|when/.test(t)) reply = 'Check-in is from 4pm on ' + fmtDate(st.start) + '. Text me when you’re ten minutes away and I’ll meet you at the door with your key.';
      else if (/rule|chore|task|expect/.test(t)) reply = 'The main ones: ' + (l.rules || []).slice(0, 2).join('; ') + '. Chores are light: ' + (l.chores || []).map(function (c) { return c.name.toLowerCase(); }).slice(0, 2).join(' and ') + '. We can go through everything on day one.';
      else if (/pay|fee|money|cost|rent/.test(t)) reply = 'You never pay me anything. The weekly contribution goes to Steady, and A$20 of it is your own savings.';
      else if (/wifi|internet|desk|study/.test(t)) reply = 'Yes, good Wi-Fi throughout and a desk in your room.';
      else if (/pet|dog|cat|allerg/.test(t)) reply = (l.household || 'It’s a calm household') + '. Let me know if anything there is a problem.';
      else if (/thank|cheers|great|awesome|perfect/.test(t)) reply = 'You’re welcome! See you soon.';
      else if (/hi|hello|hey/.test(t)) reply = 'Hey! Good to hear from you. Anything you want to know before you arrive?';
      else reply = ['Sounds good. Anything else you want to know before you arrive?', 'No problem at all.', 'Thanks for letting me know.', 'Happy to help, just ask.'][Math.floor(Math.random() * 4)];
      this.setCs({ chatTyping: true }); var pid = this.csId();
      this.later(function () {
        self.setCs({ chatTyping: false }); var m = self.state.modal; var inChat = !!(m && m.kind === 'chat');
        self.setDb(function (db) { db.messages = (db.messages || []).concat([{ id: uid('msg'), stayId: st.id, participantId: pid, hostId: st.hostId, from: 'host', text: reply, at: self.nowMs(), readCs: inChat, readHost: true }]); });
        if (!inChat) self.toast('info', self.hostLabel(h) + ': ' + reply.slice(0, 72) + (reply.length > 72 ? '…' : ''));
      }, 1500 + Math.random() * 900);
    };

    /* ---------- values ---------- */
    /* the current-stay values are built in rvCommon; the payment window extends them there */
    var _rvCommon = P.rvCommon;
    P.rvCommon = function () {
      var out = _rvCommon.call(this); var self = this; var cur = out.cur; if (!cur) return out;
      var ps = this.payState();
      Object.assign(cur, { payDue: !!ps && !ps.paid && !ps.expired, paid: !!ps && ps.paid, payExpired: !!ps && ps.expired, payLeft: ps ? fmtLeft(ps.left) : '', payPct: ps ? ps.pct : 0, payUrgent: !!ps && ps.left < 2 * HOUR, payTimerCls: ps && ps.left < 2 * HOUR ? 'urgent' : '', payDueLabel: ps ? fmtDT(ps.due) : '', payLeftLabel: ps ? (Math.floor(Math.max(0, ps.left) / HOUR) + ' hours ' + Math.floor((Math.max(0, ps.left) % HOUR) / 60000) + ' minutes left to pay the first week') : '', payNow: function () { self.openPay(); }, openSummary: function () { self.openAcceptedSummary(); }, paidLabel: ps && ps.payment ? 'Paid ' + fmtDT(ps.payment.at) + ' · ' + ps.payment.method : '' });
      return out;
    };
    var _rvCs = P.rvCs;
    P.rvCs = function () {
      var out = _rvCs.call(this); var self = this; var s = this.state; var cs = s.cs; var o = cs.ob2 || {}; var key = cs.screen === 'onboard' ? this.ob2Key() : '';
      var idv = cs.idv; var method = o.idMethod || 'digital'; var docDone = !!o.docDone; var selfieDone = !!o.selfieDone; var referred = idv === 'referred'; var verified = referred || (docDone && selfieDone);
      var statusLabel = verified ? (referred ? 'A support worker will verify you' : 'Verified') : idv === 'pending' ? 'Checking…' : docDone ? 'ID checked. Selfie next.' : 'Not verified yet';
      Object.assign(out.ob2, {
        sVerify: key === 'verify',
        methods: METHODS.map(function (m) { return { id: m.id, label: m.label, sub: m.sub, img: pic(m.img), on: method === m.id ? 'on' : '', pick: function () { self.ob2PickMethod(m.id); } }; }),
        v: { method: method, docDone: docDone, selfieDone: selfieDone, referred: referred, verified: verified, pending: idv === 'pending', statusLabel: statusLabel, statusCls: verified ? 'verified' : idv === 'pending' ? 'info' : 'neutral',
          stepDoc: docDone || referred ? 'done' : 'now', stepSelfie: selfieDone ? 'done' : docDone ? 'now' : '', stepDone: verified ? 'done' : '',
          showDigital: method === 'digital' && !docDone && !referred, showScan: method === 'scan' && !docDone && !referred, showSupport: method === 'support' && !referred, canSelfie: docDone && !selfieDone,
          startDigital: function () { self.ob2DigitalId(); }, startScan: function () { self.ob2ScanId(); }, askSupport: function () { self.ob2AskSupport(); }, takeSelfie: function () { self.ob2Selfie(); },
          useAsPhoto: o.useAsPhoto !== false, toggleUse: function () { self.selfieToggleUse(); }, avatar: pic(portraitFor(this.csId())) }
      });
      if (key === 'verify') { out.ob2.nextDisabled = out.ob2.nextDisabled || idv === 'pending'; out.ob2.nextLabel = verified ? 'Continue' : 'Verify to continue'; }
      // chat
      var cst = cs.screen === 'onboard' ? null : this.chatStay(); var unread = cst ? this.chatThread(cst).filter(function (m) { return m.from === 'host' && !m.readCs; }).length : 0;
      out.chat = { available: !!cst, hostName: cst ? this.hostLabel(this.hostOf(cst.hostId)) : '', hostAvatar: cst ? avatarOf(this.hostOf(cst.hostId)) : pic('av01'), unread: unread, hasUnread: unread > 0, open: function () { self.openChat(); } };
      return out;
    };
    var _rvModal = P.rvModal;
    P.rvModal = function (out) {
      var r = _rvModal.call(this, out); var m = this.state.modal; var self = this; var cs = this.state.cs; var o = cs.ob2 || {}; var b = out.b || {}; var f = this.state.forms;
      r.M.isSelfie = !!(m && m.kind === 'selfie');
      var ss = o.selfieState || 'search';
      r.M.selfie = { cls: ss, label: ss === 'search' ? 'Centre your face in the circle' : ss === 'found' ? 'Hold still…' : 'Looks good', done: ss === 'done', busy: ss !== 'done', use: function () { self.selfieUse(); }, retake: function () { self.selfieRetake(); }, avatar: pic(portraitFor(this.csId())), useAsPhoto: o.useAsPhoto !== false, toggleUse: function () { self.selfieToggleUse(); } };
      r.M.isGsign = !!(m && m.kind === 'gsign'); var g = cs.gsign || {};
      r.M.gsign = { name: g.name || '', email: g.email || '', av: g.av || pic('av01'), status: g.status || '', switchAccount: function () { self.gsignSwitch(); } };
      var ps = this.payState(); var me = this.participant(); var a = this.state.db.assumptions;
      r.M.isPay = !!(m && m.kind === 'pay');
      r.M.pay = { amount: money(a.stayFeeWeek || 50, true), svc: money(a.contributionService || 30, true), sav: money(a.contributionSavings || 20, true), method: me.paymentMethod ? me.paymentMethod.brand + ' •••• ' + me.paymentMethod.last4 : 'No card on file yet', hasMethod: !!me.paymentMethod, noMethod: !me.paymentMethod, addMethod: function () { self.openPayMethod(); }, submit: function () { self.payFirstWeek(); }, busy: !!b.pay, left: ps ? fmtLeft(ps.left) : '', title: ps ? this.listingOf(ps.stay.listingId).title : '' };
      r.M.isAccepted = !!(m && m.kind === 'accepted');
      var st = this.currentStay(); var l = st ? this.listingOf(st.listingId) : null; var h = st ? this.hostOf(st.hostId) : null; var paid = st ? !!this.firstPayment(st) : false;
      r.M.acc = st ? { host: this.hostLabel(h), hostAvatar: avatarOf(h), title: l.title, suburb: l.suburb, dates: fmtDate(st.start) + ' → ' + fmtDate(st.end), checkin: fmtDate(st.start), nights: st.plannedNights,
        steps: [
          { n: '1', label: 'Pay the first week', hint: paid ? 'Done. A$20 is in your savings.' : 'A$50 within 24 hours: A$30 service fee, A$20 to your savings', cls: paid ? 'done' : 'now' },
          { n: '2', label: 'Confirm the stay agreement', hint: 'House rules, chores and dates, agreed up front', cls: paid ? 'now' : '' },
          { n: '3', label: 'Check in on ' + fmtShort(st.start), hint: 'Your host confirms you’ve arrived', cls: '' },
          { n: '4', label: 'Weekly contributions', hint: 'A$50 a week during the stay, A$20 of it saved for you', cls: '' },
          { n: '5', label: 'Checkout and feedback', hint: 'A verified stay and a reference in your Passport', cls: '' }
        ],
        rules: (l.rules || []).slice(0, 4).map(function (x) { return { text: x }; }), rulesMore: Math.max(0, (l.rules || []).length - 4), chores: (l.chores || []).slice(0, 3).map(function (c) { return { text: c.name + ' · ' + c.frequency }; }), noise: l.noise || '', guests: l.guests || '',
        paid: paid, unpaid: !paid, pay: function () { self.openPay(); }, chat: function () { self.openChat(); }, later: function () { self.setState({ modal: null }); } } : { steps: [], rules: [], chores: [], paid: false, unpaid: false, pay: function () {}, chat: function () {}, later: function () { self.setState({ modal: null }); } };
      r.M.isChat = !!(m && m.kind === 'chat');
      var cst = this.chatStay(); var thread = cst ? this.chatThread(cst) : [];
      var quick = ['What time can I check in?', 'What are the house rules?', 'Anything I should bring?', 'Is there Wi-Fi and a desk?'].map(function (q) { return { label: q, send: function () { self.setForms({ chat_text: q }); self.later(function () { self.sendChat(); }, 30); } }; });
      r.M.chat = { hostName: cst ? this.hostLabel(this.hostOf(cst.hostId)) : '', hostAvatar: cst ? avatarOf(this.hostOf(cst.hostId)) : pic('av01'), messages: thread.map(function (x) { return { id: x.id, cls: x.from === 'cs' ? 'cs' : 'host', text: x.text, when: fmtDT(x.at) }; }), empty: thread.length === 0, typing: !!cs.chatTyping, send: function () { self.sendChat(); }, canSend: !!(f.chat_text || '').trim(), cannotSend: !(f.chat_text || '').trim(), keyDown: function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.sendChat(); } }, quick: quick, hasQuick: thread.filter(function (x) { return x.from === 'cs'; }).length < 3 };
      return r;
    };
    return Core;
  };
})(typeof window !== 'undefined' ? window : this);
