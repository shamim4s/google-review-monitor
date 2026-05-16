import { Actor } from 'apify';
import { chromium } from 'playwright';
import fs from 'fs';

await Actor.init();

let input = await Actor.getInput();

// Local fallback
if (!input) {
    console.log('Running locally -> loading input.json');

    input = JSON.parse(
        fs.readFileSync('./input.json', 'utf8')
    );
}

if (!input?.startUrls?.length) {
    throw new Error('No Google Maps URL found in input');
}

const url = input.startUrls[0].url;

console.log('Launching browser...');

const browser = await chromium.launch({
    headless: false,
    slowMo: 300
});

const page = await browser.newPage({
    locale: 'en-US',
    viewport: {
        width: 1366,
        height: 768
    }
});

console.log('Opening Google Maps URL (first load)...');

await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
});

await page.waitForTimeout(8000);

console.log('First load done. Checking UI state...');

/**
 * 🔥 FORCE GOOGLE MAPS FULL UI HYDRATION
 */
await page.reload({
    waitUntil: 'domcontentloaded'
});

await page.waitForTimeout(12000);

console.log('Page reloaded — full UI should be available now');

/**
 * ===============================
 * STEP 1: OPEN REVIEWS TAB
 * ===============================
 */
console.log('Searching Reviews tab...');

const reviewSelectors = [
    '[role="tab"][aria-label*="Reviews"]',
    '[role="tab"][aria-label*="review" i]',
    'button[role="tab"][aria-label*="Reviews"]',
    'text=Reviews'
];

let clicked = false;

for (const selector of reviewSelectors) {
    try {
        const el = page.locator(selector).first();

        if (await el.count()) {

            console.log('Found Reviews tab:', selector);

            await el.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);

            await el.click({ force: true });

            clicked = true;
            break;
        }
    } catch (e) {
        console.log('Selector failed:', selector);
    }
}

/**
 * ===============================
 * FALLBACK (NO REVIEWS TAB UI)
 * ===============================
 */
if (!clicked) {
    console.log('No Reviews tab found — trying fallback');

    const writeReview = page.locator([
        'text=Write a review',
        'text=একটি পর্যালোচনা লিখুন'
    ].join(',')).first();

    if (await writeReview.count()) {
        console.log('Write review found — clicking');

        await writeReview.click({ force: true });
        clicked = true;
    }
}

if (!clicked) {
    console.log('Saving debug screenshot...');
    await page.screenshot({ path: 'debug-no-reviews.png', fullPage: true });

    throw new Error('Could not open Reviews section');
}

/**
 * ===============================
 * STEP 2: WAIT FOR FEED
 * ===============================
 */
console.log('Waiting for reviews feed...');

console.log('Waiting for reviews container...');

/**
 * 🔥 Correct container from your HTML
 */
const reviewContainer = page.locator('div.m6QErb.XiKgde').first();

await reviewContainer.waitFor({
    state: 'attached',
    timeout: 60000
});

await page.waitForTimeout(5000);

console.log('Reviews container found');

await page.waitForTimeout(5000);

/**
 * ===============================
 * STEP 3: SCROLL REVIEWS
 * ===============================
 */
console.log('Scrolling reviews...');

for (let i = 0; i < 6; i++) {
    await reviewContainer.evaluate(el => {
        el.scrollBy(0, 3000);
    });

    await page.waitForTimeout(2000);
}

/**
 * ===============================
 * STEP 4: EXTRACT REVIEWS
 * ===============================
 */
console.log('Extracting reviews...');

const reviews = await page.$$eval('[data-review-id]', cards => {

    const unique = new Map();

    for (const card of cards) {

        const reviewId =
            card.getAttribute('data-review-id') || '';

        if (!reviewId) continue;

        // skip duplicates
        if (unique.has(reviewId)) continue;

        const review = {

            reviewId,

            name:
                card.querySelector('.d4r55')
                    ?.textContent
                    ?.trim() || '',

            text:
                card.querySelector('.wiI7pd span')
                    ?.textContent
                    ?.trim() || '',

            rating:
                card.querySelector('[role="img"]')
                    ?.getAttribute('aria-label') || '',

            time:
                card.querySelector('.rsqaWe')
                    ?.textContent
                    ?.trim() || '',

            reviewerImage:
                card.querySelector('img')
                    ?.src || '',

            profileUrl:
                card.querySelector('button[data-href]')
                    ?.getAttribute('data-href') || '',

            scrapedAt:
                new Date().toISOString()
        };

        // skip broken empty cards
        if (!review.name && !review.text) continue;

        unique.set(reviewId, review);
    }

    return Array.from(unique.values());
});

console.log('======================');
console.log('REVIEWS FOUND:', reviews.length);
console.log('======================');

console.log(JSON.stringify(reviews, null, 2));

/**
 * ===============================
 * STEP 5: SAVE DATASET
 * ===============================
 */
const dataset = await Actor.openDataset();

const previous = await dataset.getData();
const oldReviews = previous.items || [];

const oldTexts = oldReviews.map(r => r.text);

const newReviews = reviews.filter(r =>
    r.text && !oldTexts.includes(r.text)
);

if (newReviews.length > 0) {
    console.log(`Saving ${newReviews.length} new reviews`);
    await Actor.pushData(newReviews);
} else {
    console.log('No new reviews found');
}

console.log('Closing browser...');

await browser.close();
await Actor.exit();