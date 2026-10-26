#!/usr/bin/env node
'use strict';
/* Manage accounts from the command line.
   node server/users.js list
   node server/users.js add <couchsurfer|host|dashboard> <email> <password> [--name "Full name"] [--role viewer|analyst|admin]
   node server/users.js remove <app> <email>
   node server/users.js passwd <app> <email> <newPassword> */
const path = require('path');
const crypto = require('crypto');
const { JsonFile } = require('./store');
const auth = require('./auth');
const core = require('./core-node');
const DATA_DIR = process.env.STEADY_DATA_DIR || path.join(__dirname, 'data');
const accountsFile = new JsonFile(path.join(DATA_DIR, 'accounts.json'), () => ({ accounts: [] }));
const stateFile = new JsonFile(path.join(DATA_DIR, 'state.json'), null);
const data = accountsFile.load(); const accounts = data.accounts || [];
const [cmd, app, email, password] = process.argv.slice(2);
const flag = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
const APPS = ['couchsurfer', 'host', 'dashboard'];
function save() { accountsFile.save({ accounts }); }
if (cmd === 'list') { accounts.forEach(a => console.log(a.app.padEnd(12), a.email.padEnd(32), (a.role || a.participantId || a.hostId || '').padEnd(14), a.demo ? 'demo' : '')); process.exit(0); }
if (!APPS.includes(app) || !email) { console.log(require('fs').readFileSync(__filename, 'utf8').split('\n').slice(2, 7).join('\n')); process.exit(1); }
const em = email.toLowerCase(); const existing = accounts.find(a => a.app === app && a.email === em);
if (cmd === 'add') {
  if (existing) { console.error('Account exists'); process.exit(1); }
  if (!password || password.length < 8) { console.error('Password must be at least 8 characters'); process.exit(1); }
  const { salt, hash } = auth.hashPassword(password);
  const a = { id: 'acc_' + crypto.randomBytes(6).toString('hex'), app, email: em, name: flag('name') || em.split('@')[0], createdAt: Date.now(), demo: false, salt, hash };
  if (app === 'dashboard') { const role = flag('role') || 'analyst'; if (!['viewer', 'analyst', 'admin'].includes(role)) { console.error('Role must be viewer, analyst or admin'); process.exit(1); } a.role = role; }
  if (app === 'couchsurfer') a.participantId = 'p_' + crypto.randomBytes(5).toString('hex');
  if (app === 'host') a.hostId = 'h_' + crypto.randomBytes(5).toString('hex');
  accounts.push(a); save();
  const state = stateFile.load(); if (state && state.db) { core.ensureRecords(state.db, accounts); state.rev++; stateFile.save(state); }
  console.log('Added', app, em, a.role || a.participantId || a.hostId, '(restart the server to pick up the new record if it is running)');
} else if (cmd === 'remove') {
  if (!existing) { console.error('No such account'); process.exit(1); }
  accounts.splice(accounts.indexOf(existing), 1); save(); console.log('Removed', app, em);
} else if (cmd === 'passwd') {
  if (!existing) { console.error('No such account'); process.exit(1); }
  if (!password || password.length < 8) { console.error('Password must be at least 8 characters'); process.exit(1); }
  Object.assign(existing, auth.hashPassword(password)); save(); console.log('Password updated for', app, em);
} else { console.error('Unknown command'); process.exit(1); }
