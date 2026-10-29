import{describe,it,expect}from'vitest';
import{initialState,step,replay,generate,validateCourse,money,damage,finish,END_TICK,quantize,decoded,altitudeAt,START_CASH,TIMING,UPDRAFTS,BUILDINGS,LANDMARK_BLOCKERS,type State,type Input}from'../src/core/simulation';
const run=(s:State,controller:(s:State)=>Input=()=>({x:0,y:0}))=>{const frames:number[][]=[];while(!s.result){const q=quantize(controller(s));frames.push(q);step(s,decoded(q));step(s,decoded(q));}return frames;};
describe('RUNWAY money and spatial flight',()=>{
 it('generates repeatable authored sections with fixed economic budget',()=>{for(let i=0;i<1000;i++){expect(validateCourse(generate(i))).toBe(true);expect(generate(i)).toEqual(generate(i));}});
 it('starts with 5000 and time alone never spends capital',()=>{const s=initialState(1);s.objects=[];while(s.tick<30*60)step(s,{x:0,y:0});expect(s.cash).toBe(START_CASH);expect(s.burn).toBe(0);});
 it('water is a defeat, drains all money once, and has no bonus',()=>{const s=initialState(1);s.objects=[];run(s,()=>({x:0,y:-1}));expect(s.result?.outcome).toBe('water');expect(s.cash).toBe(0);expect(s.events.filter(e=>e.kind==='splashdown')).toHaveLength(1);expect(s.result?.score).toBe(0);const count=s.events.length;step(s,{x:0,y:0});expect(s.events).toHaveLength(count);});
 it('cash zero ends once and cannot receive later rewards',()=>{const s=initialState(1);money(s,-9999,'hacked');const r=s.result;money(s,1000,'grant');finish(s);expect(s.cash).toBe(0);expect(s.result).toBe(r);expect(r?.outcome).toBe('bankrupt');});
 it('shield and protection window apply to real loss',()=>{const s=initialState(1);s.shield=1;damage(s,1000,'rug','a');damage(s,1000,'rug','b');expect(s.cash).toBe(4500);expect(s.shield).toBe(0);s.tick+=49;damage(s,1000,'rug','c');expect(s.cash).toBe(3500);});
 it('replays quantized input exactly and rejects incomplete or oversized input',()=>{const s=initialState(733);const frames=run(s,()=>({x:.3,y:1}));expect(replay(733,frames)).toEqual(s);expect(()=>replay(1,[])).toThrow('Incomplete');expect(()=>replay(1,Array(5401).fill([0,0]))).toThrow('too long');expect(()=>replay(1,[[128,0]])).toThrow('Invalid');});
 it('altitude is continuous at exit, cloud and canopy deployment',()=>{for(const t of [2,TIMING.exit,TIMING.cloud,TIMING.glide])expect(Math.abs(altitudeAt(t+.001)-altitudeAt(t-.001))).toBeLessThan(.1);});
 it('input does not drift laterally and diagonal is normalized',()=>{const s=initialState(1);s.objects=[];while(s.tick<30*60)step(s,{x:0,y:0});expect(s.x).toBe(0);expect(s.vx).toBe(0);const q=quantize({x:1,y:1});expect(Math.hypot(...q)).toBeLessThan(128);});
 it('vertical sequence rings register actual plane crossing without paying partial chains',()=>{const s=initialState(1);s.tick=TIMING.glide*60;s.routeTime=s.tick/60;s.phase='land';s.x=0;s.y=40;s.altitude=40;s.objects=[{id:'gate',kind:'gate',sequence:'test',order:0,count:3,t:98,x:0,y:39,r:4,motion:0,alt:39,vertical:true}];for(let i=0;i<45;i++)step(s,{x:0,y:1});expect(s.gates).toBe(1);expect(s.cash).toBe(5000);expect(s.events.filter(e=>e.sourceId==='gate')).toHaveLength(1);});
 it('swept contact catches a small pickup and does not grant it twice',()=>{const s=initialState(1);s.tick=6*60-1;s.routeTime=s.tick/60;s.altitude=altitudeAt(s.tick/60);s.y=350;s.objects=[{id:'coin',kind:'sol',t:6,x:0,y:350,r:.5,motion:0}];for(let i=0;i<20;i++)step(s,{x:0,y:0});expect(s.cash).toBe(20000);expect(s.collected).toEqual(['coin']);});
 it('updrafts add real altitude and cannot exceed their lift budget',()=>{const s=initialState(1),d=UPDRAFTS[0];s.objects=[];s.tick=TIMING.glide*60;s.routeTime=s.tick/60;s.x=d.x;s.y=d.z;s.altitude=120;for(let i=0;i<600;i++)step(s,{x:0,y:-.6});expect(s.lift).toBe(24);expect(s.altitude).toBeLessThan(120);});
 it('a large building blocks passage and damages without repeated frame hits',()=>{const s=initialState(1);s.objects=[];s.tick=TIMING.glide*60;s.routeTime=s.tick/60;const b=BUILDINGS[0];s.x=b.x;s.y=b.z+b.d/2+.55;s.vy=-20;s.altitude=4;for(let i=0;i<30;i++)step(s,{x:0,y:1});expect(s.hazardHits).toBeGreaterThan(0);expect(s.hazardHits).toBeLessThanOrEqual(1);expect(s.y).toBeGreaterThan(BUILDINGS[0].z+BUILDINGS[0].d/2);});
 it('timeout clears capital and max replay budget includes celebration',()=>{const s=initialState(1);s.objects=[];s.tick=END_TICK-1;s.routeTime=s.tick/60;s.altitude=100;step(s,{x:0,y:0});expect(s.result?.cashFinal).toBe(0);expect(s.result?.outcome).toBe('water');});
});

