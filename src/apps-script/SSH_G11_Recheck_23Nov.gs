/**
 * Smart Students Hub · Grade 11 Advanced Tests · re-check of written answers (23 Nov 2026)
 * Paste this file into the sheet's Apps Script project (Extensions → Apps Script → + → Script) and save.
 * It does NOT replace or change onOpen, the SSH Admin menu or any existing function.
 *
 * Run in this order from the Apps Script editor (choose the function, then ▶ Run):
 *   1. g11Recheck_1_CreateReviewTab   → makes the tab "G11 Re-check 23 Nov" with 158 suggested marks.
 *                                        Every row starts as APPROVE. Change any row to REJECT if you disagree.
 *   2. g11Recheck_2_ApplyApproved     → first copies the Submissions tab to a hidden backup tab, then updates
 *                                        only APPROVE rows: Score, Percent, Section breakdown, the answer's tag
 *                                        and a note in Teacher feedback. Every change is written to "Re-check audit log".
 *   Undo: g11Recheck_Undo             → puts back the exact old values from the audit log for every applied row.
 *
 * Safety: a row is changed only if its answer line is still exactly as it was in the 23 Nov export
 * (still "[not self-marked: teacher to mark]"), and only if the new score stays within Max and the section maximum.
 * Running step 2 twice does nothing the second time.
 */
var G11RC = {
  REVIEW_TAB: 'G11 Re-check 23 Nov',
  LOG_TAB: 'Re-check audit log',
  SUBMISSIONS: 'Submissions',
  OLD_TAG: '[not self-marked: teacher to mark]',
  LABEL: 're-check 23 Nov 2026, approved by teacher',
  SECTION_MAX: { Reading: 14, Grammar: 10 },
  // [Reference, test, item, section (R/G), points, start of the answer line, its length] as in the 23 Nov export
  DATA: [] /* 158 approved items removed from the public repo (student answers); the live copy in the Apps Script project keeps them */
};

function g11Recheck_1_CreateReviewTab() {
  var ss = SpreadsheetApp.getActive();
  if (ss.getSheetByName(G11RC.REVIEW_TAB)) { g11rcSay_('The tab "' + G11RC.REVIEW_TAB + '" already exists. Nothing was changed.'); return; }
  var sub = ss.getSheetByName(G11RC.SUBMISSIONS), idx = g11rcIndex_(sub);
  var rows = [['Decision', 'Reference', 'Test', 'Student', 'Class', 'Item', 'Section', 'Points', 'Student answer (current text in Submissions)', 'Status']];
  G11RC.DATA.forEach(function (d) {
    var r = idx.byRef[d[0]], v = r ? idx.values[r - 1] : null, line = v ? g11rcLine_(v[idx.col['Answers']], d) : null;
    rows.push(['APPROVE', d[0], 'Grade 11 Advanced Test ' + d[1], v ? v[idx.col['Student name']] : '(not found)', v ? v[idx.col['Class']] : '',
      g11rcItemName_(d[2]), g11rcSec_(d), d[4], line ? line.replace(' ' + G11RC.OLD_TAG, '') : '', !r ? 'Reference not found' : (line ? '' : 'Answer already changed or marked')]);
  });
  var sh = ss.insertSheet(G11RC.REVIEW_TAB);
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(2, 1, rows.length - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['APPROVE', 'REJECT'], true).build());
  g11rcSay_('Created "' + G11RC.REVIEW_TAB + '" with ' + (rows.length - 1) + ' suggested marks. Change any row to REJECT, then run g11Recheck_2_ApplyApproved.');
}

