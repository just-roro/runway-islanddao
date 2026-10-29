import {it,expect} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {generate,initialState,step,TIMING,boostFactor,UPDRAFTS} from '../src/core/simulation';
import {flyRoute} from './test-pilot';
import {atmosphere,CLOUD_REVEAL} from '../src/scene/atmosphere';
it('dense bank clears before deployment and recovers without a discontinuity',()=>{
 expect(atmosphere(28).immersion).toBe(1);expect(atmosphere(CLOUD_REVEAL.end).immersion).toBe(0);expect(CLOUD_REVEAL.end).toBeLessThan(TIMING.cloud);
 for(let t=18;t<40;t+=.001){const a=atmosphere(t),b=atmosphere(t+.001);expect(Math.abs(a.immersion-b.immersion)).toBeLessThan(.001);expect(Math.abs(a.exposure-b.exposure)).toBeLessThan(.001);}
});
it('two glide stars add no RNG consumption or changes to the preceding 1000 seeded courses',()=>{
 const hashes=JSON.parse(readFileSync('reports/parachute45/course-before.json','utf8'));
 for(let seed=0;seed<1000;seed++){
  const all=generate(seed),stars=all.filter(o=>o.id.startsWith('glide-star-'));
  expect(stars).toHaveLength(2);expect(stars.every(o=>o.vertical&&o.fallSpeed===0&&o.r===3.2)).toBe(true);
  expect(createHash('sha256').update(JSON.stringify(all.filter(o=>!o.id.startsWith('glide-star-')))).digest('hex')).toBe(hashes[seed]);
 }
});
it('glide boost improves range without added lift, faster sinking, or duplicate contacts',()=>{
 const setup=()=>{const s=initialState(17);s.routeTime=38;s.tick=2280;s.x=0;s.y=301;s.altitude=145;s.vy=-27.7333;s.objects=[];return s;};
 const normal=setup(),boosted=setup();boosted.objects=[{id:'test-glide-star',kind:'star',x:0,y:300.9,alt:145,t:38,r:3.2,motion:0,vertical:true}];
 for(let i=0;i<100;i++){step(normal,{x:0,y:1});step(boosted,{x:0,y:1});}
 expect(boosted.events.filter(e=>e.kind==='star')).toHaveLength(1);expect(boosted.altitude).toBeCloseTo(normal.altitude,8);expect(normal.y-boosted.y).toBeGreaterThan(5);expect(normal.y-boosted.y).toBeLessThan(9);expect(boostFactor(boosted)).toBe(1);
});
it('long destination still needs lift and the two alternative stars are reachable',()=>{
 const rows=[];
 for(const currents of [false,true])for(const side of [-1,1])for(let seed=0;seed<50;seed++){
  const s=initialState(seed);while(!s.result)step(s,flyRoute(s,'jurere',currents,side));
  rows.push({seed,currents,side,destination:s.destination,lift:s.lift,stars:s.collected.filter(id=>id.startsWith('glide-star-')),hits:s.hazardHits});
 }
 writeFileSync('reports/parachute45/routes.json',JSON.stringify(rows));
 expect(rows.filter(r=>!r.currents&&r.destination==='jurere')).toHaveLength(0);
 expect(rows.filter(r=>r.currents&&r.destination==='jurere').length).toBeGreaterThan(70);
 for(const side of [-1,1])expect(rows.filter(r=>r.side===side&&r.stars.length>0).length).toBeGreaterThan(0);
 expect(UPDRAFTS).toHaveLength(2);
},60000);
