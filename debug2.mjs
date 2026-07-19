import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
// Check for key strings
console.log('jelly_bunny in ITEM_PRICES:', h.includes('jelly_bunny:'));
console.log('has old openCases:', h.includes("if (!spendCoins(c.cost * need))"));
console.log('has old single-click:', h.includes("if (spendCoins(c.cost)) {"));

// Check what spendCoins looks like now
const idx = h.indexOf('function spendCoins');
if (idx >= 0) {
  const end = h.indexOf('\nfunction ', idx + 5);
  console.log('\nspendCoins section:');
  console.log(h.slice(idx, end < 0 ? idx + 200 : end));
}

// Check openCases
const ocIdx = h.indexOf('function openCases');
if (ocIdx >= 0) {
  const end = h.indexOf('\nfunction ', ocIdx + 5);
  console.log('\nopenCases section:');
  console.log(h.slice(ocIdx, end < 0 ? ocIdx + 400 : end));
}
