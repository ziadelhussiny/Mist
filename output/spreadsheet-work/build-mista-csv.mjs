import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook } from '@oai/artifact-tool';

const root = path.resolve(import.meta.dirname, '..', '..');
const outputDir = path.join(root, 'output');
await fs.mkdir(outputDir, { recursive: true });

const headers = [
  'Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published',
  'Option1 Name','Option1 Value','Variant SKU','Variant Grams','Variant Inventory Tracker',
  'Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service','Variant Price',
  'Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Image Src','Image Position',
  'Image Alt Text','Gift Card','SEO Title','SEO Description','Variant Image','Variant Weight Unit',
  'Variant Tax Code','Cost per item','Status','Collection'
];

const products = [
  {handle:'noir-intense',title:'Noir Intense',collection:'Men',type:'Eau de Parfum',tags:'Men, Woody, Amber, Best Seller',desc:'A magnetic evening fragrance with bergamot, black pepper, cedarwood, amber, and musk.',seo:'Dark woods and warm amber create a confident signature scent.',variants:[['50 ml','MISTA-NOI-050',59,75,320,18,22],['100 ml','MISTA-NOI-100',89,110,520,12,35]]},
  {handle:'oud-elegance',title:'Oud Elegance',collection:'Unisex',type:'Eau de Parfum',tags:'Unisex, Oud, Oriental, Best Seller',desc:'Refined oud balanced with saffron, rose, sandalwood, and a soft vanilla finish.',seo:'A refined unisex oud fragrance with rose, saffron, and sandalwood.',variants:[['50 ml','MISTA-OUD-050',69,85,320,20,27],['100 ml','MISTA-OUD-100',99,125,520,14,42]]},
  {handle:'citrus-bleu',title:'Citrus Bleu',collection:'Men',type:'Eau de Parfum',tags:'Men, Citrus, Marine, Best Seller',desc:'Bright grapefruit and bergamot meet marine woods for an energetic clean finish.',seo:'A fresh men’s fragrance with citrus, marine notes, and clean woods.',variants:[['50 ml','MISTA-CIT-050',49,65,320,24,18],['100 ml','MISTA-CIT-100',79,95,520,16,29]]},
  {handle:'rose-allure',title:'Rose Allure',collection:'Women',type:'Eau de Parfum',tags:'Women, Floral, Rose, Best Seller',desc:'Velvety rose petals, pink pepper, peony, and white musk with a modern luminous trail.',seo:'A modern rose perfume for women with peony and white musk.',variants:[['50 ml','MISTA-ROS-050',55,70,320,22,20],['100 ml','MISTA-ROS-100',85,105,520,15,32]]},
  {handle:'amber-velvet',title:'Amber Velvet',collection:'Unisex',type:'Eau de Parfum',tags:'Unisex, Amber, Warm Spicy',desc:'Golden amber and tonka bean wrapped in cinnamon, labdanum, and smooth sandalwood.',seo:'A warm unisex amber perfume with tonka bean and sandalwood.',variants:[['50 ml','MISTA-AMB-050',65,80,320,18,25],['100 ml','MISTA-AMB-100',95,120,520,12,39]]},
  {handle:'floral-muse',title:'Floral Muse',collection:'Women',type:'Eau de Parfum',tags:'Women, Floral, Jasmine',desc:'Jasmine and orange blossom float over creamy woods and a clean, elegant musk base.',seo:'An elegant floral perfume with jasmine, orange blossom, and musk.',variants:[['50 ml','MISTA-FLO-050',57,72,320,21,21],['100 ml','MISTA-FLO-100',87,108,520,14,33]]},
  {handle:'midnight-oud',title:'Midnight Oud',collection:'Men',type:'Extrait de Parfum',tags:'Men, Oud, Leather, Intense',desc:'Smoky oud, leather, incense, and dark patchouli blended for exceptional depth and longevity.',seo:'An intense oud and leather extrait designed for evening wear.',variants:[['50 ml','MISTA-MID-050',75,95,320,16,31],['100 ml','MISTA-MID-100',105,135,520,10,48]]},
  {handle:'signature-discovery-set',title:'Signature Discovery Set',collection:'Discovery Sets',type:'Discovery Set',tags:'Unisex, Discovery Set, Gift',desc:'Four 10 ml Mista fragrances selected to help you discover your signature scent.',seo:'Explore four Mista fragrances in a gift-ready discovery set.',variants:[['4 × 10 ml','MISTA-DIS-040',45,55,280,30,16]]}
];

