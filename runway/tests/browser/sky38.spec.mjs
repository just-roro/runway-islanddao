import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

test('sky deck, cloud exit and complete landing on the real flight clock',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Sky QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'}));Object.defineProperty(crypto,'getRandomValues',{value:(a)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});
 await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window).__RUNWAY_QA__);
 await page.evaluate(async()=>{
  const {flyToJurere}=await import('/tests/test-pilot.ts'),{landingSurface}=await import('/src/core/simulation.ts'),w=window;
  w.__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere(w.__RUNWAY_QA__.state);
  w.__skyLog=[];let previous=performance.now();
  const sample=(now)=>{const r=w.__RUNWAY_QA__,c=w.__RUNWAY_CAMERA_QA__,scene=w.__RUNWAY_SCENE_QA__,p=r.presentation;
   if(c&&scene)w.__skyLog.push({ms:now-previous,time:r.state.routeTime,age:p.landingAge,camera:c.position,fov:c.fov,pilot:p.position.slice(),clearance:c.position[1]-landingSurface(c.position[0],c.position[2]),calls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles,fx:{...w.__RUNWAY_FX_QA__},clouds:w.__RUNWAY_CLOUD_QA__,bounds:w.__RUNWAY_PRESENTATION_QA__?.heroBounds,clip:w.__RUNWAY_SKELETON_QA__?.clip,knee:w.__RUNWAY_SKELETON_QA__?.knee});
   previous=now;if(p.landingAge<9)requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
 for(const [name,time] of [['door-open',1.85],['cloud-deck-from-above',6],['inside-clouds',26],['sunlit-island-reveal',36.9]]){await page.waitForFunction(t=>(window).__RUNWAY_QA__.state.routeTime>=t,time,{timeout:60000});await page.screenshot({path:info.outputPath(name+'.png')});}
 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=.2,{},{timeout:100000});await page.screenshot({path:info.outputPath('landing-contact.png')});
 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=1.8);await page.screenshot({path:info.outputPath('landing-orbit.png')});
 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=8);await page.screenshot({path:info.outputPath('landing-idle-results.png')});
 const data=await page.evaluate(async()=>{const w=window,r=w.__RUNWAY_QA__,{replay}=await import('/src/core/simulation.ts');return{replayMatches:JSON.stringify(replay(r.state.seed,r.frames))===JSON.stringify(r.state),log:w.__skyLog,result:r.state.result,stats:r.renderStats,skeleton:w.__RUNWAY_SKELETON_QA__,camera:w.__RUNWAY_CAMERA_QA__,clouds:w.__RUNWAY_CLOUD_QA__};});
 await writeFile(info.outputPath('metrics.json'),JSON.stringify({...data,errors}));
 await info.attach('sky-metrics',{path:info.outputPath('metrics.json'),contentType:'application/json'});
 expect(errors).toEqual([]);expect(data.result.outcome).toBe('landed');expect(data.replayMatches).toBe(true);
 if(process.env.SKY_ASSERT==='1'){
  expect(data.skeleton.clip).toBe('idle');expect(Math.min(...data.log.filter((v)=>v.age>=0).map((v)=>v.clearance))).toBeGreaterThan(.55);
  expect(data.stats.calls).toBeLessThanOrEqual(70);expect(data.stats.triangles).toBeLessThanOrEqual(90000);
  expect(data.log.some((v)=>v.fx.cloudExit>.5)).toBe(true);
 }
});