function g11Recheck_2_ApplyApproved() {
  var lock = LockService.getDocumentLock(); lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActive(), rev = ss.getSheetByName(G11RC.REVIEW_TAB);
    if (!rev) { g11rcSay_('Run g11Recheck_1_CreateReviewTab first.'); return; }
    var sub = ss.getSheetByName(G11RC.SUBMISSIONS);
    var stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HHmm');
    var backup = sub.copyTo(ss).setName('Submissions backup ' + stamp); backup.hideSheet();
    var log = ss.getSheetByName(G11RC.LOG_TAB) || g11rcNewLog_(ss);
    var idx = g11rcIndex_(sub), C = idx.col, rv = rev.getDataRange().getValues();
    var user = 'sheet owner (Apps Script editor)';   // no extra Google permission needed
    // group APPROVE rows by Reference
    var groups = {}, byKey = {};
    G11RC.DATA.forEach(function (d) { byKey[d[0] + '|' + g11rcItemName_(d[2])] = d; });
    for (var i = 1; i < rv.length; i++) {
      if (String(rv[i][0]).toUpperCase() !== 'APPROVE' || rv[i][9]) continue;
      var d = byKey[rv[i][1] + '|' + rv[i][5]];   // matched by Reference + Item, so sorting the tab is safe
      if (!d) { rev.getRange(i + 1, 10).setValue('Skipped: row not in the re-check list'); continue; }
      (groups[d[0]] = groups[d[0]] || []).push({ d: d, revRow: i + 1 });
    }
    var applied = 0, skipped = 0, points = 0;
    Object.keys(groups).forEach(function (ref) {
      var r = idx.byRef[ref], g = groups[ref];
      var mark = function (txt) { g.forEach(function (x) { rev.getRange(x.revRow, 10).setValue(txt); }); };
      if (!r) { mark('Skipped: reference not found'); skipped += g.length; return; }
      var get = function (h) { return sub.getRange(r, C[h] + 1).getValue(); };
      var old = { score: get('Score'), max: get('Max'), pct: get('Percent'), bd: String(get('Section breakdown')), ans: String(get('Answers')), fb: String(get('Teacher feedback')) };
      var ans = old.ans, add = { Reading: 0, Grammar: 0 }, items = [], ok = [];
      g.forEach(function (x) {
        var line = g11rcLine_(ans, x.d);
        if (!line) { rev.getRange(x.revRow, 10).setValue('Skipped: answer already changed or marked'); skipped++; return; }
        ans = ans.replace(line, line.replace(G11RC.OLD_TAG, '[auto ✓ ' + x.d[4] + '/' + x.d[4] + ' · ' + G11RC.LABEL + ']'));
        add[g11rcSec_(x.d)] += x.d[4]; items.push(g11rcItemName_(x.d[2])); ok.push(x);
      });
      if (!ok.length) return;
      var total = add.Reading + add.Grammar, score = Number(old.score) + total, max = Number(old.max);
      var bd = old.bd, bad = '';
      ['Reading', 'Grammar'].forEach(function (s) {
        if (!add[s]) return;
        var m = new RegExp(s + ' (\\d+)/(\\d+)').exec(bd);
        if (!m) { bad = 'section "' + s + '" not found in breakdown'; return; }
        var nv = Number(m[1]) + add[s]; if (nv > Number(m[2])) { bad = s + ' would exceed ' + m[2]; return; }
        bd = bd.replace(m[0], s + ' ' + nv + '/' + m[2]);
      });
      if (!bad && (isNaN(score) || score > max)) bad = 'score would exceed Max';
      if (bad) { ok.forEach(function (x) { rev.getRange(x.revRow, 10).setValue('Skipped: ' + bad); }); skipped += ok.length; return; }
      bd = bd.replace(/(\d+) answer\(s\) not self-marked: teacher to mark/, function (m0, n) { var k = Number(n) - ok.length; return k > 0 ? k + ' answer(s) not self-marked: teacher to mark' : 'written answers re-checked 23 Nov'; });
      // Percent in Submissions is a whole number shown with the format 0"%" (e.g. 74 → "74%"); keep the same kind of value
      var pct = typeof old.pct === 'number' ? (old.pct > 1 ? Math.round(score / max * 100) : score / max) : Math.round(score / max * 100) + '%';
      var note = 'Reading/grammar re-check (23 Nov 2026, approved): +' + total + ' point(s) for ' + items.join(', ') + '.';
      var fb = old.fb ? old.fb + ' | ' + note : note;
      sub.getRange(r, C['Score'] + 1).setValue(score);
      sub.getRange(r, C['Percent'] + 1).setValue(pct);
      sub.getRange(r, C['Section breakdown'] + 1).setValue(bd);
      sub.getRange(r, C['Answers'] + 1).setValue(ans);
      sub.getRange(r, C['Teacher feedback'] + 1).setValue(fb);
      log.appendRow([new Date(), user, ref, r, items.join(', '), total, old.score, score, old.pct, pct, old.bd, bd, old.ans, old.fb, 'applied']);
      ok.forEach(function (x) { rev.getRange(x.revRow, 10).setValue('Applied ' + stamp); });
      applied += ok.length; points += total;
    });
    g11rcSay_('Applied ' + applied + ' mark(s), +' + points + ' point(s) in total. Skipped ' + skipped + '. Backup tab: "Submissions backup ' + stamp + '" (hidden). Details: "' + G11RC.LOG_TAB + '".');
  } finally { lock.releaseLock(); }
}

