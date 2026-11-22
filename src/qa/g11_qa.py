"""Grade 11 Advanced Tests · curriculum map + question-by-question QA
    python3 src/qa/g11_qa.py [out_dir]
Writes:
  curriculum/g11-advanced-map.csv / .json  one row per scored item (330 items) with skill, module, page refs
                                           and an explicit verification status for every curriculum field
  <out_dir>/g11-qa-items.csv                one row per item: automated checks + reviewer findings
  <out_dir>/g11-qa-summary.json             counts, difficulty distribution per test, open findings
Rules: nothing is invented. A field we could not verify is written as PENDING VERIFICATION."""
import json, os, re, sys, csv, difflib
from collections import Counter, defaultdict
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'src', 'qa', 'out')
os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(ROOT, 'curriculum'), exist_ok=True)

def js_obj(path):
    s = open(os.path.join(ROOT, path), encoding='utf-8').read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])
html = open(os.path.join(ROOT, 'g11-advanced.html'), encoding='utf-8').read()
i = html.index('const DATA=') + 11; d = 0
for j in range(i, len(html)):
    if html[j] == '[': d += 1
    elif html[j] == ']':
        d -= 1
        if d == 0: break
DATA = json.loads(html[i:j + 1])
SK = js_obj('pathways/skills.js'); PG = js_obj('pathways/g11-advanced.js'); CRUB = js_obj('cr/g11-advanced.js')['tests']
PEND = 'PENDING VERIFICATION'

# ---------- reviewer findings (manual, question by question; severity: high / medium / low) ----------
F = {
 (5, 'g3'): ('high', 'ambiguous-key', "'Before oil was discovered, most families ___ in tents': 'lived' (past simple) is also correct — with 'before' the sequence is already clear, so the past perfect is not obligatory. Two defensible answers.", "Rewrite the stem so only the past perfect fits, e.g. 'By the time oil was discovered, most families ___ in tents for centuries.'"),
 (7, 'g5'): ('medium', 'ambiguous-key', "'You ___ worry about small mistakes. Everyone makes them.' In British English 'You mustn't worry' is a common reassurance, so a strong student may defend 'mustn't'.", "Change the follow-up to force 'not necessary', e.g. 'It's your choice whether you mention them.' or accept both."),
 (9, 'g1'): ('medium', 'ambiguous-key', "'Engineers discovered that the tank ___ before the launch': 'was damaged' is also acceptable because 'before the launch' fixes the order.", "Remove 'before the launch' or use 'By the time of the launch, the tank ___'."),
 (5, 'rw2'): ('medium', 'unclear-instruction', "Two bracket prompts '(get used to) (got used to)' — students do not know which one to use; the checker treats both as the target.", "Show one prompt: '(got used to)'."),
 (3, 'rw1'): ('medium', 'logic', "Source sentence 'Although the city is large, it has many parks' has no real contrast (large cities can easily have many parks), which makes the concession structure confusing.", "Use a real contrast, e.g. 'Although the city is very hot, it has many green parks.'"),
 (1, 'rw2'): ('low', 'clarity', "Model answer 'Before the fish ate the plastic, it had entered the sea' — 'it' could refer to the fish or the plastic.", "Model: 'The plastic had entered the sea before the fish ate it.' (already accepted)."),
 (1, 'q4_0'): ('medium', 'rubric-over-accepts', "Rubric 'under|less than' + 'plastic' accepted 'plastic under the sea'.", "Fixed in cr/g11-advanced.extra.js (reject 'under the sea/water/ocean'). Teacher to review other wording."),
 (5, 'q3'): ('high', 'rubric-over-accepts', "Rubric accepted any answer containing 'three', e.g. 'three weeks'.", "Fixed in cr/g11-advanced.extra.js (reject three + weeks/months/years/hours/nights)."),
 (2, 'q5'): ('medium', 'rubric-under-accepts', "'They did not have enough lifeboats' (correct) scored 0 for that point.", "Fixed in cr/g11-advanced.extra.js (extra wording)."),
 (5, 'q4_1'): ('medium', 'rubric-over-accepts', "Single broad keyword group (oil|towns|cities|jobs|schools|houses…) accepts unrelated answers such as 'they went to cities for holidays'.", "Require two concepts (change + oil/settled) or route single-keyword answers to teacher review."),
 (2, 'v7_3'): ('low', 'collocation', "Q8.3 'The voyage … was ___ (adventure)' → 'adventurous' is usually used for people; 'an adventure' would be more natural.", "Use 'The young passengers were ___ (adventure)'."),
 (6, 'v3'): ('low', 'weak-distractors', "Options 'humorous / reusable / spacious' are implausible beside 'delicate ecosystems'; the item tests little.", "Use near-meaning distractors, e.g. 'fragile-looking / sensitive / tender / brittle' with one clear collocation."),
 (1, 'g5'): ('low', 'distractor-form', "Option 'shouldn't to' is ungrammatical in itself; students can eliminate it without knowing the target.", "Use 'shouldn't' with a context that makes it weaker than 'mustn't', or 'can'."),
}
# recycled targets across tests (by design for revision, but they reduce coverage in a single sitting)
REUSE_NOTE = "Same target item appears in other tests: {}"

