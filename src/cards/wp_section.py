# -*- coding: utf-8 -*-
"""Build the WordPress block markup for the Grade 12 section
"مراجعات وأوراق عمل إثرائية وعلاجية" (one tile per card). Output: src/cards/wp-section-g12.html
Insert it on the Grade 12 page (ID 250) after the "1b All resources list" section, ONLY after approval."""
import json, os, html
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
import sys
GRADE = sys.argv[1] if len(sys.argv) > 1 else '12'
meta = [m for m in json.load(open(os.path.join(REPO, 'pdf', 'cards', 'cards.json'), encoding='utf-8')) if m.get('grade', '12') == GRADE]
GATE = 'https://mrsameh2024.github.io/tests/open.html?f='
COL = {1: '#1e6fd9', 2: '#5b2a86', 3: '#00796b', 4: '#b4530a', 5: '#3949ab', 6: '#0f4c5c', 7: '#a8471f', 0: '#8c2f52'}
ICON = {1: '🌍', 2: '📚', 3: '🤝', 4: '✈️', 5: '💼', 6: '📖', 7: '⚙️', 0: '✍️'}
T12 = {1: 'Window on the World', 2: 'A Thirst for Knowledge', 3: 'Human Nature', 4: 'Pack Your Bags', 5: 'Just the Job'}
AR = {1: 'الوحدة 1', 2: 'الوحدة 2', 3: 'الوحدة 3', 4: 'الوحدة 4', 5: 'الوحدة 5'}
mods = sorted({m['mod'] for m in meta if 1 <= m['mod'] <= 5})
GROUPS = [(k, 'Module %d · %s' % (k, T12[k]) if GRADE == '12' else 'Module %d · Vocabulary' % k, AR[k] + ('' if GRADE == '12' else ' · المفردات')) for k in mods]
GROUPS += [(7, 'Grammar', 'القواعد'), (6, 'Reading', 'القراءة'), (0, 'Writing', 'الكتابة')]
GROUPS = [g for g in GROUPS if any(m['mod'] == g[0] for m in meta)]
e = html.escape

def tile(m):
    c = COL[m['mod']]; key = 'g%s-card-' % GRADE + m['id'][4:]
    return f'''<!-- wp:group {{"style":{{"spacing":{{"padding":{{"top":"12px","bottom":"12px","left":"12px","right":"12px"}},"blockGap":"8px"}},"border":{{"radius":"16px"}},"color":{{"background":"{c}","text":"#ffffff"}}}},"layout":{{"type":"flex","orientation":"vertical","justifyContent":"stretch","verticalAlignment":"space-between"}}}} -->
<div class="wp-block-group has-text-color has-background" style="border-radius:16px;color:#ffffff;background-color:{c};padding-top:12px;padding-right:12px;padding-bottom:12px;padding-left:12px"><!-- wp:paragraph {{"style":{{"typography":{{"lineHeight":"1.3"}}}}}} -->
<p style="line-height:1.3"><small style="display:inline-block;background:rgba(255,255,255,.22);border-radius:20px;padding:1px 8px;font-size:.72rem;font-weight:700">Card {m['n']:02d} · بطاقة</small><br><span style="font-size:1.45rem">{ICON[m['mod']]}</span> <strong style="font-size:1rem">{e(m['en'])}</strong><br><strong dir="rtl" style="display:block;text-align:right;font-size:1rem">{e(m['ar'])}</strong></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {{"width":100,"linkTarget":"_blank","rel":"noreferrer noopener","style":{{"color":{{"background":"#ffffff","text":"{c}"}},"border":{{"radius":"10px"}},"typography":{{"fontWeight":"800"}}}}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link has-text-color has-background wp-element-button" href="{GATE}{key}" style="border-radius:10px;color:{c};background-color:#ffffff;font-weight:800" target="_blank" rel="noreferrer noopener">Open · افتح</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->'''

def para(txt, extra=''):
    return f'<!-- wp:paragraph {{"align":"center","style":{{"typography":{{"fontSize":"0.95rem"}}}}}} -->\n<p class="has-text-align-center" style="font-size:0.95rem{extra}">{txt}</p>\n<!-- /wp:paragraph -->'

parts = ['''<!-- wp:group {"tagName":"section","metadata":{"name":"1c Remedial & Enrichment Cards"},"anchor":"remedial-enrichment","align":"full","style":{"spacing":{"padding":{"top":"24px","bottom":"32px","left":"16px","right":"16px"},"margin":{"top":"0","bottom":"0"},"blockGap":"14px"},"color":{"background":"#fff8ec","text":"#14244a"}},"layout":{"type":"constrained","contentSize":"1200px"}} -->
<section id="remedial-enrichment" class="wp-block-group alignfull has-text-color has-background" style="color:#14244a;background-color:#fff8ec;margin-top:0;margin-bottom:0;padding-top:24px;padding-right:16px;padding-bottom:32px;padding-left:16px"><!-- wp:heading {"textAlign":"center","style":{"typography":{"fontWeight":"800"}}} -->
<h2 class="wp-block-heading has-text-align-center" style="font-weight:800"><span dir="rtl">مراجعات وأوراق عمل إثرائية وعلاجية</span><br>Remedial &amp; Enrichment Revision Cards</h2>
<!-- /wp:heading -->''',
 para('One card per topic: a short revision card, remedial practice, an enrichment challenge and the answer key. Open the card for the skill you need. 🔒 PDF files open after a quick one-time registration.<br><span dir="rtl">بطاقة لكل موضوع: مراجعة مختصرة، وتدريب علاجي، وتحدٍّ إثرائي، ومفتاح الإجابة. افتح بطاقة المهارة التي تحتاجها. 🔒 تُفتح الملفات بعد تسجيل سريع لمرة واحدة.</span>')]
for mod, en, ar in GROUPS:
    parts.append(f'<!-- wp:heading {{"level":3,"style":{{"typography":{{"fontWeight":"700"}},"color":{{"text":"{COL[mod]}"}}}}}} -->\n<h3 class="wp-block-heading has-text-color" style="color:{COL[mod]};font-weight:700">{e(en)} · <span dir="rtl">{ar}</span></h3>\n<!-- /wp:heading -->')
    parts.append('<!-- wp:group {"style":{"spacing":{"blockGap":"10px"}},"layout":{"type":"grid","minimumColumnWidth":"11rem"}} -->\n<div class="wp-block-group">' +
                 '\n\n'.join(tile(m) for m in meta if m['mod'] == mod) + '</div>\n<!-- /wp:group -->')
parts.append('''<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"linkTarget":"_blank","rel":"noreferrer noopener","style":{"color":{"background":"#14244a","text":"#ffffff"},"border":{"radius":"10px"},"typography":{"fontWeight":"800"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-text-color has-background wp-element-button" href="https://mrsameh2024.github.io/tests/open.html?f=g__GRADE__-cards-all" style="border-radius:10px;color:#ffffff;background-color:#14244a;font-weight:800" target="_blank" rel="noreferrer noopener">📥 All __N__ cards in one PDF · كل البطاقات في ملف واحد</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></section>
<!-- /wp:group -->''')
open(os.path.join(os.path.dirname(__file__), 'wp-section-g%s.html' % GRADE), 'w', encoding='utf-8').write(('\n\n'.join(parts) + '\n').replace('__GRADE__', GRADE).replace('__N__', str(len(meta))))
print('tiles', len(meta))