const productRows = [headers];
for (const product of products) {
  product.variants.forEach((variant, index) => {
    const [size, sku, price, compareAt, grams, quantity, cost] = variant;
    productRows.push([
      product.handle,index === 0 ? product.title:'',index === 0 ? `<p>${product.desc}</p>`:'',
      index === 0 ? 'Mista Perfume':'',index === 0 ? 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne':'',
      index === 0 ? product.type:'',index === 0 ? product.tags:'',index === 0 ? 'TRUE':'',
      'Size',size,sku,grams,'shopify',quantity,'deny','manual',price,compareAt,'TRUE','TRUE','',
      '','','FALSE',
      index === 0 ? `${product.title} | Mista Perfume`:'',index === 0 ? product.seo:'','',
      'g','',cost,'active',index === 0 ? product.collection:''
    ]);
  });
}

const collectionHeaders = ['Handle','Title','Description','Collection type','Condition','Sort order','Published','SEO title','SEO description'];
const collectionRows = [collectionHeaders,
  ['men','Men','Confident fragrances built around woods, spice, citrus, and depth.','Manual','','Best selling','TRUE','Men’s Perfume | Mista Perfume','Shop Mista fragrances for men.'],
  ['women','Women','Luminous floral, rose, musk, and amber compositions.','Manual','','Best selling','TRUE','Women’s Perfume | Mista Perfume','Shop Mista fragrances for women.'],
  ['unisex','Unisex','Distinctive fragrances designed beyond convention.','Manual','','Best selling','TRUE','Unisex Perfume | Mista Perfume','Shop unisex Mista fragrances.'],
  ['discovery-sets','Discovery Sets','Curated miniature fragrances for gifting and scent discovery.','Manual','','Best selling','TRUE','Perfume Discovery Sets | Mista Perfume','Explore Mista perfume discovery sets.'],
  ['best-sellers','Best Sellers','The fragrances customers return to most.','Automated','Product tag is equal to Best Seller','Best selling','TRUE','Best-Selling Perfumes | Mista Perfume','Discover Mista’s best-selling fragrances.']
];

function toCsv(rows) {
  return '\ufeff' + rows.map(row => row.map(value => {
    const text = value == null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text;
  }).join(',')).join('\r\n') + '\r\n';
}

// Build and inspect both artifacts with artifact-tool before saving the CSV files.
for (const [name, rows] of [['Products', productRows], ['Collections', collectionRows]]) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(name);
  sheet.getRange('A1').write(rows);
  workbook.recalculate();
  const lastCol = String.fromCharCode(64 + Math.min(rows[0].length, 26));
  const check = await workbook.inspect({kind:'table',range:`${name}!A1:${lastCol}${Math.min(rows.length,6)}`,include:'values',tableMaxRows:6,tableMaxCols:32,maxChars:8000});
  console.log(check.ndjson);
}

await fs.writeFile(path.join(outputDir, 'mista-products-shopify.csv'), toCsv(productRows), 'utf8');
await fs.writeFile(path.join(outputDir, 'mista-collections.csv'), toCsv(collectionRows), 'utf8');

for (const [file, sheetName, expectedRows, lastColumn] of [
  ['mista-products-shopify.csv','Products import',productRows.length,'AF'],
  ['mista-collections.csv','Collections reference',collectionRows.length,'I'],
]) {
  const savedText = await fs.readFile(path.join(outputDir, file), 'utf8');
  if (!savedText.startsWith('\ufeff')) throw new Error(`${file} is not UTF-8 BOM encoded`);
  const imported = await Workbook.fromCSV(savedText, {sheetName});
  const inspection = await imported.inspect({kind:'table',range:`${sheetName}!A1:${lastColumn}${expectedRows}`,include:'values',tableMaxRows:3,tableMaxCols:32,maxChars:6000});
  console.log(inspection.ndjson);
}

console.log(JSON.stringify({products: products.length, variants: productRows.length - 1, collections: collectionRows.length - 1}));
