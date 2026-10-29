import {describe,it,expect} from 'vitest';
import {Mesh,MeshBasicMaterial,Raycaster,Vector3,DoubleSide} from 'three';
import {DESTINATIONS,BUILDINGS,LANDMARK_BLOCKERS,isSafeLanding,coastDistance,initialState,step,quantize,decoded,replay} from '../src/core/simulation';
import {BRIDGE} from '../src/scene/environmentLayout';
import {ROADS,carPose,roadClear} from '../src/scene/roads';
import {coastalRocks,BOAT_ROUTES,boatPose,swimmerPlaces,hasPlatformVictory,groundSlope} from '../src/scene/worldLayout';
import {terrain,surfaceSampler} from '../src/scene/ground';
import {platformGeometry} from '../src/scene/LandingZones';
import {grassPlaces,treePlaces} from '../src/scene/habitat';
import {carGeometry,boatGeometry,balloonGeometry,skydiverGeometry,rockGeometry} from '../src/scene/worldAssets';
import {flyRoute} from './test-pilot';

describe('world39 presentation geography',()=>{
 it('roads join the bridge, stay on land, and avoid buildings and pads',()=>{
  expect(ROADS[0][0]).toMatchObject({x:BRIDGE.x,z:BRIDGE.z});
  expect(ROADS[0].at(-1)).toMatchObject({x:ROADS[1][0].x,z:ROADS[1][0].z});
  const failures:string[]=[];
  for(const [r,road] of ROADS.entries())for(const p of road){
   if(!isSafeLanding(p.x,p.z)||coastDistance(p.x,p.z)<1.85)failures.push(`shore road${r} ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
   for(const d of DESTINATIONS)if(Math.hypot(p.x-d.x,p.z-d.z)<d.radius+1.9)failures.push(`pad ${d.id}`);
   for(const b of [...BUILDINGS,...LANDMARK_BLOCKERS])if(Math.abs(p.x-b.x)<b.w/2+1.9&&Math.abs(p.z-b.z)<b.d/2+1.9)failures.push(`building ${b.x},${b.z} road${r} at${p.x.toFixed(1)},${p.z.toFixed(1)}`);
  }expect([...new Set(failures)]).toEqual([]);
 });
 it('traffic is continuous through both turnarounds and sits on the rendered relief',()=>{
  const g=terrain(),surface=surfaceSampler(g);let maxPitch=0;
  for(const road of ROADS){let last=carPose(road,0,.8);const length=road.at(-1)!.distance*2+Math.PI*1.6;
   for(let t=.2;t<length+.5;t+=.2){const p=carPose(road,t,.8),s=groundSlope(surface,p.x,p.z,p.yaw,2.14*.85);expect(Math.hypot(last.x-p.x,last.z-p.z)).toBeLessThan(.45);expect(isSafeLanding(p.x,p.z)).toBe(true);expect(Number.isFinite(s.y+s.pitch)).toBe(true);maxPitch=Math.max(maxPitch,Math.abs(s.pitch));last=p;}
  }expect(maxPitch).toBeLessThan(Math.PI/5);g.dispose();
 });
 it('platform tops have no terrain triangles above them',()=>{
  const ground=terrain(),platform=platformGeometry(),material=new MeshBasicMaterial({side:DoubleSide}),land=new Mesh(ground,material),pads=new Mesh(platform,material),ray=new Raycaster();land.updateMatrixWorld();pads.updateMatrixWorld();
  for(const d of DESTINATIONS)for(let a=0;a<Math.PI*2;a+=.31)for(const r of [0,.5,.9,.975]){
   const x=d.x+Math.sin(a)*d.radius*r,z=d.z+Math.cos(a)*d.radius*r;ray.set(new Vector3(x,100,z),new Vector3(0,-1,0));
   expect(ray.intersectObject(land)).toHaveLength(0);const hit=ray.intersectObject(pads)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThanOrEqual(d.height-.001);expect(hit.point.y).toBeLessThan(d.height+.21);
  }ground.dispose();platform.dispose();material.dispose();
 });
 it('coastal granite, swimmers and boats are distributed safely and reproducibly',()=>{
  const rocks=coastalRocks();expect(rocks).toEqual(coastalRocks());expect(rocks.length).toBeGreaterThan(80);for(const [lo,hi] of [[-145,-60],[-60,50],[50,175]])expect(rocks.filter(p=>p.z>lo&&p.z<hi).length).toBeGreaterThan(12);
  for(const p of rocks){expect(coastDistance(p.x,p.z)).toBeLessThan(.01);expect(roadClear(p.x,p.z,p.scale)).toBe(true);}
  for(let i=0;i<BOAT_ROUTES.length;i++)for(let t=0;t<500;t+=1){const p=boatPose(i,t);expect(isSafeLanding(p.x,p.z),`boat${i} ${p.x},${p.z}`).toBe(false);expect(coastDistance(p.x,p.z)).toBeGreaterThan(3);}
  expect(swimmerPlaces().length).toBeGreaterThanOrEqual(6);for(const p of swimmerPlaces())expect(isSafeLanding(p.x,p.z)).toBe(false);
 });
 it('grass covers three regions without growing through pads, roads or buildings',()=>{
  const trees=treePlaces(),grass=grassPlaces(trees);expect(trees).toHaveLength(112);expect(grass.length).toBeGreaterThan(1600);
  for(const p of grass){expect(roadClear(p.x,p.z,.35)).toBe(true);expect(DESTINATIONS.every(d=>Math.hypot(p.x-d.x,p.z-d.z)>d.radius+.65)).toBe(true);}
  for(const [lo,hi] of [[-145,-60],[-60,50],[50,175]])expect(grass.filter(p=>p.z>lo&&p.z<hi).length).toBeGreaterThan(100);
 });
 it('all destinations keep deterministic replays; only platform success triggers fireworks',()=>{
  for(const d of DESTINATIONS){const s=initialState(17),frames=[];while(!s.result){const q=quantize(flyRoute(s,d.id));frames.push(q);step(s,decoded(q));step(s,decoded(q));}expect(s.destination).toBe(d.id);expect(hasPlatformVictory(s)).toBe(true);expect(replay(17,frames)).toEqual(s);
   expect(hasPlatformVictory({...s,destination:null})).toBe(false);expect(hasPlatformVictory({...s,outcome:'water'})).toBe(false);expect(hasPlatformVictory({...s,outcome:'bankrupt'})).toBe(false);expect(hasPlatformVictory({...s,x:d.x+d.radius+1})).toBe(false);
  }
 });
 it('decorative models stay within their per-instance triangle budgets',()=>{
  for(const [create,max] of [[carGeometry,210],[boatGeometry,150],[balloonGeometry,190],[skydiverGeometry,250],[rockGeometry,80]] as const){const g=create();expect(g.attributes.position.count/3).toBeLessThanOrEqual(max);expect([...g.attributes.position.array].every(Number.isFinite)).toBe(true);g.dispose();}
 });
});
