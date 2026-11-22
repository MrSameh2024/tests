# -*- coding: utf-8 -*-
"""Tag every item of every graded test with a skill and build the per-page
pathway data files + the curriculum map.

usage:  python3 src/pathways/tag.py <repo>
writes: <repo>/pathways/<page>.js       (loaded by the test page, before ssh-pathways.js)
        <repo>/pathways/skills.js       (all skills, for my-revision-plan.html)
        <repo>/pathways/curriculum-map.json / .csv  (Task 18 map)
        <repo>/pathways/tag-report.txt  (every item with its skill, for review)
"""
import json, re, sys, os, subprocess, csv
from collections import defaultdict, OrderedDict
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from catalog import SKILLS, MODULES, G12_MOD_TITLES

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'pathways')
os.makedirs(OUT, exist_ok=True)
REPORT = []

def read(f): return open(os.path.join(REPO, f), encoding='utf-8').read()

def json_const(src, name):
    i = src.find('const %s=' % name)
    if i < 0: i = src.find('const %s =' % name)
    if i < 0: raise KeyError(name)
    j = src.find('=', i) + 1
    while src[j] == ' ': j += 1
    return json.JSONDecoder().raw_decode(src[j:])[0]

def js_consts(src, names):
    """Evaluate plain JS object/array literals (module-test-4) with node."""
    chunks = []
    for n in names:
        i = src.find('const %s=' % n)
        j = src.find('=', i) + 1
        depth = 0; k = j; q = None
        while True:
            c = src[k]
            if q:
                if c == '\\': k += 2; continue
                if c == q: q = None
            elif c in '\'"`': q = c
            elif c in '[{': depth += 1
            elif c in ']}':
                depth -= 1
                if depth == 0: break
            k += 1
        chunks.append('%s:(%s)' % (n, src[j:k + 1]))
    js = 'const o={%s};console.log(JSON.stringify(o,(k,v)=>v instanceof RegExp?String(v):v))' % ','.join(chunks)
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

# ------------------------------------------------------------------ classifiers
STATIVE = r'\b(know|knows|own|owns|belong|belongs|smell|smells|taste|tastes|seem|seems|weigh|weighs|believe|believes|want|wants|need|needs|prefer|prefers|understand|understands|mean|means|contain|contains|cost|costs|love|loves|hate|hates|like|likes|remember|recognise|sound|sounds|look|looks|feel|feels|appear|appears|depend|depends|consist)\b'
PREPS = {'to','on','for','of','with','in','at','from','about','by','into','off','out','up','upon','over','under','through','against','after','away','down','back'}
PP_IRR = r'(taken|given|known|built|done|made|written|spoken|shown|seen|found|sold|told|said|held|kept|left|lost|taught|thought|bought|brought|caught|sent|spent|paid|laid|put|set|cut|hit|run|won|grown|thrown|drawn|driven|eaten|fallen|forgotten|hidden|ridden|risen|stolen|sunk|swum|worn|chosen|frozen|broken|woken|born|begun|drunk|sung|rung|become|come|gone|been|had)'

def g_mcq(q, opts, ans):
    a = ans.strip().lower(); O = [o.lower() for o in opts]; Q = q.lower()
    j = ' | '.join(O)
    if a in ('who', 'which', 'whose', 'whom', 'where', 'that') and sum(o in ('who','which','whose','whom','where','when','that') for o in O) >= 2: return 'GR_REL'
    if a in ('although', 'despite', 'in spite of', 'even though', 'though'): return 'GR_CONTR'
    if a in ('because', 'because of', 'as', 'since') and any(o in ('because of','because','despite','although') for o in O): return 'GR_CAUSE'
    if a in ('so that', 'in order to'): return 'GR_PURP'
    if a in ('so', 'such', 'such a') and any(o in ('so','such','such a','too') for o in O): return 'GR_SOSUCH'
    if a in ('since', 'for', 'yet', 'already', 'just', 'ever', 'never', 'so far') and any(o in ('since','for','ago','yet','already','just','ever') for o in O): return 'GR_PPERF'
    if re.match(r"how about|what about|let's|shall\b", a) or a == 'shall': return 'GR_MOD_OFF'
    if a == 'may' and re.search(r'\?\s*[—-]', q): return 'GR_MOD_OFF'
    if a in ('could', 'can') and 'when' in Q: return 'GR_MOD_OFF'
    if a in ('must', "can't", 'may', 'might', 'could') and re.search(r'_{3,}\s+(be|have been|understand|disappear)', Q): return 'GR_MOD_DED'
    if a in ('may', 'might'): return 'GR_MOD_DED'
    if a in ("mustn't", "don't have to", "doesn't have to", "didn't have to", "needn't", "don't need to", 'had to', 'have to', 'must', "aren't allowed", "isn't allowed", "weren't allowed"): return 'GR_MOD_OBL'
    if a in ('should', "shouldn't", 'ought to'): return 'GR_MOD_ADV'
    if a in ('a', 'an', 'the', '-', '—', 'no article', '(no article)'): return 'GR_ART'
    if re.search(r'\b(more|most|less|least)\b|est\b|er\b', a) and re.search(r'\b(more|most|less|least)\b|est\b|er\b', j) and not re.search(r'\b(was|were|is|are|have|has|had)\b', a): return 'GR_COMP'
    if re.search(r'^(if|unless|providing|provided|as long as|in case|when)\b', a) and any(o.startswith(('if','unless','provid')) for o in O): return 'GR_COND'
    if re.search(r'\bwould\b', a) and re.search(r'\bif\b', Q): return 'GR_COND'
    if re.search(r'(used to|use to|would)\b', a) or (a.endswith('ing') and 'used to' in Q): return 'GR_USED'
    if re.search(r'(was|were) going to|going to|\bwill\b(?! (be \w+ing|have))|\bwon\'t\b|\'ll\b', a): return 'GR_FUT'
    if re.search(r'will (be \w+ing|have)', a): return 'GR_FUTCP'
    if re.search(r'^(is|are|was|were|has been|have been|had been|will be|be|being|am)\s+(\w+ed|%s)\b' % PP_IRR, a) and not re.search(r'\w+ing$', a): return 'GR_PASS'
    if re.search(r'^had\b', a): return 'GR_PASTPERF'
    if re.search(r'^(have|has)\b', a) or any(o.startswith(('have ', 'has ')) for o in O): return 'GR_PPERF'
    if re.search(r'^(was|were)\s+\w+ing', a): return 'GR_PAST'
    if re.search(r'^(am|is|are)\s+\w+ing', a) or re.search(r'\b(look!|listen!|now|at the moment|always)\b', Q): return 'GR_PRES'
    if re.search(STATIVE, a): return 'GR_STAT'
    if re.search(r'\b(said|told|asked)\b', Q + ' ' + a): return 'GR_REP'
    return None

