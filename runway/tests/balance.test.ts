import{it,expect}from'vitest';
import{initialState,step,TIMING,DESTINATIONS,START_CASH,END_TICK,START_Z,GLIDE_HEIGHT,GLIDE_SPEED,ECONOMY,generate,penaltyScale,quantize,decoded,replay,type State}from'../src/core/simulation';
import {flyRoute} from './test-pilot';
function finish(s:State,id:typeof DESTINATIONS[number]['id'],currents=true){const frames:number[][]=[];while(!s.result){const q=quantize(flyRoute(s,id,currents));frames.push(q);step(s,decoded(q));step(s,decoded(q));}return frames;}
it('all three physical routes work and the far route requires currents',()=>{
 for(const d of DESTINATIONS){const s=initialState(1);s.objects=[];finish(s,d.id);expect(s.destination).toBe(d.id);expect(s.cash).toBe(START_CASH*(1+d.bonus));expect(s.tick).toBeLessThan(END_TICK);}
 // Optimistic bound: best entry, instant max forward speed, no collisions or deceleration.
 const nearEdge=DESTINATIONS[2].z+DESTINATIONS[2].radius,maxDistance=(GLIDE_HEIGHT-1.2)/GLIDE_SPEED*(8*GLIDE_SPEED/3);
 expect(START_Z-10-maxDistance-nearEdge).toBeGreaterThanOrEqual(20);
 const s=initialState(1);s.objects=[];finish(s,'jurere',false);expect(s.destination).not.toBe('jurere');expect(s.lift).toBe(0);
});
it('penalty tiers belong to objects and all retired decisions are absent',()=>{
 expect([0,1,2,3,4].map(penaltyScale)).toEqual([.02,.02,.2,.2,1]);
 const objects=generate(1);expect(objects.some(o=>['funding','strategy'].includes(o.kind))).toBe(false);
 expect(objects.find(o=>o.kind==='gas')?.penaltyScale).toBe(.02);expect(ECONOMY.funded).toBe(500000);
});
it('idle loses, active routes preserve exact replays and money ledger',()=>{
 for(let seed=0;seed<20;seed++){
  const idle=initialState(seed);while(!idle.result)step(idle,{x:0,y:0});expect(idle.outcome).not.toBe('landed');expect(idle.cash).toBe(0);
  const s=initialState(seed),frames=finish(s,'jurere');expect(s.destination).toBe('jurere');expect(s.cash).toBe(START_CASH+s.income-s.loss+s.bonus);expect(s.cash).toBeGreaterThan(500000);expect(s.result!.score).toBe(s.cash);expect(replay(seed,frames)).toEqual(s);
 }
},120000);
it('sky chains can be completed spatially, including accelerated entry',()=>{
 for(const boosted of[false,true]){const s=initialState(1);s.objects=s.objects.filter(o=>o.sequence==='sky-20');if(boosted){s.boostStart=560;s.boostUntil=632;}while(s.routeTime<TIMING.cloud&&!s.result){const target=s.objects.find(o=>!s.collected.includes(o.id)&&o.t>s.routeTime-.2);const x=target?.x??s.x,z=target?.y??s.y;step(s,{x:Math.max(-1,Math.min(1,(x-s.x)*1.5)),y:Math.max(-1,Math.min(1,(s.y-z)*1.5))});}expect(s.events.filter(e=>e.kind==='sequence-complete')).toHaveLength(1);expect(s.cash).toBe(START_CASH+ECONOMY.sequence);}
});

it('the alternative right-hand current can reach Jurere',()=>{const s=initialState(1);s.objects=[];while(!s.result){const q=quantize(flyRoute(s,'jurere',true,1));step(s,decoded(q));step(s,decoded(q));}expect(s.destination).toBe('jurere');expect(s.lift).toBe(24);});
