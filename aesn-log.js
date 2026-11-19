/* AESN activity results → teacher (private Google Sheet, "Submissions" tab).
   Uses the same Apps Script endpoint and payload as aesn-tests.html (type:'submission').
   Identity comes from the confirmed AESN session; nothing is sent if the
   student has not registered, and nothing is sent outside the published site (review copies). */
(function(){
  var EP='https://script.google.com/macros/s/AKfycbwXKby0ftvHXqoNyYouxh4vStgiiCWyZ52CWmexbtyLoDfPSok7HcYDTa41PWIbVXoJ_A/exec';
  var LIVE=location.protocol==='https:'&&['mrsameh2024.github.io','smartstudentshub.com','www.smartstudentshub.com'].indexOf(location.hostname.toLowerCase())>=0&&!/[?&]mock=1/.test(location.search);
  function reg(){return window.AESN_ACCESS?.get() || {};}
  var last={};
  window.AESN_LOG={
    registered:function(){var r=reg();return !!(r.email||r.phone);},
    /* o = {grade, activity, score, max, breakdown, essay, answers}
       returns a Promise of 'sent' | 'noreg' | 'review' | 'dup' | 'error' */
    send:function(o){
      var r=reg();
      if(!(r.email||r.phone))return Promise.resolve('noreg');
      var g=String(o.grade||r.grade||r.cls||'').match(/10|11|12/);g=g?g[0]:'';
      var test='AESN Activity · G'+g+' · '+o.activity;
      var sig=test+'|'+o.score+'|'+o.max+'|'+(o.essay||'').length;
      if(last[sig]&&Date.now()-last[sig]<60000)return Promise.resolve('dup');
      last[sig]=Date.now();
      var max=+o.max||0,score=+o.score||0;
      var body={type:'submission',page:location.pathname.split('/').pop()||'',test:test,
        name:r.name||((r.role||'Student')+' (name not collected)'),cls:'Grade '+g+' AESN',
        email:r.email||'',phone:r.phone||'',consent:true,score:score,max:max,
        percent:max?Math.round(100*score/max):0,breakdown:o.breakdown||'',
        topic:'AESN activity – progress record (no marking needed)',essay:o.essay||'',
        answers:o.answers||'',website:''};
      window.__aesnLastPayload=body;
      if(!LIVE)return Promise.resolve('review');
      var ctl=window.AbortController?new AbortController():null,t=setTimeout(function(){ctl&&ctl.abort();},20000);
      return fetch(EP,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:ctl?ctl.signal:undefined})
        .then(function(x){return x.json();}).then(function(d){clearTimeout(t);return d&&d.ok?'sent':'error';})
        .catch(function(){clearTimeout(t);delete last[sig];return 'error';});
    },
    /* Bilingual status text for a result code */
    text:function(code){
      return ({sent:'✓ Your result was sent to your teacher. · ✓ وصلت نتيجتك إلى معلمك.',
        noreg:'Register on your grade page so your teacher can see your results. · سجّل في صفحة صفك ليرى معلمك نتائجك.',
        review:'Review copy: nothing was sent. · نسخة مراجعة: لم يُرسل شيء.',
        dup:'Already sent. · أُرسلت من قبل.',
        error:'Could not send now. Your result is saved here; try again later. · تعذّر الإرسال الآن، حاول لاحقًا.'})[code]||'';
    },
    status:function(el,code){if(!el)return;el.textContent=this.text(code);el.className='aesn-st '+(code==='sent'||code==='dup'?'ok':code==='error'?'no':'');}
  };
  var css=document.createElement('style');
  css.textContent='.aesn-st{font-weight:700;font-size:.95em;margin:.6em auto 0;padding:.45em .8em;border-radius:10px;background:#eef4fc;color:#14244a;max-width:640px;text-align:center}.aesn-st:empty{display:none}.aesn-st.ok{background:#e6f6ec;color:#14532d}.aesn-st.no{background:#fdecec;color:#7f1d1d}';
  document.head.appendChild(css);
})();
