import fs from 'fs';
const NL = '\r\n';
let h = fs.readFileSync('index.html', 'utf8');

const jelly = fs.readFileSync('b64_jelly.txt', 'utf8').trim();
const thunderbird = fs.readFileSync('b64_thunderbird.txt', 'utf8').trim();
const lucifer = fs.readFileSync('b64_lucifer.txt', 'utf8').trim();
const ketton = fs.readFileSync('b64_ketton.txt', 'utf8').trim();
const snopdog = fs.readFileSync('b64_snopdog.txt', 'utf8').trim();

// 1. IMAGE CONSTANTS
const wsIdx = h.indexOf('var WATER_SNAKE_IMG');
const semiAfterWs = h.indexOf(';', wsIdx);
const afterSemi = h.indexOf(NL, semiAfterWs);
const ip = afterSemi + NL.length;
const imgBlock = NL + 
`const JELLY_BUNNY_IMG = '${jelly}';${NL}` +
`const CRYSTAL_EAGLE_THUNDERBIRD_IMG = '${thunderbird}';${NL}` +
`const CRYSTAL_EAGLE_LUCIFER_IMG = '${lucifer}';${NL}` +
`const INPUT_KET_TON_IMG = '${ketton}';${NL}` +
`const SNOP_DOG_GOLD_IMG = '${snopdog}';${NL}`;
h = h.slice(0, ip) + imgBlock + h.slice(ip);
console.log('1 OK');

// 2. ICON_FALLBACK - add after WATER_SNAKE_IMG line
const fbTarget = "    'WATER_SNAKE_IMG': '";
const fbIdx = h.indexOf(fbTarget);
const fbLineEnd = h.indexOf(NL, fbIdx);
const fbLine = h.slice(fbIdx, fbLineEnd);
const fbInsert = NL +
  "    'JELLY_BUNNY_IMG': '\u{1F430}'," + NL +
  "    'CRYSTAL_EAGLE_THUNDERBIRD_IMG': '\u{1F985}'," + NL +
  "    'CRYSTAL_EAGLE_LUCIFER_IMG': '\u{1F608}'," + NL +
  "    'INPUT_KET_TON_IMG': '\u{1F48E}'," + NL +
  "    'SNOP_DOG_GOLD_IMG': '\u{1F415}'";
h = h.replace(fbLine, fbLine + fbInsert);
console.log('2 OK');

// 3. ICON_VALUES
h = h.replace('BITE_ME_IMG};', 'BITE_ME_IMG, JELLY_BUNNY_IMG, CRYSTAL_EAGLE_THUNDERBIRD_IMG, CRYSTAL_EAGLE_LUCIFER_IMG, INPUT_KET_TON_IMG, SNOP_DOG_GOLD_IMG};');
console.log('3 OK');

// 4. ICON_ALTS - match the end of BITE_ME_IMG alt
const altsLine = "BITE_ME_IMG:'";
const altsIdx = h.indexOf(altsLine);
const altsEnd = h.indexOf("'};", altsIdx) + 3; // end of '};
// Verify we found correct position
if (h.slice(altsEnd - 3, altsEnd) === "'};") {
  h = h.slice(0, altsEnd - 3) + 
    "', JELLY_BUNNY_IMG:'\u{1F430}', CRYSTAL_EAGLE_THUNDERBIRD_IMG:'\u{1F985}', " +
    "CRYSTAL_EAGLE_LUCIFER_IMG:'\u{1F608}', INPUT_KET_TON_IMG:'\u{1F48E}', SNOP_DOG_GOLD_IMG:'\u{1F415}'};";
  console.log('4 OK');
} else {
  console.log('4 FAIL: BITE_ME_IMG alt not found correctly');
}

