#!/usr/bin/env node
'use strict';
/* Rebuild the shared dataset from the seed (keeps accounts; re-creates their records). Stop the server first. */
const path = require('path');
const { JsonFile } = require('./store');
const core = require('./core-node');
const DATA_DIR = process.env.STEADY_DATA_DIR || path.join(__dirname, 'data');
const stateFile = new JsonFile(path.join(DATA_DIR, 'state.json'), null);
const accountsFile = new JsonFile(path.join(DATA_DIR, 'accounts.json'), () => ({ accounts: [] }));
const prev = stateFile.load(); const accounts = accountsFile.load().accounts || [];
const state = { rev: (prev && prev.rev ? prev.rev : 0) + 1, dayOffset: 0, db: core.seedDb(), updatedAt: Date.now(), seededAt: Date.now() };
core.ensureRecords(state.db, accounts); stateFile.save(state);
console.log('Seeded', path.join(DATA_DIR, 'state.json'), 'rev', state.rev, '·', state.db.participants.length, 'participants,', state.db.hosts.length, 'hosts,', accounts.length, 'accounts kept');
