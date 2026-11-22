"""Build item-level bilingual explanations for the Grade 11 Advanced Tests (MCQ grammar Q9 + vocabulary Q7,
word formation Q8, reading Q1/Q2 strategy notes).
    python3 src/feedback/build_g11_feedback.py      → writes feedback/g11-advanced.js
Explanations are assembled from reviewed rule texts (below) + the item's own options, so they stay
consistent with the exam data in g11-advanced.html. Skill-level rules, examples, common mistakes and
resources come from pathways/skills.js and are shown by ssh-pathways.js (not duplicated here)."""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
html = open(os.path.join(ROOT, 'g11-advanced.html'), encoding='utf-8').read()
i = html.index('const DATA=') + 11; d = 0
for j in range(i, len(html)):
    if html[j] == '[': d += 1
    elif html[j] == ']':
        d -= 1
        if d == 0: break
DATA = json.loads(html[i:j + 1])

# ---------- grammar: what each option form means (used for the key AND for "why not") ----------
G = {
 'PP':   ("Past perfect (had + past participle): an action completed BEFORE another past time or action.",
          "الماضي التام (had + التصريف الثالث): حدث اكتمل قبل وقت أو حدث آخر في الماضي."),
 'PS':   ("Past simple: one finished past action. It does not show that this action happened before another past moment.",
          "الماضي البسيط: حدث منتهٍ في الماضي، ولا يوضّح أنه وقع قبل لحظة أخرى في الماضي."),
 'PC':   ("Past continuous (was/were + -ing): a longer action in progress at a past moment.",
          "الماضي المستمر (was/were + ing): حدث طويل كان مستمرًا في لحظة ما في الماضي."),
 'PRP':  ("Present perfect (have/has + past participle) links the past to NOW, so it does not fit a sentence that is completely in the past.",
          "المضارع التام (have/has + التصريف الثالث) يربط الماضي بالحاضر، لذلك لا يناسب جملة تتحدث عن الماضي فقط."),
 'PRES': ("Present simple: facts and habits now. The sentence is about the past.",
          "المضارع البسيط: للحقائق والعادات الآن، بينما الجملة تتحدث عن الماضي."),
 'PP_PASS': ("Past perfect passive (had been + past participle): something was done to the subject BEFORE another past event.",
          "المبني للمجهول في الماضي التام (had been + التصريف الثالث): شيء حدث للفاعل قبل حدث آخر في الماضي."),
 'PRP_PASS': ("Present perfect passive (has/have been + participle) links to NOW; the sentence is about the past.",
          "المبني للمجهول في المضارع التام يرتبط بالحاضر، والجملة عن الماضي."),
 'PS_PASS': ("Past simple passive (was/were + participle) does not show that the damage happened BEFORE the discovery.",
          "المبني للمجهول في الماضي البسيط لا يوضح أن الحدث وقع قبل الاكتشاف."),
 'ACTIVE_NOOBJ': ("Active verb: the tank did not damage something; something damaged the tank, so we need a passive form.",
          "فعل مبني للمعلوم: الخزان لم يُتلف شيئًا، بل شيء أتلف الخزان، لذلك نحتاج إلى المبني للمجهول."),
 'ALTHOUGH': ("although / even though + subject + verb (a full clause) shows contrast.",
          "although / even though + فاعل + فعل (جملة كاملة) للتعبير عن التناقض."),
 'DESPITE': ("despite / in spite of + noun or verb-ing (NOT a subject + verb) shows contrast.",
          "despite / in spite of + اسم أو فعل + ing (وليس فاعلًا + فعلًا) للتعبير عن التناقض."),
 'BECAUSE': ("because + subject + verb gives a reason, not a contrast or a purpose.",
          "because + فاعل + فعل لذكر السبب، لا للتناقض أو الغرض."),
 'BECAUSE_OF': ("because of + noun gives a reason (not a contrast); it cannot be followed by a subject + verb.",
          "because of + اسم لذكر السبب (لا للتناقض)، ولا يأتي بعدها فاعل + فعل."),
 'SO_THAT': ("so that + subject + can/could/would + verb gives a purpose.",
          "so that + فاعل + can/could/would + فعل للتعبير عن الغرض."),
 'IN_ORDER_TO': ("in order to + base verb gives a purpose (no new subject after it).",
          "in order to + المصدر للتعبير عن الغرض (دون فاعل جديد بعدها)."),
 'SO_RESULT': ("so (result) + sentence = therefore. It does not express contrast.",
          "so (بمعنى لذلك) تعبّر عن النتيجة وليس التناقض."),
 'SO': ("so + adjective (no noun) + that … : 'so limited that …', 'so convincing that …'.",
          "so + صفة (بدون اسم) + that: مثل so limited that."),
 'SUCH': ("such (a/an) + adjective + NOUN + that … : 'such a hot day that …'.",
          "such (a/an) + صفة + اسم + that: مثل such a hot day that."),
 'SUCH_A': ("such a must be followed by an adjective + singular noun; here there is no noun after the gap.",
          "بعد such a يجب أن تأتي صفة + اسم مفرد، ولا يوجد اسم بعد الفراغ هنا."),
 'TOO': ("too + adjective + to-infinitive (too hot to …); it is not used with that.",
          "too + صفة + to + فعل (too hot to)، ولا تُستخدم مع that."),
 'VERY': ("very + adjective cannot be followed by that … to show a result.",
          "very + صفة لا يأتي بعدها that للتعبير عن النتيجة."),
 'MUSTNT': ("mustn't = it is not allowed / it is against the rules.",
          "mustn't = ممنوع / مخالف للقواعد."),
 'NO_NEED': ("don't have to / don't need to / needn't = it is not necessary (you can choose).",
          "don't have to / don't need to / needn't = غير ضروري (لك أن تختار)."),
 'MAY': ("may = permission (it is allowed) or possibility.",
          "may = إذن (مسموح) أو احتمال."),
 'CANT': ("can't = it is impossible or not allowed; it does not mean 'not necessary'.",
          "can't = مستحيل أو غير مسموح، ولا تعني «غير ضروري»."),
 'MUST': ("must = it is necessary / an obligation.",
          "must = ضروري / إلزامي."),
 'SHOULDNT_TO': ("'shouldn't to' is never correct: modal verbs are followed by the base verb without to.",
          "shouldn't to خطأ دائمًا: الأفعال الناقصة يأتي بعدها المصدر بدون to."),
 'HAD_TO': ("had to + base verb = it was necessary in the past.",
          "had to + المصدر = كان ضروريًا في الماضي."),
 'HAVE_TO': ("have to = it is necessary now; the sentence is about the past.",
          "have to = ضروري الآن، بينما الجملة عن الماضي."),
 'USED_TO': ("used to + base verb = a past habit or past state that is no longer true.",
          "used to + المصدر = عادة أو حالة في الماضي لم تعد موجودة."),
 'WOULD': ("would + base verb = a repeated past ACTION (not a state); it needs a past-time context.",
          "would + المصدر = فعل متكرر في الماضي (وليس حالة)، ويحتاج إلى سياق ماضٍ."),
 'BE_USED': ("be used to + noun / verb-ing = to be accustomed to something (it feels normal).",
          "be used to + اسم / فعل + ing = معتاد على الشيء."),
 'GET_USED': ("get used to + noun / verb-ing = to become accustomed to something new.",
          "get used to + اسم / فعل + ing = يعتاد تدريجيًا على شيء جديد."),
 'GOING': ("was / were going to + base verb = a past plan that did not happen.",
          "was / were going to + المصدر = خطة في الماضي لم تتحقق."),
 'USE_ERR': ("'use to' / 'using to' are not correct forms here.",
          "الصيغتان use to و using to غير صحيحتين هنا."),
 'ING': ("After be used to we need verb + -ing.",
          "بعد be used to نحتاج إلى الفعل + ing."),
 'BASE_AFTER_TO': ("This form cannot follow 'be used to': the 'to' here is a preposition, so it needs verb + -ing.",
          "هذه الصيغة لا تأتي بعد be used to، لأن to هنا حرف جر ويحتاج إلى فعل + ing."),
 'HAD_USED': ("had used is the past perfect of use; it does not express a past habit.",
          "had used هو الماضي التام لـ use ولا يعبّر عن عادة في الماضي."),
}
PS_WORDS = {'found', 'used', 'sank', 'tested', 'sailed', 'gave', 'travelled', 'became', 'fell', 'learned', 'lived', 'wrote', 'walked'}
PRES_WORDS = {'test', 'uses', 'sails', 'gives', 'travels', 'call', 'become', 'becomes', 'learns', 'live', 'writes', 'walk', 'walks'}

