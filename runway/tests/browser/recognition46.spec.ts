import {test,expect,type Page} from '@playwright/test';
import {RULES,CONTENT} from '../../src/core/simulation';
async function setup(page:Page,rank:number|null=1){
 const control={rank,after:2 as number|null,offline:false,hold:false,release:()=>{},uploads:0};let ticket=0;
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({identity:{id:'me',token:'controlled'},onboarded:true,nickname:'Crown QA',startupName:'Island Crew',tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19',muted:true,musicMuted:true})));
 await page.route('**/api/**',async r=>{const path=new URL(r.request().url()).pathname.split('/api/')[1];let data:unknown={};
  if(path==='guest')data={id:'me',token:'controlled'};
  if(path==='tickets')data={id:`qa-${++ticket}`,seed:17,rules:RULES,content:CONTENT,expires:Date.now()+1e7};
  if(path==='runs'){control.uploads++;if(control.hold)await new Promise<void>(resolve=>control.release=resolve);control.rank=control.after;data={verified:true};}
  if(path==='leaderboard'){if(control.offline)return r.fulfill({status:503,body:'{}'});const own=control.rank===null?null:{id:'me',rank:control.rank,score:900000,name:'Crown QA'};data={own,rows:own?[own]:[],total:20,nextOffset:null,serverNow:Date.now(),leaders:{ceo:null,startup:{id:'startup',rank:1,score:99999999,name:'Other team',leadingSince:Date.now(),observedSince:Date.now(),tied:1}}};}
  return r.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});return control;
}
async function refresh(page:Page){await Promise.all([page.waitForResponse(r=>r.url().includes('/api/leaderboard?kind=ceo')),page.evaluate(()=>window.dispatchEvent(new Event('online')))]);}
async function crown(page:Page){return page.evaluate(()=>{const q=(window as any).__RUNWAY_SCENE_QA__,mesh=q.scene.getObjectByName('ceo-recognition-crown'),head=mesh.parent.getObjectByName('pilot-led-helmet');return {visible:mesh.visible,rank:mesh.userData.rank,color:mesh.material.color.getHexString(),sameAnchor:mesh.parent===head.parent,position:mesh.position.toArray(),calls:q.renderer.info.render.calls,triangles:q.renderer.info.render.triangles};});}
async function finish(page:Page){await page.evaluate(async()=>{
 const {step,quantize,decoded}=await import('/src/core/simulation.ts' as string),{flyToJurere}=await import('/tests/test-pilot.ts' as string),w=window as any,r=w.__RUNWAY_QA__;
 // Accelerate the unchanged deterministic simulation; submit its genuine input frames.
 r.paused=true;while(!r.state.result&&r.state.tick<12000){if(r.state.tick%2===0){const q=quantize(flyToJurere(r.state));r.frames.push(q);r.input=decoded(q);}step(r.state,r.input);}
 r.paused=false;r.accumulator=0;
 });await expect(page.getByLabel('Flight results')).toBeVisible({timeout:15000});}

test('SVG menus, pause order and confirmed crowns update without remounting the pilot',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>{if(!/ResizeObserver/.test(e.message))errors.push(e.message);});const c=await setup(page);
 await expect.poll(async()=>(await crown(page)).rank).toBe(1);expect((await crown(page)).sameAnchor).toBe(true);
 expect(await page.getByRole('button',{name:'PLAY',exact:true}).locator('svg[data-icon="play"]').count()).toBe(1);
 await page.evaluate(()=>{(window as any).oldPilot=(window as any).__RUNWAY_SCENE_QA__.scene.getObjectByName('pilot-body');});
 for(const [rank,color] of [[1,'ffd45c'],[2,'d9e6ef'],[3,'d99054']] as const){c.rank=rank;await refresh(page);await expect.poll(async()=>(await crown(page)).color).toBe(color);await page.screenshot({path:info.outputPath(`crown-${rank}.png`)});}
 c.rank=4;await refresh(page);await expect.poll(async()=>(await crown(page)).visible).toBe(false);c.rank=null;await refresh(page);await expect.poll(async()=>(await crown(page)).visible).toBe(false);
 c.rank=1;await refresh(page);c.offline=true;await refresh(page);await expect.poll(async()=>(await crown(page)).visible).toBe(false);c.offline=false;await refresh(page);
 expect(await page.evaluate(()=>(window as any).oldPilot===(window as any).__RUNWAY_SCENE_QA__.scene.getObjectByName('pilot-body'))).toBe(true);
 for(const [width,height] of [[390,844],[320,568],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});for(const name of ['Music','CREDITS','Sound settings','HOW TO PLAY']){const el=page.getByRole('button',{name,exact:true}),b=await el.boundingBox();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(width);expect(b!.y+b!.height).toBeLessThanOrEqual(height);}
  await page.screenshot({path:info.outputPath(`menu-${width}.png`)});
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Music',exact:true}).click();await expect(page.getByRole('button',{name:'Music',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'CREDITS',exact:true}).click();await expect(page.getByRole('dialog',{name:'Credits'})).toBeVisible();await page.getByRole('button',{name:'BACK',exact:true}).click();await page.waitForTimeout(220);
 await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();await expect(page.locator('.lesson-icon svg')).toBeVisible();await page.getByRole('button',{name:'CLOSE',exact:true}).click();
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);await page.waitForTimeout(1200);expect((await crown(page)).sameAnchor).toBe(true);
 await page.getByRole('button',{name:'Pause',exact:true}).click();const buttons=page.getByRole('dialog',{name:'Paused'});expect(await buttons.getByRole('button',{name:'RESUME FLIGHT',exact:true}).evaluate(e=>e.nextElementSibling?.textContent)).toContain('BACK TO PLANE');await page.screenshot({path:info.outputPath('pause.png')});
 await buttons.getByRole('button',{name:'RESUME FLIGHT',exact:true}).click();await page.waitForTimeout(220);await page.waitForTimeout(3500);expect((await crown(page)).sameAnchor).toBe(true);await page.screenshot({path:info.outputPath('crown-flight.png')});expect(errors).toEqual([]);
 await info.attach('crown-metrics',{body:JSON.stringify(await crown(page)),contentType:'application/json'});
});

