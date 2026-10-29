import {test,expect} from '@playwright/test';

test('shop: earned SOL, NPC, carousel, purchases, cosmetics and persistence',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:45000});
 await page.getByPlaceholder('Your founder name').fill('Shop QA');await page.getByPlaceholder('Your startup name').fill('Crew');await page.getByRole('button',{name:'LET’S GO'}).click();await page.getByRole('button',{name:'SKIP',exact:true}).click();
 await expect(page.locator('.home-bank')).toContainText('0');
 await page.screenshot({path:info.outputPath('menu-bank.png')});
 await page.getByRole('button',{name:'SHOP',exact:true}).click();await expect(page.getByRole('region',{name:'Pilot shop'})).toBeVisible();
 await page.evaluate(()=>{(window as any).shopCanvas=document.querySelector('canvas');});
 await page.waitForTimeout(1200);await page.screenshot({path:info.outputPath('shop-empty.png')});
 await page.getByRole('button',{name:'Next item'}).click();await expect(page.locator('.shop-item-title h2')).toHaveText('Horse');await expect(page.getByRole('button',{name:/BUY & EQUIP/})).toBeDisabled();
 // Credit finished deterministic replays, not fabricated wallet values. One duplicate must be ignored.
 const balance=await page.evaluate(async()=>{const a=performance.getEntriesByType('resource').find(e=>e.name.includes('/src/services/session.ts'))!.name,b='/src/core/simulation.ts',c='/tests/test-pilot.ts';const ses=await import(a),sim=await import(b),qa=await import(c);for(let i=0;i<5;i++){const s=sim.initialState(17+i);while(!s.result){const q=sim.decoded(sim.quantize(qa.flyRoute(s)));sim.step(s,q);sim.step(s,q);}await ses.complete(s,false,'shop-qa-'+i);await ses.complete(s,false,'shop-qa-'+i);}return ses.profile.shop.balance;});
 expect(balance).toBeGreaterThan(5000000);
 await page.getByRole('button',{name:'← BACK',exact:true}).click();await expect(page.locator('.home-bank')).toContainText(balance.toLocaleString('en-US'));await page.getByRole('button',{name:'SHOP',exact:true}).click();
 await page.getByRole('button',{name:'Next item'}).click();await page.getByRole('button',{name:/BUY & EQUIP/}).click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.profile')!).shop.balance)).toBe(balance-2000000);
 await page.screenshot({path:info.outputPath('shop-pilot.png')});
 await page.getByRole('button',{name:'PARACHUTES',exact:true}).click();await page.getByRole('button',{name:'Lagoon',exact:true}).click();await page.getByRole('button',{name:/BUY & EQUIP/}).click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');await page.waitForTimeout(500);await page.screenshot({path:info.outputPath('shop-canopy.png')});
 await page.getByRole('button',{name:'TRAILS',exact:true}).click();await page.getByRole('button',{name:'Violet',exact:true}).click();await page.getByRole('button',{name:/BUY & EQUIP/}).click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');await page.screenshot({path:info.outputPath('shop-trail.png')});
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.profile')!));expect(after.shop.balance).toBe(balance-4250000);expect(after.shop.canopy).toBe('canopy:lagoon');expect(after.shop.trail).toBe('trail:violet');expect(after.pilot).toBe(1);expect(after.shop.receipts).toHaveLength(5);expect(after.shop.owned).toContain('pilot:9');
 // Browsing and cancelling never equips or spends; no new canvas or repeated GLB downloads.
 const glbs:string[]=[];page.on('request',r=>{if(r.url().includes('.glb'))glbs.push(r.url());});await page.getByRole('button',{name:'PILOTS',exact:true}).click();const box=(await page.locator('.shop-carousel-control').boundingBox())!;await page.mouse.move(box.x+box.width*.65,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.25,box.y+box.height*.5,{steps:8});await page.mouse.up();await expect(page.locator('.shop-item-title h2')).toHaveText('Ape');await page.locator('.shop-carousel-control').focus();await page.keyboard.press('ArrowLeft');await expect(page.locator('.shop-item-title h2')).toHaveText('Horse');for(let i=0;i<20;i++)await page.getByRole('button',{name:'Next item'}).click();
 expect(await page.evaluate(()=>document.querySelector('canvas')===(window as any).shopCanvas)).toBe(true);expect(glbs).toEqual([]);await page.getByRole('button',{name:'← BACK',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.profile')!).pilot)).toBe(1);
 await page.reload();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});await expect(page.locator('.home-bank')).toContainText((balance-4250000).toLocaleString('en-US'));
 await page.getByRole('button',{name:'SHOP',exact:true}).click();await expect(page.locator('.shop-item-title h2')).toHaveText('Horse');
 for(const [width,height] of [[360,740],[844,390],[1440,900]]){await page.setViewportSize({width,height});await page.waitForTimeout(700);await page.screenshot({path:info.outputPath(`shop-${width}.png`)});const rect=await page.locator('.shop-buy').boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.y+rect!.height).toBeLessThanOrEqual(height);}
 expect(errors).toEqual([]);
 await info.attach('shop-transactions',{body:JSON.stringify({earned:balance,balance:after.shop.balance,owned:after.shop.owned,receipts:after.shop.receipts},null,2),contentType:'application/json'});
});


