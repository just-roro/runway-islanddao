// Production smoke test for both build bases. No requests reach the live API.
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit,devices,expect} from '@playwright/test';
const origin='http://127.0.0.1:5193',results=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.txt':'text/plain'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,origin).pathname),sub=pathname.startsWith('/islanddao/'),root=resolve(sub?'/tmp/runway-cosmetics-subpath':'dist'),relative=pathname.slice(sub?11:1),file=resolve(root,relative||'index.html');if(!file.startsWith(root+'/'))throw Error('path');const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(5193,'127.0.0.1',r));
try{for(const engine of ['chromium','webkit'])for(const base of ['/','/islanddao/']){
 const browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'?{args:['--use-angle=metal','--enable-webgl']}:{}),context=await browser.newContext({...devices['iPhone 13']}),page=await context.newPage(),errors=[],bad=[],requests=new Set();
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin||url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{}'});requests.add(url.pathname);if(!url.pathname.startsWith(base))bad.push(url.pathname);return route.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&!r.url().includes('/api/')&&r.status()>=400)bad.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Build QA',tutorialVersion:'npc-26',shopIntroSeen:true,control:'touch',controlVersion:'rush-19',shop:{version:1,balance:60000000,earned:60000000,owned:['pilot:0','canopy:sunrise','trail:air'],receipts:[],canopy:'canopy:sunrise',trail:'trail:air'}})));
 try{await page.goto(origin+base);await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});expect(await page.evaluate(()=>!!window.__RUNWAY_SCENE_QA__)).toBe(false);await page.getByRole('button',{name:'SHOP',exact:true}).click();
  for(const [category,name]of [['ACCESSORIES','Halo'],['PARACHUTES','Aurora'],['TRAILS','Bubbles'],['HELMET','Gold Circuit']]){await page.getByRole('button',{name:category,exact:true}).click();await page.getByRole('button',{name,exact:true}).click();await page.locator('.shop-buy').click();await expect(page.locator('.shop-buy')).toHaveText('EQUIPPED');await page.waitForTimeout(300);}
  const account=await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.profile')).shop);expect(account.balance).toBe(10000000);expect(account.helmet).toBe('helmet:circuit');
  await page.screenshot({path:`reports/cosmetics42/${engine}-${base==='/'?'root':'subpath'}-production.png`});
  for(const path of ['assets/cosmetics/dragon-halo.png','assets/cosmetics/previews/canopy-aurora.png','licenses.txt'])expect((await page.request.get(origin+base+path)).ok()).toBe(true);
  expect(errors).toEqual([]);expect(bad).toEqual([]);results.push({engine,base,passed:true,resources:requests.size,errors,bad});
 }catch(e){results.push({engine,base,passed:false,error:String(e),errors,bad});}finally{await context.close();await browser.close();}
}}finally{server.close();await writeFile('reports/cosmetics42/production-results.json',JSON.stringify(results,null,2));}
console.log(results);if(results.some(r=>!r.passed))process.exitCode=1;