def g_verb(s, a):
    """a verb-in-brackets item: classify by the target answer."""
    a = a.split(' / ')[0].strip().lower(); S_ = s.lower()
    if re.search(r'\b(if|unless|in case|as long as|providing)\b', S_): return 'GR_COND'
    if re.search(r'will (be \w+ing|have)', a): return 'GR_FUTCP'
    if re.search(r'\bwill\b|\'ll\b|going to', a): return 'GR_FUT'
    if re.search(r'^had\b', a): return 'GR_PASTPERF'
    if re.search(r'^(have|has)\b', a): return 'GR_PPERF'
    if re.search(r'^(was|were) \w+ing', a): return 'GR_PAST'
    if re.search(r'(is|are|was|were|been) (\w+ed|%s)$' % PP_IRR, a): return 'GR_PASS'
    if re.search(r'^(am|is|are) \w+ing', a) or re.search(r'\balways\b', a): return 'GR_PRES'
    if re.search(STATIVE, a): return 'GR_STAT'
    if re.search(r'used to|would', a): return 'GR_USED'
    if 'if' in S_.split() or 'unless' in S_: return 'GR_COND'
    if re.search(r'\b(yesterday|ago|last|in 19|in 20|when)\b', S_) or re.search(r'\b(and|then)\s*\(\w+\)', S_) and re.search(r'ed$|%s$' % PP_IRR, a): return 'GR_PAST'
    if re.search(r'\b(every|usually|always|often|never)\b', S_) or re.search(r'^\w+s$', a): return 'GR_PRES'
    return None

def g_rewrite(prompt, ans):
    p = prompt.lower(); a = ans.lower()
    m = re.findall(r'\(([^)]*)\)', p); kw = m[-1].strip() if m else ''
    kw2 = ' '.join(m)
    if 'passive' in kw2: return 'GR_PASS'
    if re.search(r'\b(when|while)\b', kw) and re.search(r'\b(was|were) \w+ing', a): return 'GR_PAST'
    if kw in ('while',): return 'GR_PAST'
    if re.search(r'so … that|so \.\.\. that|such … that|such \.\.\. that|^so$|^such$', kw): return 'GR_SOSUCH'
    if kw in ('so that', 'in order to', 'to'): return 'GR_PURP'
    if re.search(r'^(although|despite|in spite of|even though|though|however)$', kw): return 'GR_CONTR'
    if re.search(r'^(who|which|whose|where|when|whom|that)$', kw): return 'GR_REL'
    if re.search(r'^(for|since|never … before|never \.\.\. before|yet|already|just|ever)$', kw) or 'never' in kw: return 'GR_PPERF'
    if re.search(r'(after|before|by the time)', kw) or re.search(r'\bhad (\w+ed|%s)\b' % PP_IRR, a) and kw in ('after', 'before'): return 'GR_PASTPERF'
    if re.search(r"(don't|didn't|doesn't) have to|mustn't|^must$|had to|needn't|allowed", kw): return 'GR_MOD_OBL'
    if kw in ('should', 'ought to', 'had better'): return 'GR_MOD_ADV'
    if kw in ('may', 'might', 'could', 'must be', "can't"): return 'GR_MOD_DED'
    if re.search(r'shall|how about|let\'s|what about', kw): return 'GR_MOD_OFF'
    if re.search(r'used to|would|get used|be used|^use$', kw2) or kw == 'use': return 'GR_USED'
    if kw in ('how long',): return 'GR_PPERF'
    if kw in ('habit', 'always') : return 'GR_PRES'
    if re.search(r'going to', kw): return 'GR_FUT'
    if re.search(r'^(if|unless|providing|provided|as long as|in case|otherwise)', kw): return 'GR_COND'
    if re.search(r'(offer|promis|advis|refus|suggest|warn|remind|agree|apologi|admit|deny|deni|accus|blam|threat|invit|insist|beg|congratul|encourag|persuad)', kw): return 'GR_REPV'
    if re.search(r'^(said|told|asked|wanted to know)', kw): return 'GR_REP'
    if re.search(r'oldest|longest|most|more|less|bigger|smaller|-est|than|as … as|as \.\.\. as|best|worst', kw) or re.search(r'est\b|\bmore\b|\bthan\b', kw): return 'GR_COMP'
    if kw in ('always',): return 'GR_PRES'
    if re.search(STATIVE, kw): return 'GR_STAT'
    if re.search(r'will have|by next|by the end', kw + ' ' + a): return 'GR_FUTCP'
    return None

