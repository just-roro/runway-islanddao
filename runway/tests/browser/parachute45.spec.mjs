import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

test('storm, canopy, currents and glide star on the real flight clock',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader/i.test(m.text()))errors.push(m.text());});
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Sky QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'}));Object.defineProperty(crypto,'getRandomValues',{value:(a)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});
 await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window).__RUNWAY_QA__);
 await page.evaluate(async()=>{
  const {flyToJurere}=await import('/tests/test-pilot.ts'),{landingSurface}=await import('/src/core/simulation.ts'),w=window;
  w.__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere(w.__RUNWAY_QA__.state);
  w.__skyLog=[];let previous=performance.now();
  const sample=(now)=>{const r=w.__RUNWAY_QA__,c=w.__RUNWAY_CAMERA_QA__,scene=w.__RUNWAY_SCENE_QA__,p=r.presentation;
   if(c&&scene)w.__skyLog.push({ms:now-previous,time:r.state.routeTime,age:p.landingAge,camera:c.position,fov:c.fov,pilot:p.position.slice(),clearance:c.position[1]-landingSurface(c.position[0],c.position[2]),calls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles,fx:{...w.__RUNWAY_FX_QA__},world:w.__RUNWAY_WORLD_QA__,draft:w.__RUNWAY_DRAFT_QA__,memory:{...scene.renderer.info.memory},clouds:w.__RUNWAY_CLOUD_QA__,bounds:w.__RUNWAY_PRESENTATION_QA__?.heroBounds,clip:w.__RUNWAY_SKELETON_QA__?.clip,knee:w.__RUNWAY_SKELETON_QA__?.knee});
   previous=now;if(p.landingAge<9)requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
 for(const [name,time] of [['door-open',1.85],['cloud-deck-from-above',6],['inside-clouds',26],['clearing-before-canopy',35.2],['canopy-opening',35.9],['sunlit-island-reveal',36.9],['current-and-star',40.9],['glide-scenery',43.5]]){await page.waitForFunction(t=>(window).__RUNWAY_QA__.state.routeTime>=t,time,{timeout:60000});await page.screenshot({path:info.outputPath(name+'.png')});
  if(name==='current-and-star'){
   await page.waitForFunction(()=>window.__RUNWAY_QA__.state.events.some(e=>e.sourceId==='glide-star-0'));
   await page.waitForTimeout(150);await page.screenshot({path:info.outputPath('glide-star-activated.png')});
  }
  if(name==='clearing-before-canopy'){
   await page.evaluate(()=>{window.__RUNWAY_QA__.paused=true;});
   const frozen=await page.evaluate(()=>({time:window.__RUNWAY_QA__.presentation.time,fx:window.__RUNWAY_FX_QA__,draft:window.__RUNWAY_DRAFT_QA__}));
   await page.waitForTimeout(450);expect(await page.evaluate(()=>({time:window.__RUNWAY_QA__.presentation.time,fx:window.__RUNWAY_FX_QA__,draft:window.__RUNWAY_DRAFT_QA__}))).toEqual(frozen);
   await page.evaluate(()=>{window.__RUNWAY_QA__.paused=false;});
  }
 }

 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=.2,{},{timeout:100000});await page.screenshot({path:info.outputPath('landing-contact.png')});
 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=1.8);await page.screenshot({path:info.outputPath('landing-orbit.png')});
 await page.waitForFunction(()=>(window).__RUNWAY_QA__.presentation.landingAge>=8);await page.screenshot({path:info.outputPath('landing-idle-results.png')});
 const data=await page.evaluate(async()=>{const w=window,r=w.__RUNWAY_QA__,{replay}=await import('/src/core/simulation.ts');return{replayMatches:JSON.stringify(replay(r.state.seed,r.frames))===JSON.stringify(r.state),log:w.__skyLog,result:r.state.result,stars:r.state.events.filter(e=>e.sourceId?.startsWith('glide-star-')),stats:r.renderStats,skeleton:w.__RUNWAY_SKELETON_QA__,camera:w.__RUNWAY_CAMERA_QA__,clouds:w.__RUNWAY_CLOUD_QA__};});
 await writeFile(info.outputPath('metrics.json'),JSON.stringify({...data,errors}));
 await info.attach('sky-metrics',{path:info.outputPath('metrics.json'),contentType:'application/json'});
 expect(errors).toEqual([]);expect(data.result.outcome).toBe('landed');expect(data.replayMatches).toBe(true);expect(data.stars).toHaveLength(1);expect(data.log.filter(x=>x.time>36&&x.time<38).every(x=>x.fx.immersion===0)).toBe(true);
 {
  expect(data.skeleton.clip).toBe('idle');expect(Math.min(...data.log.filter((v)=>v.age>=0).map((v)=>v.clearance))).toBeGreaterThan(.55);
  expect(data.stats.calls).toBeLessThanOrEqual(70);expect(data.stats.triangles).toBeLessThanOrEqual(90000);
  expect(data.log.some((v)=>v.fx.cloudExit>.5)).toBe(true);
 }
});

