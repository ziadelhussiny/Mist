import test from 'node:test';
import assert from 'node:assert/strict';
import { findVariant, formatMoney, buildCartPayload } from './mista-theme.js';

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