def v_mcq(q, opts, ans):
    O = [o.lower().strip() for o in opts]
    if all(o in PREPS for o in O): return 'VO_PREP'
    a = ans.lower().strip()
    if sum(o.startswith(('over', 'under')) for o in O) >= 3: return 'VO_PREF'
    if len({o[:4] for o in O}) == 1 and len(O[0]) >= 4:
        if (a.endswith('ed') and any(o.endswith('ing') for o in O)) or (a.endswith('ing') and any(o.endswith('ed') for o in O)): return 'VO_EDING'
        return 'VO_WF'
    return 'VO_TOPIC'

def r_mcq(q):
    Q = q.lower()
    if re.search(r'mainly|main (idea|purpose)|best title|purpose|the text is about|mainly about', Q): return 'RD_MAIN'
    if re.search(r'closest in meaning|means|meaning|the word|synonym|opposite', Q): return 'RD_VOCAB'
    if re.search(r'infer|suggest|imply|implies|probably|we can conclude|tone|attitude|view', Q): return 'RD_INFER'
    if re.search(r'refer', Q): return 'RD_REF'
    return 'RD_DETAIL'

def w_genre(t):
    t = t.lower()
    for k, g in [('cover letter', 'WR_COVER'), ('advantages', 'WR_ADVDIS'), ('informal email', 'WR_IEMAIL'),
                 ('formal email', 'WR_FEMAIL'), ('article', 'WR_ARTICLE'), ('report', 'WR_REPORT'), ('forum', 'WR_FORUM'),
                 ('diary', 'WR_DIARY'), ('announcement', 'WR_ANNOUNCE'), ('cause and effect', 'WR_CAUSE'),
                 ('summary', 'WR_SUMMARY'), ('discussion', 'WR_DISCUSS'), ('narrative', 'WR_NARR'),
                 ('personal narrative', 'WR_NARR'), ('story', 'WR_STORY')]:
        if k in t: return g
    return 'WR_GENERAL'

def need(sk, fallback, where):
    if sk: return sk
    REPORT.append('  ! fallback %s for %s' % (fallback, where)); return fallback

# ------------------------------------------------------------------ per-engine taggers
def tag_g1011(page):
    D = json_const(read(page), 'DATA'); tests = OrderedDict()
    for T in D:
        it = OrderedDict(); txt = {}
        for i, q in enumerate(T['q1']): it['a%d' % i] = r_mcq(q['q']); txt['a%d' % i] = q['q']
        for i, q in enumerate(T['q2']): it['tf%d' % i] = 'RD_TFNG'; txt['tf%d' % i] = q['s']
        it['q3'] = 'RD_DETAIL'; txt['q3'] = T['q3']['q']
        for i, r in enumerate(T['q4']): it['q4_%d' % i] = 'RD_REF'; txt['q4_%d' % i] = r['t']
        it['q5'] = 'RD_LIST'; it['q6'] = 'RD_LIST'; txt['q5'] = T['q5']['q']; txt['q6'] = T['q6']['q']
        for i, q in enumerate(T['q7']):
            it['v%d' % i] = v_mcq(q['q'], q['o'], q['o'][q['a']]); txt['v%d' % i] = q['q']
        h = (T.get('q8h') or '').lower()
        for i, q in enumerate(T['q8']):
            it['wf%d' % i] = 'VO_COLL' if re.search(r'make or do|say or tell|from the box', h) else 'VO_WF'; txt['wf%d' % i] = q['s']
        for i, q in enumerate(T['q9']):
            it['g%d' % i] = need(g_mcq(q['q'], q['o'], q['o'][q['a']]), 'GR_OTHER', '%s t%d g%d %s' % (page, T['n'], i, q['q'])); txt['g%d' % i] = q['q']
        for i, q in enumerate(T['q10']):
            it['rw%d' % i] = need(g_rewrite(q['s'], q['a']), 'GR_OTHER', '%s t%d rw%d %s' % (page, T['n'], i, q['s'])); txt['rw%d' % i] = q['s']
        tests[str(T['n'])] = dict(items=it, writing=[w_genre(T['w']['title'])], txt=txt)
    return tests