for(const [name,width,height,destination] of [['small',320,568,'jurere'],['landscape',844,390,'terrace'],['desktop',1440,900,'beach']])test(`landing formats ${name} ${destination}`,async({page},info)=>{
 await page.setViewportSize({width,height});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Landing QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:/^PLAY/}).click();
 await page.waitForFunction(()=>!!window.__RUNWAY_QA__);
 // Replay the approach to 24 m above contact, then run the actual renderer/clock.
 // This is a camera scenario, not a substitute for the full real-time flight above.
 await page.evaluate(async destination=>{
  const sim=await import('/src/core/simulation.ts'),{flyRoute}=await import('/tests/test-pilot.ts'),{createPresentation,updatePresentation}=await import('/src/services/presentation.ts'),r=window.__RUNWAY_QA__,s=sim.initialState(17),frames=[],d=sim.DESTINATIONS.find(d=>d.id===destination);let input={x:0,y:0};
  while(!s.outcome&&s.altitude>d.height+24){if(s.tick%2===0){const q=sim.quantize(flyRoute(s,destination));frames.push(q);input=sim.decoded(q);}sim.step(s,input);}
  r.state=s;r.frames=frames;r.eventIndex=s.events.length;r.accumulator=0;Object.assign(r.presentation,createPresentation());updatePresentation(r.presentation,s,0);r.presentation.time=s.tick/60;
  window.__RUNWAY_CONTROLS_QA__.read=()=>flyRoute(r.state,destination);
  window.__landingLog=[];
  const sample=()=>{const p=r.presentation,scene=window.__RUNWAY_SCENE_QA__,cam=scene.camera,surface=scene.scene.getObjectByName('island-terrain').userData.cameraSurface,body=scene.scene.getObjectByName('pilot-body');if(p.landingAge>=0)window.__landingLog.push({age:p.landingAge,position:cam.position.toArray(),quaternion:cam.quaternion.toArray(),clearance:cam.position.y-Math.max(surface(cam.position.x,cam.position.z),sim.landingSurface(cam.position.x,cam.position.z)),bounds:window.__RUNWAY_PRESENTATION_QA__?.heroBounds,yaw:body.rotation.y,orbit:p.orbit,framing:p.resultFraming,knee:window.__RUNWAY_SKELETON_QA__?.knee});if(p.landingAge<8)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 },destination);
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>.2);await page.screenshot({path:info.outputPath('contact.png')});
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>2.7);await page.screenshot({path:info.outputPath('orbit-results-transition.png')});
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>7);await page.screenshot({path:info.outputPath('final-face.png')});
 const data=await page.evaluate(()=>({log:window.__landingLog,result:window.__RUNWAY_QA__.state.result,stats:window.__RUNWAY_QA__.renderStats,skeleton:window.__RUNWAY_SKELETON_QA__,bounds:window.__RUNWAY_PRESENTATION_QA__.heroBounds}));
 await writeFile(info.outputPath('metrics.json'),JSON.stringify({...data,errors}));
 expect(errors).toEqual([]);expect(data.result.destination).toBe(destination);expect(data.result.outcome).toBe('landed');expect(data.skeleton.clip).toBe('idle');
 expect(Math.min(...data.log.map(v=>v.clearance))).toBeGreaterThan(.55);expect(Math.abs(data.log.at(-1).orbit)).toBeGreaterThan(.4);
 expect(data.bounds.left).toBeGreaterThan(0);expect(data.bounds.right).toBeLessThan(1);expect(data.bounds.top).toBeGreaterThan(0);expect(data.bounds.bottom).toBeLessThan(1);
 const final=data.log.at(-1);expect(Math.abs(final.yaw-final.orbit)).toBeLessThan(.03);
 expect(data.stats.calls).toBeLessThanOrEqual(70);expect(data.stats.triangles).toBeLessThanOrEqual(90000);
});

test('horizon coverage on every bearing, pause and reduced-motion adaptation',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Horizon QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!window.__RUNWAY_QA__);
 await page.evaluate(()=>window.__RUNWAY_QA__.paused=true);
 const bearings=[];
 for(let i=0;i<4;i++){
  await page.evaluate(i=>{const a=i*Math.PI/2;window.__RUNWAY_ENV_VIEW__={position:[80,1122,310],target:[80+Math.sin(a)*1000,510,310+Math.cos(a)*1000]};},i);await page.waitForTimeout(120);
  bearings.push(await page.evaluate(()=>window.__RUNWAY_CLOUD_QA__));await page.screenshot({path:info.outputPath(`horizon-${i}.png`)});
 }
 await writeFile(info.outputPath('bearings.json'),JSON.stringify(bearings));
 expect(bearings.every(b=>b.middle>=12&&b.far>=12)).toBe(true);
 await page.evaluate(async()=>{delete window.__RUNWAY_ENV_VIEW__;const {TIMING}=await import('/src/core/simulation.ts'),r=window.__RUNWAY_QA__;r.state.routeTime=TIMING.cloud+.05;r.presentation.route=TIMING.cloud+.05;});
 await page.waitForTimeout(100);const a=await page.evaluate(()=>window.__RUNWAY_FX_QA__);await page.waitForTimeout(250);const b=await page.evaluate(()=>window.__RUNWAY_FX_QA__);expect(b).toEqual(a);expect(a.veil).toBeLessThan(.04);expect(a.cloudExit).toBeGreaterThan(.98);
 await writeFile(info.outputPath('metrics.json'),JSON.stringify({bearings,pauseStable:true,reduced:a}));
});