test('purchased canopy and trail render in a real flight; final money is banked once',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Flight QA',startupName:'Crew',tutorialVersion:'routes-21',pilot:1,shop:{version:1,balance:1250000,earned:5500000,owned:['pilot:0','pilot:1','canopy:sunrise','canopy:lagoon','trail:air','trail:violet'],receipts:['prior-purchase-fixture'],canopy:'canopy:lagoon',trail:'trail:violet'}}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(17);return a;}});});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
 await page.evaluate(async()=>{const path='/tests/test-pilot.ts';const {flyRoute}=await import(path);(window as any).__RUNWAY_CONTROLS_QA__.read=()=>flyRoute((window as any).__RUNWAY_QA__.state);});
 await page.waitForFunction(()=>(window as any).__RUNWAY_QA__.state.routeTime>40,null,{timeout:90000});
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 const materials=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('@react-three_fiber.js?'))!.name;const {_roots}=await import(url);const root:any=[..._roots.values()][0],scene=root.store.getState().scene,trail=scene.getObjectByName('pilot-cosmetic-trail'),canopy=scene.getObjectByName('pilot-canopy'),cloth:any[]=[];scene.traverse((o:any)=>{if(o.isSkinnedMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name.includes('Woven'))cloth.push(m.roughness);});return{trail:trail.material.color.getHexString(),count:trail.count,canopy:canopy.geometry.attributes.color.array.slice(0,3),cloth};});
 expect(materials.trail).toBe('bc83ff');expect(materials.count).toBeGreaterThan(0);expect(materials.canopy[1]).toBeGreaterThan(materials.canopy[0]);expect(materials.cloth.every(x=>x===.48)).toBe(true);
 await page.getByRole('button',{name:'RESUME FLIGHT'}).click();await expect(page.getByRole('heading',{name:'PAUSED.'})).toBeHidden();await page.waitForTimeout(350);await page.screenshot({path:info.outputPath('equipped-flight.png')});
 await expect(page.getByRole('heading',{name:'RUN COMPLETE'})).toBeVisible({timeout:65000});await expect(page.locator('.closing-total>span')).toHaveText('FINAL MONEY');
 const saved=await page.evaluate(()=>({profile:JSON.parse(localStorage.getItem('runway.profile')!),last:JSON.parse(localStorage.getItem('runway.lastResult')!)}));expect(saved.profile.shop.balance).toBe(1250000+saved.last.state.result.cashFinal);expect(saved.profile.shop.receipts).toHaveLength(2);expect(saved.last.renderStats.calls).toBeLessThanOrEqual(70);expect(saved.last.renderStats.triangles).toBeLessThanOrEqual(90000);
 await page.screenshot({path:info.outputPath('banked-results.png')});await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();await expect(page.locator('.home-bank')).toContainText(saved.profile.shop.balance.toLocaleString('en-US'));expect(errors).toEqual([]);
 await info.attach('equipped-flight',{body:JSON.stringify({cash:saved.last.state.result.cashFinal,balance:saved.profile.shop.balance,render:saved.last.renderStats,materials},null,2),contentType:'application/json'});
});

test('duplicate purchase and denied storage cannot double-spend or equip an unowned pilot',async({page})=>{
 await page.route('**/api/**',r=>r.abort());await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,tutorialVersion:'routes-21',shop:{version:1,balance:4000000,earned:4000000,owned:['pilot:0','canopy:sunrise','trail:air'],receipts:[],canopy:'canopy:sunrise',trail:'trail:air'}})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:30000});
 const result=await page.evaluate(async()=>{const path=performance.getEntriesByType('resource').find(e=>e.name.includes('/src/services/session.ts'))!.name;const s=await import(path);await Promise.all([s.transactShop('pilot:1',true),s.transactShop('pilot:1',true)]);const before=JSON.stringify(s.profile);let denied='';try{await s.transactShop('pilot:4',false);}catch(e){denied=(e as Error).message;}const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('Quota exceeded');};let failure='';try{await s.transactShop('canopy:lagoon',true);}catch(e){failure=(e as Error).message;}finally{Storage.prototype.setItem=original;}return{balance:s.profile.shop.balance,unchanged:before===JSON.stringify(s.profile),failure,denied,persisted:JSON.parse(localStorage.getItem('runway.profile')!).shop.balance};});
 expect(result.balance).toBe(2000000);expect(result.persisted).toBe(2000000);expect(result.unchanged).toBe(true);expect(result.failure).toContain('has not been spent');expect(result.denied).toContain('Unlock');
});
