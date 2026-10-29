import {test,expect} from '@playwright/test';
test('reflective suit, persistent helmet, articulated shoulders and complete flight',async({page},info)=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram/i.test(m.text()))errors.push(m.text());});await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Graphics QA',startupName:'Runway',tutorialVersion:'npc-26'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});
 const before=await page.evaluate(()=>{const q=(window as any).__RUNWAY_SCENE_QA__,m=q.scene.getObjectByName('pilot-body').getObjectByName('pilot-led-helmet').material;return{phase:m.uniforms.time.value,id:m.uuid};});
 await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const {flyToJurere}=await import('/tests/test-pilot.ts' as string);(window as any).__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere((window as any).__RUNWAY_QA__.state);});
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.state.routeTime>7);
 await page.evaluate(()=>(window as any).__RUNWAY_QA__.paused=true);await page.waitForTimeout(100);
 const effective=await page.evaluate(()=>{const q=(window as any).__RUNWAY_SCENE_QA__,hero=q.scene.getObjectByName('pilot-body'),head=hero.getObjectByName('pilot-led-helmet').material,materials:any[]=[];hero.traverse((o:any)=>{if(o.isSkinnedMesh){const m=o.material,props=q.renderer.properties.get(m);materials.push({name:m.name,type:m.type,roughness:m.roughness,clearcoat:m.clearcoat,physical:m.defines?.PHYSICAL==='',env:!!props.envMap,blended:!!props.uniforms?.runwaySky,intensity:props.uniforms?.envMapIntensity?.value});}});return{phase:head.uniforms.time.value,id:head.uuid,materials};});
 expect(effective.id).toBe(before.id);expect(effective.phase).toBeGreaterThan(before.phase);expect(effective.materials).toHaveLength(3);expect(effective.materials.every(m=>m.env&&m.blended&&m.intensity>0)).toBe(true);expect(effective.materials.find(m=>m.name.includes('Woven')).clearcoat).toBe(.48);expect(effective.materials.find(m=>m.name.includes('Woven')).physical).toBe(true);
 await page.screenshot({path:info.outputPath('reflective-flight.png')});
 // Controlled A/B at the exact same simulation tick and camera: remove only IBL.
 await page.evaluate(()=>{const hero=(window as any).__RUNWAY_SCENE_QA__.scene.getObjectByName('pilot-body');hero.traverse((o:any)=>{if(o.isSkinnedMesh){o.material.userData.savedIntensity=o.material.envMapIntensity;o.material.envMapIntensity=0;}});});await page.waitForTimeout(150);await page.screenshot({path:info.outputPath('body-ibl-disabled.png')});
 await page.evaluate(()=>{const hero=(window as any).__RUNWAY_SCENE_QA__.scene.getObjectByName('pilot-body');hero.traverse((o:any)=>{if(o.isSkinnedMesh)o.material.envMapIntensity=o.material.userData.savedIntensity;});});await page.waitForTimeout(150);
 const pausePhase=await page.evaluate(()=>(window as any).__RUNWAY_LED_QA__.phase);await page.waitForTimeout(250);expect(await page.evaluate(()=>(window as any).__RUNWAY_LED_QA__.phase)).toBe(pausePhase);
 await page.evaluate(()=>(window as any).__RUNWAY_QA__.paused=false);
 const timing=await page.evaluate(async()=>{const m=await import('/src/core/simulation.ts' as string);return m.TIMING;});
 for(const [label,t] of [['deployment',timing.cloud+.5],['glide',timing.glide+1]] as const){await page.waitForFunction(t=>(window as any).__RUNWAY_QA__.state.routeTime>=t,t);await page.screenshot({path:info.outputPath(label+'.png')});}
 await expect(page.getByRole('heading',{name:'Welcome to Floripa. Landed.',exact:true})).toBeVisible({timeout:90000});await page.waitForTimeout(2500);await page.screenshot({path:info.outputPath('landed.png')});
 const result=await page.evaluate(()=>{const r=(window as any).__RUNWAY_QA__;return{result:r.state.result,tick:r.state.tick,stats:r.renderStats,fps:r.renderFps};});expect(result.result.cashFinal).toBe(1755000);expect(result.result.destination).toBe('jurere');expect(result.stats.calls).toBeLessThanOrEqual(70);expect(result.stats.triangles).toBeLessThanOrEqual(90000);expect(errors).toEqual([]);
 await info.attach('graphics-evidence',{body:JSON.stringify({before,effective,...result,errors},null,2),contentType:'application/json'});console.log('ART33',JSON.stringify({before,effective,...result,errors}));
});