def tag_g12_family(page, single=False):
    D = json_const(read(page), 'DATA'); tests = OrderedDict()
    for T in D:
        it = OrderedDict(); txt = {}; mods = {}
        for i, q in enumerate(T['mcq']):
            a = q['o'][q['a']]; qq = q.get('quote') or q.get('ins', '')
            g = g_mcq(qq, q['o'], a)
            v = v_mcq(qq, q['o'], a)
            it['m%d' % i] = g if (g and v == 'VO_TOPIC' and _verbish(q['o'])) else v
            txt['m%d' % i] = qq
        for i, q in enumerate(T['rmcq']): it['r%d' % i] = r_mcq(q['ins'] + ' ' + q.get('ask', '')); txt['r%d' % i] = q['ins']
        for i, q in enumerate(T['tf']): it['tf%d' % i] = 'RD_TFNG'; txt['tf%d' % i] = q['s']
        for i, q in enumerate(T['g8a']): it['a%d' % i] = 'VO_TOPIC'; txt['a%d' % i] = q['s']
        for i, q in enumerate(T['g8b']):
            it['b%d' % i] = 'VO_PHR' if q['a'].split(' / ')[0] in ('off', 'out', 'up', 'down', 'away', 'back') else 'VO_PREP'; txt['b%d' % i] = q['s']
        for i, q in enumerate(T['verbs']):
            it['vb%d' % i] = need(g_verb(q['s'], q['a']), 'GR_OTHER', '%s t%d vb%d %s' % (page, T['n'], i, q['s'])); txt['vb%d' % i] = q['s']
        r = T['rep']
        if 'form of the word' in (r.get('ins') or '').lower(): it['rep'] = 'VO_WF'
        else: it['rep'] = need(g_rewrite(r['q'], r['a']), 'GR_REP', '%s t%d rep %s' % (page, T['n'], r['q']))
        txt['rep'] = r['q']
        for i, q in enumerate(T['rw']):
            it['rw%d' % i] = need(g_rewrite(q['q'], q['a']), 'GR_OTHER', '%s t%d rw%d %s' % (page, T['n'], i, q['q'])); txt['rw%d' % i] = q['q']
        it['q12b'] = 'RD_LIST'; it['q12c'] = 'RD_LIST'; txt['q12b'] = T['q12b']['q']; txt['q12c'] = T['q12c']['q']
        w = [w_genre((T['w1'].get('type') or '') + ' ' + T['w1']['ins']), w_genre((T['w2'].get('type') or '') + ' ' + T['w2']['ins'])]
        mod = T.get('mod') or None
        tests[str(T['n'])] = dict(items=it, writing=w, txt=txt, mod=mod)
    return tests

def _verbish(opts):
    """options look like forms of one verb / grammar words (not 4 different content words)"""
    O = [o.lower() for o in opts]
    if any(re.search(r'\b(is|are|was|were|has|have|had|will|would|been|being|to)\b', o) for o in O): return True
    if all(o in ('who','which','whose','whom','where','when','that','a','an','the','-','so','such','too','very','although','despite','because','because of','so that','in order to','in spite of','since','for','yet','already','just','ever','ago') for o in O): return True
    return False

G12G = {'G1': 'GR_PRES', 'G2': 'GR_PPERF', 'G3': 'GR_PAST', 'G4': 'GR_USED', 'G5': 'GR_FUT', 'G6': 'GR_FUTCP',
        'G7': 'GR_COMP', 'G8': 'GR_COND', 'G9': 'GR_REP', 'G10': 'GR_REPV'}
def g1(sk, text):
    return 'GR_STAT' if sk == 'GR_PRES' and re.search(r'\((smell|know|own|belong|seem|taste|weigh|believe|want|need|not / know|understand|mean)\)', text.lower()) else sk

