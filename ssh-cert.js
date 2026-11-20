/* Smart Students Hub – Certificates for students and teachers:
   Grades 10, 11, 12 and AESN tests/courses/activities, IELTS modules and diagnostics,
   the English Placement Test, the Academy teacher workshops and the teacher self-checks
   (TKT-style test, IELTS-style self-check, Teaching Strategies tests).
   Built from src/ssh-cert.src.js by src/build-cert.py (adds the signature) → ssh-cert.js.

   How it works
   • Every test, course and activity already sends its result to the teacher's private Google Sheet
     (Apps Script endpoint, payload type:'submission'). This script listens for that request.
   • When the sheet confirms the result (ok:true), the student receives a personalised, bilingual
     certificate. Its number is the sheet's own Reference (e.g. SSH-261118-4821), so every certificate
     matches one row of the "Submissions" tab and is listed automatically in "Student Certificates".
   • The student can print it or download it as a PDF. Certificates are kept on the device under
     "My certificates" so they can be printed again later.
   • Nothing is issued for review copies or when the result could not be recorded. */
(function () {
  if (window.SSH_CERT) return;
  var ME = document.currentScript, BASE = ME && ME.src ? ME.src.replace(/[^\/]*$/, '') : '';
  var SIG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 19 406 101\" role=\"img\" aria-label=\"Signature of Sameh Soliman\"><g transform=\"rotate(-3 203 69.5)\" fill=\"#1b2a5c\"><path d=\"M37 94.2Q40.3 94.2 44.2 89Q48.2 83.7 51.5 76Q54.9 68.3 57.8 60.2Q60.7 52 62.3 45.6Q63.9 39.2 63.9 38Q63.9 36.8 63.8 36.8Q63 36.8 53.9 46.3Q44.9 55.8 39.6 61.1Q34.3 66.4 27.1 73Q12.3 86.4-6.6 96.8Q-7.1 97.1-7.6 97.1Q-8.1 97.1-8.1 96.7Q-8.1 96.4-7.5 96.1Q5.2 89.6 17.7 79.3Q30.5 68.8 38.4 60.7Q46.3 52.7 50.4 48.3Q54.5 43.9 60.3 37.8Q66 31.7 69 28.5Q69.5 28 69.9 28Q70.2 28 70.2 28.5Q70.2 31.2 68.6 38.5Q66.9 45.8 63.8 55.5Q60.6 65.1 56.6 74.1Q52.7 83 47.2 89.2Q41.8 95.3 36.4 95.3Q33 95.3 31.1 91.8Q29.2 88.4 29.2 82.7Q29.2 77.1 31.9 72.4Q32.6 71.2 33.1 71.2Q33.6 71.2 33.7 71.9Q32.9 73.3 32.2 76.9Q31.5 80.5 31.5 84.1Q31.5 94.2 37 94.2M83.2 82.1L86.7 79.8L86.8 80.9Q73 90.1 69.9 90.1Q69.4 90.1 69.4 89.5Q69.4 87.7 70.8 84.3L71.2 83.1Q71.2 82.9 70.9 82.9Q70.6 82.9 65.9 86.4Q61.3 89.8 59.8 89.8Q58.4 89.8 58.4 87.2Q58.4 80.1 66.5 73.3Q74.7 66.5 86.1 66.5Q87.1 66.5 87.1 67.4Q87.1 68.2 79.1 77.4Q71 86.6 71 88.5Q71 88.8 71.5 88.8Q72 88.8 75.9 86.6Q79.7 84.3 83.2 82.1M73 79.9Q74.5 78.7 78.7 73.9Q82.9 69.1 82.9 68.3Q82.9 68 82.2 68Q78.3 68 73 71.6Q67.8 75.3 64.1 79.9Q60.5 84.6 60.5 87.4Q60.5 87.9 61 87.9Q61.5 87.9 62.7 87.3Q63.8 86.6 65.5 85.5Q67.2 84.3 68.4 83.5Q72.5 80.4 73 79.9M91.8 77.8L85.8 81.5L85.5 80.5L89.1 78Q93 75.5 94.5 74.2Q95.9 72.9 96.6 72.4Q97.2 71.9 98 71Q98.8 70 99 69.9Q99 69.9 100 68.5Q100.9 67.5 101 67.3Q102.4 67.6 102.4 69.4Q100 73 95.3 78.3Q90.7 83.6 90.7 83.9Q90.7 84.1 90.8 84.1Q90.9 84.1 92.1 83.2Q93.2 82.3 98.4 78.6Q108.9 71.4 112.6 68.9Q114.1 67.7 114.6 67.7Q115.2 67.7 115.6 68.1Q116 68.5 116 69.2Q116 69.9 114.6 72Q113.2 74.2 111.7 76.2Q107.6 81.3 106.7 82.3Q106.2 82.9 106.2 83.1Q106.2 83.2 106.3 83.2Q106.9 83.2 125.4 69.7Q128.4 67.6 129.5 67.6Q130.2 67.6 130.2 69.2Q130.2 70.9 127.6 74.3Q125.1 77.6 122 80.5Q113.7 88 113.7 88.8Q113.7 88.9 114.1 88.9Q115.1 88.9 125.7 82.1L129.2 79.8L129.3 80.9Q115.4 90.1 112.4 90.1Q111.9 90.1 111.9 89.6Q111.9 86.4 115.9 82Q119.9 77.7 123.9 74.2Q127.8 70.7 127.8 69.6Q127.8 69.4 127.7 69.4Q127.6 69.4 127.1 69.7Q126.7 70 116.3 77.3Q106 84.6 104.3 85.8Q102.5 87.1 100 89.6Q99.2 90.3 97.4 90.3Q95.6 90.3 95.6 89.9Q95.6 89.5 96.3 88.8Q101.4 83.6 107.3 77.1Q113.2 70.6 113.5 70Q113.5 69.8 113.2 69.8Q112.3 69.8 102.6 76.6Q92.9 83.5 91.4 84.6Q87.3 87.6 87.1 87.7Q86.9 87.8 86.2 88.6Q84.6 90.3 83.4 90.3Q82.1 89.9 82 89.7Q84 87.5 91.8 77.8M147.9 67.9Q147.9 67.6 147.5 67.6Q145.2 67.6 140.3 71.7Q135.4 75.7 131.8 80.5Q136.1 79.2 142 74.3Q147.9 69.5 147.9 67.9M128 88.2Q128 89.3 128.9 89.3Q129.9 89.3 133.5 87.9Q137.1 86.5 139.4 85.1L147.9 79.8L147.9 80.9Q138.9 86.9 134.5 88.5Q130.1 90.2 128.6 90.2Q126.2 90.2 126.2 87.2Q126.2 83.1 129.1 79.1Q132 75 135.9 72.5Q139.9 69.9 143.5 68.2Q147.2 66.6 149.1 66.6Q151 66.6 151 67.9Q151 71.1 143.4 75.6Q135.9 80.2 130.9 81.7Q128 85.9 128 88.2M173.4 53.4L160.9 67.9Q167.7 63.3 181.8 49Q195.9 34.6 195.9 31.9Q195.9 31.4 195.5 31.4Q195.1 31.4 194.6 31.7Q189 34.8 181 44.3Q180.6 44.7 177.4 48.6Q174.2 52.5 173.4 53.4M198 30.9Q198 35 183.1 49.8Q168.2 64.6 158.1 71.3L156.7 72.9Q154.6 74.9 148 83.6Q147.5 84.5 147.5 84.6Q147.5 84.7 147.6 84.7Q147.8 84.7 148.6 84.1Q149.5 83.5 155.1 79.5Q168 70.1 173.9 67.2Q174.4 67 174.6 67Q175.5 67 175.5 68.6Q175.5 70.2 173.1 73.5Q170.6 76.8 167.6 79.7Q159.5 87.3 159.5 88.3Q159.5 88.8 159.8 88.8Q164.6 87.2 168.2 85.1L176.7 79.8L176.8 80.9Q167.7 86.9 163.3 88.5Q158.9 90.2 157.6 90.2Q156.4 90.2 156.4 89.4Q156.4 87.8 160.8 83.2Q165.1 78.6 169.5 74.1Q173.8 69.7 173.8 68.8Q173.8 68.7 173.6 68.7Q172.5 68.7 162.9 75.1Q153.4 81.6 148.6 85.2Q143.8 88.9 143.3 89.4Q142.8 90 140.6 90.3Q139.8 90.3 139.8 89.8Q139.8 89.4 141 87.8Q147.2 80.2 160.9 64.2Q174.7 48.1 175.7 47.1Q176.8 46.1 178.7 44.2Q180.6 42.2 182.1 40.7Q183.6 39.2 186 37Q188.4 34.8 190.1 33.3Q194.5 29.7 196.5 29.7Q197.1 29.7 197.6 30.1Q198 30.5 198 30.9M219.7 94.2Q222.9 94.2 226.9 89Q230.8 83.7 234.2 76Q237.6 68.3 240.4 60.2Q243.3 52 245 45.6Q246.6 39.2 246.6 38Q246.6 36.8 246.4 36.8Q245.6 36.8 236.6 46.3Q227.6 55.8 222.2 61.1Q216.9 66.4 209.8 73Q195 86.4 176.1 96.8Q175.5 97.1 175 97.1Q174.5 97.1 174.5 96.7Q174.5 96.4 175.1 96.1Q187.8 89.6 200.3 79.3Q213.1 68.8 221 60.7Q229 52.7 233.1 48.3Q237.2 43.9 242.9 37.8Q248.6 31.7 251.7 28.5Q252.2 28 252.5 28Q252.9 28 252.9 28.5Q252.9 31.2 251.2 38.5Q249.6 45.8 246.4 55.5Q243.2 65.1 239.3 74.1Q235.3 83 229.9 89.2Q224.5 95.3 219.1 95.3Q215.7 95.3 213.8 91.8Q211.8 88.4 211.8 82.7Q211.8 77.1 214.6 72.4Q215.3 71.2 215.8 71.2Q216.2 71.2 216.4 71.9Q215.5 73.3 214.9 76.9Q214.2 80.5 214.2 84.1Q214.2 94.2 219.7 94.2M261.6 70.7L261.6 70.6Q259.8 71.4 257.8 74.6Q255.7 77.9 255.4 80.2Q261.6 73.8 261.6 70.7M243.2 88.6Q246.5 88.6 253.8 81.7L253.8 81.3Q253.8 78.6 256.4 74.7Q259.1 70.8 261.2 69.7Q260.9 69.4 260.5 69.4Q257.3 69.4 250 76.8Q242.6 84.1 242.6 88.1Q242.6 88.6 243.2 88.6M240.6 87.4Q240.6 81 248 74.6Q255.4 68.2 260.3 68.2Q262.8 68.2 262.8 70.3Q262.8 76.4 256.2 82.5Q256.7 82.7 257.3 82.7Q259.7 82.7 264.2 79.7L264.6 80.5Q259.1 84.2 256.3 84.2Q255.2 84.2 254.7 83.8Q251.3 86.6 247.6 88.3Q243.9 90 242.2 90Q240.6 90 240.6 87.4M310.4 33.4Q307.8 33.4 291.4 49.9Q275 66.4 266.5 78.2Q274.4 72.2 292.5 54.6Q310.6 37 310.6 33.7Q310.6 33.5 310.4 33.4M312 31.9Q312.8 31.9 312.8 32.8Q312.8 36.9 294.4 54.8Q275.9 72.6 265.1 80.2Q261.3 85.6 261.3 88Q261.3 88.8 261.6 88.8Q265.2 88.8 274.3 83.1L279.4 79.8L279.5 80.9Q277.4 82.3 274.6 84Q264.6 90.2 260.8 90.2Q259.7 90.2 259.7 88.5Q259.7 83.5 266.7 73.8Q273.7 64 282.7 54.9Q291.6 45.7 300.3 38.8Q308.9 31.9 312 31.9M298.1 61.4Q296.6 61.4 296.6 60Q296.6 58.7 297.9 57.5Q299.2 56.3 300.1 56.3Q301 56.3 301.5 56.8Q302 57.3 302 58Q302 58.7 300.8 60Q299.6 61.4 298.1 61.4M276.3 88.5Q277.3 86.4 284 78.7Q290.6 71.1 294.1 67.6Q294.6 67 294.6 66.7Q294.6 66.3 293.9 66.3L291.9 66.1Q291.2 66.1 290.6 66.8Q284.8 72.7 279.6 79.7Q274.4 86.7 274.4 88.4Q274.4 90.1 275.4 90.1Q276.8 90.1 281 87.8Q285.2 85.5 288.7 83.2L292.3 80.9L292.2 79.8Q278.3 88.9 276.8 88.9Q276.3 88.9 276.3 88.5M297.2 77.8L291.2 81.5L291 80.5L294.6 78Q298.4 75.5 299.9 74.2Q301.4 72.9 302 72.4Q302.7 71.9 303.5 71Q304.3 70 304.5 69.9Q304.5 69.9 305.5 68.5Q306.4 67.5 306.4 67.3Q307.8 67.6 307.8 69.4Q305.4 73 300.8 78.3Q296.1 83.6 296.1 83.9Q296.1 84.1 296.3 84.1Q296.4 84.1 297.5 83.2Q298.7 82.3 303.9 78.6Q314.4 71.4 318.1 68.9Q319.5 67.7 320.1 67.7Q320.6 67.7 321 68.1Q321.4 68.5 321.4 69.2Q321.4 69.9 320 72Q318.7 74.2 317.1 76.2Q313.1 81.3 312.1 82.3Q311.7 82.9 311.7 83.1Q311.7 83.2 311.8 83.2Q312.4 83.2 330.9 69.7Q333.9 67.6 334.9 67.6Q335.7 67.6 335.7 69.2Q335.7 70.9 333.1 74.3Q330.5 77.6 327.4 80.5Q319.2 88 319.2 88.8Q319.2 88.9 319.5 88.9Q320.5 88.9 331.1 82.1L334.6 79.8L334.7 80.9Q320.9 90.1 317.9 90.1Q317.4 90.1 317.4 89.6Q317.4 86.4 321.4 82Q325.4 77.7 329.3 74.2Q333.3 70.7 333.3 69.6Q333.3 69.4 333.1 69.4Q333 69.4 332.6 69.7Q332.2 70 321.8 77.3Q311.4 84.6 309.7 85.8Q308 87.1 305.5 89.6Q304.6 90.3 302.8 90.3Q301 90.3 301 89.9Q301 89.5 301.7 88.8Q306.9 83.6 312.8 77.1Q318.7 70.6 318.9 70Q318.9 69.8 318.7 69.8Q317.8 69.8 308.1 76.6Q298.4 83.5 296.8 84.6Q292.8 87.6 292.6 87.7Q292.3 87.8 291.6 88.6Q290.1 90.3 288.8 90.3Q287.5 89.9 287.4 89.7Q289.4 87.5 297.2 77.8M356.4 82.1L359.9 79.8L360 80.9Q346.2 90.1 343.2 90.1Q342.6 90.1 342.6 89.5Q342.6 87.7 344 84.3L344.5 83.1Q344.5 82.9 344.2 82.9Q343.9 82.9 339.1 86.4Q334.5 89.8 333.1 89.8Q331.6 89.8 331.6 87.2Q331.6 80.1 339.8 73.3Q347.9 66.5 359.3 66.5Q360.4 66.5 360.4 67.4Q360.4 68.2 352.3 77.4Q344.2 86.6 344.2 88.5Q344.2 88.8 344.7 88.8Q345.2 88.8 349.1 86.6Q353 84.3 356.4 82.1M346.3 79.9Q347.7 78.7 351.9 73.9Q356.1 69.1 356.1 68.3Q356.1 68 355.5 68Q351.5 68 346.3 71.6Q341 75.3 337.4 79.9Q333.7 84.6 333.7 87.4Q333.7 87.9 334.2 87.9Q334.7 87.9 335.9 87.3Q337.1 86.6 338.7 85.5Q340.4 84.3 341.6 83.5Q345.7 80.4 346.3 79.9M364.8 78L359 81.6L358.7 80.5L361.6 78.7Q368 74.4 369.7 72.7Q371.3 70.9 371.6 70.5Q373.9 67.6 374.1 67.3Q375.2 67.6 375.2 69.4Q373.4 71.9 370.5 75.3Q367.6 78.8 365.7 81.1Q363.8 83.4 363.8 83.7Q363.8 84.1 363.9 84.1Q364.1 84.1 365.2 83.2Q366.4 82.3 371.5 78.6Q381.9 71.4 384.8 69.5Q387.6 67.6 388.4 67.6Q389.3 67.6 389.3 69.2Q389.3 70.9 386.7 74.3Q384.1 77.6 381 80.5Q372.7 88 372.7 88.8Q372.7 88.9 373.1 88.9Q374.1 88.9 384.7 82.1L388.2 79.8L388.3 80.9Q374.5 90.1 371.5 90.1Q370.9 90.1 370.9 89.6Q370.9 86.4 374.9 82Q378.9 77.7 382.9 74.2Q386.9 70.7 386.9 69.6Q386.9 69.4 386.7 69.4Q384.2 70.7 375.1 77.1Q366 83.5 364.5 84.6Q360.4 87.6 360.2 87.7Q360 87.8 359.3 88.6Q357.8 90.3 356.5 90.3Q354.4 90.1 354.3 90Q354.3 89.9 354.3 89.8Q354.3 89.7 355.7 88.2Q357.1 86.7 358.5 85.3Q363 80.2 364.8 78\"/><path d=\"M 21.854 107.052 C 111.854 114.052, 249.26 102.052, 359.26 93.052 C 249.26 99.552, 111.854 111.552, 21.854 107.052 Z\"/></g></svg>";
  var KEY = 'ssh_certs', EP = /script\.google\.com\/macros\//;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } };
  var store = function (l) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(-60))); } catch (e) {} };

  /* ---------- certificate level ---------- */
  var TIERS = {
    excellence: { en: 'Certificate of Excellence', ar: 'شهادة تميّز', col: '#a67c00', soft: '#fff6dc', icon: '🏆',
      msg: 'An outstanding result. Your hard work and focus truly show. Keep shining!',
      msgAr: 'نتيجة متميزة تعكس اجتهادك وتركيزك. واصل تألقك!' },
    achievement: { en: 'Certificate of Achievement', ar: 'شهادة إنجاز', col: '#1d5fb8', soft: '#e8f1fd', icon: '🎖️',
      msg: 'A strong result that shows real progress. Keep building on it!',
      msgAr: 'نتيجة قوية تُظهر تقدمًا حقيقيًا. استمر في البناء عليها!' },
    effort: { en: 'Certificate of Effort & Perseverance', ar: 'شهادة تقدير للجهد والمثابرة', col: '#13795b', soft: '#e5f6ee', icon: '🌱',
      msg: 'Every attempt builds your skills. Review your feedback and try again: you can do it!',
      msgAr: 'كل محاولة تبني مهاراتك. راجع ملاحظات معلمك وحاول مجددًا، فأنت قادر على النجاح!' },
    completion: { en: 'Certificate of Completion', ar: 'شهادة إتمام', col: '#0f6b75', soft: '#e3f4f5', icon: '✍️',
      msg: 'You completed every step and submitted your work. Well done for your commitment!',
      msgAr: 'أتممت جميع الخطوات وسلّمت عملك. أحسنت على التزامك!' }
  };
  TIERS.placement = { en: 'Certificate of English Placement', ar: 'شهادة تحديد مستوى اللغة الإنجليزية', col: '#5b3a9a', soft: '#f1ebfa', icon: '🧭',
    msg: 'Your estimated CEFR level is shown above. Use it to choose the right next step in your English learning.',
    msgAr: 'يظهر مستواك التقديري وفق الإطار الأوروبي المرجعي أعلاه، استخدمه لاختيار خطوتك التالية في تعلم الإنجليزية.' };
  TIERS.workshop = { en: 'Certificate of Professional Development', ar: 'شهادة تطوير مهني', col: '#14244a', soft: '#eef2fa', icon: '🎓',
    msg: 'Completed a 1-hour CPD workshop with knowledge checks, written reflections and a classroom action plan.',
    msgAr: 'أتمّ ورشة تطوير مهني مدتها ساعة تضمنت اختبارات معرفية وتأملات مكتوبة وخطة تطبيق صفية.' };
  function tierOf(c) {
    if (c.prog === 'placement') return 'placement';
    if (c.prog === 'workshop') return 'workshop';
    if (c.kind === 'course' || c.pct == null) return 'completion';
    return c.pct >= 85 ? 'excellence' : c.pct >= 60 ? 'achievement' : 'effort';
  }

  /* ---------- build a certificate record from a recorded submission ---------- */
  function fromSubmission(b, ref) {
    var test = String(b.test || 'Smart Students Hub activity').trim();
    if (/^Teacher Workshop/i.test(test)) {        /* workshop that reports through the Submissions tab */
      var w = fromCourse({ cert: ref, name: b.name, course: test.replace(/^Teacher Workshop\s*\d*\s*·\s*/i, '').replace(/\s*\(\d{1,2}\/\d{1,2}\/\d{4}\)\s*$/, ''), score: b.score, max: b.max });
      w.sub = String(b.cls || ''); w.recorded = !!ref; return w;
    }
    var score = b.score === '' || b.score == null ? null : +b.score, max = +b.max || 0;
    var pct = b.percent === '' || b.percent == null ? (score != null && max ? Math.round(100 * score / max) : null) : Math.round(+b.percent);
    if (pct != null && !isFinite(pct)) pct = null;
    var prog = b.cert_prog || (/^Teaching Strategies Test|^TKT|self-check/i.test(test) || /^Teacher/i.test(b.cls || '') ? 'teacher' : /^IELTS|^VIV /i.test(test) ? 'ielts' : '');
    var src = prog ? '' : test + ' ' + (b.cls || '');
    var g = (src.match(/\bG(?:rade)?\s*(1[0-2])\b/i) || src.match(/\b(1[0-2])\b/) || [])[1] || '';
    var aesn = /AESN|ASEN|ADSEN/i.test(src);
    var writing = b.cert_kind ? b.cert_kind === 'course' : /writing|scaffold/i.test(test) && !/test\s*\d|mock|module test/i.test(test);
    var name = cleanName(b.name);
    var c = { no: ref || ('SSH-C-' + Date.now().toString(36).toUpperCase()), name: name, test: test,
      grade: g, aesn: aesn, prog: prog, kind: writing ? 'course' : 'test', score: score, max: max, pct: writing ? null : pct,
      page: b.page || location.pathname.split('/').pop() || '', date: new Date().toISOString(), recorded: !!ref };
    c.tier = tierOf(c);
    return c;
  }

  function cleanName(n) {
    n = String(n || '').replace(/\((?:student|teacher|parent|other|name not collected)[^)]*\)/ig, '').replace(/\s+/g, ' ').trim();
    return /name not collected/i.test(n) ? '' : n;
  }
  /* English Placement Test (payload type:'placement'; the Reference is made on the page) */
  function fromPlacement(b) {
    var c = { no: b.ref || ('SSH-PT-' + Date.now().toString(36).toUpperCase()), name: cleanName(b.name), test: 'English Placement Test (CEFR A1–C1)',
      prog: 'placement', kind: 'test', level: String(b.level || ''), reading: b.reading, listening: b.listening, uoe: b.uoe,
      score: null, max: 0, pct: null, page: 'english-placement-test.html', date: b.finished || new Date().toISOString(), recorded: true };
    c.tier = 'placement'; return c;
  }
  /* Academy teacher workshops (payload type:'course'; certificate number made on the page) */
  function fromCourse(b) {
    var c = { no: b.cert || ('SSH-W-' + Date.now().toString(36).toUpperCase()), name: cleanName(b.name), test: String(b.course || 'Teacher workshop'),
      prog: 'workshop', kind: 'course', score: b.score === '' || b.score == null ? null : +b.score, max: +b.max || 0, pct: null,
      sub: [b.subject ? b.subject + ' Teacher' : '', b.school || '', b.country || ''].filter(Boolean).join(' · '),
      page: location.pathname.split('/').pop() || '', date: b.finished || new Date().toISOString(), recorded: true };
    c.tier = 'workshop'; return c;
  }

  /* ---------- certificate markup (A4 landscape, mm units) ---------- */
  var CSS = "@font-face{font-family:'SSHTaj';src:url('" + BASE + "fonts/tajawal-arabic-700-normal.woff2') format('woff2');font-weight:700}" +
    "@font-face{font-family:'SSHTaj';src:url('" + BASE + "fonts/tajawal-arabic-500-normal.woff2') format('woff2');font-weight:500}" +
    ".sshc{direction:ltr;text-align:left;width:297mm;height:210mm;box-sizing:border-box;padding:7mm;background:#fff;color:#14244a;font-family:system-ui,'Segoe UI',Arial,'SSHTaj',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    ".sshc *{box-sizing:border-box}" +
    ".sshc-f{height:100%;border:2.6mm solid var(--c);padding:1.6mm;border-radius:2mm}" +
    ".sshc-i{position:relative;height:100%;border:.5mm solid #c9a646;border-radius:1mm;padding:8mm 16mm 6mm;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden;" +
    "background:radial-gradient(ellipse at 50% 42%,#ffffff 0%,#ffffff 52%,var(--s) 100%)}" +
    ".sshc-i:before,.sshc-i:after{content:'';position:absolute;width:34mm;height:34mm;border:.6mm solid var(--c);opacity:.35;transform:rotate(45deg)}" +
    ".sshc-i:before{top:-22mm;left:-22mm}.sshc-i:after{bottom:-22mm;right:-22mm}" +
    ".sshc-h{display:flex;align-items:center;gap:4mm}.sshc-h img{width:15mm;height:15mm}" +
    ".sshc-b{margin:0;font-weight:800;letter-spacing:.24em;font-size:15pt;color:#14244a;text-align:left}" +
    ".sshc-bs{margin:.6mm 0 0;font-size:8.5pt;letter-spacing:.06em;color:#7a6320;text-align:left}" +
    ".sshc-t{margin:5mm 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:31pt;font-weight:700;letter-spacing:.03em;color:var(--c);line-height:1.05}" +
    ".sshc-ta{margin:1mm 0 0;font-family:'SSHTaj',Tahoma,sans-serif;font-weight:700;font-size:17pt;color:var(--c)}" +
    ".sshc-l{margin:3.2mm 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:13.5pt}" +
    ".sshc-la{font-family:'SSHTaj',Tahoma,sans-serif;font-style:normal;font-weight:500;font-size:11pt;color:#43506a}" +
    ".sshc-n{margin:1.5mm 0 0;font-family:'Cormorant Garamond',Georgia,'SSHTaj',serif;font-size:31pt;font-weight:700;line-height:1.15;border-bottom:.5mm solid #c9a646;padding:0 14mm .8mm;min-width:120mm}" +
    ".sshc-n:lang(ar),.sshc-n.ar{font-family:'SSHTaj',Tahoma,sans-serif;font-size:27pt}" +
    ".sshc-c{margin:1.6mm 0 0;font-size:16pt;font-weight:800;color:#0f4c5c;line-height:1.2;max-width:225mm}" +
    ".sshc-g{margin:1mm 0 0;font-size:9.5pt;letter-spacing:.08em;text-transform:uppercase;color:#6b7a90;font-weight:700}" +
    ".sshc-r{display:flex;gap:4mm;margin-top:3.2mm;justify-content:center}" +
    ".sshc-r div{border:.35mm solid #e2d3a0;background:#fffdf6;border-radius:2mm;padding:1.4mm 5mm;min-width:30mm}" +
    ".sshc-r span{display:block;font-size:6.5pt;letter-spacing:.14em;text-transform:uppercase;color:#7a6320;font-weight:700}" +
    ".sshc-r b{font-size:12.5pt}" +
    ".sshc-m{margin:3mm 0 0;font-size:10.5pt;font-style:italic;color:#2c3a55;max-width:220mm}" +
    ".sshc-ma{display:block;font-family:'SSHTaj',Tahoma,sans-serif;font-style:normal;font-weight:500;margin-top:.6mm}" +
    ".sshc-ft{margin-top:auto;width:100%;display:flex;align-items:flex-end;justify-content:space-between}" +
    ".sshc-sg{display:flex;flex-direction:column;align-items:center;min-width:64mm;font-size:9pt}" +
    ".sshc-sg .sv{display:block;width:56mm;line-height:0;margin-bottom:-2mm}.sshc-sg .sv svg{width:100%;height:auto}" +
    ".sshc-sg i{display:block;width:58mm;border-top:.3mm solid #14244a;margin:1mm 0}" +
    ".sshc-sg small{color:#55627a;font-size:7.5pt;line-height:1.3}" +
    ".sshc-se{width:32mm;height:32mm;border-radius:50%;border:.9mm double var(--c);background:radial-gradient(circle,#fff,var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--c);font-weight:800;line-height:1.15}" +
    ".sshc-se em{font-style:normal;font-size:15pt}.sshc-se span{font-size:5.6pt;letter-spacing:.12em}.sshc-se b{font-size:7pt;letter-spacing:.06em}" +
    ".sshc-id{min-width:64mm;text-align:right;font-size:9pt;line-height:1.25}" +
    ".sshc-id span{display:block;font-size:6.5pt;letter-spacing:.14em;text-transform:uppercase;color:#7a6320;font-weight:700;margin-top:1mm}" +
    ".sshc-x{margin:2.4mm 0 0;font-size:6.6pt;color:#7b8798}" +
    ".sshc .sshc-a{letter-spacing:0!important;text-transform:none!important;font-family:'SSHTaj',Tahoma,sans-serif;unicode-bidi:isolate;display:inline!important;margin:0!important;font-size:inherit}";

  /* Arabic must never inherit letter-spacing/uppercase (breaks letter joining in PDFs) */
  var A = function (t) { return '<span class="sshc-a" dir="rtl">' + esc(t) + '</span>'; };
  function grLabel(c) {
    if (c.prog === 'ielts') return { en: 'IELTS Academic Preparation', ar: 'التحضير لاختبار IELTS الأكاديمي' };
    if (c.prog === 'teacher') return { en: 'Teacher Professional Learning · Self-check', ar: 'التعلم المهني للمعلمين · اختبار ذاتي' };
    if (c.prog === 'placement') return { en: 'Indicative CEFR placement', ar: 'تحديد مستوى تقديري وفق الإطار الأوروبي' };
    if (c.prog === 'workshop') return { en: 'Smart Students Hub Academy · 1-hour CPD', ar: 'أكاديمية سمارت ستيودنتس هب · ساعة تطوير مهني' };
    var g = c.grade ? 'Grade ' + c.grade : '', ga = c.grade ? 'الصف ' + ({ 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر' })[c.grade] : '';
    if (c.aesn) return { en: (g ? g + ' · ' : '') + 'AESN Supported English', ar: (ga ? ga + ' · ' : '') + 'الدعم الخاص في اللغة الإنجليزية' };
    return { en: (g ? g + ' · ' : '') + 'English', ar: ga ? ga + ' · اللغة الإنجليزية' : 'اللغة الإنجليزية' };
  }
  var LINE = { test: ['for successfully completing', 'تقديرًا لإتمام'], course: ['for successfully completing the course', 'تقديرًا لإتمام الدورة بنجاح'],
    placement: ['for completing the', 'لإتمام'], workshop: ['for successfully completing the professional development workshop', 'لإتمامه ورشة التطوير المهني بنجاح'] };
  function certHTML(c, nameOverride) {
    var t = TIERS[c.tier] || TIERS.completion, nm = nameOverride || c.name || (c.prog === 'workshop' || c.prog === 'teacher' ? 'Teacher' : 'Student');
    var d = new Date(c.date), ds = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var gl = grLabel(c), ar = /[؀-ۿ]/.test(nm);
    var showScore = c.pct != null && c.tier !== 'effort';
    var res = c.prog === 'placement' ?
      '<div class="sshc-r"><div><span>Estimated level · ' + A('المستوى التقديري') + '</span><b>' + esc(c.level || '—') + '</b></div>' +
      '<div><span>Date · ' + A('التاريخ') + '</span><b>' + esc(ds) + '</b></div></div>' :
      c.prog === 'workshop' ?
      '<div class="sshc-r"><div><span>Result · ' + A('النتيجة') + '</span><b>Passed' + (c.score != null && c.max ? ' · ' + esc(c.score) + '/' + esc(c.max) : '') + '</b></div>' +
      '<div><span>Duration · ' + A('المدة') + '</span><b>1 hour CPD</b></div>' +
      '<div><span>Date · ' + A('التاريخ') + '</span><b>' + esc(ds) + '</b></div></div>' :
      '<div class="sshc-r">' +
      (showScore ? '<div><span>Score · ' + A('الدرجة') + '</span><b>' + esc(c.score) + ' / ' + esc(c.max) + '</b></div><div><span>Result · ' + A('النسبة') + '</span><b>' + esc(c.pct) + '%</b></div>' :
        '<div><span>Status · ' + A('الحالة') + '</span><b>' + (c.tier === 'effort' ? 'Completed · ' + A('أتمّ') : 'Submitted · ' + A('سُلّم')) + '</b></div>') +
      '<div><span>Date · ' + A('التاريخ') + '</span><b>' + esc(ds) + '</b></div></div>';
    return '<div class="sshc" style="--c:' + t.col + ';--s:' + t.soft + '"><div class="sshc-f"><div class="sshc-i">' +
      '<div class="sshc-h"><img src="' + BASE + 'ssh-logo.png" alt="" crossorigin="anonymous"><div><p class="sshc-b">SMART STUDENTS HUB</p><p class="sshc-bs">' + ((c.prog === 'workshop' || c.prog === 'teacher') ? 'Academy · Teacher Professional Development · ' + A('التطوير المهني للمعلمين') : 'Student Recognition Programme · ' + A('برنامج تقدير الطلاب')) + '</p></div></div>' +
      '<p class="sshc-t">' + esc(t.en) + '</p><p class="sshc-ta">' + A(t.ar) + '</p>' +
      '<p class="sshc-l">This certificate is proudly presented to · <span class="sshc-la">' + A('تُمنح هذه الشهادة بكل فخر إلى') + '</span></p>' +
      '<p class="sshc-n' + (ar ? ' ar' : '') + '" dir="auto">' + esc(nm) + '</p>' +
      (c.sub ? '<p class="sshc-g" style="margin-top:.6mm;text-transform:none;letter-spacing:.02em">' + esc(c.sub) + '</p>' : '') +
      '<p class="sshc-l">' + LINE[c.prog === 'placement' ? 'placement' : c.prog === 'workshop' ? 'workshop' : c.kind][0] +
      ' · <span class="sshc-la">' + A(LINE[c.prog === 'placement' ? 'placement' : c.prog === 'workshop' ? 'workshop' : c.kind][1]) + '</span></p>' +
      '<p class="sshc-c" dir="auto">' + esc(c.test) + '</p>' +
      '<p class="sshc-g">' + esc(gl.en) + (gl.ar ? ' · ' + A(gl.ar) : '') + '</p>' +
      res +
      '<p class="sshc-m">' + esc(t.msg) + '<span class="sshc-ma" dir="rtl">' + esc(t.msgAr) + '</span></p>' +
      '<div class="sshc-ft"><div class="sshc-sg"><span class="sv">' + SIG + '</span><i></i><b>Sameh Soliman</b><small>Founder &amp; Educational Lead<br>Smart Students Hub</small></div>' +
      '<div class="sshc-se" aria-hidden="true"><em>' + t.icon + '</em><span>SMART STUDENTS</span><b>HUB</b><span>' + esc(new Date(c.date).getFullYear()) + '</span></div>' +
      '<div class="sshc-id"><span>Certificate No. · ' + A('رقم الشهادة') + '</span><b>' + esc(c.no) + '</b><span>Issued by · ' + A('جهة الإصدار') + '</span><b>smartstudentshub.com</b>' +
      (c.recorded ? '<span>Recorded · ' + A('موثّقة') + '</span><b style="font-size:7.5pt">in the ' + (c.prog === 'workshop' || c.prog === 'teacher' ? 'Smart Students Hub Academy register' : 'teacher\u2019s follow-up register') + '</b>' : '') + '</div></div>' +
      '<p class="sshc-x">' + (c.prog === 'placement' ? 'Indicative online placement based on the CEFR; not issued by the Council of Europe, the British Council or Cambridge, and not an official qualification. · ' + A('تحديد مستوى تقديري عبر الإنترنت وليس شهادة رسمية.') :
        c.prog === 'workshop' ? 'Independent, non-accredited CPD provided by Smart Students Hub; not issued on behalf of any ministry, school or examination board. · ' + A('تطوير مهني مستقل غير معتمد رسميًا.') :
        c.prog === 'teacher' ? 'Practice self-check by Smart Students Hub for teachers\u2019 professional learning; not an official TKT, IELTS or other qualification. · ' + A('اختبار ذاتي للتطوير المهني وليس مؤهلًا رسميًا.') :
        c.prog === 'ielts' ? 'Awarded by Smart Students Hub for IELTS preparation work. IELTS is a registered trademark of its owners; this is not an IELTS result or band score. · ' + A('شهادة تقديرية وليست نتيجة رسمية لاختبار IELTS.') :
        'Awarded by Smart Students Hub to recognise learning and effort. It is not an official qualification of any ministry, school or examination board. · ' + A('شهادة تقديرية من منصة سمارت ستيودنتس هب، وليست مؤهلًا رسميًا.')) + '</p>' +
      '</div></div></div>';
  }
  var FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&display=swap">';

  /* ---------- print (also "Save as PDF" in the print dialog) ---------- */
  function printCert(c, nm) {
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Certificate ' + esc(c.no) + '</title>' + FONTS +
      '<style>@page{size:A4 landscape;margin:0}html,body{margin:0;padding:0;background:#fff}' + CSS + '</style></head><body>' + certHTML(c, nm) + '</body></html>';
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var w = f.contentWindow, doc = w.document;
    doc.open(); doc.write(html); doc.close();
    var go = function () { try { w.focus(); w.print(); } catch (e) { var p = window.open('', '_blank'); if (p) { p.document.write(html); p.document.close(); setTimeout(function () { p.print(); }, 600); } } setTimeout(function () { f.remove(); }, 60000); };
    var ready = function () { (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { setTimeout(go, 250); }); };
    var img = doc.querySelector('img');
    if (img && !img.complete) { img.onload = img.onerror = ready; } else ready();
  }

  /* ---------- direct PDF download (A4 landscape) ---------- */
  var libs;
  function lib(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function loadLibs() {
    if (!libs) libs = Promise.all([
      window.html2canvas ? 0 : lib(BASE + 'vendor/html2canvas-1.4.1.min.js'),
      window.jspdf ? 0 : lib(BASE + 'vendor/jspdf-2.5.1.umd.min.js')
    ]).catch(function (e) { libs = null; throw e; });
    return libs;
  }
  function ensureStyle() {
    if (document.getElementById('sshc-css')) return;
    var st = document.createElement('style'); st.id = 'sshc-css'; st.textContent = CSS + UI; document.head.appendChild(st);
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) document.head.insertAdjacentHTML('beforeend', FONTS);
  }
  function fileName(c, nm) {
    return ('SSH-Certificate_' + String(nm || c.name || 'Student').replace(/[\\\/:*?"<>|]+/g, '').replace(/\s+/g, '-') + '_' + c.no).slice(0, 120) + '.pdf';
  }
  function downloadPDF(c, nm, btn) {
    ensureStyle();
    var old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Preparing PDF… · جارٍ التجهيز'; }
    var host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:297mm;height:210mm;background:#fff;z-index:-1';
    host.innerHTML = certHTML(c, nm); document.body.appendChild(host);
    var done = function () { host.remove(); if (btn) { btn.disabled = false; btn.innerHTML = old; } };
    loadLibs().then(function () { return document.fonts && document.fonts.ready; }).then(function () {
      var im = host.querySelector('img');
      return im && !im.complete ? new Promise(function (r) { im.onload = im.onerror = r; }) : 0;
    }).then(function () {
      return window.html2canvas(host.firstChild, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    }).then(function (cv) {
      var pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
      pdf.setProperties({ title: 'Smart Students Hub certificate ' + c.no, author: 'Smart Students Hub', subject: c.test });
      pdf.save(fileName(c, nm)); done();
    }).catch(function () { done(); printCert(c, nm); });
  }

  /* ---------- on-screen panel ---------- */
  var UI = ".sshc-ov{direction:ltr;position:fixed;inset:0;z-index:2147483000;background:rgba(10,20,45,.62);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:18px 10px;font-family:system-ui,'Segoe UI',Arial,'SSHTaj',sans-serif}" +
    ".sshc-pn{text-align:left;line-height:1.4;background:#fff;border-radius:18px;max-width:880px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);padding:18px 18px 16px;color:#14244a;position:relative}" +
    ".sshc-pn h2{margin:0 36px 4px 0;font-size:1.3rem}.sshc-pn p{margin:.3em 0}" +
    ".sshc-x2{position:absolute;top:10px;right:12px;border:0;background:#eef2f8;border-radius:50%;width:34px;height:34px;font-size:18px;cursor:pointer;color:#14244a}" +
    ".sshc-pv{margin:12px 0;border-radius:10px;overflow:hidden;border:1px solid #e3e8f0;background:#f6f8fb}" +
    ".sshc-pv>div{transform-origin:0 0}" +
    ".sshc-bt{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
    ".sshc-pn .sshc-bt button,.sshc-fab{font:inherit!important;font-size:1rem!important;font-weight:800!important;border:2px solid #14244a!important;border-radius:12px!important;padding:10px 16px!important;cursor:pointer;background:#14244a!important;color:#fff!important;box-shadow:none!important;transform:none!important;min-height:0!important;width:auto!important;margin:0!important;text-shadow:none!important}" +
    ".sshc-pn .sshc-bt button.alt{background:#fff!important;color:#14244a!important}" +
    ".sshc-pn .sshc-x2{position:absolute!important;top:10px!important;right:12px!important;border:0!important;background:#eef2f8!important;border-radius:50%!important;width:34px!important;height:34px!important;padding:0!important;font-size:18px!important;cursor:pointer;color:#14244a!important;box-shadow:none!important;min-height:0!important;margin:0!important}" +
    ".sshc-pn .sshc-ls button{font:inherit!important;font-weight:700!important;border:2px solid #14244a!important;background:#fff!important;color:#14244a!important;border-radius:9px!important;padding:5px 10px!important;box-shadow:none!important;min-height:0!important;width:auto!important;margin:0!important}" +
    ".sshc-bt button:disabled{opacity:.6;cursor:wait}" +
    ".sshc-nm{display:block;margin:8px 0;font-weight:700}.sshc-nm input{display:block;width:100%;max-width:420px;font:inherit;padding:9px 11px;border:2px solid #cfd8e6;border-radius:10px;margin-top:4px}" +
    ".sshc-hint{font-size:.85rem;color:#55627a}" +
    ".sshc-find{margin:8px 0 12px}.sshc-find a{display:block;text-align:center;font-weight:700;color:#075e65;background:#e8f4f4;border:1.5px solid #075e65;border-radius:12px;padding:10px 12px;text-decoration:none}" +
    ".sshc-ls{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:6px}.sshc-ls li{display:flex;justify-content:space-between;gap:8px;align-items:center;border:1px solid #e3e8f0;border-radius:10px;padding:8px 10px}" +
    ".sshc-ls button{font:inherit;font-weight:700;border:2px solid #14244a;background:#fff;border-radius:9px;padding:5px 10px;cursor:pointer}" +
    "button.sshc-fab{position:fixed!important;left:14px!important;bottom:14px!important;z-index:2147482000;box-shadow:0 8px 24px rgba(0,0,0,.25)!important;background:linear-gradient(135deg,#c9a646,#a67c00)!important;border-color:#a67c00!important;font-size:.9rem!important}" +
    ".sshc-hint-box{margin:10px 0;padding:10px 14px;border-radius:12px;border:2px dashed #c9a646;background:#fffaf0;color:#14244a;font:600 .95rem/1.45 system-ui,'Segoe UI',Arial,'SSHTaj',sans-serif;text-align:left;direction:ltr}" +
    ".sshc-hint-box b{color:#a67c00}.sshc-hint-box .ar{display:block;direction:rtl;text-align:right;font-weight:500;margin-top:2px}" +
    ".sshc-hint-box .warn{display:block;color:#b03a2e;margin-top:4px}.sshc-hint-box.done{border-style:solid;border-color:#13795b;background:#e9f7f0}" +
    ".sshc-hint-box button{font:inherit;font-weight:800;margin-top:6px;border:2px solid #13795b;background:#fff;color:#13795b;border-radius:10px;padding:6px 12px;cursor:pointer}" +
    "@media print{.sshc-ov,.sshc-fab,.sshc-hint-box{display:none!important}}";

  function close() { var o = document.querySelector('.sshc-ov'); if (o) o.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function fit(pv) {
    var inner = pv.firstChild; if (!inner) return;
    var k = pv.clientWidth / inner.firstChild.offsetWidth;
    inner.style.transform = 'scale(' + k + ')'; pv.style.height = Math.ceil(inner.firstChild.offsetHeight * k) + 'px';
  }
  function show(c, isNew) {
    ensureStyle(); close();
    var t = TIERS[c.tier] || TIERS.completion, needName = c.name.split(/\s+/).filter(Boolean).length < 2;
    var o = document.createElement('div'); o.className = 'sshc-ov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = '<div class="sshc-pn"><button class="sshc-x2" aria-label="Close · إغلاق">✕</button>' +
      '<h2>' + (isNew ? '🎉 Congratulations! You earned a certificate · مبارك! حصلت على شهادة' : '🎓 Your certificate · شهادتك') + '</h2>' +
      '<p><b>' + t.icon + ' ' + esc(t.en) + ' · <span dir="rtl">' + esc(t.ar) + '</span></b></p>' +
      (needName ? '<label class="sshc-nm">Your full name for the certificate · اسمك الكامل للشهادة<input id="sshcName" autocomplete="name" value="' + esc(c.name) + '" placeholder="e.g. Ahmed Ali Hassan"></label>' : '') +
      '<div class="sshc-pv"><div></div></div>' +
      '<div class="sshc-bt"><button id="sshcPdf">⬇️ Download PDF · تنزيل PDF</button><button class="alt" id="sshcPrint">🖨️ Print · طباعة</button><button class="alt" id="sshcAll">📂 My certificates · شهاداتي</button></div>' +
      '<p class="sshc-hint">Certificate No. ' + esc(c.no) + (c.recorded ? (c.prog === 'workshop' || c.prog === 'teacher' ? ' · recorded in the Academy register · مسجّلة في سجل الأكاديمية' : ' · recorded in your teacher’s follow-up register · مسجّلة في سجل متابعة المعلم') : '') + '</p></div>';
    document.body.appendChild(o);
    var pv = o.querySelector('.sshc-pv'), nmEl = o.querySelector('#sshcName');
    var nm = function () { return nmEl ? nmEl.value.trim() : ''; };
    var draw = function () { pv.firstChild.innerHTML = certHTML(c, nm()); fit(pv); };
    draw(); setTimeout(function () { fit(pv); }, 300);
    window.addEventListener('resize', function () { fit(pv); });
    if (nmEl) nmEl.addEventListener('input', draw);
    var ok = function () { if (nmEl && nm().split(/\s+/).filter(Boolean).length < 2) { nmEl.focus(); nmEl.style.borderColor = '#c0392b'; return false; } if (nmEl) { c.name = nm(); save(c); } return true; };
    o.querySelector('.sshc-x2').onclick = close;
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    document.addEventListener('keydown', onKey);
    o.querySelector('#sshcPdf').onclick = function () { if (ok()) downloadPDF(c, nm(), this); };
    o.querySelector('#sshcPrint').onclick = function () { if (ok()) printCert(c, nm()); };
    o.querySelector('#sshcAll').onclick = list;
  }
  function list() {
    ensureStyle(); close();
    var l = load().slice().reverse();
    var o = document.createElement('div'); o.className = 'sshc-ov';
    o.innerHTML = '<div class="sshc-pn"><button class="sshc-x2" aria-label="Close · إغلاق">✕</button><h2>📂 My certificates · شهاداتي</h2>' +
      '<p class="sshc-hint">Saved on this device. Your teacher keeps the official record. · محفوظة على هذا الجهاز، ويحتفظ معلمك بالسجل الرسمي.</p>' +
      '<p class="sshc-find"><a href="' + BASE + 'my-certificates.html">🔎 Can’t find a certificate? Open it from any device · لم تجد شهادتك؟ استرجعها من أي جهاز</a></p>' +
      (l.length ? '<ul class="sshc-ls">' + l.map(function (c, i) { var t = TIERS[c.tier] || TIERS.completion; return '<li><span>' + t.icon + ' <b>' + esc(c.test) + '</b><br><small>' + esc(t.en) + ' · ' + esc(new Date(c.date).toLocaleDateString('en-GB')) + ' · ' + esc(c.no) + '</small></span><button data-i="' + i + '">Open · فتح</button></li>'; }).join('') + '</ul>' : '<p>No certificates yet. Finish a test or course to earn one! · لا توجد شهادات بعد.</p>') + '</div>';
    document.body.appendChild(o);
    o.querySelector('.sshc-x2').onclick = close;
    o.addEventListener('click', function (e) { if (e.target === o) close(); var b = e.target.closest && e.target.closest('button[data-i]'); if (b) show(l[+b.dataset.i], false); });
    document.addEventListener('keydown', onKey);
  }
  function save(c) { var l = load().filter(function (x) { return x.no !== c.no; }); l.push(c); store(l); fab(); }
  function fab() {
    if (!document.body || /my-certificates\.html$/.test(location.pathname)) return;
    ensureStyle();
    var b = document.querySelector('.sshc-fab');
    if (!b) { b = document.createElement('button'); b.className = 'sshc-fab'; b.type = 'button'; b.onclick = list; document.body.appendChild(b); }
    b.textContent = '🎓 My certificates · شهاداتي' + (load().length ? ' (' + load().length + ')' : '');
  }

  function issueRec(c) {
    save(c); issuedHere = true;
    setTimeout(function () { show(c, true); }, 900);
    return c;
  }
  function issue(b, ref) {
    var c = fromSubmission(b, ref);
    /* the same result sent twice (e.g. the optional "send to trainer" form) keeps its first certificate */
    var dup = load().filter(function (x) { var s1 = x.test, s2 = c.test; return (s1.indexOf(s2) === 0 || s2.indexOf(s1) === 0) && x.score === c.score && Date.now() - new Date(x.date) < 15 * 60000; })[0];
    if (dup) return dup;
    return issueRec(c);
  }

  /* ---------- IELTS pages: they keep results only on the device, so record them first ---------- */
  var EP_URL = 'https://script.google.com/macros/s/AKfycbwXKby0ftvHXqoNyYouxh4vStgiiCWyZ52CWmexbtyLoDfPSok7HcYDTa41PWIbVXoJ_A/exec';
  var LIVE = location.protocol === 'https:' && ['mrsameh2024.github.io', 'smartstudentshub.com', 'www.smartstudentshub.com'].indexOf(location.hostname.toLowerCase()) >= 0 && !/[?&]mock=1/.test(location.search);
  function pageTitle() {
    var t = (document.title || '').split(/\s+[|·]\s+/)[0].trim(), h = document.querySelector('h1');
    var h1 = h ? h.textContent.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim() : '';
    var m = h1.match(/^Module\s+\d+\s*:\s*(.+)$/i);
    if (m && /Module\s+\d+/i.test(t)) return t + ' · ' + m[1];
    if (/^VIV /.test(t)) return 'IELTS ' + t.replace(/^VIV /, '') + ' (VIV)';
    return t;
  }
  /* key → what was achieved; returns null when there is nothing to certify yet */
  function ieltsResult(key, v) {
    if (/dashboard|readiness/.test(key)) return null;
    if (/mock01_status/.test(key)) return v.ready ? { kind: 'course', sig: 'ready' } : null;
    if (/diag_(writing|speaking)/.test(key)) return { kind: 'course', sig: 'p' + v.percent };
    if (/complete_profile/.test(key)) return { kind: 'course', sig: 'o' + v.overall };
    if (/speaking_module/.test(key)) return v.recorded ? { kind: 'course', sig: 'a' + v.average } : null;
    if (v.criteria) return v.words > 0 ? { kind: 'course', sig: 'w' + v.words + v.criteria } : null;
    if (v.total != null && v.score != null) return { kind: 'test', score: +v.score, max: +v.total, sig: v.score + '/' + v.total };
    if (v.percent != null) return { kind: 'test', score: v.raw != null ? +v.raw : '', max: '', percent: +v.percent, sig: 'p' + v.percent };
    return null;
  }
  function recordIelts(res, extra) { return recordResult(res, { test: pageTitle() + (extra || '') }); }
  /* opts: test, prog ('ielts' | 'teacher') */
  function recordResult(res, opts) {
    var prog = opts.prog || 'ielts';
    var r = {}; try { r = JSON.parse(localStorage.getItem('ssh_reg') || '{}') || {}; } catch (e) {}
    var name = String(r.name || '').trim(); if (!name) return;
    if (name.split(/\s+/).length < 2) name += ' (' + (r.role || 'Student') + ')';
    var test = opts.test;
    var k = 'ssh_cert_sent|' + test + '|' + res.sig;
    try { if (localStorage.getItem(k)) return; } catch (e) {}
    var pct = res.percent != null ? Math.round(res.percent) : res.max ? Math.round(100 * res.score / res.max) : '';
    var body = { type: 'submission', page: location.pathname.split('/').pop() || '', test: test.slice(0, 60), name: name,
      cls: (prog === 'teacher' ? 'Teacher' + (r.cls ? ' · ' + r.cls : '') : 'IELTS · ' + (r.cls || r.role || 'Learner')).slice(0, 30), email: r.email || '', phone: r.phone || '', consent: true,
      score: res.kind === 'course' ? '' : res.score, max: res.kind === 'course' ? '' : res.max, percent: res.kind === 'course' ? '' : pct,
      breakdown: res.kind === 'course' ? 'Completed (self-assessed or teacher review)' : 'Score ' + res.score + (res.max ? '/' + res.max : ''),
      topic: (prog === 'teacher' ? 'Teacher self-check' : 'IELTS') + ' – progress record (no marking needed)', essay: '', answers: '', website: '', cert_prog: prog, cert_kind: res.kind };
    if (!LIVE) { issueRec(fromSubmission(body, '')); return; }
    try { localStorage.setItem(k, '1'); } catch (e) {}
    window.fetch(EP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
      .then(function (x) { return x.json(); }).then(function (d) { if (!d || !d.ok) try { localStorage.removeItem(k); } catch (e) {} })
      .catch(function () { try { localStorage.removeItem(k); } catch (e) {} });
  }
  /* Teacher self-checks: read the result the page shows, then record it */
  function watch(id, fn) {
    var el = document.getElementById(id); if (!el) return;
    var last = '';
    new MutationObserver(function () { var t = el.textContent; if (t && t !== last) { last = t; fn(el); } }).observe(el, { childList: true, subtree: true, characterData: true });
  }
  var PAGE = location.pathname.split('/').pop();
  function teacherPages() {
    if (PAGE === 'teacher-tkt-self-check.html') watch('res', function (el) {
      var m = el.textContent.match(/(\d+)\s*\/\s*30/); if (m) recordResult({ kind: 'test', score: +m[1], max: 30, sig: m[1] }, { prog: 'teacher', test: 'TKT-style Teaching Knowledge Self-Check' });
    });
    if (PAGE === 'teacher-ielts-self-check.html') {
      watch('rres', function (el) {
        var m = el.textContent.match(/(\d+)\s*\/\s*13/); if (m) recordResult({ kind: 'test', score: +m[1], max: 13, sig: m[1] }, { prog: 'teacher', test: 'IELTS-style Academic Reading Self-Check' });
      });
      watch('wres', function (el) {
        var w = (el.textContent.match(/Words:\s*(\d+)/) || [])[1]; if (+w > 0) recordResult({ kind: 'course', sig: 'w' + w }, { prog: 'teacher', test: 'IELTS-style Writing Task 2 Self-Assessment' });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', teacherPages); else teacherPages();

  var setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, val) {
    var out = setItem.apply(this, arguments);
    try {
      if (this === window.localStorage && /^ssh_ielts_/.test(key)) {
        var res = ieltsResult(key, JSON.parse(val));
        if (res) setTimeout(function () { recordIelts(res); }, 50);
      } else if (this === window.localStorage && key === 'ssh_ts_v1') {
        var t = +(new URLSearchParams(location.search).get('t') || 0), H = JSON.parse(val) || {}, pc = H['t' + t];
        var h2 = document.querySelector('#test h2');
        if (t && pc != null) setTimeout(function () {
          recordResult({ kind: 'test', score: Math.round(pc * 20 / 100), max: 20, percent: pc, sig: String(pc) },
            { prog: 'teacher', test: 'Teaching Strategies Test ' + t + (h2 ? ' · ' + h2.textContent.replace(/^Test\s*\d+\s*·\s*/, '') : '') });
        }, 50);
      } else if (this === window.localStorage && /^viv-[a-z]+-scores$/.test(key)) {
        var sc = JSON.parse(val) || [], groups = document.querySelectorAll('[id^="quiz"]').length || sc.length;
        var done = 0, tot = 0; for (var i = 0; i < groups; i++) if (sc[i] != null) { done++; tot += +sc[i]; }
        if (groups && done === groups) setTimeout(function () { recordIelts({ kind: 'test', score: tot, max: groups * 5, sig: tot + '/' + groups * 5 }); }, 50);
      }
    } catch (e) {}
    return out;
  };

  /* ---------- copy each recorded test result to the certificate store, so students can reopen it on any device ---------- */
  var SB_URL = 'https://jstszuaxqpyaubatjqav.supabase.co/rest/v1/rpc/';
  var SB_KEY = 'sb_publishable_53u5Doc-GwQJS88zM1IpzA_P58NZv6_';
  function sendOnline(p) {
    if (!LIVE || !of) return;
    try {
      of.call(window, SB_URL + 'record_result', { method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: SB_KEY }, body: JSON.stringify({ p: p })
      }).catch(function () {});
    } catch (e) {}
  }
  function regInfo() { try { return JSON.parse(localStorage.getItem('ssh_reg') || '{}') || {}; } catch (e) { return {}; } }
  function keepOnline(b, ref) {
    if (!/^SSH-\d{6}-\d{4}$/.test(ref || '')) return;
    sendOnline({ ref: ref, test: b.test, name: b.name, cls: b.cls, email: b.email, phone: b.phone, score: b.score, max: b.max, percent: b.percent, cert_kind: b.cert_kind || '',
      topic: b.topic || '', essay: b.essay || '', answers: b.answers || '', breakdown: b.breakdown || '' });
  }
  /* English Placement Test: the page sends the email only, so add the registered mobile too */
  function keepPlacement(b) {
    var r = regInfo();
    sendOnline({ kind: 'placement', ref: b.ref, name: b.name || r.name, email: b.email || r.email, phone: b.phone || r.phone,
      level: b.level, reading: b.reading, listening: b.listening, uoe: b.uoe });
  }
  /* Academy teacher workshops (certificate number made on the page, e.g. SSH-AIT-261120-1234) */
  function keepWorkshop(b, c) {
    var r = regInfo();
    sendOnline({ kind: 'workshop', ref: b.cert, test: b.course, name: b.name, cls: (c && c.sub) || '', email: b.email || r.email,
      phone: b.phone || r.phone, score: b.score, max: b.max,
      details: { subject: b.subject || '', school: b.school || '', grades: b.grades || '', years: b.years || '', country: b.country || '',
        stages: b.stages || '', tries: b.tries || '', pre: b.pre || '', post: b.post || '', plan: b.plan || '', evalr: b.evalr || '',
        useful: b.useful || '', suggest: b.suggest || '', started: b.started || '', finished: b.finished || '', essays: String(b.essays || '').slice(0, 12000) } });
  }

  /* ---------- listen for recorded results ---------- */
  var of = window.fetch;
  if (of) {
    window.fetch = function (url, opt) {
      var p = of.apply(this, arguments), body = null;
      try {
        if (opt && typeof opt.body === 'string' && EP.test(String(url && url.url || url))) {
          body = JSON.parse(opt.body);
          if (body && !body.type && body.test) body.type = 'submission';
          if (!body || body.website || ['submission', 'placement', 'course'].indexOf(body.type) < 0) body = null;
        }
      } catch (e) { body = null; }
      if (body) {
        p.then(function (r) { return r.clone().json(); })
          .then(function (d) {
            if (!d || !d.ok) return;
            if (body.type === 'placement') { issueRec(fromPlacement(body)); keepPlacement(body); }
            else if (body.type === 'course') { var wc = issueRec(fromCourse(body)); keepWorkshop(body, wc); }
            else { issue(body, d.ref || ''); keepOnline(body, d.ref); }
          })
          .catch(function () {});
      }
      return p;
    };
  }

  /* Tell students, right next to the send button, that sending is what issues the certificate */
  var SEND_RE = /send my (result|results|practice)|submit to (your )?teacher|submit writing|submit station|أرسل نتيجتي|إرسال الموضوع/i;
  var issuedHere = false;
  function hintHTML(btn) {
    if (issuedHere) return '<b>🎓 Certificate issued!</b> · ' + 'شهادتك جاهزة' + '<span class="ar">افتحها أو حمّلها من «شهاداتي».</span><button type="button" class="sshc-open">📂 Open my certificate · افتح شهادتي</button>';
    if (/submit station/i.test(btn.textContent)) {
      var stn = (document.title.match(/Station\s*(\d+)/i) || [])[1];
      return '<b>🎓 Your certificate:</b> finish all the stations. When you submit <b>the final station</b>, your work is sent to your teacher and your certificate appears straight away.' +
        '<span class="ar">🎓 شهادتك: أكمل جميع المحطات، وعند إرسال المحطة الأخيرة تُرسل إلى معلمك وتظهر شهادتك فورًا.</span>';
    }
    return '<b>🎓 Your certificate:</b> press <b>“' + esc(btn.textContent.trim().split(' · ')[0].replace(/^[^A-Za-z]+/, '')) + '”</b> and your certificate appears straight away, with PDF download and print.' +
      '<span class="ar">🎓 شهادتك: اضغط زر الإرسال وستظهر شهادتك فورًا مع إمكانية التنزيل PDF والطباعة.</span>' +
      (btn.disabled ? '<span class="warn">First finish the steps above (for example, self-mark every answer) so the button becomes active.</span><span class="warn ar">أكمل الخطوات أعلاه أولًا (مثل التصحيح الذاتي لكل إجابة) ليُفعَّل زر الإرسال.</span>' +
        (unmarked().length ? '<button type="button" class="sshc-goto">👆 Show me what to mark (' + unmarked().length + ') · أرني ما أصحّحه</button>' : '') : '');
  }
  /* self-mark boxes (✓ I got it / ✗ Not yet) that the student has not answered yet */
  function unmarked() {
    return [].slice.call(document.querySelectorAll('.self:not(.hidden)')).filter(function (x) {
      return x.querySelector('button') && !x.querySelector('button.on') && (x.offsetParent || x.getClientRects().length);
    });
  }
  function paintHints() {
    var bs = document.querySelectorAll('button'), i, b, box;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!SEND_RE.test(b.textContent || '') || b.closest('.sshc-ov')) continue;
      if (!b.offsetParent && !b.getClientRects().length) continue;
      box = b._sshcHint;
      if (!box) { ensureStyle(); box = document.createElement('div'); box.className = 'sshc-hint-box'; box.setAttribute('role', 'note'); b.parentNode.insertBefore(box, b); b._sshcHint = box; }
      var key = (issuedHere ? 'done' : '') + '|' + b.disabled + '|' + unmarked().length;
      if (box._k !== key) { box._k = key; box.className = 'sshc-hint-box' + (issuedHere ? ' done' : ''); box.innerHTML = hintHTML(b); var o = box.querySelector('.sshc-open'); if (o) o.onclick = function () { var l = load(); if (l.length) show(l[l.length - 1], false); };
        var g = box.querySelector('.sshc-goto'); if (g) g.onclick = function () { var u = unmarked()[0]; if (u) { u.scrollIntoView({ behavior: 'smooth', block: 'center' }); u.style.outline = '3px solid #c9a646'; u.style.outlineOffset = '4px'; u.style.borderRadius = '10px'; setTimeout(function () { u.style.outline = ''; }, 2500); } }; }
    }
  }
  setInterval(paintHints, 1200);

  window.SSH_CERT = { issue: issue, show: show, list: list, keep: save, print: printCert, pdf: downloadPDF, _html: certHTML, _from: fromSubmission, _placement: fromPlacement, _workshop: fromCourse };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fab); else fab();
})();
