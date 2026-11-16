/* Grade 11 Writing courses – original teaching content by Smart Students Hub.
   Item format for stations 2–4: [sentence with ___, [correct, wrong, wrong], Arabic meaning of the full sentence]. */
var COURSES = [];

COURSES.push({
 id:'diary', emoji:'🐪', color:'#1a6b3c', module:3, sb:'Student Book p.43',
 title:'Adventure Diary', ar:'يوميات مغامرة',
 goal:'Write a diary entry (maximum 120 words) about a camel adventure in Morocco. Include the date and time, the weather, your activities in order, the highlight of the day and your feelings.',
 goalAr:'اكتب صفحة يوميات (بحد أقصى ١٢٠ كلمة) عن مغامرة على الجمال في المغرب، تتضمن التاريخ والوقت والطقس والأنشطة بالترتيب وأبرز حدث في اليوم ومشاعرك.',
 limit:{min:80,max:120,label:'maximum 120 words'},
 style:'Informal, personal and lively: first person (I / we), past simple for events, exclamations for feelings.',
 styleAr:'أسلوب شخصي حيوي: ضمير المتكلم، والماضي البسيط للأحداث، وجمل التعجب للتعبير عن المشاعر.',
 vocab:[
  ['dune','كثيب رملي','ديون','We climbed a huge sand dune.'],
  ['caravan','قافلة','كارافان','Our caravan had ten camels.'],
  ['sunrise','شروق الشمس','سَنرايز','We woke up early to watch the sunrise.'],
  ['scorching','حارّ جدًا / لاهب','سكورتشينغ','By noon, the sun was scorching.'],
  ['breathtaking','مذهل / يخطف الأنفاس','بريث-تيكينغ','The view from the top was breathtaking.'],
  ['guide','مرشد','غايد','Our guide knew every path in the desert.'],
  ['ride','يركب','رايد','I rode a gentle camel for three hours.'],
  ['campfire','نار المخيّم','كامب-فاير','We sat around the campfire after dinner.'],
  ['exhausted','مُنهَك جدًا','إغزوستِد','I was exhausted but happy.'],
  ['unforgettable','لا يُنسى','أنفورغيتابل','It was an unforgettable day!']
 ],
 verbs:['woke up','watched','led','rode','climbed','slid','sat','ate','feel'],
 linkers:['After breakfast,','Then,','but','After that,','The highlight was','Later,'],
 modelTitle:'My Desert Diary',
 model:[
  ['Saturday, 14th March, 9 p.m. – Merzouga, Morocco','السبت، ١٤ مارس، الساعة ٩ مساءً – مرزوكة، المغرب'],
  ['Dear Diary,','عزيزتي اليوميات،'],
  ['What a day! I woke up at 5 a.m. to watch the sunrise over the golden dunes. The weather was cool in the morning, but by noon it was scorching.','يا له من يوم! استيقظت في الخامسة صباحًا لأشاهد شروق الشمس فوق الكثبان الذهبية. كان الطقس باردًا في الصباح، لكنه أصبح حارًا جدًا عند الظهر.'],
  ['After breakfast, our guide, Hassan, led our caravan into the desert. I rode a gentle camel called Zara for three hours. Then we climbed a huge dune and slid down it!','بعد الإفطار، قاد مرشدنا حسن قافلتنا إلى الصحراء. ركبت جملًا هادئًا اسمه زارا لمدة ثلاث ساعات. ثم تسلقنا كثيبًا ضخمًا وانزلقنا عليه!'],
  ['The highlight was the evening. We sat around a campfire, ate a delicious tagine and watched thousands of stars.','كان المساء أجمل ما في اليوم. جلسنا حول نار المخيم، وتناولنا طاجينًا لذيذًا، وشاهدنا آلاف النجوم.'],
  ['I am exhausted now, but I feel so happy. It was an unforgettable adventure!','أنا منهك الآن، لكنني أشعر بسعادة كبيرة. كانت مغامرة لا تُنسى!']
 ],
 template:[
  ['Heading','العنوان','Day, date, time – place'],
  ['Greeting','التحية','Dear Diary,'],
  ['Opening: weather and first feeling','البداية: الطقس والشعور الأول','What a … day! The weather was …'],
  ['Activities in order','الأنشطة بالترتيب','First, … Then, … After that, …'],
  ['Highlight','أبرز حدث','The highlight was … because …'],
  ['Feelings and ending','المشاعر والخاتمة','I feel … now. It was a(n) … adventure!']
 ],
 order:[2,3,4,5],
 s2:[
  ['I ___ up at 5 a.m. to watch the sunrise.',['woke','wake','waking'],'استيقظت في الخامسة صباحًا لأشاهد شروق الشمس.'],
  ['Our guide ___ the caravan into the desert.',['led','leads','leading'],'قاد مرشدنا القافلة إلى الصحراء.'],
  ['I ___ a gentle camel for three hours.',['rode','ride','ridden'],'ركبت جملًا هادئًا لمدة ثلاث ساعات.'],
  ['We ___ a huge dune and slid down it.',['climbed','climb','climbing'],'تسلقنا كثيبًا ضخمًا وانزلقنا عليه.']
 ],
 s3:[
  ['___ breakfast, we met our guide.',['After','Although','Because'],'بعد الإفطار، قابلنا مرشدنا.'],
  ['The morning was cool, ___ by noon it was scorching.',['but','so','because'],'كان الصباح باردًا، لكنه أصبح حارًا جدًا عند الظهر.'],
  ['I was tired ___ we had walked for hours.',['because','but','although'],'كنت متعبًا لأننا مشينا لساعات.'],
  ['We rode for three hours. ___, we stopped for lunch.',['After that','However','Although'],'ركبنا ثلاث ساعات. بعد ذلك، توقفنا للغداء.']
 ],
 s4:[
  ['Our guide was called Hassan. ___ knew every dune.',['He','It','They'],'كان اسم مرشدنا حسن. كان يعرف كل كثيب.'],
  ['I rode a camel called Zara. ___ was very gentle.',['It','They','We'],'ركبت جملًا اسمه زارا. كان هادئًا جدًا.'],
  ['We climbed a huge dune and slid down ___.',['it','them','there'],'تسلقنا كثيبًا ضخمًا وانزلقنا عليه.'],
  ['We reached the camp at sunset and stayed ___ all night.',['there','it','them'],'وصلنا إلى المخيم عند الغروب وبقينا هناك طوال الليل.']
 ],
 s6:{en:'Write the heading (day, date, time and place), “Dear Diary,” and two opening sentences about the weather and how you felt.',ar:'اكتب العنوان (اليوم والتاريخ والوقت والمكان) ثم «Dear Diary,» وجملتين افتتاحيتين عن الطقس وشعورك.',min:20,max:40,check:['Heading with day, date, time and place','“Dear Diary,”','Weather','A feeling or an exclamation']},
 s7:{en:'Describe three activities in the order they happened. Use the past simple and linkers such as First, Then and After that.',ar:'صف ثلاثة أنشطة بترتيب حدوثها، مستخدمًا الماضي البسيط وأدوات ربط مثل First وThen وAfter that.',min:35,max:60,check:['Three activities','Past simple verbs','At least two linkers']},
 s8:{en:'Write the highlight of the day, explain why, describe your feelings and end the entry.',ar:'اكتب أبرز حدث في اليوم وسببه، وصف مشاعرك، واختم الصفحة.',min:20,max:40,check:['The highlight + because','Feelings','A closing sentence']},
 s9:{en:'Complete the frame with your own words. Every gap needs a different idea from the model.',ar:'أكمل الإطار بكلماتك الخاصة، بأفكار مختلفة عن النموذج.',frame:'Sunday, ___ April, ___ p.m. – ___\nDear Diary,\nWhat a ___ day! The weather was ___. First, we ___. Then, ___. The highlight was ___ because ___. I feel ___ now.'},
 s10:{en:'Write your complete diary entry about a camel adventure in Morocco. Maximum 120 words.',ar:'اكتب صفحة اليوميات كاملة عن مغامرة على الجمال في المغرب، بحد أقصى ١٢٠ كلمة.',titleLabel:'Heading (day, date, time – place)',check:['Heading and “Dear Diary,”','Weather','Activities in order with linkers','Highlight','Feelings','120 words or fewer']},
 transfer:{en:'Extra task: write a diary entry (maximum 120 words) about a day trip to Khor Al Adaid (the Inland Sea) in Qatar.',ar:'مهمة إضافية: اكتب صفحة يوميات (بحد أقصى ١٢٠ كلمة) عن رحلة يوم إلى خور العديد (البحر الداخلي) في قطر.'}
});