# ---------- helpers ----------
def kind(id):
    return {'a': 'Reading MCQ', 'tf': 'Reading T/F/NM', 'q3': 'Reading short answer', 'q4': 'Reading reference', 'q5': 'Reading 2-point answer', 'q6': 'Reading 2-point answer',
            'v': 'Vocabulary MCQ', 'wf': 'Word formation', 'g': 'Grammar MCQ', 'rw': 'Grammar rewrite'}[re.match(r'(a|tf|q3|q4|q5|q6|v|wf|g|rw)', id).group(1)]
def marks(id): return 2 if id in ('q5', 'q6') else 1
def section(id): return 'Reading' if re.match(r'(a|tf|q)', id) else 'Vocabulary' if re.match(r'(v|wf)', id) else 'Grammar'
CHALL_SK = {'RD_INFER', 'GR_PASTPERF', 'GR_PASS', 'GR_SOSUCH'}
def difficulty(id, sk):
    """estimate only (not calibrated): F = foundation, I = intermediate, C = challenging"""
    if id.startswith('tf') or sk in ('RD_DETAIL',) and id.startswith('a') or sk in ('VO_PREP',): return 'F'
    if id.startswith('rw') or id in ('q5', 'q6') or sk in CHALL_SK: return 'C'
    if id.startswith('q4') or id == 'q3': return 'I'
    return 'I'

