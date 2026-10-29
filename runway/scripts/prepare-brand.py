"""Preserve supplied SVG layout; optimize only its embedded raster encodings for mobile."""
from pathlib import Path
from PIL import Image
import re,io,base64
root=Path(__file__).resolve().parents[1]
s=(root/'assets-source/brand/runway-original.svg').read_text()
def optimize(m):
 image=Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
 image.thumbnail((1024,1024),Image.Resampling.LANCZOS)
 b=io.BytesIO();image.save(b,format='WEBP',quality=92,method=6)
 return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
s=re.sub(r'data:image/png;base64,([A-Za-z0-9+/=\s]+)(?=[\"\'])',optimize,s)
(root/'public/assets/brand/runway-logo.svg').write_text(s)
im=Image.open(root/'assets-source/brand/sol-reference.png');im.thumbnail((128,128),Image.Resampling.LANCZOS);im.save(root/'public/assets/brand/sol-coin.webp',format='WEBP',quality=92,method=6)
print('logo',len(s),'coin', (root/'public/assets/brand/sol-coin.webp').stat().st_size)
