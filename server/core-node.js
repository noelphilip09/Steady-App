'use strict';
/* Loads the shared browser core in Node so the server seeds and repairs the dataset with the same logic the apps use. */
const path = require('path');
const makeSteadyCore = require(path.join(__dirname, '..', 'shared', 'js', 'core.js'));

class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(p, cb) { const patch = typeof p === 'function' ? p(this.state) : p; this.state = Object.assign({}, this.state, patch); if (cb) cb(); }
  forceUpdate() {}
}
const Core = makeSteadyCore(DCLogic);
const helpers = Core.helpers;

function today() { return helpers.isoOf(new Date()); }
function seedDb() { return Core.seedDb(today()); }

/* Fill any fields a seeded record lacks so every account's app renders fully. */
function completeParticipant(rec) { return Object.assign({}, Core.newParticipant(rec.id, { name: rec.name }, today()), rec); }
function completeHost(rec) { return Object.assign({}, Core.newHost(rec.id, { name: rec.name }, today()), rec); }

/* Make sure every account has a record in the dataset (after a seed or reset). */
function ensureRecords(db, accounts) {
  let changed = {};
  for (const a of accounts) {
    if (a.app === 'couchsurfer' && a.participantId) {
      const i = db.participants.findIndex(p => p.id === a.participantId);
      if (i < 0) { db.participants = db.participants.concat([Core.newParticipant(a.participantId, { name: a.name, email: a.email }, today())]); changed.participants = 1; }
      else if (a.demo) { const done = completeParticipant(db.participants[i]); if (JSON.stringify(done) !== JSON.stringify(db.participants[i])) { db.participants = db.participants.slice(); db.participants[i] = done; changed.participants = 1; } }
    }
    if (a.app === 'host' && a.hostId) {
      const i = db.hosts.findIndex(h => h.id === a.hostId);
      if (i < 0) { db.hosts = db.hosts.concat([Core.newHost(a.hostId, { name: a.name, email: a.email, phone: a.phone }, today())]); changed.hosts = 1; }
      else if (a.demo) { const done = completeHost(db.hosts[i]); if (JSON.stringify(done) !== JSON.stringify(db.hosts[i])) { db.hosts = db.hosts.slice(); db.hosts[i] = done; changed.hosts = 1; } }
    }
  }
  return Object.keys(changed);
}

module.exports = { Core, helpers, today, seedDb, ensureRecords, newParticipant: Core.newParticipant, newHost: Core.newHost };
