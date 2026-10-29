import {webkit,devices} from 'playwright';
import fs from 'node:fs/promises';
const out='reports/evidence/art33/coating';await fs.mkdir(out,{recursive:true});const b=await webkit.launch(),p=await b.newPage(devices['iPhone 13']);
await p.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await p.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Coating QA',startupName:'Runway',tutorialVersion:'npc-26'})));
await p.goto('http://127.0.0.1:5183/?qa=1');await p.waitForSelector('#runway-boot',{state:'detached',timeout:60000});await p.getByRole('button',{name:/^PLAY/}).click();await p.waitForFunction(()=>window.__RUNWAY_QA__?.state.routeTime>7);await p.evaluate(()=>window.__RUNWAY_QA__.paused=true);await p.waitForTimeout(300);await p.screenshot({path:out+'/coated.png'});
await p.evaluate(()=>window.__RUNWAY_SCENE_QA__.scene.getObjectByName('pilot-body').traverse(o=>{if(o.isSkinnedMesh&&o.material.name==='Woven flight suit')o.material.clearcoat=0;}));await p.waitForTimeout(400);await p.screenshot({path:out+'/uncoated.png'});
await fs.writeFile(out+'/probe.json',JSON.stringify({changed:'Only Woven flight suit.clearcoat: 0.48 -> 0. Same tick, camera, lights, environment, diffuse base and hardware.',viewport:devices['iPhone 13'].viewport}));await b.close();
