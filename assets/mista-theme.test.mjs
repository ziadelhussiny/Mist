import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findVariant, formatMoney, buildCartPayload } from './mista-theme.js';

const themeCss = readFileSync(new URL('./mista-theme.css', import.meta.url), 'utf8');
const headerLiquid = readFileSync(new URL('../sections/mista-header.liquid', import.meta.url), 'utf8');

test('findVariant resolves the exact selected option combination', () => {
  const variants = [
    { id: 11, options: ['50 ml', 'Black'], available: true },
    { id: 12, options: ['100 ml', 'Black'], available: false }
  ];
  assert.equal(findVariant(variants, ['100 ml', 'Black']).id, 12);
  assert.equal(findVariant(variants, ['30 ml', 'Black']), undefined);
});

test('formatMoney replaces Shopify amount tokens', () => {
  assert.equal(formatMoney(5500, '${{amount}}'), '$55.00');
  assert.equal(formatMoney(5500, '{{amount_no_decimals}} EGP'), '55 EGP');
});

test('buildCartPayload normalizes variant and quantity values', () => {
  assert.deepEqual(buildCartPayload('812345', '2'), {
    items: [{ id: 812345, quantity: 2 }]
  });
  assert.deepEqual(buildCartPayload('812345', '0'), {
    items: [{ id: 812345, quantity: 1 }]
  });
});

test('header stays visible while scrolling up or down on desktop and mobile', () => {
  assert.match(
    themeCss,
    /#header-group:has\(\.mista-header-section\)\s*\{[^}]*display:\s*contents;/
  );
  assert.match(
    themeCss,
    /\.mista-header-section\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/
  );
});

test('editorial hero copy is centered inside the page gutter instead of touching the viewport edge', () => {
  assert.match(
    themeCss,
    /\.mista-editorial-hero__content\s*\{[^}]*width:\s*var\(--mista-page\);[^}]*margin-inline:\s*auto;/
  );
});

test('About us is injected when the selected Shopify navigation does not contain it', () => {
  assert.match(headerLiquid, /assign menu_has_about = false/);
  assert.match(headerLiquid, /unless menu_has_about[\s\S]*data-mista-about-link/);
  assert.match(headerLiquid, /pages\['about-us'\]/);
});
