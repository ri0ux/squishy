# The Squishy Corner

Mobile-first dropshipping storefront. Static front-end + tiny Node server
with Stripe Checkout.

## Run it

```sh
npm install
STRIPE_SECRET_KEY=sk_test_... node server.js
# → http://localhost:3000
```

`server.js` serves the static site, rewrites `/p/:slug` to the single
product template, and exposes the payments API. `PORT` env var overrides
3000. Without `STRIPE_SECRET_KEY` the site still runs, but checkout
returns a friendly "not configured" error.

## Payments (Stripe Checkout)

Flow: cart → `POST /api/checkout` → Stripe-hosted checkout →
`/success?session_id=...` (or `/cancel`). Prices come from the
server-side `PRICE_BOOK` in `server.js` — never from the browser —
so keep it in sync with `js/catalog.js` bundles.

Env vars (see `.env.example`; on Railway set them under Variables):

| Var | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_...`, live: `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Developers → Webhooks → endpoint `https://<your-domain>/api/webhook` subscribed to `checkout.session.completed` (`whsec_...`) |
| `SITE_URL` | Your canonical URL, e.g. `https://thesquishycorner.com`. Optional — defaults to the request host, which is already correct on Railway. |

Local webhook testing: `stripe listen --forward-to localhost:3000/api/webhook`
gives you a `whsec_...` to use as `STRIPE_WEBHOOK_SECRET`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

Paid orders trigger a confirmation email via Resend. Setup: create a
Resend account, verify `thesquishycorner.com` (add the DNS records it
shows you), and set `RESEND_API_KEY` in Railway Variables (`ORDER_FROM`
overrides the sender). Without the key the server still runs — it just
skips the email with a warning.

## Local checkout + webhook testing

Terminal 1 — server with your test key (`.env` holds it; see `.env.example`):

```sh
set -a; source .env; set +a
node server.js
```

Terminal 2 — forward test webhooks (run `stripe login` once first):

```sh
stripe listen --forward-to localhost:3000/api/webhook --events checkout.session.completed
```

(If port 3000 is taken by another project, run `PORT=3100 node server.js`
and forward to `localhost:3100/api/webhook` instead.)

The printed `whsec_...` goes into `.env` as `STRIPE_WEBHOOK_SECRET`.
Pay with the test card above and watch both terminals — the server
logs an `[order]` line when the webhook lands.

## Add a new squishy

1. Drop images in `images/`.
2. Append one object to `js/catalog.js` (copy the peanut entry).
3. Add a `body[data-theme="..."]` override block in `css/tokens.css`.

That's it — `/p/your-slug` works immediately, and the product shows up on
the home grid and related-squishy carousels.

## Before launch

- No reviews on the site by design (a community wall stands in). Once you have real ones, add them to `catalog.js` and restore the review sections.
- Verify peanut specs against the supplier listing.
- Product photos live in `images/` and are wired into the gallery, home page, and bundle section — swap files to refresh.
- Checkout is live via Stripe: set `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`) in Railway Variables. Use test keys first, then swap to live keys when you flip Stripe to Live mode.
