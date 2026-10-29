import {test,expect} from '@playwright/test';

test('shared clock freezes choreography, contacts and HUD; resumes every milestone',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|VALIDATE_STATUS/i.test(m.text()))errors.push(m.text());});await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Motion QA',startupName:'Flight Lab',tutorialVersion:'routes-21'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});await page.screenshot({path:info.outputPath('airport.png')});
 const snapshot=()=>page.evaluate(()=>{const w=window as any,r=w.__RUNWAY_QA__;return {time:r.presentation.time,tick:r.state.tick,cues:r.presentation.cues.length,pose:w.__RUNWAY_SKELETON_QA__,canopy:w.__RUNWAY_CANOPY_QA__,camera:w.__RUNWAY_CAMERA_QA__,cash:document.querySelector('.cash-content')?.getAttribute('style'),path:document.querySelector('.financial-sparkline polyline')?.getAttribute('points')};});
 await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const path='/tests/test-pilot.ts';const {flyToJurere}=await import(path);(window as any).__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere((window as any).__RUNWAY_QA__.state);});
 const measurements=[];
 for(const [time,label] of [[.65,'prepare'],[2,'run'],[3.2,'jump'],[10,'freefall'],[36.15,'opening'],[40,'canopy']] as const){
  await page.waitForFunction(t=>(window as any).__RUNWAY_QA__.state.routeTime>=t,time);
  await page.evaluate(()=>{(window as any).__RUNWAY_QA__.paused=true;});await page.waitForTimeout(100);const before=await snapshot();await page.waitForTimeout(300);const after=await snapshot();expect(after).toEqual(before);expect(await page.evaluate(()=>performance.now()-(window as any).__RUNWAY_HEAD_DRAW_QA__)).toBeLessThan(150);measurements.push({label,...after});await page.screenshot({path:info.outputPath(label+'.png')});await page.evaluate(()=>{(window as any).__RUNWAY_QA__.paused=false;});
 }
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.presentation.landingAge>.12);await page.evaluate(()=>{(window as any).__RUNWAY_QA__.paused=true;});await page.waitForTimeout(100);const landed=await snapshot();await page.waitForTimeout(300);expect(await snapshot()).toEqual(landed);await page.screenshot({path:info.outputPath('contact.png')});await page.evaluate(()=>{(window as any).__RUNWAY_QA__.paused=false;});
 await expect(page.getByRole('heading',{name:'RUN COMPLETE'})).toBeVisible({timeout:90000});await expect(page.locator('.closing-total>span')).toHaveText('FINAL MONEY');await expect.poll(()=>page.evaluate(()=>performance.now()-(window as any).__RUNWAY_HEAD_DRAW_QA__)).toBeLessThan(150);await page.screenshot({path:info.outputPath('result.png')});
 const final=await page.evaluate(()=>{const r=(window as any).__RUNWAY_QA__;return {events:r.state.events,cues:r.presentation.cues,stats:r.renderStats,result:r.state.result};});expect(final.cues.length).toBe(final.events.length);expect(final.cues.map((e:any)=>[e.tick,e.delta,e.balance])).toEqual(final.events.map((e:any)=>[e.tick,e.delta,e.balance]));expect(new Set(final.cues.map((e:any)=>e.id)).size).toBe(final.cues.length);expect(errors).toEqual([]);
 expect(final.stats.calls).toBeLessThanOrEqual(70);expect(final.stats.triangles).toBeLessThanOrEqual(90000);console.log('MOTION',info.project.name,JSON.stringify(final.stats));
 await info.attach('motion-measurements',{body:JSON.stringify({measurements,final},null,2),contentType:'application/json'});
});
