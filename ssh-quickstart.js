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

  function init() {
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
    var css = document.createElement('style');
    css.textContent = '.ssh-ready{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:linear-gradient(90deg,#e8f6ee,#eef3fb);border:2px solid #1a7f4b;border-radius:14px;padding:10px 14px;margin:12px 0;font-size:.95rem;color:#14244a}' +
      '.ssh-ready b{color:#1a6b3c}.ssh-ready .who{flex:1;min-width:200px}.ssh-ready button{background:#fff;border:1.5px solid #14244a;color:#14244a;border-radius:10px;padding:6px 12px;font-weight:700;cursor:pointer}' +
      '.ssh-ready .go{background:#1e6fd9;border-color:#1e6fd9;color:#fff}';
    document.head.appendChild(css);
    var bar = document.createElement('div');
    bar.className = 'ssh-ready'; bar.setAttribute('role', 'status');
    det.parentNode.insertBefore(bar, det);
    var paint = function () {
      bar.innerHTML = '<span style="font-size:1.4rem">✅</span><span class="who"><b>Ready · جاهز</b> — ' +
        esc(nameEl.value) + ' · Class ' + esc(classEl.value) + '<br><small>Your details are saved; your result goes to your teacher when you press Check.</small><br><small dir="rtl" style="display:block;text-align:right">بياناتك محفوظة، وتُرسَل نتيجتك إلى معلمك عند الضغط على «صحّح».</small></span>' +
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
      setTimeout(function () { go(picker || (bar.hidden ? det : bar)); }, 350);
    }
    if (picker) picker.addEventListener('click', function (e) {
      if (e.target.closest('button,a')) setTimeout(function () { go(bar.hidden ? det : bar); }, 120);
    });
  }

  // run after the one-time welcome screen (first visit) or straight away (returning visitor)
  var prev = window.SSH_AFTER_GATE;
  window.SSH_AFTER_GATE = function () { if (typeof prev === 'function') prev(); init(); };
  var gateOpen = function () { var g = $('gate'); return g && !g.hidden; };
  var start = function () { if (!gateOpen()) init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 50); });
  else setTimeout(start, 50);
})();
