import { Actor } from 'apify';
import { chromium } from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
await Actor.init();

let input = await Actor.getInput();

const maxReview=11;

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

for (let i = 0; i < maxReview; i++) {
    await reviewContainer.evaluate(el => {
        el.scrollBy(0, 3000);
    });

    await page.waitForTimeout(2000);
}

    /**
     * ===============================
     * STEP 4A: EXTRACT PLACE RATING SUMMARY
     * ===============================
     */

    console.log('Extracting place rating summary...');

    const placeRatingSummary = await page.evaluate(() => {

        /**
         * Find rating block
         */
        const blocks = Array.from(
            document.querySelectorAll('div.jANrlb')
        );

        let target = null;

        for (const block of blocks) {

            const rating =
                block.querySelector('.fontDisplayLarge')
                    ?.textContent
                    ?.trim();

            const reviews =
                block.querySelector('.fontBodySmall')
                    ?.textContent
                    ?.trim();

            if (rating && reviews) {
                target = block;
                break;
            }
        }

        if (!target) {
            return {
                AvgRating: '',
                TotalStars: '',
                TotalReviews: ''
            };
        }

        /**
         * Average rating
         */
        const AvgRating =
            target.querySelector('.fontDisplayLarge')
                ?.textContent
                ?.trim() || '';

        /**
         * "4.5 stars"
         */
        const TotalStars =
            target.querySelector('[role="img"]')
                ?.getAttribute('aria-label')
                ?.trim() || '';

        /**
         * "21,858 reviews"
         */
        const TotalReviews =
            target.querySelector('.fontBodySmall')
                ?.textContent
                ?.trim() || '';

        return {
            AvgRating,
            TotalStars,
            TotalReviews
        };
    });

    console.log('======================');
    console.log('PLACE RATING SUMMARY');
    console.log('======================');

    console.log(placeRatingSummary);


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
                card.querySelector('.wiI7pd')
                    ?.textContent
                    ?.trim() || '',

            rating: (() => {
                const ratingText = card.querySelector('[role="img"]')
                    ?.getAttribute('aria-label')
                    ?.trim()
                ||
                card.querySelector('.DU9Pgb .fontBodyLarge.fzvQIb')
                    ?.textContent
                    ?.trim()
                ||
                '';
                const match = ratingText.match(/^(\d+(\.\d+)?)/);
                return match ? match[1] : '';
            })(),

        time:
            card.querySelector('.rsqaWe')
                ?.textContent
                ?.trim()
            ||
            card.querySelector('.DU9Pgb .xRkPPb')
                // ?.childNodes[0]
                ?.textContent
                ?.trim()
            ||
            '',

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

/**
 * ===============================
 * FINAL JSON STRUCTURE
 * ===============================
 */

const finalData = {
    summary: placeRatingSummary,
    totalReviewsScraped: reviews.length,
    reviews
};

console.log('======================');
console.log('REVIEWS FOUND:', reviews.length);
console.log('======================');

// console.log(JSON.stringify(reviews, null, 2));
console.log(JSON.stringify(finalData, null, 2));

/**
 * ===============================
 * STEP 5: SAVE DATASET & SAVE REVIEWS
 * ===============================
 */


const isApify = !!process.env.APIFY_IS_AT_HOME;

let oldReviews = [];

/**
 * ===============================
 * APIFY STORAGE
 * ===============================
 */
if (isApify) {

    console.log('Running on Apify');

    const dataset = await Actor.openDataset();

    const previous = await dataset.getData();

    oldReviews = previous.items || [];

} else {

    console.log('Running locally');

    /**
     * LOCAL reviews.json
     */
    if (fs.existsSync('./reviews.json')) {

    try {
            const oldData = JSON.parse(
                fs.readFileSync('./reviews.json', 'utf8')
            );

            /**
             * Old format support
             */
            if (Array.isArray(oldData)) {

                oldReviews = oldData;

            } else {

                oldReviews = oldData.reviews || [];
            }

        } catch (e) {

            console.log('Failed reading local reviews.json');

            oldReviews = [];
        }
    }
}

/**
 * ===============================
 * DETECT NEW REVIEWS
 * ===============================
 */
const oldReviewIds = oldReviews.map(r => r.reviewId);

const newReviews = reviews.filter(r =>
    r.reviewId &&
    !oldReviewIds.includes(r.reviewId)
);

console.log('======================');
console.log('NEW REVIEWS:', newReviews.length);
console.log('======================');

/**
 * ===============================
 * SAVE TO APIFY
 * ===============================
 */
if (isApify) {

    if (newReviews.length > 0) {

        console.log('Saving reviews to Apify dataset');

        await Actor.pushData(newReviews);

    } else {

        console.log('No new reviews to save');
    }

} else {

    /**
     * LOCAL SAVE
     */
    console.log('Saving local reviews.json');

    fs.writeFileSync(
        './reviews.json',
        JSON.stringify(finalData, null, 2)
    );
}

/**
 * ===============================
 * UPDATE GITHUB GIST
 * ===============================
 */
async function updateGist(data){

    const token = process.env.GITHUB_TOKEN;
    const gistId = process.env.GIST_ID;

    if (!token || !gistId) {

        console.log('Missing GitHub credentials');

        return;
    }

    console.log('Uploading reviews to GitHub Gist...');

    try {

        await axios.patch(
            `https://api.github.com/gists/${gistId}`,
            {
                files: {
                    'reviews.json': {
                        content: JSON.stringify(finalData, null, 2)
                    }
                }
            },
            {
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Gist updated successfully');

    } catch (error) {

        console.log('Failed updating gist');

        console.log(error.response?.data || error.message);
    }
}

/**
 * ===============================
 * UPDATE GIST WITH ALL REVIEWS
 * ===============================
 */
await updateGist(finalData);

/**
 * ===============================
 * SAVE DEBUG COPY LOCALLY
 * ===============================
 */
if (!isApify) {

    fs.writeFileSync(
        './latest-reviews.json',
        JSON.stringify(finalData, null, 2)
    );
}

/**
 * ===============================
 * CLEANUP
 * ===============================
 */

console.log('Closing browser...');

try {
    await browser.close();
} catch (e) {
    console.log('Browser already closed');
}

/**
 * ONLY exit Actor on Apify
 */
if (isApify) {
    await Actor.exit();
}

console.log('Done');

/**
 * Force local Node exit
 */
if (!isApify) {
    process.exit(0);
}