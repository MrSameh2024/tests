/* Smart Students Hub – shared voice settings for all read-aloud audio.
   Picks the most natural MALE English voice available on the device,
   at normal speed (rate 1) and normal pitch (pitch 1).
   Deliberate "slow" practice buttons (rate below 0.7) are kept as chosen.
   Multi-speaker audio gets a different male voice per speaker when the device has more than one. */
(function () {
  if (!('speechSynthesis' in window) || !window.SpeechSynthesis) return;

  // Best first: neural/natural male voices, then good standard male voices.
  var PREFERRED = [
    /Microsoft (Andrew|Brian|Guy|Christopher|Eric|Roger|Steffan|Ryan|Thomas|William|Liam|Connor|Mitchell|Neil|Prabhat) .*Natural/i,
    /Google UK English Male/i,
    /^(Daniel|Arthur|Aaron|Evan|Nathan|Tom|Oliver|Alex|Rishi|Gordon|Lee|Reed)\b(?!.*(Female|Woman))/i,
    /Microsoft (Ryan|Guy|Andrew|Brian|Christopher|George|David|Mark|James|Richard|Sean|Ravi)\b/i,
    /en[-_](us|gb|au)[-_]x[-_].*(iom|rjs|gbd|gbg|iol|tpd|tpc|aud|auc|sfg)/i,
    /\b(male|man)\b/i
  ];
  var FEMALE = /(female|woman|Zira|Aria|Jenny|Sonia|Libby|Hazel|Susan|Samantha|Victoria|Karen|Moira|Tessa|Fiona|Serena|Kate|Emma|Ava|Allison|Michelle|Natasha|Clara|Emily|Ana\b|Google US English$|Google UK English Female)/i;

  var males = [];
  function load() {
    var all = window.speechSynthesis.getVoices().filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
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
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', load);
  }

  // Keep different speakers distinct: map each original voice to its own male voice.
  var roleMap = {}, nextRole = 0;
  function maleFor(orig) {
    if (!males.length) load();
    if (!males.length) return null;
    var key = orig ? (orig.voiceURI || orig.name) : '_default';
    if (!(key in roleMap)) { roleMap[key] = nextRole % males.length; nextRole++; }
    return males[roleMap[key]];
  }

  var originalSpeak = window.SpeechSynthesis.prototype.speak;
  window.SpeechSynthesis.prototype.speak = function (u) {
    try {
      var v = maleFor(u.voice);
      if (v) { u.voice = v; u.lang = v.lang; }
      if (!(u.rate > 0 && u.rate < 0.7)) u.rate = 1;   // normal speed (keep explicit slow practice)
      u.pitch = 1;                                    // natural pitch, not deep
    } catch (e) {}
    return originalSpeak.call(this, u);
  };
})();
