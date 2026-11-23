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
  DATA: [["SSH-261122-1566",1,"q3","R",1,"Q3: Small creatures called p",251],["SSH-261122-1566",1,"q4_0","R",1,"Q4 five millimetres: refers ",153],["SSH-261122-1566",1,"q4_1","R",1,"Q4 2022: refers to the year ",139],["SSH-261122-1566",1,"q5","R",2,"Q5: 1) Some are produced del",290],["SSH-261122-1566",1,"q6","R",2,"Q6: 1) Choose natural fabric",123],["SSH-261122-6194",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-6194",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-6194",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-6194",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-6194",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-6194",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-5554",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-5554",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-5554",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-5554",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-5554",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-5554",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-9638",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-9638",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-9638",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-9638",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-9638",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-9638",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-8123",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-8123",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-8123",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-8123",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-8123",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-8123",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-7863",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-7863",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-7863",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-7863",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-7863",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-7863",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-6110",1,"q3","R",1,"Q3: Small creatures eat micr",150],["SSH-261122-6110",1,"q4_0","R",1,"Q4 five millimetres: “Five m",219],["SSH-261122-6110",1,"q4_1","R",1,"Q4 2022: “Five millimetres” ",207],["SSH-261122-6110",1,"q5","R",2,"Q5: 1) When larger plastic o",179],["SSH-261122-6110",1,"q6","R",2,"Q6: 1) Choose natural fabric",93],["SSH-261122-6110",1,"rw2","G",1,"Q10.3: Before the fish ate i",98],["SSH-261122-7292",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-7292",2,"q4_0","R",1,"Q4 11:40 pm: “11:40 pm” refe",143],["SSH-261122-7292",2,"q4_1","R",1,"Q4 1985: “1985” refers to th",135],["SSH-261122-7292",2,"q5","R",2,"Q5: 1) There were not enough",126],["SSH-261122-7292",2,"q6","R",2,"Q6: 1) Every ship was requir",186],["SSH-261122-1283",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-1283",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-1283",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-1283",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-1283",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-1592",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-1592",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-1592",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-1592",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-1592",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-4546",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-4546",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-4546",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-4546",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-4546",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-3549",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-3549",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-3549",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-3549",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-3549",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-4860",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-4860",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-4860",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-4860",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-4860",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-9009",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-9009",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-9009",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-9009",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-9009",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-7199",2,"q3","R",1,"Q3: He realised that the Tit",105],["SSH-261122-7199",2,"q4_0","R",1,"Q4 11:40 pm: refers to the t",136],["SSH-261122-7199",2,"q4_1","R",1,"Q4 1985: refers to the year ",128],["SSH-261122-7199",2,"q5","R",2,"Q5: 1) The ship only had 20 ",210],["SSH-261122-7199",2,"q6","R",2,"Q6: 1) Every ship was requir",257],["SSH-261122-8225",2,"q4_1","R",1,"Q4 1985: the year they found",75],["SSH-261122-8225",2,"q5","R",2,"Q5: 1) The ship had only 20 ",189],["SSH-261122-8225",2,"q6","R",2,"Q6: 1) every ship to carry e",145],["SSH-261122-6462",3,"q3","R",1,"Q3: Because warmer streets m",102],["SSH-261122-6462",3,"q4_0","R",1,"Q4 2003: “2003” refers to th",112],["SSH-261122-6462",3,"q4_1","R",1,"Q4 70,000: “70,000” refers t",135],["SSH-261122-6462",3,"q5","R",2,"Q5: 1) Building materials su",186],["SSH-261122-6462",3,"q6","R",2,"Q6: 1) Planting thousands of",196],["SSH-261122-3879",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-3879",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-3879",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-3879",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-3879",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-3879",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-2597",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-2597",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-2597",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-2597",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-2597",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-2597",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-8469",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-8469",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-8469",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-8469",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-8469",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-8469",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-6696",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-6696",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-6696",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-6696",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-6696",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-6696",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-6794",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-6794",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-6794",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-6794",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-6794",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-6794",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-7013",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-7013",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-7013",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-7013",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-7013",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-7013",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-6833",4,"q3","R",1,"Q3: Because many animals bor",131],["SSH-261122-6833",4,"q4_0","R",1,"Q4 700 million: “700 million",148],["SSH-261122-6833",4,"q4_1","R",1,"Q4 the California condor: “t",188],["SSH-261122-6833",4,"q5","R",2,"Q5: 1) They help conserve en",175],["SSH-261122-6833",4,"q6","R",2,"Q6: 1) Old cages have been r",169],["SSH-261122-6833",4,"rw1","G",1,"Q10.2: Although there is cri",90],["SSH-261122-4124",5,"q3","R",1,"Q3: A guest could traditiona",127],["SSH-261122-4124",5,"q4_0","R",1,"Q4 winter: “winter” refers t",188],["SSH-261122-4124",5,"q4_1","R",1,"Q4 the 20th century: “the 20",157],["SSH-261122-4124",5,"q5","R",2,"Q5: 1) Reading the stars to ",164],["SSH-261122-4124",5,"q6","R",2,"Q6: 1) Traditional activitie",218],["SSH-261122-4124",5,"rw1","G",1,"Q10.2: It was such a hot des",96],["SSH-261122-4036",6,"q3","R",1,"Q3: Algae cover and kill the",76],["SSH-261122-4036",6,"q4_0","R",1,"Q4 dhows: refers to wooden b",105],["SSH-261122-4036",6,"q4_1","R",1,"Q4 80 percent: refers to the",171],["SSH-261122-4036",6,"q6","R",2,"Q6: 1) Introducing fishing s",297],["SSH-261122-9173",6,"q3","R",1,"Q3: Algae cover and kill the",76],["SSH-261122-9173",6,"q4_0","R",1,"Q4 dhows: refers to wooden b",105],["SSH-261122-9173",6,"q4_1","R",1,"Q4 80 percent: refers to the",171],["SSH-261122-9173",6,"q6","R",2,"Q6: 1) Introducing fishing s",297],["SSH-261122-7119",6,"q3","R",1,"Q3: Algae cover and kill the",76],["SSH-261122-7119",6,"q4_0","R",1,"Q4 dhows: refers to wooden b",105],["SSH-261122-7119",6,"q4_1","R",1,"Q4 80 percent: refers to the",171],["SSH-261122-7119",6,"q6","R",2,"Q6: 1) Introducing fishing s",297],["SSH-261122-1206",6,"q3","R",1,"Q3: Algae cover and kill the",76],["SSH-261122-1206",6,"q4_0","R",1,"Q4 dhows: “dhows” refers to ",121],["SSH-261122-1206",6,"q4_1","R",1,"Q4 80 percent: “80 percent” ",178],["SSH-261122-1206",6,"q6","R",2,"Q6: 1) Introducing fishing s",247],["SSH-261122-1206",6,"rw2","G",1,"Q10.3: In spite of fish bein",96],["SSH-261122-3620",9,"q4_0","R",1,"Q4 320,000 kilometres: the d",81],["SSH-261122-3620",9,"q4_1","R",1,"Q4 17 April: the day the cre",80],["SSH-261122-3620",9,"q5","R",2,"Q5: 1) temperature inside dr",137],["SSH-261122-3620",9,"q6","R",2,"Q6: 1) plastic bags 2) cardb",76]]
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
    var user = (Session.getActiveUser() && Session.getActiveUser().getEmail()) || 'unknown';
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
      var pct = typeof old.pct === 'number' ? score / max : Math.round(score / max * 100) + '%';
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
