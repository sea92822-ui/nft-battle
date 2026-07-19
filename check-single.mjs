import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf("if (spendCoins(c.cost)) {");
const start = h.lastIndexOf('\nfunction ', idx);
const end = h.indexOf('\nfunction ', idx + 1);
console.log('=== Full function containing single-click handler ===');
console.log(h.slice(start, end < 0 ? idx + 500 : end));
