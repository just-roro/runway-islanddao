import {test,expect,type Page} from '@playwright/test';
async function boot(page:Page){
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Star QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});
}
test('star stays in the world, flashes yellow and spins once without shrinking or suction',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|WebGL/.test(m.text()))errors.push(m.text());});
 await boot(page);await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const sim=await import('/src/core/simulation.ts' as string),w=window as any,r=w.__RUNWAY_QA__;
 r.state.objects=[{id:'test-star',kind:'star',t:6.5,x:0,y:sim.START_Z-8.4,r:1.65,motion:0,fallSpeed:.6}];w.__RUNWAY_CONTROLS_QA__.read=()=>({x:0,y:0});
 w.__starFrames=[];const sample=()=>{const mesh=w.__RUNWAY_SCENE_QA__?.scene.getObjectByName('course-star'),cue=r.presentation.cues[0];if(cue&&mesh?.count){const m=Array.from(mesh.instanceMatrix.array.slice(0,16));w.__starFrames.push({age:r.presentation.time-cue.at,m,flash:mesh.geometry.attributes.starFlash.getX(0),tick:r.state.tick});}if(!cue||r.presentation.time-cue.at<1.45)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 await page.waitForFunction(()=>{const r=(window as any).__RUNWAY_QA__;if(r.state.routeTime>6.25){r.paused=true;return true;}return false;});await page.screenshot({path:info.outputPath('star-approach.png')});await page.evaluate(()=>(window as any).__RUNWAY_QA__.paused=false);
 await page.waitForFunction(()=>{const r=(window as any).__RUNWAY_QA__,cue=r.presentation.cues[0];if(cue&&r.presentation.time-cue.at>.08){r.paused=true;return true;}return false;});await page.waitForTimeout(80);await page.screenshot({path:info.outputPath('star-contact.png')});
 const freeze=await page.evaluate(()=>(window as any).__RUNWAY_QA__.state.tick);await page.waitForTimeout(160);expect(await page.evaluate(()=>(window as any).__RUNWAY_QA__.state.tick)).toBe(freeze);
 // A second fixed view shows the complete silhouette throughout the response.
 await page.evaluate(()=>{const w=window as any,p=w.__RUNWAY_QA__.presentation.cues[0].position;w.__RUNWAY_ENV_VIEW__={position:[p[0]+3,p[1]+6,p[2]+3],target:p};w.__RUNWAY_QA__.paused=false;});
 await page.waitForFunction(()=>{const r=(window as any).__RUNWAY_QA__,e=r.presentation.cues[0];if(r.presentation.time-e.at>.55){r.paused=true;return true;}return false;});await page.waitForTimeout(80);await page.screenshot({path:info.outputPath('star-yellow-peak.png')});await page.evaluate(()=>(window as any).__RUNWAY_QA__.paused=false);
 await page.waitForFunction(()=>{const r=(window as any).__RUNWAY_QA__;return r.presentation.time-r.presentation.cues[0].at>1.4;});
 const data=await page.evaluate(()=>{const w=window as any,r=w.__RUNWAY_QA__;return{frames:w.__starFrames,cue:r.presentation.cues[0],events:r.state.events,boostUntil:r.state.boostUntil,cash:r.state.cash,calls:r.renderStats.calls};});
 expect(data.events).toHaveLength(1);expect(data.cash).toBe(20000);expect(data.boostUntil).toBe(data.events[0].tick+72);expect(data.frames.length).toBeGreaterThan(10);
 for(const f of data.frames){expect(Math.hypot(f.m[0],f.m[1],f.m[2])).toBeCloseTo(1.65,5);for(let k=0;k<3;k++)expect(f.m[12+k]).toBeCloseTo(data.cue.position[k],3);}
 expect(Math.max(...data.frames.map((f:any)=>f.flash))).toBeGreaterThan(.98);expect(data.frames.some((f:any)=>Math.abs(f.m[0]-data.frames[0].m[0])>.5)).toBe(true);expect(errors).toEqual([]);
 await info.attach('star-frames',{body:JSON.stringify({...data,errors}),contentType:'application/json'});
});

