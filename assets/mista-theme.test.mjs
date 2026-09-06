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

test('header scrolls with the document on desktop and mobile instead of staying sticky', () => {
  assert.match(
    themeCss,
    /\.mista-header-wrap\s*\{[^}]*position:\s*relative;/
  );
  assert.doesNotMatch(themeCss, /\.mista-header-wrap\s*\{[^}]*position:\s*sticky;/);
  assert.match(
    themeCss,
    /\.mista-mobile-menu\s*\{[^}]*position:\s*absolute;[^}]*inset-block-start:\s*100%;/
  );
});

test('About us is injected when the selected Shopify navigation does not contain it', () => {
  assert.match(headerLiquid, /assign menu_has_about = false/);
  assert.match(headerLiquid, /unless menu_has_about[\s\S]*data-mista-about-link/);
  assert.match(headerLiquid, /pages\['about-us'\]/);
});