def tag_g12_grammar(page):
    D = json_const(read(page), 'DATA'); tests = OrderedDict()
    for T in D['tests']:
        it = OrderedDict(); txt = {}
        for i, q in enumerate(T['mcq']):
            sk = G12G[q['t']]
            if q['t'] == 'G1' and re.search(STATIVE, q['o'][q['a']].lower()) and not re.search(r'ing\b', q['o'][q['a']]): sk = 'GR_STAT'
            it['m%d' % i] = sk; txt['m%d' % i] = q['q']
        for i, q in enumerate(T['rep']): it['c%d' % i] = 'GR_REP'; txt['c%d' % i] = q['q']
        for i, q in enumerate(T['vf']): it['v%d' % i] = g1(G12G[q['t']], q['s']); txt['v%d' % i] = q['s']
        for i, q in enumerate(T['rw']):
            sk = G12G.get(q.get('t')) or g_rewrite(q['q'] + ' (' + q.get('w', '') + ')', q['a'])
            it['r%d' % i] = need(sk, ['GR_USED', 'GR_COND', 'GR_COND', 'GR_COMP'][i] if i < 4 else 'GR_OTHER', '%s t%d r%d' % (page, T['n'], i)); txt['r%d' % i] = q['q']
        tests[str(T['n'])] = dict(items=it, writing=[], txt=txt)
    return tests

def tag_g12_vocab(page):
    D = json_const(read(page), 'DATA'); tests = OrderedDict()
    for T in D:
        it = OrderedDict(); txt = {}; imod = {}
        for i, q in enumerate(T['mcq']):
            it['m%d' % i] = 'VO_TOPIC'; txt['m%d' % i] = q['q']
            if q.get('m'): imod['m%d' % i] = int(q['m'][1:])
        for i, q in enumerate(T['wf']): it['w%d' % i] = 'VO_WF'; txt['w%d' % i] = q['s']
        for k, b in enumerate(T['banks']):
            for i, q in enumerate(b['items']): it['b%d_%d' % (k, i)] = 'VO_TOPIC'; txt['b%d_%d' % (k, i)] = q['s']
        for i, q in enumerate(T['prep']): it['p%d' % i] = 'VO_PREP'; txt['p%d' % i] = q['s']
        tests[str(T['n'])] = dict(items=it, writing=[], txt=txt, imod=imod)
    return tests

def tag_mt4(page):
    C = js_consts(read(page), ['MCQ', 'BANK', 'PREP', 'VERBS', 'REWRITE', 'RMCQ', 'TF'])
    it = OrderedDict(); txt = {}
    for i, q in enumerate(C['MCQ']): it['m%d' % i] = 'VO_TOPIC'; txt['m%d' % i] = q['t']
    for i, q in enumerate(C['BANK']): it['b%d' % i] = 'VO_TOPIC'; txt['b%d' % i] = q['t']
    for i, q in enumerate(C['PREP']): it['p%d' % i] = 'VO_PHR'; txt['p%d' % i] = q['t']
    for i, q in enumerate(C['VERBS']):
        sk = g_rewrite(q['t'] + ' (' + q.get('h', '') + ')', q.get('model', '')) or g_verb(q['t'], q.get('model', ''))
        it['v%d' % i] = need(sk, 'GR_OTHER', 'mt4 v%d %s' % (i, q['t'])); txt['v%d' % i] = q['t']
    for i, q in enumerate(C['REWRITE']):
        sk = g_rewrite(q['t'] + ' (' + q.get('h', '') + ')', q.get('model', ''))
        if q.get('h', '').lower() in ('for', 'since') and 'will have' in q.get('model', '').lower(): sk = 'GR_FUTCP'
        it['w%d' % i] = need(sk, 'GR_OTHER', 'mt4 w%d %s' % (i, q['t'])); txt['w%d' % i] = q['t']
    for i, q in enumerate(C['RMCQ']): it['r%d' % i] = r_mcq(q['t']); txt['r%d' % i] = q['t']
    for i, q in enumerate(C['TF']): it['tf%d' % i] = 'RD_TFNG'; txt['tf%d' % i] = q['s']
    it['q14'] = 'RD_LIST'; it['q15'] = 'RD_LIST'
    return OrderedDict([('1', dict(items=it, writing=['WR_ADVDIS'], txt=txt, mod=4))])

def tag_mock2(page):
    Q = json_const(read(page), 'Q'); it = OrderedDict(); txt = {}; imod = {}; isb = {}
    for i, q in enumerate(Q):
        t = (q['topic'] + ' ' + q.get('group', '')).lower()
        if q['sec'].startswith('Reading'):
            sk = r_mcq(q['prompt']) if q['kind'] == 'mc' else ('RD_LIST' if re.search(r'\b(two|three)\b', q['prompt'].lower()) else 'RD_DETAIL')
        elif 'phrasal' in t: sk = 'VO_PHR'
        elif 'preposition' in t: sk = 'VO_PREP'
        elif re.search(r'word (formation|building)|suffix', t): sk = 'VO_WF'
        elif 'stative' in t: sk = 'GR_STAT'
        elif 'present perfect' in t: sk = 'GR_PPERF'
        elif 'past progressive' in t or 'past simple' in t: sk = 'GR_PAST'
        elif 'used to' in t or 'past habit' in t: sk = 'GR_USED'
        elif 'conditional' in t: sk = 'GR_COND'
        elif 'future' in t: sk = 'GR_FUT'
        elif 'reported' in t: sk = 'GR_REP'
        else: sk = 'VO_TOPIC'
        it['q%d' % i] = sk; txt['q%d' % i] = q['prompt']
        if q.get('module_verified') and q.get('module_code'): imod['q%d' % i] = int(q['module_code'][3:])
        ev = q.get('evidence_ref') or ''
        if ev.startswith('SB'): isb['q%d' % i] = ev.replace('SB ', '')
    return OrderedDict([('1', dict(items=it, writing=['WR_COVER', 'WR_STORY'], txt=txt, imod=imod, isb=isb))])

