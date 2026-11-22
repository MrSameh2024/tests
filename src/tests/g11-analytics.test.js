/* Analytics tests · dashboard calculations. Run: node --test src/tests/*.test.js */
'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
global.window = global; require(path.join(ROOT, 'pathways/g11-advanced.js'));
const A = require(path.join(ROOT, 'ssh-g11-analytics.js'));
const SM = {}; for (const [t, v] of Object.entries(global.SSH_PATH_PAGE.tests)) SM[t] = v.items;
// same text format as a real Submissions row (older self-marking version of the page); no personal data
const REAL_FORMAT = 'Q1: 1) b ✓ | 2) b ✓ | 3) b ✓ | 4) a ✓\nQ2: A) T ✓ | B) F ✓ | C) NM ✓\nQ3: the ship was going to sink [not self-marked: teacher to mark]\nQ4 11:40 pm: the time they spotted the ice berg [not self-marked: teacher to mark]\nQ4 1985: the year they found the titanic [not self-marked: teacher to mark]\nQ5: 1) a 2) b [not self-marked: teacher to mark]\nQ6: 1) c 2) d. [not self-marked: teacher to mark]\nQ7: 1) a ✓ | 2) a ✓ | 3) a ✓ | 4) a ✗ (key b) | 5) a ✓\nQ8: 1) luxury ✗ (key luxurious) | 2) disappointment ✓ | 3) disadvantages ✗ (key adventurous) | 4) - ✗ (key prevented) | 5) - ✗ (key discovery)\nQ9: 1) - ✗ (key b) | 2) - ✗ (key c) | 3) - ✗ (key b) | 4) - ✗ (key b) | 5) - ✗ (key a) | 6) - ✗ (key a)\nQ10.1: - [blank]\nQ10.2: - [blank]\nQ10.3: - [blank]\nQ10.4: - [blank]';

test('parses the live Submissions text formats (breakdown, answers, writing mark)', () => {
  assert.deepEqual(A.parseBreakdown('Reading 7/14; Vocabulary 5/10; Grammar 0/10; self-marked items 0 pts; Writing /10 by teacher (Content 4 · Organisation 2)'),
    { reading: { got: 7, max: 14 }, vocabulary: { got: 5, max: 10 }, grammar: { got: 0, max: 10 } });
  const it = A.parseItems(REAL_FORMAT);
  assert.equal(Object.keys(it).length, 32, 'all 32 scored items found');
  assert.equal(it.a0, 'ok'); assert.equal(it.v3, 'no'); assert.equal(it.q3, 'review'); assert.equal(it.q4_1, 'review'); assert.equal(it.q5, 'review');
  assert.equal(it.wf1, 'ok'); assert.equal(it.wf3, 'no'); assert.equal(it.g0, 'no'); assert.equal(it.rw3, 'no'); assert.equal(it.tf2, 'ok');
  const v2 = A.parseItems('Q3: x [auto ✓ 1/1]\nQ4 2022: y [auto ✗ 0/1 · r]\nQ5: 1) a 2) b [auto ½ 1/2 · r]\nQ8: 1) enviromental [TEACHER REVIEW: s · key environmental]\nQ10.1: z ✓ auto');
  assert.deepEqual([v2.q3, v2.q4_0, v2.q5, v2.wf0, v2.rw0], ['ok', 'no', 'partial', 'review', 'ok']);
  assert.deepEqual(A.parseWriting('Writing 7/10. Good plan.'), { got: 7, max: 10 }); assert.equal(A.parseWriting('Well done'), null);
});

test('students, pre/post and low achievers are computed only from recorded rows', () => {
  const csv = 'Timestamp,Test,Student name,Class,Score,Max,Section breakdown,Answers\n' +
    '01/10/2026 09:00:00,Grade 11 Advanced Test 1,S A,11-7,10,34,"Reading 5/14; Vocabulary 3/10; Grammar 2/10",""\n' +
    '15/10/2026 09:00:00,Grade 11 Advanced Test 4,S A,11/7,20,34,"Reading 9/14; Vocabulary 6/10; Grammar 5/10",""\n' +
    '01/10/2026 09:00:00,Grade 11 Advanced Test 1,S B,11/7,30,34,"Reading 13/14; Vocabulary 9/10; Grammar 8/10",""\n' +
    '15/10/2026 09:00:00,Grade 11 Advanced Test 4,S B,11/7,28,34,"Reading 12/14; Vocabulary 8/10; Grammar 8/10",""\n' +
    '02/10/2026 09:00:00,Grade 11 Advanced Test 1,S C,11/7,17,34,"Reading 8/14",""\n' +
    '02/10/2026 09:00:00,Grade 12 Grammar Test 1,S D,12/1,10,20,"",""\n';
  const recs = A.records(A.parseCSV(csv), { g11Only: true });
  assert.equal(recs.length, 5, 'non-G11 rows ignored');
  assert.ok(recs.every(r => r.cls === '11/7'), 'class names normalised (11-7 = 11/7)');
  const st = A.students(recs, SM);
  const a = st.find(s => s.name === 'S A');
  assert.equal(Math.round(a.first.pct), 29); assert.equal(Math.round(a.latest.pct), 59); assert.equal(Math.round(a.change), 29);
  const pp = A.prePost(st, x => x.g11 === 1, x => x.g11 === 4);
  assert.equal(pp.n, 2, 'S C has no post result and is not paired');
  assert.equal(Math.round(pp.meanDiff * 10) / 10, Math.round(((20 - 10) / 34 * 100 + (28 - 30) / 34 * 100) / 2 * 10) / 10);
  assert.equal(pp.improved, 1);
  assert.equal(A.sections === undefined, true);
  const low = A.lowAchievers(st, null); assert.deepEqual(low.list.map(s => s.name), ['S A']);
  assert.ok(A.flags(st.find(s => s.name === 'S C'), 70).includes('only one attempt'));
  assert.equal(st.find(s => s.name === 'S A').sections.listening, undefined, 'no listening data is never invented');
});

test('demo data file is clearly fictitious and parses', () => {
  const recs = A.records(A.parseCSV(fs.readFileSync(path.join(ROOT, 'dashboards/demo/g11-demo-submissions.csv'), 'utf8')), { g11Only: true });
  assert.ok(recs.length > 50); assert.ok(recs.every(r => /^Demo Student \d\d$/.test(r.name)));
  assert.ok(recs.every(r => Object.keys(r.items).length === 32));
});