def gcat(o, q):
    l = o.lower().strip()
    if l in ('although', 'even though'): return 'ALTHOUGH'
    if l in ('despite', 'in spite of'): return 'DESPITE'
    if l == 'because': return 'BECAUSE'
    if l == 'because of': return 'BECAUSE_OF'
    if l == 'so that': return 'SO_THAT'
    if l == 'in order to': return 'IN_ORDER_TO'
    if l == 'so': return 'SO' if '___ ' in q.replace('__________', '___ ') and re.search(r'_{3,}\s+\w+\s+that', q) else 'SO_RESULT'
    if l == 'such': return 'SUCH'
    if l == 'such a': return 'SUCH_A'
    if l == 'too': return 'TOO'
    if l == 'very': return 'VERY'
    if l == "mustn't": return 'MUSTNT'
    if l in ("don't have to", "don't need to", "needn't"): return 'NO_NEED'
    if l == 'may': return 'MAY'
    if l == "can't": return 'CANT'
    if l == 'must': return 'MUST'
    if l == "shouldn't to": return 'SHOULDNT_TO'
    if l == 'had to': return 'HAD_TO'
    if l == 'have to': return 'HAVE_TO'
    if l == 'used to': return 'USED_TO'
    if l == 'would': return 'WOULD'
    if re.match(r'^(is|are|am|was|were) used to$', l): return 'BE_USED'
    if re.match(r'^(get|got) used( to)?$', l): return 'GET_USED'
    if re.match(r'^(was|were) going to$', l): return 'GOING'
    if l in ('use to', 'using to'): return 'USE_ERR'
    if l == 'had used': return 'HAD_USED'
    if l == 'walking': return 'ING'
    if l in ('walk', 'walked', 'walks'): return 'BASE_AFTER_TO'
    if re.match(r'^had been \w+$', l): return 'PP_PASS'
    if re.match(r'^(has|have) been \w+$', l): return 'PRP_PASS'
    if re.match(r'^(was|were) \w+ed$', l): return 'PS_PASS'
    if l == 'damaged': return 'ACTIVE_NOOBJ'
    if re.match(r'^had \w+$', l): return 'PP'
    if re.match(r'^(has|have) \w+$', l): return 'PRP'
    if re.match(r'^(was|were) \w+ing$', l): return 'PC'
    if l in PS_WORDS: return 'PS'
    if l in PRES_WORDS: return 'PRES'
    raise SystemExit('no category for option: ' + o + ' in ' + q)

