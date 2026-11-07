/* Smart Students Hub – "Start → straight into the test".
   1) Fills the student's details from the one-time registration and from the last test
      (name, class, email, mobile, consent) and folds the details box into a slim bar.
   2) Scrolls the student straight to the test (test chooser or first question).
   3) Choosing another test in the chooser jumps to its first question.
   Nothing is sent from here; the page's own Check/Send code is unchanged. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var get = function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };

  // styles: applied at once (also behind the welcome screen)
  (function () {
    var css = document.createElement('style');
    css.textContent = '.ssh-ready{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:linear-gradient(90deg,#e8f6ee,#eef3fb);border:2px solid #1a7f4b;border-radius:14px;padding:10px 14px;margin:12px 0;font-size:.95rem;color:#14244a}' +
      '.ssh-ready b{color:#1a6b3c}.ssh-ready .who{flex:1;min-width:200px}.ssh-ready button{background:#fff;border:1.5px solid #14244a;color:#14244a;border-radius:10px;padding:6px 12px;font-weight:700;cursor:pointer}' +
      '.ssh-ready .go{background:#1e6fd9;border-color:#1e6fd9;color:#fff}';
    var COLS = ['#8c2f52','#1e6fd9','#1a6b3c','#b4530a','#5b2a86','#0f4c5c','#a8471f','#14244a','#c2185b','#00796b','#3949ab','#6d4c41'];
    var tiles = COLS.map(function (c, i) { return '.picker a:nth-child(' + COLS.length + 'n+' + (i + 1) + '){background:' + c + '}'; }).join('');
    css.textContent += '.card:has(#picker){background:linear-gradient(120deg,#14244a 0%,#1e6fd9 100%);color:#fff;border:0;box-shadow:0 12px 30px rgba(20,36,74,.18)}' +
      '.card:has(#picker) h1,.card:has(#picker) h2,.card:has(#picker) p,.card:has(#picker) div{color:#fff}' +
      '.card:has(#picker) .eyebrow,.card:has(#picker) [dir=rtl],.card:has(#picker) .ar{color:#ffd36b}' +
      '.picker{gap:12px}.picker a{position:relative;color:#fff!important;border:0!important;border-radius:16px;padding:12px 12px 48px;min-height:118px;box-shadow:0 6px 16px rgba(0,0,0,.18);transition:transform .15s,box-shadow .15s;font-weight:600;line-height:1.3}' +
      '.picker a:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(0,0,0,.25)}' +
      '.picker a b{display:table!important;color:#fff!important;background:rgba(255,255,255,.22);border-radius:20px;padding:1px 10px;font-size:.78rem;margin-bottom:6px}' +
      '.picker a::after{content:"Start · ابدأ ▸";position:absolute;left:12px;right:12px;bottom:10px;background:#fff;color:#14244a;border-radius:10px;text-align:center;font-weight:800;font-size:.85rem;padding:5px 0}' +
      '.picker a.on{outline:4px solid #ffd36b;outline-offset:2px}.picker a.on::after{content:"✓ Now open · مفتوح الآن";background:#ffd36b}' + tiles;
    document.head.appendChild(css);
  })();

  // easier details box: one "email or mobile" field, no tick box, class only for students
  function simplify() {
    var det = $('sshDet');
    if (!det || det.dataset.easy) return;
    det.dataset.easy = '1';
    var reg = {}; try { reg = JSON.parse(get('ssh_reg') || '{}') || {}; } catch (e) {}
    var em = $('sshEmail'), ph = $('sshPhone'), cs = $('sshConsent'), cl = $('sshClass') || $('sclass');
    var ping = function (el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (em && ph) {
      var lab = document.createElement('label');
      lab.className = 'f'; lab.htmlFor = 'sshContact';
      lab.innerHTML = 'Email or mobile · البريد الإلكتروني أو الجوال *<input type="text" id="sshContact" autocomplete="email" maxlength="120" placeholder="name@example.com · +974 5xxx xxxx">';
      var emL = em.closest('label') || em, phL = ph.closest('label') || ph;
      emL.parentNode.insertBefore(lab, emL);
      emL.style.display = 'none'; phL.style.display = 'none';
      var box = $('sshContact');
      box.value = em.value || ph.value || reg.email || reg.phone || '';
      var route = function () {
        var v = box.value.trim(), mail = v.indexOf('@') >= 0;
        em.value = mail ? v : ''; ph.value = mail ? '' : v; ping(em); ping(ph);
      };
      box.addEventListener('input', route); box.addEventListener('change', route);
      if (box.value) route();
      // keep the visible field in step if the page fills or locks the hidden ones
      var back = function () { var v = em.value || ph.value; if (v && v !== box.value.trim()) box.value = v; box.disabled = em.disabled; };
      em.addEventListener('input', back); ph.addEventListener('input', back);
      setInterval(back, 1500);
      var or = det.querySelector('.or'); if (or) or.hidden = true;
    }
    if (cs) {
      cs.checked = true; ping(cs); cs.style.display = 'none';
      var cl2 = cs.closest('label');
      if (cl2) { var tip = document.createElement('b'); tip.textContent = 'ℹ️ By pressing Check: · بالضغط على «صحّح»: '; tip.style.cssText = 'display:block;margin-bottom:2px'; var sp = cl2.querySelector('span'); if (sp) sp.insertBefore(tip, sp.firstChild); else cl2.insertBefore(tip, cl2.firstChild); }
    }
    classForRole();
  }
  function classForRole() {
    var reg = {}; try { reg = JSON.parse(get('ssh_reg') || '{}') || {}; } catch (e) {}
    var cl = $('sshClass') || $('sclass');
    var ping = function (el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (cl) {
      var role = reg.role || '';
      if (!cl.value && (reg.cls || get('ssh_class'))) { cl.value = reg.cls || get('ssh_class'); ping(cl); }
      if (role && role !== 'Student') {
        (cl.closest('label') || cl).style.display = 'none';
        if (!cl.value.trim()) { cl.value = role; ping(cl); }
      }
      cl.placeholder = 'e.g. 12-3 · any form · بأي صيغة';
    }
  }

  function init() {
    simplify(); classForRole();
    var det = $('sshDet');
    if (!det || det.dataset.qs) return;
    det.dataset.qs = '1';
    var reg = {}; try { reg = JSON.parse(get('ssh_reg') || '{}') || {}; } catch (e) {}
    var nameEl = $('sshName') || $('student') || $('sname'), classEl = $('sshClass') || $('sclass'), emailEl = $('sshEmail'),
        phoneEl = $('sshPhone'), consentEl = $('sshConsent');

    var fire = function (el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    [[nameEl, get('ssh_name') || reg.name], [classEl, get('ssh_class')], [emailEl, reg.email], [phoneEl, reg.phone]]
      .forEach(function (p) { if (p[0] && p[1] && !p[0].value) { p[0].value = p[1]; fire(p[0]); } });
    if (consentEl && !consentEl.checked && get('ssh_consent') === '1') { consentEl.checked = true; fire(consentEl); }

    // remember for next time (this browser only)
    if (nameEl) nameEl.addEventListener('change', function () { set('ssh_name', nameEl.value.trim()); });
    if (classEl) classEl.addEventListener('change', function () { set('ssh_class', classEl.value.trim()); });
    if (consentEl) consentEl.addEventListener('change', function () { set('ssh_consent', consentEl.checked ? '1' : ''); });

    // slim "ready" bar
    var ready = function () {
      return nameEl && nameEl.value.trim() && classEl && classEl.value.trim() &&
        ((emailEl && emailEl.value.trim()) || (phoneEl && phoneEl.value.trim())) && consentEl && consentEl.checked;
    };

    var bar = document.createElement('div');
    bar.className = 'ssh-ready'; bar.setAttribute('role', 'status');
    det.parentNode.insertBefore(bar, det);
    var paint = function () {
      bar.innerHTML = '<span style="font-size:1.4rem">✅</span><span class="who"><b>Ready</b> · <b dir="rtl">جاهز</b> — <bdi>' +
        esc(nameEl.value) + '</bdi>' + ((classEl.closest('label') || classEl).style.display === 'none' ? '' : ' · Class <bdi>' + esc(classEl.value) + '</bdi>') + '<br><small>Your details are saved; your result goes to your teacher when you press Check.</small><br><small dir="rtl" style="display:block;text-align:right">بياناتك محفوظة، وتُرسَل نتيجتك إلى معلمك عند الضغط على «صحّح».</small></span>' +
        '<button type="button" class="edit">Edit details · تعديل</button>';
      bar.querySelector('.edit').onclick = function () { det.hidden = false; bar.hidden = true; (nameEl || det).focus(); };
    };
    var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    if (ready()) { paint(); det.hidden = true; } else { bar.hidden = true; }
    // if the page shows an error in the details box, open it again
    var err = $('sshErr');
    if (err && window.MutationObserver) new MutationObserver(function () {
      if (err.textContent.trim()) { det.hidden = false; bar.hidden = true; }
    }).observe(err, { childList: true, characterData: true, subtree: true });

    // jump straight to the test
    var go = function (el) {
      if (!el) return;
      var y = el.getBoundingClientRect().top + window.pageYOffset - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    };
    var picker = $('picker');
    var firstQ = function () {
      var all = document.querySelectorAll('.parthead, .parts');
      for (var i = 0; i < all.length; i++) if (all[i].offsetParent) return all[i];
      return null;
    };
    if (!location.hash && window.pageYOffset < 40) {
      var chosen = /[?&]t=/.test(location.search);
      setTimeout(function () { go(chosen || !picker ? (firstQ() || (bar.hidden ? det : bar)) : (picker.closest('section,.card') || picker)); }, 350);
    }
    if (picker) picker.addEventListener('click', function (e) {
      if (e.target.closest('button,a')) setTimeout(function () { go(bar.hidden ? det : bar); }, 120);
    });
  }

  // run after the one-time welcome screen (first visit) or straight away (returning visitor)
  var prev = window.SSH_AFTER_GATE;
  window.SSH_AFTER_GATE = function () { if (typeof prev === 'function') prev(); init(); };
  var gateOpen = function () { var g = $('gate'); return g && !g.hidden; };
  var start = function () { try { simplify(); } catch (e) {} if (!gateOpen()) init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 50); });
  else setTimeout(start, 50);
})();
