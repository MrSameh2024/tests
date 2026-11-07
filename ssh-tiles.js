/* Smart Students Hub – compact resource tiles.
   Adds a small "ℹ️ Details · التفاصيل" button to every tile so the long description
   stays hidden until the visitor asks for it (nothing is removed from the page).
   <script src="ssh-tiles.js" data-card=".row" data-after="h4"></script>
   The tile gets the class "open" while its details are shown; each page's CSS decides
   what is hidden. Works with tiles that are drawn later by the page's own script. */
(function () {
  var me = document.currentScript;
  var CARD = (me && me.getAttribute('data-card')) || '.tile';
  var AFTER = (me && me.getAttribute('data-after')) || 'h2,h3,h4';
  var css = document.createElement('style');
  css.textContent = '.ssh-more{align-self:flex-start;justify-self:start;grid-column:1/-1;background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.55);border-radius:14px;padding:2px 10px;font:700 .72rem system-ui,-apple-system,"Segoe UI",Arial,sans-serif;cursor:pointer;width:max-content}' +
    '.ssh-more:hover{background:#fff;color:#14244a}@media print{.ssh-more{display:none}}';
  document.head.appendChild(css);
  function add() {
    [].forEach.call(document.querySelectorAll(CARD), function (c) {
      if (c.querySelector(':scope > .ssh-more, :scope .ssh-more')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ssh-more'; b.setAttribute('aria-expanded', 'false');
      b.textContent = 'ℹ️ Details · التفاصيل';
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var o = c.classList.toggle('open');
        b.setAttribute('aria-expanded', o);
        b.textContent = o ? '✕ Hide · إخفاء' : 'ℹ️ Details · التفاصيل';
      });
      var list = c.querySelectorAll(AFTER), at = list[list.length - 1] || null;
      if (c.tagName === 'A') { b.setAttribute('role', 'button'); }
      if (at) at.after(b); else c.prepend(b);
    });
  }
  function start() {
    add();
    if (window.MutationObserver) new MutationObserver(function () { add(); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
