import{test,expect}from'@playwright/test';
test('steering reaches safe land and shows the complete financial settlement',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.abort());await page.goto('/');await page.getByRole('button',{name:'LET’S GO'}).click();await page.getByRole('button',{name:/^PLAY/}).click();if(await page.getByRole('dialog',{name:'How to play'}).isVisible())await page.getByRole('button',{name:'LET’S FLY'}).click();
 await expect(page.locator('.flight-meta')).toContainText('GLIDE',{timeout:115000});
 await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowUp');await page.waitForTimeout(9000);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(20000);await page.keyboard.up('ArrowUp');
 await page.screenshot({path:info.outputPath('controlled-approach.png')});
 await expect(page.locator('.landing-word')).toHaveText('LANDED',{timeout:50000});await page.screenshot({path:info.outputPath('contact.png')});await page.waitForTimeout(2200);await page.screenshot({path:info.outputPath('celebration.png')});
 await expect(page.getByRole('heading',{name:'TOUCHDOWN.'})).toBeVisible({timeout:10000});
 await expect(page.locator('.settlement-log > div.settled')).toHaveCount(4);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('runway.lastResult')||'null'));expect(saved.state.result.outcome).toBe('landed');expect(saved.state.result.cashFinal).toBeGreaterThan(0);expect(saved.state.result.score).toBe(saved.state.cash);
 await expect(page.locator('.closing-total strong')).toHaveText('$'+saved.state.cash.toLocaleString('en-US'));await expect(page.locator('.settlement-log b').first()).toHaveText('$5,000');
 await page.screenshot({path:info.outputPath('successful-results.png')});expect(errors).toEqual([]);
});
