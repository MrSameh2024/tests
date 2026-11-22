/* Smart Students Hub · answer autosave (draft) for test pages
   Saves the student's unfinished answers on THIS device (localStorage) while they work,
   so a refresh, a closed tab or a dead battery does not lose them.
   - Only answer fields are saved (text boxes, radio choices, the writing box). Registration
     fields (ids starting with "ssh") are never saved here.
   - Saving stops when the answers are checked (fields become disabled).
   - The draft is deleted when the result is sent to the teacher, or after 7 days.
   Nothing is sent anywhere by this file. */
(function () {
  'use strict';
  var form = document.getElementById('test');
  if (!form) return;
  var qs = new URLSearchParams(location.search);
  var KEY = 'ssh_draft_' + (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') + '_t' + (parseInt(qs.get('t'), 10) || 1);
  var MAX_AGE = 7 * 24 * 3600 * 1000;
  function fields() {
    return Array.prototype.slice.call(document.querySelectorAll('#test input, #test textarea, #essay')).filter(function (el) {
      var id = el.id || '', nm = el.name || '';
      return !/^ssh/i.test(id) && !/^ssh/i.test(nm) && el.type !== 'hidden' && el.type !== 'button' && el.type !== 'submit';
    });
  }
  function read() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && Date.now() - d.t < MAX_AGE) return d; localStorage.removeItem(KEY); } catch (e) {} return null; }
  function save() {
    var f = fields();
    if (!f.length || f.some(function (el) { return el.disabled; })) return;   // checked / locked: stop saving
    var v = {}, any = false;
    f.forEach(function (el) {
      if (el.type === 'radio') { if (el.checked) { v['r:' + el.name] = el.value; any = true; } }
      else if (el.id && el.value.trim()) { v['v:' + el.id] = el.value; any = true; }
    });
    try { if (any) localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: v })); else localStorage.removeItem(KEY); } catch (e) {}
    status(any ? '✓ Your answers are saved on this device · إجاباتك محفوظة على هذا الجهاز' : '');
  }
  var box;
  function status(msg) {
    if (!box) { box = document.createElement('div'); box.id = 'sshDraftStatus'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
      box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:50;background:#eef6ee;color:#1d5c2a;border:1px solid #b9dcbf;border-radius:8px;padding:4px 10px;font:12px system-ui,sans-serif;max-width:92vw;opacity:.92';
      document.body.appendChild(box); }
    box.textContent = msg; box.style.display = msg ? '' : 'none';
  }
  function restore() {
    var d = read(); if (!d) return 0; var n = 0;
    fields().forEach(function (el) {
      if (el.type === 'radio') { if (d.v['r:' + el.name] === el.value && !el.checked) { el.checked = true; n++; } }
      else if (el.id && d.v['v:' + el.id] != null && !el.value) { el.value = d.v['v:' + el.id]; el.dispatchEvent(new Event('input', { bubbles: true })); n++; }
    });
    if (n) status('↺ Your saved answers were restored · تمت استعادة إجاباتك المحفوظة');
    return n;
  }
  var timer = null;
  function later() { clearTimeout(timer); timer = setTimeout(save, 400); }
  document.addEventListener('input', function (e) { if (e.target.closest && (e.target.closest('#test') || e.target.id === 'essay')) later(); });
  document.addEventListener('change', function (e) { if (e.target.closest && (e.target.closest('#test') || e.target.id === 'essay')) later(); });
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'sendBtn') { try { localStorage.removeItem(KEY); } catch (x) {} status(''); }
  }, true);
  window.addEventListener('pagehide', save);
  restore();
  window.SSH_DRAFT = { key: KEY, save: save, restore: restore, clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} } };
})();