def tag_irregular(page):
    return OrderedDict([('1', dict(items=OrderedDict(), writing=[], txt={}, mode='rows'))])

PAGES = OrderedDict([
    ('g10-advanced.html',     dict(grade='10', set='Advanced Practice Tests 1–10', fn=tag_g1011, term=1, mods='3–5')),
    ('g11-advanced.html',     dict(grade='11', set='Advanced Practice Tests 1–10', fn=tag_g1011, term=1, mods='3–5')),
    ('g12-advanced.html',     dict(grade='12', set='Advanced Practice Tests 1–10', fn=tag_g12_family, term=1, mods='1–5')),
    ('g12-module-tests.html', dict(grade='12', set='Module Tests 1–3 (A/B)', fn=tag_g12_family, term=1, mods='1–3')),
    ('g12-mock-exam-3.html',  dict(grade='12', set='Full Mock Exam 3', fn=tag_g12_family, term=1, mods='1–5')),
    ('module-test-4.html',    dict(grade='12', set='Module Test 4', fn=tag_mt4, term=1, mods='4')),
    ('mock-exam-2.html',      dict(grade='12', set='Full Mock Exam 2', fn=tag_mock2, term=1, mods='1–5')),
    ('g12-grammar.html',      dict(grade='12', set='Grammar Tests 1–3', fn=tag_g12_grammar, term=1, mods='1–5')),
    ('g12-vocabulary.html',   dict(grade='12', set='Vocabulary Tests 1–3', fn=tag_g12_vocab, term=1, mods='1–5')),
    ('irregular-verbs.html',  dict(grade='all', set='Irregular Verbs', fn=tag_irregular, term=None, mods=None)),
])

# ------------------------------------------------------------------ resources (verified, grade-correct only)
BASE = 'https://mrsameh2024.github.io/tests/'
PDF = {'10': ('g10-revision-booklet-pdf', 'Grade 10 · Revision Booklet', 'ملزمة المراجعة · الصف العاشر'),
       '11': ('g11-revision-booklet-pdf', 'Grade 11 · Revision Booklet', 'ملزمة المراجعة · الصف الحادي عشر'),
       '12': ('g12-complete-revision-booklet-pdf', 'Grade 12 · Complete Revision Booklet', 'ملزمة المراجعة الشاملة · الصف الثاني عشر')}
PDF_TESTS = {'10': ('g10-practice-tests-1-10-pdf', 'Grade 10 · Practice Tests 1–10 (PDF)', 'الاختبارات التدريبية 1–10'),
             '11': ('g11-practice-tests-1-10-pdf', 'Grade 11 · Practice Tests 1–10 (PDF)', 'الاختبارات التدريبية 1–10'),
             '12': ('g12-advanced-practice-tests-pdf', 'Grade 12 · Advanced Practice Tests (PDF)', 'الاختبارات المتقدمة')}
WRITING_RES = {
    '10': {'WR_ARTICLE': ('g10-writing-module-03-article.html', 'Grade 10 Writing · Module 3 · Article', 'الكتابة · الوحدة 3 · المقال'),
           'WR_FEMAIL': ('g10-writing-module-04-formal-email.html', 'Grade 10 Writing · Module 4 · Formal Email', 'الكتابة · الوحدة 4 · البريد الرسمي'),
           'WR_REPORT': ('g10-writing-module-05-report.html', 'Grade 10 Writing · Module 5 · Report', 'الكتابة · الوحدة 5 · التقرير')},
    '11': {k: ('g11-writing.html?course=' + c, 'Grade 11 Writing Course · ' + n, 'دورة الكتابة · ' + a) for k, c, n, a in [
           ('WR_DIARY', 'diary', 'Diary (Module 3)', 'اليوميات (الوحدة 3)'), ('WR_STORY', 'story', 'Story (Module 3)', 'القصة (الوحدة 3)'),
           ('WR_ANNOUNCE', 'announcement', 'Announcement (Module 4)', 'الإعلان (الوحدة 4)'), ('WR_CAUSE', 'cause', 'Cause and Effect (Module 4)', 'السبب والنتيجة (الوحدة 4)'),
           ('WR_SUMMARY', 'summary', 'Summary (Module 5)', 'الملخص (الوحدة 5)'), ('WR_DISCUSS', 'discussion', 'Discussion (Module 5)', 'المناقشة (الوحدة 5)')]},
    '12': {'WR_COVER': ('g12-scaffold-job-application.html', 'Grade 12 Writing Scaffold · Cover Letter', 'دعم الكتابة · خطاب التقديم'),
           'WR_ADVDIS': ('g12-scaffold-advantages-disadvantages.html', 'Grade 12 Writing Scaffold · Advantages & Disadvantages Essay', 'دعم الكتابة · مقال المزايا والعيوب'),
           'WR_IEMAIL': ('g12-scaffold-informal-email.html', 'Grade 12 Writing Scaffold · Informal Email', 'دعم الكتابة · البريد غير الرسمي'),
           'WR_NARR': ('g12-scaffold-personal-narrative.html', 'Grade 12 Writing Scaffold · Personal Narrative', 'دعم الكتابة · القصة الشخصية'),
           'WR_STORY': ('g12-scaffold-personal-narrative.html', 'Grade 12 Writing Scaffold · Personal Narrative', 'دعم الكتابة · القصة الشخصية')},
}
G12_GRAMMAR_SKILLS = set(G12G.values()) | {'GR_STAT'}
PAST_FORMS = {'GR_PAST', 'GR_PASTPERF', 'GR_PPERF', 'GR_PASS', 'GR_IRREG'}