// 5. ITEMS_DATA
const newItems = NL +
`    { id: 'jelly_bunny', name: 'Jelly Bunny', icon: 'JELLY_BUNNY_IMG', rarity: 5, power: 10001, type: 'ton_case' },${NL}` +
`    { id: 'crystal_eagle_thunderbird', name: 'Crystal Eagle Thunderbird', icon: 'CRYSTAL_EAGLE_THUNDERBIRD_IMG', rarity: 5, power: 404404, type: 'ton_case' },${NL}` +
`    { id: 'crystal_eagle_thunderbird_rare', name: 'Crystal Eagle Thunderbird \u2728', icon: 'CRYSTAL_EAGLE_THUNDERBIRD_IMG', rarity: 5, power: 73773773773, type: 'ton_case' },${NL}` +
`    { id: 'crystal_eagle_lucifer', name: 'Crystal Eagle Lucifer', icon: 'CRYSTAL_EAGLE_LUCIFER_IMG', rarity: 5, power: 99999999999, type: 'ton_case' },${NL}` +
`    { id: 'input_ket_ton', name: 'Input Ket Ton', icon: 'INPUT_KET_TON_IMG', rarity: 5, power: 5555555554, type: 'ton_case' },${NL}` +
`    { id: 'snop_dog_gold', name: 'Snop Dog Gold', icon: 'SNOP_DOG_GOLD_IMG', rarity: 5, power: 6060606060, type: 'ton_case' },`;
const itemsTarget = `    { id: 'bite_me', name: 'Bite Me', icon: 'BITE_ME_IMG', rarity: 5, power: 300, type: 'winter' },`;
h = h.replace(itemsTarget, itemsTarget + newItems);
console.log('5 OK');

// 6. ITEM_PRICES
h = h.replace('bite_me: 300,};', `bite_me: 300,${NL}  jelly_bunny: 10001,${NL}  crystal_eagle_thunderbird: 404404,${NL}  crystal_eagle_thunderbird_rare: 73773773773,${NL}  crystal_eagle_lucifer: 99999999999,${NL}  input_ket_ton: 5555555554,${NL}  snop_dog_gold: 6060606060,};`);
console.log('6 OK');

// 7. ton_case before winter_case
const tonCase = `    {${NL}        id: 'ton_case', name: '\u{1F48E} 40k TON', icon: '\u{1F48E}', cost: 0, tonCost: 40000, free: false,${NL}        colors: ['#f59e0b','#f59e0b','#f59e0b','#f59e0b','#f59e0b','#f59e0b'],${NL}        weights: [0, 0, 0, 0, 0, 100],${NL}        items: [${NL}            { id: 'jelly_bunny', weight: 80 },${NL}            { id: 'crystal_eagle_thunderbird', weight: 20 },${NL}            { id: 'crystal_eagle_thunderbird_rare', weight: 0.18 },${NL}            { id: 'crystal_eagle_lucifer', weight: 0.04 },${NL}            { id: 'input_ket_ton', weight: 2.5 },${NL}            { id: 'snop_dog_gold', weight: 0.5 },${NL}        ]${NL}    },${NL}`;
h = h.replace(`    {${NL}        id: 'winter_case', name: '\u2744\uFE0F WINTER'`, tonCase + `    {${NL}        id: 'winter_case', name: '\u2744\uFE0F WINTER'`);
console.log('7 OK');

