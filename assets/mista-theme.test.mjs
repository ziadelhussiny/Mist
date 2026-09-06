import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { findVariant, formatMoney, buildCartPayload } from './mista-theme.js';

const themeCss = readFileSync(new URL('./mista-theme.css', import.meta.url), 'utf8');
const headerLiquid = readFileSync(new URL('../sections/mista-header.liquid', import.meta.url), 'utf8');
const optimizedVisuals = [
  'mista-hero-desktop.webp',
  'mista-hero-mobile.webp',
  'mista-promo-desktop.webp',
  'mista-promo-mobile.webp',
  'mista-about-desktop.webp',
  'mista-about-mobile.webp',
  'mista-contact-desktop.webp',
  'mista-contact-mobile.webp',
  'mista-product-black.webp',
  'mista-product-pink.webp',
  'mista-product-orange.webp',
  'mista-product-turquoise.webp'
];
const responsiveVisuals = [
  ...['hero', 'promo', 'about', 'contact'].flatMap((name) => [
    `mista-${name}-desktop-960.webp`,
    `mista-${name}-desktop-1440.webp`,
    `mista-${name}-mobile-480.webp`,
    `mista-${name}-mobile-800.webp`
  ]),
  ...['black', 'pink', 'orange', 'turquoise'].flatMap((name) => [
    `mista-product-${name}-360.webp`,
    `mista-product-${name}-640.webp`,
    `mista-product-${name}-900.webp`
  ])
];

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

test('bundled storefront visuals use WebP and stay inside the 250 KB image budget', () => {
  for (const filename of optimizedVisuals) {
    const asset = new URL(`./${filename}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${filename} should exist`);
    assert.ok(statSync(asset).size <= 250_000, `${filename} exceeds 250 KB`);
  }
});

test('Mista Liquid fallbacks never ship the multi-megabyte PNG assets', () => {
  const sectionsDirectory = new URL('../sections/', import.meta.url);
  const sectionSources = readdirSync(sectionsDirectory)
    .filter((filename) => filename.startsWith('mista-') && filename.endsWith('.liquid'))
    .map((filename) => readFileSync(new URL(filename, sectionsDirectory), 'utf8'));
  const productCard = readFileSync(new URL('../snippets/mista-product-card.liquid', import.meta.url), 'utf8');
  const source = [...sectionSources, productCard].join('\n');

  assert.doesNotMatch(source, /mista-(?:hero|promo|about|contact|product)-[^'"\s]+\.png/);
  assert.match(source, /mista-hero-desktop\.webp/);
  assert.match(source, /mista-product-black\.webp/);
});

test('bundled fallback images provide responsive sizes instead of one oversized source', () => {
  for (const filename of responsiveVisuals) {
    const asset = new URL(`./${filename}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${filename} should exist`);
    assert.ok(statSync(asset).size <= 150_000, `${filename} exceeds 150 KB`);
  }

  const hero = readFileSync(new URL('../sections/mista-hero.liquid', import.meta.url), 'utf8');
  const collections = readFileSync(new URL('../sections/mista-collections.liquid', import.meta.url), 'utf8');
  assert.match(hero, /mista-hero-mobile-480\.webp[^\n]+480w/);
  assert.match(hero, /mista-hero-desktop-960\.webp[^\n]+960w/);
  assert.match(collections, /append: '-360\.webp'/);
  assert.match(collections, /default_collection_image_360[^\n]+360w/);
});

test('storefront loads production-minified stylesheets', () => {
  const stylesheets = readFileSync(new URL('../snippets/stylesheets.liquid', import.meta.url), 'utf8');
  const layout = readFileSync(new URL('../layout/theme.liquid', import.meta.url), 'utf8');

  for (const [sourceName, minifiedName] of [
    ['base.css', 'base.min.css'],
    ['mista-theme.css', 'mista-theme.min.css'],
  ]) {
    const source = new URL(`./${sourceName}`, import.meta.url);
    const minified = new URL(`./${minifiedName}`, import.meta.url);
    assert.equal(existsSync(minified), true, `${minifiedName} should exist`);
    assert.ok(statSync(minified).size < statSync(source).size, `${minifiedName} should be smaller than ${sourceName}`);
  }

  assert.match(stylesheets, /'base\.min\.css'/);
  assert.match(layout, /'mista-theme\.min\.css'/);
});

test('featured products automatically use the store catalog when no collection is selected', () => {
  const featuredProducts = readFileSync(new URL('../sections/mista-featured-products.liquid', import.meta.url), 'utf8');

  assert.match(featuredProducts, /if featured_collection == blank or featured_collection\.products_count == 0/);
  assert.match(featuredProducts, /assign featured_collection = collections\.all/);
  assert.match(featuredProducts, /for product in featured_collection\.products/);
});

test('collection hero copy keeps the global page gutter on desktop and mobile', () => {
  assert.match(
    themeCss,
    /\.mista-collection-hero__content\s*\{[^}]*width:\s*var\(--mista-page\);[^}]*margin-inline:\s*auto;/
  );
});