test('desktop and landscape scenery retains silhouettes, wind direction and rainbow',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>{if(!/ResizeObserver loop/.test(e.message))errors.push(e.message);});page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader/i.test(m.text()))errors.push(m.text());});
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Scenery QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'}));});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!window.__RUNWAY_QA__);await page.waitForTimeout(300);
 await page.evaluate(async()=>{
  const r=window.__RUNWAY_QA__,{step,TIMING}=await import('/src/core/simulation.ts'),{flyToJurere}=await import('/tests/test-pilot.ts'),{updatePresentation}=await import('/src/services/presentation.ts');
  r.paused=true;while(r.state.routeTime<TIMING.glide+1)step(r.state,flyToJurere(r.state));updatePresentation(r.presentation,r.state,r.state.tick/60);r.paused=false;
 });
 await page.waitForTimeout(500);await page.evaluate(()=>window.__RUNWAY_QA__.paused=true);
 const samples=[];
 for(const size of [{width:1440,height:900},{width:844,height:390}]){
  await page.setViewportSize(size);await page.waitForTimeout(1000);await page.screenshot({path:info.outputPath(`glide-${size.width}.png`)});
  samples.push(await page.evaluate(()=>{const {scene,renderer,camera}=window.__RUNWAY_SCENE_QA__,rainbow=scene.getObjectByName('distant-rainbow');return{size:[innerWidth,innerHeight],rainbow:rainbow.visible,uniforms:[rainbow,scene.getObjectByName('updraft-directions').children[0]].map(m=>({value:m.material.uniforms.visibility.value,visible:m.visible,count:m.count,position:m.position.toArray(),program:renderer.properties.get(m.material).currentProgram?.getUniforms().seq.map(u=>u.id)})),wind:window.__RUNWAY_DRAFT_QA__,world:window.__RUNWAY_WORLD_QA__,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:renderer.info.memory,far:camera.far};}));
 }
 await page.setViewportSize({width:1440,height:900});
 for(const distance of [400,250,85,65,45]){
  await page.evaluate(d=>{window.__RUNWAY_ENV_VIEW__={position:[-35,35,65+d],target:[-35,4,65]};},distance);await page.waitForTimeout(500);
  const record=await page.evaluate(()=>window.__RUNWAY_WORLD_QA__);samples.push({distance,...record});
  if(distance===400||distance===65)await page.screenshot({path:info.outputPath(`coast-${distance}.png`)});
 }
 expect(samples[0].rainbow).toBe(true);expect(samples[0].uniforms.map(u=>u.value)).toEqual([1,1]);expect(samples[0].wind.visibility).toBe(1);expect(samples[2].counts.rockDistant).toBeGreaterThan(0);expect(samples.at(-1).counts.rocks).toBeGreaterThan(0);
 await writeFile(info.outputPath('scenery.json'),JSON.stringify({samples,errors},null,2));expect(errors).toEqual([]);
});
