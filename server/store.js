'use strict';
/* Small JSON-file persistence with atomic writes and debounced saves. */
const fs = require('fs');
const path = require('path');

class JsonFile {
  constructor(file, fallback) { this.file = file; this.fallback = fallback; this.timer = null; this.pending = null; }
  load() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') console.warn('[store] could not read ' + this.file + ': ' + e.message + ' (starting fresh)'); return typeof this.fallback === 'function' ? this.fallback() : this.fallback; }
  }
  writeNow(data) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, this.file);
  }
  save(data, delayMs) {
    this.pending = data;
    if (!delayMs) { clearTimeout(this.timer); this.timer = null; this.pending = null; this.writeNow(data); return; }
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; const d = this.pending; this.pending = null; try { this.writeNow(d); } catch (e) { console.error('[store] write failed', e); } }, delayMs);
  }
  flush() { if (this.pending) { clearTimeout(this.timer); this.timer = null; const d = this.pending; this.pending = null; this.writeNow(d); } }
}

module.exports = { JsonFile };
