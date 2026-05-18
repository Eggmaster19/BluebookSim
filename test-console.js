const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Catch console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });

    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForSelector('.selection-container select', { timeout: 5000 });
    
    // Select "test"
    await page.select('.selection-container select', 'test');
    await page.click('.next-btn');
    
    // We are on JsonInputScreen
    await page.waitForSelector('.bb-footer__btn', { timeout: 5000 });
    
    // Click "Load Test"
    const buttons = await page.$$('.bb-footer__btn');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Load Test')) {
        await btn.click();
        break;
      }
    }
    
    // Wait for the JSON to parse
    await page.waitForTimeout(1000);
    
    // Click "start exam"
    await page.click('.json-input-start');
    
    // Wait to see if PreviewScreen loads or if it crashes
    await page.waitForTimeout(2000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT AFTER START:', bodyText.substring(0, 100));
    
    await browser.close();
  } catch (e) {
    console.error('SCRIPT ERROR:', e);
  }
})();