# ---------- verified against the SSH Grade 11 Term 1 Revision Booklet (Drive 1BMiS4hS55KvdODUkYb2I27A6luSDrvbS, read 22 Nov 2026) ----------
# The booklet is teacher-made (not an official document). It states "Modules 3, 4 and 5" and cites Student's Book
# pages for each vocabulary topic and writing genre. Grammar and reading topics carry NO module or page in the booklet.
BK_SRC = "SSH G11 Term 1 Revision Booklet 2025-26"
BK_TOPICS = [  # (module, SB page as cited by the booklet, topic, words/keys listed in the booklet)
 (3, 'p.40', 'Expressions with on and in', {'on behalf of','on display','on fire','on good terms','on holiday','on purpose','on sale','on second thoughts','on the phone','on the run','on the verge of','on tour','in a hurry','in a mess','in cash','in charge','in debt','in particular','in public','in tears','in the long run','in the future','in the meantime','in the mood','in trouble'}),
 (3, 'p.40-41', 'Phrasal verbs with get, take and look', {'get away','get around to','take over','get along with','get over','got over','take on','get by','take after','took after','look for','get through to','take off','took off','take down'}),
 (4, 'p.54', 'The natural world', {'marine','biodiversity','ecosystem','food chain','delicate','predator','predators','pose','prey'}),
 (4, 'p.54', 'Nouns + prepositions', {'advantage of','impact on','damage to','importance of','effect on','solution to','decrease in','feed on','threat to','increase in','need for','reason for'}),
 (4, 'p.55', 'Prefixes over- and under-', {'overachieve','underachieve','undercharge','overcook','overcharge','underestimate','overpay','underpay','overrate','overrated','underrate','overuse','overused','undercook','overestimate','underuse','overfeed','underfeed'}),
 (5, 'p.70', '-ed and -ing adjectives', {'appalled','appalling','pleased','pleasing','disgusted','disgusting','alarmed','alarming','disappointed','disappointing','embarrassed','embarrassing','confused','confusing','depressed','depressing'}),
 (5, 'p.70 and p.76', 'Forming nouns and adjectives', {'disappointment','connection','cancellation','achievement','prevention','imagination','development','motivation','inspiration','decision','introduction','description','explanation','application','satisfaction','beneficial','intensive','healthy','spacious','accessible','financial','decisive','dirty','adventurous','predictable','educational','cooperative','risky','humorous','reusable','global','protective','dusty','furious','advisable'}),
]
BK_GRAMMAR = {'GR_PAST': 'Past simple and past continuous', 'GR_USED': 'used to · would · be / get used to · was going to', 'GR_FUT': 'used to · would · be / get used to · was going to',
              'GR_PASTPERF': 'Past perfect', 'GR_CAUSE': 'Clauses of reason, concession, result and purpose', 'GR_CONTR': 'Clauses of reason, concession, result and purpose',
              'GR_PURP': 'Clauses of reason, concession, result and purpose', 'GR_SOSUCH': 'Clauses of reason, concession, result and purpose',
              'GR_MOD_ADV': 'Modal verbs', 'GR_MOD_OBL': 'Modal verbs'}
def booklet_match(key, stem, sk):
    """-> (verification, module, sb_page, topic)"""
    k = key.lower().strip(); s = stem.lower()
    cands = {k}
    m = re.search(r'_{3,}\s+([a-z]+(?:\s+[a-z]+)?)', s); after = m.group(1).split() if m else []
    b = re.search(r'([a-z]+)\s+_{3,}', s); before = b.group(1) if b else ''
    if after: cands |= {k + ' ' + after[0], k + ' ' + ' '.join(after[:2])}
    if before: cands.add(before + ' ' + k)
    if k == 'long': cands.add('in the long run')
    for mod, pg, topic, words in BK_TOPICS:
        if cands & words: return ('VERIFIED against SSH Revision Booklet (booklet cites SB ' + pg + ')', 'Module %d' % mod, pg + ' (as cited in the SSH booklet)', topic)
    if sk in BK_GRAMMAR: return ('PARTLY VERIFIED: topic is in the booklet (Term 1, Modules 3-5) but the booklet gives no module or page', PEND, PEND, BK_GRAMMAR[sk])
    if sk and sk.startswith('RD_'): return ('PARTLY VERIFIED: reading skill in the booklet (section 9); no module or page', PEND, PEND, 'Reading skills')
    if sk == 'GR_PASS': return ('NOT IN BOOKLET: the passive is not a Term 1 booklet topic; check the specification', PEND, PEND, '')
    return ('NOT FOUND in booklet word lists: needs Student\'s Book check', PEND, PEND, '')

