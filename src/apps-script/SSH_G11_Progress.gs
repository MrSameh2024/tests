/* ===== Part 1: analytics (same code as ssh-g11-analytics.js on the website, tested) ===== */
/* Smart Students Hub · Grade 11 analytics (pure functions, browser + Node)
   Turns rows of the "Submissions" sheet (CSV export, same column names) into student, class, skill and item
   statistics. Nothing is sent anywhere. Used by teacher-g11-dashboard.html and src/tests/g11-analytics.test.js.
   Every number comes from recorded rows; anything that cannot be computed is returned as null, never estimated. */
(function (root) {
  'use strict';
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false;
    text = String(text || '').replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (x) { return x !== ''; }); });
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) { var o = {}; head.forEach(function (h, j) { o[h] = r[j] == null ? '' : r[j]; }); return o; });
  }
  function pick(o, names) { for (var i = 0; i < names.length; i++) { var k = Object.keys(o).find(function (h) { return h.toLowerCase() === names[i]; }); if (k != null && o[k] !== '') return o[k]; } return ''; }
  function parseDate(s) {
    s = String(s || '').trim(); if (!s) return null;
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);   // Sheets dd/mm/yyyy
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    var d = new Date(s.replace(' ', 'T')); return isNaN(d) ? null : d;
  }
  var SECTIONS = ['Reading', 'Vocabulary', 'Grammar', 'Listening', 'Writing'];
  // "Reading 7/14; Vocabulary 5/10; Grammar 0/10; …; Writing /10 by teacher (…)"
  function parseBreakdown(s) {
    var out = {};
    SECTIONS.forEach(function (sec) {
      var m = new RegExp('\\b' + sec + '\\s+(\\d+(?:\\.\\d+)?)\\s*/\\s*(\\d+)', 'i').exec(s || '');
      if (m) out[sec.toLowerCase()] = { got: +m[1], max: +m[2] };
    });
    return out;
  }
  // teacher writing mark, if recorded in the teacher feedback, e.g. "Writing 7/10" or "7/10"
  function parseWriting(fb) {
    var m = /writing[^0-9]{0,12}(\d+(?:\.\d+)?)\s*\/\s*10\b/i.exec(fb || '') || /^\s*(\d+(?:\.\d+)?)\s*\/\s*10\b/.exec(fb || '');
    return m ? { got: +m[1], max: 10 } : null;
  }
  // item-level results from the "Answers" text the exam page sends
  function itemStatus(tag) {
    if (!tag) return null;
    if (/✓/.test(tag) && !/✗/.test(tag) && !/REVIEW|pending|not self/.test(tag)) return 'ok';
    if (/\[auto ½/.test(tag)) return 'partial';
    if (/TEACHER REVIEW|pending teacher review|not self-marked/.test(tag)) return 'review';
    if (/\[self: (\d)\/(\d)\]/.test(tag)) { var m = /\[self: (\d)\/(\d)\]/.exec(tag); return +m[1] === +m[2] ? 'ok' : (+m[1] ? 'partial' : 'no'); }
    if (/\[blank\]|✗/.test(tag)) return 'no';
    return null;
  }
  function parseItems(text) {
    var it = {};
    String(text || '').split(/\n/).forEach(function (line) {
      var m;
      if ((m = /^Q(1|7|9): (.*)$/.exec(line))) {
        var p = { '1': 'a', '7': 'v', '9': 'g' }[m[1]];
        m[2].split(' | ').forEach(function (x) { var k = /^(\d)\) (\S+)\s*(.*)$/.exec(x); if (k) it[p + (k[1] - 1)] = itemStatus(k[3]); });
      } else if ((m = /^Q2: (.*)$/.exec(line))) {
        m[1].split(' | ').forEach(function (x) { var k = /^([ABC])\) (\S+)\s*(.*)$/.exec(x); if (k) it['tf' + 'ABC'.indexOf(k[1])] = itemStatus(k[3]); });
      } else if ((m = /^Q8: (.*)$/.exec(line))) {
        m[1].split(' | ').forEach(function (x) { var k = /^(\d)\) (.*?)( ✓| ✗.*| \[TEACHER REVIEW.*)?$/.exec(x); if (k) it['wf' + (k[1] - 1)] = itemStatus(k[3] || '[blank]'); });
      } else if ((m = /^Q3: .*?(\[[^\]]*\]|✓ auto)\s*$/.exec(line))) it.q3 = itemStatus(m[1]);
      else if ((m = /^Q4 .+?: .*?(\[[^\]]*\]|✓ auto[^\]]*)\s*$/.exec(line))) { var n = it._q4 || 0; it['q4_' + n] = itemStatus(m[1]); it._q4 = n + 1; }
      else if ((m = /^Q(5|6): .*?(\[[^\]]*\]|✓ auto[^\]]*)\s*$/.exec(line))) it['q' + m[1]] = itemStatus(m[2]);
      else if ((m = /^Q10\.(\d): .*?(\[[^\]]*\]|✓ auto)\s*$/.exec(line))) it['rw' + (m[1] - 1)] = itemStatus(m[2]);
    });
    delete it._q4;
    return it;
  }
  function normClass(c) { return String(c || '').trim().replace(/\s+/g, '').replace(/[-_.\\]/g, '/'); }
  // one normalised record per submission row
  function records(rows, opts) {
    opts = opts || {};
    return rows.map(function (r, i) {
      var test = pick(r, ['test']), m = /Grade 11 Advanced Test (\d+)/.exec(test);
      var score = parseFloat(pick(r, ['score'])), max = parseFloat(pick(r, ['max']));
      var sec = parseBreakdown(pick(r, ['section breakdown', 'breakdown']));
      var w = parseWriting(pick(r, ['teacher feedback']));
      if (w) sec.writing = w;
      return {
        row: i + 2, time: parseDate(pick(r, ['timestamp', 'time', 'date'])), ref: pick(r, ['reference', 'sid']),
        test: test, g11: m ? +m[1] : null, name: pick(r, ['student name', 'name']).trim(), cls: normClass(pick(r, ['class', 'cls'])),
        score: isNaN(score) ? null : score, max: isNaN(max) ? null : max, pct: (!isNaN(score) && max > 0) ? score / max * 100 : null,
        sections: sec, items: parseItems(pick(r, ['answers'])), feedback: pick(r, ['feedback status']), essay: pick(r, ['essay']),
        writingPending: !!pick(r, ['essay']) && !w
      };
    }).filter(function (x) { return x.name && (!opts.g11Only || x.g11); });
  }
  function key(name) { return String(name).trim().toLowerCase().replace(/\s+/g, ' '); }
  function mean(a) { a = a.filter(function (x) { return x != null && !isNaN(x); }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function sd(a) { a = a.filter(function (x) { return x != null && !isNaN(x); }); if (a.length < 2) return null; var m = mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)); }
  function median(a) { a = a.filter(function (x) { return x != null; }).sort(function (x, y) { return x - y; }); if (!a.length) return null; var h = a.length >> 1; return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2; }
  // students: attempts in time order, first (baseline) and latest, section and skill mastery
  function students(recs, skillMap) {
    var by = {};
    recs.forEach(function (r) { (by[key(r.name)] = by[key(r.name)] || { name: r.name, cls: r.cls, attempts: [] }).attempts.push(r); });
    return Object.keys(by).map(function (k) {
      var s = by[k];
      s.attempts.sort(function (a, b) { return (a.time || 0) - (b.time || 0) || a.row - b.row; });
      var scored = s.attempts.filter(function (a) { return a.pct != null; });
      s.first = scored[0] || null; s.latest = scored[scored.length - 1] || null;
      s.best = scored.reduce(function (b, a) { return !b || a.pct > b.pct ? a : b; }, null);
      s.change = s.first && s.latest && s.first !== s.latest ? s.latest.pct - s.first.pct : null;
      s.days = Object.keys(s.attempts.reduce(function (o, a) { if (a.time) o[a.time.toDateString()] = 1; return o; }, {})).length;
      var sec = {};
      s.attempts.forEach(function (a) { Object.keys(a.sections).forEach(function (n) { sec[n] = sec[n] || { got: 0, max: 0, n: 0 }; sec[n].got += a.sections[n].got; sec[n].max += a.sections[n].max; sec[n].n++; }); });
      s.sections = {}; Object.keys(sec).forEach(function (n) { s.sections[n] = sec[n].max ? sec[n].got / sec[n].max * 100 : null; });
      s.skills = skillStats(s.attempts, skillMap);
      s.pendingReview = s.attempts.reduce(function (n, a) { return n + Object.values(a.items).filter(function (v) { return v === 'review'; }).length; }, 0);
      s.writingPending = s.attempts.filter(function (a) { return a.writingPending; }).length;
      return s;
    });
  }
  // skill mastery from item results (auto-decided items only; review items excluded and counted separately)
  function skillStats(attempts, skillMap) {
    var out = {};
    if (!skillMap) return out;
    attempts.forEach(function (a) {
      var tags = a.g11 && skillMap[a.g11]; if (!tags) return;
      Object.keys(a.items).forEach(function (id) {
        var st = a.items[id], sk = tags[id]; if (!sk || !st) return;
        var o = out[sk] = out[sk] || { ok: 0, partial: 0, no: 0, review: 0 };
        o[st] = (o[st] || 0) + 1;
      });
    });
    Object.keys(out).forEach(function (k) { var o = out[k], n = o.ok + o.partial + o.no; o.n = n; o.pct = n ? (o.ok + o.partial * 0.5) / n * 100 : null; });
    return out;
  }
  function items(recs, skillMap) {
    var out = {};
    recs.forEach(function (a) {
      if (!a.g11) return;
      Object.keys(a.items).forEach(function (id) {
        var st = a.items[id]; if (!st) return;
        var k = a.g11 + ':' + id, o = out[k] = out[k] || { test: a.g11, item: id, skill: skillMap && skillMap[a.g11] ? skillMap[a.g11][id] : null, ok: 0, partial: 0, no: 0, review: 0 };
        o[st]++;
      });
    });
    return Object.keys(out).map(function (k) { var o = out[k], n = o.ok + o.partial + o.no; o.n = n; o.facility = n ? (o.ok + o.partial * 0.5) / n * 100 : null; return o; });
  }
  // paired pre/post: each student's attempt on the pre filter vs the post filter (first matching pre, latest matching post)
  function prePost(studs, isPre, isPost) {
    var pairs = [];
    studs.forEach(function (s) {
      var pre = s.attempts.filter(function (a) { return a.pct != null && isPre(a); });
      var post = s.attempts.filter(function (a) { return a.pct != null && isPost(a); });
      if (!pre.length || !post.length) return;
      var p0 = pre[0], p1 = post[post.length - 1];
      if (p0 === p1 || (p0.time && p1.time && p1.time < p0.time)) return;
      pairs.push({ name: s.name, pre: p0.pct, post: p1.pct, diff: p1.pct - p0.pct });
    });
    var d = pairs.map(function (p) { return p.diff; });
    var sdd = sd(d), md = mean(d);
    // Wilcoxon signed-rank is safer for small classes; we report it as descriptive z only when n ≥ 10
    return { n: pairs.length, pairs: pairs, preMean: mean(pairs.map(function (p) { return p.pre; })), postMean: mean(pairs.map(function (p) { return p.post; })),
      meanDiff: md, sdDiff: sdd, dz: (md != null && sdd) ? md / sdd : null, improved: pairs.filter(function (p) { return p.diff > 0; }).length,
      tPaired: (md != null && sdd && pairs.length > 1) ? md / (sdd / Math.sqrt(pairs.length)) : null };
  }
  function lowAchievers(studs, threshold) {
    // baseline (first attempt) below the threshold, or in the bottom quartile of baselines when threshold is null
    var base = studs.filter(function (s) { return s.first; });
    var cut = threshold;
    if (cut == null) { var v = base.map(function (s) { return s.first.pct; }).sort(function (a, b) { return a - b; }); cut = v.length ? v[Math.floor((v.length - 1) * 0.25)] : null; }
    return { cut: cut, list: base.filter(function (s) { return cut != null && s.first.pct <= cut; }) };
  }
  // student needs support: latest below target AND (latest < 50% OR not improving OR a skill < 40% over 5+ answers OR only one attempt)
  function flags(s, target) {
    var f = [];
    if (!s.latest) return ['no scored attempt'];
    if (s.latest.pct >= target) return f;          // at or above target: no flag
    if (s.latest.pct < 50) f.push('latest below 50%');
    if (s.latest.pct < target && s.change != null && s.change <= 0) f.push('not improving');
    Object.keys(s.skills).forEach(function (k) { var o = s.skills[k]; if (o.n >= 5 && o.pct < 40) f.push('weak: ' + k); });
    if (s.attempts.length === 1 && s.latest.pct < target) f.push('only one attempt');
    return f;
  }
  var API = { parseCSV: parseCSV, parseBreakdown: parseBreakdown, parseItems: parseItems, parseWriting: parseWriting, records: records, students: students,
    items: items, prePost: prePost, lowAchievers: lowAchievers, flags: flags, mean: mean, median: median, sd: sd, normClass: normClass };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SSHG11A = API;
})(globalThis);

