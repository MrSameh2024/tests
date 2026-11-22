/* Smart Students Hub · constructed-response (CR) checker · v2
   Marks short written answers without self-marking:
     ok      – the program is confident the answer is correct
     no      – the program is confident it is wrong (blank, missing the required word/structure, no key idea,
               or the key idea is negated / contradicted)
     review  – the program is NOT sure: the answer goes to the teacher ("pending teacher review")
   Reading: key ideas (groups of synonyms) from rubric data (cr/<page>.js, plus optional cr/<page>.extra.js overlay).
   Grammar rewrites: accepted answers + the target structure from the word(s) in brackets + a content check.
   Word formation (v2): exact key, spelling variants, near-misses go to the teacher.
   v2 adds: tolerant spelling (minor typos are corrected towards words of the text / key before matching),
   negation and contradiction checks (keywords alone never give the mark), item "reject" patterns,
   and a machine-readable reason code on every result (r.code) for reports and re-marking.
   Every result carries bilingual feedback (why). Works in the browser and in Node (for tests). */
(function (root) {
  'use strict';
  var SP = { travelled: 'traveled', travelling: 'traveling', criticised: 'criticized', criticise: 'criticize', organised: 'organized', colour: 'color', colours: 'colors', fibres: 'fibers', fibre: 'fiber', millimetres: 'millimeters', millimetre: 'millimeter', behaviour: 'behavior', programme: 'program', programmes: 'programs', realised: 'realized', realise: 'realize', centre: 'center', metres: 'meters' };
  function norm(s) {
    s = String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...');
    s = s.replace(/(\d),(\d)/g, '$1$2')
      .replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b|\bcan not\b/g, 'cannot').replace(/\bshan't\b/g, 'shall not')
      .replace(/n't\b/g, ' not').replace(/'ll\b/g, ' will').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'m\b/g, ' am').replace(/'d\b/g, ' would')
      .replace(/\b(it|he|she|that|there|what|who|here|this)'s\b/g, '$1 is').replace(/'s\b/g, 's');
    // common apostrophe-less contractions typed on phones
    s = s.replace(/\b(did|do|does|was|were|is|are|has|have|had|could|would|should|must)nt\b/g, '$1 not').replace(/\bdont\b/g, 'do not').replace(/\bcant\b/g, 'cannot').replace(/\bwont\b/g, 'will not');
    s = s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s.split(' ').map(function (w) { return SP[w] || w; }).join(' ');
  }
  function has(g, t) { try { return new RegExp('(^| )(?:' + g + ')(?= |$)').test(t); } catch (e) { return false; } }
  // character span of the first match of group g in text t (or null)
  function span(g, t) {
    try { var m = new RegExp('(^| )(?:' + g + ')(?= |$)').exec(t); if (!m) return null; var s = m.index + m[1].length; return [s, m.index + m[0].length]; } catch (e) { return null; }
  }
  var STOP = ('a an the and or but so to of in on at for with by from into as is are was were be been being am do does did have has had ' +
    'it its they them their he him his she her we our you your i me my this that these those there here who which whose what when while ' +
    'very too also just still then than will would can could should must may might shall some any many much more most few each every all ' +
    'up about after before because although despite spite such going used get got gotten').split(' ');
  var KEEP = { not: 1, no: 1, never: 1, cannot: 1, nobody: 1, none: 1 };
  function stem(w) { return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w; }
  function content(t) { return t.split(' ').filter(function (w) { return w && (KEEP[w] || STOP.indexOf(w) < 0); }).map(stem); }
  var HARMLESS = {}; 'that still now the a an also really very only just all every each people you we they students everyone everybody of'.split(' ').forEach(function (w) { HARMLESS[w] = 1; });
  function words(s) { return (String(s || '').trim().match(/\S+/g) || []).length; }

  /* ---------------- spelling tolerance ---------------- */
  function lev(a, b, max) {   // Damerau-Levenshtein (adjacent swaps count 1), early exit above max
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var rowMin = max + 1;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  var LEX = {};   // page-level lexicon (passage + model answers), set with setLexicon()
  function addWords(set, txt) { norm(txt).split(' ').forEach(function (w) { if (w.length >= 3 && !/^\d+$/.test(w)) set[w] = 1; }); }
  function setLexicon(texts) {
    LEX = {}; NEGOK = {};
    (texts || []).forEach(function (x) {
      addWords(LEX, x);
      var w = norm(x).split(' ');
      for (var i = 0; i < w.length - 1; i++) if (/^(not|no|never|cannot|nobody|none|nothing|neither|nor)$/.test(w[i])) { NEGOK[w[i] + ' ' + w[i + 1]] = 1; if (w[i + 2]) NEGOK[w[i] + ' ' + w[i + 2]] = 1; }
    });
    return Object.keys(LEX).length;
  }
  // literal words used in a rubric's regex groups (stems such as "larg\w*" are skipped)
  function rubricWords(rub) {
    var set = {};
    function walk(g) {
      String(g).replace(/\\w[*+]?|\\b|\[[^\]]*\]|\{[^}]*\}/g, '#').split(/[|()?\s^$]+/).forEach(function (w) {
        if (/^[a-z]{3,}$/.test(w)) set[w] = 1;
      });
    }
    (rub.ideas || []).forEach(function (idea) { idea.forms.forEach(function (f) { f.all.forEach(walk); }); });
    return set;
  }
  // Correct obvious typos towards words of the text / rubric. Returns {t, fixes:[[from,to]]}.
  // Guards: the typed word must be unknown, ≥4 letters, same first letter, and have ONE closest target.
  function fixTypos(t, extra) {
    var fixes = [], known = function (w) { return LEX[w] || (extra && extra[w]) || STOP.indexOf(w) >= 0 || KEEP[w]; };
    var targets = Object.keys(LEX).concat(Object.keys(extra || {}));
    var out = t.split(' ').map(function (w) {
      if (w.length < 4 || /\d/.test(w) || known(w)) return w;
      var best = null, bestD = 9, tie = false;
      targets.forEach(function (c) {
        if (c[0] !== w[0] || c === w) return;
        var max = Math.max(c.length, w.length) >= 8 ? 2 : (Math.max(c.length, w.length) >= 5 ? 1 : 0);
        if (!max) return;
        var dd = lev(w, c, max);
        if (dd <= max) { if (dd < bestD) { best = c; bestD = dd; tie = false; } else if (dd === bestD && c !== best) tie = true; }
      });
      if (best && !tie) { fixes.push([w, best]); return best; }
      return w;
    });
    return { t: out.join(' '), fixes: fixes };
  }

  /* ---------------- negation / contradiction ---------------- */
  var NEG = /^(not|no|never|cannot|nobody|none|nothing|neither|nor)$/;
  var NEGOK = {};   // negated phrases that the text itself uses ("cannot afford"): quoting them is not a contradiction
  // clauses of the raw answer: split at punctuation and at contrast connectors
  function clauses(raw) {
    return String(raw || '').toLowerCase().split(/[,;.!?:()]+|\b(?:but|however|although|though|whereas|instead)\b/).map(norm).filter(Boolean);
  }
  // does clause c contain a negator that is not part of the matched key words?
  function negatedIn(c, form) {
    var toks = c.split(' '), spans = [];
    form.all.forEach(function (g) { var s = span(g, c); if (s) spans.push(s); });
    if (!spans.length) return false;
    var pos = 0;
    for (var i = 0; i < toks.length; i++) {
      var a = pos, b = pos + toks[i].length; pos = b + 1;
      if (!NEG.test(toks[i])) continue;
      if (toks[i] === 'not' && /^(only|just|until)$/.test(toks[i + 1] || '')) continue;   // "not only … but also", "not until 2022"
      if (toks[i] === 'no' && toks[i + 1] === 'matter') continue;                      // "no matter how …"
      if (NEGOK[toks[i] + ' ' + (toks[i + 1] || '')] || NEGOK[toks[i] + ' ' + (toks[i + 2] || '')]) continue;   // the text says it too
      var inside = spans.some(function (s) { return a >= s[0] && b <= s[1]; });
      if (!inside) return true;
    }
    return false;
  }

  /* ---------------- reading ---------------- */
  function scoreIdea(idea, t, cls) {   // -> {full, frac, review, neg}
    var best = { full: false, frac: 0, review: !!idea.review, neg: false };
    idea.forms.forEach(function (f) {
      var k = f.all.filter(function (g) { return has(g, t); }).length, n = f.all.length;
      if (k === n) {
        // the whole idea must be stated positively inside ONE clause that is not negated
        var clean = cls.some(function (c) { return f.all.every(function (g) { return has(g, c); }) && (idea.negOk || !negatedIn(c, f)); });
        var spread = !cls.some(function (c) { return f.all.every(function (g) { return has(g, c); }); });
        if (clean || (spread && !cls.some(function (c) { return negatedIn(c, f); }))) best.full = true;
        else best.neg = true;
      }
      if (n && has(f.all[0], t)) best.frac = Math.max(best.frac, k / n);   // partial credit only if the key concept is there
    });
    return best;
  }
  function judgeBox(ans, rub) {  // one answer box vs all ideas
    var t0 = norm(ans);
    if (!t0) return { st: 'blank', ideas: [] };
    var fx = fixTypos(t0, rubricWords(rub)), t = fx.t;
    var cls = clauses(ans).map(function (c) { return fixTypos(c, rubricWords(rub)).t; });
    if (rub.reject && rub.reject.some(function (g) { return has(g, t); })) return { st: 'no', ideas: [], code: 'contradiction', fixes: fx.fixes };
    var full = [], rev = false, part = false, neg = false;
    rub.ideas.forEach(function (idea, i) {
      var r = scoreIdea(idea, t, cls);
      if (r.neg) neg = true;
      if (r.full && !r.review) full.push(i);
      else if (r.full && r.review) rev = true;
      else if (!r.review && !r.neg && r.frac >= 0.5 && idea.forms.some(function (f) { return f.all.length > 1; })) part = true;
    });
    if (full.length) return { st: 'ok', ideas: full, long: words(ans) > 45, fixes: fx.fixes };
    if (neg) return { st: 'no', ideas: [], code: 'negated', fixes: fx.fixes };
    if (rev || part) return { st: 'review', ideas: [], fixes: fx.fixes };
    return { st: 'no', ideas: [], fixes: fx.fixes };
  }
  var T = {
    ok: ['✓ Correct', 'إجابة صحيحة'],
    blank: ['No answer was written.', 'لم تُكتب إجابة.'],
    noIdea: ['Your answer does not contain the information the question asks for. Find the key words of the question in the text and read that sentence again.', 'إجابتك لا تتضمن المعلومة المطلوبة. ابحث عن الكلمات المفتاحية للسؤال في النص واقرأ الجملة مرة أخرى.'],
    negated: ['Your answer uses the right words but says the opposite (for example with "not" or "never"). Read the sentence in the text again and check what it really says.', 'إجابتك تستخدم الكلمات الصحيحة لكنها تقول العكس (مثلًا باستخدام not أو never). اقرأ الجملة في النص مرة أخرى وتأكد مما تقوله فعلًا.'],
    contra: ['Your answer gives information that is different from the text.', 'إجابتك تذكر معلومة مختلفة عمّا ورد في النص.'],
    review: ['⏳ Your teacher will check this answer. Different wording does not mean it is wrong.', 'سيراجع معلمك هذه الإجابة. اختلاف الصياغة لا يعني أنها خاطئة.'],
    revPart: ['Your answer has part of the idea, or uses different words from the model.', 'إجابتك تحتوي على جزء من الفكرة أو تستخدم كلمات مختلفة عن النموذج.'],
    revLong: ['Your answer is very long. Answer only what the question asks; do not copy whole sentences.', 'إجابتك طويلة جدًا. أجب عن المطلوب فقط ولا تنسخ جملًا كاملة.'],
    same: ['Both points give the same idea. Write two DIFFERENT points.', 'النقطتان تعطيان الفكرة نفسها. اكتب نقطتين مختلفتين.'],
    oneLine: ['You wrote two ideas in one line. Write one point in each box.', 'كتبت فكرتين في سطر واحد. اكتب نقطة في كل مربع.']
  };
  function spellNote(fixes) {
    if (!fixes || !fixes.length) return null;
    var l = fixes.map(function (f) { return f[0] + ' → ' + f[1]; }).join(', ');
    return ['Minor spelling accepted: ' + l + '. Check the spelling next time.', 'قُبلت أخطاء إملائية بسيطة: ' + l + '. انتبه للإملاء في المرة القادمة.'];
  }
  function noWhy(b) { return b.code === 'negated' ? T.negated : b.code === 'contradiction' ? T.contra : T.noIdea; }
  function reading1(ans, rub) {
    var b = judgeBox(ans, rub);
    if (b.st === 'blank') return { state: 'no', got: 0, pts: 1, why: T.blank, code: 'blank' };
    if (b.st === 'ok' && b.long) return { state: 'review', got: 0, pts: 1, why: T.revLong, code: 'long' };
    if (b.st === 'ok') return { state: 'ok', got: 1, pts: 1, why: T.ok, code: b.fixes.length ? 'ok_spelling' : 'ok', note: spellNote(b.fixes) };
    if (b.st === 'review') return { state: 'review', got: 0, pts: 1, why: T.revPart, code: 'partial' };
    return { state: 'no', got: 0, pts: 1, why: noWhy(b), code: b.code || 'no_idea' };
  }
  function reading2(a0, a1, rub) {
    var b = [judgeBox(a0, rub), judgeBox(a1, rub)], used = {}, got = 0, review = false, notes = [], fixes = [];
    if (b[0].st === 'blank' && b[1].st === 'blank') return { state: 'no', got: 0, pts: 2, why: T.blank, boxes: ['no', 'no'], code: 'blank' };
    // two ideas in one line, the other line empty or wrong
    for (var i = 0; i < 2; i++) {
      var o = b[1 - i];
      if (b[i].st === 'ok' && b[i].ideas.length >= 2 && (o.st === 'blank' || o.st === 'no')) { review = true; notes.push(T.oneLine); }
    }
    var boxes = b.map(function (x) {
      if (x.fixes) fixes = fixes.concat(x.fixes);
      if (x.st === 'ok') {
        if (x.long) { review = true; notes.push(T.revLong); return 'review'; }
        var free = x.ideas.filter(function (k) { return !used[k]; });
        if (!free.length) { notes.push(T.same); return 'no'; }
        used[free[0]] = 1; got++; return 'ok';
      }
      if (x.st === 'review') { review = true; notes.push(T.revPart); return 'review'; }
      if (x.code) notes.push(noWhy(x));
      return 'no';
    });
    var state = review ? 'review' : (got === 2 ? 'ok' : 'no');
    var why = state === 'ok' ? T.ok : (notes[0] || (got ? ['One point is correct; the other point is not in the text.', 'نقطة صحيحة، والنقطة الأخرى غير موجودة في النص.'] : T.noIdea));
    var code = state === 'ok' ? (fixes.length ? 'ok_spelling' : 'ok') : state === 'review' ? 'partial' : (got ? 'one_point' : (b.some(function (x) { return x.code === 'negated'; }) ? 'negated' : 'no_idea'));
    return { state: state, got: got, pts: 2, why: why, boxes: boxes, code: code, note: spellNote(fixes) };
  }

  /* ---------------- grammar rewrites ---------------- */
  var RULES = [
    { k: /so\s*(…|\.\.\.)\s*that/, need: [/\bso \w+( \w+)? that\b/], ban: /\bsuch\b/, en: 'Use so + adjective/adverb + that.', ar: 'استخدم so + صفة/ظرف + that.' },
    { k: /such/, need: [/\bsuch (a |an )?(\w+ ){0,3}that\b/], en: 'Use such (a/an) + adjective + noun + that.', ar: 'استخدم such (a/an) + صفة + اسم + that.' },
    { k: /^although$/, need: [/\balthough\b/], ban: /\b(despite|in spite of)\b/, bad: /\balthough (of |the \w+ (is|are|was|were) not\b)/, clause: 'although', en: 'Use although + subject + verb.', ar: 'استخدم although + فاعل + فعل.' },
    { k: /despite|in spite of/, need: [/\b(despite|in spite of)\b/], bad: /\b(despite|in spite of) (of |he |she |it |they |we |i |you |there |(\w+ ){1,2}(is|are|was|were|has|have|felt|enjoyed|feels|enjoys) )/, en: 'After despite / in spite of use a noun or verb + -ing (not a full clause), or "the fact that".', ar: 'بعد despite / in spite of استخدم اسمًا أو فعلًا + ing وليس جملة كاملة، أو the fact that.' },
    { k: /before|after/, need: [/\b(before|after)\b/, /\bhad \w+/], en: 'Use the past perfect (had + past participle) for the action that happened first.', ar: 'استخدم الماضي التام (had + التصريف الثالث) للحدث الذي وقع أولًا.' },
    { k: /^while$/, need: [/\bwhile\b/, /\b(was|were) \w+ing\b/], en: 'Use while + past continuous (was/were + -ing) for the longer action.', ar: 'استخدم while + الماضي المستمر (was/were + ing) للحدث الطويل.' },
    { k: /^when$/, need: [/\bwhen\b/, /\b(was|were) \w+ing\b/], en: 'Use the past continuous for the long action and when + past simple for the short one.', ar: 'الماضي المستمر للحدث الطويل، و when + الماضي البسيط للحدث القصير.' },
    { k: /should/, need: [/\bshould (not )?[a-z]+/], ban: /\bshould to\b/, en: 'Use should + base verb (no "to").', ar: 'استخدم should + المصدر بدون to.' },
    { k: /^must$/, need: [/\bmust (not )?(be )?[a-z]+/], ban: /\bmust to\b/, en: 'Use must + base verb.', ar: 'استخدم must + المصدر.' },
    { k: /have to/, need: [/\b(do|does) not have to [a-z]+/], en: "Use don't / doesn't have to + base verb (= not necessary).", ar: "استخدم don't have to + المصدر (غير ضروري)." },
    { k: /going to/, need: [/\b(was|were) going to [a-z]+/], en: 'Use was / were going to + base verb for a past plan.', ar: 'استخدم was / were going to + المصدر لخطة سابقة.' },
    { k: /get used to|got used to/, need: [/\b(got|get|gotten|getting) used to \w+/], en: 'Use get / got used to + verb-ing.', ar: 'استخدم get / got used to + فعل ing.' },
    { k: /is used to/, need: [/\b(is|am|are|was|were) (now )?used to \w+ing\b/], en: 'Use be used to + verb-ing (= it is normal for me).', ar: 'استخدم be used to + فعل ing (= معتاد).' },
    { k: /^used to$/, need: [/\bused to [a-z]+/], ban: /\b(is|am|are|was|were|get|got) used to\b/, en: 'Use used to + base verb for a past habit.', ar: 'استخدم used to + المصدر لعادة سابقة.' },
    { k: /so that/, need: [/\bso that\b/], soft: /\bso that (\w+ ){1,4}(can|could|will|would|might|may|cannot)\b/, en: 'Use so that + subject + can / could / would + verb.', ar: 'استخدم so that + فاعل + can / could / would + فعل.' }
  ];
  function brackets(s) { return (String(s).match(/\(([^)]*)\)/g) || []).map(function (x) { return x.slice(1, -1).trim().toLowerCase(); }); }
  function rewrite(ans, item, rub) {
    rub = rub || {};
    var n = norm(ans), kws = brackets(item.s), kw = kws[kws.length - 1] || '';
    var model = String(item.a).split(/\s+\/\s+/).map(norm);
    var acc = model.concat((rub.accept || []).map(norm));
    var accRe = (rub.accept_re || []).map(function (r) { return new RegExp(r); });
    var rule = null;
    RULES.forEach(function (r) { if (!rule && kws.some(function (k) { return r.k.test(k); })) rule = r; });
    // prefer the most specific bracket (e.g. "is used to" over "used to")
    kws.forEach(function (k) { RULES.forEach(function (r) { if (r.k.test(k) && /is used|got used|get used/.test(k)) rule = r; }); });
    var modelTxt = item.a.split(/\s+\/\s+/)[0];
    var tip = rule ? [rule.en, rule.ar] : ['Rewrite the sentence with the word(s) in brackets.', 'أعد كتابة الجملة باستخدام الكلمة التي بين القوسين.'];
    if (!n) return { state: 'no', got: 0, pts: 1, why: T.blank, model: modelTxt, code: 'blank' };
    if (acc.indexOf(n) >= 0 || accRe.some(function (r) { return r.test(n); })) return { state: 'ok', got: 1, pts: 1, code: 'ok', why: ['✓ Correct: you used the structure with (' + kw + ') correctly.', 'إجابة صحيحة: استخدمت التركيب مع (' + kw + ') بشكل صحيح.'] };
    var orig = norm(String(item.s).replace(/\([^)]*\)/g, ''));
    if (n === orig) return { state: 'no', got: 0, pts: 1, code: 'copied', why: ['You copied the original sentence. Rewrite it using (' + kw + ').', 'نسخت الجملة الأصلية. أعد كتابتها باستخدام (' + kw + ').'], tip: tip, model: modelTxt };
    var kwParts = function (k) { return norm(k.replace(/…|\.\.\./g, ' ')).split(' ').filter(function (w) { return w && w !== 'had'; }); };
    var kwUsed = kws.some(function (k) { return kwParts(k).every(function (w) { return (' ' + n + ' ').indexOf(' ' + w + ' ') >= 0; }); });
    if (kws.length && !kwUsed) {
      // v2: a misspelt bracket word (e.g. "althogh") is not a wrong structure: the teacher decides
      var toks = n.split(' ');
      var fuzzy = kws.some(function (k) { return kwParts(k).every(function (w) { return toks.some(function (x) { return x === w || (w.length >= 5 && x[0] === w[0] && lev(x, w, 1) <= 1); }); }); });
      if (fuzzy) return { state: 'review', got: 0, pts: 1, code: 'kw_spelling', why: ['The word in brackets (' + kw + ') seems to be misspelt. ' + T.review[0], 'يبدو أن الكلمة التي بين القوسين (' + kw + ') مكتوبة بشكل خاطئ. ' + T.review[1]], tip: tip, model: modelTxt };
      return { state: 'no', got: 0, pts: 1, code: 'no_keyword', why: ['You did not use the word(s) in brackets (' + kws.join(' / ') + ').', 'لم تستخدم الكلمة التي بين القوسين (' + kws.join(' / ') + ').'], tip: tip, model: modelTxt };
    }
    if (rule && /before|after/.test(kw)) {
      var raw = String(ans).toLowerCase(), first = raw.split(',')[0], hadIn = function (x) { return /\bhad\b/.test(norm(x)); }, wrongClause = false;
      if (/^\s*after\b/.test(raw) && raw.indexOf(',') > 0) wrongClause = !hadIn(first);
      else if (/^\s*before\b/.test(raw) && raw.indexOf(',') > 0) wrongClause = hadIn(first) || !hadIn(raw.slice(raw.indexOf(',') + 1));
      else if (/\bafter\b/.test(n)) wrongClause = !hadIn(n.split(/\bafter\b/)[1] || '');
      else if (/\bbefore\b/.test(n)) wrongClause = !hadIn(n.split(/\bbefore\b/)[0] || '');
      if (wrongClause) return { state: 'no', got: 0, pts: 1, code: 'tense_sequence', why: ['The past perfect (had + past participle) must go with the action that happened FIRST.', 'يجب أن يأتي الماضي التام (had + التصريف الثالث) مع الحدث الذي وقع أولًا.'], tip: tip, model: modelTxt };
    }
    if (rule && rule.clause) {
      var rw = String(ans).toLowerCase(), ci = rw.indexOf(rule.clause);
      if (ci >= 0) {
        var seg = rw.slice(ci + rule.clause.length).split(/[,.;]/)[0], segN = norm(seg);
        var verb = { test: function (x) { var w = x.split(' '); return /\b(is|are|was|were|be|been|has|have|had|do|does|did|can|could|will|would|should|must|may|might)\b/.test(x) || w.slice(2).some(function (v) { return /(ed|s)$/.test(v); }); } };
        if (rw.slice(ci).indexOf(',') > 0 && segN.split(' ').length <= 3 && /^(the|a|an|this|these|those|its|their|his|her|our|my|all|many|high|low|bad|heavy)\b/.test(segN) && !verb.test(segN))
          return { state: 'no', got: 0, pts: 1, code: 'no_clause', why: ['After "' + rule.clause + '" you need a full clause (subject + verb), not only a noun.', 'بعد ' + rule.clause + ' تحتاج إلى جملة كاملة (فاعل + فعل) وليس اسمًا فقط.'], tip: tip, model: modelTxt };
      }
    }
    if (rule) {
      var missing = rule.need.filter(function (r) { return !r.test(n); });
      if (missing.length || (rule.ban && rule.ban.test(n)) || (rule.bad && rule.bad.test(n)))
        return { state: 'no', got: 0, pts: 1, code: 'structure', why: ['The required structure with (' + kw + ') is missing or wrong. ' + rule.en, 'التركيب المطلوب مع (' + kw + ') غير موجود أو غير صحيح. ' + rule.ar], tip: tip, model: modelTxt };
      if (rule.soft && !rule.soft.test(n))
        return { state: 'review', got: 0, pts: 1, code: 'check_verb', why: ['Check the verb after "so that" (can / could / would). ' + T.review[0], 'راجع الفعل بعد so that (can / could / would). ' + T.review[1]], tip: tip, model: modelTxt };
    } else if (kw && n.indexOf(norm(kw)) < 0) {
      return { state: 'no', got: 0, pts: 1, code: 'no_keyword', why: ['You did not use the word in brackets (' + kw + ').', 'لم تستخدم الكلمة التي بين القوسين (' + kw + ').'], tip: tip, model: modelTxt };
    }
    // structure is right: token-level comparison with the closest accepted answer;
    // only harmless differences (and, v2, single-letter typos in meaning words) are allowed
    var mineT = n.split(' '), best = null;
    acc.forEach(function (a) {
      var at = a.split(' '), A = at.slice(), extra = [];
      mineT.forEach(function (w) { var i = A.indexOf(w); if (i >= 0) A.splice(i, 1); else extra.push(w); });
      // pair up typos: an extra word that is 1 edit away from a missing word (≥5 letters, same first letter)
      var typos = [];
      extra = extra.filter(function (w) {
        for (var j = 0; j < A.length; j++) {
          var m = A[j];
          if (Math.max(m.length, w.length) >= 5 && m[0] === w[0] && !HARMLESS[m] && lev(w, m, 1) <= 1 && !/^(is|are|was|were|has|have|had|can|could|will|would)$/.test(m)) { typos.push([w, m]); A.splice(j, 1); return false; }
        }
        return true;
      });
      var diff = extra.concat(A);
      if (!best || diff.length + typos.length * 0.5 < best.diff.length + best.typos.length * 0.5) best = { diff: diff, typos: typos };
    });
    if (best && best.diff.length <= 3 && best.diff.every(function (w) { return HARMLESS[w]; })) {
      if (best.typos.length > 1) return { state: 'review', got: 0, pts: 1, code: 'spelling', why: ['The structure is right, but several words are misspelt. ' + T.review[0], 'التركيب صحيح لكن هناك عدة كلمات مكتوبة بشكل خاطئ. ' + T.review[1]], tip: tip, model: modelTxt };
      return { state: 'ok', got: 1, pts: 1, code: best.typos.length ? 'ok_spelling' : 'ok', note: spellNote(best.typos), why: ['✓ Correct: the structure and the meaning are right.', 'إجابة صحيحة: التركيب والمعنى صحيحان.'] };
    }
    return { state: 'review', got: 0, pts: 1, code: 'differs', why: ['The structure is right, but your sentence is different from the model. ' + T.review[0], 'التركيب صحيح لكن جملتك مختلفة عن النموذج. ' + T.review[1]], tip: tip, model: modelTxt };
  }

  /* ---------------- word formation (v2) ---------------- */
  var VAR = [[/ise$/, 'ize'], [/isation$/, 'ization'], [/our$/, 'or'], [/ourable$/, 'orable'], [/tre$/, 'ter'], [/ence$/, 'ense']];
  function variantsOf(w) { var out = [w]; VAR.forEach(function (v) { if (v[0].test(w)) out.push(w.replace(v[0], v[1])); }); return out; }
  function pos(w) {
    if (/(tion|sion|ment|ity|ness|ence|ance|ery|ship|hood|ism|ality)$/.test(w)) return 'noun';
    if (/(al|ous|ive|able|ible|ful|less|ic|ing|ed|y)$/.test(w)) return 'adj';
    return '';
  }
  var POS = { noun: ['a noun', 'اسمًا'], adj: ['an adjective', 'صفة'] };
  function wordForm(ans, key, base) {
    var a = norm(ans), keys = String(key).split(/\s*\/\s*/).map(norm);
    var b = norm(base || '');
    if (!a) return { state: 'no', got: 0, pts: 1, why: T.blank, code: 'blank' };
    var ok = keys.some(function (k) { return variantsOf(k).indexOf(a) >= 0 || variantsOf(a).indexOf(k) >= 0; });
    if (ok) return { state: 'ok', got: 1, pts: 1, why: T.ok, code: 'ok' };
    if (b && a === b) return { state: 'no', got: 0, pts: 1, code: 'unchanged', why: ['You copied the word in brackets. Change its form so that it fits the gap.', 'نسخت الكلمة التي بين القوسين. غيّر صيغتها لتناسب الفراغ.'] };
    var near = keys.some(function (k) { return k.length >= 6 && a[0] === k[0] && lev(a, k, 1) <= 1; });
    var need = pos(keys[0]), got = pos(a);
    if (near) return { state: 'review', got: 0, pts: 1, code: 'spelling', why: ['You chose the right word, but check the spelling. ' + T.review[0], 'اخترت الكلمة الصحيحة لكن راجع الإملاء. ' + T.review[1]] };
    if (need && got && need !== got) return { state: 'no', got: 0, pts: 1, code: 'word_class', why: ['The gap needs ' + POS[need][0] + ', but you wrote ' + POS[got][0] + '.', 'الفراغ يحتاج إلى ' + POS[need][1] + '، لكنك كتبت ' + POS[got][1] + '.'] };
    return { state: 'no', got: 0, pts: 1, code: 'wrong_form', why: ['This is not the correct form for the gap. Look at the word before and after the gap: does it need a noun, an adjective or a verb?', 'هذه ليست الصيغة الصحيحة للفراغ. انظر إلى الكلمة قبل الفراغ وبعده: هل يحتاج إلى اسم أم صفة أم فعل؟'] };
  }

  // merge an overlay (cr/<page>.extra.js) into rubric data: extra forms, extra ideas, reject patterns, accept lists
  function mergeRubric(base, extra) {
    if (!base || !extra) return base;
    Object.keys(extra).forEach(function (t) {
      base[t] = base[t] || {};
      Object.keys(extra[t]).forEach(function (id) {
        var e = extra[t][id], b = base[t][id] = base[t][id] || {};
        if (e.reject) b.reject = (b.reject || []).concat(e.reject);
        if (e.accept) b.accept = (b.accept || []).concat(e.accept);
        if (e.accept_re) b.accept_re = (b.accept_re || []).concat(e.accept_re);
        if (e.ideas) { b.ideas = b.ideas || []; e.ideas.forEach(function (x, i) {
          if (x.idea != null && b.ideas[x.idea]) { if (x.forms) b.ideas[x.idea].forms = b.ideas[x.idea].forms.concat(x.forms); if (x.negOk) b.ideas[x.idea].negOk = true; }
          else if (x.forms) b.ideas.push({ forms: x.forms, review: !!x.review });
        }); }
      });
    });
    return base;
  }

  var API = { norm: norm, reading1: reading1, reading2: reading2, rewrite: rewrite, wordForm: wordForm, setLexicon: setLexicon, fixTypos: fixTypos, mergeRubric: mergeRubric, lev: lev, T: T, version: 2 };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SSHCR = API;
})(this);
