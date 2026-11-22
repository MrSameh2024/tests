"""Add (or refresh) the two pathway script tags on every graded test page. Idempotent."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tag import PAGES
REPO = sys.argv[1] if len(sys.argv) > 1 else '.'
V = sys.argv[2] if len(sys.argv) > 2 else '1'
for page in PAGES:
    p = os.path.join(REPO, page); s = open(p, encoding='utf-8').read()
    s = re.sub(r'\n?<script src="pathways/[^"]+"></script><script src="ssh-pathways\.js[^"]*"></script>', '', s)
    tag = '\n<script src="pathways/%s?v=%s"></script><script src="ssh-pathways.js?v=%s"></script>' % (page.replace('.html', '.js'), V, V)
    if '</body>' in s: s = s.replace('</body>', tag + '\n</body>', 1) if s.count('</body>') == 1 else s[:s.rfind('</body>')] + tag + '\n' + s[s.rfind('</body>'):]
    else: s = s[:s.rfind('</html>')] + tag + '\n' + s[s.rfind('</html>'):]
    open(p, 'w', encoding='utf-8').write(s); print('ok', page)
