import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');

// Check spendCoins area
const si = h.indexOf('function spendCoins');
const sEnd = h.indexOf('\nfunction ', si + 5);
console.log('spendCoins and after:');
console.log(h.slice(si, sEnd < 0 ? si + 400 : sEnd + 50));

// Check openCases
const oi = h.indexOf('function openCases');
const oEnd = h.indexOf('\nfunction ', oi + 5);
console.log('\nopenCases:');
console.log(h.slice(oi, oEnd < 0 ? oi + 500 : oEnd));

// Check ITEM_PRICES
const pi = h.indexOf('const ITEM_PRICES');
const pEnd = h.indexOf('\nfunction ', pi + 5);
console.log('\nITEM_PRICES area:');
console.log(h.slice(pi, pEnd < 0 ? pi + 300 : pEnd));
