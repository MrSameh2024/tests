"""Smoke test for the G10/G12 pages changed by the merged grammar branch: each page loads with no JS error,
grammarCR exists and treats reporting 'that' as optional while still rejecting a different tense.
Run: python3 src/tests/pages-smoke.py   (all external requests blocked)"""
import os, sys, functools, threading, http.server, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d/' % srv.server_address[1]; ok = 0; n = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'), args=['--no-sandbox'])
    for page in ['g10-advanced.html', 'g11-advanced.html', 'g12-advanced.html', 'g12-grammar.html', 'g12-mock-exam-3.html', 'g12-module-tests.html']:
        ctx = b.new_context(); ctx.route(lambda u: not u.startswith(base), lambda r: r.abort())
        ctx.add_init_script("try{localStorage.setItem('ssh_registered','1')}catch(e){}")
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + page + '?t=1'); pg.wait_for_timeout(800)
        html = open(os.path.join(ROOT, page), encoding='utf-8').read(); a = html.find('function norm('); g = html.find('function grammarCR(', a); z = html.find('\n}\n', g) + 3
        src = html[a:z]   # the page's own norm / variants / okAns / grammarCR, evaluated in the loaded page
        probe = ';return [grammarCR("He said that he was tired.","He said he was tired."),grammarCR("He says he is tired.","He said he was tired."),grammarCR("","x")]'
        r = pg.evaluate("src => new Function(src)()", src + probe)
        good = r == [True, False, False] and not errs
        n += 1; ok += good
        print(('PASS ' if good else 'FAIL ') + page, r, errs[:2])
        ctx.close()
    b.close()
srv.shutdown(); print(f'{ok}/{n} pages passed'); sys.exit(0 if ok == n else 1)
