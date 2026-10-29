import {test,expect} from '@playwright/test';

test('settlement keeps its layout and pilot visible on every route and screen',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Presentation QA',startupName:'Flight Lab',tutorialVersion:'routes-21'})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});
 const measurements:any[]=[];
 for(const route of ['beach','terrace','jurere','water']){
  await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
  const result=await page.evaluate(async route=>{const core='/src/core/simulation.ts',pilot='/tests/test-pilot.ts',sim=await import(core),{flyRoute}=await import(pilot),r=(window as any).__RUNWAY_QA__,s=sim.initialState(17),frames=[];
   while(!s.result){const input=route==='water'&&s.phase==='land'?{x:1,y:0}:flyRoute(s,route==='water'?'beach':route);const q=sim.quantize(input);frames.push(q);sim.step(s,sim.decoded(q));sim.step(s,sim.decoded(q));}
   r.state=s;r.frames=frames;r.reported=true;r.onFinish(r);return s.result;
  },route);
  expect(result.outcome).toBe(route==='water'?'water':'landed');
  if(route!=='water')expect(result.destination).toBe(route);else expect(result.cashFinal).toBe(0);
  await expect(page.getByRole('heading',{name:route==='water'?'OUT OF RUNWAY':'RUN COMPLETE'})).toBeVisible();
  await page.waitForTimeout(350); // Exclude the panel's intentional entrance scale.
  const early=await page.locator('.financial-panel').boundingBox();
  await expect(page.locator('.closing-total>span')).toHaveText('FINAL MONEY');
  const late=await page.locator('.financial-panel').boundingBox();expect(Math.abs(early!.height-late!.height)).toBeLessThan(2);
  for(const [width,height] of [[390,844],[360,740],[844,390],[1440,900]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(1200);
   const after=await page.evaluate(()=>performance.now());
   await page.waitForFunction(({width,height,after})=>{const v=(window as any).__RUNWAY_PRESENTATION_QA__;return v.sampleAt>after&&Math.abs(v.viewport[0]-width)<1&&Math.abs(v.viewport[1]-height)<1;},{width,height,after},{timeout:10000}).catch(async error=>{console.log("FRAMING SAMPLE",await page.evaluate(()=>(window as any).__RUNWAY_PRESENTATION_QA__),{width,height,after});throw error;});
   const hero=await page.evaluate(()=>(window as any).__RUNWAY_PRESENTATION_QA__.heroBounds);
   const panel=await page.locator('.financial-panel').boundingBox(),button=await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).boundingBox();
   expect(hero.top).toBeGreaterThan(0);expect(hero.bottom).toBeLessThan(1);expect(hero.left).toBeGreaterThan(0);expect(hero.right).toBeLessThan(1);
   if(width<height)expect(hero.bottom*height).toBeLessThan(panel!.y+8);else expect(hero.right*width).toBeLessThan(panel!.x+8);
   expect(button!.y+button!.height).toBeLessThanOrEqual(height);expect(button!.x+button!.width).toBeLessThanOrEqual(width);
   measurements.push({route,width,height,hero,panel});await page.screenshot({path:info.outputPath(`${route}-${width}.png`)});
  }
  await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();await page.setViewportSize({width:390,height:844});
 }
 await info.attach('settlement-framing',{body:JSON.stringify(measurements,null,2),contentType:'application/json'});expect(errors).toEqual([]);
});
