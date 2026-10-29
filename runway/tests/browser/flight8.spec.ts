import {test,expect} from '@playwright/test';
test('flight camera and sky render with clean HUD',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});
 await page.route('**/api/**',r=>r.abort());await page.goto('/');await page.getByRole('button',{name:'LET’S GO'}).click();await page.getByRole('button',{name:/^PLAY/}).click();if(await page.getByRole('dialog',{name:'How to play'}).isVisible())await page.getByRole('button',{name:'LET’S FLY'}).click();await expect(page.locator('.flight-hud')).toBeVisible();
 await page.waitForTimeout(12000);await page.screenshot({path:info.outputPath('fall.png')});await expect(page.getByText('PRACTICE FLIGHT',{exact:true})).toHaveCount(0);await expect(page.getByText('FREEFALL',{exact:true})).toHaveCount(0);
 await page.waitForTimeout(10000);await page.screenshot({path:info.outputPath('items.png')});expect(errors).toEqual([]);
});
