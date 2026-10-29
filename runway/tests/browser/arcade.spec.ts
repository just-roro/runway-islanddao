import {test,expect} from '@playwright/test';
import perks from '../../src/assets/perks.json' with {type:'json'};

test('first visit, briefing models, persistent music, pilot materials and pause',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.abort());
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});
 await expect(page.getByPlaceholder('Your founder name')).toHaveValue('');
 await page.getByPlaceholder('Your founder name').fill('Arcade QA');await page.getByPlaceholder('Your startup name').fill('Flight Lab');
 await page.getByRole('button',{name:'LET’S GO'}).click();
 const presentation=()=>page.evaluate(()=>(window as any).__RUNWAY_PRESENTATION_QA__);
 const music=()=>page.evaluate(()=>(window as any).__RUNWAY_AUDIO_QA__.musicStatus());
 await expect.poll(async()=>(await music()).playing).toEqual(['menu']);
 await expect(page.getByRole('dialog',{name:'How to play'})).toBeVisible();
 await expect.poll(async()=>(await presentation()).crew).toBe(true);
 for(let step=0;step<6;step++){
  await expect.poll(async()=>(await presentation()).step).toBe(step);
  await expect(page.getByRole('button',{name:step===5?/BACK TO PLANE/:/^NEXT/})).toBeVisible();
  await page.screenshot({path:info.outputPath(`tutorial-${step}.png`)});
  await page.getByRole('button',{name:step===5?/BACK TO PLANE/:/^NEXT/}).click();
 }
 await expect(page.getByRole('button',{name:/^PLAY/})).toBeVisible();
 await expect.poll(async()=>(await presentation()).crew).toBe(false);
 await page.screenshot({path:info.outputPath('menu.png')});
 await page.evaluate(()=>{(window as any).__arcadeCanvas=document.querySelector('canvas');});
 const loaded:string[]=[];page.on('request',r=>{if(/\.glb/.test(r.url()))loaded.push(r.url());});
 // Every round uses actual navigation, not direct audio API scene changes.
 for(let i=0;i<20;i++){
  await page.getByRole('button',{name:'SHOP',exact:true}).click();
  await page.getByRole('button',{name:'Next item'}).click();
  if(i===1){await expect.poll(()=>page.evaluate(()=>(window as any).__RUNWAY_LED_QA__.message)).toBe(8);await page.screenshot({path:info.outputPath('hangar.png')});}
  await page.getByRole('button',{name:'← BACK',exact:true}).click();
  expect((await music()).playing).toEqual(['menu']);
 }
 expect(loaded).toEqual([]);
 await page.evaluate(()=>{(window as any).__gestures=[];for(const name of ['pointerup','click'])document.addEventListener(name,e=>(window as any).__gestures.push([e.type,e.isTrusted,(e.target as HTMLElement).tagName,navigator.userActivation.isActive]),true);return(window as any).__RUNWAY_AUDIO_QA__.interrupt();});await page.locator('canvas').click({position:{x:200,y:220}});await page.waitForTimeout(500);console.log('AUDIO RECOVERY',await page.evaluate(()=>({events:(window as any).__gestures,status:(window as any).__RUNWAY_AUDIO_QA__.musicStatus()})));await expect.poll(async()=>(await music()).context).toBe('running');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(async()=>(await music()).playing).toEqual([]);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(async()=>(await music()).playing).toEqual(['menu']);
 expect(await page.evaluate(()=>document.querySelector('canvas')===(window as any).__arcadeCanvas)).toBe(true);
 await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();await expect.poll(async()=>(await presentation()).crew).toBe(true);
 await page.getByRole('button',{name:'CLOSE',exact:true}).click();await expect.poll(async()=>(await presentation()).crew).toBe(false);
 await page.getByRole('button',{name:'CREDITS',exact:true}).click();await expect(page.getByRole('dialog',{name:'Credits'})).toContainText('OpenStreetMap');await page.getByRole('button',{name:'BACK',exact:true}).click();
 await page.getByRole('button',{name:/^PLAY/}).click();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
 await expect.poll(async()=>(await music()).playing).toEqual(['game']);
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__?.state.tick>300);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect.poll(async()=>(await music()).playing).toEqual([]);await page.screenshot({path:info.outputPath('pause.png')});
 const offset=(await music()).offsets.game;await page.waitForTimeout(300);expect((await music()).offsets.game).toBe(offset);
 await page.getByRole('button',{name:'RESUME FLIGHT'}).click();await expect.poll(async()=>(await music()).playing).toEqual(['game']);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();
 await expect.poll(async()=>(await music()).playing).toEqual(['menu']);
 await page.reload();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});await expect(page.getByRole('dialog',{name:'How to play'})).toHaveCount(0);
 await page.locator('canvas').click({position:{x:200,y:220}});await expect.poll(async()=>(await music()).playing).toEqual(['menu']);
 expect(errors).toEqual([]);
});

