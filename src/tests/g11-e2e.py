"""Browser end-to-end tests · g11-advanced.html (local copy, nothing is sent to the real sheet)
Run from the repo root:  python3 src/tests/g11-e2e.py
Needs: python playwright + a Chrome/Chromium (CHROME env var, default /usr/bin/google-chrome).
Every request to script.google.com is intercepted and answered locally; all other external hosts are blocked.
Scenarios: 14 writing awaits the teacher · 15 score/total · 18 mobile submission · 19 no data leaves except
the intercepted endpoint · 20 recovery from a failed send · plus autosave/restore and v2 feedback in the page."""
import json, os, sys, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + ((' · ' + str(detail)) if detail and not cond else ''))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    h = functools.partial(Quiet, directory=ROOT)
    srv = socketserver.TCPServer(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

ANSWERS = {  # Test 1 · a mix of correct, spelling-tolerant, negated and near-miss answers
    'q3': 'plankten eat them, then smal fish eat plankton, then larger predetors eat the fish',
    'q4_0': 'the maximum size of a microplastic',
    'q4_1': 'microplastics were not found in blood',
    'q5_0': 'some are made on purpose like microbeads', 'q5_1': 'big plastic breaks apart in the sun',
    'q6_0': 'choose natural fabrics', 'q6_1': 'avoid single-use plastic',
    'wf0': 'enviromental', 'wf1': 'development', 'wf2': 'depress', 'wf3': 'reusable', 'wf4': 'prevention',
    'rw0': "The particles are so small that you can't see them.",
    'rw1': 'Although there are bans, microplastics are still comon.',
    'rw2': 'Before the fish had eaten the plastic, it entered the sea.',
    'rw3': 'You should wash synthetic clothes less often.',
}
RADIOS = {'a0': 1, 'a1': 1, 'a2': 0, 'a3': 1, 'v0': 0, 'v1': 0, 'v2': 0, 'v3': 1, 'v4': 1, 'g0': 2, 'g1': 1, 'g2': 0, 'g3': 0, 'g4': 0, 'g5': 0}
TF = {'tf0': 'T', 'tf1': 'F', 'tf2': 'NM'}

def run(mobile, fail_first):
    sent, errors = [], []
    srv = serve(); base = 'http://127.0.0.1:%d/' % srv.server_address[1]
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        ctx = b.new_context(**(p.devices['iPhone 13'] if mobile else {'viewport': {'width': 1280, 'height': 900}}))
        state = {'n': 0}
        def endpoint(route):
            body = route.request.post_data or ''
            try: d = json.loads(body)
            except Exception: d = {}
            if d.get('type') == 'submission':
                state['n'] += 1
                if fail_first and state['n'] == 1:
                    return route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': False, 'error': 'sheet busy (simulated)'}))
                sent.append(d)
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'ref': 'TEST-123'}))
        ctx.route('**/script.google.com/**', endpoint)
        ctx.route(lambda u: not u.startswith(base) and 'script.google.com' not in u, lambda r: r.abort())
        ctx.add_init_script("try{localStorage.setItem('ssh_registered','1');localStorage.setItem('ssh_reg',JSON.stringify({name:'Test Student',email:'student.test@school.qa',role:'student'}))}catch(e){}")
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(base + 'g11-advanced.html?t=1&mock=1'); pg.wait_for_selector('#q3')
        tag = 'mobile' if mobile else 'desktop'
        # fill answers
        for k, v in ANSWERS.items(): pg.fill('#' + k, v)
        for k, v in RADIOS.items(): pg.check('input[name="%s"][value="%d"]' % (k, v))
        for k, v in TF.items(): pg.check('input[name="%s"][value="%s"]' % (k, v))
        pg.fill('#essay', 'Microplastics are a growing problem. ' * 12)
        pg.wait_for_timeout(700)
        # autosave → reload → restored
        pg.reload(); pg.wait_for_selector('#q3'); pg.wait_for_timeout(300)
        check(f'[{tag}] autosave: text answers restored after reload', pg.input_value('#rw1') == ANSWERS['rw1'])
        check(f'[{tag}] autosave: radio choices restored after reload', pg.is_checked('input[name="g0"][value="2"]'))
        check(f'[{tag}] autosave: writing restored after reload', pg.input_value('#essay').startswith('Microplastics'))
        # registration + check
        # the details box is folded by ssh-quickstart.js for registered students: fill it the way the autofill does
        pg.evaluate("""(()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}};
          set('sshName','Test Student');set('sshClass','11/7');set('sshEmail','student.test@school.qa');const c=document.getElementById('sshConsent');if(c&&!c.checked){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}})()""")
        pg.click('#checkBtn'); pg.click('#yesBtn'); pg.wait_for_selector('#result:not(.hidden)')
        fbt = lambda i: pg.inner_text('#' + i + 'fb')
        check(f'[{tag}] spelling-tolerant reading answer accepted with a note', 'Correct' in fbt('q3') and 'plankten' in fbt('q3'), fbt('q3'))
        check(f'[{tag}] negated answer rejected with a bilingual reason', 'opposite' in fbt('q4_1') and 'العكس' in fbt('q4_1'), fbt('q4_1'))
        check(f'[{tag}] word-formation near-miss sent to the teacher', 'teacher' in fbt('wf0').lower(), fbt('wf0'))
        check(f'[{tag}] unchanged bracket word rejected with reason', 'copied the word' in fbt('wf2'), fbt('wf2'))
        check(f'[{tag}] rewrite with a typo accepted', 'Correct' in fbt('rw1'), fbt('rw1'))
        check(f'[{tag}] wrong tense sequence rejected', 'FIRST' in fbt('rw2'), fbt('rw2'))
        g = pg.evaluate("document.getElementById('g0fb').textContent")
        check(f'[{tag}] item explanation shown in English and Arabic (12)', 'Why?' in g and 'الماضي التام' in g, g[:300])
        v = pg.inner_text('#v3fb')  # Test 1 V4 answered "alarmed" (correct) → collapsed explanation present
        check(f'[{tag}] explanation present for a correct answer too', 'Why?' in v)
        rtl = pg.evaluate("getComputedStyle(document.querySelector('#g0fb .sshx .ar')).direction")
        check(f'[{tag}] Arabic explanation renders right-to-left', rtl == 'rtl', rtl)
        res = pg.inner_text('#result')
        # expected: reading 4+3 + q3 1 + q4 1 + q5 2 + q6 2 = 13 ; vocab 5 + 3 = 8 ; grammar 6 + 3 = 9 → 30
        check(f'[{tag}] score total and section scores', '30 / 34' in res and '13/14' in res and '8/10' in res and '9/10' in res, res[:200])
        check(f'[{tag}] provisional heading while answers await the teacher', 'Provisional score' in res, res[:80])
        check(f'[{tag}] pending teacher review shown separately (not counted)', '1 answer(s) will be checked by your teacher' in res, res)
        check(f'[{tag}] writing shown as teacher-marked (14)', 'Writing (10 marks) will be marked by your teacher' in res)
        check(f'[{tag}] answers locked after checking', pg.is_disabled('#q3'))
        # the page sends automatically once checked (no self-marked items left); click only if the button is still there
        pg.wait_for_timeout(800)
        if pg.query_selector('#sendBtn:not([disabled])'): pg.click('#sendBtn')
        if fail_first:
            pg.wait_for_selector('.ssh-status.no', timeout=15000)
            pend = pg.evaluate("JSON.parse(localStorage.getItem('ssh-pending')||'[]').length")
            check(f'[{tag}] failed send kept in the retry queue (20)', pend == 1, pend)
            pg.click('.ssh-status.no button');
        pg.wait_for_selector('.ssh-status.ok', timeout=20000)
        check(f'[{tag}] submission confirmed with reference number', 'TEST-123' in pg.inner_text('.ssh-status.ok'))
        check(f'[{tag}] exactly one submission reached the (intercepted) endpoint', len(sent) == 1, len(sent))
        if sent:
            d = sent[0]
            check(f'[{tag}] payload score/max', d.get('score') == 30 and d.get('max') == 34, (d.get('score'), d.get('max')))
            check(f'[{tag}] payload marks teacher review for Q8.1', 'Q8: 1) enviromental [TEACHER REVIEW' in d.get('answers', ''), d.get('answers', '')[:400])
            check(f'[{tag}] payload carries the essay for teacher marking', d.get('essay', '').startswith('Microplastics'))
        pend = pg.evaluate("JSON.parse(localStorage.getItem('ssh-pending')||'[]').length")
        check(f'[{tag}] retry queue empty after success', pend == 0, pend)
        draft = pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('ssh_draft_')).length")
        check(f'[{tag}] draft deleted after sending', draft == 0, draft)
        if mobile:
            sw = pg.evaluate('document.documentElement.scrollWidth'); vw = pg.evaluate('window.innerWidth')
            check('[mobile] no horizontal overflow on a phone', sw <= vw + 1, (sw, vw))
        check(f'[{tag}] no JavaScript errors', not errors, errors)
        b.close()
    srv.shutdown()

run(mobile=False, fail_first=False)
run(mobile=True, fail_first=True)
ok = sum(1 for r in results if r[1]); print(f'\n{ok}/{len(results)} checks passed')
json.dump([{'check': n, 'pass': p, 'detail': str(d)} for n, p, d in results], open(os.environ.get('E2E_OUT', '/tmp/g11-e2e-results.json'), 'w'), indent=1)
sys.exit(0 if ok == len(results) else 1)