COURSES.push({
 id:'story', emoji:'🏖️', color:'#0f4c5c', module:3, sb:'Student Book pp.48–49',
 title:'A Holiday Story', ar:'قصة عن العطلة',
 goal:'Write a story about a holiday experience that taught you a lesson. Use five stages: setting, rising action, climax, resolution and lesson.',
 goalAr:'اكتب قصة عن تجربة في عطلة تعلمت منها درسًا، في خمس مراحل: التمهيد، وتصاعد الأحداث، والذروة، والحل، والدرس المستفاد.',
 limit:{min:130,max:200,label:'about 150–180 words'},
 style:'Narrative: past simple for main events, past continuous for background actions, feelings and a clear lesson at the end.',
 styleAr:'أسلوب سردي: الماضي البسيط للأحداث الرئيسية، والماضي المستمر للخلفية، مع المشاعر ودرس واضح في النهاية.',
 vocab:[
  ['crowded','مزدحم','كراوديد','The market was crowded and noisy.'],
  ['wander','يتجوّل / يبتعد شاردًا','ووندر','I wandered away from my parents.'],
  ['realise','يُدرك','ريلايز','Suddenly, I realised I was alone.'],
  ['pound','يخفق بقوة','باوند','My heart was pounding.'],
  ['frightened','خائف','فرايتند','I felt lost and frightened.'],
  ['panic','يُصاب بالذعر','بانيك','Try not to panic in an emergency.'],
  ['advice','نصيحة','أدفايس','I remembered my father’s advice.'],
  ['security guard','حارس أمن','سيكيوريتي غارد','A security guard helped me.'],
  ['relieved','مرتاح بعد قلق','ريليفد','My parents looked relieved.'],
  ['lesson','درس','ليسن','I learnt an important lesson.']
 ],
 verbs:['flew','was looking','realised','ran','remembered','found','arrived','learnt'],
 linkers:['Last summer,','so','when','but','Then','Twenty minutes later,','Since that day,'],
 modelTitle:'Lost in the Bazaar',
 model:[
  ['Last summer, my family and I flew to Istanbul for a week’s holiday. On the first afternoon, we went to the Grand Bazaar, which was crowded, noisy and full of colourful shops.','في الصيف الماضي، سافرت مع عائلتي إلى إسطنبول لقضاء عطلة لمدة أسبوع. في عصر اليوم الأول، ذهبنا إلى السوق الكبير الذي كان مزدحمًا وصاخبًا ومليئًا بالمتاجر الملونة.'],
  ['I wanted to buy a gift for my grandmother, so I wandered away from my parents. I was looking at some beautiful lamps when I suddenly realised that I could not see them anywhere. My phone battery was dead, and I did not know the name of our hotel.','أردت شراء هدية لجدتي، فابتعدت عن والديّ. كنت أنظر إلى بعض المصابيح الجميلة عندما أدركت فجأة أنني لا أراهما في أي مكان. كانت بطارية هاتفي فارغة، ولم أكن أعرف اسم الفندق.'],
  ['My heart was pounding. I ran from one street to another, but every corner looked the same. I felt completely lost and very frightened.','كان قلبي يخفق بقوة. ركضت من شارع إلى آخر، لكن كل زاوية كانت تبدو متشابهة. شعرت بالضياع التام وبخوف شديد.'],
  ['Then I remembered my father’s advice: if you get lost, stay calm and ask someone in uniform. I found a security guard, and he took me to the information office. Twenty minutes later, my parents arrived, looking worried but relieved.','ثم تذكرت نصيحة أبي: إذا ضعت فابقَ هادئًا واسأل شخصًا يرتدي زيًّا رسميًا. وجدت حارس أمن فأخذني إلى مكتب الاستعلامات. وبعد عشرين دقيقة وصل والداي، وكانا قلقين لكنهما شعرا بالارتياح.'],
  ['Since that day, I have never wandered off alone in a busy place. I learnt that staying calm and asking for help is much better than panicking.','منذ ذلك اليوم، لم أبتعد وحدي قط في مكان مزدحم. تعلمت أن البقاء هادئًا وطلب المساعدة أفضل بكثير من الذعر.']
 ],
 template:[
  ['1 Setting: who, where, when','١ التمهيد: من وأين ومتى','Last …, my … and I went to …'],
  ['2 Rising action: the problem begins','٢ تصاعد الأحداث: بداية المشكلة','I was …ing when suddenly …'],
  ['3 Climax: the most exciting or worrying moment','٣ الذروة: أكثر اللحظات إثارة أو قلقًا','My heart was pounding. I felt …'],
  ['4 Resolution: how the problem ended','٤ الحل: كيف انتهت المشكلة','Then I remembered / decided … In the end, …'],
  ['5 Lesson: what you learnt','٥ الدرس: ما تعلمته','Since that day, … I learnt that …']
 ],
 order:[0,1,2,3,4],
 s2:[
  ['I ___ at some lamps when I realised I was alone.',['was looking','looked at','am looking'],'كنت أنظر إلى بعض المصابيح عندما أدركت أنني وحدي.'],
  ['My phone battery ___ dead.',['was','were','is being'],'كانت بطارية هاتفي فارغة.'],
  ['I ___ from one street to another.',['ran','run','running'],'ركضت من شارع إلى آخر.'],
  ['Twenty minutes later, my parents ___.',['arrived','arrive','arriving'],'بعد عشرين دقيقة، وصل والداي.']
 ],
 s3:[
  ['I wanted to buy a gift, ___ I wandered away.',['so','but','because'],'أردت شراء هدية، لذلك ابتعدت.'],
  ['I was looking at lamps ___ I realised I was alone.',['when','so','but'],'كنت أنظر إلى المصابيح عندما أدركت أنني وحدي.'],
  ['I ran everywhere, ___ every corner looked the same.',['but','so','because'],'ركضت في كل مكان، لكن كل زاوية بدت متشابهة.'],
  ['___ that day, I have never wandered off alone.',['Since','For','During'],'منذ ذلك اليوم، لم أبتعد وحدي قط.']
 ],
 s4:[
  ['I found a security guard, and ___ took me to the office.',['he','it','they'],'وجدت حارس أمن، فأخذني إلى المكتب.'],
  ['My parents arrived. ___ looked worried but relieved.',['They','He','It'],'وصل والداي. بدَوَا قلقين لكنهما مرتاحان.'],
  ['The bazaar was huge. ___ had hundreds of shops.',['It','They','She'],'كان السوق ضخمًا. كان فيه مئات المتاجر.'],
  ['My father gave me some advice. I remembered ___ at the right moment.',['it','them','him'],'أعطاني أبي نصيحة. تذكرتها في اللحظة المناسبة.']
 ],
 s6:{en:'Write the SETTING: who was there, where and when. Add one detail that describes the place.',ar:'اكتب التمهيد: من كان هناك وأين ومتى، وأضف تفصيلًا يصف المكان.',min:30,max:50,check:['Who','Where','When','A describing detail']},
 s7:{en:'Write the RISING ACTION and the CLIMAX. Use the past continuous + when + past simple, and describe your feelings.',ar:'اكتب تصاعد الأحداث والذروة، مستخدمًا الماضي المستمر + when + الماضي البسيط، وصف مشاعرك.',min:50,max:80,check:['The problem starts','was/were …ing + when','The most exciting/worrying moment','Feelings']},
 s8:{en:'Write the RESOLUTION and the LESSON: how did the problem end, and what did you learn?',ar:'اكتب الحل والدرس: كيف انتهت المشكلة وماذا تعلمت؟',min:35,max:55,check:['How it ended','Time linker (Then / In the end)','The lesson: I learnt that …']},
 s9:{en:'Complete the story frame with your own holiday story.',ar:'أكمل إطار القصة بقصة عطلتك الخاصة.',frame:'Last ___, I went to ___ with ___. It was ___. While we were ___, ___ suddenly ___. I felt ___. Then ___. In the end, ___. Since that day, ___. I learnt that ___.'},
 s10:{en:'Write your complete holiday story (about 150–180 words) in five stages. Give it a title.',ar:'اكتب قصة العطلة كاملة (نحو ١٥٠–١٨٠ كلمة) في خمس مراحل، وضع لها عنوانًا.',titleLabel:'Story title',check:['Title','Setting','Rising action','Climax','Resolution','Lesson','Past simple + past continuous']},
 transfer:{en:'Extra task: write a story about a holiday when something went wrong (for example, a missed flight) but you learnt something useful.',ar:'مهمة إضافية: اكتب قصة عن عطلة حدث فيها خطأ (مثل فوات الطائرة) لكنك تعلمت منها شيئًا مفيدًا.'}
});

