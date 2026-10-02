# The Squishy Corner

Mobile-first dropshipping storefront. Static front-end, zero dependencies.

## Run it

```sh
node server.js
# → http://localhost:3000
```

`server.js` is a tiny static server that also rewrites `/p/:slug` to the
single product template. `PORT` env var overrides 3000.

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
- Wire the checkout button in `js/site.js` (`checkoutBtn`) to a real provider.
