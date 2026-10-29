import {expect,it} from 'vitest';
import {Vector3} from 'three';
import {stormBank} from '../src/scene/stormBank';
import {cloudField} from '../src/scene/cloudField';
import {START_Z} from '../src/core/simulation';

it('storm banks are closed outward-facing volumes with organic profiles and a bounded GPU cost',()=>{
 const variants=[stormBank(0),stormBank(1)];
 expect(Array.from(variants[0].attributes.position.array)).not.toEqual(Array.from(variants[1].attributes.position.array));
 for(const g of variants){
  const p=g.getAttribute('position'),index=g.getIndex()!,edges=new Map<string,number>(),a=new Vector3(),b=new Vector3(),c=new Vector3();let volume=0;
  expect(index.count/3).toBeLessThanOrEqual(176);expect(p.count).toBeLessThanOrEqual(90);
  for(let i=0;i<p.count;i++){a.fromBufferAttribute(p,i);expect(a.toArray().every(Number.isFinite)).toBe(true);expect(a.length()).toBeLessThanOrEqual(1.00001);}
  for(let i=0;i<index.count;i+=3){
   const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];
   a.fromBufferAttribute(p,triangle[0]);b.fromBufferAttribute(p,triangle[1]);c.fromBufferAttribute(p,triangle[2]);
   volume+=a.dot(b.clone().cross(c))/6;
   expect(b.sub(a).cross(c.sub(a)).length()).toBeGreaterThan(.0001);
   for(let e=0;e<3;e++){const key=[triangle[e],triangle[(e+1)%3]].sort((x,y)=>x-y).join(',');edges.set(key,(edges.get(key)??0)+1);}
  }
  expect(volume).toBeGreaterThan(.3);expect([...edges.values()].every(n=>n===2)).toBe(true);
  const colors=g.getAttribute('color');expect(Math.max(...colors.array)-Math.min(...colors.array)).toBeGreaterThan(.35);
  g.dispose();
 }
 const field=cloudField(),storm=field.near.filter(c=>c.storm!==undefined);
 expect(storm).toHaveLength(48);expect(new Set(storm.map(c=>c.storm)).size).toBe(2);
 for(const c of storm)expect(Math.hypot(c.x,c.z-START_Z)-Math.max(c.sx,c.sz)).toBeGreaterThanOrEqual(25.999);
 const triangles=(field.near.length-storm.length)*80+storm.length*176+field.middle.length*80+field.far.length*2;
 expect(triangles).toBe(24048);expect(cloudField()).toEqual(field);
});