items = []
for T in DATA:
    t = T['n']; tags = PG['tests'][str(t)]['items']
    rows = [('a%d' % k, q) for k, q in enumerate(T['q1'])] + [('tf%d' % k, q) for k, q in enumerate(T['q2'])] + [('q3', T['q3'])] + \
           [('q4_%d' % k, q) for k, q in enumerate(T['q4'])] + [('q5', T['q5']), ('q6', T['q6'])] + [('v%d' % k, q) for k, q in enumerate(T['q7'])] + \
           [('wf%d' % k, q) for k, q in enumerate(T['q8'])] + [('g%d' % k, q) for k, q in enumerate(T['q9'])] + [('rw%d' % k, q) for k, q in enumerate(T['q10'])]
    for id, q in rows:
        sk = tags.get(id.split('_')[0] if id.startswith('q4') is False and id not in tags else id) or tags.get(id)
        s = SK.get(sk, {}); mi = (s.get('mi') or {}).get('11') or {}
        res = [r for r in (s.get('res') or {}).get('11', []) if r.get('k') != 'rule']
        stem = q.get('q') or q.get('s') or q.get('t') or ''
        key = (q['o'][q['a']] if 'o' in q else (q['a'] if isinstance(q.get('a'), str) else ' | '.join(q.get('a') or [])))
        items.append(dict(test=t, title=T['title'], item=id, section=section(id), type=kind(id), marks=marks(id), stem=stem, key=key,
            skill=sk, skill_en=s.get('en', ''), skill_ar=s.get('ar', ''), objective=s.get('obj', ''),
            grade=11, term=f"Term {PG.get('term')} (page-level tag; {PEND})" if PG.get('term') else PEND,
            module=(f"Module {mi['mod']}" if mi.get('mod') else PEND), lesson=mi.get('lesson') or PEND,
            sb_page=(f"{mi['sb']} (from SSH Revision Booklet; not checked against the Student's Book)" if mi.get('sb') else PEND),
            wb_page=PEND, standard=PEND,
            booklet=(f"Revision Booklet p.{mi['bk']} · {mi.get('bks','')}" if mi.get('bk') else PEND),
            resources=' ; '.join(r['url'] for r in res) or PEND,
            difficulty=difficulty(id, sk)))
        bv = booklet_match(key, stem, sk)
        it = items[-1]; it['verification'] = bv[0]; it['booklet_topic'] = bv[3]
        it['module'] = bv[1] if bv[1] != PEND else it['module'] if 'Module' in it['module'] and not bv[0].startswith(('NOT', 'PARTLY')) else PEND
        it['sb_page'] = bv[2]
        it['term'] = 'Term 1 (VERIFIED against SSH booklet: "End of Term 1, Modules 3, 4 and 5")'

# ---------- automated checks ----------
stems = defaultdict(list)
for it in items: stems[(it['type'], it['key'].lower())].append(it)
def near_dups(it):
    out = []
    for o in items:
        if o is it or o['type'] != it['type'] or o['test'] == it['test']: continue
        if difflib.SequenceMatcher(None, it['stem'].lower(), o['stem'].lower()).ratio() > 0.72: out.append(f"T{o['test']} {o['item']}")
    return out
for it in items:
    checks = []
    T = DATA[it['test'] - 1]; id = it['item']
    if it['type'].endswith('MCQ'):
        arr = T['q1'] if id[0] == 'a' else T['q7'] if id[0] == 'v' else T['q9']; q = arr[int(id[1:])]
        if not (0 <= q['a'] < len(q['o'])): checks.append('KEY INDEX INVALID')
        if len(set(o.lower() for o in q['o'])) != len(q['o']): checks.append('duplicate options')
        if id[0] in 'vg' and not re.search(r'_{3,}', q['q']): checks.append('no gap in stem')
        lens = [len(o) for o in q['o']]
        if id[0] == 'a' and max(lens) == len(q['o'][q['a']]) and max(lens) > 1.6 * sorted(lens)[-2]: checks.append('key is noticeably the longest option (test-wise cue)')
    if it['type'] == 'Grammar rewrite':
        q = T['q10'][int(id[2:])]; br = re.findall(r'\(([^)]*)\)', q['s'])
        if len(br) != 1: checks.append(f'{len(br)} bracket prompts')
        if br and not all(w in q['a'].lower() for w in re.sub(r'…|\.\.\.', ' ', br[-1].lower()).split() if w not in ('had',)): checks.append('model answer does not use the bracket word')
        if id not in CRUB[str(it['test'])]: checks.append('no rubric entry')
    if it['type'] == 'Word formation':
        q = T['q8'][int(id[2:])]; m = re.search(r'\(([^)]+)\)', q['s']); base = m.group(1).lower() if m else ''
        if base[:3] != q['a'].lower()[:3] and base[:2] != q['a'].lower()[:2]: checks.append(f"key '{q['a']}' does not look derived from '{base}'")
    if it['type'].startswith('Reading') and id[0] == 'q' and id not in CRUB[str(it['test'])] and id.split('_')[0] not in CRUB[str(it['test'])]: checks.append('no rubric entry')
    if it['type'] in ('Reading short answer', 'Reading reference', 'Reading 2-point answer'):
        rub = CRUB[str(it['test'])].get(id, {})
        if any(len(f['all']) == 1 and not idea.get('review') for idea in rub.get('ideas', []) for f in idea['forms']) and id not in ('q5', 'q6'):
            checks.append('single-keyword rubric (risk of accepting off-target answers)')
    rep = [f"T{o['test']} {o['item']}" for o in stems[(it['type'], it['key'].lower())] if o is not it] if it['type'] in ('Vocabulary MCQ', 'Word formation') else []
    nd = near_dups(it) if it['type'] in ('Grammar MCQ', 'Vocabulary MCQ', 'Grammar rewrite') else []
    if rep: checks.append(REUSE_NOTE.format(', '.join(rep)))
    if nd: checks.append('very similar stem in ' + ', '.join(nd))
    f = F.get((it['test'], id)) or (F.get((it['test'], 'v7_%d' % (int(id[2:]) + 1))) if id.startswith('wf') else None)
    it['auto_checks'] = ' ; '.join(checks) or 'pass'
    it['finding_severity'], it['finding_type'], it['finding'], it['recommendation'] = f if f else ('', '', '', '')
    it['status'] = 'needs teacher decision' if f and f[0] in ('high', 'medium') and 'Fixed in' not in f[3] else ('fixed (pending approval)' if f and 'Fixed in' in f[3] else 'ok')