// 8. BATTLEPASS_TIERS
const bpStart = h.indexOf('const BATTLEPASS_TIERS = [');
const bpEnd = h.indexOf('];', bpStart) + 2;
const newBP = `const BATTLEPASS_TIERS = [${NL}` +
`    { tier: 1, cases: 0, free: { type: 'coins', amount: 25000 }, premium: { type: 'case', id: 'surfing_case' } },${NL}` +
`    { tier: 2, cases: 2, free: { type: 'case', id: 'surfing_case' }, premium: { type: 'item', id: 'scared_nft' } },${NL}` +
`    { tier: 3, cases: 4, free: { type: 'coins', amount: 50000 }, premium: { type: 'case', id: 'cigara_case' } },${NL}` +
`    { tier: 4, cases: 6, free: { type: 'case', id: 'cigara_case' }, premium: { type: 'case', id: 'cats_case' } },${NL}` +
`    { tier: 5, cases: 9, free: { type: 'case', id: 'cats_case' }, premium: { type: 'case', id: 'tgpin_case' } },${NL}` +
`    { tier: 6, cases: 12, free: { type: 'coins', amount: 100000 }, premium: { type: 'coins', amount: 10000 } },${NL}` +
`    { tier: 7, cases: 16, free: { type: 'case', id: 'tgpin_case' }, premium: { type: 'case', id: 'spyagaric_case' } },${NL}` +
`    { tier: 8, cases: 20, free: { type: 'case', id: 'spyagaric_case' }, premium: { type: 'case', id: 'plushpepe_case' } },${NL}` +
`    { tier: 9, cases: 25, free: { type: 'coins', amount: 200000 }, premium: { type: 'coins', amount: 10000 } },${NL}` +
`    { tier: 10, cases: 30, free: { type: 'coins', amount: 500000 }, premium: { type: 'case', id: 'cigara_case' } },${NL}` +
`    { tier: 11, cases: 36, free: { type: 'case', id: 'cigara_case' }, premium: { type: 'case', id: 'cats_case' } },${NL}` +
`    { tier: 12, cases: 42, free: { type: 'case', id: 'cats_case' }, premium: { type: 'coins', amount: 100000 } },${NL}` +
`    { tier: 13, cases: 50, free: { type: 'coins', amount: 500000 }, premium: { type: 'ton', amount: 2 } },${NL}` +
`    { tier: 14, cases: 58, free: { type: 'case', id: 'tgpin_case' }, premium: { type: 'case', id: 'spyagaric_case' } },${NL}` +
`    { tier: 15, cases: 67, free: { type: 'coins', amount: 1000000 }, premium: { type: 'coins', amount: 200000 } },${NL}` +
`    { tier: 16, cases: 77, free: { type: 'case', id: 'plushpepe_case' }, premium: { type: 'case', id: 'cigara_case' } },${NL}` +
`    { tier: 17, cases: 87, free: { type: 'coins', amount: 2000000 }, premium: { type: 'ton', amount: 5 } },${NL}` +
`    { tier: 18, cases: 95, free: { type: 'case', id: 'spyagaric_case' }, premium: { type: 'case', id: 'plushpepe_case' } },${NL}` +
`    { tier: 19, cases: 100, free: { type: 'coins', amount: 5000000 }, premium: { type: 'ton', amount: 10 } },${NL}` +
`    { tier: 20, cases: 110, free: { type: 'coins', amount: 10000000 }, premium: { type: 'case', id: 'ton_case', qty: 3 } },${NL}` +
`];`;
h = h.slice(0, bpStart) + newBP + h.slice(bpEnd);
console.log('8 OK');

// 9. defaultState
h = h.replace('inventory: [],', 'inventory: [],\r\n        ton: 0,');
console.log('9 OK');

// 10. add spendTon
h = h.replace(
  '    return true;\r\n}',
  '    return true;\r\n}\r\nfunction spendTon(amount) {\r\n    if ((G.ton || 0) < amount) return false;\r\n    G.ton -= amount;\r\n    return true;\r\n}',
  1 // only first occurrence
);
console.log('10 OK');

// 11. openCases multi
h = h.replace(
  "if (!spendCoins(c.cost * need)) { notify('Not enough coins', 'warning'); return; }",
  "if (c.tonCost) { if (!spendTon(c.tonCost * need)) { notify('Not enough TON', 'warning'); return; } } else { if (!spendCoins(c.cost * need)) { notify('Not enough coins', 'warning'); return; } }"
);
console.log('11 OK');

// 12. openCases single
h = h.replace(
  "if (spendCoins(c.cost)) {",
  "if (c.tonCost) { if (!spendTon(c.tonCost)) return; } else if (!spendCoins(c.cost)) { return; }"
);
console.log('12 OK');

// 13. Price display (first)
h = h.replace(
  "${c.free ? 'FREE' : '\uD83D\uDFAA ' + formatNum(c.cost)}",
  "${c.free ? 'FREE' : c.tonCost ? '\uD83D\uDCD8 ' + formatNum(c.tonCost) : '\uD83D\uDFAA ' + formatNum(c.cost)}"
);
console.log('13 OK');

