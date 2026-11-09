# Shiesty VR view counter (Cloudflare Worker)

This little Worker keeps the "site views" total shown on shiestyvr.com.
It runs free on Cloudflare: a Worker plus one Durable Object that stores the count.

- `POST /hit` adds one view and returns `{"count": n}` (only from shiestyvr.com)
- `GET /count` returns `{"count": n}` without adding one

The site counts each visitor once per browser session.

## Set it up (about 5 minutes)

You need a free Cloudflare account and Node.js installed.

1. Open a terminal in this folder:

   ```bash
   cd cloudflare-worker
   ```

2. Log in to Cloudflare (opens your browser):

   ```bash
   npx wrangler login
   ```

3. Deploy:

   ```bash
   npx wrangler deploy
   ```

   It prints a URL like `https://shiesty-views.YOUR-NAME.workers.dev`. Copy it.

4. In `index.html` (repo root), paste that URL into the counter tag:

   ```html
   <meta name="shiesty-views-api" content="https://shiesty-views.YOUR-NAME.workers.dev">
   ```

5. Commit and push. The view counter appears on the site under the buttons and in the footer.

Until step 4 is done the counter is simply hidden, so the site never shows a broken number.

## Optional: private visitor stats

For detailed analytics (visitors, countries, referrers) that only you can see, turn on
**Cloudflare Web Analytics** in the Cloudflare dashboard, add shiestyvr.com, and paste the
token into the commented-out beacon script near the top of `index.html`.
