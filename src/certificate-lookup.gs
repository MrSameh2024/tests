/**
 * Smart Students Hub – Certificate lookup (استرجاع الشهادات)
 *
 * A small, separate Apps Script web app. It only READS the private sheet
 * "SSH Test Submissions – PRIVATE (student data)" and returns the certificates
 * that belong to one student, so a student can open them again on any device
 * (page: my-certificates.html).
 *
 * Privacy:
 *  • A student must give the email OR mobile number used when sending the result,
 *    AND their first name. Both must match the same rows.
 *  • Only certificate details are returned (test, score, date, certificate number).
 *    Answers, essays, feedback and other students' rows are never returned.
 *  • Too many tries for one contact in 10 minutes are refused.
 *
 * Rules (the same as the site's certificates):
 *  • Tests: one certificate per test – the best attempt.
 *  • Writing courses (stations): one completion certificate per writing topic,
 *    issued when the final station (Station 10) has been submitted.
 *
 * Setup: see the instructions sent with this file (deploy as a web app,
 * Execute as: Me, Who has access: Anyone). Then paste the /exec URL into
 * LOOKUP_URL in my-certificates.html.
 */
var SHEET_ID = '1j8UIlVBMivadDfxVhnlint2cl6JHuVjZmzD-brOu7pA';
var TAB = 'Submissions';
var MAX_TRIES = 8;          // per contact, per 10 minutes
var FINAL_STATION = 10;

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  return json_(lookup_(body));
}
function doGet(e) {
  return json_(lookup_((e && e.parameter) || {}));
}

function lookup_(b) {
  if (b.website) return { ok: false, error: 'blocked' };                       // honeypot
  var contact = String(b.contact || '').trim(), first = norm_(b.first || '');
  if (!contact || first.length < 2) return { ok: false, error: 'missing' };
  var isEmail = contact.indexOf('@') > 0;
  var key = isEmail ? contact.toLowerCase() : phone_(contact);
  if (!key || (!isEmail && key.length < 8)) return { ok: false, error: 'contact' };

  var cache = CacheService.getScriptCache(), ck = 'tries_' + Utilities.base64EncodeWebSafe(key).slice(0, 200);
  var tries = +(cache.get(ck) || 0);
  if (tries >= MAX_TRIES) return { ok: false, error: 'wait' };
  cache.put(ck, String(tries + 1), 600);

  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB);
  var rows = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 11).getValues();
  var mine = rows.filter(function (r) {
    var em = String(r[5] || '').trim().toLowerCase(), ph = phone_(r[6]);
    var hit = isEmail ? em === key : (ph && ph === key);
    if (!hit) return false;
    return norm_(r[3]).split(' ').some(function (w) { return w && (w === first || (first.length >= 3 && w.indexOf(first) === 0)); });
  });
  if (!mine.length) return { ok: true, certs: [] };

  var tests = {}, courses = {};
  mine.forEach(function (r) {
    var test = String(r[2] || '').trim(), ref = String(r[1] || '').trim();
    if (!test || !ref || /^Teacher Workshop/i.test(test)) return;
    var item = { no: ref, date: iso_(r[0]), name: String(r[3] || '').trim(), cls: String(r[4] || '').trim() };
    var st = test.match(/^(.*?)\s*[·–-]\s*Station\s*(\d+)\s*$/i);
    if (st && /writing/i.test(test)) {                                            // writing course
      var k = st[1].trim(), n = +st[2];
      var c = courses[k] || (courses[k] = { test: k, last: null });
      if (n === FINAL_STATION && (!c.last || item.date > c.last.date)) c.last = item;
      return;
    }
    var score = num_(r[8]), max = num_(r[9]);
    var pct = max ? Math.round(100 * score / max) : num_(String(r[10]).replace('%', ''));
    var t = tests[test];
    if (!t || pct > t.percent || (pct === t.percent && item.date > t.date)) {
      tests[test] = { no: item.no, date: item.date, name: item.name, cls: item.cls, test: test, score: score, max: max, percent: pct, kind: 'test' };
    }
  });

  var out = Object.keys(tests).map(function (k) { return tests[k]; });
  Object.keys(courses).forEach(function (k) {
    var c = courses[k]; if (!c.last) return;
    out.push({ no: c.last.no, date: c.last.date, name: c.last.name, cls: c.last.cls, test: k, score: '', max: '', percent: '', kind: 'course' });
  });
  out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return { ok: true, certs: out };
}

/* ---------- helpers ---------- */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function num_(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
function phone_(v) {
  var d = String(v || '').replace(/\D/g, '');
  if (d.indexOf('00974') === 0) d = d.slice(5); else if (d.indexOf('974') === 0 && d.length > 8) d = d.slice(3);
  return d;
}
function norm_(s) {
  return String(s || '').toLowerCase()
    .replace(/[ً-ْـ]/g, '')         // Arabic diacritics and tatweel
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/\((?:student|teacher|parent|other)[^)]*\)/g, ' ')
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
}
var MON_ = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function iso_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return v.toISOString();
  var s = String(v || '').trim(), m;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)))
    return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0)).toISOString();
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s+(\d{1,2}):(\d{2})/)))
    return new Date(+m[3], MON_[m[2].toLowerCase()], +m[1], +m[4], +m[5]).toISOString();
  return new Date().toISOString();
}

/** Run once from the editor to check the sheet can be read (View › Logs). */
function testLookup() {
  Logger.log(JSON.stringify(lookup_({ contact: 'h.zerak2104@education.qa', first: 'Hassan' })));
}