def clue(q, cat):
    """short sentence-specific pointer to the clue in the question (EN, AR)"""
    s = q.lower()
    if cat in ('PP', 'PP_PASS'):
        if s.startswith('by the time'): return ("Clue: 'By the time …' + past simple → the other action was already complete.", "الدليل: By the time + ماضٍ بسيط ← الحدث الآخر كان قد اكتمل.")
        if s.startswith('by '): return ("Clue: 'By + a past time' → completed before that time.", "الدليل: By + زمن ماضٍ ← اكتمل قبل ذلك الوقت.")
        if 'before' in s: return ("Clue: 'before' → this action came first.", "الدليل: before ← هذا الحدث وقع أولًا.")
        if re.search(r'realised|discovered|noticed', s): return ("Clue: the action happened before he/they realised or discovered it.", "الدليل: الحدث وقع قبل أن يدرك أو يكتشف.")
    if cat == 'PC' and s.startswith('while'): return ("Clue: 'While' + the longer action in progress; the short action interrupts it.", "الدليل: While + الحدث الطويل المستمر، ويقطعه حدث قصير.")
    if cat in ('ALTHOUGH',): return ("Clue: after the gap there is a subject + verb.", "الدليل: بعد الفراغ يوجد فاعل + فعل.")
    if cat in ('DESPITE',): return ("Clue: after the gap there is only a noun phrase.", "الدليل: بعد الفراغ توجد عبارة اسمية فقط.")
    if cat == 'BECAUSE': return ("Clue: the second part is a reason with its own subject + verb.", "الدليل: الجزء الثاني سبب وله فاعل + فعل.")
    if cat == 'BECAUSE_OF': return ("Clue: the reason after the gap is a noun phrase.", "الدليل: السبب بعد الفراغ عبارة اسمية.")
    if cat == 'SO_THAT': return ("Clue: after the gap comes a new subject (+ can/could …).", "الدليل: بعد الفراغ يأتي فاعل جديد.")
    if cat == 'IN_ORDER_TO': return ("Clue: after the gap comes a base verb.", "الدليل: بعد الفراغ يأتي فعل في صيغة المصدر.")
    if cat == 'SUCH': return ("Clue: after the gap comes 'a/an + adjective + noun'.", "الدليل: بعد الفراغ يأتي a/an + صفة + اسم.")
    if cat == 'SO': return ("Clue: after the gap comes an adjective with no noun.", "الدليل: بعد الفراغ صفة بدون اسم.")
    if cat == 'MUSTNT': return ("Clue: the next sentence says it is illegal / forbidden / harmful.", "الدليل: الجملة التالية تقول إنه ممنوع أو ضار.")
    if cat == 'NO_NEED': return ("Clue: the next sentence says it is your choice / it is not a problem.", "الدليل: الجملة التالية تقول إنه اختيارك أو ليس مشكلة.")
    if cat == 'GOING': return ("Clue: 'but …' shows the plan did not happen.", "الدليل: but توضّح أن الخطة لم تتحقق.")
    if cat in ('USED_TO', 'WOULD'): return ("Clue: the sentence talks about how things were in the past.", "الدليل: الجملة تتحدث عن الماضي وكيف كانت الأمور.")
    return None