COURSES.push({
 id:'announcement', emoji:'🌿', color:'#5b2a86', module:4, sb:'Student Book p.57',
 title:'An Eco-friendly Announcement', ar:'إعلان بيئي',
 goal:'Write an announcement inviting residents to a meeting to discuss two eco-friendly proposals. Include a title, the topic, the date, time and venue, and end with a factbox.',
 goalAr:'اكتب إعلانًا يدعو السكان إلى اجتماع لمناقشة اقتراحين صديقين للبيئة، يتضمن عنوانًا والموضوع والتاريخ والوقت والمكان، وينتهي بصندوق معلومات.',
 limit:{min:110,max:170,label:'about 130–160 words'},
 style:'Clear, friendly and persuasive: a catchy title, a direct question, short paragraphs, the passive and will/would for plans. All meeting details and figures are fictional practice data.',
 styleAr:'أسلوب واضح وودود ومقنع: عنوان جذاب وسؤال مباشر وفقرات قصيرة، مع المبني للمجهول وwill/would للخطط. جميع التفاصيل والأرقام بيانات تدريبية افتراضية.',
 vocab:[
  ['proposal','اقتراح','بروبوزل','We will discuss two proposals.'],
  ['residents','السكان / القاطنون','ريزيدنتس','All residents are welcome.'],
  ['eco-friendly','صديق للبيئة','إيكو-فريندلي','We need eco-friendly ideas.'],
  ['recycling','إعادة التدوير','ريسايكلنغ','A recycling centre would reduce waste.'],
  ['waste','نفايات','ويست','Our area produces a lot of waste.'],
  ['reduce','يُقلّل','ريديوس','Trees reduce the temperature.'],
  ['volunteer','متطوّع','فولنتير','Volunteers will plant the trees.'],
  ['shade','ظلّ','شيد','Trees provide shade in summer.'],
  ['venue','مكان انعقاد الفعالية','فينيو','The venue is the community hall.'],
  ['vote','يصوّت','فوت','You can vote for your favourite proposal.']
 ],
 verbs:['invites','discuss','would bring','would be sold','would plant','provide','share','vote','will be provided'],
 linkers:['and','In addition,','because','If','so that','Everyone is welcome'],
 modelTitle:'Greener Al Waha: Have Your Say!',
 model:[
  ['Greener Al Waha: Have Your Say!','الواحة أكثر خضرة: شارك برأيك!'],
  ['Are you worried about the rubbish in our streets and the summer heat in our neighbourhood? The Al Waha Residents’ Committee invites all residents to a public meeting to discuss two eco-friendly proposals for our area.','هل يقلقك وجود القمامة في شوارعنا وحرارة الصيف في حيّنا؟ تدعو لجنة سكان الواحة جميع السكان إلى اجتماع عام لمناقشة اقتراحين صديقين للبيئة لمنطقتنا.'],
  ['Proposal 1 is a community recycling centre. Residents would bring paper, plastic and glass to one convenient place, and the materials would be sold to recycling companies. Proposal 2 is a tree-planting project. Volunteers would plant 500 native trees along the main roads to provide shade and reduce temperatures.','الاقتراح الأول مركز مجتمعي لإعادة التدوير، يحضر إليه السكان الورق والبلاستيك والزجاج في مكان واحد مناسب، وتُباع المواد لشركات إعادة التدوير. والاقتراح الثاني مشروع لزراعة الأشجار، يزرع فيه المتطوعون ٥٠٠ شجرة محلية على طول الطرق الرئيسية لتوفير الظل وخفض درجات الحرارة.'],
  ['Date: Saturday, 22nd November · Time: 6:00–7:30 p.m. · Venue: Al Waha Community Hall, Building 12','التاريخ: السبت ٢٢ نوفمبر · الوقت: ٦:٠٠–٧:٣٠ مساءً · المكان: قاعة الواحة المجتمعية، المبنى ١٢'],
  ['Come and share your ideas, ask questions and vote for the proposal you prefer. Everyone is welcome, and refreshments will be provided.','تعال وشارك أفكارك واطرح أسئلتك وصوّت للاقتراح الذي تفضله. الجميع مرحَّب بهم، وستُقدَّم المرطبات.'],
  ['FACTBOX – Did you know? • Our area produces about 3 tonnes of household waste every day. • One large tree can make the air around it up to 2°C cooler. • 70% of residents in our survey want more green spaces. (Practice figures)','صندوق المعلومات – هل تعلم؟ • تنتج منطقتنا نحو ٣ أطنان من النفايات المنزلية يوميًا. • يمكن لشجرة كبيرة أن تخفض حرارة الهواء حولها حتى درجتين مئويتين. • ٧٠٪ من السكان في استطلاعنا يريدون مساحات خضراء أكثر. (أرقام تدريبية)']
 ],
 template:[
  ['Catchy title','عنوان جذاب','Greener …: Have Your Say!'],
  ['Opening question + invitation (topic)','سؤال افتتاحي + دعوة (الموضوع)','Are you worried about …? The … invites all residents to …'],
  ['The two proposals and their benefits','الاقتراحان وفوائدهما','Proposal 1 is … It would … Proposal 2 is …'],
  ['Date, time and venue','التاريخ والوقت والمكان','Date: … · Time: … · Venue: …'],
  ['Call to action','دعوة إلى المشاركة','Come and share your ideas … Everyone is welcome.'],
  ['Factbox (ends the announcement)','صندوق المعلومات (في نهاية الإعلان)','Did you know? • … • … • …']
 ],
 order:[0,1,2,3,4,5],
 s2:[
  ['All residents are ___ to the meeting.',['invited','invite','inviting'],'جميع السكان مدعوون إلى الاجتماع.'],
  ['The materials would be ___ to recycling companies.',['sold','sell','selling'],'ستُباع المواد إلى شركات إعادة التدوير.'],
  ['Volunteers ___ plant 500 native trees.',['would','are','did'],'سيزرع المتطوعون ٥٠٠ شجرة محلية.'],
  ['Refreshments will be ___.',['provided','provide','providing'],'ستُقدَّم المرطبات.']
 ],
 s3:[
  ['Come and share your ideas ___ vote for your favourite proposal.',['and','but','because'],'تعال وشارك أفكارك وصوّت لاقتراحك المفضل.'],
  ['Trees provide shade. ___, they make the air cleaner.',['In addition','However','Although'],'توفر الأشجار الظل. بالإضافة إلى ذلك، تجعل الهواء أنظف.'],
  ['We need your opinion ___ this project affects everyone.',['because','so','but'],'نحتاج إلى رأيك لأن هذا المشروع يؤثر في الجميع.'],
  ['___ you cannot attend, send us your ideas by email.',['If','Although','Because'],'إذا لم تستطع الحضور، أرسل إلينا أفكارك بالبريد الإلكتروني.']
 ],
 s4:[
  ['The committee has organised a meeting. ___ will start at 6 p.m.',['It','They','She'],'نظمت اللجنة اجتماعًا. سيبدأ في السادسة مساءً.'],
  ['Volunteers are needed. ___ will plant trees along the main roads.',['They','It','We'],'نحتاج إلى متطوعين. سيزرعون الأشجار على طول الطرق الرئيسية.'],
  ['Proposal 1 is a recycling centre. ___ would be open every day.',['It','They','He'],'الاقتراح الأول مركز لإعادة التدوير. سيكون مفتوحًا كل يوم.'],
  ['Residents can vote at the meeting. Each of ___ has one vote.',['them','it','us'],'يمكن للسكان التصويت في الاجتماع. لكل واحد منهم صوت واحد.']
 ],
 s6:{en:'Write a catchy TITLE, one opening QUESTION and an INVITATION sentence that gives the topic of the meeting.',ar:'اكتب عنوانًا جذابًا وسؤالًا افتتاحيًا وجملة دعوة تذكر موضوع الاجتماع.',min:25,max:45,check:['Catchy title','A direct question','Who invites whom','The topic']},
 s7:{en:'Describe the TWO PROPOSALS and one benefit of each. Use would and the passive at least once.',ar:'صف الاقتراحين وفائدة لكل منهما، مستخدمًا would والمبني للمجهول مرة واحدة على الأقل.',min:45,max:75,check:['Proposal 1 + benefit','Proposal 2 + benefit','would','One passive verb']},
 s8:{en:'Write the DATE, TIME and VENUE, a CALL TO ACTION, and a FACTBOX with three facts (label them as practice figures).',ar:'اكتب التاريخ والوقت والمكان ودعوة إلى المشاركة وصندوق معلومات من ثلاث حقائق (اكتب أنها أرقام تدريبية).',min:40,max:70,check:['Date','Time','Venue','Call to action','Factbox with 3 facts at the end']},
 s9:{en:'Complete the frame for a new announcement in your own words.',ar:'أكمل الإطار لإعلان جديد بكلماتك الخاصة.',frame:'___: Have Your Say!\nAre you ___? The ___ invites all ___ to a meeting to discuss ___.\nProposal 1 is ___. It would ___. Proposal 2 is ___. It would ___.\nDate: ___ · Time: ___ · Venue: ___\nCome and ___. Everyone is welcome.\nFACTBOX – Did you know? • ___ • ___ • ___'},
 s10:{en:'Write your complete announcement (about 130–160 words) inviting residents to discuss two eco-friendly proposals. End with a factbox.',ar:'اكتب الإعلان كاملًا (نحو ١٣٠–١٦٠ كلمة) لدعوة السكان إلى مناقشة اقتراحين صديقين للبيئة، واختم بصندوق معلومات.',titleLabel:'Announcement title',check:['Catchy title','Question + invitation','Two proposals + benefits','Date, time, venue','Call to action','Factbox at the end']},
 transfer:{en:'Extra task: write an announcement inviting students to a meeting about two ideas to make your school greener.',ar:'مهمة إضافية: اكتب إعلانًا يدعو الطلاب إلى اجتماع حول فكرتين لجعل مدرستك أكثر خضرة.'}
});
