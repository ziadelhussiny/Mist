export function findVariant(variants, options) {
  return variants.find((variant) => variant.options.every((option, index) => option === options[index]));
}

export function formatMoney(cents, format = '${{amount}}') {
  const value = Number(cents || 0);
  const amount = (value / 100).toFixed(2);
  const noDecimals = String(Math.round(value / 100));
  return format.replace(/{{\s*amount_no_decimals\s*}}/, noDecimals).replace(/{{\s*amount\s*}}/, amount);
}

export function buildCartPayload(id, quantity) {
  return { items: [{ id: Number(id), quantity: Math.max(1, Number(quantity) || 1) }] };
}

const rootUrl = () => window.Shopify?.routes?.root || '/';

async function refreshCartDrawer(open = false) {
  const response = await fetch(`${rootUrl()}?sections=cart-drawer-section`);
  const sections = await response.json();
  const current = document.getElementById('shopify-section-cart-drawer-section');
  if (current && sections['cart-drawer-section']) current.outerHTML = sections['cart-drawer-section'];
  const cart = await fetch(`${rootUrl()}cart.js`).then((result) => result.json());
  document.querySelectorAll('[data-mista-cart-count]').forEach((node) => {
    node.textContent = cart.item_count;
    node.hidden = cart.item_count === 0;
  });
  if (open) requestAnimationFrame(() => document.querySelector('#cart-drawer')?.open?.());
}

function initMenu() {
  const toggle = document.querySelector('[data-mista-menu-toggle]');
  const drawer = document.querySelector('[data-mista-menu]');
  if (!toggle || !drawer) return;
  const close = () => {
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.removeAttribute('data-mista-menu-open');
  };
  toggle.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.toggleAttribute('data-mista-menu-open', open);
  });
  drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (event) => event.key === 'Escape' && close());
}

function initAccordions() {
  document.querySelectorAll('[data-mista-accordion-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });
}

function initQuantity() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mista-quantity]');
    if (!button) return;
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input) return;
    const next = Math.max(Number(input.min || 1), Number(input.value || 1) + Number(button.dataset.mistaQuantity));
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function initGalleries() {
  document.querySelectorAll('[data-mista-gallery]').forEach((gallery) => {
    const main = gallery.querySelector('[data-mista-gallery-main]');
    gallery.querySelectorAll('[data-mista-gallery-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (!main) return;
        main.src = thumb.dataset.src;
        main.srcset = thumb.dataset.srcset || '';
        main.alt = thumb.dataset.alt || '';
        gallery.querySelectorAll('[data-mista-gallery-thumb]').forEach((item) => item.setAttribute('aria-current', 'false'));
        thumb.setAttribute('aria-current', 'true');
      });
    });
  });
}

function initVariantPickers() {
  document.querySelectorAll('[data-mista-product]').forEach((product) => {
    const data = JSON.parse(product.querySelector('[data-mista-variants]')?.textContent || '[]');
    const idInput = product.querySelector('[name="id"]');
    const price = product.querySelector('[data-mista-price]');
    const compare = product.querySelector('[data-mista-compare-price]');
    const add = product.querySelector('[data-mista-add]');
    const update = () => {
      const options = [...product.querySelectorAll('[data-mista-option]:checked')].map((input) => input.value);
      const variant = findVariant(data, options);
      if (!variant || !idInput) return;
      idInput.value = variant.id;
      if (price) price.textContent = formatMoney(variant.price, product.dataset.moneyFormat);
      if (compare) {
        compare.textContent = variant.compare_at_price ? formatMoney(variant.compare_at_price, product.dataset.moneyFormat) : '';
        compare.hidden = !variant.compare_at_price;
      }
      if (add) {
        add.disabled = !variant.available;
        add.textContent = variant.available ? add.dataset.availableLabel : add.dataset.soldLabel;
      }
    };
    product.querySelectorAll('[data-mista-option]').forEach((input) => input.addEventListener('change', update));
    update();
  });
}

function initAjaxCart() {
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-mista-ajax-cart]');
    if (!form || event.submitter?.name === 'checkout') return;
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = button.dataset.loadingLabel || 'Adding…'; }
    try {
      const data = new FormData(form);
      const response = await fetch(`${rootUrl()}cart/add.js`, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      if (!response.ok) throw new Error((await response.json()).description || 'Unable to add this item.');
      if (button) button.textContent = button.dataset.addedLabel || 'Added';
      await refreshCartDrawer(true);
    } catch (error) {
      const status = form.querySelector('[data-mista-form-status]');
      if (status) status.textContent = error.message;
      if (button) button.textContent = original;
    } finally {
      setTimeout(() => { if (button) { button.disabled = false; button.textContent = original; } }, 900);
    }
  });
}

function initWishlist() {
  const key = 'mista-wishlist';
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { saved = []; }
  document.querySelectorAll('[data-mista-wishlist]').forEach((button) => {
    const handle = button.dataset.mistaWishlist;
    button.setAttribute('aria-pressed', String(saved.includes(handle)));
    button.addEventListener('click', () => {
      saved = saved.includes(handle) ? saved.filter((item) => item !== handle) : [...saved, handle];
      localStorage.setItem(key, JSON.stringify(saved));
      button.setAttribute('aria-pressed', String(saved.includes(handle)));
    });
  });
}

function initDiscount() {
  document.querySelectorAll('[data-mista-discount-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const code = new FormData(form).get('discount');
      if (code) window.location.assign(`${rootUrl()}discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(`${rootUrl()}cart`)}`);
    });
  });
}

function init() {
  initMenu(); initAccordions(); initQuantity(); initGalleries(); initVariantPickers(); initAjaxCart(); initWishlist(); initDiscount();
}

if (typeof document !== 'undefined') {
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  document.addEventListener('shopify:section:load', init);
}
