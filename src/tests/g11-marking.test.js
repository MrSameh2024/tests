/* Unit tests · Grade 11 constructed-response marking (ssh-cr.js v2)
   Run:  node --test src/tests/            (Node 18+, no packages needed)
   Covers the mandatory scenarios 1–13 and 15 of the G11 enhancement brief at engine level.
   Scenarios 14, 16–20 are covered by src/tests/g11-e2e.mjs (browser) and src/tests/g11-recheck.test.js. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

global.window = global;
require(path.join(ROOT, 'cr/g11-advanced.js'));
const CR = require(path.join(ROOT, 'ssh-cr.js'));
global.SSHCR = CR;
require(path.join(ROOT, 'cr/g11-advanced.extra.js'));
const R = global.SSH_CR.tests;

// exam data straight from the page (no copy that could drift)
const html = fs.readFileSync(path.join(ROOT, 'g11-advanced.html'), 'utf8');
const start = html.indexOf('const DATA=') + 'const DATA='.length;
let depth = 0, end = start;
for (let i = start; i < html.length; i++) { const c = html[i]; if (c === '[') depth++; else if (c === ']') { depth--; if (!depth) { end = i + 1; break; } } }
const DATA = JSON.parse(html.slice(start, end));
const lexFor = n => { const T = DATA[n - 1]; CR.setLexicon(T.paras.concat([T.q3.a], T.q4.map(x => x.a), T.q5.a, T.q6.a)); };
const AR = /[؀-ۿ]/;

// the example from the brief, as a self-contained rubric
const RAIN = { ideas: [{ forms: [{ all: ['heavy rain\\w*|rain\\w*|rainfall|bad weather|storm\\w*|heavy showers?'] }] }], reject: ['sunny|good weather|fine weather|nice weather|clear sky'] };
const rain = a => { CR.setLexicon(['The journey was cancelled because of heavy rain.']); return CR.reading1(a, RAIN); };

test('1 · answer identical to the model is accepted', () => {
  assert.equal(rain('Because of heavy rain.').state, 'ok');
  lexFor(1); assert.equal(CR.reading1(DATA[0].q3.a, R['1'].q3).state, 'ok');
});

test('1b · every model answer in all 10 tests is accepted by its own rubric', () => {
  for (const T of DATA) {
    const t = String(T.n); lexFor(T.n);
    assert.equal(CR.reading1(T.q3.a, R[t].q3).state, 'ok', `T${t} q3`);
    T.q4.forEach((x, i) => assert.equal(CR.reading1(x.a, R[t]['q4_' + i]).state, 'ok', `T${t} q4_${i}`));
    ['q5', 'q6'].forEach(k => { const p = T[k].a.map(x => x.split(/\s+\/\s+/)[0]); assert.equal(CR.reading2(p[0], p[1], R[t][k]).state, 'ok', `T${t} ${k}`); });
    T.q10.forEach((q, i) => assert.equal(CR.rewrite(q.a.split(/\s+\/\s+/)[0], q, R[t]['rw' + i]).state, 'ok', `T${t} rw${i}`));
    T.q8.forEach((q, i) => assert.equal(CR.wordForm(q.a, q.a).state, 'ok', `T${t} wf${i}`));
  }
});

test('2 · synonyms and paraphrases are accepted', () => {
  for (const a of ['Because it was raining heavily.', 'Due to heavy rainfall.', 'The bad weather caused the cancellation.', 'Heavy rain.'])
    assert.equal(rain(a).state, 'ok', a);
  lexFor(1); assert.equal(CR.reading1('tiny creatures called plankton eat them, then little fish eat those, then tuna eat the little fish', R['1'].q3).state, 'ok');
});

test('3 · essential words in a different order are accepted', () => {
  lexFor(1); assert.equal(CR.reading1('in human blood they were discovered for the first time', R['1'].q4_1).state, 'ok');
  lexFor(2); assert.equal(CR.reading1('within two or three hours it would sink', R['2'].q3).state, 'ok');
});

test('4 · minor spelling mistakes are accepted, with a bilingual note', () => {
  lexFor(1);
  const r = CR.reading1('plankten eat them, then smal fish eat plankton, then larger predetors eat the fish', R['1'].q3);
  assert.equal(r.state, 'ok'); assert.equal(r.code, 'ok_spelling');
  assert.match(r.note[0], /plankten → plankton/); assert.match(r.note[1], AR);
  assert.equal(CR.reading1('they found plastic in the bloood', R['1'].q4_1).state, 'ok');
  // capitalisation / punctuation / spacing never matter
  assert.equal(CR.reading1('  SCIENTISTS FOUND microplastics   in human BLOOD!!! ', R['1'].q4_1).state, 'ok');
});

test('4b · spelling tolerance does not turn a different real word into a key word', () => {
  CR.setLexicon(['microbeads were added to face washes']);
  const fx = CR.fixTypos('head', { bead: 1 });           // different first letter → never corrected
  assert.equal(fx.t, 'head');
  assert.equal(CR.fixTypos('sank', { sink: 1, sunk: 1 }).t, 'sank');   // ambiguous / short → unchanged
});

test('5 · key words with the wrong meaning are rejected', () => {
  assert.equal(rain('Because the weather was sunny.').state, 'no');
  lexFor(5);
  const r = CR.reading1('three weeks', R['5'].q3);
  assert.equal(r.state, 'no'); assert.equal(r.code, 'contradiction');
  lexFor(1); assert.equal(CR.reading1('plastic under the sea', R['1'].q4_0).state, 'no');
});

test('6 · negated or contradictory answers are rejected (keywords alone never give the mark)', () => {
  const r = rain('The journey was not cancelled due to rain.');
  assert.equal(r.state, 'no'); assert.equal(r.code, 'negated'); assert.match(r.why[1], AR);
  lexFor(1);
  assert.equal(CR.reading1('microplastics were not found in blood', R['1'].q4_1).state, 'no');
  assert.equal(CR.reading1('They do not move from plankton to small fish to tuna', R['1'].q3).state, 'no');
  assert.equal(CR.reading2('microbeads are not added on purpose', 'big plastic does not break apart', R['1'].q5).got, 0);
  // but negation that is part of the meaning is fine
  assert.equal(rain('It was not sunny, it was heavy rain.').state, 'no', 'reject pattern "sunny" still wins');
  assert.equal(CR.reading1('It was not until 2022 that they found plastic in blood', R['1'].q4_1).state, 'ok');
  lexFor(2); assert.equal(CR.reading2('There were not enough lifeboats', 'They did not have enough lifeboats', R['2'].q5).boxes[0], 'ok');
  lexFor(10); assert.equal(CR.reading2('An AI tutor can explain topics in different ways at any time.', "It helps students who can't afford private lessons", R['10'].q5).state, 'ok');
});

test('6b · every negated model answer is rejected', () => {
  let n = 0;
  for (const T of DATA) {
    lexFor(T.n);
    [['q3', T.q3.a]].concat(T.q4.map((x, i) => ['q4_' + i, x.a])).forEach(([id, a]) => {
      const m = a.match(/\b(is|are|was|were|can|could|would|will|had|has|have|did|do|does|must|should)\b/i);
      if (!m || new RegExp('\\b' + m[1] + ' not\\b', 'i').test(a)) return;
      n++; assert.notEqual(CR.reading1(a.replace(m[0], m[0] + ' not'), R[String(T.n)][id]).state, 'ok', `T${T.n} ${id}`);
    });
  }
  assert.ok(n >= 5);
});

test('7 · grammatically valid alternative rewrites are accepted', () => {
  const T = DATA[0], q = T.q10[1];   // Although
  assert.equal(CR.rewrite('Although microplastics have been banned, they are still common.', q, R['1'].rw1).state, 'ok');
  assert.equal(CR.rewrite('Although there are bans, microplastics are still very common.', q, R['1'].rw1).state, 'ok');
  assert.equal(CR.rewrite('The plastic had entered the sea before the fish ate it.', T.q10[2], R['1'].rw2).state, 'ok');
  const sp = CR.rewrite('Although there are bans, microplastics are still comon.', q, R['1'].rw1);
  assert.equal(sp.state, 'ok'); assert.equal(sp.code, 'ok_spelling');
});

test('8 · wrong tense or wrong transformation is rejected with a reason', () => {
  const T = DATA[0];
  const a = CR.rewrite('Before the fish had eaten the plastic, it entered the sea.', T.q10[2], R['1'].rw2);
  assert.equal(a.state, 'no'); assert.equal(a.code, 'tense_sequence'); assert.match(a.why[1], AR);
  const b = CR.rewrite('Despite there are bans, microplastics are still common.', T.q10[1], R['1'].rw1);
  assert.equal(b.state, 'no'); assert.equal(b.code, 'no_keyword');
  const c = CR.rewrite('You should to wash synthetic clothes less often.', T.q10[3], R['1'].rw3);
  assert.equal(c.state, 'no'); assert.equal(c.code, 'structure');
  const d = CR.rewrite('The particles are very small. You can\'t see them.', T.q10[0], R['1'].rw0);
  assert.equal(d.state, 'no');
  // an otherwise grammatical sentence that ignores the rule is rejected
  const e = CR.rewrite('The particles are such small that you cannot see them.', T.q10[0], R['1'].rw0);
  assert.equal(e.state, 'no');
});

test('9 · partial credit for two-point questions', () => {
  lexFor(1);
  const r = CR.reading2('microbeads were added on purpose', 'the sea is very big', R['1'].q5);
  assert.equal(r.got, 1); assert.equal(r.pts, 2); assert.equal(r.code, 'one_point');
  const same = CR.reading2('microbeads in face wash', 'beads in toothpaste', R['1'].q5);
  assert.equal(same.got, 1, 'the same idea twice earns one mark');
});

test('10 · empty answers score 0 with a message (never an error)', () => {
  for (const v of ['', '   ', null, undefined]) {
    assert.equal(CR.reading1(v, R['1'].q3).state, 'no');
    assert.equal(CR.rewrite(v, DATA[0].q10[0], R['1'].rw0).code, 'blank');
    assert.equal(CR.wordForm(v, 'environmental', 'environment').code, 'blank');
  }
  assert.equal(CR.reading2('', '', R['1'].q5).code, 'blank');
});

test('11 · uncertain answers go to the teacher instead of 0', () => {
  lexFor(2);
  assert.equal(CR.reading1('it would sink', R['2'].q3).state, 'review');                // idea marked "review" in the rubric
  lexFor(1);
  assert.equal(CR.reading1('plankton eat them and then fish eat the plankton', R['1'].q3).state, 'review');   // part of the chain only
  const long = CR.reading1(DATA[0].paras[2], R['1'].q3);                                 // whole paragraph copied
  assert.equal(long.state, 'review'); assert.equal(long.code, 'long');
  const rw = CR.rewrite('Althogh there are bans, microplastics are still common.', DATA[0].q10[1], R['1'].rw1);
  assert.equal(rw.state, 'review'); assert.equal(rw.code, 'kw_spelling');
  const wf = CR.wordForm('enviromental', 'environmental', 'environment');
  assert.equal(wf.state, 'review'); assert.equal(wf.code, 'spelling');
});

test('11b · word formation: variants, unchanged base word, wrong word class', () => {
  assert.equal(CR.wordForm('Environmental', 'environmental', 'environment').state, 'ok');
  assert.equal(CR.wordForm('organization', 'organisation').state, 'ok');
  assert.equal(CR.wordForm('environment', 'environmental', 'environment').code, 'unchanged');
  const w = CR.wordForm('develop', 'development', 'develop'); assert.equal(w.state, 'no');
  const c = CR.wordForm('preventive', 'prevention', 'prevent'); assert.equal(c.code, 'word_class'); assert.match(c.why[0], /noun/);
});

test('12 · every non-correct result carries English AND Arabic feedback', () => {
  lexFor(1);
  const rs = [CR.reading1('', R['1'].q3), CR.reading1('fish swim', R['1'].q3), CR.reading1('plankton eat them', R['1'].q3),
    CR.reading2('x', 'y', R['1'].q5), CR.rewrite('nothing', DATA[0].q10[0], R['1'].rw0),
    CR.wordForm('environmently', 'environmental', 'environment'), rain('The journey was not cancelled due to rain.')];
  for (const r of rs) {
    assert.ok(r.why && r.why[0] && !AR.test(r.why[0]), 'English text');
    assert.ok(AR.test(r.why[1]), 'Arabic text');
    assert.ok(r.code, 'reason code for reports');
  }
});

test('13 · skill mapping: every G11 item has a skill, every skill has G11 resources, local PDFs exist', () => {
  global.window = global;
  require(path.join(ROOT, 'pathways/skills.js')); require(path.join(ROOT, 'pathways/g11-advanced.js'));
  const SK = global.SSH_PATH_SKILLS, P = global.SSH_PATH_PAGE;
  const open = fs.readFileSync(path.join(ROOT, 'open.html'), 'utf8');
  for (const t of Object.keys(P.tests)) {
    const items = P.tests[t].items;
    assert.equal(Object.keys(items).length, 32, `T${t} has 32 tagged items (every scored item)`);
    for (const [id, code] of Object.entries(items)) {
      assert.ok(SK[code], `T${t} ${id} → ${code} exists`);
      const res = (SK[code].res && SK[code].res['11']) || [];
      assert.ok(res.length, `${code} has Grade 11 resources`);
      for (const r of res) {
        const m = /open\.html\?f=([a-z0-9-]+)/.exec(r.url);
        if (m) {
          assert.ok(open.includes(m[1]), `open.html knows ${m[1]}`);
          const seg = open.slice(open.indexOf(m[1]), open.indexOf(m[1]) + 300);
          const pdf = /tests\/(pdf\/[^"'\s]+\.pdf)/.exec(seg);
          if (pdf) assert.ok(fs.existsSync(path.join(ROOT, pdf[1])), `${pdf[1]} exists in the repo`);
        } else if (!/^https?:/.test(r.url)) {
          assert.ok(fs.existsSync(path.join(ROOT, r.url.split(/[?#]/)[0])), `${r.url} exists`);
        }
      }
    }
  }
});

test('15 · the mark scheme still totals 44 per test (14 + 10 + 10 + 10)', () => {
  for (const T of DATA) {
    const reading = T.q1.length + T.q2.length + 1 + T.q4.length + 2 + 2;
    const vocab = T.q7.length + T.q8.length, grammar = T.q9.length + T.q10.length;
    assert.deepEqual([reading, vocab, grammar], [14, 10, 10], `Test ${T.n}`);
    assert.equal(reading + vocab + grammar + 10, 44);
    T.q1.concat(T.q7, T.q9).forEach(q => assert.ok(q.a >= 0 && q.a < q.o.length, 'MCQ key is a valid option'));
    T.q2.forEach(q => assert.ok(['T', 'F', 'NM'].includes(q.a)));
  }
});
