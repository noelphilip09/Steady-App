/* Steady Couch Surfer journey layer: a six-screen onboarding with demo Google sign-in, a search-first home,
   housing and education goals, the weekly contribution and savings model, milestones and the passport header.
   Loaded after steady-live.js; patches the shared core for the Couch Surfer app. */
(function (global) {
  'use strict';
  var _make = global.makeSteadyCore;
  global.makeSteadyCore = function (DCLogic) {
    var Core = _make(DCLogic); var P = Core.prototype; var H = Core.helpers; var Live = global.SteadyLive;
    var pic = function (name) { return (name && IMG_[name]) || ('/assets/img/' + name + '.png'); }; var IMG_ = H.IMG;
    var money = H.money, fmtDate = H.fmtDate, fmtShort = H.fmtShort, fmtDT = H.fmtDT, uid = H.uid, IMG = H.IMG, AREAS = H.AREAS, AREA_BY = H.AREA_BY, AREA_IMG = H.AREA_IMG, diffDays = H.diffDays, addDays = H.addDays, isoOf = H.isoOf, sum = H.sum, clamp = H.clamp;

    var SITUATIONS = [
      { id: 'couch', label: 'Couch surfing', sub: 'Staying with friends, moving around', img: 'ill_couple' },
      { id: 'temp', label: 'Temporary accommodation', sub: 'Refuge, hostel or crisis housing', img: 'ill_door' },
      { id: 'family', label: 'With family, but can’t stay', sub: 'It isn’t working or isn’t safe', img: 'ill_support' },
      { id: 'leaving', label: 'About to lose my place', sub: 'Lease ending, eviction, break-up', img: 'ill_suitcase' },
      { id: 'rough', label: 'Sleeping rough or in a car', sub: 'No fixed place right now', img: 'ill_path' },
      { id: 'other', label: 'Something else', sub: 'You can tell us more later', img: 'ill_shelf' }
    ];
    var EDU_STATUS = [
      { id: 'school', label: 'At school', img: 'obj_stamp' }, { id: 'tafe', label: 'At TAFE', img: 'ill_shelf' }, { id: 'uni', label: 'At university', img: 'ill_map' },
      { id: 'working', label: 'Working', img: 'obj_key' }, { id: 'none', label: 'Not studying right now', img: 'obj_plant' }, { id: 'unsure', label: 'Not sure yet', img: 'obj_mug' }
    ];
    var INTEREST = [{ id: 'yes', label: 'Yes, keen' }, { id: 'maybe', label: 'Maybe later' }, { id: 'no', label: 'Not right now' }];
    var PATHWAYS = [
      { id: 'tafe', label: 'TAFE', sub: 'Certificates and diplomas, often fee-free', img: 'ill_shelf' },
      { id: 'uni', label: 'University', sub: 'Degrees and pathway diplomas', img: 'ill_map' },
      { id: 'vocational', label: 'Vocational training', sub: 'Short, job-focused courses', img: 'obj_stamp' },
      { id: 'apprentice', label: 'Apprenticeship', sub: 'Earn while you learn a trade', img: 'obj_key' },
      { id: 'short', label: 'Short courses', sub: 'Tickets, licences and tasters', img: 'ill_celebrate' }
    ];
    var PATHWAY_BY = {}; PATHWAYS.forEach(function (p) { PATHWAY_BY[p.id] = p; });
    var EDU_BY = {}; EDU_STATUS.forEach(function (p) { EDU_BY[p.id] = p; });
    var SIT_BY = {}; SITUATIONS.forEach(function (p) { SIT_BY[p.id] = p; });
    var GOOGLE_ACCOUNTS = [
      { name: 'Jordan Lee', email: 'jordan@steady.demo', dob: '2005-03-14', av: 'av07', note: 'returning member' },
      { name: 'Alex Nguyen', email: 'alex.nguyen.demo@gmail.com', dob: '2004-05-06', av: 'av14', note: 'new to Steady' },
      { name: 'Sam Rivera', email: 'sam@steady.demo', dob: '2005-08-21', av: 'av21', note: 'returning member' }
    ];
    var NEW_SCREENS = ['results', 'housing', 'education', 'course', 'milestones', 'savings'];
    var ALL_SCREENS = ['home', 'find', 'listing', 'request', 'status', 'stay', 'checkout', 'feedback', 'passport', 'budget', 'payments', 'pathways', 'help', 'sos', 'report', 'notifications', 'more', 'profile'].concat(NEW_SCREENS);
    var TAB_OF = { home: 'home', find: 'home', listing: 'home', request: 'home', results: 'home', status: 'home', housing: 'home', stay: 'stay', checkout: 'stay', feedback: 'home', passport: 'passport', milestones: 'passport', education: 'learn', course: 'learn', pathways: 'learn', budget: 'more', payments: 'more', savings: 'more', help: 'more', sos: 'more', report: 'more', notifications: 'more', more: 'more', profile: 'more' };

    function ob2Defaults() { return { method: null, emailOpen: false, otpSent: false, phoneVerified: false, situation: '', eduStatus: '', interest: '', pathway: '', google: null }; }

    /* ---------- state ---------- */
    var _fresh = P.freshState;
    P.freshState = function (today) {
      var s = _fresh.call(this, today);
      s.cs = Object.assign({}, s.cs, { ob2: ob2Defaults(), courseId: null, eduFilter: 'all', player: null });
      s.forms = Object.assign({}, s.forms, { ob_ec_rel: '', ob_dob: '', sv_amount: '', sv_bsb: '', sv_acc: '', sv_reason: 'Food and essentials', sv_note: '', sv_agency: true });
      return s;
    };
    P.setOb2 = function (patch) { this.setState(function (s) { return { cs: Object.assign({}, s.cs, { ob2: Object.assign({}, s.cs.ob2 || ob2Defaults(), patch) }) }; }); };
    P.updateMe = function (patch) { var pid = this.csId(); this.setDb(function (db) { db.participants = db.participants.map(function (p) { return p.id === pid ? Object.assign({}, p, patch) : p; }); }); };
    P.myStays = function () { var pid = this.csId(); return this.state.db.stays.filter(function (s) { return s.participantId === pid; }); };
    P.myRequests = function () { var pid = this.csId(); return this.state.db.requests.filter(function (r) { return r.participantId === pid; }); };

    /* ---------- onboarding (6 screens; "About you" only on the email path) ---------- */
    P.ob2Steps = function () { var o = this.state.cs.ob2 || ob2Defaults(); return ['account', 'phone'].concat(o.method === 'email' ? ['about'] : []).concat(['situation', 'emergency', 'areas', 'education']); };
    P.ob2Key = function () { var steps = this.ob2Steps(); return steps[clamp(this.state.cs.obStep, 0, steps.length - 1)]; };
    P.ob2Start = function () { this.setState(function (s) { return { cs: Object.assign({}, s.cs, { screen: 'onboard', obStep: 0, obErr: '', obInvalid: {}, idv: 'idle', ob2: Object.assign(ob2Defaults(), { method: s.me ? (s.me.provider === 'google' ? 'google' : 'email') : null }) }) }; }); };
    P.ob2Go = function (i) { this.setCs({ obStep: i, obErr: '', obInvalid: {} }); };
    P.ob2Err = function (err, inv) { this.setCs({ obErr: err, obInvalid: inv || {} }); this.toast('error', err); };
    P.ob2Google = function () {
      var self = this;
      if (!this.isGuest()) { var me = this.state.me; var prof = me.profile || {}; this.setForms({ ob_prefname: this.state.forms.ob_prefname || H.firstName(prof.name || me.name), ob_legalname: this.state.forms.ob_legalname || prof.name || me.name, ob_dob: this.state.forms.ob_dob || prof.dob || '' }); this.setOb2({ method: 'google', google: { name: prof.name || me.name, email: me.email, dob: prof.dob || '' } }); this.ob2Go(1); return; }
      this.setState({ modal: { kind: 'google', title: 'Choose an account', sub: 'Demo sign-in: no real Google account is used and nothing leaves this prototype.' } });
      void self;
    };
    P.ob2GooglePick = function (acc) {
      var self = this; if (this.state.busy) return; this.setState({ busy: 'obNext', modal: null });
      Live.api('POST', '/login', { provider: 'google', email: acc.email, name: acc.name, dob: acc.dob }).then(function (r) {
        if (!r.ok) { self.setState({ busy: null }); self.toast('error', (r.data && r.data.error) || 'Sign-in failed'); return; }
        var me = r.data.me;
        return Live.afterAuth(self, me).then(function () {
          self.setState({ busy: null });
          if (me.onboarded) { self.setCs({ screen: 'home', obStep: 0 }); self.toast('success', 'Welcome back, ' + H.firstName(me.name) + '.'); return; }
          self.setForms({ ob_email: acc.email, ob_prefname: H.firstName(acc.name), ob_legalname: acc.name, ob_dob: acc.dob });
          self.setOb2({ method: 'google', google: { name: acc.name, email: acc.email, dob: acc.dob } });
          self.ob2Go(1); self.toast('success', 'Signed in as ' + acc.name + '. Name and date of birth filled in for you.');
        });
      }).catch(function (e) { self.setState({ busy: null }); self.toast('error', e.message || 'Something went wrong'); });
    };
    P.ob2EmailContinue = function () {
      var self = this; var f = this.state.forms; var inv = {};
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.ob_email || '')) inv.ob_email = 1;
      if ((f.ob_password || '').length < 8) inv.ob_password = 1;
      if (Object.keys(inv).length) { this.ob2Err(inv.ob_email ? 'Enter a valid email address.' : 'Use a password of at least 8 characters.', inv); return; }
      if (!this.isGuest()) { this.setOb2({ method: 'email' }); this.ob2Go(1); return; }
      if (this.state.busy) return; this.setState({ busy: 'obNext' });
      Live.register({ email: f.ob_email.trim(), password: f.ob_password }).then(function (r) {
        if (!r.ok) { self.setState({ busy: null }); self.ob2Err((r.data && r.data.error) || 'Could not create the account.', { ob_email: 1 }); return; }
        return Live.afterAuth(self, r.data.me).then(function () { self.setState({ busy: null }); self.setOb2({ method: 'email' }); self.ob2Go(1); self.toast('success', 'Account created. You are signed in.'); });
      }).catch(function (e) { self.setState({ busy: null }); self.toast('error', e.message || 'Something went wrong'); });
    };
    P.ob2SendCode = function () { var ph = (this.state.forms.ob_phone || '').replace(/\D/g, ''); if (ph.length < 8) { this.ob2Err('Enter your mobile number first.', { ob_phone: 1 }); return; } this.setOb2({ otpSent: true }); this.setCs({ obErr: '', obInvalid: {} }); this.toast('info', 'Demo: a code was "sent". Enter any 6 digits, or skip.'); };
    P.ob2VerifyCode = function () { var code = (this.state.forms.ob_code || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(code)) { this.ob2Err('Enter the 6-digit code, or skip for now.', { ob_code: 1 }); return; } this.setOb2({ phoneVerified: true }); this.toast('success', 'Mobile number verified (simulated).'); this.ob2Go(this.state.cs.obStep + 1); };
    P.ob2SkipPhone = function () { this.setOb2({ phoneVerified: false }); this.ob2Go(this.state.cs.obStep + 1); };
    P.ob2Pick = function (kind, id) { var p = {}; p[kind] = id; if (kind === 'eduStatus') { p.interest = ''; p.pathway = ''; } if (kind === 'interest' && id === 'no') p.pathway = ''; this.setOb2(p); this.setCs({ obErr: '' }); };
    P.ob2SkipEc = function () { this.setForms({ ob_ec_name: '', ob_ec_phone: '', ob_ec_rel: '', ob_ec_consent: false }); this.ob2Go(this.state.cs.obStep + 1); };
    P.ob2AsksInterest = function () { var o = this.state.cs.ob2; return ['none', 'unsure', 'working', 'school'].indexOf(o.eduStatus) >= 0; };
    P.ob2AsksPathway = function () { var o = this.state.cs.ob2; if (!o.eduStatus) return false; if (this.ob2AsksInterest()) return o.interest === 'yes' || o.interest === 'maybe'; return false; };
    P.ob2Next = function () {
      var key = this.ob2Key(); var f = this.state.forms; var o = this.state.cs.ob2; var steps = this.ob2Steps();
      if (key === 'account') {
        if (!o.method && !this.isGuest()) { var me0 = this.state.me; var prof0 = me0.profile || {}; var rec0 = this.participant(); this.setForms({ ob_prefname: f.ob_prefname || rec0.preferred || H.firstName(prof0.name || me0.name), ob_legalname: f.ob_legalname || rec0.legal || prof0.name || me0.name, ob_dob: f.ob_dob || rec0.dob || prof0.dob || '', ob_phone: f.ob_phone || rec0.phone || '' }); this.setOb2({ method: me0.provider === 'google' ? 'google' : 'email', google: me0.provider === 'google' ? { name: prof0.name || me0.name, email: me0.email, dob: prof0.dob || '' } : null }); this.ob2Go(1); return; }
        if (o.method) { this.ob2Go(1); return; } this.ob2Err('Continue with Google, or use your email to create an account.'); return; }
      if (key === 'phone') { if (!o.otpSent) { var ph = (f.ob_phone || '').replace(/\D/g, ''); if (ph.length < 8) { this.ob2Err('Enter your mobile number, or skip for now.', { ob_phone: 1 }); return; } } this.ob2Go(this.state.cs.obStep + 1); return; }
      if (key === 'about') {
        var inv = {}; if (!(f.ob_prefname || '').trim()) inv.ob_prefname = 1; if (!(f.ob_legalname || '').trim()) inv.ob_legalname = 1; if (!f.ob_dob) inv.ob_dob = 1;
        if (Object.keys(inv).length) { this.ob2Err('Please fill in the highlighted fields.', inv); return; }
        var age = this.ageFromDob(f.ob_dob); if (age < 16 || age > 24) { this.ob2Err('This pilot is for people aged 16 to 24. If that isn’t you, support can point you to other services.', { ob_dob: 1 }); return; }
      }
      if (key === 'situation' && !o.situation) { this.ob2Err('Pick the option closest to your situation.'); return; }
      if (key === 'emergency') { var n = (f.ob_ec_name || '').trim(), p = (f.ob_ec_phone || '').trim(); if ((n || p) && !(n && p)) { this.ob2Err('Add both a name and a number, or skip this step.', { ob_ec_name: n ? 0 : 1, ob_ec_phone: p ? 0 : 1 }); return; } if (n && p && !f.ob_ec_consent) { this.ob2Err('Tick the box to confirm they are happy to be contacted.'); return; } }
      if (key === 'areas' && !this.state.cs.obAreas.length) { this.ob2Err('Pick at least one area. You can change it later.'); return; }
      if (key === 'education') {
        if (!o.eduStatus) { this.ob2Err('Tell us where you are up to with study.'); return; }
        if (this.ob2AsksInterest() && !o.interest) { this.ob2Err('Are you interested in studying?'); return; }
        if (this.ob2AsksPathway() && !o.pathway) { this.ob2Err('Pick the pathway that appeals most. You can explore others later.'); return; }
        this.ob2Finish(); return;
      }
      var i = this.state.cs.obStep; if (i < steps.length - 1) this.ob2Go(i + 1);
    };
    P.ob2Back = function () { var i = this.state.cs.obStep; if (i === 0) { if (this.isGuest()) this.goLogin(); else this.setCs({ screen: 'more' }); return; } if (i === 1 && this.state.cs.ob2.method && !this.isGuest() && this.state.me && this.state.me.onboarded) { this.setCs({ screen: 'more' }); return; } this.ob2Go(i - 1); };
    P.ob2Finish = function () {
      var self = this; var f = this.state.forms; var o = this.state.cs.ob2; var cs = this.state.cs; var pid = this.csId();
      if (this.state.busy) return; this.setState({ busy: 'obNext' });
      var legal = (f.ob_legalname || (o.google && o.google.name) || this.state.me && this.state.me.name || '').trim(); var pref = (f.ob_prefname || H.firstName(legal) || 'there').trim(); var dob = f.ob_dob || (o.google && o.google.dob) || '';
      var ec = (f.ob_ec_name && f.ob_ec_phone) ? { name: f.ob_ec_name.trim(), phone: f.ob_ec_phone.trim(), relationship: (f.ob_ec_rel || '').trim() } : null;
      var at = this.nowMs();
      this.setDb(function (db) {
        db.participants = db.participants.map(function (p) {
          if (p.id !== pid) return p;
          return Object.assign({}, p, { name: legal || p.name, preferred: pref, legal: legal || p.legal, dob: dob, ageBand: dob ? self.ageBandOf(dob) : p.ageBand, areas: cs.obAreas, areaId: cs.obAreas[0] || p.areaId || 'inner_west', situation: o.situation, ec: ec, phone: (f.ob_phone || p.phone || '').trim(), phoneVerified: !!o.phoneVerified, signin: o.method || p.signin || 'email', education: { status: o.eduStatus, interested: self.ob2AsksInterest() ? o.interest : 'studying', pathway: o.pathway || (o.eduStatus === 'tafe' ? 'tafe' : o.eduStatus === 'uni' ? 'uni' : '') }, referral: p.referral || 'self', consentHosts: true, consentAnalytics: true, consentFollowup: true, idStatus: p.idStatus === 'verified' ? 'verified' : 'pending' });
        });
        if (!db.passportEvents.some(function (e) { return e.participantId === pid && e.kind === 'Joined'; })) db.passportEvents = db.passportEvents.concat([{ id: uid('pe'), participantId: pid, kind: 'Joined', cls: 'info', text: 'Joined Steady and set up a profile', at: at, source: 'Recorded automatically' }]);
        db.audit = [{ id: uid('au'), at: at, actor: 'Participant', action: 'Onboarding completed', detail: 'Six-step setup: account (' + (o.method || 'email') + '), mobile ' + (o.phoneVerified ? 'verified' : 'unverified') + ', situation, emergency contact, areas, education' }].concat(db.audit);
      });
      if (!this.isGuest()) Live.api('PATCH', '/me', { name: legal || undefined, onboarded: true, profile: { name: legal, dob: dob } }).then(function (res) { if (res.ok && global.SteadySite.logic) global.SteadySite.logic.setState({ me: res.data.me }); });
      this.later(function () { self.setState({ busy: null }); self.setForms({ pf_name: pref }); self.setCs({ screen: 'home', obStep: 0, obErr: '', obInvalid: {} }); self.toast('success', 'You’re all set, ' + pref + '. Let’s find you somewhere steady.'); }, 500);
    };

    /* identity verification lives in Housing goals now */
    var _scanVerifyAfter = P.scanVerifyAfter;
    P.scanVerifyAfter = function (who, viaScan) { var self = this; _scanVerifyAfter.call(this, who, viaScan); if (who === 'cs') this.later(function () { if (self.state.cs.idv === 'verified') self.updateMe({ idStatus: 'verified' }); }, 1900); };
    P.hgVerifyId = function () { this.setCs({ idv: 'idle' }); this.openScan('cs'); };
    P.hgSupportVerify = function () { this.updateMe({ idStatus: 'support' }); this.notify('cs', 'Support worker verification requested', 'A support worker will confirm your identity with you. Nothing else is needed from you now.', 'home'); this.toast('success', 'We’ll ask a support worker to verify you.'); };
    P.hgFindStay = function () { this.setCs({ screen: 'home' }); };

    /* ---------- savings: A$50 a week for every stay week; A$30 Steady service, A$20 the member's savings ---------- */
    P.contributions = function () {
      var pid = this.csId(); var db = this.state.db; var a = db.assumptions; var svc = a.contributionService || 30, sav = a.contributionSavings || 20;
      var rows = db.stayFeeLedger.filter(function (e) { return e.participantId === pid && !e.duplicate && e.status !== 'refunded'; }).sort(function (x, y) { return (x.dueDate < y.dueDate ? 1 : x.dueDate > y.dueDate ? -1 : 0); });
      var self = this;
      var list = rows.map(function (e) { var credited = e.status === 'paid' || e.status === 'late'; var st = self.state.db.stays.find(function (s) { return s.id === e.stayId; }); var l = st ? self.listingOf(st.listingId) : null; return { id: e.id, weekNo: e.weekNo, date: e.dueDate, stay: l ? l.title : 'Stay', credited: credited, status: credited ? 'Credited' : (e.status === 'scheduled' ? 'Upcoming' : 'Processing'), cls: credited ? 'verified' : 'pending', amount: e.amount, svc: svc, sav: sav }; });
      var credited = list.filter(function (x) { return x.credited; });
      var tx = db.savingsTx.filter(function (t) { return t.participantId === pid; }).sort(function (x, y) { return y.at - x.at; });
      var out = sum(tx.filter(function (t) { return (t.kind === 'redeem' && t.status === 'paid') || (t.kind === 'emergency' && t.status === 'approved'); }), function (t) { return t.amount; });
      var pending = sum(tx.filter(function (t) { return t.status === 'requested'; }), function (t) { return t.amount; });
      var total = credited.length * sav;
      return { list: list, credited: credited.length, weeks: list.length, total: total, service: credited.length * svc, redeemed: out, pending: pending, available: Math.max(0, total - out - pending), tx: tx, svc: svc, sav: sav };
    };
    P.svRedeem = function () { var c = this.contributions(); if (c.available <= 0) { this.toast('info', 'Nothing to redeem yet. Savings build at A$' + c.sav + ' a week during a stay.'); return; } this.setForms({ sv_amount: String(c.available), sv_bsb: '', sv_acc: '' }); this.setState({ modal: { kind: 'redeem', title: 'Redeem your savings', sub: 'Your savings are yours. Transfers reach your account within one business day (simulated here).' } }); };
    P.svSubmitRedeem = function () {
      var self = this; var f = this.state.forms; var c = this.contributions(); var amt = Math.round(Number(f.sv_amount) * 100) / 100;
      if (!(amt > 0) || amt > c.available) { this.toast('error', 'Enter an amount up to ' + money(c.available, true) + '.'); return; }
      if ((f.sv_bsb || '').replace(/\D/g, '').length !== 6 || (f.sv_acc || '').replace(/\D/g, '').length < 6) { this.toast('error', 'Add the BSB and account number for the transfer.'); return; }
      var last4 = f.sv_acc.replace(/\D/g, '').slice(-4); var pid = this.csId();
      this.run('redeem', 900, function () {
        var at = self.nowMs();
        self.setDb(function (db) { db.savingsTx = (db.savingsTx || []).concat([{ id: uid('sv'), participantId: pid, kind: 'redeem', amount: amt, at: at, status: 'paid', to: 'Account ending ' + last4, note: '' }]); db.audit = [{ id: uid('au'), at: at, actor: 'Participant', action: 'Savings redeemed', detail: money(amt, true) + ' to account ending ' + last4 + ' (simulated transfer)' }].concat(db.audit); });
        self.setState({ modal: null }); self.setForms({ sv_bsb: '', sv_acc: '' });
        self.notify('cs', 'Savings on their way', money(amt, true) + ' is being transferred to your account ending ' + last4 + ' (demo).', 'savings');
        self.toast('success', money(amt, true) + ' redeemed. It stays in your record as savings you built.');
      });
    };
    P.svEmergency = function () { var c = this.contributions(); this.setForms({ sv_amount: String(c.available > 0 ? Math.min(c.available, 100) : 0), sv_note: '', sv_agency: true }); this.setState({ modal: { kind: 'emergency', title: 'Emergency assistance', sub: 'Expedited access to your savings, same day where possible, and a support worker if you want one.' } }); };
    P.svSubmitEmergency = function () {
      var self = this; var f = this.state.forms; var c = this.contributions(); var amt = Math.round(Number(f.sv_amount || 0) * 100) / 100; var pid = this.csId();
      if (c.available > 0 && !(amt > 0 && amt <= c.available)) { this.toast('error', 'Enter an amount up to ' + money(c.available, true) + '.'); return; }
      this.run('emergency', 900, function () {
        var at = self.nowMs(); var txId = uid('sv');
        self.setDb(function (db) {
          if (amt > 0) db.savingsTx = (db.savingsTx || []).concat([{ id: txId, participantId: pid, kind: 'emergency', amount: amt, at: at, status: 'requested', to: 'Expedited access', note: f.sv_reason }]);
          db.supportRequests = (db.supportRequests || []).concat([{ id: uid('sr'), participantId: pid, kind: 'Emergency assistance', category: f.sv_reason, text: (f.sv_note || '').trim(), at: at, status: 'open', agency: !!f.sv_agency, private: true }]);
          db.audit = [{ id: uid('au'), at: at, actor: 'Participant', action: 'Emergency assistance requested', detail: f.sv_reason + (amt > 0 ? '; expedited savings access ' + money(amt, true) : '') + (f.sv_agency ? '; referral to a support agency requested' : '') }].concat(db.audit);
        });
        self.setState({ modal: null });
        self.toast('success', 'Request sent. A support worker will call you today.');
        self.later(function () {
          if (amt > 0) { self.setDb(function (db) { db.savingsTx = (db.savingsTx || []).map(function (t) { return t.id === txId ? Object.assign({}, t, { status: 'approved', approvedAt: self.nowMs() }) : t; }); }); self.notify('cs', 'Emergency access approved', money(amt, true) + ' of your savings is being paid to you today (demo).', 'savings'); }
          if (f.sv_agency) self.notify('cs', 'Support agency connected', 'We’ve shared your request with a youth support agency near you. They will contact you within 24 hours.', 'help');
        }, 2600);
      });
    };

    /* ---------- education ---------- */
    P.learningFor = function (courseId) { var pid = this.csId(); return (this.state.db.learning || []).find(function (l) { return l.participantId === pid && l.courseId === courseId; }) || null; };
    P.ensureLearning = function (courseId, patch) {
      var pid = this.csId(); var at = this.nowMs();
      this.setDb(function (db) { var list = db.learning || []; var ex = list.find(function (l) { return l.participantId === pid && l.courseId === courseId; }); if (ex) { if (patch) db.learning = list.map(function (l) { return l === ex ? Object.assign({}, l, patch, { updatedAt: at }) : l; }); } else db.learning = list.concat([Object.assign({ id: uid('lr'), participantId: pid, courseId: courseId, interested: false, watched: [], tasksDone: [], ready: false, connectedAt: null, status: 'exploring', updatedAt: at }, patch || {})]); });
    };
    P.courseProgress = function (c, lr) {
      lr = lr || { watched: [], tasksDone: [], ready: false, connectedAt: null, status: 'none', interested: false };
      var vTotal = c.videos.length, vDone = c.videos.filter(function (v) { return lr.watched.indexOf(v.id) >= 0; }).length;
      var tTotal = c.tasks.length, tDone = c.tasks.filter(function (t) { return lr.tasksDone.indexOf(t.id) >= 0; }).length;
      var explored = lr.status !== 'none'; var videosDone = vTotal === 0 || vDone === vTotal; var tasksDone = tTotal === 0 || tDone === tTotal;
      var pct = Math.round((explored ? 10 : 0) + (vTotal ? vDone / vTotal * 40 : 40) + (tTotal ? tDone / tTotal * 30 : 30) + (lr.ready ? 10 : 0) + (lr.connectedAt ? 10 : 0));
      var stage = lr.connectedAt ? 5 : lr.ready ? 4 : (videosDone && explored) ? 3 : explored ? 2 : 1;
      var labels = { 1: 'Explore', 2: 'Watching videos', 3: 'Getting ready', 4: 'Ready to apply', 5: 'Connected with Steady' };
      var label = lr.status === 'enrolled' ? 'Enrolled' : lr.status === 'applied' ? 'Applied' : labels[stage];
      return { pct: explored ? pct : 0, stage: stage, label: label, vDone: vDone, vTotal: vTotal, tDone: tDone, tTotal: tTotal, videosDone: videosDone, tasksDone: tasksDone, canReady: explored && videosDone && tasksDone && !lr.ready, explored: explored };
    };
    P.edOpen = function (courseId) { var lr = this.learningFor(courseId); if (!lr) this.ensureLearning(courseId); this.setCs({ screen: 'course', courseId: courseId }); };
    P.edSetFilter = function (id) { this.setCs({ eduFilter: id }); };
    P.edSetPathway = function (id) { var me = this.participant(); this.updateMe({ education: Object.assign({}, me.education || {}, { pathway: id, interested: 'yes' }) }); this.toast('info', 'Pathway updated: ' + PATHWAY_BY[id].label + '.'); };
    P.edToggleInterest = function (courseId) { var lr = this.learningFor(courseId); this.ensureLearning(courseId, { interested: !(lr && lr.interested) }); this.toast('info', lr && lr.interested ? 'Removed from your interests.' : 'Added to your interests. Steady will keep an eye on intakes for you.'); };
    P.edToggleTask = function (courseId, taskId) { var lr = this.learningFor(courseId) || { tasksDone: [] }; var done = lr.tasksDone.indexOf(taskId) >= 0; var next = done ? lr.tasksDone.filter(function (t) { return t !== taskId; }) : lr.tasksDone.concat([taskId]); this.ensureLearning(courseId, { tasksDone: next, status: lr.status === 'exploring' || !lr.status ? 'learning' : lr.status }); if (!done) this.toast('success', 'Nice. One step closer.'); };
    P.edWatch = function (courseId, videoId) {
      var c = H.byId(this.state.db.courses, courseId); var v = c && c.videos.find(function (x) { return x.id === videoId; }); if (!v) return;
      var seq = (this._playSeq = (this._playSeq || 0) + 1);
      this.setState({ modal: { kind: 'video', title: v.title, sub: c.title + ' · ' + v.mins + ' min' }, cs: Object.assign({}, this.state.cs, { player: { courseId: courseId, videoId: videoId, pct: 0, done: false, seq: seq, img: c.img } }) });
      this.ensureLearning(courseId, { status: (this.learningFor(courseId) || {}).status === 'exploring' ? 'learning' : undefined });
      this.edTick(seq);
    };
    P.edTick = function (seq) {
      var self = this; var step = this.rm ? 34 : 9;
      this.later(function () {
        var p = self.state.cs.player; var m = self.state.modal; if (!p || p.seq !== seq || !m || m.kind !== 'video') return;
        var pct = Math.min(100, p.pct + step);
        self.setCs({ player: Object.assign({}, p, { pct: pct, done: pct >= 100 }) });
        if (pct >= 100) { var lr = self.learningFor(p.courseId) || { watched: [] }; if (lr.watched.indexOf(p.videoId) < 0) { self.ensureLearning(p.courseId, { watched: lr.watched.concat([p.videoId]), status: lr.status === 'exploring' || !lr.status ? 'learning' : lr.status }); self.toast('success', 'Video complete. Added to your learning progress.'); } return; }
        self.edTick(seq);
      }, 280);
    };
    P.edMarkReady = function (courseId) {
      var c = H.byId(this.state.db.courses, courseId); var lr = this.learningFor(courseId); var pid = this.csId(); var at = this.nowMs();
      this.ensureLearning(courseId, { ready: true, interested: true, status: 'ready' });
      this.setDb(function (db) { db.passportEvents = db.passportEvents.concat([{ id: uid('pe'), participantId: pid, kind: 'Education', cls: 'verified', text: 'Ready to apply: ' + c.title, at: at, source: 'Videos watched and preparation tasks completed in Steady' }]); });
      this.toast('success', 'Marked ready. Steady can now help you apply.'); void lr;
    };
    P.edConnect = function (courseId) {
      var self = this; var c = H.byId(this.state.db.courses, courseId); var pid = this.csId();
      this.run('connect', 900, function () {
        var at = self.nowMs();
        self.ensureLearning(courseId, { connectedAt: at, status: 'connected', interested: true });
        self.setDb(function (db) {
          db.supportRequests = (db.supportRequests || []).concat([{ id: uid('sr'), participantId: pid, kind: 'Education application support', category: c.type, text: 'Help applying for ' + c.title + ' (' + c.provider + ')', at: at, status: 'open', private: true }]);
          db.passportEvents = db.passportEvents.concat([{ id: uid('pe'), participantId: pid, kind: 'Education', cls: 'info', text: 'Asked Steady for application support: ' + c.title, at: at, source: 'Recorded automatically' }]);
          db.audit = [{ id: uid('au'), at: at, actor: 'Participant', action: 'Education support requested', detail: c.title + ' · ' + c.provider }].concat(db.audit);
        });
        self.notify('cs', 'We’re on it', 'A Steady education adviser will call you within two business days about ' + c.title + '. Bring any questions; we handle the paperwork together.', 'course');
        self.toast('success', 'Connected. An education adviser will be in touch.');
      });
    };

    /* ---------- milestones and achievements ---------- */
    P.achievements = function () {
      var me = this.participant(); var db = this.state.db; var pid = this.csId(); var stays = this.myStays(); var done = stays.filter(function (s) { return s.status === 'completed'; });
      var refs = db.references.filter(function (r) { return r.participantId === pid && r.status === 'received'; }).length;
      var tasksDone = sum(done, function (s) { return s.tasksDone || 0; }) + db.tasks.filter(function (t) { return t.completedAt && stays.some(function (s) { return s.id === t.stayId; }); }).length;
      var c = this.contributions(); var lrs = (db.learning || []).filter(function (l) { return l.participantId === pid; });
      var watched = sum(lrs, function (l) { return l.watched.length; });
      var outcome = db.outcomes.some(function (o) { return o.participantId === pid; });
      var list = [
        { id: 'profile', label: 'Profile complete', sub: 'Set up and ready', img: 'stk_thumb', done: !!(me.dob && (me.areas || []).length) },
        { id: 'id', label: 'Identity verified', sub: 'Trusted by hosts', img: 'obj_shield', done: me.idStatus === 'verified' },
        { id: 'request', label: 'First request', sub: 'Reached out to a host', img: 'stk_mail', done: this.myRequests().length > 0 },
        { id: 'stay', label: 'First verified stay', sub: 'In your Passport', img: 'obj_key', done: done.length > 0 },
        { id: 'reference', label: 'Reference received', sub: 'A host vouched for you', img: 'stamp_hands', done: refs > 0 },
        { id: 'tasks', label: '10 household tasks', sub: tasksDone + ' done', img: 'obj_bowls', done: tasksDone >= 10 },
        { id: 'savings', label: 'Savings started', sub: 'A$' + c.sav + ' a week', img: 'obj_basket', done: c.credited > 0 },
        { id: 'saver', label: 'A$100 saved', sub: money(c.total) + ' so far', img: 'stamp_leaf', done: c.total >= 100 },
        { id: 'video', label: 'First video watched', sub: watched + ' watched', img: 'stk_chat', done: watched > 0 },
        { id: 'ready', label: 'Ready to apply', sub: 'A course prepared', img: 'obj_stamp', done: lrs.some(function (l) { return l.ready; }) },
        { id: 'connected', label: 'Adviser connected', sub: 'Application support', img: 'ill_trio', done: lrs.some(function (l) { return !!l.connectedAt; }) },
        { id: 'outcome', label: 'Next housing recorded', sub: 'Longer-term place', img: 'ill_passport_path', done: outcome }
      ];
      return { list: list, done: list.filter(function (a) { return a.done; }).length, total: list.length, tasksDone: tasksDone, watched: watched, refs: refs, stays: done.length };
    };
    P.housingSteps = function () {
      var me = this.participant(); var reqs = this.myRequests(); var stays = this.myStays(); var db = this.state.db; var pid = this.csId(); var self = this;
      var open = reqs.some(function (r) { return ['pending', 'clarification', 'replied', 'accepted'].indexOf(r.status) >= 0; });
      var confirmed = stays.some(function (s) { return ['confirmed', 'active', 'completed'].indexOf(s.status) >= 0; });
      var checkedIn = stays.some(function (s) { return s.status === 'active' || s.status === 'completed'; });
      var completed = stays.some(function (s) { return s.status === 'completed'; });
      var outcome = db.outcomes.some(function (o) { return o.participantId === pid; });
      var idDone = me.idStatus === 'verified';
      var steps = [
        { key: 'profile', label: 'Set up your profile', hint: 'Where you are, where you want to stay, how to reach you', done: !!(me.dob && (me.areas || []).length), action: function () { self.ob2Start(); }, cta: 'Review' },
        { key: 'id', label: 'Verify your identity', hint: me.idStatus === 'support' ? 'A support worker will verify you' : 'Takes about a minute with your ID, or ask a support worker', done: idDone, action: function () { self.hgVerifyId(); }, cta: me.idStatus === 'support' ? 'Scan instead' : 'Verify now', alt: me.idStatus === 'support' ? null : function () { self.hgSupportVerify(); }, altLabel: 'Ask a support worker' },
        { key: 'search', label: 'Find a stay', hint: 'Search verified rooms in your preferred areas', done: reqs.length > 0 || stays.length > 0, action: function () { self.hgFindStay(); }, cta: 'Search' },
        { key: 'request', label: 'Send a request', hint: 'Hosts usually reply within two days', done: reqs.length > 0, action: function () { self.csGo(reqs.length ? 'status' : 'home'); }, cta: reqs.length ? 'Track' : 'Find a room' },
        { key: 'agree', label: 'Confirm the stay agreement', hint: 'House rules, chores and dates, agreed up front', done: confirmed, action: function () { self.csGo('stay'); }, cta: 'Open' },
        { key: 'checkin', label: 'Check in', hint: 'Your host confirms arrival; weekly contributions start', done: checkedIn, action: function () { self.csGo('stay'); }, cta: 'Open' },
        { key: 'complete', label: 'Complete the stay', hint: 'Checkout, feedback and a verified record in your Passport', done: completed, action: function () { self.csGo('stay'); }, cta: 'Open' },
        { key: 'next', label: 'Record your next housing', hint: 'Private rental, social housing or family', done: outcome, action: function () { self.csGo('passport'); self.setCs({ ppTab: 'milestones' }); }, cta: 'Record' }
      ];
      var now = steps.find(function (s) { return !s.done; }); if (now) now.now = true;
      return { steps: steps, done: steps.filter(function (s) { return s.done; }).length, total: steps.length, open: open };
    };
    P.passportScore = function () {
      var db = this.state.db; var pid = this.csId(); var done = this.myStays().filter(function (s) { return s.status === 'completed'; });
      var refs = db.references.filter(function (r) { return r.participantId === pid && r.status === 'received' }).length;
      var ids = {}; done.forEach(function (s) { ids[s.id] = 1; });
      var hostRatings = db.feedback.filter(function (f) { return ids[f.stayId] && f.by === 'host' && f.published; }).map(function (f) { return f.rating; });
      var avg = hostRatings.length ? hostRatings.reduce(function (a, b) { return a + b; }, 0) / hostRatings.length : 0;
      var inc = db.incidents.filter(function (i) { return i.participantId === pid; }); var resolved = inc.filter(function (i) { return i.status === 'resolved'; }).length;
      var onTime = done.filter(function (s) { return s.csCheckout && s.hostCheckout; }).length;
      var score = Math.min(3, done.length) * 15 + Math.min(2, refs) * 10 + (avg >= 4 ? 15 : avg >= 3 ? 8 : 0) + (inc.length ? Math.round(resolved / inc.length * 10) : (done.length ? 10 : 0)) + (done.length ? Math.round(onTime / done.length * 10) : 0);
      score = clamp(score, 0, 100);
      return { score: score, label: score >= 80 ? 'Strong' : score >= 50 ? 'Building' : score > 0 ? 'Getting started' : 'New', avg: avg, hostRatings: hostRatings.length, refs: refs, stays: done.length, resolved: resolved, incidents: inc.length };
    };

    /* ---------- values ---------- */
    var _rvCs = P.rvCs;
    P.rvCs = function () {
      var self = this; var out = _rvCs.call(this); var s = this.state; var cs = s.cs; var f = s.forms; var db = s.db; var me = this.participant(); var onboard = cs.screen === 'onboard';
      NEW_SCREENS.forEach(function (k) { out.csS[k] = !onboard && cs.screen === k; });
      var tab = TAB_OF[cs.screen] || 'home'; out.csTab = {}; ['home', 'stay', 'passport', 'learn', 'more'].forEach(function (k) { out.csTab[k] = tab === k ? 'on' : ''; });
      var go = function (screen, extra) { return function () { self.csGo(screen, extra); }; };
      out.csGoHousing = go('housing'); out.csGoEducation = go('education'); out.csGoMilestones = go('milestones'); out.csGoSavings = go('savings'); out.csGoResults = go('results');
      out.csStartOnboarding = function () { self.ob2Start(); };

      /* onboarding */
      var o = cs.ob2 || ob2Defaults(); var steps = this.ob2Steps(); var key = onboard ? this.ob2Key() : ''; var idx = clamp(cs.obStep, 0, steps.length - 1); var b = out.b || {};
      var inv = cs.obInvalid || {}; var invCls = {}; ['ob_email', 'ob_password', 'ob_phone', 'ob_code', 'ob_prefname', 'ob_legalname', 'ob_dob', 'ob_ec_name', 'ob_ec_phone', 'ob_ec_rel'].forEach(function (k) { invCls[k] = inv[k] ? 'invalid' : ''; });
      out.ob2 = {
        step: idx, total: steps.length, dots: steps.map(function (k, i) { return { on: i <= idx ? 'on' : '' }; }), stepLabel: 'Step ' + (idx + 1) + ' of ' + steps.length,
        sAccount: key === 'account', sPhone: key === 'phone', sAbout: key === 'about', sSituation: key === 'situation', sEmergency: key === 'emergency', sAreas: key === 'areas', sEducation: key === 'education',
        showNav: key !== 'account', nextLabel: b.obNext ? 'Saving…' : key === 'education' ? 'Finish setup' : 'Continue', nextDisabled: !!b.obNext, busy: !!b.obNext,
        err: cs.obErr || '', errShown: !!cs.obErr, inv: invCls,
        emailOpen: !!o.emailOpen, toggleEmail: function () { self.setOb2({ emailOpen: !o.emailOpen }); }, google: function () { self.ob2Google(); }, emailContinue: function () { self.ob2EmailContinue(); },
        signedIn: !this.isGuest(), signedInAs: me.preferred && me.preferred !== 'there' ? me.preferred : (s.me ? s.me.email : ''),
        otpSent: !!o.otpSent, phoneVerified: !!o.phoneVerified, sendCode: function () { self.ob2SendCode(); }, verifyCode: function () { self.ob2VerifyCode(); }, skipPhone: function () { self.ob2SkipPhone(); },
        viaGoogle: o.method === 'google', googleName: o.google ? o.google.name : '',
        situations: SITUATIONS.map(function (x) { return { id: x.id, label: x.label, sub: x.sub, img: pic(x.img), on: o.situation === x.id ? 'on' : '', pick: function () { self.ob2Pick('situation', x.id); } }; }),
        skipEc: function () { self.ob2SkipEc(); },
        areas: AREAS.map(function (a) { return { id: a.id, name: a.name, img: pic(AREA_IMG[a.id] || 'area_park'), on: cs.obAreas.indexOf(a.id) >= 0 ? 'on' : '', toggle: function () { self.obToggleArea(a.id); } }; }), areaCount: cs.obAreas.length,
        eduStatus: EDU_STATUS.map(function (x) { return { id: x.id, label: x.label, img: pic(x.img), on: o.eduStatus === x.id ? 'on' : '', pick: function () { self.ob2Pick('eduStatus', x.id); } }; }),
        asksInterest: this.ob2AsksInterest(), interest: INTEREST.map(function (x) { return { id: x.id, label: x.label, on: o.interest === x.id ? 'on' : '', pick: function () { self.ob2Pick('interest', x.id); } }; }),
        asksPathway: this.ob2AsksPathway(), pathways: PATHWAYS.map(function (x) { return { id: x.id, label: x.label, sub: x.sub, img: pic(x.img), on: o.pathway === x.id ? 'on' : '', pick: function () { self.ob2Pick('pathway', x.id); } }; }),
        back: function () { self.ob2Back(); }, next: function () { self.ob2Next(); }
      };

      /* home */
      var contrib = this.contributions(); var hs = this.housingSteps(); var ach = this.achievements(); var cur = out.cur || {};
      var lrs = (db.learning || []).filter(function (l) { return l.participantId === self.csId(); }); var inProgress = lrs.filter(function (l) { return !!l.courseId && l.status !== 'none'; });
      var areaName = f.s_area && f.s_area !== 'any' && AREA_BY[f.s_area] ? AREA_BY[f.s_area].name : 'Anywhere in Sydney';
      out.hm = {
        stayFirst: !cur.none, areaLabel: areaName,
        search: function () { self.runSearch(); self.csGo('results'); },
        housing: { done: hs.done, total: hs.total, pct: Math.round(hs.done / hs.total * 100), sub: hs.done + ' of ' + hs.total + ' steps' },
        edu: { count: inProgress.length, sub: inProgress.length ? inProgress.length + ' course' + (inProgress.length === 1 ? '' : 's') + ' in progress' : 'Explore TAFE and more' },
        ms: { done: ach.done, total: ach.total, pct: Math.round(ach.done / ach.total * 100), sub: ach.done + ' of ' + ach.total + ' unlocked' },
        savings: money(contrib.available), savingsSub: contrib.credited ? contrib.credited + ' week' + (contrib.credited === 1 ? '' : 's') + ' credited' : 'A$' + contrib.sav + ' a week during a stay'
      };
      out.savedOppCount = out.savedOppCount || 0;

      /* results */
      out.rs = { title: areaName, sub: (f.s_start ? 'From ' + fmtShort(f.s_start) : 'Any date') + ' · ' + (f.s_weeks && f.s_weeks !== 'any' ? 'about ' + f.s_weeks + ' weeks' : 'any length'), edit: function () { self.csGo('find'); } };

      /* housing goals */
      out.hg = { pct: Math.round(hs.done / hs.total * 100), done: hs.done, total: hs.total, steps: hs.steps.map(function (st) { return { label: st.label, hint: st.hint, cls: st.done ? 'done' : st.now ? 'now' : '', done: st.done, now: !!st.now, go: st.action, cta: st.cta, hasAlt: !!st.alt, alt: st.alt || function () {}, altLabel: st.altLabel || '' }; }), idStatus: me.idStatus, nextLabel: (hs.steps.find(function (x) { return x.now; }) || {}).label || 'All done' };

      /* savings */
      out.sv = {
        available: money(contrib.available), total: money(contrib.total), service: money(contrib.service), redeemed: money(contrib.redeemed), pending: money(contrib.pending), hasPending: contrib.pending > 0, weeks: contrib.credited, svc: 'A$' + contrib.svc, sav: 'A$' + contrib.sav, weekly: 'A$' + (contrib.svc + contrib.sav),
        hasHistory: contrib.list.length > 0, noHistory: contrib.list.length === 0, history: contrib.list.map(function (x) { return { id: x.id, week: 'Wk ' + x.weekNo, date: fmtShort(x.date), stay: x.stay, status: x.status, cls: x.cls, you: '+' + money(x.sav), svc: money(x.svc) + ' to Steady' }; }),
        hasTx: contrib.tx.length > 0, tx: contrib.tx.map(function (t) { return { id: t.id, label: t.kind === 'redeem' ? 'Redeemed to ' + t.to : 'Emergency access · ' + (t.note || ''), amount: '−' + money(t.amount), when: fmtDT(t.at), status: t.status === 'requested' ? 'Requested' : t.status === 'approved' ? 'Approved' : 'Paid', cls: t.status === 'requested' ? 'pending' : 'verified' }; }),
        redeem: function () { self.svRedeem(); }, emergency: function () { self.svEmergency(); }, canRedeem: contrib.available > 0
      };

      /* education */
      var filter = cs.eduFilter || 'all'; var filters = [{ id: 'all', label: 'All' }, { id: 'TAFE', label: 'TAFE' }, { id: 'University', label: 'University' }, { id: 'Short course', label: 'Short courses' }];
      var courses = (db.courses || []).filter(function (c) { return filter === 'all' || c.type === filter; });
      var courseCard = function (c) { var lr = self.learningFor(c.id); var pr = self.courseProgress(c, lr); return { id: c.id, title: c.title, provider: c.provider, type: c.type, duration: c.duration, cost: c.cost, img: pic(c.img || 'ill_shelf'), pct: pr.pct, stageLabel: pr.label, stageCls: pr.stage >= 4 ? 'approved' : pr.stage >= 2 ? 'active' : 'neutral', started: pr.explored, open: function () { self.edOpen(c.id); }, interested: !!(lr && lr.interested) }; };
      var edu = me.education || {}; var vids = []; (db.courses || []).forEach(function (c) { var lr = self.learningFor(c.id); c.videos.forEach(function (v) { vids.push({ id: v.id, title: v.title, mins: v.mins + ' min', course: c.title, watched: !!(lr && lr.watched.indexOf(v.id) >= 0), cls: lr && lr.watched.indexOf(v.id) >= 0 ? 'done' : '', watch: function () { self.edWatch(c.id, v.id); } }); }); });
      var watchedN = vids.filter(function (v) { return v.watched; }).length; var tasksN = sum(lrs, function (l) { return l.tasksDone.length; });
      out.ed = {
        filters: filters.map(function (x) { return { id: x.id, label: x.label, on: filter === x.id ? 'on' : '', pressed: filter === x.id ? 'true' : 'false', pick: function () { self.edSetFilter(x.id); } }; }),
        courses: courses.map(courseCard), mine: (db.courses || []).filter(function (c) { var lr = self.learningFor(c.id); return lr && lr.status !== 'none'; }).map(courseCard), hasMine: inProgress.length > 0,
        videos: vids.slice(0, 6), watched: watchedN, videoTotal: vids.length, tasks: tasksN,
        statusLabel: edu.status ? (EDU_BY[edu.status] || {}).label : 'Not set', pathwayLabel: edu.pathway ? (PATHWAY_BY[edu.pathway] || {}).label : (edu.interested === 'no' ? 'Not right now' : 'Pick a pathway'), hasPathway: !!edu.pathway,
        pathwayChips: PATHWAYS.map(function (p) { return { id: p.id, label: p.label, on: edu.pathway === p.id ? 'on' : '', pressed: edu.pathway === p.id ? 'true' : 'false', pick: function () { self.edSetPathway(p.id); } }; }),
        summary: inProgress.length ? inProgress.length + ' course' + (inProgress.length === 1 ? '' : 's') + ' in progress · ' + watchedN + ' video' + (watchedN === 1 ? '' : 's') + ' watched' : 'Start with a short video. No pressure, no exams.',
        talk: out.openSupportRequest || function () { self.toast('info', 'Support is available from the Help screen.'); }
      };
      var C = H.byId(db.courses || [], cs.courseId) || (db.courses || [])[0]; var LR = C ? this.learningFor(C.id) : null; var PR = C ? this.courseProgress(C, LR) : null;
      out.cd = C ? {
        id: C.id, title: C.title, provider: C.provider, type: C.type, level: C.level, duration: C.duration, mode: C.mode, cost: C.cost, intake: C.intake, blurb: C.blurb, img: pic(C.img || 'ill_shelf'), href: C.href,
        requirements: C.requirements.map(function (r) { return { text: r }; }), pathways: C.pathways.map(function (r) { return { text: r }; }),
        videos: C.videos.map(function (v) { var w = !!(LR && LR.watched.indexOf(v.id) >= 0); return { id: v.id, title: v.title, mins: v.mins + ' min', watched: w, cls: w ? 'done' : '', watch: function () { self.edWatch(C.id, v.id); } }; }),
        tasks: C.tasks.map(function (t) { var d = !!(LR && LR.tasksDone.indexOf(t.id) >= 0); return { id: t.id, label: t.label, hint: t.hint, done: d, toggle: function () { self.edToggleTask(C.id, t.id); } }; }),
        pct: PR.pct, stageLabel: PR.label, vDone: PR.vDone, vTotal: PR.vTotal, tDone: PR.tDone, tTotal: PR.tTotal,
        stages: [1, 2, 3, 4, 5].map(function (n) { var labels = ['Explore', 'Videos', 'Prepare', 'Ready', 'Connect']; return { n: n, label: labels[n - 1], cls: PR.stage > n || (n === 5 && LR && LR.connectedAt) ? 'done' : PR.stage === n ? 'now' : '' }; }),
        canReady: PR.canReady, readyDisabled: !PR.canReady || !!(LR && LR.ready), ready: !!(LR && LR.ready), connected: !!(LR && LR.connectedAt), connectDisabled: !(LR && LR.ready) || !!(LR && LR.connectedAt), notInterested: !(LR && LR.interested), connectedLabel: LR && LR.connectedAt ? 'Requested ' + fmtDT(LR.connectedAt) : '', interested: !!(LR && LR.interested),
        markReady: function () { self.edMarkReady(C.id); }, connect: function () { self.edConnect(C.id); }, toggleInterest: function () { self.edToggleInterest(C.id); }, back: function () { self.csGo('education'); },
        readyHint: PR.canReady ? 'You’ve watched the videos and done the prep. Ready to apply?' : PR.videosDone ? 'Finish the preparation tasks to unlock the next step.' : 'Watch the short videos first (' + PR.vDone + ' of ' + PR.vTotal + ').'
      } : { title: '', videos: [], tasks: [], stages: [], requirements: [], pathways: [] };

      /* milestones */
      var evs = db.passportEvents.filter(function (e) { return e.participantId === self.csId(); }).slice().sort(function (a, b2) { return b2.at - a.at; }).slice(0, 12);
      out.ms = {
        pct: Math.round(ach.done / ach.total * 100), done: ach.done, total: ach.total, ringDash: Math.round(213.6 * (1 - ach.done / ach.total)),
        badges: ach.list.map(function (a) { return { id: a.id, label: a.label, sub: a.sub, img: pic(a.img || 'obj_stamp'), cls: a.done ? 'done' : '' }; }),
        counts: { tasks: ach.tasksDone, stays: ach.stays, refs: ach.refs, videos: ach.watched, savings: money(contrib.total) },
        timeline: evs.map(function (e) { return { kind: e.kind, cls: e.cls === 'verified' ? 'done' : e.cls === 'info' ? 'now' : '', text: e.text, when: fmtDT(e.at) }; }), hasTimeline: evs.length > 0
      };

      /* passport header */
      var ps = this.passportScore(); var pp = out.pp || {};
      out.ph = {
        name: me.preferred || me.name, since: me.enrolledAt ? 'Member since ' + fmtShort(me.enrolledAt) : 'New member', score: ps.score, scoreLabel: ps.label, ringDash: Math.round(213.6 * (1 - ps.score / 100)),
        tiles: [{ val: pp.verifiedStays, lab: 'Verified stays' }, { val: pp.nights, lab: 'Verified nights' }, { val: pp.refs, lab: 'References' }, { val: contrib.credited, lab: 'Weeks contributed' }],
        indicators: [
          { label: 'Host ratings', value: ps.hostRatings ? ps.avg.toFixed(1) + ' / 5 (' + ps.hostRatings + ')' : 'None yet', cls: ps.avg >= 4 ? 'green' : 'neutral' },
          { label: 'Issues resolved', value: ps.incidents ? ps.resolved + ' of ' + ps.incidents : 'No issues', cls: 'green' },
          { label: 'Checkouts completed on record', value: String(ps.stays), cls: ps.stays ? 'green' : 'neutral' },
          { label: 'Housing readiness', value: (pp.readyDone || 0) + ' of ' + (pp.readyTotal || 0), cls: 'blue' },
          { label: 'Achievements', value: ach.done + ' of ' + ach.total, cls: 'blue' }
        ],
        share: function () { self.setCs({ ppTab: 'share' }); }, milestones: function () { self.csGo('milestones'); }
      };
      return out;
    };

    /* modals */
    var _rvModal = P.rvModal;
    P.rvModal = function (out) {
      var r = _rvModal.call(this, out); var m = this.state.modal; var self = this; var f = this.state.forms; var p = this.state.cs.player; var b = out.b || {};
      r.M.isGoogle = !!(m && m.kind === 'google');
      r.M.google = { accounts: GOOGLE_ACCOUNTS.map(function (a) { return { name: a.name, email: a.email, note: a.note, av: pic(a.av), initials: H.initialsOf(a.name), pick: function () { self.ob2GooglePick(a); } }; }), other: function () { self.setState({ modal: null }); self.setOb2({ emailOpen: true }); } };
      r.M.isVideo = !!(m && m.kind === 'video');
      r.M.video = p ? { pct: p.pct, done: p.done, playing: !p.done, img: pic(p.img || 'ill_shelf'), label: p.done ? 'Watched' : 'Playing… ' + p.pct + '%', cls: p.done ? 'done' : '' } : { pct: 0, done: false, playing: true, img: pic('ill_shelf'), label: '', cls: '' };
      var c = this.contributions();
      r.M.isRedeem = !!(m && m.kind === 'redeem'); r.M.redeem = { max: money(c.available, true), submit: function () { self.svSubmitRedeem(); }, busy: !!b.redeem };
      r.M.isEmergency = !!(m && m.kind === 'emergency'); r.M.emergency = { max: money(c.available, true), hasSavings: c.available > 0, noSavings: c.available <= 0, submit: function () { self.svSubmitEmergency(); }, busy: !!b.emergency, reasons: ['Food and essentials', 'Transport', 'Medical or pharmacy', 'Safety', 'Phone or connectivity', 'Something else'].map(function (x) { return { value: x, label: x }; }) };
      void f;
      return r;
    };

    return Core;
  };
})(typeof window !== 'undefined' ? window : this);
