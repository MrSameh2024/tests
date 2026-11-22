"""Browser tests · teacher-g11-dashboard.html (prototype). External requests are blocked: the page must work offline.
Run: python3 src/tests/dashboard-e2e.py"""
import os, sys, json, functools, threading, http.server, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d/' % srv.server_address[1]; R = []
def check(n, c, d=''): R.append((n, bool(c))); print(('PASS ' if c else 'FAIL ') + n + ('' if c else ' · ' + str(d)[:300]))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'), args=['--no-sandbox'])
    for mobile in (False, True):
        tag = 'mobile' if mobile else 'desktop'; ext = []
        ctx = b.new_context(**(p.devices['iPhone 13'] if mobile else {'viewport': {'width': 1280, 'height': 900}}))
        ctx.route(lambda u: not u.startswith(base), lambda r: (ext.append(r.request.url), r.abort()))
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + 'teacher-g11-dashboard.html'); pg.click('#demoBtn'); pg.wait_for_selector('#app:not(.hidden)')
        k = pg.inner_text('#kpis')
        check(f'[{tag}] demo loads with a DEMO banner', 'DEMO DATA' in pg.inner_text('#srcBanner'))
        check(f'[{tag}] class 11/7 selected by default and 24 students', pg.input_value('#cls') == '11/7' and '24' in k.split('\n')[0], k[:120])
        ov = pg.inner_text('#tab-overview')
        check(f'[{tag}] five skill areas incl. listening shown as "no data"', all(x in ov for x in ['Reading', 'Vocabulary', 'Grammar', 'Listening', 'Writing']) and 'no data' in ov)
        pg.click('nav.tabs button[data-tab=students]'); st = pg.inner_text('#tab-students')
        check(f'[{tag}] student table lists flags for struggling students', 'latest below 50%' in st or 'not improving' in st)
        pg.click('nav.tabs button[data-tab=items]'); it = pg.inner_text('#tab-items')
        check(f'[{tag}] skill mastery and most-missed questions', 'Past perfect' in it and 'T1 ·' in it.replace(' ', ' '))
        pg.click('nav.tabs button[data-tab=research]'); rs = pg.inner_text('#tab-research')
        check(f'[{tag}] pre/post indicators computed (paired n > 0)', 'Paired students' in rs and 'dz' in rs, rs[:300])
        check(f'[{tag}] causal-claim caution shown', 'cannot be said to have' in rs)
        pg.select_option('#preSel', '1'); pg.select_option('#postSel', '9'); rs2 = pg.inner_text('#tab-research')
        check(f'[{tag}] choosing Test 1 → Test 9 changes the pairing', rs2 != rs)
        with pg.expect_download() as dl: pg.click('#csvInd')
        path = dl.value.path(); txt = open(path, encoding='utf-8-sig').read()
        check(f'[{tag}] indicators CSV downloads', 'Mean change' in txt and 'pre %' in txt)
        pg.click('nav.tabs button[data-tab=report]'); rp = pg.inner_text('#tab-report')
        check(f'[{tag}] individual report with bilingual feedback', 'progress report' in rp and 'تقرير' in rp and ('Remedial step' in rp or 'No skill below' in rp))
        if not mobile:
            pdf = pg.pdf(format='A4', print_background=True); open('/tmp/g11-student-report-demo.pdf', 'wb').write(pdf)
            check('[desktop] student report prints to PDF', len(pdf) > 10000 and pdf[:4] == b'%PDF', len(pdf))
            # upload the same CSV through the file input (the real teacher path)
            pg.set_input_files('#file', os.path.join(ROOT, 'dashboards/demo/g11-demo-submissions.csv'))
            pg.wait_for_timeout(300)
            check('[desktop] CSV file upload path works', 'Loaded' in pg.inner_text('#srcBanner') and 'g11-demo-submissions.csv' in pg.inner_text('#srcBanner'))
            pg.select_option('#cls', '')
            check('[desktop] all-classes view includes 11/3', '32' in pg.inner_text('#kpis').split('\n')[0])
        else:
            sw = pg.evaluate('document.documentElement.scrollWidth'); vw = pg.evaluate('innerWidth')
            check('[mobile] no horizontal overflow', sw <= vw + 1, (sw, vw))
        check(f'[{tag}] no external requests (data stays on device)', not ext, ext[:3])
        check(f'[{tag}] no JavaScript errors', not errs, errs)
        ctx.close()
    b.close()
srv.shutdown(); ok = sum(c for _, c in R); print(f'{ok}/{len(R)} checks passed'); sys.exit(0 if ok == len(R) else 1)
