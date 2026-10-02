/* Dynamic product page: reads the slug from /p/:slug (or ?slug= fallback)
   and renders every section from window.CATALOG. One template, N squishies. */
(function () {
  "use strict";

  function slugFromURL() {
    const m = window.location.pathname.match(/^\/p\/([\w-]+)/);
    if (m) return m[1];
    return new URLSearchParams(window.location.search).get("slug");
  }

  function setMeta(selector, content) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", content);
  }

  function setCanonical(href) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  }

  function setProductJsonLd(p, pageUrl) {
    const node = document.getElementById("product-json");
    if (!node) return;
    if (p.status !== "live") {
      node.remove(); // coming-soon products get no Product markup
      return;
    }
    node.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.blurb,
      image: p.images.map((i) => `https://thesquishycorner.com${i.src}`),
      brand: { "@type": "Brand", name: "The Squishy Corner" },
      offers: {
        "@type": "Offer",
        price: Number(p.price).toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: pageUrl,
      },
    });
  }

  function init() {
    const product = window.getProduct(slugFromURL());
    if (!product) {
      document.getElementById("pdpRoot").innerHTML = `
        <div class="wrap"><div class="soon-hero">
          <h1>Lost squishy?</h1>
          <p style="color:var(--ink-soft);margin:12px 0 20px">We couldn't find that one. Maybe it got squeezed too hard.</p>
          <a class="btn btn-dark" href="/">Back to the shop</a>
        </div></div>`;
      return;
    }
    document.body.dataset.theme = product.theme || "peanut";
    document.title = `${product.name} — The Squishy Corner`;
    const pageUrl = `https://thesquishycorner.com/p/${product.slug}`;
    setMeta('meta[property="og:title"]', `${product.name} — The Squishy Corner`);
    setMeta('meta[property="og:description"]', product.blurb);
    setMeta('meta[property="og:url"]', pageUrl);
    if (product.images[0]) setMeta('meta[property="og:image"]', `https://thesquishycorner.com${product.images[0].src}`);
    setCanonical(pageUrl);
    setProductJsonLd(product, pageUrl);

    if (product.status === "coming-soon") return renderSoon(product);
    renderLive(product);
  }

  /* ---------- live product ---------- */

  function renderLive(p) {
    const discount = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const gallerySlides = p.images.map(
      (img) => `<div class="gallery-slide"><img src="${img.src}" alt="${img.alt}" ${p.images[0] === img ? 'fetchpriority="high"' : 'loading="lazy"'}></div>`
    ).join("");

    document.getElementById("pdpRoot").innerHTML = `
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/#shop">Shop</a> &nbsp;/&nbsp; ${p.name}</nav>
      <div class="pdp">
        <div class="gallery">
          <div class="gallery-badge">
            ${p.badges.map((b) => `<span class="badge badge-accent">${b}</span>`).join("")}
            ${discount ? `<span class="badge badge-sale">Save ${discount}%</span>` : ""}
          </div>
          <div class="gallery-frame"><div class="gallery-track" id="galleryTrack">${gallerySlides}</div></div>
          <button class="gallery-arrow prev" id="galPrev" aria-label="Previous image">‹</button>
          <button class="gallery-arrow next" id="galNext" aria-label="Next image">›</button>
          <div class="gallery-dots" id="galDots" role="tablist" aria-label="Product images"></div>
        </div>

        <div class="buybox">
          <h1>${p.name}</h1>
          <p class="tagline">${p.tagline}</p>
          <div class="buybox-price-row">
            <span class="price">${window.money(p.price)}</span>
            ${p.compareAt ? `<span class="price-compare">${window.money(p.compareAt)}</span><span class="save-badge">SAVE ${discount}%</span>` : ""}
          </div>
          <p class="buybox-blurb">${p.blurb}</p>
          <div class="qty-row">
            <span class="qty" role="group" aria-label="Quantity">
              <button id="qtyDec" aria-label="Decrease quantity">−</button>
              <output id="qtyOut">1</output>
              <button id="qtyInc" aria-label="Increase quantity">+</button>
            </span>
            <button class="btn btn-primary" id="atcBtn">Add to cart — ${window.money(p.price)}</button>
          </div>
          <div class="trust-micro">${window.icon("lock")} Secure checkout · Free shipping · Gift-ready box</div>
          <div class="buybox-perks">
            ${p.perks.map((perk) => `
              <div class="perk"><div class="perk-icon">${window.icon(perk.icon)}</div>
              <div><h3>${perk.title}</h3><p>${perk.text}</p></div></div>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <section class="section"><div class="wrap">
      <div class="section-head"><h2>Why you'll love it</h2><p>Four reasons this little guy earns its desk space.</p></div>
      <div class="benefit-list">
        ${p.benefits.map((b, i) => `<div class="benefit"><span class="benefit-num">0${i + 1}</span><h3>${b.title}</h3><p>${b.text}</p></div>`).join("")}
      </div>
    </div></section>

    <section class="section section-tint"><div class="wrap">
      <div class="section-head"><h2>The details</h2><p>Everything your thumb wants to know.</p></div>
      ${window.accHTML("specAcc", "Specifications",
        `<table class="spec-table"><tbody>${p.specs.map((s) => `<tr><th>${s[0]}</th><td>${s[1]}</td></tr>`).join("")}</tbody></table>`, true)}
    </div></section>

    <section class="section" id="crunch"><div class="wrap">
      <div class="section-head"><h2>Inside the crunch</h2><p>Soft outside, crackly inside. Here's the anatomy of a perfect squeeze.</p></div>
      <div class="benefit-list">
        <div class="benefit"><span class="benefit-num">Shell</span><h3>Soft TPR skin</h3><p>Smooth, stretchy, realistic peanut shell that begs to be squeezed.</p></div>
        <div class="benefit"><span class="benefit-num">Core</span><h3>Clay + bead filling</h3><p>A moldable clay and micro-bead mixture that crackles under every press.</p></div>
        <div class="benefit"><span class="benefit-num">Sound</span><h3>Crunchy sound</h3><p>Every squeeze pops and crackles. Pure ASMR — you'll hear why it's addictive.</p></div>
      </div>
    </div></section>

    <section class="section section-tint"><div class="wrap">
      <div class="section-head"><h2>Bundle &amp; save</h2><p>One is never enough. Mix, match, and save more per peanut.</p></div>
      <img class="bundle-banner" src="/images/stack-of-peanuts.png" alt="Three peanut squishies stacked in a pyramid" loading="lazy">
      <div class="bundle-grid">
        ${p.bundles.map((b) => `
          <div class="bundle${b.tag === "Most popular" ? " featured" : ""}">
            ${b.tag ? `<span class="bundle-tag">${b.tag}</span>` : ""}
            <h3>${b.label} ×${b.qty}</h3>
            <div><span class="price">${window.money(b.price)}</span> <span class="price-compare">${window.money(b.compareAt)}</span></div>
            <p class="bundle-note">${b.note}</p>
            <button class="btn ${b.tag ? "btn-primary" : "btn-dark"}" data-bundle="${b.id}">Add ${b.qty > 1 ? b.qty + "-pack" : "to cart"}</button>
          </div>`).join("")}
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><h2>More squishies</h2><p>Your shelf called. It wants friends for the peanut.</p></div>
      <div class="related-scroll" id="relatedRow"></div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="section-head"><h2>Questions?</h2><p>The stuff everyone asks before they squeeze.</p></div>
      <div id="pdpFaq">${p.faqs.map((f, i) => window.accHTML(`faq${i}`, f[0], `<p>${f[1]}</p>`, i === 0)).join("")}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="section-head"><h2>The official squeeze guide</h2><p>Three steps. Zero skill required.</p></div>
      <div class="benefit-list">
        <div class="benefit"><span class="benefit-num">Step 1</span><h3>Break in the beads</h3><p>Give it a few good squeezes out of the box so the clay-and-bead core loosens up.</p></div>
        <div class="benefit"><span class="benefit-num">Step 2</span><h3>Find your crunch</h3><p>Slow press for crackles, full squish for the big crunch. Desk, bag, or pocket — dealer's choice.</p></div>
        <div class="benefit"><span class="benefit-num">Step 3</span><h3>Gift it forward</h3><p>Grab a 2-pack — one for you, one for whoever steals yours first.</p></div>
      </div>
    </div></section>

    <div class="sticky-bar" id="stickyBar">
      <div class="sticky-inner">
        <div class="sticky-info"><strong>${p.name}</strong><span>${window.money(p.price)} · Free shipping</span></div>
        <button class="btn btn-primary" id="stickyAtc">Add to cart</button>
      </div>
    </div>`;

    document.body.classList.add("has-sticky");
    wireGallery(p.images.length);
    wireBuyBox(p);
    renderRelated(p);
  }

  function wireGallery(count) {
    const track = document.getElementById("galleryTrack");
    const dots = document.getElementById("galDots");
    let idx = 0;
    dots.innerHTML = Array.from({ length: count }, (_, i) =>
      `<button role="tab" aria-label="Image ${i + 1}" aria-current="${i === 0}"></button>`).join("");
    const dotBtns = [...dots.querySelectorAll("button")];
    function go(i) {
      idx = (i + count) % count;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dotBtns.forEach((d, j) => d.setAttribute("aria-current", String(j === idx)));
    }
    document.getElementById("galPrev").addEventListener("click", () => go(idx - 1));
    document.getElementById("galNext").addEventListener("click", () => go(idx + 1));
    dotBtns.forEach((d, j) => d.addEventListener("click", () => go(j)));
    // Touch swipe
    let startX = null;
    const frame = track.parentElement;
    frame.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  }

  function wireBuyBox(p) {
    let qty = 1;
    const out = document.getElementById("qtyOut");
    const atc = document.getElementById("atcBtn");
    function paint() {
      out.textContent = qty;
      atc.textContent = `Add to cart — ${window.money(p.price * qty)}`;
    }
    document.getElementById("qtyInc").addEventListener("click", () => { qty = Math.min(99, qty + 1); paint(); });
    document.getElementById("qtyDec").addEventListener("click", () => { qty = Math.max(1, qty - 1); paint(); });

    function addToCart(q, bundleId) {
      window.Cart.add({
        id: bundleId || `${p.slug}-single`,
        name: bundleId ? `${p.name} (${q}-pack)` : p.name,
        price: bundleId ? p.bundles.find((b) => b.id === bundleId).price / q : p.price,
        qty: q,
        image: (p.images[0] && p.images[0].src) || "",
      });
      // Squishy button feedback
      const btn = bundleId ? document.querySelector(`[data-bundle="${bundleId}"]`) : atc;
      if (btn) {
        btn.style.transform = "scale(0.9)";
        setTimeout(() => { btn.style.transform = ""; }, 160);
      }
      window.openDrawer();
    }
    atc.addEventListener("click", () => addToCart(qty));
    document.getElementById("stickyAtc").addEventListener("click", () => addToCart(1));
    document.querySelectorAll("[data-bundle]").forEach((b) => b.addEventListener("click", () => {
      const bundle = p.bundles.find((x) => x.id === b.dataset.bundle);
      addToCart(bundle.qty, bundle.id);
    }));

    // Sticky bar appears once the main CTA scrolls out of view.
    const bar = document.getElementById("stickyBar");
    const observer = new IntersectionObserver(([entry]) => {
      bar.classList.toggle("visible", !entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(atc);
  }

  function renderRelated(p) {
    const row = document.getElementById("relatedRow");
    row.innerHTML = p.related.map((slug) => {
      const r = window.getProduct(slug);
      if (!r) return "";
      const img = r.images[0]
        ? `<img src="${r.images[0].src}" alt="${r.images[0].alt}" loading="lazy">`
        : `<div class="media-placeholder">${r.name}<br>dropping soon</div>`;
      return `
        <a class="card" href="/p/${r.slug}">
          <div class="card-media">${img}<span class="badge">${r.badges[0] || ""}</span></div>
          <div class="card-body">
            <h3>${r.name}</h3>
            <div class="card-price-row"><span class="price">${window.money(r.price)}</span></div>
            <span class="btn btn-ghost btn-block card-cta">${r.status === "live" ? "Shop now" : "Peek at the drop"}</span>
          </div>
        </a>`;
    }).join("");
  }

  /* ---------- coming-soon product ---------- */

  function renderSoon(p) {
    document.getElementById("pdpRoot").innerHTML = `
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/#shop">Shop</a> &nbsp;/&nbsp; ${p.name}</nav>
      <div class="soon-hero">
        <img class="soon-art" src="/images/kawaii.png" alt="Smiling kawaii peanut character with flowers">
        <span class="badge">${p.badges[0] || "Coming soon"}</span>
        <h1 style="margin:14px 0 8px">${p.name}</h1>
        <p style="color:var(--ink-soft);font-size:1.08rem;margin-bottom:8px">${p.tagline}</p>
        <p style="color:var(--ink-soft);margin-bottom:24px">${p.blurb}</p>
        <p><a class="btn btn-primary" href="/p/${p.related[0]}">Shop the ${(window.getProduct(p.related[0]) || {}).name || "peanut"} instead</a></p>
        <p style="margin-top:16px;color:var(--ink-soft)">Good things take time. This one's worth the wait.</p>
      </div>
    </div>
    <section class="section"><div class="wrap">
      <div class="section-head"><h2>More squishies</h2></div>
      <div class="related-scroll" id="relatedRow"></div>
    </div></section>`;
    renderRelated(p);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
