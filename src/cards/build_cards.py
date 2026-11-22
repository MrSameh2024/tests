# -*- coding: utf-8 -*-
"""Render the Remedial & Enrichment Revision Cards to branded A4 PDFs.
usage: python3 src/cards/build_cards.py <repo> <fonts_dir>
writes <repo>/pdf/cards/<id>.pdf, an all-in-one pack, and pdf/cards/cards.json
"""
import asyncio, base64, html, io, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib
import qrcode
from pypdf import PdfReader, PdfWriter
from playwright.async_api import async_playwright

REPO = sys.argv[1]; FONTS = sys.argv[2]; GRADE = sys.argv[3] if len(sys.argv) > 3 else '12'
_mod = importlib.import_module('g%s_cards' % GRADE)
ORDER = lambda c: c['mod'] if 1 <= c['mod'] <= 5 else {7: 8, 6: 9, 0: 10}[c['mod']]
CARDS = sorted(_mod.CARDS, key=ORDER); M = _mod.M
OUT = os.path.join(REPO, 'pdf', 'cards'); os.makedirs(OUT, exist_ok=True)
SITE = 'https://smartstudentshub.com/grade-%s' % GRADE
def b64(path): return base64.b64encode(open(path, 'rb').read()).decode()
LOGO = 'data:image/png;base64,' + b64(os.path.join(REPO, 'ssh-logo.png'))
def qr(url):
    q = qrcode.QRCode(border=1, box_size=6); q.add_data(url); q.make(fit=True)
    buf = io.BytesIO(); q.make_image(fill_color='#14244a', back_color='white').save(buf, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
QR = qr(SITE)
FONTCSS = ''.join("@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');font-weight:%s;unicode-range:%s}" % (
    fam, b64(os.path.join(FONTS, f)), w, ur)
    for fam, f, w, ur in [(fa, '%s-%s-%s-normal.woff2' % (fa.lower(), sub, w), w, r) for fa, sub, r in
                          [('Inter', 'latin', 'U+0000-024F,U+2000-206F,U+2190-21FF,U+2713,U+2717'), ('Tajawal', 'arabic', 'U+0600-06FF,U+FE70-FEFF')]
                          for w in ('400', '500', '700', '800')])

def e(s): return html.escape(s or '')
def bold(s): return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', e(s))
COL = {1: '#1e6fd9', 2: '#5b2a86', 3: '#00796b', 4: '#b4530a', 5: '#3949ab', 6: '#0f4c5c', 7: '#a8471f', 0: '#8c2f52'}

def items(lst, start=1, lines=False):
    out = []
    for i, it in enumerate(lst, start):
        q = bold(it['q'])
        if it['t'] == 'mcq':
            opts = ''.join('<span class="o"><i>%s</i> %s</span>' % ('abcd'[k], e(o)) for k, o in enumerate(it['o']))
            out.append('<li><span class="n">%d</span><div>%s<div class="opts">%s</div></div></li>' % (i, q, opts))
        else:
            ln = '<div class="ln"></div>' * (2 if lines and len(it['q']) > 70 else (1 if lines else 0))
            out.append('<li><span class="n">%d</span><div>%s%s</div></li>' % (i, q, ln))
    return '<ol class="it">%s</ol>' % ''.join(out)

def key(lst, start=1):
    return ' · '.join('<b>%d</b> %s' % (i, e(it['a'])) for i, it in enumerate(lst, start))

def card_html(c, idx):
    col = COL[c['mod']]
    if c['mod'] == 0: mod = 'Writing' + (' · Module %d' % c['module'] if c.get('module') else '')
    elif c['mod'] in (6, 7): mod = M[c['mod']]
    else: mod = 'Module %d' % c['mod'] + (' · ' + M[c['mod']] if M.get(c['mod']) else '')
    wr = c.get('kind') == 'writing'
    AR = re.compile(r'[\u0600-\u06FF]')
    def row(a, b, n):
        cells = [x for x in (b, n) if x]
        ar = [x for x in cells if AR.search(x)]; en = [x for x in cells if not AR.search(x)]
        if not ar: return '<tr><td class="w">%s</td><td colspan="2">%s</td></tr>' % (e(a), ' — '.join(e(x) for x in en))
        return '<tr><td class="w">%s</td><td>%s</td><td class="ar" dir="rtl">%s</td></tr>' % (e(a), ' — '.join(e(x) for x in en), e(' '.join(ar)))
    rows = ''.join(row(*r) for r in c['table'])
    sb = '<span class="chip sb">Student\'s Book %s</span>' % e(c['sb']) if c['sb'] else ''
    ex = ''.join('<li>%s</li>' % e(x) for x in c['ex'])
    mis = c['mistake']
    rembox = c.get('rem_box') or ''
    enrbox = c.get('enr_box') or ''
    return f'''
<section class="card" style="--c:{col}">
 <header class="hd">
  <div class="brand"><img src="{LOGO}" alt=""><div><b>Smart Students Hub</b><span>smartstudentshub.com</span></div></div>
  <div class="ttl"><div class="ar" dir="rtl">مراجعات وأوراق عمل إثرائية وعلاجية</div><div>Remedial &amp; Enrichment Revision Cards</div></div>
 </header>
 <div class="chips"><span class="chip">Grade {GRADE} · Term 1</span><span class="chip m">{e(mod)}</span>{sb}<span class="chip">Card {idx:02d}</span></div>
 <h1>{e(c['en'])}</h1><div class="h1ar ar" dir="rtl">{e(c['ar'])}</div>
 <div class="box rc"><div class="bt">📘 Revision card · بطاقة المراجعة</div>
  <table class="tb">{rows}</table>
  <p class="rule">{e(c['rule'])}</p><p class="rule ar" dir="rtl">{e(c['rule_ar'])}</p>
  <div class="two"><div><div class="st">Examples · أمثلة</div><ul class="ex">{ex}</ul></div>
  <div class="mis"><div class="st">⚠ Common mistake · خطأ شائع</div><div class="wrong">{e(mis[0])}</div><div class="right">{e(mis[1])}</div><div class="ar" dir="rtl">{e(mis[2])}</div></div></div>
 </div>
 <div class="box rem"><div class="bt"><span class="lv g">Remedial</span> 🟢 Practice · تدريب علاجي</div>
  <p class="ins">{e(c['rem_ins'])}</p>{f'<div class="{"psg" if c.get("kind") == "reading" else "wb"}">{e(rembox)}</div>' if rembox else ''}
  {items(c['rem'])}
 </div>
 <div class="box enr"><div class="bt"><span class="lv b">Enrichment</span> 🔵 Challenge · تدريب إثرائي</div>
  <p class="ins">{e(c['enr_ins'])}</p>{f'<div class="wb">{e(enrbox)}</div>' if enrbox else ''}
  {items(c['enr'], lines=True)}
 </div>
 <div class="key"><b>Answer key · مفتاح الإجابة</b><br><span class="kh">Remedial:</span> {key(c['rem'])}<br><span class="kh">Enrichment:</span> {key(c['enr'])}</div>
 <footer class="ft"><img src="{QR}" alt=""><div>Scan for more Grade {GRADE} resources · امسح لمزيد من الموارد<br><b>www.smartstudentshub.com</b> · © 2026 Smart Students Hub · Prepared by Sameh Soliman · Original material — free for classroom use</div><img class="lg" src="{LOGO}" alt=""></footer>
</section>'''

CSS = FONTCSS + '''
@page{size:A4;margin:11mm 11mm 12mm}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Tajawal,sans-serif;color:#14244a;font-size:10.2pt;line-height:1.42}
.ar{font-family:Tajawal,Inter,sans-serif}
.card{break-after:page}.card:last-child{break-after:auto}
.hd{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(120deg,#14244a,#5b2a86);color:#fff;border-radius:12px;padding:7px 12px}
.brand{display:flex;gap:8px;align-items:center}.brand img{width:34px;height:34px;background:#fff;border-radius:8px;padding:2px}
.brand b{display:block;font-size:11pt}.brand span{font-size:8pt;color:#ffd36b}
.ttl{text-align:right;font-size:8.5pt;color:#e6ecf7}.ttl .ar{font-size:12.5pt;font-weight:800;color:#ffd36b}
.chips{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0 3px}.chip{background:#e6ecf7;border-radius:20px;padding:1px 9px;font-size:8pt;font-weight:700}
.chip.m{background:var(--c);color:#fff}.chip.sb{background:#fff3d6;color:#7a4b00}
h1{margin:2px 0 0;font-size:16pt;line-height:1.15;color:var(--c)}.h1ar{font-size:12pt;font-weight:700;color:#5b2a86;margin-bottom:5px}
.box{border:1.6px solid #d9e3f0;border-radius:11px;padding:7px 10px;margin:6px 0;break-inside:avoid}
.rc{border-color:var(--c);background:#fbfcff}
.bt{font-weight:800;font-size:10.5pt;margin-bottom:4px;color:#14244a}
.tb{width:100%;border-collapse:collapse;font-size:9.4pt}.tb td{border-bottom:1px solid #e3e9f3;padding:2.5px 5px;vertical-align:top}
.tb td.w{font-weight:700;color:var(--c);white-space:nowrap}.tb td.ar{text-align:right;width:28%}
.rule{margin:5px 0 0}.rule.ar{text-align:right;color:#1e3a8a;margin-top:2px}
.two{display:grid;grid-template-columns:1.15fr 1fr;gap:10px;margin-top:5px}
.st{font-weight:800;font-size:9pt;color:#5b2a86}.ex{margin:2px 0;padding-left:16px}
.mis{background:#fff4f4;border-left:4px solid #b3261e;border-radius:6px;padding:4px 8px}.wrong{color:#b3261e}.right{color:#1a7f4b;font-weight:700}.mis .ar{text-align:right}
.lv{display:inline-block;border-radius:6px;padding:0 6px;color:#fff;font-size:8pt;margin-right:4px;vertical-align:1px}.lv.g{background:#1a7f4b}.lv.b{background:#1e6fd9}
.rem{border-color:#9fd3b4}.enr{border-color:#a9c7f2}
.psg{border:1.4px solid #c9d6ee;background:#f7f9fd;border-radius:8px;padding:6px 10px;margin:2px 0 6px;line-height:1.5;text-align:left}
.ins{margin:0 0 3px;font-weight:600;font-style:italic}
.wb{border:1.4px dashed #5b2a86;border-radius:8px;padding:3px 8px;margin:2px 0 5px;text-align:center;font-weight:700;color:#5b2a86}
.it{list-style:none;margin:0;padding:0;columns:1}.it li{display:flex;gap:6px;margin:4px 0;break-inside:avoid}
.n{flex:0 0 18px;height:18px;border-radius:50%;background:var(--c);color:#fff;font-weight:800;font-size:8pt;display:inline-grid;place-items:center}
.opts{display:flex;flex-wrap:wrap;gap:3px 14px;margin-top:1px}.o i{font-style:normal;font-weight:800;color:var(--c)}
.ln{border-bottom:1px dotted #9aa8c2;height:19px}
.key{font-size:7.8pt;color:#46536e;border-top:1.5px dashed #c9d6ee;margin-top:6px;padding-top:4px;break-inside:avoid}.key b{color:#14244a}.kh{font-weight:800;color:#5b2a86}
.ft{display:flex;gap:8px;align-items:center;margin-top:7px;padding-top:5px;border-top:2px solid #e8a317;font-size:7.6pt;color:#46536e;break-inside:avoid}
.ft img{width:44px;height:44px}.ft .lg{width:26px;height:26px;margin-left:auto}
'''

async def render(html_doc, path, pw):
    b = await pw.chromium.launch(); pg = await b.new_page()
    await pg.set_content(html_doc, wait_until='load'); await pg.wait_for_timeout(300)
    await pg.pdf(path=path, format='A4', print_background=True, prefer_css_page_size=True)
    await b.close()

async def main():
    meta = []
    async with async_playwright() as pw:
        for i, c in enumerate(CARDS, 1):
            doc = '<!doctype html><html><head><meta charset="utf-8"><title>%s</title><style>%s</style></head><body>%s</body></html>' % (
                e('SSH · Grade %s · ' % GRADE + c['en']), CSS, card_html(c, i))
            p = os.path.join(OUT, c['id'] + '.pdf'); await render(doc, p, pw)
            n = len(PdfReader(p).pages)
            meta.append(dict(id=c['id'], grade=GRADE, n=i, mod=c['mod'], module=c.get('module'), en=c['en'], ar=c['ar'], sk=c['sk'], sb=c['sb'], pages=n,
                             file='pdf/cards/%s.pdf' % c['id'], kind=c.get('kind', 'language')))
            print('%02d %-42s pages=%d' % (i, c['id'], n))
        doc = '<!doctype html><html><head><meta charset="utf-8"><title>SSH · Grade %s · Remedial &amp; Enrichment Revision Cards</title><style>%s</style></head><body>%s</body></html>' % (
            GRADE, CSS, ''.join(card_html(c, i) for i, c in enumerate(CARDS, 1)))
        await render(doc, os.path.join(OUT, 'G%s_Remedial_Enrichment_Cards_All.pdf' % GRADE), pw)
    for p in [os.path.join(OUT, m['id'] + '.pdf') for m in meta] + [os.path.join(OUT, 'G%s_Remedial_Enrichment_Cards_All.pdf' % GRADE)]:
        w = PdfWriter(clone_from=p); w.add_metadata({'/Title': 'Smart Students Hub · Grade %s Remedial & Enrichment Revision Cards' % GRADE, '/Author': 'Smart Students Hub', '/Creator': 'Smart Students Hub'})
        w.write(p)
    jp = os.path.join(OUT, 'cards.json')
    old = [m for m in (json.load(open(jp, encoding='utf-8')) if os.path.exists(jp) else []) if m.get('grade', '12') != GRADE]
    json.dump(old + meta, open(jp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('all pages', len(PdfReader(os.path.join(OUT, 'G%s_Remedial_Enrichment_Cards_All.pdf' % GRADE)).pages))

asyncio.run(main())