test('complete physical flight, real settlement and return to the hangar',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Route QA',startupName:'Flight Lab',tutorialVersion:'routes-21'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(1079896713);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const path='/tests/test-pilot.ts';const {flyToJurere}=await import(path);(window as any).__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere((window as any).__RUNWAY_QA__.state);});
 for(const [time,name] of [[2,'exit'],[10,'freefall'],[26,'storm'],[40,'canopy']] as const){await page.waitForFunction(t=>(window as any).__RUNWAY_QA__.state.routeTime>=t,time);await page.screenshot({path:info.outputPath(`${name}.png`)});if(name==='canopy'){const fx=await page.evaluate(()=>(window as any).__RUNWAY_FX_QA__);expect(fx.samples).toBeGreaterThan(0);expect(fx.flare).toBe(1);expect(fx.sun[0]).toBeGreaterThan(0);expect(fx.sun[0]).toBeLessThan(1);expect(fx.sun[1]).toBeGreaterThan(0);expect(fx.sun[1]).toBeLessThan(1);}}
 await expect(page.getByRole('heading',{name:'RUN COMPLETE'})).toBeVisible({timeout:90000});await expect(page.locator('.closing-total>span')).toHaveText('FINAL MONEY');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.lastResult')!));expect(saved.state.result.destination).toBe('jurere');expect(saved.state.tick/60).toBeGreaterThan(48);expect(saved.state.tick/60).toBeLessThan(59);
 await expect(page.locator('.closing-total strong')).toHaveText(saved.state.result.cashFinal.toLocaleString('en-US'));expect(saved.renderStats.calls).toBeLessThanOrEqual(70);expect(saved.renderStats.triangles).toBeLessThanOrEqual(90000);
 await expect.poll(()=>page.evaluate(()=>(window as any).__RUNWAY_CANOPY_QA__.visible)).toBe(false);await page.screenshot({path:info.outputPath('results.png')});console.log('FLIGHT',info.project.name,JSON.stringify({seconds:saved.state.tick/60,cash:saved.state.cash,render:saved.renderStats}));
 await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();await expect(page.getByRole('button',{name:/^PLAY/})).toBeVisible();expect(errors).toEqual([]);
});

test('failed essential GLB can recover without reloading the page',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Recovery QA',startupName:'Flight Lab',tutorialVersion:'routes-21'})));
 let attempts=0;await page.route('**/runway-pilot.glb*',r=>++attempts===1?r.abort():r.continue());
 await page.goto('/?qa=1');await expect(page.getByText('Let’s reset.')).toBeVisible({timeout:30000});await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();
 await expect(page.locator('.scene-error')).toHaveCount(0);await expect(page.getByRole('button',{name:/^PLAY/})).toBeEnabled({timeout:30000});expect(attempts).toBeGreaterThan(1);
});

test('camera exit continuity, fullscreen framing and all twelve NFT accents',async({page},info)=>{
 await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Camera QA',startupName:'Flight Lab',tutorialVersion:'routes-21',community:100})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});
 await page.getByRole('button',{name:'SHOP',exact:true}).click();
 for(let i=0;i<perks.length;i++){if(i)await page.getByRole('button',{name:'Next item'}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__RUNWAY_LED_QA__.color)).toBe(perks[i].accent.slice(1).toLowerCase());}
 await page.getByRole('button',{name:'← BACK',exact:true}).click();
 await page.getByRole('button',{name:/^PLAY/}).click();
 await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 const samples:any[]=await page.evaluate(async()=>{const rows=[];for(let i=0;i<300;i++){if((window as any).__RUNWAY_QA__.state.routeTime>6.5)break;const c=(window as any).__RUNWAY_CAMERA_QA__;if(c)rows.push({...c,height:(window as any).__RUNWAY_PRESENTATION_QA__.heroHeight});await new Promise(r=>setTimeout(r,200));}return rows;});
 const distances=samples.map(s=>Math.hypot(...s.position.map((v:number,i:number)=>v-s.pilot[i])));
 expect(Math.max(...distances)).toBeLessThan(6.5);expect(samples.at(-1).pitch).toBeGreaterThan(64);expect(samples.at(-1).pitch).toBeLessThan(68);
 await page.evaluate(()=>{(window as any).__RUNWAY_QA__.paused=true;});
 const framing=[];
 for(const [width,height] of [[390,664],[393,852],[360,740],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(450);
  const value=await page.evaluate(()=>({height:(window as any).__RUNWAY_PRESENTATION_QA__.heroHeight,canvas:document.querySelector('canvas')!.getBoundingClientRect().toJSON(),...((window as any).__RUNWAY_CAMERA_QA__)}));
  expect(value.canvas.width).toBe(width);expect(value.canvas.height).toBe(height);framing.push({width,height,...value});
  await page.screenshot({path:info.outputPath(`flight-${width}x${height}.png`)});
 }
 const heights=framing.map(f=>f.height);expect(Math.max(...heights)-Math.min(...heights)).toBeLessThan(.03);
 console.log('CAMERA',info.project.name,JSON.stringify({distance:[Math.min(...distances),Math.max(...distances)],pitch:samples.at(-1).pitch,heights:framing.map(f=>f.height)}));
 await info.attach('camera-measurements',{body:JSON.stringify({samples,distances,framing},null,2),contentType:'application/json'});
});
