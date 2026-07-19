import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const NL = '\r\n';
const jelly = fs.readFileSync('b64_jelly.txt', 'utf8').trim();
const thunderbird = fs.readFileSync('b64_thunderbird.txt', 'utf8').trim();
const lucifer = fs.readFileSync('b64_lucifer.txt', 'utf8').trim();
const ketton = fs.readFileSync('b64_ketton.txt', 'utf8').trim();
const snopdog = fs.readFileSync('b64_snopdog.txt', 'utf8').trim();

// 1. Add image constants after WATER_SNAKE_IMG base64 declaration
const imgConsts = [
`const JELLY_BUNNY_IMG = '${jelly}';${NL}`,
`const CRYSTAL_EAGLE_THUNDERBIRD_IMG = '${thunderbird}';${NL}`,
`const CRYSTAL_EAGLE_LUCIFER_IMG = '${lucifer}';${NL}`,
`const INPUT_KET_TON_IMG = '${ketton}';${NL}`,
`const SNOP_DOG_GOLD_IMG = '${snopdog}';${NL}`,
].join('');
const wsIdx = html.indexOf('var WATER_SNAKE_IMG');
const semiAfterWs = html.indexOf(';', wsIdx);
const afterSemi = html.indexOf(NL, semiAfterWs);
const insertPoint1 = afterSemi + NL.length;
html = html.slice(0, insertPoint1) + NL + imgConsts + html.slice(insertPoint1);
console.log('1. Added image constants');

// 2. Add to ICON_FALLBACK
const fbTarget = `    'WATER_SNAKE_IMG': '🐍',`;
const fbInsert = `    'JELLY_BUNNY_IMG': '🐰',${NL}    'CRYSTAL_EAGLE_THUNDERBIRD_IMG': '🦅',${NL}    'CRYSTAL_EAGLE_LUCIFER_IMG': '😈',${NL}    'INPUT_KET_TON_IMG': '💎',${NL}    'SNOP_DOG_GOLD_IMG': '🐕',`;
html = html.replace(fbTarget, fbTarget + NL + fbInsert);
console.log('2. Added fallback icons');

// 3. Add to ICON_VALUES
html = html.replace('BITE_ME_IMG};', 'BITE_ME_IMG, JELLY_BUNNY_IMG, CRYSTAL_EAGLE_THUNDERBIRD_IMG, CRYSTAL_EAGLE_LUCIFER_IMG, INPUT_KET_TON_IMG, SNOP_DOG_GOLD_IMG};');
console.log('3. Added to ICON_VALUES');

// 4. Add to ICON_ALTS
const altsTarget = "BITE_ME_IMG:'🦇'};";
const altsNew = "BITE_ME_IMG:'🦇', JELLY_BUNNY_IMG:'🐰', CRYSTAL_EAGLE_THUNDERBIRD_IMG:'🦅', CRYSTAL_EAGLE_LUCIFER_IMG:'😈', INPUT_KET_TON_IMG:'💎', SNOP_DOG_GOLD_IMG:'🐕'};";
html = html.replace(altsTarget, altsNew);
console.log('4. Added to ICON_ALTS');

// 5. Add ITEMS_DATA entries
const newItems = [
  `    { id: 'jelly_bunny', name: 'Jelly Bunny', icon: 'JELLY_BUNNY_IMG', rarity: 5, power: 10001, type: 'ton_case' },${NL}`,
  `    { id: 'crystal_eagle_thunderbird', name: 'Crystal Eagle Thunderbird', icon: 'CRYSTAL_EAGLE_THUNDERBIRD_IMG', rarity: 5, power: 404404, type: 'ton_case' },${NL}`,
  `    { id: 'crystal_eagle_thunderbird_rare', name: 'Crystal Eagle Thunderbird \u2728', icon: 'CRYSTAL_EAGLE_THUNDERBIRD_IMG', rarity: 5, power: 73773773773, type: 'ton_case' },${NL}`,
  `    { id: 'crystal_eagle_lucifer', name: 'Crystal Eagle Lucifer', icon: 'CRYSTAL_EAGLE_LUCIFER_IMG', rarity: 5, power: 99999999999, type: 'ton_case' },${NL}`,
  `    { id: 'input_ket_ton', name: 'Input Ket Ton', icon: 'INPUT_KET_TON_IMG', rarity: 5, power: 5555555554, type: 'ton_case' },${NL}`,
  `    { id: 'snop_dog_gold', name: 'Snop Dog Gold', icon: 'SNOP_DOG_GOLD_IMG', rarity: 5, power: 6060606060, type: 'ton_case' },${NL}`,
].join('');
const itemsTarget = `    { id: 'bite_me', name: 'Bite Me', icon: 'BITE_ME_IMG', rarity: 5, power: 300, type: 'winter' },`;
html = html.replace(itemsTarget, itemsTarget + NL + newItems);
console.log('5. Added ITEMS_DATA');

// 6. Add ITEM_PRICES
html = html.replace('bite_me: 300,};', `bite_me: 300,${NL}  jelly_bunny: 10001,${NL}  crystal_eagle_thunderbird: 404404,${NL}  crystal_eagle_thunderbird_rare: 73773773773,${NL}  crystal_eagle_lucifer: 99999999999,${NL}  input_ket_ton: 5555555554,${NL}  snop_dog_gold: 6060606060,};`);
console.log('6. Added ITEM_PRICES');

// 7. Add new case before winter_case
const newCase = `    {${NL}        id: 'ton_case', name: '\u{1F48E} 30k TON', icon: '\u{1F48E}', cost: 30000, free: false,${NL}        colors: ['#f59e0b','#f59e0b','#f59e0b','#f59e0b','#f59e0b','#f59e0b'],${NL}        weights: [0, 0, 0, 0, 0, 100],${NL}        items: [${NL}            { id: 'jelly_bunny', weight: 80 },${NL}            { id: 'crystal_eagle_thunderbird', weight: 20 },${NL}            { id: 'crystal_eagle_thunderbird_rare', weight: 0.18 },${NL}            { id: 'crystal_eagle_lucifer', weight: 0.04 },${NL}            { id: 'input_ket_ton', weight: 2.5 },${NL}            { id: 'snop_dog_gold', weight: 0.5 },${NL}        ]${NL}    },${NL}`;
html = html.replace(`    {${NL}        id: 'winter_case', name: '\u2744\uFE0F WINTER'`, newCase + `    {${NL}        id: 'winter_case', name: '\u2744\uFE0F WINTER'`);
console.log('7. Added new case');

fs.writeFileSync('index.html', html);
console.log('All edits complete!');
