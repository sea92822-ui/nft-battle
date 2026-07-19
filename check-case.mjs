import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
const i = h.indexOf("id: 'surfing_case'");
const start = h.lastIndexOf('\r\n    {\r\n', i - 50);
const end = h.indexOf('\r\n    },', start) + 7;
console.log(h.slice(start, end));
