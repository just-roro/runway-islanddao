import {it,expect} from 'vitest';
import {initialState,step,altitudeAt,TIMING,boostFactor,inStarHole,objectAngle,objectPose,generate,replay,quantize,decoded} from '../src/core/simulation';
import {flyToJurere} from './test-pilot';
it('stars reward an aperture crossing, never a near miss, and boost spatial progress for 1.2 real seconds',()=>{
 const hit=initialState(2),miss=initialState(2);for(const [s,x]of [[hit,0],[miss,1.8]] as const){s.tick=599;s.routeTime=s.tick/60;s.altitude=altitudeAt(s.routeTime);s.y=350;s.x=x;s.objects=[{id:'star',kind:'star',t:10,x:0,y:350,r:1.65,motion:0}];for(let i=0;i<80;i++)step(s,{x:0,y:0});}
 expect(hit.cash).toBe(20000);expect(miss.cash).toBe(5000);expect(hit.events.filter(e=>e.kind==='star')).toHaveLength(1);expect(hit.routeTime).toBeGreaterThan(miss.routeTime+.2);expect(hit.altitude).toBeLessThan(miss.altitude-6);expect(boostFactor(hit)).toBe(1);
 expect(inStarHole(0,0,1.65,1)).toBe(true);expect(inStarHole(1.7,0,1.65,0)).toBe(false);
 const state={tick:20,boostStart:0,boostUntil:72};expect(boostFactor(state)).toBe(1.25);state.boostUntil=92;expect(boostFactor(state)).toBe(1.25);state.tick=93;expect(boostFactor(state)).toBe(1);
});
it('the new pacing preserves authored encounter locations with varied continuous object velocities',()=>{
 const all=generate(4);for(const o of all.filter(o=>!o.vertical)){const p=objectPose(o,o.t);expect(p.y).toBeCloseTo(altitudeAt(o.t),6);expect(p.x).toBe(o.x);const angularStep=objectAngle(o,o.t+.0001)-objectAngle(o,o.t);expect(Math.abs(angularStep)).toBeLessThan(.001);}
 expect(new Set(all.filter(o=>!o.vertical).map(o=>o.fallSpeed)).size).toBeGreaterThan(4);
});
it('a competent 15/15/15 route lands physically in 50–60 seconds and replays identically',()=>{
 for(const seed of[1,7,23,95]){const s=initialState(seed),frames:number[][]=[];while(!s.result){const q=quantize(flyToJurere(s));frames.push(q);step(s,decoded(q));step(s,decoded(q));}expect(s.result.destination).toBe('jurere');expect(s.tick/60).toBeGreaterThanOrEqual(48);expect(s.tick/60).toBeLessThanOrEqual(60);expect(replay(seed,frames)).toEqual(s);}
 expect(TIMING.glide-TIMING.exit).toBeCloseTo(32.5652173913);
});
