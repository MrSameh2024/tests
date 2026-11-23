/* Node harness for SSH_G11_Progress.gs on a CSV export (no Google). node src/apps-script/test-progress.js <csv> [class] */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const RC = require('../tools/g11-recheck.js');
const grid = RC.parseCSV(fs.readFileSync(process.argv[2], 'utf8'));
const before = JSON.stringify(grid);
const tabs = {}; let calls = { setValues: 0, other: [] };
function Range(sh, r, c, nr, nc) { return { setValues: v => { calls.setValues++; v.forEach((row, i) => row.forEach((x, j) => { sh.cells[(r + i) + ',' + (c + j)] = x; })); return this; },
  getDisplayValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) o.push([String(sh.cells[(r + i) + ',' + c] ?? '')]); return o; },
  setFontFamily() { return this; }, setFontSize() { return this; }, setVerticalAlignment() { return this; }, setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; } }; }
function Sheet(name, g) { const sh = { name, cells: {}, g,
  getDataRange: () => ({ getDisplayValues: () => JSON.parse(JSON.stringify(g)) }),
  getRange: (a, b, c, d) => { if (typeof a === 'string') { const m = /^([A-Z])(\d+):([A-Z])(\d+)$/.exec(a); return Range(sh, +m[2], m[1].charCodeAt(0) - 64, +m[4] - +m[2] + 1, 1); } return Range(sh, a, b, c, d); },
  clear: () => { sh.cells = {}; }, clearConditionalFormatRules() {}, setFrozenRows() {}, setColumnWidth() {} }; return sh; }
const sub = Sheet('Submissions', grid);
const roster = process.env.ROSTER ? Sheet('G11-7 Research Roster', RC.parseCSV(fs.readFileSync(process.env.ROSTER, 'utf8'))) : null;
const ss = { getSheetByName: n => n === 'Submissions' ? sub : n === 'G11-7 Research Roster' ? roster : tabs[n] || null, insertSheet: n => (tabs[n] = Sheet(n, [])) };
const ctx = { SpreadsheetApp: { getActive: () => ss }, Session: { getScriptTimeZone: () => 'Asia/Qatar' }, Utilities: { formatDate: () => '23 Nov 2026 10:00' } };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'SSH_G11_Progress.gs'), 'utf8'), ctx);
const sum1 = ctx.buildG11Progress();
const tab = tabs['G11 Progress']; const rows = {};
Object.entries(tab.cells).forEach(([k, v]) => { const [r, c] = k.split(',').map(Number); (rows[r] = rows[r] || [])[c - 1] = v; });
const text = Object.keys(rows).sort((a, b) => a - b).map(r => rows[r].map(x => x ?? '').join(' | ').replace(/( \| )+$/, ''));
assert.strictEqual(JSON.stringify(sub.g), before, 'Submissions untouched');
// settings survive a rebuild: change class to "all" and rebuild
tab.cells['4,2'] = process.argv[3] || 'all';
const sum2 = ctx.buildG11Progress();
console.log('first build (11/7):', JSON.stringify(sum1), '| rebuild with class =', process.argv[3] || 'all', ':', JSON.stringify(sum2));
assert.strictEqual(tab.cells['4,2'], process.argv[3] || 'all', 'teacher setting kept');
assert.ok(text.some(l => /^1 · Overview/.test(l)) && text.some(l => /^4 · Pre \/ post/.test(l)));
assert.ok(!text.some(l => /\bTeacher\b \|/.test(l) && /^Teacher/.test(l)), 'no Teacher class row');
console.log(text.filter(l => !/^[^|]*\(11-?\/?\d\)/.test(l) || false).slice(0, 60).map(l => l.replace(/^.*\((11[^)]*)\)/, '[student]($1)')).join('\n'));
console.log('PASS: built, settings kept, Submissions untouched');