# ---------- vocabulary ----------
V = {
 'overestimate': ("overestimate = think something is bigger or more important than it really is.", "overestimate = يبالغ في تقدير الشيء ويظنه أكبر أو أهم مما هو عليه."),
 'underestimate': ("underestimate = think something is smaller or easier than it really is.", "underestimate = يقلّل من تقدير الشيء ويظنه أصغر أو أسهل مما هو عليه."),
 'overused': ("overused = used too much.", "overused = مستخدم بشكل مفرط."),
 'overuse': ("overuse = use something too much.", "overuse = يستخدم الشيء بإفراط."),
 'overrated': ("overrated = thought to be better or more important than it really is.", "overrated = يُقدَّر أكثر مما يستحق."),
 'predators': ("predators = animals that hunt and eat other animals (their 'prey').", "predators = الحيوانات المفترسة التي تصطاد غيرها (prey = الفريسة)."),
 'delicate': ("delicate = easily damaged.", "delicate = هشّ وسهل التلف."),
 'long': ("in the long run = over a long period of time, in the future.", "in the long run = على المدى الطويل."),
 'on display': ("on display = shown publicly for people to see (e.g. in a museum).", "on display = معروض أمام الناس (مثلًا في متحف)."),
 'in charge': ("in charge (of) = responsible for / managing something.", "in charge (of) = مسؤول عن الشيء ويديره."),
 'tears': ("in tears = crying.", "in tears = يبكي."),
 'got over': ("get over = recover from a bad experience (past: got over).", "get over = يتعافى من تجربة سيئة."),
 'get over': ("get over = recover from a bad experience.", "get over = يتعافى من تجربة سيئة."),
 'get by': ("get by = manage to live with very little (money, food, water…).", "get by = يتدبّر أمره بالقليل."),
 'took after': ("take after = look or behave like an older family member.", "take after = يشبه أحد أفراد العائلة الأكبر سنًّا في الشكل أو الطباع."),
 'took off': ("take off = (of a plane / spacecraft) leave the ground.", "take off = تُقلع (الطائرة أو المركبة)."),
 'get through to': ("get through to = succeed in contacting someone (by phone / radio).", "get through to = ينجح في الاتصال بشخص (بالهاتف أو اللاسلكي)."),
 'get around to': ("get around to = finally find time to do something.", "get around to = يجد الوقت أخيرًا لفعل شيء."),
 'look for': ("look for = try to find.", "look for = يبحث عن."),
 'get used': ("get used to = become accustomed to something new.", "get used to = يعتاد على شيء جديد."),
}
PREP = {  # (word before the gap, key) → collocation
 'threat': ("We say 'a threat TO something' (pose a threat to).", "نقول a threat TO (يشكّل تهديدًا لـ)."),
 'feed': ("We say 'feed ON something' (eat it as food).", "نقول feed ON (يتغذّى على)."),
 'effect': ("We say 'an effect ON something'.", "نقول an effect ON (تأثير على)."),
 'impact': ("We say 'an impact ON something'.", "نقول an impact ON (أثر على)."),
 'increase': ("We say 'an increase IN something' (the thing that goes up).", "نقول an increase IN (زيادة في)."),
 'decrease': ("We say 'a decrease IN something'.", "نقول a decrease IN (انخفاض في)."),
 'importance': ("We say 'the importance OF something'.", "نقول the importance OF (أهمية الشيء)."),
 'was': None,
}
PREP_FIXED = {'in tears': ("in tears = crying.", "in tears = يبكي."), 'in charge': ("in charge of = responsible for.", "in charge of = مسؤول عن."), 'on good terms': ("on good terms (with) = having a friendly relationship.", "on good terms = على علاقة طيبة.")}

