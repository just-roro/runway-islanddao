import {it,expect} from 'vitest';
import {initialState,step,generate,sequenceActive,collectSequence,ringReveal,objectPose,altitudeAt,TIMING,START_CASH,ECONOMY,COURSE_CONFIG,quantize,decoded,replay,type State} from '../src/core/simulation';
import {flyRoute} from './test-pilot';
const steer=(s:State)=>{const o=s.objects.find(o=>o.sequence&&sequenceActive(s,o));return {x:Math.max(-1,Math.min(1,((o?.x??s.x)-s.x)*1.5)),y:Math.max(-1,Math.min(1,(s.y-(o?.y??s.y))*1.5))};};
it('short, medium and long chains are physically reachable, even at sustained maximum boost',()=>{
 for(let seed=0;seed<20;seed++)for(const boost of [false,true])for(const name of ['sky-20','sky-45','sky-76']){
  const s=initialState(seed);s.objects=s.objects.filter(o=>o.sequence===name);const count=s.objects.length;
  while(s.routeTime<TIMING.cloud&&!s.result){if(boost){s.boostStart=0;s.boostUntil=99999;}step(s,steer(s));expect(s.objects.filter(o=>sequenceActive(s,o))).toHaveLength(s.sequences[name]?.status==='completed'?0:1);}
  expect(s.sequences[name],`seed ${seed} ${name} boost ${boost}`).toMatchObject({status:'completed',next:count});expect([3,4,6]).toContain(count);expect(s.cash).toBe(START_CASH+ECONOMY.sequence);expect(s.events.filter(e=>e.delta>0)).toHaveLength(1);
 }
});
it('a miss closes the entire chain once; hidden contacts and duplicate contacts cannot award',()=>{
 const s=initialState(4);s.objects=s.objects.filter(o=>o.sequence==='sky-20');const first=s.objects[0];
 while(s.routeTime<TIMING.cloud)step(s,{x:1,y:1});expect(s.sequences[first.sequence!].status).toBe('failed');expect(s.events.filter(e=>e.kind==='sequence-missed')).toHaveLength(1);expect(s.cash).toBe(START_CASH);expect(s.objects.some(o=>sequenceActive(s,o))).toBe(false);
 for(const o of s.objects)collectSequence(s,o);expect(s.cash).toBe(START_CASH);
 const r=initialState(4),rings=r.objects.filter(o=>o.sequence==='sky-20');for(const o of rings){collectSequence(r,o);collectSequence(r,o);}expect(r.events.filter(e=>e.kind==='sequence-complete')).toHaveLength(1);expect(r.cash).toBe(START_CASH+ECONOMY.sequence);
});
it('appearance starts at each activation, advances smoothly, and stops on pause (fixed tick)',()=>{
 const s=initialState(1),o=s.objects.find(o=>o.sequence&&o.order===0)!;expect(ringReveal(s,o)).toBe(0);s.sequences[o.sequence!]={status:'active',next:0,activatedTick:s.tick};s.tick+=8;expect(ringReveal(s,o)).toBeGreaterThan(0);expect(ringReveal(s,o)).toBeLessThan(1);const frozen=ringReveal(s,o);expect(ringReveal(s,o)).toBe(frozen);s.tick+=12;expect(ringReveal(s,o)).toBe(1);
 collectSequence(s,o);const next=s.objects.find(p=>p.sequence===o.sequence&&p.order===1)!;expect(ringReveal(s,next)).toBe(0);expect(sequenceActive(s,o)).toBe(false);expect(sequenceActive(s,next)).toBe(true);
});
it('magnetic cash cannot trail forever at full fall speed, boost or deployment',()=>{
 for(const route of [10,TIMING.glide-.06,TIMING.glide+1])for(const boosted of [false,true]){
  const s=initialState(5);s.tick=Math.floor(route*60);s.routeTime=route;s.phase=route>=TIMING.glide?'land':'build';s.x=0;s.y=350;s.altitude=altitudeAt(route);s.magnetUntil=s.tick+480;
  if(boosted){s.boostStart=s.tick-20;s.boostUntil=s.tick+72;}
  const o={id:'formerly-stuck',kind:'sol' as const,t:route,x:2.5,y:s.y,r:.5,motion:0,alt:s.altitude,vertical:route>=TIMING.glide};s.objects=[o];
  for(let i=0;i<60;i++)step(s,{x:.7,y:0});expect(s.collected).toEqual([o.id]);expect(s.events.filter(e=>e.sourceId===o.id)).toHaveLength(1);expect(s.cash).toBe(20000);expect(Number.isFinite(objectPose(o,s.routeTime).x)).toBe(true);
 }
});
it('all enabled items spawn reproducibly; HACK is capped; physical solids keep clearance',()=>{
 const counts:Record<string,number>={};let rareRuns=0;
 for(let seed=0;seed<1000;seed++){const objects=generate(seed);expect(objects).toEqual(generate(seed));expect(objects.filter(o=>o.kind==='hacked').length).toBeLessThanOrEqual(COURSE_CONFIG.maxHacked);if(objects.some(o=>o.kind==='rare'))rareRuns++;
  for(const o of objects)counts[o.kind]=(counts[o.kind]??0)+1;
  expect(objects.filter(o=>o.kind==='sol')).toHaveLength(128);expect(objects.filter(o=>o.sequence?.startsWith('sky')&&o.order===0).map(o=>o.count).sort()).toEqual([3,4,6]);
  const solids=objects.filter(o=>['gas','rug','hacked','delivery'].includes(o.kind));for(let i=1;i<solids.length;i++)expect(solids[i].kind).not.toBe(solids[i-1].kind);for(let i=0;i<solids.length;i++)for(const p of solids.slice(i+1)){const o=solids[i];if(!!o.vertical!==!!p.vertical)continue;expect(Math.hypot(o.x-p.x,o.y-p.y,o.alt!-p.alt!)).toBeGreaterThanOrEqual(o.r+p.r+1);}
 }
 expect(Object.keys(counts).sort()).toEqual(['community','delivery','gas','gate','hacked','magnet','rare','rug','sol','star','term','water']);expect(counts.risk).toBeUndefined();expect(rareRuns).toBeGreaterThan(5);expect(Math.abs(rareRuns-1000*COURSE_CONFIG.rareChance)).toBeLessThan(4*Math.sqrt(1000*COURSE_CONFIG.rareChance*(1-COURSE_CONFIG.rareChance)));console.log('DISTRIBUTION37',JSON.stringify({seeds:1000,counts,rareRuns}));
},20000);
it('100 seeded runs preserve the full ledger, unique grants and exact replay',()=>{
 const stats=[];for(let seed=0;seed<100;seed++){
  const s=initialState(seed),frames:number[][]=[];while(!s.result){const q=quantize(flyRoute(s));frames.push(q);step(s,decoded(q));step(s,decoded(q));}
  const copy=replay(seed,frames);expect(copy).toEqual(s);const sources=s.events.filter(e=>e.sourceId).map(e=>e.sourceId);expect(new Set(sources).size).toBe(sources.length);expect(s.cash).toBe(START_CASH+s.income-s.loss+s.bonus);stats.push({seed,cash:s.cash,outcome:s.outcome,collect:s.collected.length});
 }console.log('RUNS37',JSON.stringify({runs:stats.length,landed:stats.filter(s=>s.outcome==='landed').length,mean:stats.reduce((n,s)=>n+s.cash,0)/stats.length,min:Math.min(...stats.map(s=>s.cash)),max:Math.max(...stats.map(s=>s.cash))}));
},120000);
