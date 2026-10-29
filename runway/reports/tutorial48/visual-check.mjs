// Focused renderer fixtures; collection is tested separately with real seeded inputs.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-webgl']});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'QA',startupName:'QA',tutorialVersion:'npc-26',musicMuted:true,muted:true,control:'touch'})));
await page.goto(process.env.RUNWAY_BASE_URL??'http://127.0.0.1:5183/?qa=1');await page.waitForSelector('.how-to-play',{timeout:60000});await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.waitForFunction(()=>window.__RUNWAY_QA__);
const observations=[];
for(const kind of ['community','term','magnet']){
 const data=await page.evaluate(async kind=>{const sim=await import('/src/core/simulation.ts'),pres=await import('/src/services/presentation.ts'),r=window.__RUNWAY_QA__;r.state=sim.initialState(17);const o=r.state.objects.find(o=>o.kind===kind),t=o.t-.45;Object.assign(r.state,{tick:Math.round(t*60),routeTime:t,phase:'drop',verticalSpeed:-sim.FALL_SPEED,x:o.x,y:o.y,altitude:sim.altitudeAt(t)});r.presentation=pres.createPresentation();pres.updatePresentation(r.presentation,r.state,0);r.paused=false;r.reported=true;return{kind,object:o,time:t};},kind);
 await page.waitForTimeout(1800);await page.screenshot({path:`reports/tutorial48/captures/pickup-${kind}.png`});data.rendered=await page.evaluate(kind=>window.__RUNWAY_SCENE_QA__.scene.getObjectByName('course-'+kind).count,kind);observations.push(data);
}
await page.evaluate(async()=>{const sim=await import('/src/core/simulation.ts'),r=window.__RUNWAY_QA__;r.state.routeTime=18;r.presentation.route=18;const top=sim.altitudeAt(sim.CLOUD_DECK.enter);window.__RUNWAY_ENV_VIEW__={position:[125,top+45,sim.START_Z+110],target:[0,top-110,sim.START_Z]};});await page.waitForTimeout(1500);await page.screenshot({path:'reports/tutorial48/captures/storm-bank-detail.png'});
writeFileSync('reports/tutorial48/visual-fixtures.json',JSON.stringify(observations,null,2));await browser.close();
