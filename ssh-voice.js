/* Smart Students Hub – shared voice for all read-aloud audio.
   1) If a pre-recorded natural male voice file exists for the text (audio/manifest.json),
      it is played instead of the device's robotic voice.
   2) Otherwise the best MALE English device voice is used, at normal speed and pitch.
   Deliberate "Slow" practice buttons (rate 0.55 or lower) still play slower.
   Multi-speaker audio keeps a different voice per speaker. */
(function () {
  if (!window.SpeechSynthesis || !('speechSynthesis' in window)) return;
  var synth = window.speechSynthesis;
  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : '';

  /* ---------- pre-recorded human-like audio ---------- */
  var manifest = null;
  var norm = function (t) { return String(t || '').replace(/\s+/g, ' ').trim(); };
  try {
    fetch(base + 'audio/manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { manifest = m; })
      .catch(function () {});
  } catch (e) {}

  var current = null;      // { audio, u }
  function stopCurrent() {
    if (current) { try { current.audio.pause(); current.audio.src = ''; } catch (e) {} current = null; }
  }

  /* ---------- device voice fallback ---------- */
  var PREFERRED = [
    /Microsoft (Andrew|Brian|Guy|Christopher|Eric|Roger|Steffan|Ryan|Thomas|William|Liam|Connor|Mitchell|Neil|Prabhat) .*Natural/i,
    /Google UK English Male/i,
    /^(Daniel|Arthur|Aaron|Evan|Nathan|Tom|Oliver|Alex|Rishi|Gordon|Lee|Reed)\b(?!.*(Female|Woman))/i,
    /Microsoft (Ryan|Guy|Andrew|Brian|Christopher|George|David|Mark|James|Richard|Sean|Ravi)\b/i,
    /en[-_](us|gb|au)[-_]x[-_].*(iom|rjs|gbd|gbg|iol|tpd|tpc|aud|auc|sfg)/i,
    /\b(male|man)\b/i
  ];
  var FEMALE = /(female|woman|Zira|Aria|Jenny|Sonia|Libby|Hazel|Susan|Samantha|Victoria|Karen|Moira|Tessa|Fiona|Serena|Kate|Emma|Ava|Allison|Michelle|Natasha|Clara|Emily|Ana\b|Google US English$)/i;
  var males = [];
  function load() {
    var all = synth.getVoices().filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
    var seen = {}, list = [];
    PREFERRED.forEach(function (re) {
      all.forEach(function (v) {
        var k = v.voiceURI || v.name;
        if (!seen[k] && re.test(v.name + ' ' + v.voiceURI) && !FEMALE.test(v.name)) { seen[k] = 1; list.push(v); }
      });
    });
    males = list;
  }
  load();
  try { synth.addEventListener('voiceschanged', load); } catch (e) {}
  var roleMap = {}, nextRole = 0;
  function maleFor(orig) {
    if (!males.length) load();
    if (!males.length) return null;
    var key = orig ? (orig.voiceURI || orig.name) : '_default';
    if (!(key in roleMap)) { roleMap[key] = nextRole % males.length; nextRole++; }
    return males[roleMap[key]];
  }

  var P = window.SpeechSynthesis.prototype;
  var originalSpeak = P.speak, originalCancel = P.cancel, originalPause = P.pause, originalResume = P.resume;
  var slow = function (u) { return u.rate > 0 && u.rate <= 0.55; };

  function fire(u, name) { try { if (typeof u['on' + name] === 'function') u['on' + name]({ type: name, utterance: u }); } catch (e) {} }

  function deviceSpeak(self, u) {
    try {
      var v = maleFor(u.voice);
      if (v) { u.voice = v; u.lang = v.lang; }
      if (!slow(u)) u.rate = 1;
      u.pitch = 1;
    } catch (e) {}
    return originalSpeak.call(self, u);
  }

  P.speak = function (u) {
    var self = this;
    var file = manifest && manifest[norm(u && u.text)];
    if (!file) return deviceSpeak(self, u);
    stopCurrent();
    var a = new Audio(base + file);
    a.preload = 'auto';
    if (slow(u)) { a.playbackRate = 0.8; try { a.preservesPitch = true; } catch (e) {} }
    current = { audio: a, u: u };
    var started = false, done = false;
    a.addEventListener('playing', function () { if (!started) { started = true; fire(u, 'start'); } });
    a.addEventListener('ended', function () { if (done) return; done = true; if (current && current.audio === a) current = null; fire(u, 'end'); });
    a.addEventListener('error', function () {
      if (done) return; done = true; if (current && current.audio === a) current = null;
      deviceSpeak(self, u);   // fall back to device voice
    });
    var p = a.play();
    if (p && p.catch) p.catch(function () { if (!done) { done = true; current = null; deviceSpeak(self, u); } });
  };
  P.cancel = function () { stopCurrent(); return originalCancel.call(this); };
  P.pause = function () { if (current) { try { current.audio.pause(); } catch (e) {} } return originalPause.call(this); };
  P.resume = function () { if (current) { try { current.audio.play(); } catch (e) {} } return originalResume.call(this); };
  try {
    var desc = Object.getOwnPropertyDescriptor(P, 'speaking');
    if (desc && desc.get) {
      Object.defineProperty(P, 'speaking', { configurable: true, get: function () { return !!current || desc.get.call(this); } });
    }
  } catch (e) {}
})();
