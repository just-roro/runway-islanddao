import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {collectSequence,initialState,generate,step,altitudeAt,AIRCRAFT,START_Z,FALL_SPEED} from '../src/core/simulation';
import {constrainAircraftCamera} from '../src/scene/camera';
it('a complete ordered chain pays once; partial, repeated and skipped rings do not pay',()=>{
 const rings=generate(3).filter(o=>o.sequence==='sky-20');expect([3,4,6]).toContain(rings.length);
 const s=initialState(3);for(let i=0;i<rings.length-1;i++){collectSequence(s,rings[i]);expect(s.cash).toBe(5000);}collectSequence(s,rings.at(-1)!);expect(s.cash).toBe(105000);collectSequence(s,rings.at(-1)!);expect(s.cash).toBe(105000);
 const missed=initialState(3);collectSequence(missed,rings[1]);for(const ring of rings)collectSequence(missed,ring);expect(missed.cash).toBe(5000);expect(missed.sequences['sky-20'].status).toBe('failed');
});
it('star pickup uses physical contact and pays individually once',()=>{const s=initialState(3);s.tick=599;s.routeTime=s.tick/60;s.y=350;s.altitude=altitudeAt(599/60);s.objects=[{id:'star',kind:'star',t:10,x:0,y:350,r:.6,motion:0}];for(let i=0;i<30;i++)step(s,{x:0,y:0});expect(s.cash).toBe(20000);expect(s.events.filter(e=>e.kind==='star')).toHaveLength(1);});
it('SOL trails keep dense strings and add continuous rewards where choices were removed',()=>{const o=generate(8).filter(o=>o.kind==='sol'&&!o.vertical);expect(o).toHaveLength(104);const close=o.filter((b,i)=>i>0&&Math.abs(b.t-o[i-1].t-.55*10.5/FALL_SPEED)<.00001);expect(close.length).toBeGreaterThan(50);});
it('camera clears the actual cabin and is never pinned above a descending pilot outside it',()=>{const inside=new Vector3(3,AIRCRAFT.floor+10,START_Z+2);constrainAircraftCamera(inside);expect(inside.y).toBeLessThan(AIRCRAFT.floor+4);expect(Math.abs(inside.x)).toBeLessThan(3);const outside=new Vector3(0,AIRCRAFT.floor-20,START_Z-1);constrainAircraftCamera(outside);expect(outside.y).toBe(AIRCRAFT.floor-20);});

it('a real slalom trajectory can complete all rings in order',()=>{const s=initialState(3);s.objects=s.objects.filter(o=>o.sequence==='sky-20');while(s.tick<26*60){const target=s.objects.find(o=>!s.collected.includes(o.id))??s.objects.at(-1)!;step(s,{x:Math.max(-1,Math.min(1,(target.x-s.x)*2)),y:Math.max(-1,Math.min(1,(s.y-target.y)*2))});}expect(s.cash).toBe(105000);expect(s.sequences['sky-20']).toMatchObject({status:'completed',next:s.objects.length});expect(s.events.filter(e=>e.kind==='sequence-complete')).toHaveLength(1);});
