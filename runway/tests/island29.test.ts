import {it,expect} from 'vitest';
import {Raycaster,Vector3,Mesh,MeshBasicMaterial,DoubleSide} from 'three';
import {BRIDGE,bridgePoint,bridgeHeight,bridgeClear} from '../src/scene/environmentLayout';
import {terrain,surfaceSampler} from '../src/scene/ground';
import {grassPlaces,treePlaces} from '../src/scene/habitat';
import {createBridgeGeometry} from '../src/scene/IslandLife';
import {initialState,step,quantize,decoded,isSafeLanding,DESTINATIONS} from '../src/core/simulation';
import {roadClear} from '../src/scene/roads';
import {flyRoute} from './test-pilot';
it('bridge joins land, stays outside flown routes, and ends beyond its radial haze',()=>{
 for(const side of [-BRIDGE.width/2,0,BRIDGE.width/2]){const p=bridgePoint(0,side);expect(isSafeLanding(p.x,p.z)).toBe(true);}
 expect(BRIDGE.length).toBeGreaterThan(BRIDGE.hazeFar+400);
 const g=terrain(),surface=surfaceSampler(g);expect(Math.abs(bridgeHeight(0,surface(BRIDGE.x,BRIDGE.z))-surface(BRIDGE.x,BRIDGE.z))).toBeLessThan(.15);g.dispose();
 const bridge=createBridgeGeometry();expect(bridge.attributes.position.count/3).toBeLessThan(4000);bridge.dispose();
 for(const d of DESTINATIONS){const s=initialState(17);while(!s.result){const q=quantize(flyRoute(s,d.id));step(s,decoded(q));expect(bridgeClear(s.x,s.y,9)).toBe(true);step(s,decoded(q));}expect(s.destination).toBe(d.id);}
});
it('ground coverage is deterministic, distributed, clear of play areas and seated on rendered triangles',()=>{
 const trees=treePlaces(),grass=grassPlaces(trees);expect(grass).toEqual(grassPlaces(trees));expect(grass.length).toBeGreaterThan(1000);
 for(const [low,high] of [[-145,-60],[-60,50],[50,173]])expect(grass.filter(p=>p.z>low&&p.z<high).length).toBeGreaterThan(50);
 expect(grass.every(p=>roadClear(p.x,p.z,.35)&&DESTINATIONS.every(d=>Math.hypot(p.x-d.x,p.z-d.z)>d.radius+.65))).toBe(true);
 const g=terrain(),surface=surfaceSampler(g),material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(g,material),ray=new Raycaster();
 mesh.updateMatrixWorld();for(const p of grass.filter((_,i)=>i%29===0)){ray.set(new Vector3(p.x,100,p.z),new Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];expect(hit).toBeDefined();expect(surface(p.x,p.z)).toBeCloseTo(hit.point.y,4);}
 material.dispose();g.dispose();
});