def eding(key, q):
    if key.endswith('ing'):
        return ("-ing adjectives describe the thing or situation that CAUSES the feeling (the news was frightening).",
                "الصفات المنتهية بـ ing تصف الشيء أو الموقف الذي يسبب الشعور (مثل: the news was frightening).")
    return ("-ed adjectives describe how a PERSON feels (doctors were alarmed).",
            "الصفات المنتهية بـ ed تصف شعور الشخص (مثل: doctors were alarmed).")

def wf_note(key):
    k = key.lower()
    for suf, en, ar in [('tion', 'noun', 'اسم'), ('sion', 'noun', 'اسم'), ('ment', 'noun', 'اسم'), ('ity', 'noun', 'اسم'), ('ence', 'noun', 'اسم'), ('ery', 'noun', 'اسم'), ('ogy', 'noun', 'اسم'),
                        ('ious', 'adjective', 'صفة'), ('ous', 'adjective', 'صفة'), ('ive', 'adjective', 'صفة'), ('able', 'adjective', 'صفة'), ('ible', 'adjective', 'صفة'), ('al', 'adjective', 'صفة'),
                        ('ing', 'adjective', 'صفة'), ('ed', 'adjective / past participle', 'صفة / تصريف ثالث'), ('y', 'adjective', 'صفة'), ('ful', 'adjective', 'صفة')]:
        if k.endswith(suf):
            return (f"The gap needs {('an ' if en[0] in 'a' else 'a ')}{en} → '{key}' (suffix -{suf}).", f"الفراغ يحتاج إلى {ar} ← '{key}' (اللاحقة -{suf}).")
    return (f"Correct form: '{key}'.", f"الصيغة الصحيحة: '{key}'.")

READ = {
 'RD_MAIN': ("Main purpose / main idea: think about the WHOLE text, not one paragraph. Wrong options are usually too narrow or not in the text.", "الفكرة الرئيسة / الغرض: فكّر في النص كله لا في فقرة واحدة. الخيارات الخاطئة عادة ضيقة جدًا أو غير موجودة في النص."),
 'RD_DETAIL': ("Detail question: find the paragraph named in the question and scan for its key words.", "سؤال التفاصيل: اذهب إلى الفقرة المذكورة وابحث عن الكلمات المفتاحية."),
 'RD_VOCAB': ("Word in context: put each option in place of the word and check that the sentence keeps the same meaning.", "معنى الكلمة من السياق: ضع كل خيار مكان الكلمة وتأكد أن المعنى لم يتغير."),
 'RD_INFER': ("Inference: the answer is not written word for word; choose the option the text SUPPORTS, not the one that sounds strongest.", "الاستنتاج: الإجابة غير مكتوبة حرفيًا؛ اختر ما يدعمه النص لا الخيار الأقوى صياغةً."),
 'RD_REF': ("Reference: read the sentence before the word and find the noun it replaces.", "الإحالة: اقرأ الجملة السابقة وابحث عن الاسم الذي يعود إليه الضمير."),
 'RD_TFNG': ("T = the text says the same. F = the text says the opposite. NM = the text does not give this information at all.", "T = النص يقول المعلومة نفسها. F = النص يقول عكسها. NM = النص لا يذكرها إطلاقًا."),
}

