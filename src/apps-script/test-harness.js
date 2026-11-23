/* Node harness: runs SSH_G11_Recheck_23Nov.gs against an in-memory copy of a Submissions CSV export.
   node src/apps-script/test-harness.js <submissions.csv>   — never touches Google. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const RC = require('../tools/g11-recheck.js');
function Sheet(name, rows) {
  const s = { name, rows: rows.map(r => r.slice()), hidden: false, dv: null,
    getName: () => s.name, setName: n => { s.name = n; return s; }, hideSheet: () => { s.hidden = true; },
    getDataRange: () => ({ getValues: () => s.rows.map(r => r.slice()) }),
    getLastRow: () => s.rows.length,
    getRange: (r, c, nr, nc) => ({
      getValue: () => (s.rows[r - 1] || [])[c - 1],
      setValue: v => { while (s.rows.length < r) s.rows.push([]); s.rows[r - 1][c - 1] = v; },
      setValues: v => { v.forEach((row, i) => row.forEach((x, j) => { while (s.rows.length < r + i) s.rows.push([]); s.rows[r - 1 + i][c - 1 + j] = x; })); },
      setDataValidation: d => { s.dv = d; }, clearContent: () => { for (let i = 0; i < nr; i++) if (s.rows[r - 1 + i]) s.rows[r - 1 + i][c - 1] = ''; } }),
    appendRow: r => { s.rows.push(r.slice()); }, setFrozenRows: () => {},
    copyTo: ss => { const c = Sheet('Copy of ' + s.name, s.rows); ss._sheets.push(c); return c; } };
  return s;
}
function run(csvPath) {
  const rows = RC.parseCSV(fs.readFileSync(csvPath, 'utf8')).map(r => r.map(x => /^\d+$/.test(x) ? Number(x) : x));
  const ss = { _sheets: [Sheet('Submissions', rows)], getSheetByName: n => ss._sheets.find(s => s.name === n) || null,
    insertSheet: n => { const s = Sheet(n, []); ss._sheets.push(s); return s; }, getSpreadsheetTimeZone: () => 'Asia/Qatar' };
  const msgs = [];
  const ctx = { SpreadsheetApp: { getActive: () => ss, getUi: () => ({ alert: m => msgs.push(m) }), newDataValidation: () => ({ requireValueInList: () => ({ build: () => 'dv' }) }) },
    LockService: { getDocumentLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) }, Session: { getActiveUser: () => ({ getEmail: () => 'teacher@test' }) },
    Utilities: { formatDate: () => '2026-11-23 0930' }, Logger: { log: () => {} } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'SSH_G11_Recheck_23Nov.gs'), 'utf8'), ctx);
  return { ss, ctx, msgs, before: rows };
}
const csv = process.argv[2];
const { ss, ctx, msgs, before } = run(csv);
const sub = ss.getSheetByName('Submissions'), H = before[0];
const ci = h => H.indexOf(h);
ctx.g11Recheck_1_CreateReviewTab();
const rev = ss.getSheetByName('G11 Re-check 23 Nov');
assert.strictEqual(rev.rows.length - 1, 158, 'review tab has 158 rows');
assert.ok(rev.rows.slice(1).every(r => r[0] === 'APPROVE' && r[3] !== '(not found)'));
// teacher rejects two rows and sorts nothing
rev.rows[1][0] = 'REJECT'; rev.rows[2][0] = 'REJECT';
ctx.g11Recheck_2_ApplyApproved();
console.log(msgs[msgs.length - 1]);
const log = ss.getSheetByName('Re-check audit log');
const backup = ss._sheets.find(s => /^Submissions backup/.test(s.name));
assert.ok(backup && backup.hidden, 'hidden backup tab created');
assert.deepStrictEqual(backup.rows, before, 'backup equals the original data');
// every changed cell is in an expected column and only in logged rows
const loggedRows = new Set(log.rows.slice(1).map(r => r[3]));
const allowed = new Set(['Score', 'Percent', 'Section breakdown', 'Answers', 'Teacher feedback'].map(ci));
let changedCells = 0;
sub.rows.forEach((r, i) => r.forEach((v, j) => { if (v !== before[i][j]) { changedCells++; assert.ok(loggedRows.has(i + 1), 'change only in logged rows'); assert.ok(allowed.has(j), 'change only in allowed columns: ' + H[j]); } }));
// consistency checks on each changed row
let added = 0;
log.rows.slice(1).forEach(l => {
  const r = sub.rows[l[3] - 1];
  assert.strictEqual(r[ci('Score')], l[6] + l[5]); added += l[5];
  assert.ok(r[ci('Score')] <= r[ci('Max')]);
  assert.strictEqual(r[ci('Percent')], Math.round(r[ci('Score')] / r[ci('Max')] * 100) + '%');
  const rd = /Reading (\d+)\/14/.exec(r[ci('Section breakdown')]); assert.ok(!rd || +rd[1] <= 14);
  assert.ok(/re-check 23 Nov 2026, approved by teacher/.test(r[ci('Answers')]));
  assert.ok(/re-check \(23 Nov 2026, approved\)/.test(r[ci('Teacher feedback')]));
});
const statuses = rev.rows.slice(1).map(r => r[9] || '');
console.log('applied rows:', statuses.filter(s => /^Applied/.test(s)).length, '| rejected (blank status):', rev.rows.slice(1).filter(r => r[0] === 'REJECT').length, '| skipped:', statuses.filter(s => /^Skipped/.test(s)).length, '| points:', added, '| cells changed:', changedCells, '| submissions changed:', log.rows.length - 1);
// idempotent
const snap = JSON.stringify(sub.rows); ctx.g11Recheck_2_ApplyApproved();
assert.strictEqual(JSON.stringify(sub.rows), snap, 'second run changes nothing');
// undo restores the original exactly
ctx.g11Recheck_Undo();
assert.deepStrictEqual(sub.rows, before, 'undo restores every original value');
console.log('PASS: backup, allowed columns only, totals consistent, second run no-op, undo exact');
