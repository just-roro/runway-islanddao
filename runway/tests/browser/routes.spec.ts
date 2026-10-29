import {test,expect} from '@playwright/test';

test('cold coin preparation, optional guide, credits and twenty result retries',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Lifecycle QA',startupName:'Flight Lab',tutorialVersion:'routes-21'})));
 let release!:()=>void;const coinHeld=new Promise<void>(r=>release=r);
 await page.route('**/sol-coin.webp',async r=>{await coinHeld;await r.continue();});
 await page.goto('/?qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1500);await expect(page.locator('#runway-boot')).toBeVisible();
 release();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});
 await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();
 await page.getByRole('button',{name:'PICKUPS & OBSTACLES ↗'}).click();
 await expect(page.locator('.content-guide article')).toHaveCount(14);
 await expect(page.locator('.content-guide')).toContainText('Halves the next hit');
 await page.screenshot({path:info.outputPath('guide.png')});
 await page.getByRole('button',{name:'BACK TO BRIEFING'}).click();await page.getByRole('button',{name:'CLOSE',exact:true}).click();
 await page.getByRole('button',{name:'CREDITS',exact:true}).click();
 await expect(page.locator('.credit-names')).toContainText('Rodrigo Candia');
 await expect.poll(()=>page.locator('.human-friendly img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.screenshot({path:info.outputPath('credits.png')});await page.getByRole('button',{name:'BACK',exact:true}).click();
 await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 expect(await page.locator('.cash-number img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.evaluate(()=>{(window as any).__originalCanvas=document.querySelector('canvas');});
 const timings:number[]=[];
 for(let i=0;i<20;i++){
  // Fast-forward a real deterministic input replay to exercise the UI lifecycle.
  // Full flights are separately recorded in arcade.spec.ts; these are not 20 realtime flights.
  await page.evaluate(async()=>{const a='/src/core/simulation.ts',b='/tests/test-pilot.ts';const sim=await import(a),{flyRoute}=await import(b),r=(window as any).__RUNWAY_QA__,s=sim.initialState(r.state.seed),frames=[];while(!s.result){const q=sim.quantize(flyRoute(s));frames.push(q);sim.step(s,sim.decoded(q));sim.step(s,sim.decoded(q));}r.state=s;r.frames=frames;r.eventIndex=s.events.length;});
  await expect(page.getByRole('heading',{name:'RUN COMPLETE'})).toBeVisible();
  await expect(page.getByText('CEO RANK',{exact:true})).toHaveCount(0);await expect(page.getByText('STARTUP RANK',{exact:true})).toHaveCount(0);
  if(i===0){await page.waitForTimeout(3000);await page.screenshot({path:info.outputPath('settlement.png')});}
  const start=Date.now();await page.getByRole('button',{name:'ONE MORE RUN',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();timings.push(Date.now()-start);
  expect(await page.evaluate(()=>document.querySelector('canvas')===(window as any).__originalCanvas)).toBe(true);
 }
 await page.waitForTimeout(900);
 expect(await page.evaluate(()=>(window as any).__RUNWAY_AUDIO_QA__.musicStatus().playing)).toEqual(['game']);
 expect(Math.max(...timings)).toBeLessThan(1000);expect(errors).toEqual([]);
 console.log('RETRY LIFECYCLE',info.project.name,JSON.stringify({count:20,maxMs:Math.max(...timings),meanMs:timings.reduce((a,b)=>a+b,0)/20}));
});
