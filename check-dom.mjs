import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
console.log('tonBalance in DOM:', h.includes('id="tonBalance"'));
console.log('tonCoins in DOM:', h.includes('id="tonCoins"'));
console.log('fuseSelected init:', h.includes('let fuseSelected ='));
// Find fuseSelected initialization
const idx = h.indexOf('let fuseSelected =');
if (idx >= 0) console.log('fuseSelected line:', h.slice(idx, h.indexOf('\r\n', idx)));
