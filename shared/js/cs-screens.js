/* Steady Couch Surfer screens: onboarding, home, results, housing goals, education, savings, milestones,
   passport header, tab bar, modals. Authored as template nodes and registered as slots for the runtime. */
(function (global) {
  'use strict';
  var S = global.SteadySite = global.SteadySite || { slots: {} }; S.slots = S.slots || {};
  function kids(args, from) { var out = []; for (var i = from; i < args.length; i++) { var k = args[i]; if (k === null || k === undefined || k === false) continue; out.push(k); } return out; }
  function el(tag, attrs) { return [tag, attrs || {}, kids(arguments, 2)]; }
  function v(path) { return { $: path }; }
  function iff(cond) { return { 'if': cond, c: kids(arguments, 1) }; }
  function each(list, as) { return { 'for': list, as: as, c: kids(arguments, 2) }; }
  function group() { return { 'if': 'true', c: kids(arguments, 0) }; }
  S.tpl = { el: el, v: v, iff: iff, each: each, group: group, kids: kids };
  var SVG = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
  var PATHS = {
    back: 'm15 6-6 6 6 6', fwd: 'm9 6 6 6-6 6', check: 'm5 12 5 5 9-10', play: 'M8 5v14l11-7z', home: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-3.5-3.5', bed: 'M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M7 10V7h10v3', passport: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm6 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 17h6',
    learn: 'M4 5a2 2 0 0 1 2-2h7v16H6a2 2 0 0 0-2 2zm9-2h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2h-5', more: 'M5 12h.01M12 12h.01M19 12h.01', pin: 'M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2', house: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z', flag: 'M5 21V4h11l-1.5 4L16 12H5', spark: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', ext: 'M14 4h6v6M20 4l-9 9M5 8v11h11', phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'
  };
  S.tpl.PATHS = PATHS;
  function icon(name, size, extra) { var a = Object.assign({}, SVG, extra || {}); if (size) { a.width = String(size); a.height = String(size); } return el('svg', a, el('path', { d: PATHS[name] })); }
  S.tpl.icon = icon;
  function checkSvg() { return el('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, el('path', { d: PATHS.check })); }
  function chk(checkedPath, onChange, label, extraCls) { return el('label', { 'class': 'chk ' + (extraCls || 'green') }, el('input', { type: 'checkbox', checked: v(checkedPath), onChange: v(onChange) }), el('span', { 'class': 'box' }, checkSvg()), el('span', {}, label)); }
  S.tpl.checkSvg = checkSvg; S.tpl.chk = chk;
  function field(id, label, attrs, type) { return el('div', { 'class': 'field' }, el('label', { 'for': id }, label), el(type === 'textarea' ? 'textarea' : 'input', Object.assign({ id: id, 'class': type === 'textarea' ? 'textarea' : ['input ', v('ob2.inv.' + id)], name: id, value: v('f.' + id), onChange: v('onField') }, attrs || {}))); }
  function gIcon() { return el('svg', { 'class': 'g', viewBox: '0 0 48 48', 'aria-hidden': 'true' }, el('path', { fill: '#EA4335', d: 'M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z' }), el('path', { fill: '#4285F4', d: 'M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.4-4.6 7.1l7.5 5.8c4.4-4 6.8-10 6.8-17.4z' }), el('path', { fill: '#FBBC05', d: 'M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z' }), el('path', { fill: '#34A853', d: 'M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z' })); }
  S.tpl.field = field; S.tpl.gIcon = gIcon;
  function h1(t, sub) { return el('div', {}, el('h1', { 'class': 'h1' }, t), sub ? el('p', { 'class': 'sub' }, sub) : null); }
  function h2(t, sub) { return el('div', {}, el('h2', { 'class': 'h2' }, t), sub ? el('p', { 'class': 'sub', style: 'margin-top: 4px' }, sub) : null); }
  function bar(pctPath, cls) { return el('div', { 'class': 'bar ' + (cls || '') }, el('i', { style: ['width: ', v(pctPath), '%'] })); }
  function ring(pctPath, dashPath, cls) { return el('div', { 'class': 'ring ' + (cls || '') }, el('svg', { viewBox: '0 0 84 84', 'aria-hidden': 'true' }, el('circle', { 'class': 'bg', cx: '42', cy: '42', r: '34' }), el('circle', { 'class': 'fg', cx: '42', cy: '42', r: '34', 'stroke-dasharray': '213.6', 'stroke-dashoffset': v(dashPath) })), el('div', { 'class': 'txt' }, v(pctPath), '%')); }
  S.tpl.h1 = h1; S.tpl.h2 = h2; S.tpl.bar = bar; S.tpl.ring = ring;
  function backBtn(action) { return el('button', { 'class': 'btn ghost sm', style: 'align-self: flex-start; margin-left: -12px', onClick: v(action) }, icon('back', 18), 'Back'); }
  function skeletonCards() { return el('div', { 'class': 'stack' }, el('div', { 'class': 'skcard' }, el('div', { 'class': 'sk', style: 'height: 150px' }), el('div', { 'class': 'sk', style: 'height: 18px; width: 70%' }), el('div', { 'class': 'sk', style: 'height: 14px; width: 45%' })), el('div', { 'class': 'skcard' }, el('div', { 'class': 'sk', style: 'height: 150px' }), el('div', { 'class': 'sk', style: 'height: 18px; width: 60%' }), el('div', { 'class': 'sk', style: 'height: 14px; width: 50%' }))); }

  S.tpl.backBtn = backBtn; S.tpl.skeletonCards = skeletonCards;
  /* ---------------- onboarding ---------------- */
  var pickCard = function (as, extraCls, withSub) { return el('button', { 'class': ['pick ' + (extraCls || '') + ' ', v(as + '.on')], onClick: v(as + '.pick'), 'aria-pressed': v(as + '.on') }, el('span', { 'class': 'ic' }, el('img', { src: v(as + '.img'), alt: '' })), el('span', { 'class': 'nm' }, v(as + '.label')), withSub ? el('span', { 'class': 'sm' }, v(as + '.sub')) : null); };
  S.slots.csOnboarding = iff('csS.onboard',
    el('div', { 'class': 'ob-top' },
      el('button', { 'class': 'iconbtn', 'aria-label': 'Back', onClick: v('ob2.back') }, icon('back')),
      el('div', { 'class': 'stepdots grow', 'aria-label': 'Setup progress' }, each('ob2.dots', 'd', el('i', { 'class': v('d.on') }))),
      el('span', { 'class': 'tiny' }, v('ob2.stepLabel'))),
    el('div', { 'class': 'cs-body scroll screen' },
      iff('ob2.sAccount', el('div', { 'class': 'stack loose', style: 'padding-top: 8px' },
        el('div', { 'class': 'brand' }, el('img', { 'class': 'logo', src: '/assets/img/logo.png', alt: 'Steady', loading: 'eager' })),
        el('img', { 'class': 'ill', src: '/assets/img/ill_door.png', alt: '', style: 'width: 190px; align-self: center', loading: 'eager' }),
        h1('Let’s find you somewhere steady.', 'Short, supported stays with verified hosts. Setting up takes about three minutes.'),
        iff('ob2.signedIn', el('div', { 'class': 'note green' }, 'Signed in as ', el('b', {}, v('ob2.signedInAs')), '. Let’s update your profile.'), el('button', { 'class': 'btn primary block lg', onClick: v('ob2.next') }, 'Continue')),
        iff('isGuest',
          el('button', { 'class': 'gbtn', onClick: v('ob2.google'), disabled: v('ob2.nextDisabled') }, gIcon(), 'Continue with Google'),
          iff('ob2.emailOpen',
            el('div', { 'class': 'card stack tight pop' },
              field('ob_email', 'Email', { type: 'email', autocomplete: 'username', inputmode: 'email' }),
              field('ob_password', 'Create a password', { type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' }),
              el('button', { 'class': 'btn primary block lg', onClick: v('ob2.emailContinue'), disabled: v('ob2.nextDisabled') }, iff('ob2.busy', el('span', { 'class': 'spin' })), 'Create account'))),
          el('button', { 'class': 'btn secondary block lg', onClick: v('ob2.toggleEmail') }, 'Continue with email'),
          el('p', { 'class': 'tiny center' }, 'Already have an account? ', el('a', { href: '/couchsurfer/login' }, 'Sign in'))),
        el('p', { 'class': 'tiny center' }, 'By continuing you agree to Steady’s privacy notice. We only ask for what the program needs, and say why.'))),
      iff('ob2.sPhone', el('div', { 'class': 'stack' },
        el('img', { 'class': 'ill', src: '/assets/img/stk_chat.png', alt: '', style: 'width: 72px' }),
        h2('Your mobile number', 'So your host and support worker can reach you. Never shared with anyone else.'),
        field('ob_phone', 'Mobile', { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '04xx xxx xxx' }),
        iff('ob2.otpSent',
          el('div', { 'class': 'card soft stack tight' },
            el('div', { 'class': 'h4' }, 'Enter the 6-digit code'),
            el('div', { 'class': 'otp' }, el('input', { id: 'ob_code', 'class': ['input ', v('ob2.inv.ob_code')], name: 'ob_code', inputmode: 'numeric', maxlength: '6', placeholder: '000000', value: v('f.ob_code'), onChange: v('onField'), 'aria-label': 'Verification code' })),
            el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn primary grow', onClick: v('ob2.verifyCode') }, 'Verify'), el('button', { 'class': 'btn ghost', onClick: v('ob2.sendCode') }, 'Resend')),
            el('p', { 'class': 'tiny' }, 'Demo: no SMS is sent. Any 6 digits work.'))),
        iff('ob2.phoneVerified', el('span', { 'class': 'badge verified nodot', style: 'align-self: flex-start' }, 'Verified')),
        el('div', { 'class': 'btnrow' },
          iff('ob2.otpSent', null),
          el('button', { 'class': 'btn secondary grow', onClick: v('ob2.sendCode') }, 'Send me a code'),
          el('button', { 'class': 'btn ghost', onClick: v('ob2.skipPhone') }, 'Skip for now')))),
      iff('ob2.sAbout', el('div', { 'class': 'stack' },
        h2('About you', 'Your preferred name is what hosts see. Your legal name stays private.'),
        field('ob_prefname', 'Preferred name', { autocomplete: 'given-name' }),
        field('ob_legalname', 'Legal name', { autocomplete: 'name' }),
        field('ob_dob', 'Date of birth', { type: 'date' }),
        el('p', { 'class': 'tiny' }, 'The pilot is for people aged 16 to 24.'))),
      iff('ob2.sSituation', el('div', { 'class': 'stack' },
        h2('Where are you staying right now?', 'Pick the closest. It helps us prioritise and get the right support to you.'),
        el('div', { 'class': 'pick-grid' }, each('ob2.situations', 'x', pickCard('x', 'sq', true))))),
      iff('ob2.sEmergency', el('div', { 'class': 'stack' },
        h2('Emergency contact', 'Someone we can call if we’re worried about you. Optional, and only used in an emergency.'),
        field('ob_ec_name', 'Their name', { autocomplete: 'off' }),
        field('ob_ec_phone', 'Their mobile', { type: 'tel', inputmode: 'tel' }),
        field('ob_ec_rel', 'Relationship (optional)', { placeholder: 'e.g. Aunt, friend, caseworker' }),
        el('label', { 'class': 'chk big' }, el('input', { type: 'checkbox', name: 'ob_ec_consent', checked: v('f.ob_ec_consent'), onChange: v('onField') }), el('span', { 'class': 'box' }, checkSvg()), el('span', {}, 'They’re happy to be contacted in an emergency')),
        el('button', { 'class': 'btn ghost sm', style: 'align-self: flex-start', onClick: v('ob2.skipEc') }, 'Skip this step'))),
      iff('ob2.sAreas', el('div', { 'class': 'stack' },
        h2('Where would you like to stay?', 'Choose one or more areas. You can change this any time.'),
        el('div', { 'class': 'pick-grid' }, each('ob2.areas', 'a', el('button', { 'class': ['pick area ', v('a.on')], onClick: v('a.toggle'), 'aria-pressed': v('a.on') }, el('img', { src: v('a.img'), alt: '' }), el('span', { 'class': 'nm' }, v('a.name'))))),
        el('p', { 'class': 'tiny' }, v('ob2.areaCount'), ' selected'))),
      iff('ob2.sEducation', el('div', { 'class': 'stack' },
        h2('Study and learning', 'Education is part of Steady. Where are you up to?'),
        el('div', { 'class': 'pick-grid' }, each('ob2.eduStatus', 'x', pickCard('x', '', false))),
        iff('ob2.asksInterest', el('div', { 'class': 'card soft stack tight pop' }, el('div', { 'class': 'h4' }, 'Interested in studying?'), el('div', { 'class': 'chips' }, each('ob2.interest', 'i', el('button', { 'class': ['chip ', v('i.on')], onClick: v('i.pick') }, v('i.label')))))),
        iff('ob2.asksPathway', el('div', { 'class': 'stack tight pop' }, el('div', { 'class': 'h4' }, 'Which pathway appeals most?'), el('div', { 'class': 'pick-grid' }, each('ob2.pathways', 'p', pickCard('p', '', true))))),
        el('p', { 'class': 'tiny' }, 'No pressure. You can explore courses and short videos in the app whenever you like.'))),
      iff('ob2.errShown', el('div', { 'class': 'note red' }, v('ob2.err'))),
      iff('ob2.showNav', el('div', { 'class': 'btnrow', style: 'margin-top: auto; padding-top: 16px' },
        el('button', { 'class': 'btn outline lg', onClick: v('ob2.back') }, 'Back'),
        el('button', { 'class': 'btn primary grow lg', onClick: v('ob2.next'), disabled: v('ob2.nextDisabled') }, iff('ob2.busy', el('span', { 'class': 'spin' })), v('ob2.nextLabel'))))));

  /* ---------------- home: search first, then goals ---------------- */
  S.slots.homeSearch = el('div', { 'class': 'search-card stack tight' },
    el('div', { 'class': 'row between' }, el('span', { 'class': 'eyebrow', style: 'color: rgba(255,255,255,.6)' }, 'Find a stay'), el('span', { 'class': 'tiny' }, el('b', { style: 'color: #fff' }, v('resultCount')), ' rooms match')),
    el('div', { 'class': 'h2' }, 'Where would you like to stay?'),
    el('div', { 'class': 'inputwrap' }, el('span', { 'class': 'ico' }, icon('pin')), el('label', { 'class': 'vh', 'for': 'hs_area' }, 'Area'), el('select', { id: 'hs_area', 'class': 'select input', name: 's_area', value: v('f.s_area'), onChange: v('onSearchField') }, el('option', { value: 'any' }, 'Anywhere in Sydney'), each('areaOptions', 'a', el('option', { value: v('a.id') }, v('a.name'))))),
    el('div', { 'class': 'formgrid' },
      el('div', { 'class': 'inputwrap' }, el('span', { 'class': 'ico' }, icon('cal')), el('label', { 'class': 'vh', 'for': 'hs_start' }, 'Move-in from'), el('input', { id: 'hs_start', 'class': 'input', type: 'date', name: 's_start', value: v('f.s_start'), onChange: v('onSearchField') })),
      el('div', { 'class': 'inputwrap' }, el('span', { 'class': 'ico' }, icon('clock')), el('label', { 'class': 'vh', 'for': 'hs_weeks' }, 'Stay length'), el('select', { id: 'hs_weeks', 'class': 'select input', name: 's_weeks', value: v('f.s_weeks'), onChange: v('onSearchField') }, el('option', { value: 'any' }, 'Any length'), el('option', { value: '2' }, '2 weeks'), el('option', { value: '4' }, '4 weeks'), el('option', { value: '6' }, '6 weeks'), el('option', { value: '8' }, '8 weeks')))),
    el('div', { 'class': 'chips' }, each('filterChips', 'c', el('button', { 'class': ['chip ', v('c.on')], onClick: v('c.toggle'), 'aria-pressed': v('c.pressed') }, v('c.label')))),
    el('button', { 'class': 'btn blue block lg', onClick: v('hm.search') }, icon('search', 18), 'Search stays'));
  S.slots.homeSections = group(
    el('div', { 'class': 'goal-row' },
      el('button', { 'class': 'goal', onClick: v('csGoHousing') }, el('span', { 'class': 'ic house' }, icon('house', 18)), el('span', { 'class': 'nm' }, 'Housing goals'), el('span', { 'class': 'sm' }, v('hm.housing.sub')), bar('hm.housing.pct', 'thin')),
      el('button', { 'class': 'goal', onClick: v('csGoEducation') }, el('span', { 'class': 'ic edu' }, icon('learn', 18)), el('span', { 'class': 'nm' }, 'Education goals'), el('span', { 'class': 'sm' }, v('hm.edu.sub'))),
      el('button', { 'class': 'goal', onClick: v('csGoMilestones') }, el('span', { 'class': 'ic flag' }, icon('flag', 18)), el('span', { 'class': 'nm' }, 'Milestones'), el('span', { 'class': 'sm' }, v('hm.ms.sub')), bar('hm.ms.pct', 'thin green')),
      el('button', { 'class': 'goal', onClick: v('csGoSavings') }, el('span', { 'class': 'ic save' }, icon('spark', 18)), el('span', { 'class': 'nm' }, 'Savings'), el('span', { 'class': 'sm' }, v('hm.savings'), ' available'), el('span', { 'class': 'sm' }, v('hm.savingsSub')))),
    el('div', { 'class': 'card stack', style: 'border-color: var(--blue-tint2)' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'eyebrow' }, 'Your next step'), iff('ns.postponed', el('span', { 'class': 'pill amber' }, 'Postponed'))),
      el('div', { 'class': 'h3' }, v('ns.title')),
      el('p', { 'class': 'small' }, v('ns.why')),
      el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn primary sm', onClick: v('ns.go') }, v('ns.cta')), el('button', { 'class': 'btn outline sm', onClick: v('ns.done') }, 'Mark done'), el('button', { 'class': 'btn ghost sm', onClick: v('ns.later') }, 'Later'))),
    el('div', { 'class': 'quick' },
      el('button', { 'class': 'card-btn', onClick: v('csGoPassport') }, el('span', { 'class': 'eyebrow' }, 'Rental Passport'), el('span', { 'class': 'val' }, v('pp.verifiedStays')), el('span', { 'class': 'lab' }, 'verified stays · ', v('pp.refs'), ' references')),
      el('button', { 'class': 'card-btn', onClick: v('csGoBudget') }, el('span', { 'class': 'eyebrow' }, 'Budget runway'), el('span', { 'class': 'val' }, v('bg.runwayShort')), el('span', { 'class': 'lab' }, 'income, spending and your bond goal')),
      el('button', { 'class': 'card-btn', onClick: v('csGoPathways') }, el('span', { 'class': 'eyebrow' }, 'Pathways'), el('span', { 'class': 'val' }, v('savedOppCount')), el('span', { 'class': 'lab' }, 'saved · study, work, support')),
      el('button', { 'class': 'card-btn', onClick: v('csGoHelp') }, el('span', { 'class': 'eyebrow' }, 'Help and safety'), el('span', { 'class': 'val' }, '24/7'), el('span', { 'class': 'lab' }, 'support, reports, emergencies'))));

  /* ---------------- results ---------------- */
  var listingCard = el('button', { 'class': 'listing-card', onClick: v('l.open') },
    el('div', { 'class': ['photo img ', v('l.photoClass')], style: 'position: relative' }, el('img', { src: v('l.coverSrc'), alt: v('l.coverLabel') }), el('span', { 'class': 'photocap' }, v('l.coverLabel')), iff('l.isNew', el('span', { 'class': 'badge approved nodot', style: 'position: absolute; top: 10px; left: 10px' }, 'New'))),
    el('div', { 'class': 'row between start', style: 'padding: 0 6px' },
      el('div', { 'class': 'grow' }, el('div', { 'class': 'h4' }, v('l.title')), el('div', { 'class': 'small' }, v('l.suburb'), ' · ', v('l.areaName'), ' · ', v('l.roomType'))),
      el('span', { 'class': ['badge ', v('l.statusClass'), ' nodot'] }, v('l.statusLabel'))),
    el('div', { 'class': 'row between', style: 'padding: 0 6px' },
      el('div', { 'class': 'row' }, el('img', { 'class': 'avatar sm', src: v('l.hostAvatar'), alt: '' }), el('span', { 'class': 'small ink' }, v('l.hostName'))),
      el('span', { 'class': 'small' }, 'From ', v('l.fromLabel'), ' · ', v('l.durationLabel'))),
    iff('l.matchNoteShown', el('span', { 'class': 'pill green', style: 'margin: 0 6px; align-self: flex-start' }, v('l.matchNote'))));
  S.slots.csResults = iff('csS.results', el('div', { 'class': 'stack screen' },
    el('div', { 'class': 'row between start' }, h1(['Stays in ', v('rs.title')].length ? el('span', {}, 'Stays in ', v('rs.title')) : '', v('rs.sub')), el('button', { 'class': 'btn outline sm', onClick: v('rs.edit') }, 'Edit search')),
    iff('searchLoading', skeletonCards()),
    iff('searchReady',
      el('div', { 'class': 'row between' }, el('span', { 'class': 'small' }, el('b', {}, v('resultCount')), ' ', v('resultWord'), ' match'), el('span', { 'class': 'tiny' }, 'Suburb-level locations only')),
      iff('noResults', el('div', { 'class': 'empty' }, el('div', { 'class': 'h4' }, 'No rooms match yet'), el('p', { 'class': 'small' }, 'Try another area, a later date or fewer filters. New rooms are approved every week.'), el('button', { 'class': 'btn secondary sm', onClick: v('clearFilters') }, 'Clear filters'))),
      each('results', 'l', listingCard))));

  /* ---------------- housing goals ---------------- */
  S.slots.csHousing = iff('csS.housing', el('div', { 'class': 'stack screen' },
    backBtn('csGoHome'),
    el('div', { 'class': 'row start' }, el('div', { 'class': 'grow' }, h1('Housing goals', 'Your path from here to a place of your own, one step at a time.')), el('img', { 'class': 'ill', src: '/assets/img/ill_passport_path.png', alt: '', style: 'width: 92px' })),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'h4' }, 'Progress'), el('span', { 'class': 'small strong' }, v('hg.done'), ' of ', v('hg.total'))),
      bar('hg.pct', 'green'),
      el('p', { 'class': 'small' }, 'Next: ', el('b', {}, v('hg.nextLabel')))),
    el('div', { 'class': 'card stack tight' },
      each('hg.steps', 's', el('div', { 'class': ['hstep ', v('s.cls')] },
        el('span', { 'class': 'n' }, iff('s.done', icon('check', 14, { 'stroke-width': '3' })), iff('s.now', '→')),
        el('div', { 'class': 't' }, el('b', {}, v('s.label')), el('span', {}, v('s.hint')),
          iff('s.now', el('div', { 'class': 'btnrow', style: 'margin-top: 8px' }, el('button', { 'class': 'btn primary sm', onClick: v('s.go') }, v('s.cta')), iff('s.hasAlt', el('button', { 'class': 'btn ghost sm', onClick: v('s.alt') }, v('s.altLabel'))))))))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'h4' }, 'Housing tasks'), el('span', { 'class': 'small strong' }, v('pp.readyDone'), ' of ', v('pp.readyTotal'))),
      el('p', { 'class': 'small' }, 'The things landlords and support providers ask for. Tick them off as you go.'),
      each('readiness', 'm', chk('m.done', 'm.toggle', v('m.label')))),
    el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn secondary grow', onClick: v('csGoPassport') }, 'Open Rental Passport'), el('button', { 'class': 'btn outline', onClick: v('csGoStatus') }, 'My requests'))));

  /* ---------------- education ---------------- */
  var courseCard = function (as) { return el('button', { 'class': 'course', onClick: v(as + '.open') },
    el('span', { 'class': 'thumb' }, el('img', { src: v(as + '.img'), alt: '' })),
    el('span', { 'class': 'body' },
      el('span', { 'class': 'row between start' }, el('span', { 'class': 'h4' }, v(as + '.title')), el('span', { 'class': ['badge nodot ', v(as + '.stageCls')] }, v(as + '.stageLabel'))),
      el('span', { 'class': 'small' }, v(as + '.provider'), ' · ', v(as + '.duration')),
      el('span', { 'class': 'tiny' }, v(as + '.cost')),
      iff(as + '.started', bar(as + '.pct', 'thin')))); };
  var videoRow = function (as, showCourse) { return el('div', { 'class': 'video' },
    el('button', { 'class': ['play ', v(as + '.cls')], onClick: v(as + '.watch'), 'aria-label': 'Play' }, iff(as + '.watched', icon('check', 18, { 'stroke-width': '3' })), el('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true', style: 'display: none' }, el('path', { d: PATHS.play }))),
    el('div', { 'class': 't' }, el('b', {}, v(as + '.title')), el('span', {}, showCourse ? v(as + '.course') : '', showCourse ? ' · ' : '', v(as + '.mins'))),
    iff(as + '.watched', el('span', { 'class': 'pill green' }, 'Watched')),
    el('button', { 'class': 'btn outline xs', onClick: v(as + '.watch') }, 'Watch')); };
  S.slots.csEducation = iff('csS.education', el('div', { 'class': 'stack screen' },
    el('div', { 'class': 'row start' }, el('div', { 'class': 'grow' }, h1('Education goals', v('ed.summary'))), el('img', { 'class': 'ill', src: '/assets/img/ill_shelf.png', alt: '', style: 'width: 92px' })),
    el('div', { 'class': 'card tint stack tight' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'eyebrow' }, 'Your pathway'), el('span', { 'class': 'pill blue' }, v('ed.statusLabel'))),
      el('div', { 'class': 'h3' }, v('ed.pathwayLabel')),
      el('div', { 'class': 'chips' }, each('ed.pathwayChips', 'c', el('button', { 'class': ['chip ', v('c.on')], onClick: v('c.pick'), 'aria-pressed': v('c.pressed') }, v('c.label'))))),
    iff('ed.hasMine', el('div', { 'class': 'stack tight' }, el('div', { 'class': 'h4' }, 'In progress'), each('ed.mine', 'c', courseCard('c')))),
    el('div', { 'class': 'row between' }, el('div', { 'class': 'h4' }, 'Explore courses'), el('span', { 'class': 'tiny' }, 'Demo entries · verify intakes')),
    el('div', { 'class': 'chips' }, each('ed.filters', 'c', el('button', { 'class': ['chip ', v('c.on')], onClick: v('c.pick'), 'aria-pressed': v('c.pressed') }, v('c.label')))),
    each('ed.courses', 'c', courseCard('c')),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('div', { 'class': 'h4' }, 'Short videos'), el('span', { 'class': 'small strong' }, v('ed.watched'), ' of ', v('ed.videoTotal'), ' watched')),
      el('p', { 'class': 'small' }, 'Two to five minutes each. Watch a course’s videos before you apply.'),
      each('ed.videos', 'vd', videoRow('vd', true))),
    el('div', { 'class': 'card dark stack tight' },
      el('div', { 'class': 'h3' }, 'Need a hand?'),
      el('p', { 'class': 'small' }, 'Steady sits with you through enrolment forms, fee-free checks and USI set-up. No question is too small.'),
      el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn light', onClick: v('ed.talk') }, 'Talk to Steady'), el('button', { 'class': 'btn ghost light', onClick: v('csGoPathways') }, 'Work, money and support')))));

  S.slots.csCourse = iff('csS.course', el('div', { 'class': 'stack screen' },
    backBtn('cd.back'),
    el('div', { 'class': 'row start' },
      el('span', { 'class': 'thumb', style: 'width: 84px; height: 84px; border-radius: 18px; background: var(--fill); display: inline-flex; align-items: center; justify-content: center; flex: none' }, el('img', { src: v('cd.img'), alt: '', style: 'width: 70px; height: 70px; object-fit: contain' })),
      el('div', { 'class': 'grow' }, el('h1', { 'class': 'h2' }, v('cd.title')), el('p', { 'class': 'sub' }, v('cd.provider'), ' · ', v('cd.level')))),
    el('div', { 'class': 'row wrap', style: 'gap: 6px' }, el('span', { 'class': 'pill blue' }, v('cd.type')), el('span', { 'class': 'pill' }, v('cd.duration')), el('span', { 'class': 'pill' }, v('cd.mode')), el('span', { 'class': 'pill green' }, v('cd.cost'))),
    el('p', { 'class': 'small ink' }, v('cd.blurb')),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'h4' }, 'Your progress'), el('span', { 'class': 'badge active nodot' }, v('cd.stageLabel'))),
      el('div', { 'class': 'stage' }, each('cd.stages', 's', el('div', { 'class': ['s ', v('s.cls')] }, el('span', { 'class': 'n' }, v('s.n')), el('span', {}, v('s.label'))))),
      bar('cd.pct', 'green')),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'h4' }, '1 · What you’ll need'),
      each('cd.requirements', 'r', el('div', { 'class': 'row start', style: 'gap: 8px' }, el('span', { 'class': 'pill green', style: 'flex: none' }, '✓'), el('span', { 'class': 'small ink' }, v('r.text')))),
      el('div', { 'class': 'h4', style: 'margin-top: 6px' }, 'Where it leads'),
      el('div', { 'class': 'chips' }, each('cd.pathways', 'p', el('span', { 'class': 'chip' }, v('p.text')))),
      el('div', { 'class': 'kv' }, el('span', {}, 'Next intake'), el('b', {}, v('cd.intake')))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('div', { 'class': 'h4' }, '2 · Watch the short videos'), el('span', { 'class': 'small strong' }, v('cd.vDone'), ' of ', v('cd.vTotal'))),
      each('cd.videos', 'vd', videoRow('vd', false))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('div', { 'class': 'h4' }, '3 · Get ready'), el('span', { 'class': 'small strong' }, v('cd.tDone'), ' of ', v('cd.tTotal'))),
      each('cd.tasks', 't', el('label', { 'class': 'chk green' }, el('input', { type: 'checkbox', checked: v('t.done'), onChange: v('t.toggle') }), el('span', { 'class': 'box' }, checkSvg()), el('span', {}, el('b', {}, v('t.label')), el('br', {}), el('span', { 'class': 'small' }, v('t.hint')))))),
    el('div', { 'class': 'card green stack tight' },
      el('div', { 'class': 'h4' }, '4 · Ready and interested?'),
      el('p', { 'class': 'small' }, v('cd.readyHint')),
      iff('cd.ready', el('span', { 'class': 'badge approved nodot', style: 'align-self: flex-start' }, 'You’re ready to apply')),
      el('button', { 'class': 'btn primary block', onClick: v('cd.markReady'), disabled: v('cd.readyDisabled') }, 'I’m ready and interested')),
    el('div', { 'class': 'card stack tight', style: 'border-color: var(--blue-tint2)' },
      el('div', { 'class': 'h4' }, '5 · Apply with Steady beside you'),
      el('p', { 'class': 'small' }, 'An education adviser calls you, checks eligibility and fee-free status, and works through the application with you.'),
      iff('cd.connected', el('div', { 'class': 'note green' }, el('b', {}, 'Connected. '), 'An adviser will call within two business days. ', v('cd.connectedLabel'))),
      el('button', { 'class': 'btn secondary block', onClick: v('cd.connect'), disabled: v('cd.connectDisabled') }, iff('b.connect', el('span', { 'class': 'spin dark' })), 'Connect with Steady')),
    el('div', { 'class': 'btnrow' },
      el('button', { 'class': 'btn outline sm', onClick: v('cd.toggleInterest') }, iff('cd.interested', 'Saved to my interests ✓'), iff('cd.notInterested', 'Save to my interests')),
      el('a', { 'class': 'btn ghost sm', href: v('cd.href'), target: '_blank', rel: 'noopener' }, 'Provider page ', icon('ext', 14)))));

  /* ---------------- savings ---------------- */
  S.slots.csSavings = iff('csS.savings', el('div', { 'class': 'stack screen' },
    backBtn('csGoMore'),
    h1('Savings', 'A$20 of every weekly contribution you make is saved for you. Yours to keep and redeem whenever you need.'),
    el('div', { 'class': 'card dark stack tight' },
      el('span', { 'class': 'eyebrow', style: 'color: rgba(255,255,255,.6)' }, 'Available balance'),
      el('div', { 'class': 'bigmoney' }, v('sv.available')),
      el('div', { 'class': 'small' }, 'Total saved ', el('b', { style: 'color: #fff' }, v('sv.total')), ' · ', v('sv.weeks'), ' weeks credited'),
      iff('sv.hasPending', el('span', { 'class': 'pill amber', style: 'align-self: flex-start' }, v('sv.pending'), ' emergency access requested')),
      el('div', { 'class': 'btnrow', style: 'margin-top: 6px' }, el('button', { 'class': 'btn light grow', onClick: v('sv.redeem') }, 'Redeem savings'), el('button', { 'class': 'btn ghost light', onClick: v('sv.emergency') }, 'Emergency help'))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'h4' }, 'Every week of a stay'), el('span', { 'class': 'h4' }, v('sv.weekly'))),
      el('div', { 'class': 'split' }, el('i', { 'class': 'svc' }), el('i', { 'class': 'you' })),
      el('div', { 'class': 'split-leg' }, el('span', { 'class': 'svc' }, v('sv.svc'), ' Steady service'), el('span', { 'class': 'you' }, v('sv.sav'), ' your savings')),
      el('p', { 'class': 'small' }, 'For each week you are in a Steady stay you pay ', el('b', {}, v('sv.weekly')), '. ', el('b', {}, v('sv.svc')), ' is Steady\u2019s service fee. ', el('b', {}, v('sv.sav')), ' goes straight into your savings and stays yours. The first week is paid when your host accepts; after that, weekly.'),
      el('div', { 'class': 'kv' }, el('span', {}, 'Credited to your savings so far'), el('b', {}, v('sv.total'))),
      el('div', { 'class': 'kv' }, el('span', {}, 'Steady service contributions'), el('b', {}, v('sv.service'))),
      el('div', { 'class': 'kv' }, el('span', {}, 'Redeemed or accessed'), el('b', {}, v('sv.redeemed')))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'h4' }, 'Weekly contribution history'),
      iff('sv.hasHistory', each('sv.history', 'h', el('div', { 'class': 'contrib' }, el('span', { 'class': 'wk' }, v('h.week')), el('div', {}, el('div', { 'class': 'small ink strong' }, v('h.stay')), el('div', { 'class': 'tiny' }, v('h.date'), ' · ', v('h.svc'))), el('div', { 'class': 'amt good' }, v('h.you'), el('small', {}, v('h.status')))))),
      iff('sv.noHistory', el('div', { 'class': 'empty' }, el('div', { 'class': 'h4' }, 'No contributions yet'), el('p', { 'class': 'small' }, 'Your first weekly contribution is paid when a host accepts your request.')))),
    iff('sv.hasTx', el('div', { 'class': 'card stack tight' }, el('div', { 'class': 'h4' }, 'Redemptions and emergency access'), each('sv.tx', 't', el('div', { 'class': 'list-item' }, el('div', { 'class': 'grow' }, el('div', { 'class': 'small ink strong' }, v('t.label')), el('div', { 'class': 'tiny' }, v('t.when'))), el('span', { 'class': ['badge nodot ', v('t.cls')] }, v('t.status')), el('b', { 'class': 'money' }, v('t.amount')))))),
    el('div', { 'class': 'note' }, el('b', {}, 'In an emergency: '), 'ask for expedited access and we release what you need the same day where possible. If you need more than your savings, Steady connects you with a support agency.')));

  /* ---------------- milestones ---------------- */
  S.slots.csMilestones = iff('csS.milestones', el('div', { 'class': 'stack screen' },
    backBtn('csGoHome'),
    h1('Milestones', 'Everything you’ve achieved on the way to independence.'),
    el('div', { 'class': 'card stack' },
      el('div', { 'class': 'row' }, ring('ms.pct', 'ms.ringDash', 'green'), el('div', { 'class': 'grow' }, el('div', { 'class': 'h3' }, v('ms.done'), ' of ', v('ms.total'), ' unlocked'), el('p', { 'class': 'small' }, 'Progress towards independence: housing, savings and learning together.'))),
      el('div', { 'class': 'statgrid' },
        el('div', { 'class': 'stat' }, el('div', { 'class': 'val' }, v('ms.counts.stays')), el('div', { 'class': 'lab' }, 'Verified stays')),
        el('div', { 'class': 'stat' }, el('div', { 'class': 'val' }, v('ms.counts.tasks')), el('div', { 'class': 'lab' }, 'Tasks done')),
        el('div', { 'class': 'stat' }, el('div', { 'class': 'val' }, v('ms.counts.videos')), el('div', { 'class': 'lab' }, 'Videos watched')),
        el('div', { 'class': 'stat' }, el('div', { 'class': 'val' }, v('ms.counts.savings')), el('div', { 'class': 'lab' }, 'Saved')))),
    el('div', { 'class': 'h4' }, 'Achievements'),
    el('div', { 'class': 'badges' }, each('ms.badges', 'a', el('div', { 'class': ['ach ', v('a.cls')] }, el('span', { 'class': 'ic' }, el('img', { src: v('a.img'), alt: '' })), el('span', { 'class': 'nm' }, v('a.label')), el('span', { 'class': 'sm' }, v('a.sub'))))),
    iff('ms.hasTimeline', el('div', { 'class': 'card stack tight' }, el('div', { 'class': 'h4' }, 'Recent milestones'), el('div', { 'class': 'timeline' }, each('ms.timeline', 't', el('div', { 'class': 'tl' }, el('span', { 'class': ['dot ', v('t.cls')] }), el('div', {}, el('div', { 'class': 'small ink strong' }, v('t.text')), el('div', { 'class': 'tiny' }, v('t.kind'), ' · ', v('t.when')))))))),
    el('button', { 'class': 'btn secondary block', onClick: v('csGoPassport') }, 'See them in your Rental Passport')));

  /* ---------------- passport header ---------------- */
  S.slots.ppHeader = group(
    el('div', { 'class': 'pp-head' },
      el('div', { 'class': 'row between start' }, el('div', {}, el('span', { 'class': 'eyebrow', style: 'color: rgba(255,255,255,.6)' }, 'Rental Passport'), el('div', { 'class': 'h2', style: 'color: #fff; margin-top: 2px' }, v('ph.name')), el('div', { 'class': 'tiny' }, v('ph.since'))), el('img', { 'class': 'ill', src: '/assets/img/obj_passport.png', alt: '', style: 'width: 56px' })),
      el('div', { 'class': 'row' }, ring('ph.score', 'ph.ringDash'), el('div', { 'class': 'grow' }, el('div', { 'class': 'h3', style: 'color: #fff' }, 'Reliability: ', v('ph.scoreLabel')), el('p', { 'class': 'small' }, 'A factual record of verified stays, references and how stays went. Not a credit score.'))),
      el('div', { 'class': 'statgrid' }, each('ph.tiles', 't', el('div', { 'class': 'stat', style: 'background: rgba(255,255,255,.1)' }, el('div', { 'class': 'val', style: 'color: #fff' }, v('t.val')), el('div', { 'class': 'lab', style: 'color: rgba(255,255,255,.7)' }, v('t.lab'))))),
      el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn light grow', onClick: v('ph.share') }, 'Share my passport'), el('button', { 'class': 'btn ghost light', onClick: v('ph.milestones') }, 'Milestones'))),
    el('div', { 'class': 'card stack tight' },
      el('div', { 'class': 'h4' }, 'Reliability indicators'),
      each('ph.indicators', 'i', el('div', { 'class': 'ind' }, el('span', { 'class': 'small ink' }, v('i.label')), el('span', { 'class': ['pill ', v('i.cls')] }, v('i.value'))))));

  /* ---------------- more, tab bar ---------------- */
  var moreBtn = function (action, label, right) { return el('button', { 'class': 'card-btn row', onClick: v(action) }, el('span', { 'class': 'grow h4' }, label), right || null); };
  S.slots.csMore = iff('csS.more', el('div', { 'class': 'stack screen' },
    el('h1', { 'class': 'h1' }, 'More'),
    el('div', { 'class': 'stack tight' },
      moreBtn('csGoSavings', 'Savings and contributions', el('span', { 'class': 'small strong' }, v('sv.available'))),
      moreBtn('csGoHousing', 'Housing goals', el('span', { 'class': 'small' }, v('hg.done'), ' of ', v('hg.total'))),
      moreBtn('csGoEducation', 'Education goals', el('span', { 'class': 'small' }, v('ed.watched'), ' videos watched')),
      moreBtn('csGoMilestones', 'Milestones', el('span', { 'class': 'small' }, v('ms.done'), ' of ', v('ms.total'))),
      moreBtn('csGoPathways', 'Pathways: work, money, support', el('span', { 'class': 'small' }, v('savedOppCount'), ' saved')),
      moreBtn('csGoBudget', 'Budget runway', el('span', { 'class': 'small' }, v('bg.runwayShort'))),
      moreBtn('csGoStatus', 'My requests', el('span', { 'class': 'small' }, v('requestCount'))),
      moreBtn('csGoHelp', 'Help and safety'),
      moreBtn('csGoProfile', 'Profile and privacy'),
      moreBtn('csGoNotifications', 'Notifications', el('span', { 'class': 'small' }, v('csUnread'), ' unread')),
      moreBtn('csStartOnboarding', 'Update my profile', el('span', { 'class': 'small' }, '6 quick steps')),
      moreBtn('signOut', 'Sign out', el('span', { 'class': 'small' }, v('meEmail'))))));
  var tabBtn = function (key, action, label, iconName) { return el('button', { 'class': ['tab-item ', v('csTab.' + key)], onClick: v(action), 'aria-label': label }, icon(iconName, 22), el('span', {}, label)); };
  S.slots.csTabbar = el('nav', { 'class': 'tabbar', 'aria-label': 'Main' }, tabBtn('home', 'csGoHome', 'Home', 'home'), tabBtn('stay', 'csGoStay', 'Stay', 'bed'), tabBtn('passport', 'csGoPassport', 'Passport', 'passport'), tabBtn('learn', 'csGoEducation', 'Learn', 'learn'), tabBtn('more', 'csGoMore', 'More', 'more'));

  /* ---------------- request flow: how the weekly contribution works ---------------- */
  S.slots.rqContribution = el('div', { 'class': 'card green stack tight' },
    el('div', { 'class': 'h4' }, 'How the weekly contribution works'),
    el('div', { 'class': 'split' }, el('i', { 'class': 'svc' }), el('i', { 'class': 'you' })),
    el('div', { 'class': 'split-leg' }, el('span', { 'class': 'svc' }, 'A$30 Steady service'), el('span', { 'class': 'you' }, 'A$20 your savings')),
    el('div', { 'class': 'kv' }, el('span', {}, 'Each stay week you pay'), el('b', {}, 'A$50')),
    el('div', { 'class': 'kv' }, el('span', {}, 'Steady service fee over this stay'), el('b', {}, v('rqServiceEstimate'))),
    el('div', { 'class': 'kv' }, el('span', {}, 'Your savings over this stay'), el('b', { 'class': 'good' }, v('rqSavingsEstimate'))),
    el('div', { 'class': 'kv' }, el('span', {}, 'Rent to the host'), el('b', {}, 'None')),
    el('p', { 'class': 'tiny' }, 'Nothing is charged when you send a request. Once your host accepts you have 24 hours to pay the first week, then it is weekly during the stay. Savings are yours to redeem any time.'));

  /* ---------------- modals ---------------- */
  S.slots.csModals = group(
    iff('M.isGoogle', el('div', { 'class': 'stack tight' },
      each('M.google.accounts', 'a', el('button', { 'class': 'acct-pick', onClick: v('a.pick') }, el('span', { 'class': 'av' }, el('img', { src: v('a.av'), alt: '' })), el('span', {}, el('b', {}, v('a.name')), el('span', {}, v('a.email'), ' · ', v('a.note'))))),
      el('button', { 'class': 'acct-pick', onClick: v('M.google.other') }, el('span', { 'class': 'av' }, '+'), el('span', {}, el('b', {}, 'Use another account'), el('span', {}, 'Create an account with your email instead'))),
      el('p', { 'class': 'tiny' }, 'Demo: a simulated account picker. In production this is Google’s own sign-in screen and we receive only your name, email and date of birth with your consent.'))),
    iff('M.isVideo', el('div', { 'class': 'stack tight' },
      el('div', { 'class': 'player' }, el('img', { src: v('M.video.img'), alt: '' }), el('span', { 'class': ['big ', v('M.video.cls')] }, iff('M.video.done', icon('check', 30, { 'stroke-width': '3' })), iff('M.video.playing', el('svg', { width: '28', height: '28', viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, el('path', { d: PATHS.play })))), el('div', { 'class': 'scrub' }, el('i', { style: ['width: ', v('M.video.pct'), '%'] }))),
      el('div', { 'class': 'row between' }, el('span', { 'class': 'small strong' }, v('M.video.label')), el('span', { 'class': 'tiny' }, 'Demo player: a short simulated clip')),
      el('div', { 'class': 'btnrow end' }, el('button', { 'class': 'btn primary', onClick: v('closeModal') }, iff('M.video.done', 'Done'), iff('M.video.playing', 'Close'))))),
    iff('M.isRedeem', el('div', { 'class': 'stack tight' },
      el('div', { 'class': 'note green' }, 'Available to redeem: ', el('b', {}, v('M.redeem.max'))),
      el('div', { 'class': 'field' }, el('label', { 'for': 'sv_amount' }, 'Amount (A$)'), el('input', { id: 'sv_amount', 'class': 'input', name: 'sv_amount', inputmode: 'decimal', value: v('f.sv_amount'), onChange: v('onField') })),
      el('div', { 'class': 'formgrid' },
        el('div', { 'class': 'field' }, el('label', { 'for': 'sv_bsb' }, 'BSB'), el('input', { id: 'sv_bsb', 'class': 'input', name: 'sv_bsb', inputmode: 'numeric', placeholder: '062-000', value: v('f.sv_bsb'), onChange: v('onField') })),
        el('div', { 'class': 'field' }, el('label', { 'for': 'sv_acc' }, 'Account number'), el('input', { id: 'sv_acc', 'class': 'input', name: 'sv_acc', inputmode: 'numeric', value: v('f.sv_acc'), onChange: v('onField') }))),
      el('p', { 'class': 'tiny' }, 'Demo: nothing you type here is sent anywhere. In production the transfer is made by Steady’s payment provider and only the last four digits are kept.'),
      el('div', { 'class': 'btnrow end' }, el('button', { 'class': 'btn outline', onClick: v('closeModal') }, 'Cancel'), el('button', { 'class': 'btn primary', onClick: v('M.redeem.submit'), disabled: v('M.redeem.busy') }, iff('M.redeem.busy', el('span', { 'class': 'spin' })), 'Redeem now')))),
    iff('M.isEmergency', el('div', { 'class': 'stack tight' },
      el('div', { 'class': 'field' }, el('label', { 'for': 'sv_reason' }, 'What do you need help with?'), el('select', { id: 'sv_reason', 'class': 'select', name: 'sv_reason', value: v('f.sv_reason'), onChange: v('onField') }, each('M.emergency.reasons', 'r', el('option', { value: v('r.value') }, v('r.label'))))),
      iff('M.emergency.hasSavings', el('div', { 'class': 'field' }, el('label', { 'for': 'sv_amount2' }, 'Expedited access to your savings (A$, up to ', v('M.emergency.max'), ')'), el('input', { id: 'sv_amount2', 'class': 'input', name: 'sv_amount', inputmode: 'decimal', value: v('f.sv_amount'), onChange: v('onField') }))),
      iff('M.emergency.noSavings', el('div', { 'class': 'note' }, 'You don’t have savings to draw on yet, so we’ll connect you with a support agency straight away.')),
      el('div', { 'class': 'field' }, el('label', { 'for': 'sv_note' }, 'Anything we should know? (optional)'), el('textarea', { id: 'sv_note', 'class': 'textarea', name: 'sv_note', rows: '3', value: v('f.sv_note'), onChange: v('onField') })),
      el('label', { 'class': 'chk big' }, el('input', { type: 'checkbox', name: 'sv_agency', checked: v('f.sv_agency'), onChange: v('onField') }), el('span', { 'class': 'box' }, checkSvg()), el('span', {}, 'Also connect me with a support agency')),
      el('p', { 'class': 'tiny' }, 'Not an emergency service. If you are in danger, call Triple Zero (000).'),
      el('div', { 'class': 'btnrow end' }, el('button', { 'class': 'btn outline', onClick: v('closeModal') }, 'Cancel'), el('button', { 'class': 'btn primary', onClick: v('M.emergency.submit'), disabled: v('M.emergency.busy') }, iff('M.emergency.busy', el('span', { 'class': 'spin' })), 'Send request')))));
})(typeof window !== 'undefined' ? window : this);
