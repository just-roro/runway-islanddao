import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {cloudField} from '../src/scene/cloudField';
import {atmosphere} from '../src/scene/atmosphere';
import {cameraFloor,cameraHasClearView,avoidScenery,landingOrbit,orbitRadius,orbitAngle} from '../src/scene/camera';
import {terrain,surfaceSampler} from '../src/scene/ground';
import {START_Z,DESTINATIONS,TIMING,altitudeAt,landingSurface} from '../src/core/simulation';

it('cloud banks cover every azimuth beyond the flight corridor, with deterministic silhouettes',()=>{
 const field=cloudField();expect(cloudField()).toEqual(field);expect(cloudField(39)).not.toEqual(field);
 for(let sector=0;sector<8;sector++){
  const inside=(p:{x:number;z:number})=>Math.floor(((Math.atan2(p.x,p.z-START_Z)+Math.PI*2)%(Math.PI*2))/(Math.PI/4))===sector;
  expect(field.middle.filter(inside).length).toBeGreaterThan(8);expect(field.far.filter(inside).length).toBeGreaterThan(8);
 }
 expect(field.middle.every(c=>c.y+c.sy<altitudeAt(0)-200)).toBe(true);
 expect(Math.max(...field.far.map(c=>Math.hypot(c.x,c.z-START_Z)))).toBeGreaterThan(1900);
 expect(new Set(field.far.map(c=>c.tile)).size).toBe(8);
 for(const c of [...field.near,...field.middle])expect(Math.hypot(c.x,c.z-START_Z)-Math.max(c.sx,c.sz)).toBeGreaterThan(25.9);
 expect(field.near.length*80+field.middle.length*80+field.far.length*2).toBe(19440);
});
it('eye adaptation uses the canopy clock, recovers fully and attenuates reduced motion',()=>{
 expect(atmosphere(TIMING.cloud-2).exit).toBe(0);expect(atmosphere(TIMING.cloud+.05).exit).toBeGreaterThan(.98);expect(atmosphere(TIMING.cloud).immersion).toBe(0);
 expect(atmosphere(TIMING.glide+3)).toEqual({immersion:0,clearing:1,exit:0,veil:0,exposure:1,bloom:0});
 expect(atmosphere(TIMING.glide,true).veil).toBeLessThan(.04);
 let previous=atmosphere(0);for(let t=.01;t<65;t+=.01){const current=atmosphere(t);expect(Math.abs(current.exposure-previous.exposure)).toBeLessThan(.004);expect(current.veil).toBeLessThanOrEqual(.14);previous=current;}
});
it('landing arcs clear the real triangulated ground and buildings at every destination',()=>{
 const mesh=terrain(),surface=surfaceSampler(mesh);
 for(const d of DESTINATIONS)for(const [dx,dz] of [[0,0],[2,1],[-2,-1],[0,3.76],[0,-3.76]]){
  const focus=new Vector3(d.x+dx,landingSurface(d.x+dx,d.z+dz)+1.1,d.z+dz),plan=landingOrbit(focus,0,24,surface);
  expect(plan.arc,JSON.stringify({destination:d.id,dx,dz,plan})).not.toBe(0);
  for(let i=0;i<=80;i++)for(const endRadius of [8.6,12,18,24]){
   const radius=orbitRadius(i/80,endRadius),a=plan.start+orbitAngle(i/80,plan.arc),p=new Vector3(focus.x+Math.sin(a)*radius,focus.y+plan.elevation,focus.z+Math.cos(a)*radius);
   expect(p.y).toBeGreaterThanOrEqual(cameraFloor(p.x,p.z,surface));expect(cameraHasClearView(p,focus,surface)).toBe(true);
  }
 }
 const below=new Vector3(-25,-2,-15),focus=new Vector3(-25,30,-10);avoidScenery(below,focus,false,surface);expect(below.y).toBeGreaterThanOrEqual(cameraFloor(below.x,below.z,surface));
 mesh.dispose();
});
