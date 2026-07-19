import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');

// Check ton_case
const i = h.indexOf("id: 'ton_case'");
const start = h.lastIndexOf('\n', i - 30);
const end = h.indexOf(',\n', i) + 2;
console.log('=== ton_case definition ===');
console.log(h.slice(start, end));

// Check price display
const j = h.indexOf("case-card-price");
const line = h.slice(j, j + 150);
console.log('\n=== Case card price line ===');
console.log(line);

// Check openCases
const k = h.indexOf("function openCases(caseId");
const kEnd = h.indexOf('\nfunction ', k + 1);
if (kEnd < 0) kEnd = k + 1200;
console.log('\n=== openCases function ===');
console.log(h.slice(k, kEnd > h.length ? h.length : kEnd));