test('victory and airborne defeat replay stay opaque until a fully restored stationary scene is ready',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const {flyToJurere}=await import('/tests/test-pilot.ts' as string),w=window as any;w.__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere(w.__RUNWAY_QA__.state);});
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.reported,{},{timeout:100000});expect(await page.evaluate(()=>(window as any).__RUNWAY_QA__.state.outcome)).toBe('landed');
 for(const outcome of ['victory','defeat']){
  await page.screenshot({path:info.outputPath(`${outcome}-results.png`)});
  await page.evaluate(()=>{const w=window as any,renderer=w.__RUNWAY_SCENE_QA__.renderer,compile=renderer.compileAsync.bind(renderer);w.__held=false;w.__oldRun=w.__RUNWAY_QA__;w.__resetFrames=[];
   renderer.compileAsync=async(...args:any[])=>{w.__held=true;await new Promise<void>(resolve=>w.__release=resolve);renderer.compileAsync=compile;return compile(...args);};
   const sample=()=>{const r=w.__RUNWAY_QA__,qa=w.__RUNWAY_SCENE_QA__,el=document.querySelector('.flight-curtain')!,style=getComputedStyle(el);if(r!==w.__oldRun){const root=qa.scene.getObjectByName('pilot-body'),canopy=qa.scene.getObjectByName('pilot-canopy');w.__resetFrames.push({committed:qa.runId===r.id,tick:r.state.tick,paused:r.paused,visible:style.visibility,bg:style.backgroundColor,position:[...r.presentation.position],camera:qa.camera.position.toArray(),rotation:root?.rotation.toArray(),clip:w.__RUNWAY_SKELETON_QA__?.clip,canopy:canopy?.parent.visible,trail:qa.scene.getObjectByName('pilot-cosmetic-trail')?.count});}if(r===w.__oldRun||qa.runId!==r.id||r.paused||style.visibility!=='hidden')requestAnimationFrame(sample);};requestAnimationFrame(sample);
  });
  await page.getByRole('button',{name:'ONE MORE RUN',exact:true}).click();await page.waitForFunction(()=>(window as any).__held);await page.waitForTimeout(300);
  expect(await page.locator('.flight-curtain').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(217, 239, 251)');
  await page.screenshot({path:info.outputPath(`${outcome}-covered.png`)});
  await page.waitForTimeout(700);expect(await page.evaluate(()=>(window as any).__RUNWAY_QA__.state.tick)).toBe(0);
  await page.evaluate(()=>(window as any).__release());await expect(page.locator('.flight-curtain')).toBeHidden({timeout:15000});
  const frames=await page.evaluate(()=>(window as any).__resetFrames);expect(frames.length).toBeGreaterThan(5);
  await info.attach(`${outcome}-reset-frames`,{body:JSON.stringify(frames),contentType:'application/json'});
  for(const f of frames.filter((f:any)=>!f.committed)){expect(f.bg).toBe('rgb(217, 239, 251)');}
  const committed=frames.filter((f:any)=>f.committed&&f.paused);expect(committed.length).toBeGreaterThan(5);
  for(const f of committed){
   expect(f.tick).toBe(0);expect(f.position).toEqual([0,1122.2,355]);expect(f.camera[1]).toBeGreaterThan(1122);expect(f.camera[1]).toBeLessThan(1125);expect(f.clip).toBe('prepare');expect(f.canopy).toBe(false);expect(f.trail).toBe(0);
   expect(f.rotation[0]).toBeCloseTo(0,5);expect(f.rotation[1]).toBeCloseTo(Math.PI,5);expect(f.rotation[2]).toBeCloseTo(0,5);
   for(let i=0;i<3;i++)expect(f.camera[i]).toBeCloseTo(committed[0].camera[i],5);
  }
  await page.screenshot({path:info.outputPath(`${outcome}-replay-ready.png`)});
  if(outcome==='victory'){
   // Real damage/defeat path, with one controlled obstacle and no production API.
   await page.evaluate(async()=>{const {altitudeAt}=await import('/src/core/simulation.ts' as string),w=window as any,r=w.__RUNWAY_QA__,s=r.state;s.routeTime=6;s.tick=360;s.altitude=altitudeAt(6);s.x=0;s.y=350;s.cash=5000;s.objects=[{id:'fatal-gas',kind:'gas',t:6,x:0,y:350,r:1.8,motion:0,alt:s.altitude,penaltyScale:1}];w.__RUNWAY_CONTROLS_QA__.read=()=>({x:0,y:0});});
   await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.reported);expect(await page.evaluate(()=>(window as any).__RUNWAY_QA__.state.outcome)).toBe('bankrupt');
  }
 }
 expect(errors).toEqual([]);
});
