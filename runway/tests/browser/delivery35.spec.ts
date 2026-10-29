import {test,expect} from '@playwright/test';
test('Delivery is a green positive pickup and preserves Water protection',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Delivery QA',startupName:'Runway',tutorialVersion:'npc-26'})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>(window as any).__RUNWAY_QA__?.state.routeTime>5);
 await page.evaluate(()=>{const r=(window as any).__RUNWAY_QA__,s=r.state;r.paused=true;s.shield=1;s.objects=[{id:'qa-delivery',kind:'delivery',x:s.x,y:s.y,t:s.routeTime,alt:s.altitude-10,r:1.15,motion:0,fallSpeed:0,penaltyScale:1}];});await page.waitForTimeout(150);
 expect(await page.evaluate(()=>(window as any).__RUNWAY_SCENE_QA__.scene.getObjectByName('course-delivery').material.emissive.getHexString())).toBe('23ff9d');await page.screenshot({path:info.outputPath('delivery-positive.png')});
 const before=await page.evaluate(()=>{const r=(window as any).__RUNWAY_QA__,s=r.state;s.objects[0].alt=s.altitude-.2;r.paused=false;return{cash:s.cash,hits:s.hazardHits};});
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.state.collected.includes('qa-delivery'));
 const after=await page.evaluate(()=>{const r=(window as any).__RUNWAY_QA__;r.paused=true;return{cash:r.state.cash,hits:r.state.hazardHits,shield:r.state.shield,events:r.state.events.filter((e:any)=>e.sourceId==='qa-delivery')};});expect(after.cash-before.cash).toBe(5000);expect(after.hits).toBe(before.hits);expect(after.shield).toBe(1);expect(after.events).toHaveLength(1);expect(errors).toEqual([]);await info.attach('delivery-contact',{body:JSON.stringify({before,after,errors}),contentType:'application/json'});
});
