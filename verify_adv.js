const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(2000);

  await page.fill('#loginEmail', 'thangtcnb@gmail.com');
  await page.fill('#loginPassword', '123456');
  await page.click('button[type="submit"]');

  await page.waitForSelector('#mainApp:not(.hidden)');
  await page.waitForTimeout(2000);

  // Click advanced search button
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const advBtn = btns.find(b => b.innerText.includes('Tìm kiếm nâng cao'));
     if(advBtn) advBtn.click();
  });

  await page.waitForSelector('#advancedSearchModal:not(.hidden)');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'advanced_search_modal.png', fullPage: true });

  await browser.close();
  console.log("Advanced search screenshot saved.");
})();
