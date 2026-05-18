# Google Review Monitor

Monitor, collect, and analyze Google Maps reviews with local execution support and Apify Actor deployment support.

This project helps you:

- Scrape Google reviews from public Google Maps business URLs
- Monitor new reviews continuously
- Export review data for analytics or reporting
- Run locally on your own machine
- Deploy as an Apify Actor for scalable cloud execution
- Share processed review datasets publicly through generated URLs

---

# Features

- Google Maps review scraping
- Public Google Maps URL input
- Incremental review collection
- JSON / CSV export support
- Local execution workflow
- Apify Actor deployment workflow
- Cloud execution support
- Public dataset URLs
- Automated review monitoring
- Easy environment configuration
- Docker-ready architecture
- Headless browser automation

---

# Tech Stack

- Node.js
- Playwright / Puppeteer
- Apify SDK
- JavaScript / TypeScript
- Google Maps public review pages

---

# Project Structure

```bash
.
├── src/
├── storage/
├── output/
├── apify.json
├── package.json
├── Dockerfile
└── README.md
```

---

# Requirements

Before starting, install:

- Node.js 18+
- npm or yarn
- Git

Optional:

- Docker
- Apify account

---

# Installation

Clone the repository:

```bash
git clone https://github.com/shamim4s/google-review-monitor.git
cd google-review-monitor
```

Install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

---

# Environment Setup

Create a `.env` file:

```env
GOOGLE_MAPS_URL=https://maps.google.com/...
MAX_REVIEWS=100
HEADLESS=true
```

Optional:

```env
APIFY_TOKEN=your_apify_token
```

---

# Usage Method 1 — Local Computer Only

This method runs the scraper entirely on your own computer.

## Step 1 — Clone Repository

```bash
git clone https://github.com/shamim4s/google-review-monitor.git
cd google-review-monitor
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

---

## Step 3 — Build Project

```bash
npm run build
```

---

## Step 4 — Add Google Maps Review URL

Edit your `.env` file:

```env
GOOGLE_MAPS_URL=https://www.google.com/maps/place/your-business
```

---

## Step 5 — Run Project

```bash
npm start
```

Development mode:

```bash
npm run dev
```

---

## Step 6 — View Output

Scraped review data will be available inside:

```bash
/output
```

Example:

```bash
output/reviews.json
output/reviews.csv
```

---

# Example Output

```json
[
  {
    "reviewer": "John Doe",
    "rating": 5,
    "date": "2026-01-01",
    "review": "Excellent service!",
    "ownerResponse": "Thank you!"
  }
]
```

---

# Usage Method 2 — Deploy as Apify Actor

This method deploys the project to Apify for cloud execution and public dataset sharing.

---

# Step 1 — Create Apify Account

Create an account:

https://console.apify.com/

Generate your API token from:

Settings → Integrations → API tokens

---

# Step 2 — Install Apify CLI

```bash
npm install -g apify-cli
```

Login:

```bash
apify login
```

---

# Step 3 — Clone Repository

```bash
git clone https://github.com/shamim4s/google-review-monitor.git
cd google-review-monitor
```

---

# Step 4 — Install Dependencies

```bash
npm install
```

---

# Step 5 — Build Project

```bash
npm run build
```

---

# Step 6 — Create Actor on Apify

Initialize actor:

```bash
apify create
```

Or manually create a new Actor from the Apify Console.

---

# Step 7 — Configure Actor Input

Add Google Maps URL into Actor Input JSON:

```json
{
  "googleMapsUrl": "https://www.google.com/maps/place/your-business",
  "maxReviews": 100
}
```

---

# Step 8 — Deploy Actor

```bash
apify push
```

---

# Step 9 — Run Actor

```bash
apify run
```

Or run directly from the Apify dashboard.

---

# Step 10 — Access Public Dataset URL

After Actor execution completes:

1. Open Actor Run
2. Open Dataset
3. Click "Public Access"
4. Copy dataset URL

Example:

```text
https://api.apify.com/v2/datasets/xxxxxxxx/items?clean=true
```

This public URL can be used for:

- Dashboards
- BI tools
- Websites
- Google Sheets
- APIs
- Analytics pipelines

---

# Public Data Processing Workflow

```text
Google Maps URL
        ↓
Scraper
        ↓
Apify Dataset
        ↓
Public Dataset URL
        ↓
Dashboard / Analytics / Website
```

---

# Docker Usage

Build Docker image:

```bash
docker build -t google-review-monitor .
```

Run container:

```bash
docker run --env-file .env google-review-monitor
```

---

# Scheduling Monitoring Jobs

## Local Cron Job

Example:

```bash
0 * * * * npm start
```

Runs every hour.

---

## Apify Scheduler

Inside Apify:

- Open Actor
- Go to Schedules
- Create Schedule
- Set interval

---

# Export Formats

Supported export formats:

- JSON
- CSV
- XLSX (optional)
- API datasets

---

# Common Use Cases

- Brand reputation monitoring
- Customer sentiment tracking
- Competitor review monitoring
- Review analytics
- Review dashboards
- AI summarization pipelines
- Lead intelligence
- Local SEO tracking

---

# Troubleshooting

## Browser Launch Issues

Install Playwright browsers:

```bash
npx playwright install
```

---

## Memory Errors

Reduce max reviews:

```env
MAX_REVIEWS=20
```

---

## Captcha Issues

- Use slower scraping
- Rotate proxies
- Use Apify proxy support

---

# Security Notes

- Respect Google Terms of Service
- Avoid aggressive scraping
- Use delays and throttling
- Never overload endpoints

---

# Roadmap

- Email alerts
- Slack notifications
- Telegram integration
- AI sentiment analysis
- Dashboard UI
- Multi-business monitoring
- Historical trend analysis

---

# Contributing

Pull requests are welcome.

Steps:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Open PR

---

# License

MIT License

---

# Useful Links

- Repository:
  https://github.com/shamim4s/google-review-monitor

- Apify:
  https://apify.com/

- Playwright:
  https://playwright.dev/

- Node.js:
  https://nodejs.org/

---

# Disclaimer

This project is not affiliated with Google.

Use responsibly and comply with all applicable platform policies and local laws.
