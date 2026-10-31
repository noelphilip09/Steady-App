/* Steady Couch Surfer flow screens: verification step, selfie and Google sign-in sheets, the accepted-booking
   card with its payment timer, the "what happens next" summary, the host chat and its floating button. */
(function (global) {
  'use strict';
  var S = global.SteadySite; var T = S.tpl; var el = T.el, v = T.v, iff = T.iff, each = T.each, group = T.group, icon = T.icon, checkSvg = T.checkSvg, h2 = T.h2, bar = T.bar;

  /* ---- verification step, inserted into the onboarding body before "Where are you staying" ---- */
  var verify = iff('ob2.sVerify', el('div', { 'class': 'stack' },
    el('div', { 'class': 'row start' }, el('div', { 'class': 'grow' }, h2('Verify your identity', 'Everyone on Steady is verified, hosts and couch surfers, so stays are safe. About a minute.')), el('img', { 'class': 'ill', src: '/assets/img/ill_person_shield.png', alt: '', style: 'width: 84px' })),
    el('div', { 'class': 'vstep' },
      el('div', { 'class': ['s ', v('ob2.v.stepDoc')] }, el('span', { 'class': 'n' }, '1'), 'ID check'),
      el('div', { 'class': ['s ', v('ob2.v.stepSelfie')] }, el('span', { 'class': 'n' }, '2'), 'Selfie'),
      el('div', { 'class': ['s ', v('ob2.v.stepDone')] }, el('span', { 'class': 'n' }, '3'), 'Verified')),
    el('div', { 'class': 'stack tight' }, each('ob2.methods', 'm', el('button', { 'class': ['method ', v('m.on')], onClick: v('m.pick'), 'aria-pressed': v('m.on') }, el('span', { 'class': 'ic' }, el('img', { src: v('m.img'), alt: '' })), el('span', { 'class': 't' }, el('b', {}, v('m.label')), el('span', {}, v('m.sub'))), el('span', { 'class': 'dot' })))),
    iff('ob2.v.pending', el('div', { 'class': 'card soft row' }, el('span', { 'class': 'spin dark' }), el('span', { 'class': 'small ink' }, 'Checking with the identity provider…'))),
    iff('ob2.v.showDigital', el('button', { 'class': 'btn primary block lg', onClick: v('ob2.v.startDigital'), disabled: v('ob2.v.pending') }, icon('shield', 18), 'Continue with Digital ID')),
    iff('ob2.v.showScan', el('button', { 'class': 'btn primary block lg', onClick: v('ob2.v.startScan') }, icon('passport', 18), 'Scan my ID document')),
    iff('ob2.v.showSupport', el('button', { 'class': 'btn primary block lg', onClick: v('ob2.v.askSupport') }, 'Ask a support worker to verify me')),
    iff('ob2.v.canSelfie', el('div', { 'class': 'card green stack tight pop' },
      el('div', { 'class': 'row between' }, el('span', { 'class': 'h4' }, 'ID checked. Now a quick selfie.'), el('span', { 'class': 'badge approved nodot' }, 'Step 2')),
      el('p', { 'class': 'small' }, 'We match your face to the ID. It takes a few seconds and is never shown to hosts.'),
      el('button', { 'class': 'btn primary block', onClick: v('ob2.v.takeSelfie') }, 'Take a selfie'))),
    iff('ob2.v.verified', el('div', { 'class': 'card green row' }, el('span', { 'class': 'badge verified nodot' }, 'Verified'), el('span', { 'class': 'small ink' }, v('ob2.v.statusLabel')))),
    el('p', { 'class': 'tiny' }, 'Scans and selfies stay on your device until they are encrypted and sent to the verification provider. They are deleted after the check and never shown to hosts.')));
  var body = S.slots.csOnboarding.c[1]; var kids = body[2]; var idx = kids.findIndex(function (k) { return k && k['if'] === 'ob2.sSituation'; });
  kids.splice(idx < 0 ? 3 : idx, 0, verify);

  /* ---- home: accepted booking with the payment window ---- */
  S.slots.homeAccepted = iff('cur.awaitingAgreement', el('div', { 'class': 'card green stack pop' },
    el('div', { 'class': 'row between' }, el('span', { 'class': 'eyebrow' }, 'Request accepted'), el('span', { 'class': 'badge approved' }, 'Accepted')),
    el('div', { 'class': 'h3' }, v('cur.hostName'), ' accepted your request for ', v('cur.title')),
    el('div', { 'class': 'kv' }, el('span', {}, 'Dates'), el('b', {}, v('cur.startLabel'), ' → ', v('cur.endLabel'), ' (', v('cur.nights'), ' nights)')),
    iff('cur.payDue', el('div', { 'class': ['timer ', v('cur.payTimerCls')] }, el('div', {}, el('div', { 'class': 'clock', role: 'timer', 'aria-label': v('cur.payLeftLabel') }, v('cur.payLeft')), el('div', { 'class': 'lab' }, 'to pay your first week')), el('div', { 'class': 'grow stack tight', style: 'gap: 6px' }, el('div', { 'class': 'small ink strong' }, 'A$50 secures the room'), el('div', { 'class': 'tiny' }, 'A$30 Steady service fee · A$20 into your savings'), el('div', { 'class': 'bar amber thin' }, el('i', { style: ['width: ', v('cur.payPct'), '%'] })))),
      el('button', { 'class': 'btn primary block lg', onClick: v('cur.payNow') }, 'Pay A$50 now'),
      el('p', { 'class': 'tiny' }, 'Unpaid after ', v('cur.payDueLabel'), ' the room is released to others.')),
    iff('cur.paid',
      el('div', { 'class': 'row' }, el('span', { 'class': 'badge verified nodot' }, 'First week paid'), el('span', { 'class': 'tiny' }, v('cur.paidLabel'))),
      el('button', { 'class': 'btn primary block', onClick: v('openAgreement') }, 'Review and confirm agreement')),
    el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn outline sm', onClick: v('cur.openSummary') }, 'What happens next'), el('button', { 'class': 'btn outline sm', onClick: v('chat.open') }, 'Message ', v('cur.hostName')))));

  /* ---- floating chat button ---- */
  S.slots.csChatFab = iff('chat.available', el('button', { 'class': 'chat-fab', onClick: v('chat.open'), 'aria-label': 'Message your host' }, el('img', { src: v('chat.hostAvatar'), alt: '' }), 'Chat', iff('chat.hasUnread', el('span', { 'class': 'unread' }, v('chat.unread')))));

  /* ---- modals ---- */
  var modals = group(
    iff('M.isGsign', el('div', { 'class': 'gsign' },
      el('span', { 'class': 'av' }, el('img', { src: v('M.gsign.av'), alt: '' })),
      el('div', {}, el('div', { 'class': 'h3' }, v('M.gsign.name')), el('div', { 'class': 'small' }, v('M.gsign.email'))),
      el('div', { 'class': 'row', style: 'gap: 8px' }, el('span', { 'class': 'spin dark' }), el('span', { 'class': 'small strong' }, v('M.gsign.status'))),
      el('button', { 'class': 'btn ghost sm', onClick: v('M.gsign.switchAccount') }, 'Not you? Use a different Google account'))),
    iff('M.isSelfie', el('div', { 'class': 'stack tight' },
      el('div', { 'class': ['selfie ', v('M.selfie.cls')] }, el('img', { src: v('M.selfie.avatar'), alt: '' }), el('span', { 'class': 'face' }), el('span', { 'class': 'sweep' }), el('span', { 'class': 'flash' }), el('span', { 'class': 'st' }, v('M.selfie.label'))),
      iff('M.selfie.done', el('label', { 'class': 'chk big' }, el('input', { type: 'checkbox', checked: v('M.selfie.useAsPhoto'), onChange: v('M.selfie.toggleUse') }), el('span', { 'class': 'box' }, checkSvg()), el('span', {}, 'Use this photo on my profile'))),
      el('p', { 'class': 'tiny center' }, 'Demo: simulated camera. Nothing is captured or stored.'),
      el('div', { 'class': 'btnrow' }, el('button', { 'class': 'btn outline', onClick: v('M.selfie.retake'), disabled: v('M.selfie.busy') }, 'Retake'), el('button', { 'class': 'btn primary grow', onClick: v('M.selfie.use'), disabled: v('M.selfie.busy') }, iff('M.selfie.busy', el('span', { 'class': 'spin' })), 'Use this photo')))),
    iff('M.isPay', el('div', { 'class': 'stack tight' },
      el('div', { 'class': 'card soft stack tight' },
        el('div', { 'class': 'kv' }, el('span', {}, 'Room'), el('b', {}, v('M.pay.title'))),
        el('div', { 'class': 'kv' }, el('span', {}, 'First week'), el('b', { 'class': 'money' }, v('M.pay.amount'))),
        el('div', { 'class': 'split' }, el('i', { 'class': 'svc' }), el('i', { 'class': 'you' })),
        el('div', { 'class': 'split-leg' }, el('span', { 'class': 'svc' }, v('M.pay.svc'), ' Steady service'), el('span', { 'class': 'you' }, v('M.pay.sav'), ' your savings')),
        el('div', { 'class': 'kv' }, el('span', {}, 'Time left'), el('b', { 'class': 'money warn' }, v('M.pay.left')))),
      el('div', { 'class': 'row between' }, el('div', {}, el('div', { 'class': 'small ink strong' }, 'Payment method'), el('div', { 'class': 'small' }, v('M.pay.method'))), el('button', { 'class': 'btn outline xs', onClick: v('M.pay.addMethod') }, iff('M.pay.hasMethod', 'Change'), iff('M.pay.noMethod', 'Add card'))),
      el('p', { 'class': 'tiny' }, 'Demo: no money moves. In production the card is charged by Steady’s payment provider and A$20 is credited to your savings immediately.'),
      el('div', { 'class': 'btnrow end' }, el('button', { 'class': 'btn outline', onClick: v('closeModal') }, 'Later'), el('button', { 'class': 'btn primary', onClick: v('M.pay.submit'), disabled: v('M.pay.busy') }, iff('M.pay.busy', el('span', { 'class': 'spin' })), 'Pay ', v('M.pay.amount'))))),
    iff('M.isAccepted', el('div', { 'class': 'stack' },
      el('div', { 'class': 'row' }, el('img', { 'class': 'avatar lg', src: v('M.acc.hostAvatar'), alt: '' }), el('div', { 'class': 'grow' }, el('div', { 'class': 'h4' }, v('M.acc.title')), el('div', { 'class': 'small' }, v('M.acc.dates'), ' · ', v('M.acc.nights'), ' nights'))),
      el('div', { 'class': 'card soft stack tight' }, el('div', { 'class': 'h4' }, 'What happens next'), each('M.acc.steps', 's', el('div', { 'class': ['hstep ', v('s.cls')] }, el('span', { 'class': 'n' }, v('s.n')), el('div', { 'class': 't' }, el('b', {}, v('s.label')), el('span', {}, v('s.hint')))))),
      el('div', { 'class': 'card soft stack tight' },
        el('div', { 'class': 'h4' }, 'What’s expected'),
        each('M.acc.rules', 'r', el('div', { 'class': 'row start', style: 'gap: 8px' }, el('span', { 'class': 'pill' }, 'Rule'), el('span', { 'class': 'small ink' }, v('r.text')))),
        each('M.acc.chores', 'c', el('div', { 'class': 'row start', style: 'gap: 8px' }, el('span', { 'class': 'pill green' }, 'Chore'), el('span', { 'class': 'small ink' }, v('c.text')))),
        el('div', { 'class': 'kv' }, el('span', {}, 'Quiet hours'), el('b', {}, v('M.acc.noise'))),
        el('div', { 'class': 'kv' }, el('span', {}, 'Guests'), el('b', {}, v('M.acc.guests'))),
        el('p', { 'class': 'tiny' }, 'Be on time, keep shared spaces as you found them, and message your host if plans change. They’re here to help.')),
      el('div', { 'class': 'btnrow' }, iff('M.acc.paid', el('button', { 'class': 'btn primary grow', onClick: v('openAgreement') }, 'Confirm agreement')), iff('M.acc.unpaid', el('button', { 'class': 'btn primary grow', onClick: v('M.acc.pay') }, 'Pay first week')), el('button', { 'class': 'btn secondary', onClick: v('M.acc.chat') }, 'Message ', v('M.acc.host'))),
      el('button', { 'class': 'btn ghost block', onClick: v('M.acc.later') }, 'Later'))),
    iff('M.isChat', el('div', { 'class': 'stack tight' },
      el('div', { 'class': 'chat' },
        iff('M.chat.empty', el('div', { 'class': 'msg sys' }, 'Say hello to ', v('M.chat.hostName'), '. They usually reply within a few minutes.')),
        each('M.chat.messages', 'm', el('div', { 'class': ['msg ', v('m.cls')] }, v('m.text'), el('span', { 'class': 'when' }, v('m.when')))),
        iff('M.chat.typing', el('div', { 'class': 'typing' }, el('i', {}), el('i', {}), el('i', {})))),
      iff('M.chat.hasQuick', el('div', { 'class': 'chips' }, each('M.chat.quick', 'q', el('button', { 'class': 'chip', onClick: v('q.send') }, v('q.label'))))),
      el('div', { 'class': 'chatbar' }, el('input', { 'class': 'input', name: 'chat_text', placeholder: 'Write a message…', value: v('f.chat_text'), onChange: v('onField'), onKeyDown: v('M.chat.keyDown'), 'aria-label': 'Message' }), el('button', { 'class': 'send', onClick: v('M.chat.send'), 'aria-label': 'Send', disabled: v('M.chat.cannotSend') }, icon('fwd', 20))),
      el('p', { 'class': 'tiny' }, 'Messages are kept with your stay record. For emergencies call Triple Zero (000); for safety concerns use Help.'))));
  S.slots.csModals.c.push(modals);
})(typeof window !== 'undefined' ? window : this);
