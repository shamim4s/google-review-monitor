import { chromium } from 'playwright';

const url =
    'https://www.google.com/maps/place/ZAHUR+%26+MOSTAFIZ+Chartered+Accountants+(Mohakhali+Branch)/@23.7742906,90.4058838,15z/data=!4m6!3m5!1s0x3755c745e2e4ec1b:0xb955e678dc9a5d50!8m2!3d23.7810749!4d90.4001546!16s%2Fg%2F11n3wry7x2';

const browser = await chromium.launch({
    headless: false,
    slowMo: 300
});

const page = await browser.newPage();

console.log('Opening page first time...');

await page.goto(url, {
    waitUntil: 'domcontentloaded'
});

await page.waitForTimeout(8000);

console.log('First load done. Refreshing page to trigger full UI...');

await page.reload({
    waitUntil: 'networkidle'
});

await page.waitForTimeout(10000002000);

console.log('Page refreshed and fully loaded');

await page.screenshot({ path: 'after-refresh.png', fullPage: true });

console.log('Screenshot saved: after-refresh.png');

// Optional: keep open for inspection
await page.pause();

await browser.close();