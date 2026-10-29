import {chromium,webkit,devices} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const browserName=process.argv[2]||'chromium',makeThumbs=process.argv.includes('--thumbnails');
const browser=await ({chromium,webkit}[browserName]).launch(browserName==='chromium'?{args:['--use-angle=metal','--enable-webgl']}:{});
const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},recordVideo:{dir:`reports/cosmetics42/${browserName}-video`,size:{width:390,height:844}}});
await context.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|THREE/.test(m.text()))errors.push(m.text());});
await page.addInitScript(()=>{if(!localStorage.getItem('runway.profile'))localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Cosmetics QA',startupName:'Island Studio',shopIntroSeen:true,tutorialVersion:'npc-26',control:'touch',controlVersion:'rush-19',shop:{version:1,balance:2000000000,earned:2000000000,owned:[...Array.from({length:12},(_,i)=>'pilot:'+i),'canopy:sunrise','trail:air'],receipts:[],canopy:'canopy:sunrise',trail:'trail:air'}}));});
await page.goto('http://127.0.0.1:5180/?qa=1');await page.locator('#runway-boot').waitFor({state:'detached',timeout:60000});await page.getByRole('button',{name:'SHOP',exact:true}).click();await page.waitForTimeout(1500);
const catalog=await page.evaluate(async()=>{const path='/src/shopCatalog.ts';return (await import(path)).shopItems;});
mkdirSync('public/assets/cosmetics/previews',{recursive:true});mkdirSync(`reports/cosmetics42/${browserName}`,{recursive:true});
const metrics=[];
for(const [category,label] of [['canopy','PARACHUTES'],['trail','TRAILS'],['helmet','HELMET']]){
 await page.getByRole('button',{name:label,exact:true}).click();
 for(const item of catalog.filter(i=>i.category===category)){
  await page.getByRole('button',{name:item.name,exact:true}).click();await page.waitForTimeout(650);
  if(makeThumbs){const b=await page.locator('.shop-carousel-control').boundingBox();await page.screenshot({path:`public/assets/cosmetics/previews/${item.id.replace(':','-')}.png`,clip:{x:b.x+55,y:b.y,width:b.width-110,height:b.height}});}
  if(item.tier==='premium'||item.pattern==='bubbles'||item.pattern==='stars')await page.screenshot({path:`reports/cosmetics42/${browserName}/${item.id.replace(':','-')}.png`});
  const detail=await page.evaluate(async()=>{const w=window,root=w.__RUNWAY_SCENE_QA__,trail=root.scene.getObjectByName('shop-carousel')?.getObjectByName('pilot-cosmetic-trail');return {calls:root.renderer.info.render.calls,triangles:root.renderer.info.render.triangles,textures:root.renderer.info.memory.textures,particles:trail?.count,shape:trail?.material.uniforms.shapeMode.value,led:w.__RUNWAY_LED_QA__};});metrics.push({id:item.id,...detail});
 }
 console.log(browserName,category,'rendered');
}
if(makeThumbs)execFileSync(process.env.RUNWAY_PYTHON||'/Users/nacho/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',['-c',"from PIL import Image;from pathlib import Path;\nfor p in Path('public/assets/cosmetics/previews').glob('*.png'):\n im=Image.open(p);im.thumbnail((192,192),Image.Resampling.LANCZOS);im.save(p,optimize=True)"]);
await page.getByRole('button',{name:'ACCESSORIES',exact:true}).click();
for(let pilot=0;pilot<12;pilot++){
 await page.getByLabel('Accessory pilot').selectOption(String(pilot));
 for(const item of catalog.filter(i=>i.category==='accessory'&&i.pilot===pilot)){
  await page.getByRole('button',{name:item.name,exact:true}).click();await page.waitForFunction(expected=>window.__RUNWAY_LED_QA__?.accessory===expected&&window.__RUNWAY_LED_QA__?.portrait?.includes(expected.split(':')[1]+'.png'),item.id,{timeout:10000});
  if(item.tier==='basic'){await page.locator('.shop-buy').click();await page.waitForTimeout(500);await page.screenshot({path:`reports/cosmetics42/${browserName}/pilot-${pilot}.png`});}
 }
 console.log(browserName,'pilot',pilot,'all accessories rendered');
}
await page.getByRole('button',{name:'TRAILS',exact:true}).click();await page.getByRole('button',{name:'Cloud Mist',exact:true}).click();
const frames=await page.evaluate(async()=>{let last=performance.now();const dt=[];for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const now=performance.now();dt.push(now-last);last=now;}dt.sort((a,b)=>a-b);const r=window.__RUNWAY_SCENE_QA__.renderer;return{median:dt[90],p95:dt[171],render:r.info.render,memory:r.info.memory};});
writeFileSync(`reports/cosmetics42/${browserName}-render.json`,JSON.stringify({errors,metrics,smoke:frames},null,2));
await context.close();await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log(browserName,'verified',metrics.length,'finishes + 94 accessories',frames);
