"""Build g11-writing.html in the repo from the Grade 10 writing page shell + Grade 11 app files.
Usage: python3 build.py /home/claude/tests"""
import sys, os, re
repo = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(repo, 'g10-writing-module-03-article.html'), encoding='utf-8').read()

# shared pieces taken from the live Grade 10 page (gate, contact bar, footer)
shell_css = src[src.index('<script src="ssh-voice.js"></script><style>'):src.index('</head>')]
top = src[src.index('<body>') + 6:src.index('<header')]
foot_start = src.rindex('<footer', 0, src.index('class="ssh-foot"') + 20)
foot = src[foot_start:src.index('</footer>') + 9]
g0 = src.index('<div class="gate" id="gate"')
g1 = src.index('</script>', g0) + 9
gate = src[g0:g1].replace("PAGE='g10-writing-module-03-article'", "PAGE='g11-writing'")
assert "PAGE='g11-writing'" in gate

rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Grade 11 Writing Courses · Modules 3–5 | Smart Students Hub</title>
<meta name="description" content="Six bilingual Grade 11 writing courses (Modules 3–5): diary, story, announcement, cause-and-effect essay, summary and discussion essay. Ten stations each, dictation practice and a printable progress report.">
<link rel="icon" href="og-image.png">
<style>
{rd('app.css')}
</style>
{shell_css}</head>
<body>{top}<div id="app"></div>
{foot}
{gate}
<script>
{rd('data1.js')}
{rd('data2.js')}
</script>
<script>
{rd('app.js')}
</script>
</body>
</html>
'''
open(os.path.join(repo, 'g11-writing.html'), 'w', encoding='utf-8').write(html)
print('ok', len(html))
