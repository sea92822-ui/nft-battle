import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
const i = h.indexOf('topBalance');
const start = h.lastIndexOf('\r\n', i - 200);
const end = h.indexOf('\r\n', i + 300);
const section = h.slice(start, end);
// Find the closing div of the balance section
const divEnd = section.indexOf('</div>');
console.log('Section up to end of balance div:');
console.log(section.slice(0, divEnd + 6));
