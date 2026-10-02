/* Home page: renders shop grid from the catalog. */
(function () {
  "use strict";

  function init() {
    const grid = document.getElementById("shopGrid");
    if (!grid) return;
    const live = window.CATALOG.filter((p) => p.status === "live");
    const soon = window.CATALOG.filter((p) => p.status !== "live");

    grid.innerHTML = [...live, ...soon].map((p) => {
      const img = p.images[0]
        ? `<img src="${p.images[0].src}" alt="${p.images[0].alt}" loading="lazy">`
        : `<div class="media-placeholder">${p.name}<br>dropping soon</div>`;
      return `
        <a class="card" href="/p/${p.slug}">
          <div class="card-media">${img}${p.badges[0] ? `<span class="badge ${p.status === "live" ? "badge-accent" : ""}">${p.badges[0]}</span>` : ""}</div>
          <div class="card-body">
            ${p.rating ? `<div>${window.stars(p.rating)}</div>` : ""}
            <h3>${p.name}</h3>
            <p class="card-tag">${p.tagline}</p>
            <div class="card-price-row"><span class="price">${window.money(p.price)}</span>
              ${p.compareAt ? `<span class="price-compare">${window.money(p.compareAt)}</span>` : ""}</div>
            <span class="btn ${p.status === "live" ? "btn-dark" : "btn-ghost"} btn-block card-cta">${p.status === "live" ? "Shop now" : "Peek at the drop"}</span>
          </div>
        </a>`;
    }).join("");

    const featured = live[0];
    if (featured) {
      const hero = document.getElementById("heroImg");
      if (hero && featured.images[0]) {
        hero.src = featured.images[0].src;
        hero.alt = featured.images[0].alt;
      }
      const heroCta = document.getElementById("heroCta");
      if (heroCta) heroCta.href = `/p/${featured.slug}`;
      const heroProof = document.getElementById("heroProof");
      if (heroProof) heroProof.innerHTML = `Crunchy bead-filled · Free shipping · No sketchy stuff`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
