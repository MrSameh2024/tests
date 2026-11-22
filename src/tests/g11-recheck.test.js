/* Re-check tool tests · scenarios 16 (exports) and 17 (historic records preserved). Run: node --test src/tests/*.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const RC = require('../tools/g11-recheck.js');
const FIX = path.join(__dirname, 'fixtures', 'submissions-sample.csv');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

test('16 · re-check exports a proposals CSV and a summary; only Grade 11 rows are used', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rc-')), 'x');
  const { sum, props } = RC.run(FIX, out);
  assert.equal(sum.g11_rows, 2);
  assert.ok(fs.existsSync(out + '-proposals.csv') && fs.existsSync(out + '-summary.json'));
  const csv = fs.readFileSync(out + '-proposals.csv', 'utf8');
  assert.match(csv.split('\n')[0], /original,proposed,change,reason_code,reason_en,reason_ar,teacher_decision/);
  const by = Object.fromEntries(props.map(p => [p.test + ':' + p.item, p]));
  assert.equal(by['1:q3'].change, 'would_gain');          // spelling-tolerant marking
  assert.equal(by['1:q4_1'].change, 'would_lose');        // negated answer had been accepted
  assert.equal(by['1:rw1'].change, 'would_gain');
  assert.equal(by['2:q5'].change, 'would_gain');          // overlay wording "did not have enough"
  assert.equal(by['1:wf0'].change, 'now_needs_review');   // near-miss spelling → teacher
  assert.ok(!props.some(p => p.test === 12));
  assert.ok(props.every(p => p.teacher_decision === ''), 'nothing is decided automatically');
});

test('17 · the original export is never modified (checksum before = after)', () => {
  const before = sha(FIX);
  RC.run(FIX, path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rc-')), 'y'));
  assert.equal(sha(FIX), before);
});

test('17b · answer parser reads every item format the exam page sends', () => {
  const a = RC.parseAnswers('Q3: abc [auto ✗ 0/1 · x]\nQ4 2022: def ✓ auto\nQ5: 1) one 2) two [blank]\nQ8: 1) foo ✓ | 2) bar ✗ (key baz)\nQ10.2: hello [self: 1/1]');
  assert.equal(a.q3.a, 'abc'); assert.equal(a.q4_0.a, 'def'); assert.deepEqual(a.q5.a, ['one', 'two']);
  assert.equal(a.wf1.a, 'bar'); assert.equal(a.rw1.a, 'hello');
  assert.equal(RC.oldVerdict(a.q3.tag).got, 0); assert.equal(RC.oldVerdict(a.rw1.tag).kind, 'self');
});
