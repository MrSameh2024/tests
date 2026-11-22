/* Item-level feedback data checks (scenario 12). Run: node --test src/tests/*.test.js */
'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('path');
global.window = global;
require(path.join(__dirname, '..', '..', 'feedback/g11-advanced.js'));
const F = global.SSH_FB_ITEMS.tests, AR = /[؀-ۿ]/;
test('12b · every MCQ / T-F / word-formation item in all 10 tests has an English + Arabic explanation', () => {
  assert.equal(Object.keys(F).length, 10);
  for (const [t, items] of Object.entries(F)) {
    const ids = Object.keys(items);
    assert.equal(ids.length, 23, `T${t}: 4 a + 3 tf + 5 v + 5 wf + 6 g`);
    for (const id of ids) {
      const e = items[id];
      assert.ok(e.k && e.en && !AR.test(e.en), `T${t} ${id} English`);
      assert.ok(AR.test(e.ar), `T${t} ${id} Arabic`);
      for (const n of e.not) assert.ok(n[0] && n[1] && AR.test(n[2]), `T${t} ${id} distractor ${n[0]}`);
    }
    for (let i = 0; i < 6; i++) assert.ok(items['g' + i].not.length >= 2, `T${t} g${i} explains at least two distractors`);
  }
});
