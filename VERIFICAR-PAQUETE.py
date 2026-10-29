from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parent
manifest=json.loads((root/'MANIFEST-SHA256.json').read_text())
errors=[]
for name,item in manifest.items():
 p=root/name
 if not p.is_file() or p.is_symlink() or p.stat().st_size!=item['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:
  errors.append(name)
if errors:
 print('ERROR: archivos ausentes o diferentes:',*errors,sep='\n');sys.exit(1)
print(f'OK: {len(manifest)} archivos verificados con SHA256.')