it('Jurerê entrance posts have the same solid envelopes as their models',()=>{const b=LANDMARK_BLOCKERS[0],s=initialState(1);s.objects=[];s.tick=TIMING.glide*60;s.routeTime=s.tick/60;s.x=b.x;s.y=b.z+3;s.vy=-8;s.altitude=6;for(let i=0;i<24;i++)step(s,{x:0,y:1});expect(s.hazardHits).toBeGreaterThan(0);expect(s.y).toBeGreaterThan(b.z+b.d/2);});

it('visible pickup edges collect in both phases without rewarding a distant miss',()=>{for(const vertical of[false,true])for(const offset of[1.05,2]){const s=initialState(1);s.tick=vertical?TIMING.glide*60:360;s.routeTime=s.tick/60;s.x=offset;s.y=vertical?200:350;s.altitude=vertical?100:altitudeAt(6);s.objects=[{id:'edge',kind:'sol',t:6,x:0,y:s.y,r:.5,motion:0,...(vertical?{alt:100,vertical:true}:{})}];step(s,{x:0,y:0});expect(s.collected.includes('edge')).toBe(offset<1.5);}});

it('magnet attracts positive pickups through shared positions, expires and never pulls hazards',()=>{
 const s=initialState(3);s.tick=TIMING.glide*60;s.routeTime=s.tick/60;s.phase='land';s.x=0;s.y=220;s.altitude=120;s.magnetUntil=s.tick+480;
 s.objects=[{id:'pulled',kind:'sol',x:2.7,y:220,alt:120,vertical:true,t:98,r:.5,motion:0},{id:'hazard',kind:'gas',x:5,y:220,alt:120,vertical:true,t:98,r:1,motion:0}];
 step(s,{x:0,y:-.6});expect(s.objects[0].attracted?.x).toBeLessThan(2.7);expect(s.collected).not.toContain('pulled');expect(s.objects[1].attracted).toBeUndefined();
 for(let i=0;i<60;i++)step(s,{x:0,y:-.6});expect(s.events.filter(e=>e.sourceId==='pulled')).toHaveLength(1);expect(s.cash).toBe(20000);
 s.tick=s.magnetUntil;s.routeTime=s.tick/60;s.objects.push({id:'expired',kind:'sol',x:s.x+2.7,y:s.y,alt:s.altitude,vertical:true,t:98,r:.5,motion:0});step(s,{x:0,y:-.6});expect(s.objects.at(-1)?.attracted).toBeUndefined();
});
it('magnet refreshes eight seconds rather than stacking and leaves sequence gates untouched',()=>{
 const s=initialState(2);s.tick=TIMING.glide*60;s.routeTime=s.tick/60;s.y=220;s.altitude=120;s.magnetUntil=s.tick+100;
 s.objects=[{id:'magnet',kind:'magnet',x:0,y:220,alt:120,vertical:true,t:98,r:.5,motion:0},{id:'choice',kind:'gate',x:0,y:218,alt:120,vertical:true,t:98,r:2.4,motion:0}];
 step(s,{x:0,y:0});expect(s.magnetUntil).toBe(s.tick+480);expect(s.objects[1].attracted).toBeUndefined();expect(s.collected).not.toContain('choice');
});

it('the pilot clears the fully opened four-unit ramp before descending below the floor',async()=>{
 const {exitOffset,AIRCRAFT,PILOT_SCALE}=await import('../src/core/simulation');
 for(let i=0;i<=240;i++){const t=i/60,z=exitOffset(t),feet=altitudeAt(t)-1.45*PILOT_SCALE;if(z> -4.3)expect(feet).toBeGreaterThan(AIRCRAFT.floor);}
 const before=(altitudeAt(4)-altitudeAt(3.999))/.001,after=(altitudeAt(4.001)-altitudeAt(4))/.001;expect(Math.abs(before-after)).toBeLessThan(.1);
});