function g11Recheck_Undo() {
  var lock = LockService.getDocumentLock(); lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActive(), log = ss.getSheetByName(G11RC.LOG_TAB), sub = ss.getSheetByName(G11RC.SUBMISSIONS);
    if (!log) { g11rcSay_('No audit log: nothing to undo.'); return; }
    var idx = g11rcIndex_(sub), C = idx.col, lv = log.getDataRange().getValues(), n = 0;
    for (var i = lv.length - 1; i >= 1; i--) {
      if (lv[i][14] !== 'applied') continue;
      var r = idx.byRef[lv[i][2]]; if (!r) continue;
      sub.getRange(r, C['Score'] + 1).setValue(lv[i][6]);
      sub.getRange(r, C['Percent'] + 1).setValue(lv[i][8]);
      sub.getRange(r, C['Section breakdown'] + 1).setValue(lv[i][10]);
      sub.getRange(r, C['Answers'] + 1).setValue(lv[i][12]);
      sub.getRange(r, C['Teacher feedback'] + 1).setValue(lv[i][13]);
      log.getRange(i + 1, 15).setValue('undone ' + new Date().toISOString()); n++;
    }
    var rev = ss.getSheetByName(G11RC.REVIEW_TAB);
    if (rev && rev.getLastRow() > 1) rev.getRange(2, 10, rev.getLastRow() - 1, 1).clearContent();
    g11rcSay_('Undone: ' + n + ' submission row(s) restored to their values before the re-check.');
  } finally { lock.releaseLock(); }
}

/** One-off repair (23 Nov): Percent was written as a fraction (0.94 → shown "1%") in rows changed by the re-check.
 *  Rewrites Percent = round(Score / Max × 100) for those rows only, and records it in the audit log. */
function g11Recheck_FixPercent() {
  var ss = SpreadsheetApp.getActive(), log = ss.getSheetByName(G11RC.LOG_TAB), sub = ss.getSheetByName(G11RC.SUBMISSIONS);
  if (!log) { g11rcSay_('No audit log.'); return; }
  var idx = g11rcIndex_(sub), C = idx.col, lv = log.getDataRange().getValues(), n = 0;
  for (var i = 1; i < lv.length; i++) {
    if (lv[i][14] !== 'applied') continue;
    var r = idx.byRef[lv[i][2]]; if (!r) continue;
    var cell = sub.getRange(r, C['Percent'] + 1), v = cell.getValue();
    if (typeof v !== 'number' || v > 1) continue;            // already a whole-number percent
    var score = Number(sub.getRange(r, C['Score'] + 1).getValue()), max = Number(sub.getRange(r, C['Max'] + 1).getValue());
    var p = Math.round(score / max * 100);
    cell.setValue(p); log.getRange(i + 1, 10).setValue(p); n++;
  }
  g11rcSay_('Percent repaired in ' + n + ' row(s).');
}

function g11rcLine_(answers, d) {   // the exported line: same start, same length, still waiting for the teacher
  var lines = String(answers).split('\n');
  for (var i = 0; i < lines.length; i++) if (lines[i].indexOf(d[5]) === 0 && lines[i].length === d[6] && lines[i].indexOf(G11RC.OLD_TAG) >= 0) return lines[i];
  return null;
}
function g11rcSec_(d) { return d[3] === 'G' ? 'Grammar' : 'Reading'; }
function g11rcIndex_(sub) {
  var values = sub.getDataRange().getValues(), head = values[0].map(String), col = {};
  ['Reference', 'Student name', 'Class', 'Score', 'Max', 'Percent', 'Section breakdown', 'Answers', 'Teacher feedback'].forEach(function (h) {
    var j = head.indexOf(h); if (j < 0) throw new Error('Column "' + h + '" not found in ' + G11RC.SUBMISSIONS); col[h] = j;
  });
  var byRef = {};
  for (var i = 1; i < values.length; i++) { var ref = String(values[i][col['Reference']]); if (ref) byRef[ref] = i + 1; }
  return { values: values, col: col, byRef: byRef };
}
function g11rcNewLog_(ss) {
  var sh = ss.insertSheet(G11RC.LOG_TAB);
  sh.appendRow(['Time', 'By', 'Reference', 'Sheet row', 'Items', 'Points added', 'Old score', 'New score', 'Old percent', 'New percent', 'Old breakdown', 'New breakdown', 'Old answers', 'Old teacher feedback', 'State']);
  sh.setFrozenRows(1); return sh;
}
function g11rcItemName_(id) {
  if (id === 'q3') return 'Q3'; if (id === 'q5') return 'Q5'; if (id === 'q6') return 'Q6';
  if (id.indexOf('q4_') === 0) return 'Q4 (' + (Number(id.slice(3)) + 1) + ')';
  if (id.indexOf('rw') === 0) return 'Q10.' + (Number(id.slice(2)) + 1);
  return id;
}
function g11rcSay_(msg) { Logger.log(msg); try { SpreadsheetApp.getUi().alert(msg); } catch (e) {} }
