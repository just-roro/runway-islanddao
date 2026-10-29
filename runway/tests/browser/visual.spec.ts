import {test,expect} from '@playwright/test';
test('continuous exit, fall, choices and island are rendered without WebGL errors',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
 await page.route('**/api/**',r=>r.abort());await page.goto('/');await page.getByRole('button',{name:'LET’S GO'}).click();await page.screenshot({path:info.outputPath('menu.png')});await page.getByRole('button',{name:/^PLAY/}).click();if(await page.getByRole('dialog',{name:'How to play'}).isVisible())await page.getByRole('button',{name:'LET’S FLY'}).click();await expect(page.locator('.flight-hud')).toBeVisible();
 for(const [name,wait] of [['cargo-bay',150],['exit',2400],['freefall',6000],['funding',19000],['cloud',64000],['island',6000],['approach',9000]] as const){await page.waitForTimeout(wait);await page.screenshot({path:info.outputPath(name+'.png')});}
 await expect(page.locator('.flight-meta')).toContainText(/GLIDE|LIFT/);await expect(page.getByText('PICK YOUR DESTINATION')).toHaveCount(0);await expect(page.getByText('FLIGHT SCORE')).toHaveCount(0);expect(errors).toEqual([]);
});
