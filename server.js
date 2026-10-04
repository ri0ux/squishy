// Static server + Stripe Checkout API for The Squishy Corner.
// Serves the storefront, rewrites /p/:slug to the product template,
// and exposes POST /api/checkout (create a Checkout Session) plus
// POST /api/webhook (Stripe fulfillment events).
//
// Env vars:
//   STRIPE_SECRET_KEY     required for checkout (sk_test_... / sk_live_...)
//   STRIPE_WEBHOOK_SECRET recommended for webhooks (whsec_...)
//   SITE_URL              canonical base URL, e.g. https://thesquishycorner.com
//                         (defaults to the request's own host — fine on Railway)
//   PORT                  defaults to 3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");

let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = require("stripe")(STRIPE_SECRET_KEY);
}

// Server-side price book — the ONLY prices Stripe ever sees.
// Mirrors js/catalog.js bundles. Cart qty counts individual peanuts,
// so packs = qty / packQty must be a whole number.
const PRICE_BOOK = {
  "peanut-squishy-single": { name: "Peanut Squishy", packQty: 1, packCents: 1000 },
  "peanut-1": { name: "Peanut Squishy — Single", packQty: 1, packCents: 1000 },
  "peanut-2": { name: "Peanut Squishy — Double trouble (2-pack)", packQty: 2, packCents: 1800 },
  "peanut-3": { name: "Peanut Squishy — Triple pack (3-pack)", packQty: 3, packCents: 2500 },
};

// Countries Checkout will accept shipping addresses for. Extend as you grow.
const SHIP_TO = ["US", "CA", "MX", "GB", "IE", "FR", "DE", "NL", "BE", "ES", "PT", "IT", "SE", "NO", "DK", "FI", "AT", "CH", "PL", "CZ", "GR", "AU", "NZ", "JP", "KR", "SG", "MY", "TH", "PH", "VN", "ID", "IN", "AE", "SA", "IL", "ZA", "BR", "AR", "CL", "CO", "PE"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), "application/json; charset=utf-8");
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

function baseUrl(req) {
  if (SITE_URL) return SITE_URL;
  const proto = (req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  return `${proto}://${req.headers.host}`;
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const cap = maxBytes || 1000000;
    req.on("data", (c) => {
      size += c.length;
      if (size > cap) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handleCheckout(req, res) {
  if (!stripe) {
    return json(res, 503, { error: "Payments aren't configured yet. Please try again soon." });
  }
  let payload;
  try {
    payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
  } catch (e) {
    return json(res, 400, { error: "Invalid request." });
  }
  const items = payload.items;
  if (!Array.isArray(items) || !items.length) {
    return json(res, 400, { error: "Your cart is empty." });
  }
  const lineItems = [];
  const summary = [];
  for (const item of items) {
    const entry = PRICE_BOOK[item && item.id];
    const qty = item && item.qty;
    if (!entry || !Number.isInteger(qty) || qty <= 0 || qty > 99 || qty % entry.packQty !== 0) {
      return json(res, 400, { error: "Something in your cart looks off — please re-add it and try again." });
    }
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: entry.name, description: "Sold by The Squishy Corner" },
        unit_amount: entry.packCents,
      },
      quantity: qty / entry.packQty,
    });
    summary.push(`${item.id}x${qty}`);
  }
  const base = baseUrl(req);
  // Checkout product images must be absolute public URLs — include ours on https.
  if (base.startsWith("https://")) {
    for (const li of lineItems) li.price_data.product_data.images = [`${base}/images/main-peanut-box.png`];
  }
  const sessionParams = {
    mode: "payment",
    line_items: lineItems,
    success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cancel`,
    shipping_address_collection: { allowed_countries: SHIP_TO },
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    // Bank-statement text buyers will recognize. Retried without on
    // conflict with the account's descriptor prefix (see catch below).
    payment_intent_data: { statement_descriptor: "SQUISHYCORNER" },
    // Disclosure shown above the Pay button on Stripe's own page.
    custom_text: {
      submit: { message: "You are paying The Squishy Corner. Charges appear as SQUISHYCORNER and are processed by Cascade Collective LLC." },
    },
    metadata: { cart: summary.join(",").slice(0, 400) },
  };
  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return json(res, 200, { url: session.url });
  } catch (err) {
    if (err && err.param && String(err.param).includes("statement_descriptor")) {
      console.warn("Stripe rejected the statement descriptor (check Settings → statement descriptor prefix); retrying without it.");
      delete sessionParams.payment_intent_data;
      try {
        const session = await stripe.checkout.sessions.create(sessionParams);
        return json(res, 200, { url: session.url });
      } catch (retryErr) {
        console.error("Stripe checkout failed:", retryErr && retryErr.message);
        return json(res, 502, { error: "Couldn't reach the payment provider. Please try again." });
      }
    }
    console.error("Stripe checkout failed:", err && err.message);
    return json(res, 502, { error: "Couldn't reach the payment provider. Please try again." });
  }
}

async function handleWebhook(req, res) {
  if (!stripe) return json(res, 503, { error: "Payments not configured." });
  const raw = await readBody(req);
  let event;
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"] || "", STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature failed:", err && err.message);
      return json(res, 400, { error: "Bad signature." });
    }
  } else {
    console.warn("No STRIPE_WEBHOOK_SECRET — accepting unverified webhook (dev only).");
    try {
      event = JSON.parse(raw.toString("utf8"));
    } catch (e) {
      return json(res, 400, { error: "Invalid payload." });
    }
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const email = (s.customer_details && s.customer_details.email) || "?";
    const addr = (s.shipping_details && s.shipping_details.address) || {};
    const where = [addr.city, addr.country].filter(Boolean).join(", ");
    console.log(`[order] ${s.id} ${((s.amount_total || 0) / 100).toFixed(2)} ${(s.currency || "").toUpperCase()} email=${email} ship=${where}`);
    // TODO: fulfill the order here — e.g. place the supplier order,
    // save to a database, or send a confirmation email.
  }
  return json(res, 200, { received: true });
}

function guard(fn) {
  return (req, res) => {
    fn(req, res).catch((err) => {
      console.error("API error:", err);
      if (!res.headersSent) json(res, 500, { error: "Something went wrong. Please try again." });
    });
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/api/checkout") {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    return guard(handleCheckout)(req, res);
  }
  if (pathname === "/api/webhook") {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    return guard(handleWebhook)(req, res);
  }

  // Dynamic product pages: every /p/:slug renders the one product template.
  if (pathname === "/p" || pathname.startsWith("/p/")) {
    return serveFile(res, path.join(ROOT, "product.html"));
  }
  if (pathname === "/") pathname = "/index.html";
  // Extensionless trust pages: /faq -> /faq.html, etc.
  if (!path.extname(pathname)) pathname = pathname + ".html";

  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      return serveFile(res, path.join(filePath, "index.html"));
    }
    serveFile(res, filePath);
  });
});

server.listen(PORT, () => {
  const mode = !STRIPE_SECRET_KEY ? "off (no STRIPE_SECRET_KEY)"
    : STRIPE_SECRET_KEY.startsWith("sk_live_") ? "LIVE" : "test";
  console.log(`The Squishy Corner running at http://localhost:${PORT} — Stripe: ${mode}`);
});