/* ===== Part 2: G11 Progress tab ===== */
/**
 * Smart Students Hub · "G11 Progress" tab (private, inside this sheet)
 * Run buildG11Progress from the Apps Script editor (or from a menu item, if you add one).
 * It reads the Submissions tab and rebuilds ONLY the tab "G11 Progress". It never changes Submissions or any other tab.
 * Settings are kept on the tab itself (yellow cells): class, target %, class size, baseline test, post test.
 * Rules: only "Grade 11 Advanced Test" rows; class "Teacher" rows are left out; for pre/post and skills each
 * student's FIRST attempt at each test is used, so repeated submissions do not inflate the results.
 * Every number comes from recorded rows. Nothing is estimated.
 */
var G11P = { TAB: 'G11 Progress', SKILLS: {"GR_CAUSE":["Cause: because, because of, as, since","التعبير عن السبب","Grammar"],"GR_CONTR":["Contrast: although, even though, despite, in spite of","أدوات التضاد","Grammar"],"GR_FUT":["Future forms (will, be going to, present for future, was going to)","صيغ المستقبل","Grammar"],"GR_MOD_ADV":["Modal verbs: advice (should, ought to)","أفعال النصيحة","Grammar"],"GR_MOD_OBL":["Modal verbs: obligation, prohibition and no necessity (must, mustn't, have to, don't have to)","أفعال الوجوب والمنع وعدم الضرورة","Grammar"],"GR_PASS":["The passive voice","المبني للمجهول","Grammar"],"GR_PAST":["Past simple and past continuous (when / while)","الماضي البسيط والماضي المستمر","Grammar"],"GR_PASTPERF":["Past perfect (by the time, before, after)","الماضي التام","Grammar"],"GR_PURP":["Purpose: so that, in order to, to","التعبير عن الغرض","Grammar"],"GR_SOSUCH":["so … that / such … that","so … that و such … that","Grammar"],"GR_USED":["used to, would, be / get used to","used to و would و be/get used to","Grammar"],"RD_DETAIL":["Finding supporting details","تحديد التفاصيل الداعمة","Reading"],"RD_INFER":["Making inferences","الاستنتاج","Reading"],"RD_LIST":["Finding TWO / THREE points (mention / give)","استخراج نقطتين أو ثلاث نقاط","Reading"],"RD_MAIN":["Main idea and writer's purpose","الفكرة الرئيسة وهدف الكاتب","Reading"],"RD_REF":["Reference: what words and numbers refer to","الإحالة: إلامَ تشير الكلمات والأرقام","Reading"],"RD_TFNG":["True / False / Not Mentioned (Not Given)","صح / خطأ / غير مذكور","Reading"],"RD_VOCAB":["Vocabulary in context (closest meaning)","معنى الكلمة من السياق","Reading"],"VO_EDING":["-ed and -ing adjectives","الصفات المنتهية بـ ed و ing","Vocabulary"],"VO_PREF":["Prefixes (over-, under-, un-, dis-, re-)","البادئات","Vocabulary"],"VO_PREP":["Dependent prepositions (verb / adjective + preposition)","حروف الجر الملازمة","Vocabulary"],"VO_TOPIC":["Topic vocabulary in context","مفردات الوحدة في السياق","Vocabulary"],"VO_WF":["Word formation (suffixes and word families)","تكوين الكلمات (اللواحق)","Vocabulary"]}, ITEMS: {"1":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_VOCAB","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_PREP","v1":"VO_PREP","v2":"VO_PREF","v3":"VO_EDING","v4":"VO_TOPIC","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_PASTPERF","g1":"GR_PAST","g2":"GR_CONTR","g3":"GR_PURP","g4":"GR_USED","g5":"GR_MOD_OBL","rw0":"GR_SOSUCH","rw1":"GR_CONTR","rw2":"GR_PASTPERF","rw3":"GR_MOD_ADV"},"2":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_INFER","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_TOPIC","v1":"VO_TOPIC","v2":"VO_TOPIC","v3":"VO_EDING","v4":"VO_TOPIC","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_PAST","g1":"GR_PASTPERF","g2":"GR_PASTPERF","g3":"GR_CONTR","g4":"GR_CAUSE","g5":"GR_FUT","rw0":"GR_SOSUCH","rw1":"GR_PASTPERF","rw2":"GR_PAST","rw3":"GR_MOD_OBL"},"3":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_REF","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_PREP","v1":"VO_PREP","v2":"VO_PREF","v3":"VO_EDING","v4":"VO_TOPIC","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_CAUSE","g1":"GR_PURP","g2":"GR_CONTR","g3":"GR_SOSUCH","g4":"GR_PASTPERF","g5":"GR_USED","rw0":"GR_SOSUCH","rw1":"GR_CONTR","rw2":"GR_PURP","rw3":"GR_MOD_ADV"},"4":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_VOCAB","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_PREP","v1":"VO_TOPIC","v2":"VO_TOPIC","v3":"VO_PREF","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_CONTR","g1":"GR_PURP","g2":"GR_MOD_OBL","g3":"GR_USED","g4":"GR_PASTPERF","g5":"GR_USED","rw0":"GR_SOSUCH","rw1":"GR_CONTR","rw2":"GR_MOD_OBL","rw3":"GR_FUT"},"5":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_VOCAB","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_TOPIC","v1":"VO_TOPIC","v2":"VO_TOPIC","v3":"VO_PREP","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_USED","g1":"GR_USED","g2":"GR_USED","g3":"GR_PASTPERF","g4":"GR_CONTR","g5":"GR_PURP","rw0":"GR_PASTPERF","rw1":"GR_SOSUCH","rw2":"GR_USED","rw3":"GR_USED"},"6":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_DETAIL","a3":"RD_INFER","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_PREP","v1":"VO_PREP","v2":"VO_PREF","v3":"VO_TOPIC","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_USED","g1":"GR_PASTPERF","g2":"GR_CAUSE","g3":"GR_PURP","g4":"GR_CONTR","g5":"GR_MOD_OBL","rw0":"GR_SOSUCH","rw1":"GR_PASTPERF","rw2":"GR_CONTR","rw3":"GR_MOD_OBL"},"7":{"a0":"RD_DETAIL","a1":"RD_DETAIL","a2":"RD_DETAIL","a3":"RD_VOCAB","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_EDING","v1":"VO_EDING","v2":"VO_PREF","v3":"VO_PREP","v4":"VO_TOPIC","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_PAST","g1":"GR_PASTPERF","g2":"GR_CONTR","g3":"GR_PURP","g4":"GR_SOSUCH","g5":"GR_MOD_OBL","rw0":"GR_SOSUCH","rw1":"GR_CONTR","rw2":"GR_PAST","rw3":"GR_MOD_ADV"},"8":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_VOCAB","a3":"RD_DETAIL","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_TOPIC","v1":"VO_TOPIC","v2":"VO_PREF","v3":"VO_PREP","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_CAUSE","g1":"GR_PURP","g2":"GR_CONTR","g3":"GR_PASTPERF","g4":"GR_MOD_OBL","g5":"GR_FUT","rw0":"GR_SOSUCH","rw1":"GR_PASTPERF","rw2":"GR_CONTR","rw3":"GR_USED"},"9":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_DETAIL","a3":"RD_DETAIL","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_TOPIC","v1":"VO_TOPIC","v2":"VO_TOPIC","v3":"VO_PREP","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_PAST","g1":"GR_PASS","g2":"GR_FUT","g3":"GR_SOSUCH","g4":"GR_CONTR","g5":"GR_PURP","rw0":"GR_PASTPERF","rw1":"GR_PAST","rw2":"GR_SOSUCH","rw3":"GR_PURP"},"10":{"a0":"RD_MAIN","a1":"RD_DETAIL","a2":"RD_DETAIL","a3":"RD_DETAIL","tf0":"RD_TFNG","tf1":"RD_TFNG","tf2":"RD_TFNG","q3":"RD_DETAIL","q4_0":"RD_REF","q4_1":"RD_REF","q5":"RD_LIST","q6":"RD_LIST","v0":"VO_PREF","v1":"VO_PREP","v2":"VO_PREP","v3":"VO_TOPIC","v4":"VO_EDING","wf0":"VO_WF","wf1":"VO_WF","wf2":"VO_WF","wf3":"VO_WF","wf4":"VO_WF","g0":"GR_CONTR","g1":"GR_PURP","g2":"GR_MOD_OBL","g3":"GR_MOD_OBL","g4":"GR_PASTPERF","g5":"GR_SOSUCH","rw0":"GR_MOD_ADV","rw1":"GR_CONTR","rw2":"GR_PURP","rw3":"GR_USED"}} };