test('verified results wait for acknowledgement and show actual gains, losses and first entries',async({page},info)=>{
 const c=await setup(page,12);c.hold=true;
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);await finish(page);
 await expect(page.getByLabel('CEO ranking progress')).toContainText('Updating CEO ranking');await expect(page.locator('.rank-places')).toHaveCount(0);
 await expect.poll(()=>c.uploads).toBe(1);c.release();await expect(page.locator('.rank-places')).toContainText('#12');await expect(page.locator('.rank-places')).toContainText('#2');await expect(page.locator('.rank-places')).toContainText('10 GAINED');await expect(page.locator('.rank-milestone')).toContainText('TOP 3');await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.presentation.landingAge>=8);await page.screenshot({path:info.outputPath('landed-top3.png')});
 for(const [width,height]of [[320,568],[844,390],[1440,900]]){await page.setViewportSize({width,height});await page.waitForTimeout(900);const b=await page.getByLabel('CEO ranking progress').boundingBox();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.y+b!.height).toBeLessThanOrEqual(height);await page.screenshot({path:info.outputPath(`results-${width}.png`)});}
 // A competitor overtakes this player. The new query must display the loss, not invent a PB bonus.
 c.rank=17;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('.rank-places')).toContainText('5 LOST');await expect(page.locator('.rank-milestone')).toHaveCount(0);
 c.offline=true;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.getByLabel('CEO ranking progress')).toContainText('Ranking unavailable');await expect(page.locator('.rank-places')).toHaveCount(0);c.offline=false;await page.getByRole('button',{name:'RETRY',exact:true}).click();await expect(page.locator('.rank-places')).toContainText('#17');
 c.rank=null;c.after=9;c.hold=false;await page.getByRole('button',{name:'ONE MORE RUN',exact:true}).click();await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.state.tick<120);await finish(page);await expect(page.locator('.rank-places')).toContainText('UNRANKED');await expect(page.locator('.rank-places')).toContainText('FIRST ENTRY');await expect(page.locator('.rank-milestone')).toContainText('TOP 10');expect(c.uploads).toBe(2);
 await page.screenshot({path:info.outputPath('first-top10.png')});
});


test('crown remains attached during a continuous flight and landing, with bounded render cost',async({page},info)=>{
 await setup(page,1);await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const {flyToJurere}=await import('/tests/test-pilot.ts' as string),w=window as any;w.__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere(w.__RUNWAY_QA__.state);});
 for(const [label,time]of [['fall',8],['canopy',37]] as const){await page.waitForFunction(t=>(window as any).__RUNWAY_QA__.state.routeTime>=t,time,{timeout:65000});expect((await crown(page)).sameAnchor).toBe(true);await page.screenshot({path:info.outputPath(`continuous-${label}.png`)});}
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.presentation.landingAge>=8,{},{timeout:100000});await page.screenshot({path:info.outputPath('continuous-landed.png')});
 const stats=await page.evaluate(()=>({stats:(window as any).__RUNWAY_QA__.renderStats,frames:(window as any).__RUNWAY_QA__.renderFps}));expect(stats.stats.calls).toBeLessThanOrEqual(70);expect(stats.stats.triangles).toBeLessThanOrEqual(90000);expect((await crown(page)).sameAnchor).toBe(true);await info.attach('continuous-metrics',{body:JSON.stringify(stats),contentType:'application/json'});
});
