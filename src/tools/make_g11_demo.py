"""Fictitious demo data for the Grade 11 dashboard prototype (NOT real students).
    python3 src/tools/make_g11_demo.py  → dashboards/demo/g11-demo-submissions.csv
Same columns and text formats as the live "Submissions" sheet, so the dashboard code path is identical."""
import csv, json, os, random, math
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
rnd = random.Random(117)
html = open(os.path.join(ROOT, 'g11-advanced.html'), encoding='utf-8').read()
i = html.index('const DATA=') + 11; d = 0
for j in range(i, len(html)):
    if html[j] == '[': d += 1
    elif html[j] == ']':
        d -= 1
        if d == 0: break
DATA = json.loads(html[i:j + 1]); L = 'abcd'
P = json.loads((lambda s: s[s.index('{'):s.rindex('}') + 1])(open(os.path.join(ROOT, 'pathways/g11-advanced.js')).read()))['tests']
HARD = {'GR_PASTPERF': .9, 'GR_SOSUCH': .6, 'RD_INFER': .7, 'VO_WF': .5, 'GR_USED': .4, 'RD_LIST': .6}
def p_ok(ability, skill): return 1 / (1 + math.exp(-(ability - HARD.get(skill, 0))))
def attempt(name, cls, t, ability, when, writing):
    T = DATA[t - 1]; tags = P[str(t)]['items']; lines = []; sc = {'r': 0, 'v': 0, 'g': 0}; pend = 0
    def mcq(prefix, arr, sec, qn):
        out = []
        for k, q in enumerate(arr):
            ok = rnd.random() < p_ok(ability, tags[prefix + str(k)])
            if ok: sc[sec] += 1; out.append(f"{k+1}) {L[q['a']]} ✓")
            else: wrong = rnd.choice([x for x in range(len(q['o'])) if x != q['a']]); out.append(f"{k+1}) {L[wrong]} ✗ (key {L[q['a']]})")
        lines.append(f"Q{qn}: " + ' | '.join(out))
    mcq('a', T['q1'], 'r', 1)
    tf = []
    for k, q in enumerate(T['q2']):
        ok = rnd.random() < p_ok(ability, 'RD_TFNG')
        if ok: sc['r'] += 1; tf.append(f"{'ABC'[k]}) {q['a']} ✓")
        else: tf.append(f"{'ABC'[k]}) {rnd.choice([x for x in ['T','F','NM'] if x != q['a']])} ✗ (key {q['a']})")
    lines.append('Q2: ' + ' | '.join(tf))
    def cr(label, id, pts):
        nonlocal pend
        r = rnd.random(); pk = p_ok(ability, tags.get(id, 'RD_DETAIL'))
        if r < pk * .85: sc['r' if id[0] == 'q' else 'g'] += pts; return f"{label}: (answer) [auto ✓ {pts}/{pts}]"
        if r < pk: pend += 1; return f"{label}: (answer) [TEACHER REVIEW: Your answer has part of the idea · confirmed 0/{pts}]"
        return f"{label}: (answer) [auto ✗ 0/{pts} · Your answer does not contain the information the question asks for.]"
    lines.append(cr('Q3', 'q3', 1))
    for k, r in enumerate(T['q4']): lines.append(cr(f"Q4 {r['t']}", f'q4_{k}', 1))
    for k in ('q5', 'q6'): lines.append(cr(k.upper(), k, 2).replace(': (answer)', ': 1) (point) 2) (point)'))
    mcq('v', T['q7'], 'v', 7)
    wf = []
    for k, q in enumerate(T['q8']):
        ok = rnd.random() < p_ok(ability, 'VO_WF')
        if ok: sc['v'] += 1; wf.append(f"{k+1}) {q['a']} ✓")
        else: wf.append(f"{k+1}) (form) ✗ (key {q['a']})")
    lines.append('Q8: ' + ' | '.join(wf))
    mcq('g', T['q9'], 'g', 9)
    for k in range(4): lines.append(cr(f'Q10.{k+1}', f'rw{k}', 1))
    score = sc['r'] + sc['v'] + sc['g']
    bd = f"Reading {sc['r']}/14; Vocabulary {sc['v']}/10; Grammar {sc['g']}/10; Writing /10 by teacher (Content 4 · Organisation 2 · Language 2 · Accuracy 2)" + (f"; {pend} answer(s) waiting for teacher review" if pend else '')
    fb = f"Writing {writing}/10. Clear plan; check past tenses." if writing is not None else ''
    return [when, f'DEMO-{t}-{name[-2:]}', f'Grade 11 Advanced Test {t}', name, cls, '', '', 'yes', score, 34, f'{round(score/34*100)}%', bd,
            T['w']['title'], 'Demo essay text.' if True else '', 160, '\n'.join(lines), 'Feedback sent' if writing is not None else 'New', fb, '']
rows = [["Timestamp", "Reference", "Test", "Student name", "Class", "Email", "Phone", "Consent", "Score", "Max", "Percent", "Section breakdown",
         "Writing topic", "Essay", "Word count", "Answers", "Feedback status", "Teacher feedback", "Feedback sent on"]]
waves = [(1, '20/10/2026 09:10:00'), (4, '05/11/2026 09:15:00'), (9, '19/11/2026 09:05:00')]
for n in range(1, 25):   # 11/7: 24 fictitious students; growth larger for some, none for others
    base = rnd.gauss(0.2, 1.0); growth = rnd.choice([0.0, 0.3, 0.6, 0.9, 1.2])
    for w, (t, when) in enumerate(waves):
        if w and rnd.random() < 0.12: continue   # some students miss a wave
        ab = base + growth * w / 2 + rnd.gauss(0, .25)
        wr = None if rnd.random() < .3 else max(2, min(10, round(5 + 2 * ab + rnd.gauss(0, 1))))
        rows.append(attempt(f'Demo Student {n:02d}', '11/7', t, ab, when, wr))
for n in range(25, 33):  # comparison class 11/3, two waves
    base = rnd.gauss(0.5, 0.9)
    for w, (t, when) in enumerate(waves[:2]):
        rows.append(attempt(f'Demo Student {n:02d}', '11/3', t, base + rnd.gauss(0, .3), when, None))
out = os.path.join(ROOT, 'dashboards/demo/g11-demo-submissions.csv')
with open(out, 'w', newline='', encoding='utf-8') as f: csv.writer(f).writerows(rows)
print(out, len(rows) - 1, 'rows')