function buildG11Progress() {
  var ss = SpreadsheetApp.getActive(), sub = ss.getSheetByName('Submissions');
  if (!sub) throw new Error('Tab "Submissions" not found.');
  var sh = ss.getSheetByName(G11P.TAB);
  var cfg = { cls: '11/7', target: 70, size: '', pre: 'first', post: 'latest' };
  if (sh) {   // keep the teacher's settings
    var s = sh.getRange('B4:B8').getDisplayValues().map(function (r) { return String(r[0]).trim(); });
    if (s[0]) cfg.cls = s[0]; if (Number(s[1])) cfg.target = Number(s[1]); cfg.size = Number(s[2]) || '';
    if (s[3]) cfg.pre = s[3].toLowerCase(); if (s[4]) cfg.post = s[4].toLowerCase();
  } else sh = ss.insertSheet(G11P.TAB);
  var res = g11pCompute_(sub.getDataRange().getDisplayValues(), cfg);
  sh.clear(); sh.clearConditionalFormatRules && sh.clearConditionalFormatRules();
  var W = 12, rows = res.rows.map(function (r) { r = r.slice(0, W); while (r.length < W) r.push(''); return r; });
  sh.getRange(1, 1, rows.length, W).setValues(rows);
  sh.getRange(1, 1, rows.length, W).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  sh.getRange('B4:B8').setBackground('#fff4c2');
  res.heads.forEach(function (r) { sh.getRange(r, 1, 1, W).setFontWeight('bold').setBackground('#26357a').setFontColor('#ffffff'); });
  res.subheads.forEach(function (r) { sh.getRange(r, 1, 1, W).setFontWeight('bold').setBackground('#e8ecf6'); });
  res.colors.forEach(function (c) { sh.getRange(c[0], c[1]).setBackground(c[2]); });
  sh.setFrozenRows(2); sh.setColumnWidth(1, 230); for (var c = 2; c <= W; c++) sh.setColumnWidth(c, 105);
  return res.summary;
}

