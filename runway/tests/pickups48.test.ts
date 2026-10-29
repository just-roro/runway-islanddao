import {expect,it} from 'vitest';
import {CONTENT_CATALOG,COURSE_CONFIG,ECONOMY,generate,initialState,step,replay,quantize,decoded,type Kind} from '../src/core/simulation';
import {flyRoute} from './test-pilot';

it('every enabled pickup survives generation and clearance across 2,000 reproducible seeds',()=>{
 const seen=new Set<string>(),totals:Record<string,number>={};let rareRuns=0;
 for(let seed=0;seed<2000;seed++){
  const objects=generate(seed);expect(objects).toEqual(generate(seed));
  const counts:Record<string,number>={};
  for(const o of objects){seen.add(o.kind);counts[o.kind]=(counts[o.kind]??0)+1;totals[o.kind]=(totals[o.kind]??0)+1;}
  expect(counts).toMatchObject({sol:128,community:3,term:2,magnet:2,water:1,star:18,gate:19});
  expect(counts.hacked??0).toBeLessThanOrEqual(COURSE_CONFIG.maxHacked);
  expect(counts.rare??0).toBeLessThanOrEqual(1);rareRuns+=counts.rare??0;
  const encounters=objects.filter(o=>o.id.startsWith('encounter-'));
  for(let i=1;i<encounters.length;i++)expect(encounters[i].kind).not.toBe(encounters[i-1].kind);
  for(const kind of ['community','term','magnet'] as Kind[])expect(objects.filter(o=>o.kind===kind).every(o=>!o.vertical)).toBe(true);
 }
 expect([...seen].sort()).toEqual(CONTENT_CATALOG.filter(o=>o.id!=='tower'&&o.id!=='ocean').map(o=>o.id).sort());
 // Total drop probability, not a sum of per-product rolls. Ordinary items are guaranteed slots.
 const expected=2000*COURSE_CONFIG.rareChance,sigma=Math.sqrt(expected*(1-COURSE_CONFIG.rareChance));
 expect(Math.abs(rareRuns-expected)).toBeLessThan(4*sigma);
 expect(totals.community).toBe(6000);expect(totals.term).toBe(4000);expect(totals.magnet).toBe(4000);
},30000);

it('COMMUNITY, TERM SHEET and MAGNET are collected by real, replayable control inputs',()=>{
 const collected={community:0,term:0,magnet:0};
 for(let seed=0;seed<100;seed++){
  const state=initialState(seed),frames:number[][]=[];let inspected=0;
  while(!state.result){
   const pair=quantize(flyRoute(state));frames.push(pair);
   for(let frame=0;frame<2;frame++){
    step(state,decoded(pair));
    for(const event of state.events.slice(inspected)){
     if(event.kind==='community'||event.kind==='term'){
      collected[event.kind]++;expect(event.delta).toBe(ECONOMY[event.kind]);
      expect(state.collected).toContain(event.sourceId);
     }else if(event.kind==='magnet'){
      collected.magnet++;expect(event.delta).toBe(0);expect(state.magnetUntil-event.tick).toBe(480);
      expect(state.collected).toContain(event.sourceId);
     }
    }
    inspected=state.events.length;
   }
  }
  expect(new Set(state.collected).size).toBe(state.collected.length);
  const specialEvents=state.events.filter(e=>e.kind in collected);
  expect(new Set(specialEvents.map(e=>e.sourceId)).size).toBe(specialEvents.length);
  // Sample exact server-compatible replay; nothing changes positions, cash, or the generated course.
  if(seed<5)expect(replay(seed,frames)).toEqual(state);
 }
 expect(collected.community).toBeGreaterThan(0);expect(collected.term).toBeGreaterThan(0);expect(collected.magnet).toBeGreaterThan(0);
 console.log('PICKUPS48_REAL_CONTROLS',JSON.stringify({runs:100,collected}));
},120000);
