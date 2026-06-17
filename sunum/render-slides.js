// render-slides.js — deck-standalone.html'in her slaytını 1280x720 PNG olarak render eder
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EXEC = path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const OUTDIR = path.join(__dirname, 'slides_img');
fs.mkdirSync(OUTDIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(__dirname, 'deck-standalone.html'));
  // fontlar yüklensin
  await page.waitForTimeout(2000);
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}
  // deck-stage overlay'ini (slayt sayacı / hint) gizle
  await page.evaluate(() => {
    const ds = document.querySelector('deck-stage');
    if (ds && ds.shadowRoot) {
      const st = document.createElement('style');
      st.textContent = '.overlay{display:none!important} .tapzones{display:none!important}';
      ds.shadowRoot.appendChild(st);
    }
  });
  const n = await page.evaluate(() => document.querySelectorAll('deck-stage > section').length);
  await page.keyboard.press('Home');
  await page.waitForTimeout(400);
  for (let i = 0; i < n; i++) {
    await page.waitForTimeout(450);
    const file = path.join(OUTDIR, 'slide-' + String(i + 1).padStart(2, '0') + '.png');
    await page.screenshot({ path: file });
    await page.keyboard.press('ArrowRight');
  }
  await browser.close();
  console.log('✓ ' + n + ' slayt render edildi → ' + OUTDIR);
})();
