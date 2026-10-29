"""Offline OSM relation 3360578 -> simplified game coastline. ODbL 1.0.
Usage: python3 scripts/import-coast.py /path/to/relation-full.json
Source: https://api.openstreetmap.org/api/0.6/relation/3360578/full.json
"""
import json, math, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
j=json.load(open(sys.argv[1]));nodes={e['id']:(e['lon'],e['lat']) for e in j['elements'] if e['type']=='node'};ways={e['id']:e['nodes'] for e in j['elements'] if e['type']=='way'}
r=next(e for e in j['elements'] if e['type']=='relation' and e['id']==3360578)
remaining=[ways[m['ref']] for m in r['members'] if m['role']=='outer'];chain=remaining.pop(0)[:]
while remaining:
 for i,w in enumerate(remaining):
  if w[0]==chain[-1]:chain+=w[1:];remaining.pop(i);break
  if w[-1]==chain[-1]:chain+=w[-2::-1];remaining.pop(i);break
 else:raise ValueError('Disconnected coastline: inspect source before importing')
assert chain[0]==chain[-1]
scale=320/(max(nodes[n][1] for n in chain)-min(nodes[n][1] for n in chain))
points=[((nodes[n][0]+48.49)*math.cos(math.radians(27.6))*scale,(nodes[n][1]+27.45)*scale+100) for n in chain]
def simplify(ps,tol):
 a,b=ps[0],ps[-1];dx,dy=b[0]-a[0],b[1]-a[1];norm=dx*dx+dy*dy
 def dist(p):
  u=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/norm)) if norm else 0
  return math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy)
 ds=[dist(p) for p in ps];i=max(range(len(ds)),key=lambda i:ds[i])
 return simplify(ps[:i+1],tol)[:-1]+simplify(ps[i:],tol) if ds[i]>tol else [a,b]
coast=[[round(x,3),round(z,3)] for x,z in simplify(points,.7)[:-1]]
(root/'public/assets/geography').mkdir(exist_ok=True,parents=True)
(root/'public/assets/geography/santa-catarina.json').write_text(json.dumps({'attribution':'© OpenStreetMap contributors','license':'https://opendatacommons.org/licenses/odbl/1-0/','source':'https://www.openstreetmap.org/relation/3360578','projection':{'originLon':-48.49,'originLat':-27.45,'scale':scale,'zOffset':100},'coast':coast},indent=2)+'\n')
p=root/'src/core/simulation.ts';s=p.read_text();start=s.index('export const COAST=');end=s.index('\nexport function isSafeLanding',start)
s=s[:start]+'// Simplified OSM relation 3360578; © OpenStreetMap contributors, ODbL 1.0.\nexport const COAST:[number,number][]='+json.dumps(coast,separators=(',',':'))+';'+s[end:];p.write_text(s)
print('Coast vertices:',len(coast))
