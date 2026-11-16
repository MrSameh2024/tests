(function(){
'use strict';
var EP='https://script.google.com/macros/s/AKfycbwXKby0ftvHXqoNyYouxh4vStgiiCWyZ52CWmexbtyLoDfPSok7HcYDTa41PWIbVXoJ_A/exec';
var KEY='ssh_g11_writing_v1', PAGE='g11-writing.html';
var $=function(id){return document.getElementById(id)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var words=function(t){return (String(t||'').match(/[A-Za-z0-9’'’-]+/g)||[]).length};
var shuffle=function(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a};
var norm=function(s){return String(s||'').toLowerCase().replace(/[‘’]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim()};
var STN=[null,
 ['Words','المفردات','📚'],['Verbs','الأفعال','⚙️'],['Linkers','أدوات الربط','🔗'],['Reference words','الكلمات المرجعية','👉'],['Order','الترتيب','🔢'],
 ['Opening','البداية','✏️'],['Main section','صلب النص','🧱'],['Final section','الجزء الأخير','🏁'],['Flexible gaps','الفراغات المرنة','🧩'],['Independent writing','الكتابة المستقلة','🚀']];

/* ---------- state ---------- */
var S={courses:{}};
try{S=Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function cs(id){if(!S.courses[id])S.courses[id]={st:{}};return S.courses[id]}
function reg(){var r={};try{r=JSON.parse(localStorage.getItem('ssh_reg')||'{}')||{}}catch(e){}return r}
function byId(id){for(var i=0;i<COURSES.length;i++)if(COURSES[i].id===id)return COURSES[i];return null}
function doneCount(id){var c=cs(id),n=0;for(var k=1;k<=10;k++)if(c.st[k]&&c.st[k].done)n++;return n}

/* ---------- audio ---------- */
var speakQ=null;
function stopSpeak(){speakQ=null;try{speechSynthesis.cancel()}catch(e){}}
function speak(text,slow){stopSpeak();if(!('speechSynthesis' in window))return;var u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=slow?0.55:1;speechSynthesis.speak(u)}
function speakParts(parts,slow,gapSec,onDone){stopSpeak();if(!('speechSynthesis' in window))return;var q={i:0};speakQ=q;
 (function next(){if(speakQ!==q)return;if(q.i>=parts.length){if(onDone)onDone();return}var u=new SpeechSynthesisUtterance(parts[q.i++]);u.lang='en-GB';u.rate=slow?0.55:1;
  u.onend=function(){if(speakQ!==q)return;setTimeout(next,(gapSec||0)*1000)};speechSynthesis.speak(u)})()}
window.g11Speak=function(t){speak(t)};
function sentences(t){return (String(t).match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)||[t]).map(function(s){return s.trim()}).filter(Boolean)}

/* ---------- router ---------- */
var P=new URLSearchParams(location.search), COURSE=byId(P.get('course')), VIEW=P.get('view');
var app=$('app');

/* ---------- home ---------- */
function renderHome(){
 document.title='Grade 11 Writing Courses · Modules 3–5 | Smart Students Hub';
 var h='<header class="hero" style="--c:#14244a"><div class="kick">SMART STUDENTS HUB · GRADE 11 WRITING</div><h1>Grade 11 Writing — Modules 3, 4 and 5</h1><p class="ar" dir="rtl">كتابة الصف الحادي عشر — الوحدات ٣ و٤ و٥</p><p>Six independent writing courses, each with ten bilingual stations. Submit each station and continue, whatever your score.</p><p class="ar" dir="rtl">ست دورات مستقلة للكتابة، لكل منها عشر محطات باللغتين. أرسل الإجابة وتابع مهما كانت الدرجة.</p></header><main class="wrap"><div class="tiles">';
 COURSES.forEach(function(c){var d=doneCount(c.id);h+='<a class="tile" style="--c:'+c.color+'" href="?course='+c.id+'"><small>Module '+c.module+' · الوحدة '+'٠١٢٣٤٥٦٧٨٩'[c.module]+'</small><span class="em">'+c.emoji+'</span><b>'+esc(c.title)+'</b><b dir="rtl">'+esc(c.ar)+'</b><span class="mini"><i style="width:'+(d*10)+'%"></i></span><span class="st">'+d+' / 10 stations</span><span class="go">Open · افتح →</span></a>'});
 h+='<a class="tile" style="--c:#14244a" href="?view=journey"><small>Report · تقرير</small><span class="em">🖨️</span><b>My journey / Print PDF</b><b dir="rtl">رحلتي / طباعة PDF</b><span class="go">Open · افتح →</span></a></div>'+aboutBox()+'</main>';
 app.innerHTML=h;
}
function aboutBox(){return '<section class="card small"><h3>About these courses · عن الدورات</h3><p>Original teaching materials by Smart Students Hub, aligned to Portal to English, Grade 11 Student Book (Semester 1, Modules 3–5). They are not official examination papers; check the current examination specification separately. Stations 1–5 are marked automatically; stations 6–10 are reviewed by your teacher. Your progress is saved on this device; your final writing is sent to your teacher when you submit Station 10.</p><p dir="rtl" class="ar">مواد تعليمية أصلية من إعداد Smart Students Hub مرتبطة بكتاب الطالب Portal to English للصف الحادي عشر (الفصل الأول، الوحدات ٣–٥)، وليست أوراق امتحان رسمية. المحطات ١–٥ تُصحَّح تلقائيًا، والمحطات ٦–١٠ يراجعها المعلم. يُحفظ تقدمك على هذا الجهاز، وتُرسل كتابتك النهائية إلى معلمك عند إرسال المحطة العاشرة.</p></section>'}

/* ---------- course ---------- */
var C, cur=1;
function renderCourse(c){
 C=c;document.title='Grade 11 Writing · '+c.title+' | Smart Students Hub';
 document.documentElement.style.setProperty('--c',c.color);
 var h='<header class="hero" style="--c:'+c.color+'"><div class="kick">GRADE 11 WRITING · MODULE '+c.module+' · '+esc(c.sb)+'</div><h1>'+c.emoji+' '+esc(c.title)+'</h1><p class="ar big" dir="rtl">'+esc(c.ar)+'</p><nav class="crumbs"><a href="?">← All courses · كل الدورات</a><a href="?view=journey">🖨️ My journey · رحلتي</a></nav></header><main class="wrap">';
 h+='<section class="card"><h2>Your task · مهمتك</h2><p>'+esc(c.goal)+'</p><p class="ar" dir="rtl">'+esc(c.goalAr)+'</p><p class="small"><b>Style:</b> '+esc(c.style)+'</p><p class="small ar" dir="rtl">'+esc(c.styleAr)+'</p>'+(c.note?'<p class="note">'+esc(c.note)+'</p><p class="note ar" dir="rtl">'+esc(c.noteAr)+'</p>':'')+'<div class="prog"><i id="bar"></i></div><p id="ptext" class="small"></p></section>';
 h+='<details class="card" id="dv"><summary>📚 Word bank (10 words) · بنك الكلمات</summary>'+vocabHtml(c)+'</details>';
 if(c.retelling)h+='<details class="card"><summary>📖 Teaching retelling · إعادة سرد تعليمية</summary><p class="note">'+esc(c.note)+'</p>'+c.retelling.map(function(r){return '<div class="seg"><h4>'+esc(r[0])+' · <span dir="rtl">'+esc(r[1])+'</span> <button class="spk" data-say="'+esc(r[2])+'">🔊</button></h4><p>'+esc(r[2])+'</p><p class="ar" dir="rtl">'+esc(r[3])+'</p></div>'}).join('')+'</details>';
 h+='<details class="card"><summary>⭐ Model with Arabic meaning · النموذج ومعناه</summary><h3>'+esc(c.modelTitle)+'</h3>'+modelHtml(c)+'</details>';
 h+='<details class="card"><summary>🧩 Template · القالب</summary><ol class="tpl">'+c.template.map(function(t){return '<li><b>'+esc(t[0])+'</b> · <span dir="rtl">'+esc(t[1])+'</span><br><code>'+esc(t[2])+'</code></li>'}).join('')+'</ol></details>';
 h+='<details class="card" id="dict"><summary>🎧 Dictation practice · تدريب الإملاء</summary>'+dictHtml()+'</details>';
 h+='<section class="card"><h2>Ten stations · المحطات العشر</h2><div class="snav" id="snav"></div><div id="station"></div></section>'+aboutBox()+'</main>';
 app.innerHTML=h;
 app.addEventListener('click',function(e){var b=e.target.closest('[data-say]');if(b){e.preventDefault();speak(b.getAttribute('data-say'))}});
 initDict(c);
 var hs=+((location.hash.match(/station-(\d+)/)||[])[1]);cur=(hs>=1&&hs<=10)?hs:firstOpen();
 showStation(cur,true);
}
function firstOpen(){for(var k=1;k<=10;k++)if(!(cs(C.id).st[k]&&cs(C.id).st[k].done))return k;return 10}
function vocabHtml(c){return '<div class="vgrid">'+c.vocab.map(function(v,i){return '<div class="voc"><b>'+(i+1)+'. '+esc(v[0])+'</b> <button class="spk" data-say="'+esc(v[0])+'" aria-label="Listen">🔊</button><div dir="rtl" class="ar">'+esc(v[1])+' <span class="pr">('+esc(v[2])+')</span></div><div class="ex">'+esc(v[3])+' <button class="spk" data-say="'+esc(v[3])+'">🔊</button></div></div>'}).join('')+'</div><p class="small">The Arabic pronunciation is approximate. · النطق بالعربية تقريبي.</p>'}
function modelHtml(c){
 if(c.oneParagraph)return '<div class="model"><p>'+c.model.map(function(m){return esc(m[0])}).join(' ')+' <button class="spk" data-say="'+esc(c.model.map(function(m){return m[0]}).join(' '))+'">🔊</button></p><p class="ar" dir="rtl">'+c.model.map(function(m){return esc(m[1])}).join(' ')+'</p><p class="small">'+words(c.model.map(function(m){return m[0]}).join(' '))+' words · one paragraph</p></div>';
 return '<div class="model">'+c.model.map(function(m){return '<p>'+esc(m[0])+' <button class="spk" data-say="'+esc(m[0])+'">🔊</button></p><p class="ar" dir="rtl">'+esc(m[1])+'</p>'}).join('')+'<p class="small">'+words(c.model.map(function(m){return m[0]}).join(' '))+' words</p></div>'}

/* ---------- stations ---------- */
function navHtml(){var c=cs(C.id),h='';for(var k=1;k<=10;k++){var s=c.st[k],cls=k===cur?'on':'',mark=s&&s.done?(k<=5?' ✓':' ⏳'):'';h+='<button class="'+cls+(s&&s.done?' done':'')+'" data-go="'+k+'" title="'+STN[k][0]+'">'+k+mark+'</button>'}return h}
function renderProgress(){var d=doneCount(C.id);$('bar').style.width=(d*10)+'%';$('ptext').innerHTML='<b>Progress · <bdi dir="rtl">التقدم</bdi>:</b> '+d+' / 10 stations · ✓ auto-marked · ⏳ waiting for teacher review';$('snav').innerHTML=navHtml()}
function showStation(n,noScroll){cur=n;try{history.replaceState(null,'','#station-'+n)}catch(e){}renderProgress();
 var t=STN[n],h='<div class="shead"><span class="snum">'+t[2]+' Station '+n+'</span><h3>'+t[0]+' · <span dir="rtl">'+t[1]+'</span></h3><p class="small">'+(n<=5?'Automatically marked · تصحيح تلقائي':'Teacher review · مراجعة المعلم')+'</p></div><div id="sbody"></div><div class="res" id="res"></div><div class="row"><button class="btn sec" id="prev"'+(n===1?' disabled':'')+'>← Previous</button><button class="btn" id="submit">Submit station · أرسل المحطة</button><button class="btn sec" id="next"'+(n===10?' disabled':'')+'>Next →</button></div>';
 $('station').innerHTML=h;
 $('snav').onclick=function(e){var b=e.target.closest('[data-go]');if(b)showStation(+b.getAttribute('data-go'))};
 $('prev').onclick=function(){if(cur>1)showStation(cur-1)};$('next').onclick=function(){if(cur<10)showStation(cur+1)};
 if(n<=5)buildAuto(n);else buildWrite(n);
 var prevS=cs(C.id).st[n];if(prevS&&prevS.done)showPrev(n,prevS);
 if(!noScroll)$('station').scrollIntoView({behavior:'smooth',block:'start'});
}
function showPrev(n,s){var r=$('res');r.style.display='block';r.className='res info';r.innerHTML=n<=5?'Last result · آخر نتيجة: <b>'+s.score+'/10</b> · attempts · المحاولات: '+s.attempts+'. You can try again. · يمكنك المحاولة مرة أخرى.':'Submitted '+fmt(s.at)+' · <b>pending teacher review</b> · بانتظار مراجعة المعلم. You can edit and submit again. · يمكنك التعديل والإرسال مجددًا.'}
function fmt(iso){try{return new Date(iso).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return iso||''}}

var ITEMS=[];
function buildAuto(n){
 var b=$('sbody'),h='';ITEMS=[];
 if(n===1){h='<p>Choose the Arabic meaning of each word. Press 🔊 to listen. · اختر المعنى العربي لكل كلمة.</p>';
  var pick=shuffle(C.vocab).slice(0,5);pick.forEach(function(v,i){var others=shuffle(C.vocab.filter(function(x){return x!==v})).slice(0,3).map(function(x){return x[1]});
   ITEMS.push({a:v[1],q:v[0],ar:v[3]});h+=qHtml(i,'<b>'+esc(v[0])+'</b> <button class="spk" data-say="'+esc(v[0])+'">🔊</button>',shuffle([v[1]].concat(others)),true)});}
 else if(n<=4){var key=['','','s2','s3','s4'][n];h='<p>'+['','','Choose the correct verb form. · اختر صيغة الفعل الصحيحة.','Choose the best linker. · اختر أداة الربط المناسبة.','Choose the word that refers back correctly. · اختر الكلمة المرجعية الصحيحة.'][n]+'</p>';
  C[key].forEach(function(it,i){ITEMS.push({a:it[1][0],q:it[0],ar:it[2]});h+=qHtml(i,esc(it[0]).replace('___','<span class="gap">___</span>'),shuffle(it[1]),false)})}
 else{var idx=C.order,parts=idx.map(function(i){return C.model[i][0]}),lab=shuffle(parts.map(function(p,i){return{p:p,i:i}}));
  h='<p>'+(C.orderLabel||'Put the parts of the model in the correct order.')+' · '+(C.orderLabel?'رتّب الأحداث الرئيسية ترتيبًا صحيحًا.':'رتّب أجزاء النموذج ترتيبًا صحيحًا.')+' Write 1 for the first part. · اكتب ١ للجزء الأول.</p>';
  lab.forEach(function(o,k){ITEMS.push({a:String(o.i+1),q:o.p});h+='<div class="q" data-i="'+k+'"><select aria-label="Position"><option value="">#</option>'+parts.map(function(_,j){return '<option>'+(j+1)+'</option>'}).join('')+'</select><span class="otext">'+esc(o.p.length>150?o.p.slice(0,150)+'…':o.p)+'</span><div class="fb"></div></div>'})}
 b.innerHTML=h;$('submit').onclick=function(){markAuto(n)};
}
function qHtml(i,stem,opts,ar){return '<div class="q" data-i="'+i+'"><div class="stem">'+(i+1)+'. '+stem+'</div><div class="opts">'+opts.map(function(o){return '<label><input type="radio" name="q'+i+'" value="'+esc(o)+'"><span'+(ar?' dir="rtl"':'')+'>'+esc(o)+'</span></label>'}).join('')+'</div><div class="fb"></div></div>'}
function markAuto(n){
 var qs=document.querySelectorAll('#sbody .q'),ok=0,answered=0;
 qs.forEach(function(q,k){var it=ITEMS[k],v='';var r=q.querySelector('input:checked');if(r)v=r.value;var s=q.querySelector('select');if(s)v=s.value;if(v)answered++;
  var good=String(v).trim()===String(it.a).trim();if(good)ok++;q.classList.toggle('good',good);q.classList.toggle('bad',!good);
  var fb=q.querySelector('.fb');fb.innerHTML=(good?'✅ Correct · صحيح':'❌ Answer · الإجابة: <b>'+esc(n===5?'position '+it.a:it.a)+'</b>')+(it.ar&&n>1?'<div class="ar" dir="rtl">'+esc(it.ar)+'</div>':'')+(n>1&&n<5?' <button class="spk" data-say="'+esc(it.q.replace('___',it.a))+'">🔊</button>':'')});
 if(answered<qs.length&&!confirm('Some questions are not answered. Submit anyway? · بعض الأسئلة بلا إجابة. هل ترسل؟')){return}
 var score=Math.round(ok/qs.length*10),c=cs(C.id),p=c.st[n]||{attempts:0};
 c.st[n]={done:true,score:score,best:Math.max(score,p.best||0),attempts:(p.attempts||0)+1,at:new Date().toISOString(),ok:ok,of:qs.length};save();
 var r=$('res');r.style.display='block';r.className='res '+(score>=6?'good':'warn');
 r.innerHTML='<div class="score">'+score+' / 10</div>'+(score>=6?'Well done! Continue to the next station. · أحسنت! تابع إلى المحطة التالية.':'Check the answers above, then try again or continue. · راجع الإجابات ثم حاول مرة أخرى أو تابع.')+'<div class="row"><button class="btn sec" id="retry">↻ Try again · حاول مجددًا</button>'+(n<10?'<button class="btn" id="go2">Next station →</button>':'')+'</div>';
 $('retry').onclick=function(){showStation(n,true)};if($('go2'))$('go2').onclick=function(){showStation(n+1)};
 renderProgress();
}

function buildWrite(n){
 var t=C['s'+n],c=cs(C.id),s=c.st[n]||{},h='<p>'+esc(t.en)+'</p><p class="ar" dir="rtl">'+esc(t.ar)+'</p>';
 if(n>=6&&n<=8){var tp=C.template.map(function(x){return '<li><b>'+esc(x[0])+'</b>: <code>'+esc(x[2])+'</code></li>'}).join('');h+='<details class="help"><summary>💡 Sentence starters · بدايات جمل</summary><ul>'+tp+'</ul></details>'}
 if(n===10&&t.titleLabel)h+='<label class="lab" for="wt">'+esc(t.titleLabel)+'</label><input id="wt" maxlength="120" value="'+esc(s.title||'')+'">';
 var pre=s.text||(n===9?t.frame:'');
 h+='<label class="lab" for="wx">Your writing · كتابتك</label><textarea id="wx" rows="'+(n>=9?12:7)+'" spellcheck="true">'+esc(pre)+'</textarea><p class="wc" id="wc"></p>';
 var chk=t.check||(n===9?['Every ___ is replaced with my own words','Capital letters and full stops','Ideas are different from the model']:[]);
 h+='<div class="chk"><b>Self-check before you submit · تحقق قبل الإرسال</b>'+chk.map(function(x,i){return '<label><input type="checkbox" '+(s.chk&&s.chk[i]?'checked':'')+'> '+esc(x)+'</label>'}).join('')+'</div>';
 if(n===10){h+='<details class="help"'+(s.transfer?' open':'')+'><summary>➕ Extra transfer task (optional) · مهمة إضافية (اختيارية)</summary><p>'+esc(C.transfer.en)+'</p><p class="ar" dir="rtl">'+esc(C.transfer.ar)+'</p><textarea id="wtr" rows="7">'+esc(s.transfer||'')+'</textarea></details>';
  h+='<p class="small">When you submit Station 10, your final writing (and your stations 6–9) is sent to your teacher with the name you registered with. · عند إرسال المحطة العاشرة تُرسل كتابتك النهائية (والمحطات ٦–٩) إلى معلمك باسمك المسجل.</p>'}
 $('sbody').innerHTML=h;
 var wx=$('wx'),upd=function(){var w=words(wx.value),lim=n===10?C.limit:t,min=lim.min,max=lim.max;$('wc').innerHTML=w+' words · كلمة'+(min?' — target · المطلوب: '+(n===10?esc(C.limit.label):min+'–'+max):'');$('wc').className='wc '+(min&&(w<min||w>max)?'off':'on')};
 wx.addEventListener('input',function(){upd();draft()});upd();
 var draft=function(){var cc=cs(C.id),st=cc.st[n]||{};st.draft=wx.value;cc.st[n]=st;save()};
 $('submit').onclick=function(){submitWrite(n)};
}
function submitWrite(n){
 var t=C['s'+n],text=$('wx').value.trim(),w=words(text);
 if(n===9&&text.indexOf('___')>=0){alert('Replace every ___ with your own words first. · استبدل كل فراغ ___ بكلماتك أولًا.');return}
 if(w<10){alert('Please write a fuller answer (at least 10 words). · اكتب إجابة أطول (١٠ كلمات على الأقل).');return}
 var c=cs(C.id),p=c.st[n]||{},chk=[].map.call(document.querySelectorAll('.chk input'),function(x){return x.checked});
 var st={done:true,pending:true,text:text,words:w,chk:chk,attempts:(p.attempts||0)+1,at:new Date().toISOString()};
 if(n===10){st.title=$('wt')?$('wt').value.trim():'';st.transfer=$('wtr')?$('wtr').value.trim():''}
 c.st[n]=st;save();renderProgress();
 var r=$('res');r.style.display='block';r.className='res good';
 r.innerHTML='✅ <b>Saved.</b> Your teacher will review this station. You can continue now. · <span dir="rtl">تم الحفظ. سيراجع معلمك هذه المحطة، ويمكنك المتابعة الآن.</span>'+(n<10?'<div class="row"><button class="btn" id="go2">Next station →</button></div>':'<div id="sendst"></div>');
 if(n<10)$('go2').onclick=function(){showStation(n+1)};else sendTeacher();
}
function sendTeacher(){
 var c=cs(C.id),r=reg(),auto=0,parts=[],ans=[];
 for(var k=1;k<=5;k++){var s=c.st[k];auto+=s?s.score:0;parts.push('S'+k+' '+(s?s.score+'/10 ('+s.attempts+' att.)':'—'))}
 for(k=6;k<=9;k++){s=c.st[k];ans.push('STATION '+k+' – '+STN[k][0]+':\n'+(s&&s.text?s.text:'(not submitted)'))}
 var f=c.st[10]||{};if(f.transfer)ans.push('EXTRA TRANSFER TASK:\n'+f.transfer);
 var body={type:'submission',page:PAGE,test:'Grade 11 Writing · '+C.title+' (Module '+C.module+') – Station 10',name:r.name||'',cls:r.cls||'',
  score:auto,max:50,percent:Math.round(auto/50*100),breakdown:parts.join('; ')+'; S6–S10 pending teacher review; final '+(f.words||0)+' words',
  topic:(C.title+' · '+(f.title||'')).slice(0,118),essay:((f.title?f.title+'\n\n':'')+(f.text||'')),answers:ans.join('\n\n'),
  email:r.email||'',phone:r.phone||'',consent:true,website:''};
 var box=$('sendst');box.innerHTML='<p class="small">⏳ Sending to your teacher… · جارٍ الإرسال إلى معلمك…</p>';
 var done=false,fin=function(ref){if(done)return;done=true;
  if(ref){c.sent={at:new Date().toISOString(),ref:ref};save();box.innerHTML='<p>📨 <b>Sent to your teacher.</b> Reference: <code>'+esc(ref)+'</code> · <span dir="rtl">وصلت كتابتك إلى معلمك.</span></p><p><a class="btn" href="?view=journey">🖨️ My journey / Print PDF</a></p>'}
  else box.innerHTML='<p>⚠️ <b>Could not send now.</b> Your work is saved on this device. Print your journey (PDF) and give it to your teacher, or press “Send again” later. · <span dir="rtl">تعذّر الإرسال الآن. عملك محفوظ على هذا الجهاز؛ اطبع رحلتك PDF وسلّمها لمعلمك أو أعد الإرسال لاحقًا.</span></p><p><button class="btn" id="again">↻ Send again · أعد الإرسال</button> <a class="btn sec" href="?view=journey">🖨️ My journey</a></p>',$('again').onclick=sendTeacher};
 var ctl=window.AbortController?new AbortController():null;setTimeout(function(){if(ctl)ctl.abort();fin(null)},15000);
 try{fetch(EP,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:ctl?ctl.signal:undefined}).then(function(x){return x.json()}).then(function(d){fin(d&&d.ok?(d.ref||'OK'):null)}).catch(function(){fin(null)})}catch(e){fin(null)}
}

/* ---------- dictation ---------- */
function dictHtml(){return '<p>Choose a set, listen, type what you hear and check. Dictation scores are for practice only and do not unlock stations. · <span dir="rtl">اختر مجموعة، واستمع، واكتب ما تسمعه ثم تحقّق. درجات الإملاء للتدريب فقط.</span></p><div class="drow"><select id="dset"><option value="verbs">Verbs · الأفعال</option><option value="linkers">Linkers · أدوات الربط</option><option value="words">Main words · المفردات الأساسية</option><option value="sent" selected>Sentences · الجمل</option><option value="para">Paragraphs · الفقرات</option><option value="all">Whole model · النموذج كاملًا</option></select><span id="dpos" class="small"></span></div><div class="drow"><button class="btn sec" id="dprev">←</button><button class="btn" id="dplay">▶ Listen · استمع</button><button class="btn sec" id="dnext">→</button></div><div class="drow small"><label><input type="checkbox" id="dslow"> Slower voice · صوت أبطأ</label><label><input type="checkbox" id="dbreak"> Timed breaks · فواصل للكتابة</label><select id="dgap"><option value="3">3 s</option><option value="5" selected>5 s</option><option value="8">8 s</option><option value="12">12 s</option></select></div><textarea id="dtx" rows="4" placeholder="Type what you hear… · اكتب ما تسمعه…"></textarea><div class="row"><button class="btn" id="dchk">Check · تحقّق</button><button class="btn sec" id="dshow">Show text · أظهر النص</button></div><div id="dres" class="dres"></div>'}
var DI={set:'sent',i:0};
function dItems(c,set){var m=c.model.map(function(x){return x[0]});
 if(set==='verbs')return c.verbs;if(set==='linkers')return c.linkers;if(set==='words')return c.vocab.map(function(v){return v[0]});
 if(set==='para')return c.oneParagraph?[m.slice(0,2).join(' '),m.slice(2,4).join(' '),m.slice(4).join(' ')]:m;
 if(set==='all')return [m.join(c.oneParagraph?' ':'\n')];var out=[];m.forEach(function(p){out=out.concat(sentences(p))});return out}
function initDict(c){
 var it=function(){return dItems(c,DI.set)},show=function(){var a=it();if(DI.i>=a.length)DI.i=0;$('dpos').textContent='Item '+(DI.i+1)+' / '+a.length;$('dres').innerHTML='';$('dtx').value=''};
 $('dset').onchange=function(){DI.set=this.value;DI.i=0;show()};
 $('dprev').onclick=function(){var a=it();DI.i=(DI.i-1+a.length)%a.length;show()};$('dnext').onclick=function(){DI.i=(DI.i+1)%it().length;show()};
 $('dplay').onclick=function(){var t=it()[DI.i],slow=$('dslow').checked;if($('dbreak').checked){var p=sentences(t.replace(/\n/g,' '));if(p.length===1)p=chunk(t);speakParts(p,slow,+$('dgap').value)}else speak(t.replace(/\n/g,' '),slow)};
 $('dshow').onclick=function(){$('dres').innerHTML='<div class="dtxt">'+esc(it()[DI.i]).replace(/\n/g,'<br>')+'</div>'};
 $('dchk').onclick=function(){$('dres').innerHTML=diff(it()[DI.i],$('dtx').value)};
 show();
}
function chunk(t){var w=t.split(/\s+/),o=[];for(var i=0;i<w.length;i+=6)o.push(w.slice(i,i+6).join(' '));return o}
function diff(target,typed){
 var A=target.replace(/\n/g,' ').split(/\s+/).filter(Boolean),B=typed.split(/\s+/).filter(Boolean),a=A.map(norm),b=B.map(norm),n=a.length,m=b.length,L=[];
 for(var i=0;i<=n;i++){L[i]=[];for(var j=0;j<=m;j++)L[i][j]=0}
 for(i=n-1;i>=0;i--)for(j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 var out=[],ok=0;i=0;j=0;
 while(i<n||j<m){if(i<n&&j<m&&a[i]===b[j]){out.push('<span class="ok">'+esc(A[i])+'</span>');ok++;i++;j++}
  else if(j<m&&(i>=n||L[i][j+1]>=L[i+1][j])){out.push('<span class="extra">'+esc(B[j])+'</span>');j++}
  else{out.push('<span class="miss">'+esc(A[i])+'</span>');i++}}
 var pct=n?Math.round(ok/Math.max(n,m)*100):0;
 return '<div class="score">'+pct+'%</div><div class="dtxt">'+out.join(' ')+'</div><p class="small"><span class="ok">green</span> = correct · صحيح; <span class="miss">red</span> = missing or misspelt · ناقص أو خطأ إملائي; <span class="extra">struck</span> = extra · زائد. '+(pct>=80?'Very good! · ممتاز!':'Listen again and retry. · استمع مجددًا وحاول.')+'</p>'}

/* ---------- journey report ---------- */
function renderJourney(){
 document.title='My Grade 11 Writing Journey | Smart Students Hub';
 var r=reg(),h='<header class="hero" style="--c:#14244a"><div class="kick">GRADE 11 WRITING · MY JOURNEY</div><h1>🖨️ My journey · رحلتي</h1><p>'+(r.name?'<b>'+esc(r.name)+'</b>'+(r.cls?' · Class '+esc(r.cls):''):'')+' · '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+'</p><nav class="crumbs noprint"><a href="?">← All courses · كل الدورات</a><button class="btn gold" onclick="window.print()">🖨️ Print / Save PDF · طباعة / حفظ PDF</button></nav></header><main class="wrap"><p class="small">This report shows the work saved on this device. Stations 1–5 are auto-marked; stations 6–10 show “Pending review” until your teacher marks them. · <span dir="rtl">يعرض هذا التقرير العمل المحفوظ على هذا الجهاز. المحطات ١–٥ مصححة تلقائيًا، والمحطات ٦–١٠ تظهر «بانتظار المراجعة» حتى يصححها المعلم.</span></p>';
 var any=false;
 COURSES.forEach(function(c){var x=cs(c.id),d=doneCount(c.id),auto=0;if(d)any=true;
  h+='<section class="card jr" style="--c:'+c.color+'"><h2>'+c.emoji+' '+esc(c.title)+' · <span dir="rtl">'+esc(c.ar)+'</span> <small>Module '+c.module+' · '+d+'/10</small></h2>';
  if(!d){h+='<p class="small">Not started yet. · لم تبدأ بعد. <a class="noprint" href="?course='+c.id+'">Start · ابدأ →</a></p></section>';return}
  h+='<table><thead><tr><th>#</th><th>Station</th><th>Result</th><th>Attempts</th><th>Last</th></tr></thead><tbody>';
  for(var k=1;k<=10;k++){var s=x.st[k];if(k<=5&&s&&s.done)auto+=s.score;
   h+='<tr><td>'+k+'</td><td>'+STN[k][0]+' · <span dir="rtl">'+STN[k][1]+'</span></td><td>'+(!s||!s.done?'—':k<=5?'<b>'+s.score+'/10</b>'+(s.best>s.score?' (best '+s.best+')':''):'⏳ Pending review · '+s.words+' words')+'</td><td>'+(s&&s.attempts||'')+'</td><td>'+(s&&s.at?fmt(s.at):'')+'</td></tr>'}
  h+='</tbody></table><p><b>Auto-marked total (stations 1–5): '+auto+' / 50</b>'+(x.sent?' · 📨 Sent to teacher '+fmt(x.sent.at)+' (ref '+esc(x.sent.ref)+')':'')+'</p>';
  for(k=6;k<=10;k++){s=x.st[k];if(s&&s.text)h+='<div class="jw"><h4>Station '+k+' – '+STN[k][0]+(s.title?': '+esc(s.title):'')+'</h4><p>'+esc(s.text).replace(/\n/g,'<br>')+'</p></div>';if(k===10&&s&&s.transfer)h+='<div class="jw"><h4>Extra transfer task</h4><p>'+esc(s.transfer).replace(/\n/g,'<br>')+'</p></div>'}
  h+='<div class="tfb"><b>Teacher feedback · ملاحظات المعلم:</b><div class="lines"></div></div></section>'});
 if(!any)h+='<section class="card"><p>No saved work on this device yet. Open a course to begin. · لا يوجد عمل محفوظ على هذا الجهاز بعد.</p></section>';
 h+='</main>';app.innerHTML=h;
}
/* ---------- start ---------- */
if(VIEW==='journey'||location.pathname.match(/progress-report/))renderJourney();
else if(COURSE)renderCourse(COURSE);
else renderHome();
})();
