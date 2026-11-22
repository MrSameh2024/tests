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
})(this);