# ---------- write ----------
mapcols = ['test', 'title', 'item', 'section', 'type', 'marks', 'grade', 'term', 'verification', 'booklet_topic', 'module', 'lesson', 'skill', 'skill_en', 'skill_ar', 'objective', 'difficulty', 'standard', 'sb_page', 'wb_page', 'booklet', 'resources', 'stem', 'key']
with open(os.path.join(ROOT, 'curriculum/g11-advanced-map.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.DictWriter(fh, fieldnames=mapcols, extrasaction='ignore'); w.writeheader(); w.writerows(items)
json.dump([{k: it[k] for k in mapcols} for it in items], open(os.path.join(ROOT, 'curriculum/g11-advanced-map.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
qacols = ['test', 'item', 'section', 'type', 'marks', 'skill', 'difficulty', 'stem', 'key', 'auto_checks', 'finding_severity', 'finding_type', 'finding', 'recommendation', 'status']
with open(os.path.join(OUT, 'g11-qa-items.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.DictWriter(fh, fieldnames=qacols, extrasaction='ignore'); w.writeheader(); w.writerows(items)

dist = {}
for T in DATA:
    its = [x for x in items if x['test'] == T['n']]; tot = sum(x['marks'] for x in its)
    c = Counter(); [c.update({x['difficulty']: x['marks']}) for x in its]
    dist[T['n']] = {k: round(100 * c[k] / tot) for k in 'FIC'}
summary = dict(items=len(items), marks_auto_per_test=sum(x['marks'] for x in items if x['test'] == 1),
    findings=Counter(x['finding_severity'] for x in items if x['finding_severity']),
    auto_flags=sum(1 for x in items if x['auto_checks'] != 'pass'),
    auto_flag_types=Counter(re.sub(r'(T\d+ \w+(, )?)+', '…', c.split(':')[0]) for x in items for c in x['auto_checks'].split(' ; ') if c != 'pass'),
    difficulty_pct_of_34_auto_marks=dist,
    verification=Counter(x['verification'].split(':')[0].split(' (')[0] for x in items),
    curriculum_fields={k: Counter('verified-or-sourced' if PEND not in str(x[k]) else 'pending' for x in items) for k in ('module', 'lesson', 'sb_page', 'wb_page', 'standard', 'booklet', 'resources')})
json.dump(summary, open(os.path.join(OUT, 'g11-qa-summary.json'), 'w'), indent=1, default=dict)
print(json.dumps(summary, indent=1, default=dict))