def resources(grade, sk):
    """ordered list of verified resources for one skill in one grade"""
    R = []
    area = SKILLS[sk]['area']
    R.append(dict(k='rule', en='Review the Grammar Rule' if area == 'Grammar' else 'Review the skill',
                  ar='راجع القاعدة' if area == 'Grammar' else 'راجع المهارة', url='my-revision-plan.html#skill=' + sk, lv='all'))
    if grade == '12':
        if sk in G12_GRAMMAR_SKILLS:
            R.append(dict(k='practice', en='Practice This Skill · Grade 12 Grammar Tests 1–3', ar='تدرّب على المهارة · اختبارات القواعد', url='g12-grammar.html', lv='core'))
        m = MODULES['12'].get(sk, {}).get('mod')
        if m in (1, 2, 3) and area in ('Grammar', 'Vocabulary'):
            R.append(dict(k='practice', en='Practice This Skill · Module %d Test A' % m, ar='تدرّب · اختبار الوحدة %d (أ)' % m, url='g12-module-tests.html?t=%d' % (2 * m - 1), lv='core'))
        if m == 4 and area in ('Grammar', 'Vocabulary'):
            R.append(dict(k='practice', en='Practice This Skill · Module Test 4', ar='تدرّب · اختبار الوحدة 4', url='module-test-4.html', lv='core'))
        if area == 'Vocabulary':
            R.append(dict(k='practice', en='Practice This Skill · Grade 12 Vocabulary Tests 1–3', ar='تدرّب · اختبارات المفردات', url='g12-vocabulary.html', lv='core'))
            R.append(dict(k='practice', en='Grade 12 Vocabulary Cards (with Arabic)', ar='بطاقات المفردات بالعربية', url='vocab-cards.html', lv='remedial'))
    if sk == 'GR_IRREG':
        R.append(dict(k='practice', en='Study mode · listen, filter and cover the answers', ar='وضع المذاكرة · استمع وغطِّ الإجابات', url='irregular-verbs.html?mode=study', lv='remedial'))
        R.append(dict(k='practice', en='Random 20 verbs test', ar='اختبار 20 فعلًا عشوائيًا', url='irregular-verbs.html?t=r', lv='core'))
        R.append(dict(k='practice', en='All 110 verbs (challenge)', ar='كل الأفعال الـ110 (تحدٍّ)', url='irregular-verbs.html?t=all', lv='enrichment'))
    elif sk in PAST_FORMS:
        R.append(dict(k='practice', en='Irregular Verbs Trainer (past simple and past participle)', ar='مدرب الأفعال الشاذة', url='irregular-verbs.html', lv='remedial'))
    if area == 'Writing':
        w = WRITING_RES.get(grade, {}).get(sk)
        if w: R.append(dict(k='lesson', en='Open the writing lesson · ' + w[1], ar='افتح درس الكتابة · ' + w[2], url=w[0], lv='core'))
        R.append(dict(k='practice', en='Writing Coach (check your draft)', ar='مدرب الكتابة (راجع مسودتك)', url='writing-coach.html', lv='all'))
    if grade in PDF and area != 'Writing':
        f = PDF[grade]
        R.append(dict(k='pdf', en='Open PDF · ' + f[1], ar='افتح الملف · ' + f[2], url='open.html?f=' + f[0], page=None, lv='core'))
    if grade in PDF_TESTS and area in ('Reading',):
        f = PDF_TESTS[grade]
        R.append(dict(k='pdf', en='Exam practice · ' + f[1], ar='تدريب على الاختبار · ' + f[2], url='open.html?f=' + f[0], page=None, lv='enrichment'))
    return R

def module_info(grade, sk, page_mod=None):
    m = MODULES.get(grade, {}).get(sk)
    if m:
        d = dict(mod=m['mod'], lesson=m.get('lesson'), sb=m.get('sb'), src=m['src'])
    else:
        d = dict(mod=None, lesson=None, sb=None, src=None)
    if grade == '12' and d['mod']: d['title'] = G12_MOD_TITLES.get(d['mod'])
    return d