out = {}
pth = open(os.path.join(ROOT, 'pathways/g11-advanced.js'), encoding='utf-8').read()
TAGS = json.loads(pth[pth.index('{'):pth.rindex('}') + 1])['tests']
for T in DATA:
    t = str(T['n']); tags = TAGS[t]['items']; F = out[t] = {}
    for i, q in enumerate(T['q9']):
        key = q['o'][q['a']]; kc = gcat(key, q['q'])
        cl = clue(q['q'], kc)
        e = {'k': key, 'en': G[kc][0], 'ar': G[kc][1], 'not': []}
        if cl: e['en'] += ' ' + cl[0]; e['ar'] += ' ' + cl[1]
        for j, o in enumerate(q['o']):
            if j == q['a']: continue
            c = gcat(o, q['q'])
            if c == kc: continue
            e['not'].append([o, G[c][0], G[c][1]])
        F['g%d' % i] = e
    for i, q in enumerate(T['q7']):
        key = q['o'][q['a']]; tag = tags['v%d' % i]; e = {'k': key, 'not': []}
        if tag == 'VO_EDING': e['en'], e['ar'] = eding(key, q['q'])
        elif tag == 'VO_PREP':
            w = re.search(r'(\w+)\s+_{3,}', q['q']); w2 = re.search(r'_{3,}\s+(\w+(?:\s+\w+)?)', q['q'])
            nxt = w2.group(1).lower().split() if w2 else []
            fixed = PREP_FIXED.get(' '.join([key] + nxt[:2])) or PREP_FIXED.get(' '.join([key] + nxt[:1]))
            col = PREP.get(w.group(1).lower()) if w else None
            if fixed: e['en'], e['ar'] = fixed
            elif col: e['en'], e['ar'] = col
            else: raise SystemExit('no preposition rule: ' + q['q'])
        elif key in V: e['en'], e['ar'] = V[key]
        else: raise SystemExit('no vocabulary note: ' + key + ' / ' + q['q'])
        if tag == 'VO_PREF' or key in ('overestimate', 'underestimate', 'overuse', 'overused', 'overrated'):
            e['en'] += " Prefix over- = too much; under- = too little."; e['ar'] += " البادئة over- = أكثر من اللازم، و under- = أقل من اللازم."
        if tag == 'VO_EDING':
            for o in q['o']:
                if o != key and not re.search(r'(ed|ing)$', o): e['not'].append([o, "This is not an adjective (it is a noun or a verb), so it cannot describe the noun here.", "هذه ليست صفة (اسم أو فعل)، فلا تصف الاسم هنا."])
                elif o != key: e['not'].append([o, eding(o, q['q'])[0], eding(o, q['q'])[1]])
        if key in V and tag == 'VO_TOPIC':
            for o in q['o']:
                if o != key and o in V: e['not'].append([o, V[o][0], V[o][1]])
        F['v%d' % i] = e
    for i, q in enumerate(T['q8']):
        F['wf%d' % i] = {'k': q['a'], 'en': wf_note(q['a'])[0], 'ar': wf_note(q['a'])[1], 'not': []}
    for i, q in enumerate(T['q1']):
        tg = tags['a%d' % i]; F['a%d' % i] = {'k': q['o'][q['a']], 'en': READ[tg][0], 'ar': READ[tg][1], 'not': []}
    for i, q in enumerate(T['q2']):
        F['tf%d' % i] = {'k': q['a'], 'en': READ['RD_TFNG'][0], 'ar': READ['RD_TFNG'][1], 'not': []}

os.makedirs(os.path.join(ROOT, 'feedback'), exist_ok=True)
js = '/* generated by src/feedback/build_g11_feedback.py — do not edit by hand */\nwindow.SSH_FB_ITEMS=' + json.dumps({'page': 'g11-advanced.html', 'tests': out}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'feedback/g11-advanced.js'), 'w', encoding='utf-8').write(js)
n = sum(len(v) for v in out.values())
print('items with explanations:', n, '· bytes:', len(js.encode()))
