import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{if(!localStorage.getItem('runway.profile'))localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Shop Review',startupName:'Island Studio',tutorialVersion:'npc-26',shopIntroSeen:true,control:'touch',controlVersion:'rush-19',shop:{version:1,balance:60000000,earned:60000000,owned:['pilot:0','pilot:1','canopy:sunrise','trail:air'],receipts:['legacy-run'],canopy:'canopy:sunrise',trail:'trail:air'}}));});
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:'SHOP',exact:true}).click();await page.waitForTimeout(1500);
}
async function category(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();}
async function saved(page:Page){return page.evaluate(()=>JSON.parse(localStorage.getItem('runway.profile')!));}
async function buy(page:Page,cat:string,name:string){await category(page,cat);await page.getByRole('button',{name,exact:true}).click();await page.locator('.shop-buy').click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');}

test('catalog layouts and live preview in all categories, mobile and desktop',async({page},info)=>{
 const errors:string[]=[],obsolete:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/previews/'))obsolete.push(r.url());});await setup(page);
 const metrics:any[]=[];
 for(const [width,height]of [[390,844],[360,640],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const cat of ['PILOTS','ACCESSORIES','PARACHUTES','TRAILS','HELMET']){
   await category(page,cat);await page.waitForTimeout(700);
   if(cat==='TRAILS')await page.getByRole('button',{name:'Golden Stars',exact:true}).click();
   if(cat==='HELMET')await page.getByRole('button',{name:'Gold Circuit',exact:true}).click();
   if(cat==='PARACHUTES')await page.getByRole('button',{name:'Racing Checker',exact:true}).click();
   await page.waitForTimeout(500);
   for(const selector of ['.shop-header','.shop-buy','.shop-detail','.shop-catalog','.shop-preview']){const b=await page.locator(selector).boundingBox();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.y).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(width+1);expect(b!.y+b!.height).toBeLessThanOrEqual(height+1);}
   expect(await page.locator('.shop-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBeGreaterThanOrEqual(2);
   expect(await page.locator('select').count()).toBe(0);
   const art=await page.locator('.shop-product-art').first().boundingBox();expect(art!.height).toBeGreaterThan(90);expect(Math.abs(art!.width-art!.height)).toBeLessThan(2);
   const price=await page.locator('.shop-price').boundingBox(),buy=await page.locator('.shop-buy').boundingBox();expect(price!.x+price!.width).toBeLessThan(buy!.x);
   const preview=await page.evaluate(()=>{const q=(window as any).__RUNWAY_SCENE_QA__,group=q.scene.getObjectByName('shop-carousel'),actor=group.getObjectByName('shop-preview-actor');return{actors:group.children.filter((c:any)=>c.name==='shop-preview-actor').length,scale:actor.scale.toArray(),yaw:actor.rotation.y,render:{...q.renderer.info.render},memory:{...q.renderer.info.memory}};});expect(preview.actors).toBe(1);expect(preview.scale).toEqual([.9,.9,.9]);metrics.push({width,cat,...preview});
   await page.screenshot({path:info.outputPath(`${width}-${cat}.png`)});
  }
 }
 expect(errors).toEqual([]);expect(obsolete).toEqual([]);await info.attach('preview-metrics',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
});

test('buy/equip, compatibility, insufficient funds, fixed actions and persistence',async({page},info)=>{
 await setup(page);const bounds=()=>page.locator('.shop-buy').boundingBox(),before=await bounds();
 await buy(page,'ACCESSORIES','Ninja');expect(await bounds()).toEqual(before);
 await page.getByRole('button',{name:'Accessories for Horse',exact:true}).click();await buy(page,'ACCESSORIES','Sun Glasses');
 await page.getByRole('button',{name:'Accessories for Ape',exact:true}).click();await page.getByRole('button',{name:'King Crown',exact:true}).click();await expect(page.locator('.shop-buy')).toHaveText('OWN PILOT FIRST');await expect(page.locator('.shop-buy')).toBeDisabled();
 await buy(page,'HELMET','Gold Circuit');await buy(page,'TRAILS','Bubbles');await buy(page,'PARACHUTES','Racing Checker');expect(await bounds()).toEqual(before);
 let a=await saved(page);expect(a.shop.balance).toBe(33000000);expect(a.shop.accessories).toMatchObject({'0':'accessory:dragon-ninja','1':'accessory:horse-sun-glasses'});
 await category(page,'PILOTS');await page.getByRole('button',{name:'Horse',exact:true}).click();await page.locator('.shop-buy').click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');expect((await saved(page)).shop.balance).toBe(33000000);
 await page.reload();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.getByRole('button',{name:'SHOP',exact:true}).click();await category(page,'ACCESSORIES');await expect(page.locator('.shop-item-title h2')).toHaveText('Sun Glasses');
 await page.getByRole('button',{name:'No accessory',exact:true}).click();await page.locator('.shop-buy').click();expect((await saved(page)).shop.accessories['1']).toBe('');
 await buy(page,'PARACHUTES','Aurora');await buy(page,'TRAILS','Comet');await category(page,'HELMET');await page.getByRole('button',{name:'Aurora',exact:true}).click();await expect(page.locator('.shop-buy')).toHaveText('INSUFFICIENT FUNDS');expect((await saved(page)).shop.balance).toBe(3000000);await page.screenshot({path:info.outputPath('insufficient-funds.png')});
 await category(page,'PILOTS');await page.locator('.shop-grid').evaluate(el=>el.scrollTop=el.scrollHeight);await expect(page.locator('.shop-header .back')).toBeInViewport();
 await page.getByRole('button',{name:'SHOP GUIDE',exact:true}).click();await expect(page.locator('.shop-npc')).toBeVisible();await page.getByRole('button',{name:'READ',exact:true}).click();await page.getByRole('button',{name:'LET’S SEE THE GEAR',exact:true}).click();await expect(page.locator('.shop-npc')).toHaveCount(0);
});


test('every original portrait loads, every finish has dedicated catalog art, stable canvas',async({page},info)=>{
 await setup(page);await page.evaluate(()=>{(window as any).shopCanvas=document.querySelector('canvas');});
 await category(page,'ACCESSORIES');
 const filters=page.locator('.shop-pilot-filter button'),count=await filters.count();expect(count).toBe(12);let accessories=0;
 for(let i=0;i<count;i++){
  await filters.nth(i).click();
  accessories+=await page.locator('.shop-product').count()-1;
  const loaded=await page.locator('.catalog-portrait').evaluateAll(async nodes=>{return Promise.all(nodes.map(async node=>{const img=node as HTMLImageElement;img.loading='eager';try{await img.decode();return img.naturalWidth>0;}catch{return false;}}));});expect(loaded.every(Boolean)).toBe(true);
 }
 expect(accessories).toBe(94);
 for(const [cat,n]of [['PILOTS',12],['PARACHUTES',12],['TRAILS',10],['HELMET',9]] as const){await category(page,cat);expect(await page.locator('.shop-product').count()).toBe(n);if(cat!=='PILOTS')expect(await page.locator('.shop-product svg.catalog-art').count()).toBe(n);}
 expect(await page.evaluate(()=>document.querySelector('canvas')===(window as any).shopCanvas)).toBe(true);
 // Contact sheets use exactly the catalog component, not gameplay screenshots.
 await page.evaluate(async()=>{
  const react='/node_modules/.vite/deps/react.js',dom='/node_modules/.vite/deps/react-dom_client.js',catalog='/src/shopCatalog.ts',icons='/src/ui/CatalogIcon.tsx';
  const [reactModule,domModule,{shopItems},{CatalogIcon}]=await Promise.all([import(react),import(dom),import(catalog),import(icons)]);
  const h=(reactModule.default??reactModule).createElement,createRoot=(domModule.default??domModule).createRoot;
  const host=document.createElement('div');host.id='catalog-proof';host.style.cssText='position:fixed;inset:0;z-index:9999;background:#041b2d;overflow:auto;';document.body.append(host);(window as any).catalogProof={h,createRoot,shopItems,CatalogIcon,host};
 });
 for(const cat of ['pilot','accessory','canopy','trail','helmet']){
  await page.evaluate(cat=>{const q=(window as any).catalogProof;q.root??=q.createRoot(q.host);q.root.render(q.h('div',{id:'catalog-sheet',style:{display:'grid',gridTemplateColumns:'repeat(6,156px)',gap:10,padding:20,width:1026,background:'#041b2d'}},q.shopItems.filter((i:any)=>i.category===cat).map((item:any)=>q.h('div',{key:item.id,style:{background:'#10344c',padding:6,color:'white'}},q.h('div',{className:'shop-product-art',style:{width:144,height:144}},q.h(q.CatalogIcon,{item})),q.h('div',{style:{font:'700 18px Rajdhani',height:44,paddingTop:8}},item.name)))));},cat);
  await page.setViewportSize({width:1100,height:1000});await page.waitForTimeout(200);
  await page.locator('#catalog-sheet img').evaluateAll(async nodes=>{await Promise.all(nodes.map(async node=>{const img=node as HTMLImageElement;img.loading='eager';await img.decode();}));});
  await page.locator('#catalog-sheet').screenshot({path:info.outputPath('catalog-'+cat+'.png')});
 }
});


test('legacy rim toggle stays clear of product copy and shop returns to cabin',async({page},info)=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/services/session.ts',s=await import(path);s.profile.rares=[0];s.persist();});
 await category(page,'HELMET');await page.getByRole('button',{name:'Gold Circuit',exact:true}).click();
 const toggle=await page.locator('.shop-pattern').boundingBox(),detail=await page.locator('.shop-detail').boundingBox();expect(toggle!.y+toggle!.height).toBeLessThan(detail!.y);
 await page.locator('.shop-pattern').click();await expect(page.locator('.shop-pattern')).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:info.outputPath('legacy-helmet.png')});await page.locator('.shop-header .back').click();await expect(page.locator('.shop-screen')).toHaveCount(0);await expect(page.getByRole('button',{name:/^PLAY/})).toBeVisible();await page.waitForTimeout(1000);await page.screenshot({path:info.outputPath('back-to-plane.png')});
});
