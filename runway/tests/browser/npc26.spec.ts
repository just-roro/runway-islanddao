// The four-scene tutorial is covered by tutorial47.spec.ts. This guards its shared SHOP writer.
import {test,expect} from '@playwright/test';
test('SHOP introduction remains one-time and can be requested again',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"QA offline"}'}));
 await page.addInitScript(()=>localStorage.setItem('runway.profile',JSON.stringify({onboarded:true,nickname:'Crew QA',startupName:'Cabin',tutorialVersion:'npc-26',musicMuted:true})));
 await page.goto('/?qa=1');await expect(page.locator('#runway-boot')).toHaveCount(0,{timeout:60000});
 await page.getByRole('button',{name:'SHOP',exact:true}).click();await expect(page.locator('.shop-npc')).toBeVisible();
 await page.getByRole('button',{name:/^READ/}).click();await page.getByRole('button',{name:/LET’S SEE/}).click();
 await expect(page.locator('.shop-npc')).toHaveCount(0);await page.getByRole('button',{name:'BACK',exact:true}).click();
 await page.getByRole('button',{name:'SHOP',exact:true}).click();await expect(page.locator('.shop-npc')).toHaveCount(0);
 await page.getByRole('button',{name:'SHOP GUIDE',exact:true}).click();await expect(page.locator('.shop-npc')).toBeVisible();
 await page.waitForFunction(()=>(window as any).__RUNWAY_PRESENTATION_QA__.conversation.focus>.99);
 expect(await page.evaluate(()=>(window as any).__RUNWAY_HOLOGRAM_QA__.models)).toEqual([]);
 await expect(page.getByRole('dialog',{name:'How to play'})).toHaveCount(0);
});
