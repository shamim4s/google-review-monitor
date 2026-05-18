# Google Review Monitor

Automatically monitor latest Google Maps reviews using:

- Apify
- Playwright
- GitHub

Features:

- Extract latest 5 reviews
- Detect new reviews
- Save reviews into Apify dataset
- Run every hour
- No Google API
- Fully free setup

## Run locally

Install:

```bash
npm install
```

Run:

```bash
npm start
```

## Deploy to Apify

1. Push this repo to GitHub
2. Create Actor from Git repo in Apify
3. Set build command:

```bash
npm install
```

4. Set start command:

```bash
npm start
```

5. Add input:

```json
{
  "startUrls": [
    {
      "url": "https://www.google.com/maps/place/YOUR_BUSINESS_URL"
    }
  ]
}
```
