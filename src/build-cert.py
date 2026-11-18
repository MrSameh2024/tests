"""Builds ssh-cert.js from src/ssh-cert.src.js, inserting the signature SVG used on Academy certificates."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
sig = (root / 'src' / 'signature.svg').read_text(encoding='utf-8')
src = (root / 'src' / 'ssh-cert.src.js').read_text(encoding='utf-8')
(root / 'ssh-cert.js').write_text(src.replace('__SIG__', json.dumps(sig, ensure_ascii=False)), encoding='utf-8')
print('ssh-cert.js written')