# ------------------------------------------------------------------ build
def main():
    allmap = []
    for page, P in PAGES.items():
        tests = P['fn'](page)
        grade = P['grade']
        used = set()
        sim = defaultdict(list)
        for tn, T in tests.items():
            for iid, sk in T['items'].items():
                used.add(sk); sim[sk].append([int(tn), iid])
            used.update(T.get('writing', []))
        if page == 'irregular-verbs.html': used.add('GR_IRREG')
        skills = {}
        for sk in sorted(used):
            g = grade if grade != 'all' else None
            d = dict(SKILLS[sk]); d['mi'] = module_info(g or '', sk)
            d['res'] = resources(g or 'all', sk)
            skills[sk] = d
        out = dict(page=page, grade=grade, set=P['set'], term=P['term'], mods=P['mods'],
                   tests={tn: {k: v for k, v in T.items() if k != 'txt'} for tn, T in tests.items()},
                   similar={k: v for k, v in sim.items() if len({t for t, _ in v}) > 1}, skills=skills)
        js = '/* generated by src/pathways/tag.py — do not edit by hand */\nwindow.SSH_PATH_PAGE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
        open(os.path.join(OUT, page.replace('.html', '.js')), 'w', encoding='utf-8').write(js)
        REPORT.append('\n=== %s (grade %s, %d tests)' % (page, grade, len(tests)))
        for tn, T in tests.items():
            for iid, sk in T['items'].items():
                REPORT.append('  t%s %-6s %-11s %s' % (tn, iid, sk, (T['txt'].get(iid) or '')[:90]))
            REPORT.append('  t%s writing: %s' % (tn, ', '.join(T.get('writing', []))))
        for sk in sorted(used):
            mi = skills[sk]['mi']
            for r in skills[sk]['res']:
                allmap.append(OrderedDict([
                    ('grade', grade), ('term', P['term'] or ''), ('module', mi['mod'] or 'Not Yet Mapped'),
                    ('module_title', mi.get('title') or ''), ('lesson', mi.get('lesson') or 'Not Yet Mapped'),
                    ('skill_id', sk), ('skill', SKILLS[sk]['en']), ('skill_ar', SKILLS[sk]['ar']), ('area', SKILLS[sk]['area']),
                    ('objective', SKILLS[sk]['obj']), ('students_book_page', mi['sb'] or 'Not Yet Mapped'),
                    ('workbook_page', 'Not Yet Mapped'), ('assessed_in', page), ('resource', r['en']),
                    ('link', BASE + r['url']), ('resource_page', 'Not Yet Mapped' if r['k'] == 'pdf' else ''),
                    ('level', {'remedial': 'Remedial', 'core': 'Core', 'enrichment': 'Enrichment', 'all': 'Core / ASEN'}[r['lv']]),
                    ('verified_source', mi['src'] or ''),
                ]))
    # de-duplicate map rows that differ only by assessed_in
    merged = OrderedDict()
    for r in allmap:
        k = (r['grade'], r['skill_id'], r['resource'])
        if k in merged: merged[k]['assessed_in'] += ' · ' + r['assessed_in'] if r['assessed_in'] not in merged[k]['assessed_in'] else ''
        else: merged[k] = r
    rows = sorted(merged.values(), key=lambda r: (r['grade'], r['area'], str(r['module']), r['skill_id']))
    json.dump(rows, open(os.path.join(OUT, 'curriculum-map.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'curriculum-map.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    allsk = {k: dict(v, mi={g: module_info(g, k) for g in ('10', '11', '12')}, res={g: resources(g, k) for g in ('10', '11', '12')}) for k, v in SKILLS.items()}
    open(os.path.join(OUT, 'skills.js'), 'w', encoding='utf-8').write(
        '/* generated by src/pathways/tag.py */\nwindow.SSH_PATH_SKILLS=' + json.dumps(allsk, ensure_ascii=False, separators=(',', ':')) + ';\n')
    open(os.path.join(OUT, 'tag-report.txt'), 'w', encoding='utf-8').write('\n'.join(REPORT) + '\n')
    names = {}
    for k, v in SKILLS.items():
        iv = 'Re-teach the rule with the common mistake (' + (v['mis_en'] or v['obj']) + ').'
        if v['frame']: iv += ' Foundation group: model and practise the frame "' + v['frame'] + '".'
        iv += ' Then set a follow-up item on the same skill and compare results.'
        names[k] = [v['en'], v['area'], iv]
    tpl = open(os.path.join(HERE, 'Pathways.gs.tpl'), encoding='utf-8').read()
    open(os.path.join(HERE, 'Pathways.gs'), 'w', encoding='utf-8').write(tpl.replace('__SKILLS__', json.dumps(names, ensure_ascii=False, indent=0)))
    print('pages', len(PAGES), 'map rows', len(rows), 'fallbacks', sum('fallback' in r for r in REPORT))

if __name__ == '__main__':
    main()