// 14. Price display (second)
h = h.replace(
  "${c.free ? 'FREE' : '\uD83D\uDFAA ' + formatNum(c.cost)} | Own: ${owns}",
  "${c.free ? 'FREE' : c.tonCost ? '\uD83D\uDCD8 ' + formatNum(c.tonCost) : '\uD83D\uDFAA ' + formatNum(c.cost)} | Own: ${owns}"
);
console.log('14 OK');

// 15. grantBPReward
const oldG = h.slice(h.indexOf('function grantBPReward'));
const gEnd = oldG.indexOf('\r\nfunction ');
const oldGrant = oldG.slice(0, gEnd);
const newGrant = `function grantBPReward(rw) {
    if (!rw) return;
    const qty = rw.qty || 1;
    if (rw.type === 'coins') {
        addCoins(rw.amount * qty);
        notify(\`\uD83D\uDFFA +\${formatNum(rw.amount * qty)} coins!\`, 'success');
    } else if (rw.type === 'ton') {
        G.ton = (G.ton || 0) + rw.amount * qty;
        notify(\`\uD83D\uDCD8 +\${rw.amount * qty} TON!\`, 'success');
    } else if (rw.type === 'case') {
        G.cases[rw.id] = (G.cases[rw.id] || 0) + qty;
        const c = CASES.find(x => x.id === rw.id);
        notify(\`\uD83D\uDCE6 +\${qty}x \${c ? c.name : rw.id}!\`, 'success');
    } else if (rw.type === 'item') {
        for (let i = 0; i < qty; i++) addItemToInventory(rw.id);
        const it = getItemData(rw.id);
        notify(\`\uD83C\uDF81 +\${qty > 1 ? qty + 'x ' : ''}\${it.name}!\`, 'success');
    } else if (rw.type === 'luck') {
        G.luck = Math.max(G.luck, rw.mult);
        refreshUI();
        notify(\`\uD83C\uDF40 Luck \${G.luck}x!\`, 'success');
    }
}`;
h = h.replace(oldGrant, newGrant);
console.log('15 OK');

// 16. renderFuse + doTonFusion
const fuseBlockStart = h.indexOf('function renderFuse()');
const fuseBlockEnd = h.indexOf('// ==================== REWARDS ====================');
const fuseCode = fs.readFileSync('code/renderFuse.js', 'utf8');
h = h.slice(0, fuseBlockStart) + fuseCode.trimEnd() + h.slice(fuseBlockEnd);
console.log('16 OK');

// 17. refreshUI TON
h = h.replace(
  "const luckHud = document.getElementById('luckHud');",
  "const tonEl = document.getElementById('tonBalance');\n    if (tonEl) tonEl.textContent = formatNum(G.ton || 0);\n    const luckHud = document.getElementById('luckHud');"
);
console.log('17 OK');

// 18. tonBalance DOM
h = h.replace(
  '</div>\r\n    <div class="profile-container"',
  '</div>\r\n    <div class="balance-container" style="margin-left:8px;">\r\n        <span style="color:#f59e0b;font-weight:bold;">TON</span>\r\n        <span class="balance-amount" id="tonBalance">0</span>\r\n    </div>\r\n    <div class="profile-container"'
);
console.log('18 OK');

// 19. Remove the extra duplicate single-click spendCoins that step 12 may have created
// The pattern from step 12 replaces: `if (spendCoins(c.cost)) {` with the new version
// but the `{` from the original line now doesn't match. Let me check.
// Actually the original line was:
//    if (spendCoins(c.cost)) {
//        G.cases[caseId] = (G.cases[caseId] || 0) + 1;
// My replacement: if (c.tonCost) { ... } else if (!spendCoins(c.cost)) { return; }
// The original line after replacement becomes:
//    if (c.tonCost) { if (!spendTon(c.tonCost)) return; } else if (!spendCoins(c.cost)) { return; }
//    {  <-- this is leftover!
//        G.cases[caseId] = (G.cases[caseId] || 0) + 1;
// There's a stray { from the old code. Let me fix:
h = h.replace(
  "else if (!spendCoins(c.cost)) { return; }\r\n    {",
  "else if (!spendCoins(c.cost)) { return; }"
);
console.log('19 OK');

fs.writeFileSync('index.html', h);
console.log('ALL DONE!');
