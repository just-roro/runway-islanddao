import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
async function start(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|VALIDATE/i.test(m.text()))errors.push(m.text());});
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'World QA',startupName:'Runway',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19'}));Object.defineProperty(crypto,'getRandomValues',{value:a=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!window.__RUNWAY_QA__);return errors;
}
async function approach(page,destination){
 await page.evaluate(async destination=>{
  const sim=await import('/src/core/simulation.ts'),{flyRoute}=await import('/tests/test-pilot.ts'),{createPresentation,updatePresentation}=await import('/src/services/presentation.ts'),r=window.__RUNWAY_QA__,s=sim.initialState(17),frames=[],d=sim.DESTINATIONS.find(d=>d.id===destination);let input={x:0,y:0};
  while(!s.outcome&&(s.altitude>d.height+24||s.tick%2!==0)){if(s.tick%2===0){const q=sim.quantize(flyRoute(s,destination));frames.push(q);input=sim.decoded(q);}sim.step(s,input);}
  r.state=s;r.frames=frames;r.eventIndex=s.events.length;r.accumulator=0;Object.assign(r.presentation,createPresentation());updatePresentation(r.presentation,s,0);r.presentation.time=s.tick/60;window.__RUNWAY_CONTROLS_QA__.read=()=>flyRoute(r.state,destination);
 },destination);
}
async function log(page){await page.evaluate(()=>{
 window.__worldLog=[];let last=performance.now();
 const sample=now=>{const r=window.__RUNWAY_QA__,q=window.__RUNWAY_SCENE_QA__,cam=q.camera,surface=q.scene.getObjectByName('island-terrain').userData.cameraSurface;
  window.__worldLog.push({ms:now-last,route:r.state.routeTime,age:r.presentation.landingAge,calls:q.renderer.info.render.calls,triangles:q.renderer.info.render.triangles,world:window.__RUNWAY_WORLD_QA__,platform:window.__RUNWAY_PLATFORM_QA__,clearance:cam.position.y-surface(cam.position.x,cam.position.z),textures:q.renderer.info.memory.textures,geometries:q.renderer.info.memory.geometries});last=now;if(r.presentation.landingAge<8)requestAnimationFrame(sample);
 };requestAnimationFrame(sample);
});}
async function finish(page,info,errors,destination){
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>=.65,{},{timeout:110000});await page.screenshot({path:info.outputPath('landing-fireworks.png')});
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>=2);await page.screenshot({path:info.outputPath('landing-orbit.png')});
 await page.waitForFunction(()=>window.__RUNWAY_QA__.presentation.landingAge>=7);await page.screenshot({path:info.outputPath('final-platform.png')});
 const data=await page.evaluate(async()=>{const r=window.__RUNWAY_QA__,{replay}=await import('/src/core/simulation.ts');return {log:window.__worldLog,result:r.state.result,stats:r.renderStats,platform:window.__RUNWAY_PLATFORM_QA__,replayMatches:JSON.stringify(replay(r.state.seed,r.frames))===JSON.stringify(r.state)};});
 await writeFile(info.outputPath('metrics.json'),JSON.stringify({...data,errors}));
 expect(errors).toEqual([]);expect(data.result.destination).toBe(destination);expect(data.result.outcome).toBe('landed');expect(data.replayMatches).toBe(true);expect(data.log.some(p=>p.platform?.fireworks&&p.platform.shaderAge>.1)).toBe(true);expect(data.log.filter(p=>p.platform?.fireworks).every(p=>p.platform.shaderAge===p.platform.age)).toBe(true);expect(data.platform.fireworks).toBe(false);
 expect(Math.min(...data.log.filter(p=>p.age>=0).map(p=>p.clearance))).toBeGreaterThan(.55);expect(data.stats.calls).toBeLessThanOrEqual(70);expect(data.stats.triangles).toBeLessThanOrEqual(90000);
}
test('world39 full flight, island approach, traffic and successful fireworks',async({page},info)=>{
 const errors=await start(page);await page.evaluate(async()=>{const {flyToJurere}=await import('/tests/test-pilot.ts');window.__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere(window.__RUNWAY_QA__.state);});await log(page);
 for(const [name,time] of [['aircraft',1.9],['glide-and-birds',39],['island-approach',46],['near-island',51]]){await page.waitForFunction(t=>window.__RUNWAY_QA__.state.routeTime>=t,time,{timeout:90000});await page.screenshot({path:info.outputPath(name+'.png')});}
 await finish(page,info,errors,'jurere');
});
for(const [name,width,height,destination] of [['small',320,568,'beach'],['landscape',844,390,'terrace']])test(`world39 ${name} platform ${destination}`,async({page},info)=>{
 await page.setViewportSize({width,height});const errors=await start(page);await approach(page,destination);await log(page);await finish(page,info,errors,destination);
});
test('world39 scenery moves, pauses, and never celebrates off-platform landings',async({page},info)=>{
 const errors=await start(page);await approach(page,'terrace');
 await page.evaluate(()=>{window.__RUNWAY_QA__.paused=true;window.__RUNWAY_ENV_VIEW__={position:[25,26,12],target:[10,3,-7]};});await page.waitForTimeout(500);
 const matrices=()=>page.evaluate(()=>{const s=window.__RUNWAY_SCENE_QA__.scene;return Object.fromEntries(['world-cars','world-boats','world-swimmers','world-divers','world-balloons','landing-searchlights'].map(name=>[name,Array.from(s.getObjectByName(name).instanceMatrix.array)]));});
 const a=await matrices();await page.waitForTimeout(350);expect(await matrices()).toEqual(a);
 await page.evaluate(()=>window.__RUNWAY_QA__.presentation.time+=2);await page.waitForTimeout(100);const b=await matrices();for(const name of ['world-cars','world-boats','world-divers','world-balloons','landing-searchlights'])expect(b[name]).not.toEqual(a[name]);
 await page.screenshot({path:info.outputPath('bridge-roads-traffic.png')});
 // Actual result flags remain authoritative. Visual time alone cannot trigger a win.
 for(const outcome of ['landed','water','bankrupt']){
  await page.evaluate(outcome=>{const r=window.__RUNWAY_QA__;r.state.outcome=outcome;r.state.destination=null;r.presentation.landingAge=1;r.state.x=-15;r.state.y=0;r.state.altitude=3;},outcome);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__RUNWAY_PLATFORM_QA__.fireworks)).toBe(false);
 }
 await writeFile(info.outputPath('checks.json'),JSON.stringify({pauseStable:true,animationFamilies:Object.keys(b),offPlatformFireworks:false,errors}));expect(errors).toEqual([]);
});
