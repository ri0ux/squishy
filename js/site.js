/* Shared storefront logic: icons, cart + drawer, toast, accordions. */
(function () {
  "use strict";

  /* Inline SVG icons (no emoji) */
  const ICONS = {
    truck: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h13v9H1z"/><path d="M14 11h4l4 4v2h-8z"/><circle cx="6" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',
    shield: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
    sparkle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
    bag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h15l-1.5 12h-12z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    peanut: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3a2a26" stroke-width="2" stroke-linecap="round"><path d="M10 3C6 3 4 6.5 4 9.5c0 2 1 3.2 2 4.2-.6 2.7.4 7.3 4.5 7.3 3.4 0 4.7-2.8 4.2-5.7 1.9-1 3.3-2.9 3.3-5.3C18 5.8 14.5 3 10 3z" fill="#3a2a26" opacity="0.14"/><path d="M9.5 7.5c.8-.4 1.7.6 1.2 1.4M12.5 13.5c.9-.3 1.6.8 1 1.5"/></svg>',
  };
  window.icon = (name) => ICONS[name] || "";

  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = ICONS[el.dataset.icon] || "";
  });

  /* Stars helper: rating out of 5 */
  window.stars = function (rating) {
    const full = Math.round(Number(rating) || 0);
    let out = "";
    for (let i = 1; i <= 5; i++) out += i <= full ? "★" : '<span class="off">★</span>';
    return `<span class="stars" role="img" aria-label="Rated ${rating} out of 5 stars">${out}</span>`;
  };

  /* Toast */
  let toastTimer = null;
  window.toast = function (msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  };

  /* Cart state (localStorage) */
  const KEY = "tsc-cart-v1";
  const Cart = {
    items: [],
    load() {
      try {
        this.items = JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        this.items = [];
      }
      return this.items;
    },
    save() {
      localStorage.setItem(KEY, JSON.stringify(this.items));
      renderCartUI();
    },
    add(line) {
      const found = this.items.find((i) => i.id === line.id);
      if (found) found.qty += line.qty;
      else this.items.push({ ...line });
      this.save();
    },
    setQty(id, qty) {
      const found = this.items.find((i) => i.id === id);
      if (!found) return;
      found.qty = qty;
      if (found.qty <= 0) this.items = this.items.filter((i) => i.id !== id);
      this.save();
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
      this.save();
    },
    count() {
      return this.items.reduce((n, i) => n + i.qty, 0);
    },
    subtotal() {
      return this.items.reduce((n, i) => n + i.qty * i.price, 0);
    },
  };
  window.Cart = Cart;

  function ensureDrawer() {
    if (document.getElementById("cartDrawer")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="scrim" id="scrim"></div>
      <aside class="drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div class="drawer-head">
          <h2>Your squishies <span id="drawerCount"></span></h2>
          <button class="drawer-close" id="drawerClose" aria-label="Close cart">×</button>
        </div>
        <div class="drawer-items" id="drawerItems"></div>
        <div class="drawer-foot" id="drawerFoot"></div>
      </aside>`;
    document.body.appendChild(wrap);
    document.getElementById("drawerClose").addEventListener("click", closeDrawer);
    document.getElementById("scrim").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    // Focus trap: keep tab inside the open drawer.
    document.getElementById("cartDrawer").addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusables = [...document.getElementById("cartDrawer").querySelectorAll("button")].filter((b) => !b.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  window.openDrawer = function () {
    ensureDrawer();
    renderCartUI();
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("scrim").classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById("drawerClose").focus();
  };
  window.closeDrawer = function () {
    const d = document.getElementById("cartDrawer");
    if (!d) return;
    d.classList.remove("open");
    document.getElementById("scrim").classList.remove("open");
    document.body.style.overflow = "";
  };

  function renderCartUI() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = Cart.count();
      el.style.display = Cart.count() ? "" : "none";
    });
    const itemsEl = document.getElementById("drawerItems");
    if (!itemsEl) return;
    const count = Cart.count();
    document.getElementById("drawerCount").textContent = count ? `(${count})` : "";

    const sub = Cart.subtotal();

    if (!Cart.items.length) {
      itemsEl.innerHTML = `<div class="cart-empty">Your cart is feeling flat.<br>Let's fix that.<br><button class="btn btn-dark" data-close-shop>Shop squishies</button></div>`;
      document.getElementById("drawerFoot").innerHTML = "";
    } else {
      itemsEl.innerHTML = Cart.items.map((i) => `
        <div class="cart-item">
          <img src="${i.image}" alt="" loading="lazy">
          <div>
            <h3>${i.name}</h3>
            <div class="unit">${window.money(i.price)} each</div>
            <div class="row">
              <span class="mini-qty">
                <button data-dec="${i.id}" aria-label="Decrease quantity">−</button>
                <output>${i.qty}</output>
                <button data-inc="${i.id}" aria-label="Increase quantity">+</button>
              </span>
              <button class="cart-remove" data-del="${i.id}">Remove</button>
            </div>
          </div>
          <div class="cart-line-total">${window.money(i.price * i.qty)}</div>
        </div>`).join("");
      document.getElementById("drawerFoot").innerHTML = `
        <div class="subtotal-row"><span>Subtotal</span><strong>${window.money(sub)}</strong></div>
        <div class="trust-micro" style="margin:0 0 12px">Free tracked shipping included</div>
        <button class="btn btn-primary btn-block" id="checkoutBtn">${window.icon("lock")} Checkout — ${window.money(sub)}</button>`;
      document.getElementById("checkoutBtn").addEventListener("click", () => {
        window.toast("Checkout opens soon — we're putting the final squish on payments.");
      });
    }

    itemsEl.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => {
      const item = Cart.items.find((i) => i.id === b.dataset.inc);
      Cart.setQty(b.dataset.inc, item.qty + 1);
    }));
    itemsEl.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => {
      const item = Cart.items.find((i) => i.id === b.dataset.dec);
      Cart.setQty(b.dataset.dec, item.qty - 1);
    }));
    itemsEl.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => Cart.remove(b.dataset.del)));
    const shopBtn = itemsEl.querySelector("[data-close-shop]");
    if (shopBtn) shopBtn.addEventListener("click", () => { closeDrawer(); window.location.href = "/"; });
  }

  /* Accordions (event delegation so rendered content works too) */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".acc-btn");
    if (!btn) return;
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    if (panel) panel.style.maxHeight = open ? "0px" : panel.scrollHeight + "px";
  });
  window.accHTML = function (id, q, a, openFirst) {
    return `
      <div class="acc">
        <button class="acc-btn" aria-expanded="${openFirst ? "true" : "false"}" aria-controls="${id}">
          <span>${q}</span><span class="plus" aria-hidden="true">+</span>
        </button>
        <div class="acc-panel" id="${id}"${openFirst ? ' style="max-height:none"' : ""}>
          <div class="acc-panel-inner">${a}</div>
        </div>
      </div>`;
  };

  /* No mailing list by design — no email capture anywhere on the site. */

  /* Header cart buttons */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-cart]")) window.openDrawer();
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  Cart.load();
  renderCartUI();
})();
