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
  var SIG = __SIG__;
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
      (l.length ? '<ul class="sshc-ls">' + l.map(function (c, i) { var t = TIERS[c.tier] || TIERS.completion; return '<li><span>' + t.icon + ' <b>' + esc(c.test) + '</b><br><small>' + esc(t.en) + ' · ' + esc(new Date(c.date).toLocaleDateString('en-GB')) + ' · ' + esc(c.no) + '</small></span><button data-i="' + i + '">Open · فتح</button></li>'; }).join('') + '</ul>' : '<p>No certificates yet. Finish a test or course to earn one! · لا توجد شهادات بعد.</p>') + '</div>';
    document.body.appendChild(o);
    o.querySelector('.sshc-x2').onclick = close;
    o.addEventListener('click', function (e) { if (e.target === o) close(); var b = e.target.closest && e.target.closest('button[data-i]'); if (b) show(l[+b.dataset.i], false); });
    document.addEventListener('keydown', onKey);
  }
  function save(c) { var l = load().filter(function (x) { return x.no !== c.no; }); l.push(c); store(l); fab(); }
  function fab() {
    if (!load().length || !document.body) return;
    ensureStyle();
    var b = document.querySelector('.sshc-fab');
    if (!b) { b = document.createElement('button'); b.className = 'sshc-fab'; b.type = 'button'; b.onclick = list; document.body.appendChild(b); }
    b.textContent = '🎓 My certificates · شهاداتي (' + load().length + ')';
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
            if (body.type === 'placement') issueRec(fromPlacement(body));
            else if (body.type === 'course') issueRec(fromCourse(body));
            else issue(body, d.ref || '');
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
      (btn.disabled ? '<span class="warn">First finish the steps above (for example, self-mark every answer) so the button becomes active.</span><span class="warn ar">أكمل الخطوات أعلاه أولًا (مثل التصحيح الذاتي لكل إجابة) ليُفعَّل زر الإرسال.</span>' : '');
  }
  function paintHints() {
    var bs = document.querySelectorAll('button'), i, b, box;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!SEND_RE.test(b.textContent || '') || b.closest('.sshc-ov')) continue;
      if (!b.offsetParent && !b.getClientRects().length) continue;
      box = b._sshcHint;
      if (!box) { ensureStyle(); box = document.createElement('div'); box.className = 'sshc-hint-box'; box.setAttribute('role', 'note'); b.parentNode.insertBefore(box, b); b._sshcHint = box; }
      var key = (issuedHere ? 'done' : '') + '|' + b.disabled;
      if (box._k !== key) { box._k = key; box.className = 'sshc-hint-box' + (issuedHere ? ' done' : ''); box.innerHTML = hintHTML(b); var o = box.querySelector('.sshc-open'); if (o) o.onclick = function () { var l = load(); if (l.length) show(l[l.length - 1], false); }; }
    }
  }
  setInterval(paintHints, 1200);

  window.SSH_CERT = { issue: issue, show: show, list: list, print: printCert, pdf: downloadPDF, _html: certHTML, _from: fromSubmission };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fab); else fab();
})();
