# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cloud30.spec.ts >> cloud boot, landing artwork, plane return and replay
- Location: tests/browser/cloud30.spec.ts:2:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('img', { name: 'Welcome to Floripa. Landed.' })
Expected: visible
Timeout: 90000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 90000ms
  - waiting for getByRole('img', { name: 'Welcome to Floripa. Landed.' })

```

```yaml
- main:
  - img "Dragon"
  - strong: Cloud QA
  - text: Runway YOUR SOL 0
  - heading "RUNWAY" [level=1]:
    - img "RUNWAY"
  - button "PLAY ▶"
  - navigation:
    - button "RANKINGS"
    - button "MY STARTUP"
    - button "SHOP"
  - button "HOW TO PLAY"
  - button "OPTIONS"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | test('cloud boot, landing artwork, plane return and replay',async({page},info)=>{
  3  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  4  |  await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  5  |  await page.addInitScript(()=>{localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Cloud QA',startupName:'Runway',tutorialVersion:'npc-26'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:Uint32Array)=>{a.fill(17);return a;}});});
  6  |  await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:45000});
  7  |  await expect(page.locator('.pilot-label')).toHaveCount(0);await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/assets/brand/favicon.png');await page.screenshot({path:info.outputPath('menu.png')});
  8  |  await page.evaluate(()=>{(window as any).__curtainSeen=false;const end=performance.now()+2500;const watch=()=>{if(getComputedStyle(document.querySelector('.flight-curtain')!).visibility==='visible')(window as any).__curtainSeen=true;if(performance.now()<end)requestAnimationFrame(watch);};watch();});await page.getByRole('button',{name:/^PLAY/}).click();await page.waitForFunction(()=>!!(window as any).__RUNWAY_QA__);
  9  |  await page.waitForTimeout(2600);expect(await page.evaluate(()=>(window as any).__curtainSeen)).toBe(false);await page.evaluate(async()=>{const path='/tests/test-pilot.ts',{flyToJurere}=await import(path);(window as any).__RUNWAY_CONTROLS_QA__.read=()=>flyToJurere((window as any).__RUNWAY_QA__.state);});
> 10 |  await expect(page.getByRole('img',{name:'Welcome to Floripa. Landed.'})).toBeVisible({timeout:90000});await page.waitForTimeout(2200);await page.screenshot({path:info.outputPath('landed.png')});
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  11 |  await expect(page.getByText('Local flight · saved on this device')).toHaveCount(0);
  12 |  await page.getByRole('button',{name:'ONE MORE RUN',exact:true}).click();await expect(page.locator('.flight-curtain')).toBeVisible();await page.screenshot({path:info.outputPath('retry-curtain.png')});
  13 |  await expect(page.locator('.flight-curtain')).toBeHidden({timeout:15000});await page.waitForFunction(()=>{const r=(window as any).__RUNWAY_QA__;return r&&!r.paused&&!r.reported&&r.state.tick<180;});
  14 |  await page.getByRole('button',{name:/Pause/i}).click();await page.getByRole('button',{name:/BACK TO PLANE/}).click();await expect(page.locator('.flight-curtain')).toBeHidden({timeout:15000});await expect(page.getByRole('button',{name:/^PLAY/})).toBeVisible();expect(errors).toEqual([]);
  15 | });
  16 | 
  17 | test('cold loading waits for assets, full cloud coverage and reduced-motion landscape',async({page},info)=>{
  18 |  await page.setViewportSize({width:844,height:390});await page.emulateMedia({reducedMotion:'reduce'});
  19 |  let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);let requested=false;
  20 |  await page.route('**/*.glb*',async route=>{requested=true;await held;await route.continue();});await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  21 |  await page.goto('/');await expect.poll(()=>requested).toBe(true);await expect(page.locator('#runway-boot')).toBeVisible();
  22 |  const coverage=await page.evaluate(async()=>{const a=document.querySelector<HTMLImageElement>('.cloud-left')!,b=document.querySelector<HTMLImageElement>('.cloud-right')!;await Promise.all([a.decode(),b.decode()]);const c=document.createElement('canvas');c.width=390;c.height=844;const g=c.getContext('2d')!;g.drawImage(a,-19.5,0,390,844);g.drawImage(b,19.5,0,390,844);const d=g.getImageData(0,0,390,844).data;let minimum=255;for(let i=3;i<d.length;i+=4)minimum=Math.min(minimum,d[i]);return minimum;});expect(coverage).toBeGreaterThanOrEqual(250);
  23 |  await page.screenshot({path:info.outputPath('loading-landscape.png')});release();await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:45000});
  24 | });
  25 | 
```