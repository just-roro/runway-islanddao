import {it,expect} from 'vitest';
import {initialState,step,altitudeAt,objectPose,objectAngle,inStarHole,ECONOMY,PILOT_RADIUS,type ObjectDef} from '../src/core/simulation';
import {createRuntime,advance} from '../src/services/runtime';
import {captureCues,createPresentation} from '../src/services/presentation';
import {starEffect} from '../src/scene/starEffect';

it('sweeps stars at different rotations, lateral velocities and boost speeds, exactly once',()=>{
 let contacts=0;
 for(const route of [6,8,10,15,22])for(const boosted of [false,true])for(const direction of [-1,0,1])for(const offset of [-.7,0,.7]){
  const s=initialState(17);s.routeTime=route;s.tick=Math.round(route*60);s.x=0;s.y=350;s.altitude=altitudeAt(route);s.vx=direction*12;
  if(boosted){s.boostStart=s.tick-20;s.boostUntil=s.tick+20;}
  const o:ObjectDef={id:'star-test',kind:'star',t:route,x:offset,y:350,r:1.65,motion:0,alt:s.altitude-.2,fallSpeed:.6};s.objects=[o];
  for(let i=0;i<100;i++)step(s,{x:direction,y:0});
  expect(s.events.filter(e=>e.sourceId===o.id),`${route}/${boosted}/${direction}/${offset}`).toHaveLength(1);
  expect(s.cash).toBe(5000+ECONOMY.star);expect(s.boostUntil).toBe(s.events[0].tick+72);expect(o.attracted).toBeUndefined();contacts++;
 }
 expect(contacts).toBe(90);
});
it('accepts body/aperture overlap but rejects a real miss and uses the vertical ring axes',()=>{
 const r=1.65,angle=.45;
 // Just outside the aperture, within the visible pilot body. Padding is not a bounding circle.
 const x=-Math.sin(angle)*(.9*r+.2),y=Math.cos(angle)*(.9*r+.2);
 expect(inStarHole(x,y,r,angle)).toBe(false);expect(inStarHole(x,y,r,angle,PILOT_RADIUS)).toBe(true);
 expect(inStarHole(3,0,r,angle,PILOT_RADIUS)).toBe(false);
 for(const offset of [0,4]){
  const s=initialState(1);s.routeTime=38;s.tick=2280;s.y=350;s.altitude=100;
  s.objects=[{id:'vertical',kind:'star',t:38,x:0,y:349.95,r:1.65,alt:100+offset,motion:0,vertical:true}];
  for(let i=0;i<4;i++)step(s,{x:0,y:1});expect(s.collected.length).toBe(offset===0?1:0);
 }
});
it('relative swept contacts handle overshoot and an exact start on the plane',()=>{
 for(const fast of [false,true]){
  const s=initialState(2);s.routeTime=10;s.tick=600;s.y=350;s.altitude=altitudeAt(10);
  s.objects=[{id:'sweep',kind:'star',t:10,x:0,y:350,r:1.65,motion:0,alt:s.altitude-(fast?.2:0),fallSpeed:fast?-900:.6}];
  step(s,{x:0,y:0});expect(s.collected).toEqual(['sweep']);step(s,{x:0,y:0});expect(s.events).toHaveLength(1);
 }
});
it('spent stars stay at the contact position and scale, with eased rotation and yellow flash',()=>{
 const s=initialState(1),p=createPresentation();s.tick=600;s.routeTime=10;
 const o:ObjectDef={id:'star',kind:'star',t:10,x:1,y:350,r:1.65,motion:2,fallSpeed:.6};s.objects=[o];s.events.push({tick:600,kind:'star',delta:ECONOMY.star,balance:20000,sourceId:o.id});captureCues(p,s,0,'test',-30);
 const cue=p.cues[0],position=Object.values(objectPose(o,10));expect(cue.position).toEqual(position);
 for(const age of [0,.01,.2,.6,1.1,1.2,3]){const f=starEffect(o,10+age,10+age,cue);expect(f.position).toEqual(cue.position);expect(f.flash).toBeGreaterThanOrEqual(0);}
 const angle=(age:number)=>starEffect(o,10+age,10+age,cue).angle-objectAngle(o,10);
 expect(angle(.02)-angle(0)).toBeLessThan(angle(.6)-angle(.58));expect(angle(1.2)-angle(1.18)).toBeLessThan(angle(.6)-angle(.58));expect(angle(1.2)).toBeCloseTo(6*Math.PI);
 expect(starEffect(o,10.6,10.6,cue).flash).toBeCloseTo(1);expect(starEffect(o,12,12,cue,true).angle).toBe(objectAngle(o,10));
});
it('a new paused runtime is already posed in the plane, never at world origin',()=>{
 const r=createRuntime(1,undefined,()=>{});r.paused=true;
 expect(r.presentation.position).toEqual([r.state.x,r.state.altitude,r.state.y]);expect(r.presentation.position[1]).toBeGreaterThan(1100);
 const initial=structuredClone(r.presentation);advance(r,.05);expect(r.presentation).toEqual(initial);expect(r.state.tick).toBe(0);expect(r.presentation.fall).toBeNull();expect(r.presentation.cues).toEqual([]);
});
