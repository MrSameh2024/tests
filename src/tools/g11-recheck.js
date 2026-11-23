#!/usr/bin/env node
/* Smart Students Hub · re-check past Grade 11 Advanced submissions with the v2 marking rules
   READ-ONLY: it never changes the input file and never contacts the website or the sheet.

   Usage:
     node src/tools/g11-recheck.js <submissions.csv> [out-prefix]
   Input : a CSV export of the submissions sheet (File → Download → CSV). It needs a column whose
           header contains "answers" and one containing "test"; "name", "class"/"cls", "sid",
           "score", "timestamp"/"date" are used when present.
   Output: <out-prefix>-proposals.csv  one row per item whose mark WOULD change, or that now needs review
           <out-prefix>-summary.json   counts per test and per change type, plus the input file's SHA-256
   Every proposal is a suggestion for the teacher. Published grades are not changed by this tool:
   the teacher approves each line, and keeps this file as the audit trail (original verdict, new verdict, reason). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');

global.window = global;
require(path.join(ROOT, 'cr/g11-advanced.js'));
const CR = require(path.join(ROOT, 'ssh-cr.js'));
global.SSHCR = CR;
require(path.join(ROOT, 'cr/g11-advanced.extra.js'));
const RUB = global.SSH_CR.tests;

function loadData() {
  const html = fs.readFileSync(path.join(ROOT, 'g11-advanced.html'), 'utf8');
  const start = html.indexOf('const DATA=') + 11; let d = 0, end = start;
  for (let i = start; i < html.length; i++) { const c = html[i]; if (c === '[') d++; else if (c === ']') { d--; if (!d) { end = i + 1; break; } } }
  return JSON.parse(html.slice(start, end));
}
const DATA = loadData();

function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}
const csvCell = v => { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };

// "[auto ✗ 0/1 · reason]" / "[TEACHER REVIEW: … · confirmed 0/1]" / "[self: 1/1]" / " ✓ auto" / "[blank]"
function oldVerdict(tag) {
  if (!tag) return { kind: 'unknown', got: null };
  let m;
  if ((m = /\[auto ([✓✗½]) (\d)\/(\d)/.exec(tag))) return { kind: 'auto', got: +m[2], pts: +m[3] };
  if ((m = /\[TEACHER REVIEW:.*confirmed (\d)\/(\d)\]/.exec(tag))) return { kind: 'review', got: +m[1], pts: +m[2] };
  if ((m = /\[self: (\d)\/(\d)\]/.exec(tag))) return { kind: 'self', got: +m[1], pts: +m[2] };
  if (/not self-marked/.test(tag)) return { kind: 'teacher', got: null };
  if (/\[blank\]/.test(tag)) return { kind: 'blank', got: 0 };
  if (/✓ auto|✓$/.test(tag)) return { kind: 'auto', got: 1, pts: 1 };
  if (/✗/.test(tag)) return { kind: 'auto', got: 0, pts: 1 };
  return { kind: 'unknown', got: null };
}
const TAG = /\s*(\[(?:auto|TEACHER REVIEW|self|not self-marked|blank)[^\]]*\]|✓ auto)\s*$/;

function parseAnswers(text) {
  const out = {};
  String(text || '').split(/\n/).forEach(line => {
    let m;
    if ((m = /^Q3: (.*)$/.exec(line))) { const t = TAG.exec(m[1]); out.q3 = { a: t ? m[1].slice(0, t.index) : m[1], tag: t && t[1] }; }
    else if ((m = /^Q4 (.+?): (.*)$/.exec(line))) { out._q4 = (out._q4 || 0); const id = 'q4_' + out._q4++; const t = TAG.exec(m[2]); out[id] = { a: t ? m[2].slice(0, t.index) : m[2], tag: t && t[1] }; }
    else if ((m = /^(Q5|Q6): 1\) (.*) 2\) (.*?)(\s*\[[^\]]*\])?$/.exec(line))) out[m[1].toLowerCase()] = { a: [m[2], m[3]], tag: m[4] && m[4].trim() };
    else if ((m = /^Q10\.(\d): (.*)$/.exec(line))) { const t = TAG.exec(m[2]); out['rw' + (m[1] - 1)] = { a: t ? m[2].slice(0, t.index) : m[2], tag: t && t[1] }; }
    else if ((m = /^Q8: (.*)$/.exec(line))) m[1].split(' | ').forEach(p => {
      const k = /^(\d)\) (.*?)( ✓| ✗ \(key [^)]*\)| \[TEACHER REVIEW:[^\]]*\])?$/.exec(p);
      if (k) out['wf' + (k[1] - 1)] = { a: k[2], tag: k[3] ? (k[3].trim() === '✓' ? '✓' : k[3].trim().startsWith('[') ? k[3].trim().replace(/· key.*\]$/, '· confirmed 0/1]') : '✗') : null };
    });
  });
  delete out._q4;
  Object.values(out).forEach(v => { if (typeof v.a === 'string') v.a = v.a === '-' ? '' : v.a; else if (Array.isArray(v.a)) v.a = v.a.map(x => x === '-' ? '' : x); });
  return out;
}

function remark(t, id, a) {
  const T = DATA[t - 1], R = RUB[String(t)];
  CR.setLexicon(T.paras.concat([T.q3.a], T.q4.map(x => x.a), T.q5.a, T.q6.a, T.q10.map(x => x.a)));
  if (id === 'q5' || id === 'q6') return CR.reading2(a[0], a[1], R[id]);
  if (/^rw/.test(id)) return CR.rewrite(a, T.q10[+id.slice(2)], R[id]);
  if (/^wf/.test(id)) { const q = T.q8[+id.slice(2)]; const bm = q.s.match(/\(([^)]+)\)\s*\.?\s*$/) || q.s.match(/\(([^)]+)\)/); return CR.wordForm(a, q.a, bm ? bm[1] : ''); }
  return CR.reading1(a, R[id]);
}

function run(file, prefix) {
  const raw = fs.readFileSync(file);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  const rows = parseCSV(raw.toString('utf8'));
  const head = rows[0].map(h => h.toLowerCase().trim());
  const col = re => head.findIndex(h => re.test(h));
  const C = { ans: col(/answers/), test: col(/^test|test$|exam/), name: col(/name/), cls: col(/^cls$|class/), sid: col(/^sid$|submission|^reference$/), score: col(/^score$/), time: col(/time|date/), fb: col(/teacher feedback/) };
  if (C.ans < 0 || C.test < 0) throw new Error('The CSV needs an "answers" column and a "test" column. Headers found: ' + head.join(', '));
  const props = [], sum = { input: path.basename(file), input_sha256: sha, rows: rows.length - 1, g11_rows: 0, items_checked: 0, would_gain: 0, would_lose: 0, now_review: 0, by_test: {}, generated: new Date().toISOString(), engine_version: CR.version };
  rows.slice(1).forEach((r, ri) => {
    const m = /Grade 11 Advanced Test (\d+)/.exec(r[C.test] || ''); if (!m) return;
    const t = +m[1]; if (t < 1 || t > 10) return;
    sum.g11_rows++; sum.by_test[t] = sum.by_test[t] || { rows: 0, gain: 0, lose: 0, review: 0 }; sum.by_test[t].rows++;
    const A = parseAnswers(r[C.ans]);
    Object.keys(A).forEach(id => {
      const o = oldVerdict(A[id].tag), n = remark(t, id, A[id].a);
      sum.items_checked++;
      let change = null;
      if (o.got == null) { if (n.state !== 'review') change = 'teacher_item_suggestion'; }
      else if (n.state === 'review' && o.kind !== 'review') change = 'now_needs_review';
      else if (n.state !== 'review' && n.got > o.got) change = 'would_gain';
      else if (n.state !== 'review' && n.got < o.got && o.kind !== 'self') change = 'would_lose';
      if (!change) return;
      if (change === 'would_gain') { sum.would_gain++; sum.by_test[t].gain++; }
      if (change === 'would_lose') { sum.would_lose++; sum.by_test[t].lose++; }
      if (change === 'now_needs_review') { sum.now_review++; sum.by_test[t].review++; }
      const prior = C.fb >= 0 && /CR review|Audit correction|re-?mark/i.test(r[C.fb] || '') ? (r[C.fb].match(/(Reading CR review[^;.]*|Audit correction[^;.]*)/i) || [''])[0].slice(0, 80) : '';
      props.push({ prior_review: prior, row: ri + 2, sid: C.sid >= 0 ? r[C.sid] : '', time: C.time >= 0 ? r[C.time] : '', test: t, name: C.name >= 0 ? r[C.name] : '', cls: C.cls >= 0 ? r[C.cls] : '',
        item: id, answer: Array.isArray(A[id].a) ? '1) ' + A[id].a[0] + ' 2) ' + A[id].a[1] : A[id].a,
        original: (o.kind || '') + (o.got == null ? '' : ' ' + o.got + '/' + (o.pts || n.pts)), proposed: n.state + ' ' + n.got + '/' + n.pts,
        change, reason_code: n.code || '', reason_en: (n.why || [''])[0], reason_ar: (n.why || ['', ''])[1], teacher_decision: '' });
    });
  });
  const cols = ['row', 'prior_review', 'sid', 'time', 'test', 'name', 'cls', 'item', 'answer', 'original', 'proposed', 'change', 'reason_code', 'reason_en', 'reason_ar', 'teacher_decision'];
  const csv = '﻿' + cols.join(',') + '\n' + props.map(p => cols.map(c => csvCell(p[c])).join(',')).join('\n') + '\n';
  fs.writeFileSync(prefix + '-proposals.csv', csv);
  fs.writeFileSync(prefix + '-summary.json', JSON.stringify(sum, null, 2));
  // prove the input was not touched
  const after = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (after !== sha) throw new Error('Input file changed during the run — stop and investigate.');
  return { sum, props };
}

module.exports = { run, parseAnswers, oldVerdict, parseCSV };
if (require.main === module) {
  const [file, prefix] = process.argv.slice(2);
  if (!file) { console.error('Usage: node src/tools/g11-recheck.js <submissions.csv> [out-prefix]'); process.exit(2); }
  const { sum } = run(file, prefix || file.replace(/\.csv$/i, '') + '-recheck');
  console.log(JSON.stringify(sum, null, 2));
}
