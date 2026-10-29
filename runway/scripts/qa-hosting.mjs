// Tests the extracted production ZIP, never a development server or live API.
import {chromium,webkit,devices,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='http://127.0.0.1:5191',out='../entregas/qa',base=origin+'/islanddao/';
await mkdir(out,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit'])for(const format of ['mobile','desktop']){
 const name=engine+'-'+format;if(process.argv[2]&&name!==process.argv[2])continue;const browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'?{args:['--use-angle=metal','--enable-webgl']}:{});
 const context=await browser.newContext({...format==='mobile'?devices[engine==='webkit'?'iPhone 13':'Pixel 7']:{viewport:{width:1440,height:900}},recordVideo:{dir:out+'/'+name}});
 const page=await context.newPage(),errors=[],badResources=[],requests=new Set(),external=[],checks=[];
 let mode='normal',apiRequests=0;
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)badResources.push([r.status(),r.url()]);});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin===origin){requests.add(u.pathname);if(!u.pathname.startsWith('/islanddao/'))badResources.push(['base',u.pathname]);return route.continue();}
  if(u.origin!=='https://runway-api.agenciahumanfriendly.chatgpt.site'){external.push(u.href);return route.abort();}
  apiRequests++;const path=u.pathname.slice(5),headers={'access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
  let body={};if(path==='guest')body={id:'package-qa',token:'mock',nickname:'Package QA'};
  if(path==='tickets')body={id:'mock-ticket',seed:17,rules:'runway-3.2.0-chains',content:'island-routes-10',expires:Date.now()+3600000};
  if(path==='leaderboard'){if(mode==='error')return route.fulfill({status:503,headers,contentType:'application/json',body:'{}'});body={rows:[],leaders:{ceo:null,startup:null},own:null,total:0,nextOffset:null,serverNow:Date.now()};}
  if(path==='startups')body={startup:{id:'mock-startup',name:'QA Crew',code:'ABCDEF1234',locked:1},members:[{player_id:'package-qa',nickname:'Package QA',score:10000,runs:1}]};
  return route.fulfill({headers,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.addInitScript(()=>{
  localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Package QA',tutorialVersion:'npc-26',shopIntroSeen:true,control:'touch',controlVersion:'rush-19',muted:false,musicMuted:false}));
  window.audioAudit={decoded:0,failed:[],started:0};
  const decode=BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData=function(...args){return decode.apply(this,args).then(b=>{window.audioAudit.decoded++;return b;},e=>{window.audioAudit.failed.push(e.message);throw e;});};
  const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){window.audioAudit.started++;return start.apply(this,args);};
  Object.defineProperty(navigator,'share',{value:async data=>{window.sharedURL=data.url;},configurable:true});
 });
 try{
  await page.goto(base);await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await expect(page.getByRole('button',{name:'PLAY',exact:true})).toBeEnabled();
  expect(await page.evaluate(()=>!!window.__RUNWAY_QA__)).toBe(false);
  await page.screenshot({path:out+'/'+name+'-menu.png'});checks.push('production boot/menu');
  await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();await expect(page.getByRole('dialog',{name:'How to play'})).toBeVisible();await page.waitForTimeout(1200);await page.getByRole('button',{name:'CLOSE',exact:true}).click();checks.push('tutorial');
  await page.getByRole('button',{name:'SHOP',exact:true}).click();await expect(page.getByRole('region',{name:'Pilot shop'})).toBeVisible();
  for(const label of ['PARACHUTES','TRAILS','PILOTS'])await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:'Next item',exact:true}).click();await page.screenshot({path:out+'/'+name+'-shop.png'});await page.locator('.shop-header .back').click();checks.push('shop/models/categories');
  await page.getByRole('button',{name:'MY STARTUP',exact:true}).click();await page.getByRole('button',{name:'INVITE',exact:true}).click();await expect(page.getByLabel('INVITATION LINK')).toHaveValue('https://humanfriendly.global/islanddao/?join=ABCDEF1234');expect(await page.evaluate(()=>window.sharedURL)).toBe('https://humanfriendly.global/islanddao/?join=ABCDEF1234');
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedURL=text},configurable:true});});await page.getByRole('button',{name:'INVITE',exact:true}).click();expect(await page.evaluate(()=>window.copiedURL)).toBe('https://humanfriendly.global/islanddao/?join=ABCDEF1234');checks.push('canonical share/copy invitation');
  await page.goto(base+'?join=ABCDEF1234');await page.reload();await expect(page.getByRole('heading',{name:'STARTUP',exact:true})).toBeVisible();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});await page.locator('.startup-screen>.panel-navigation button').click();checks.push('query reload');
  await page.getByRole('button',{name:'RANKINGS',exact:true}).click();await expect(page.locator('.dao-table-section')).toContainText('No entries yet');await page.getByRole('button',{name:'STARTUP',exact:true}).click();await expect(page.locator('.dao-table-section')).toContainText('No entries yet');await page.locator('.dao-screen>.panel-navigation button').click();mode='error';await page.getByRole('button',{name:'RANKINGS',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Ranking connection unavailable');await page.locator('.dao-screen>.panel-navigation button').click();mode='normal';checks.push('API fixtures: startup/ranking/empty/error');
  await page.getByRole('button',{name:'PLAY',exact:true}).click();await expect(page.locator('.in-flight')).toBeVisible();await page.waitForTimeout(6500);await page.screenshot({path:out+'/'+name+'-flight.png'});
  await expect(page.getByRole('region',{name:'Flight results'})).toBeVisible({timeout:130000});await page.waitForTimeout(2600);await page.screenshot({path:out+'/'+name+'-results.png'});
  const lastResult=await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.lastResult'))?.state?.result);
  checks.push('real-time run/results ('+lastResult?.outcome+')');
  await page.getByRole('button',{name:'ONE MORE RUN',exact:true}).click();await expect(page.locator('.in-flight')).toBeVisible();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'BACK TO PLANE',exact:true}).click();await expect(page.getByRole('button',{name:'PLAY',exact:true})).toBeEnabled();await page.waitForTimeout(1000);checks.push('retry/pause/return');
  const audio=await page.evaluate(()=>window.audioAudit);expect(audio.decoded).toBeGreaterThan(60);expect(audio.started).toBeGreaterThan(0);expect(audio.failed).toEqual([]);checks.push('audio files decoded and buffer playback after gesture');
  const fonts=await page.evaluate(()=>document.fonts.ready.then(()=>['Rajdhani','Space'].map(f=>document.fonts.check('16px '+f))));expect(fonts).toEqual([true,true]);
  const legal=await page.request.get(base+'licenses.txt');expect(legal.ok()).toBe(true);expect(await legal.text()).toContain('OpenStreetMap');checks.push('fonts/licenses');
  expect([...requests].filter(p=>p.endsWith('.glb'))).toHaveLength(5);expect([...requests].filter(p=>p.includes('/perks/'))).toHaveLength(12);expect(badResources).toEqual([]);expect(errors).toEqual([]);expect(external).toEqual([]);
  results.push({name,passed:true,checks,audio,lastResult,apiRequests,resourceCount:requests.size,errors,badResources,external});console.log(name,'PASS',checks);
 }catch(e){await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});results.push({name,passed:false,checks,error:String(e),errors,badResources,external});console.error(name,String(e));}
 finally{await context.close();await browser.close();await writeFile(out+(process.argv[2]?'/'+process.argv[2]+'-recheck.json':'/browser-results.json'),JSON.stringify(results,null,2));}
}
const bytes=await readFile('../entregas/RUNWAY-ISLANDDAO-PRODUCTION.zip');await writeFile(out+'/archive-tested.json',JSON.stringify({sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,base,date:new Date().toISOString()},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
