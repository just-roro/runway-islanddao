import {chromium,webkit} from '@playwright/test';
import fs from 'node:fs';
const label=process.argv[2]||'before',engine=process.argv[3]||'chromium',out='reports/world39/'+label;fs.mkdirSync(out,{recursive:true});
const browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'?{args:['--use-angle=metal','--enable-webgl']}:{});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1.5});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|VALIDATE/i.test(m.text()))errors.push(m.text());});
await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Island QA',startupName:'Environment',tutorialVersion:'npc-26'})));
await page.goto('http://127.0.0.1:5183/?qa=1');await page.locator('#runway-boot').waitFor({state:'detached'});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!window.__RUNWAY_QA__);
const metrics=[];
for(const [stage,time] of [['approach',40],['island',48],['landing',54]]){
 await page.evaluate(async time=>{const sim=await import('/src/core/simulation.ts'),{flyRoute}=await import('/tests/test-pilot.ts'),{createPresentation,updatePresentation}=await import('/src/services/presentation.ts');const r=window.__RUNWAY_QA__,s=sim.initialState(17);while(s.tick/60<time&&!s.result){const q=sim.quantize(flyRoute(s,'jurere'));sim.step(s,sim.decoded(q));sim.step(s,sim.decoded(q));}r.state=s;r.reported=true;r.presentation=createPresentation();updatePresentation(r.presentation,s,1/60);r.paused=false;r.renderStats={calls:0,triangles:0};},time);
 await page.waitForTimeout(1800);await page.evaluate(()=>window.__RUNWAY_QA__.paused=true);await page.screenshot({path:`${out}/${label}-${engine}-${stage}.png`});
 if(process.env.ISLAND_DETAILS==='1')continue;
 const data=await page.evaluate(async()=>{const q=window.__RUNWAY_SCENE_QA__,r=window.__RUNWAY_QA__;const frames=[];let last=performance.now();await new Promise(resolve=>{const f=now=>{frames.push(now-last);last=now;if(frames.length<180)requestAnimationFrame(f);else resolve();};requestAnimationFrame(f);});frames.sort((a,b)=>a-b);return {state:{x:r.state.x,z:r.state.y,altitude:r.state.altitude,tick:r.state.tick},habitat:window.__RUNWAY_HABITAT_QA__,calls:q.renderer.info.render.calls,triangles:q.renderer.info.render.triangles,gpu:(()=>{const gl=q.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'})(),memory:q.renderer.info.memory,geometryBytes:[...new Set(q.scene.getObjectsByProperty('isMesh',true).map(m=>m.geometry))].reduce((sum,g)=>sum+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0),0),max:r.renderStats,medianMs:frames[90],p95Ms:frames[171]};});metrics.push({stage,...data});
}
// Fixed inspection views use the actual scene/materials, independent from the flight camera.
const inspections=[['overview',[0,310,170],[0,0,5]],['bridge',[180,110,140],[30,5,-30]],['ground',[-35,12,-22],[-25,3,-43]]];
await page.setViewportSize({width:1200,height:800});
await page.addStyleTag({content:'.flight-hud,.economic-feed,.modifiers,.countdown,.flight-footer,.results,.joystick{visibility:hidden!important}'});
for(const [name,position,target] of [...inspections,['bridge-access',[70,22,35],[35,1,3]],['bridge-distance',[57,22,7],[600,9,-137]],['grass-near',[-22,5,-22],[-26,3,-29]]]){
 await page.evaluate(async view=>{if(view.ground){const {surfaceSampler}=await import('/src/scene/ground.ts'),mesh=window.__RUNWAY_SCENE_QA__.scene.getObjectsByProperty('isMesh',true).find(m=>m.geometry?.attributes.groundMask),height=surfaceSampler(mesh.geometry);view.position[1]=height(view.position[0],view.position[2])+2;view.target[1]=height(view.target[0],view.target[2])+.35;}window.__RUNWAY_ENV_VIEW__=view;}, {position,target,ground:name==='grass-near'});await page.waitForTimeout(1000);
 await page.screenshot({path:`${out}/${label}-${engine}-${name}-lit.png`});
}

console.log(JSON.stringify({label,engine,metrics,errors}));fs.writeFileSync(`${out}/${label}-${engine}.json`,JSON.stringify({label,engine,metrics,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;