function g11pCompute_(grid, cfg) {
  var A = SSHG11A, head = grid[0], objs = grid.slice(1).map(function (r) { var o = {}; head.forEach(function (h, j) { o[h] = r[j]; }); return o; });
  var all = A.records(objs, { g11Only: true }).filter(function (r) { return !/^teacher$/i.test(r.cls); });
  var want = A.normClass(cfg.cls), T = cfg.target;
  var recs = all.filter(function (r) { return !want || want === 'all' || r.cls === want; });
  // first attempt per student per test (research view)
  var seen = {}, firsts = recs.slice().sort(function (a, b) { return (a.time || 0) - (b.time || 0) || a.row - b.row; }).filter(function (r) {
    var k = r.name.toLowerCase().trim() + '|' + r.g11; if (seen[k]) return false; seen[k] = 1; return true; });
  var studs = A.students(firsts, G11P.ITEMS), studsAll = A.students(recs, G11P.ITEMS);
  var pick = function (s, w) { var sc = s.attempts.filter(function (a) { return a.pct != null; }); if (!sc.length) return null;
    if (w === 'first') return sc[0]; if (w === 'latest') return sc[sc.length - 1]; var t = Number(String(w).replace(/\D/g, '')); return sc.filter(function (a) { return a.g11 === t; })[0] || null; };
  var pp = A.prePost(studs, function (a) { return a === pick(studs.filter(function (s) { return s.name === a.name; })[0], cfg.pre); },
    function (a) { return a === pick(studs.filter(function (s) { return s.name === a.name; })[0], cfg.post); });
  var low = A.lowAchievers(studs, null), lowSet = {}; low.list.forEach(function (s) { lowSet[s.name] = 1; });
  var lpp = A.prePost(studs.filter(function (s) { return lowSet[s.name]; }), function (a) { return a === pick(studs.filter(function (s) { return s.name === a.name; })[0], cfg.pre); },
    function (a) { return a === pick(studs.filter(function (s) { return s.name === a.name; })[0], cfg.post); });
  var R = function (v) { return v == null || isNaN(v) ? '—' : Math.round(v) + '%'; }, S = function (v) { return v == null ? '—' : (v > 0 ? '+' : '') + Math.round(v) + ' pts'; };
  var rows = [], heads = [], subheads = [], colors = [], col = function (v) { return v == null ? null : v >= T ? '#d9f2e0' : v >= T - 15 ? '#fff1d6' : '#fde3e0'; };
  var add = function (r) { rows.push(r); return rows.length; };
  add(['G11 Progress · متابعة الصف الحادي عشر']);
  add(['PRIVATE · rebuilt ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Qatar', 'd MMM yyyy HH:mm') + ' · from tab Submissions · change the yellow cells, then run buildG11Progress again']);
  add([]);
  add(['Class (e.g. 11/7, or all)', cfg.cls, 'الصف']); add(['Target %', T, 'الهدف']); add(['Students in class (for participation)', cfg.size, 'عدد طلاب الصف']);
  add(['Pre test (first / latest / Test 1 … Test 10)', cfg.pre, 'الاختبار القبلي']); add(['Post test (first / latest / Test 1 … Test 10)', cfg.post, 'الاختبار البعدي']);
  add([]);
  var L = studsAll.filter(function (s) { return s.latest; }).map(function (s) { return s.latest.pct; });
  heads.push(add(['1 · Overview · نظرة عامة', 'Value']));
  add(['Students with a result', studsAll.length + (cfg.size ? ' of ' + cfg.size + ' (' + Math.round(studsAll.length / cfg.size * 100) + '%)' : '')]);
  add(['Results received (all attempts)', recs.length]);
  add(['Repeated submissions of the same test (not used for pre/post)', recs.length - firsts.length]);
  var avg = A.mean(L); var r0 = add(['Class average, latest attempt', R(avg)]); colors.push([r0, 2, col(avg)]);
  add(['Students at or above ' + T + '% (latest)', L.length ? L.filter(function (v) { return v >= T; }).length + ' of ' + L.length : '—']);
  add(['Students needing support', studsAll.filter(function (s) { return A.flags(s, T).length; }).length]);
  add(['Answers waiting for teacher review', studsAll.reduce(function (n, s) { return n + s.pendingReview; }, 0)]);
  add(['Essays without a recorded writing mark', studsAll.reduce(function (n, s) { return n + s.writingPending; }, 0)]);
  add([]);
  heads.push(add(['2 · Students · الطلاب', 'Attempts', 'Baseline', 'Latest', 'Change', 'Reading', 'Vocabulary', 'Grammar', 'Writing', 'Pending review', 'Status', 'Needs']));
  studsAll.slice().sort(function (a, b) { return (a.latest ? a.latest.pct : 0) - (b.latest ? b.latest.pct : 0); }).forEach(function (s) {
    var f = A.flags(s, T), lt = s.latest ? s.latest.pct : null;
    var r = add([s.name + ' (' + s.cls + ')', s.attempts.length, R(s.first && s.first.pct), R(lt), S(s.change), R(s.sections.reading), R(s.sections.vocabulary), R(s.sections.grammar),
      s.sections.writing == null ? 'not marked' : R(s.sections.writing), s.pendingReview, lt == null ? '—' : lt >= T ? 'at target' : 'below target',
      f.map(function (x) { return x.replace(/^weak: (.*)$/, function (m, k) { return 'weak: ' + (G11P.SKILLS[k] ? G11P.SKILLS[k][0] : k); }); }).join('; ')]);
    colors.push([r, 4, col(lt)]);
  });
  add([]);
  heads.push(add(['3 · Skills (first attempts) · المهارات', 'Correct', 'Answers', 'Waiting review', 'Arabic', 'Area']));
  var sk = {}; studs.forEach(function (s) { Object.keys(s.skills).forEach(function (k) { var o = s.skills[k], x = sk[k] = sk[k] || { ok: 0, p: 0, no: 0, rv: 0 }; x.ok += o.ok; x.p += o.partial || 0; x.no += o.no; x.rv += o.review || 0; }); });
  Object.keys(sk).map(function (k) { var x = sk[k], n = x.ok + x.p + x.no; return [k, n ? (x.ok + x.p / 2) / n * 100 : null, n, x.rv]; })
    .filter(function (x) { return x[2] >= 3; }).sort(function (a, b) { return a[1] - b[1]; }).forEach(function (x) {
      var nm = G11P.SKILLS[x[0]] || [x[0], '', ''], r = add([nm[0], R(x[1]), x[2], x[3], nm[1], nm[2]]); colors.push([r, 2, col(x[1])]); });
  add([]);
  heads.push(add(['4 · Pre / post and action research · البحث الإجرائي', 'Value', 'Source / note']));
  add(['Paired students (pre and post recorded)', pp.n, 'pre = ' + cfg.pre + ', post = ' + cfg.post + ', first attempt per test']);
  add(['Mean pre → post', pp.n ? R(pp.preMean) + ' → ' + R(pp.postMean) : '—', 'auto-marked 34 marks']);
  add(['Mean change (SD)', pp.n ? S(pp.meanDiff) + (pp.sdDiff != null ? ' (SD ' + pp.sdDiff.toFixed(1) + ')' : '') : '—', '']);
  add(['Students who improved', pp.n ? pp.improved + ' of ' + pp.n : '—', '']);
  add(['Effect size dz (mean change ÷ SD of change)', pp.dz != null ? pp.dz.toFixed(2) : '—', pp.n < 10 ? 'fewer than 10 pairs: describe, do not generalise' : '']);
  add(['Students at or above ' + T + '% at post', pp.n ? pp.pairs.filter(function (p) { return p.post >= T; }).length + ' of ' + pp.n : '—', '']);
  add(['Low achievers: baseline at or below ' + R(low.cut) + ' (bottom quarter)', low.list.length, 'first attempt']);
  add(['Low achievers: mean change', lpp.n ? S(lpp.meanDiff) + ' (n = ' + lpp.n + ')' : '—', '']);
  add(['Students with 2 or more different tests', studs.filter(function (s) { return s.attempts.length > 1; }).length, 'engagement']);
  add(['Note', 'Descriptive results from recorded attempts only. Tests are not equated and there is no comparison group, so a change cannot be attributed to the platform alone.', '']);
  if (pp.n) { subheads.push(add(['Student', 'Pre', 'Post', 'Change'])); pp.pairs.forEach(function (p) { add([p.name, R(p.pre), R(p.post), S(p.diff)]); }); }
  add([]);
  heads.push(add(['5 · All Grade 11 classes · كل الصفوف', 'Students', 'Results', 'Average (latest)', 'At target']));
  var classes = {}; all.forEach(function (r) { (classes[r.cls || '(none)'] = classes[r.cls || '(none)'] || []).push(r); });
  Object.keys(classes).sort().forEach(function (c) { var st = A.students(classes[c], G11P.ITEMS), l = st.filter(function (s) { return s.latest; }).map(function (s) { return s.latest.pct; });
    var r = add([c, st.length, classes[c].length, R(A.mean(l)), l.filter(function (v) { return v >= T; }).length + ' of ' + l.length]); colors.push([r, 4, col(A.mean(l))]); });
  return { rows: rows, heads: heads, subheads: subheads, colors: colors.filter(function (c) { return c[2]; }),
    summary: { students: studsAll.length, results: recs.length, paired: pp.n } };
}
