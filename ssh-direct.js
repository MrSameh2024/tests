/* Smart Students Hub – open a resource straight at its content.
   After the welcome screen (or straight away for a returning visitor) the page scrolls
   past the big banner to the first card of the activity, so Start → the work itself.
   <script src="ssh-direct.js" data-go="act"> jumps to the card that holds the first
   question/control instead (used on tests that open with a long introduction).
   It never scrolls if the visitor came with a #link or has already scrolled. */
(function () {
  var me = document.currentScript, mode = (me && me.getAttribute('data-go')) || 'card';
  var done = false;
  var visible = function (e) { return e && e.offsetParent !== null && e.getBoundingClientRect().height > 30; };
  function target() {
    if (mode === 'act') {
      var ctl = [].slice.call(document.querySelectorAll('select,input,textarea,button')).filter(function (e) {
        return visible(e) && !e.closest('#gate,header,nav,.ssh-bar,.topbar') && e.type !== 'hidden';
      })[0];
      if (ctl) return ctl.closest('section,.card,.c,fieldset') || ctl;
    }
    var sels = ['.wrap > *', '.w > *', 'main > section', 'main > *'];
    for (var i = 0; i < sels.length; i++) {
      var list = [].slice.call(document.querySelectorAll(sels[i])).filter(visible);
      if (list.length) return list[0];
    }
    return null;
  }
  function go() {
    if (done) return; done = true;
    if (location.hash || window.pageYOffset > 40) return;
    var t = target(); if (!t) return;
    var y = t.getBoundingClientRect().top + window.pageYOffset - 10;
    if (y < 140) return;                       // already at the top – nothing to skip
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  var prev = window.SSH_AFTER_GATE;
  window.SSH_AFTER_GATE = function () { if (typeof prev === 'function') prev(); setTimeout(go, 300); };
  var gateOpen = function () { var g = document.getElementById('gate'); return g && !g.hidden; };
  var start = function () { if (!gateOpen()) setTimeout(go, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
