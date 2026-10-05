const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Visit Login screen
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(2000); // Wait for data to fetch
  await page.screenshot({ path: 'login_fast_table.png', fullPage: true });

  // 2. Perform Login as Super Admin
  await page.fill('#loginEmail', 'thangtcnb@gmail.com');
  await page.fill('#loginPassword', '123456');
  await page.click('button[type="submit"]');

  await page.waitForSelector('#mainApp:not(.hidden)');
  await page.waitForTimeout(2000); // Wait for tasks to load

  // Check director opinion warning
  await page.screenshot({ path: 'tasks_warning.png', fullPage: true });

  // 3. Open Change Password Modal
  await page.click('#btnChangePassword');
  await page.waitForSelector('#modalChangePassword:not(.hidden)');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'change_password.png' });
  await page.click('#modalChangePassword .btn-close-modal');

  // 4. View stats tab
  // Assuming the tab has text "Thống kê"
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('#filterDeptTabs button'));
     const statsBtn = btns.find(b => b.innerText.includes('Thống kê'));
     if(statsBtn) statsBtn.click();
  });

  await page.waitForSelector('#statisticsArea:not(.hidden)');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'stats_tab.png', fullPage: true });

  await browser.close();
  console.log("Screenshots saved.");
})();
