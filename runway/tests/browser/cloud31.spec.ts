import {test,expect} from '@playwright/test';
test('return curtain stays closed until the new scene finishes GPU preparation',async({page},info)=>{
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Cloud QA',startupName:'Runway',tutorialVersion:'npc-26'})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:45000});await page.getByRole('button',{name:/^PLAY/}).click();await expect(page.locator('.flight-hud')).toBeVisible();await page.getByRole('button',{name:/Pause/i}).click();
 await page.evaluate(()=>{const w=window as any,renderer=w.__RUNWAY_SCENE_QA__.renderer,compile=renderer.compileAsync.bind(renderer);renderer.compileAsync=async(...args:any[])=>{w.__compileHeld=true;await new Promise<void>(resolve=>w.__releaseCompile=resolve);return compile(...args);};});
 await page.getByRole('button',{name:/BACK TO PLANE/}).click();await page.waitForFunction(()=>(window as any).__compileHeld);await expect(page.locator('.flight-curtain')).toBeVisible();await page.waitForTimeout(1200);await expect(page.locator('.flight-curtain')).toBeVisible();
 expect(await page.locator('.cloud-left').last().evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');await page.screenshot({path:info.outputPath('awaiting-scene.png')});
 await page.evaluate(()=>(window as any).__releaseCompile());await expect(page.locator('.flight-curtain')).toBeHidden({timeout:10000});await expect(page.getByRole('button',{name:/^PLAY/})).toBeVisible();await page.screenshot({path:info.outputPath('ready-menu.png')});
});
