"""Export original NFT layers; no redraw. Run with the bundled Python (Pillow)."""
import csv, io, json, pathlib, sys, zipfile
from PIL import Image, ImageDraw

root = pathlib.Path(__file__).resolve().parents[1]
archive = zipfile.ZipFile(sys.argv[1] if len(sys.argv)>1 else root.parent/'IslandDAO Assets.fig')
items = json.loads((root/'src/assets/accessories.json').read_text())
pilots = json.loads((root/'src/assets/perks.json').read_text())
out = root/'public/assets/cosmetics'; out.mkdir(parents=True, exist_ok=True)
report = root/'reports/cosmetics42'; report.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB',(9*148,12*174),'#071f32'); draw = ImageDraw.Draw(sheet)
rows=[]
def source(key):
    im=Image.open(io.BytesIO(archive.read('images/'+key))).convert('RGBA')
    assert im.size==(880,880)
    return im
for index,pilot in enumerate(pilots):
    base=source(pilot['source']['imageHash'])
    layers=[(a,source(a['source']['hash'])) for a in items if a['pilot']==index]
    bounds=[im.getbbox() for im in [base]+[im for _,im in layers]]
    bounds=[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)]
    # One shared square coordinate system for the whole kit, including halo/hats.
    side=max(bounds[2]-bounds[0],bounds[3]-bounds[1])+40
    left=(bounds[0]+bounds[2]-side)//2; top=(bounds[1]+bounds[3]-side)//2
    crop=(left,top,left+side,top+side)
    for col,(item,layer) in enumerate([(None,None)]+layers):
        composition=base.copy()
        if layer is not None: composition.alpha_composite(layer)
        fitted=composition.crop(crop).resize((256,256),Image.Resampling.NEAREST)
        filename=pathlib.Path(item['image']).name if item else pilot['id']+'-none.png'
        fitted.save(out/filename,optimize=True)
        thumb=fitted.resize((140,140),Image.Resampling.NEAREST)
        sheet.paste(thumb,(col*148,index*174),thumb)
        draw.text((col*148+2,index*174+140),item['name'] if item else pilot['name'],fill='white')
        if item:
            draw.text((col*148+2,index*174+155),item['tier'],fill='#80eacb')
            rows.append({**{k:item[k] for k in ['id','name','pilot','tier','price','image']},'category':'accessory','geometry':'LED portrait layer','node':item['source']['node'],'hash':item['source']['hash'],'kit':item['source']['kit'],'fit':str(crop)})
sheet.save(report/'nft-contact-sheet.png')
with (report/'nft-inventory.csv').open('w') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
assert len(rows)==94
print('Exported',len(rows),'original accessories + 12 bases; source images and shared kit bounds verified.')
