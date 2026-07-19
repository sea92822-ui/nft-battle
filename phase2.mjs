import fs from 'fs';
const NL = '\r\n';
let h = fs.readFileSync('index.html', 'utf8');
const grantCode = fs.readFileSync('code/grantBPReward.js', 'utf8');
const fuseCode = fs.readFileSync('code/renderFuse.js', 'utf8');

// 1. Replace BATTLEPASS_TIERS
const bpStart = h.indexOf('const BATTLEPASS_TIERS = [');
const bpEnd = h.indexOf('];', bpStart) + 2;
const newBP = `const BATTLEPASS_TIERS = [${NL}\
    { tier: 1, cases: 0, free: { type: 'coins', amount: 25000 }, premium: { type: 'case', id: 'surfing_case' } },${NL}\
    { tier: 2, cases: 2, free: { type: 'case', id: 'surfing_case' }, premium: { type: 'item', id: 'scared_nft' } },${NL}\
    { tier: 3, cases: 4, free: { type: 'coins', amount: 50000 }, premium: { type: 'case', id: 'cigara_case' } },${NL}\
    { tier: 4, cases: 6, free: { type: 'case', id: 'cigara_case' }, premium: { type: 'case', id: 'cats_case' } },${NL}\
    { tier: 5, cases: 9, free: { type: 'case', id: 'cats_case' }, premium: { type: 'case', id: 'tgpin_case' } },${NL}\
    { tier: 6, cases: 12, free: { type: 'coins', amount: 100000 }, premium: { type: 'coins', amount: 10000 } },${NL}\
    { tier: 7, cases: 16, free: { type: 'case', id: 'tgpin_case' }, premium: { type: 'case', id: 'spyagaric_case' } },${NL}\
    { tier: 8, cases: 20, free: { type: 'case', id: 'spyagaric_case' }, premium: { type: 'case', id: 'plushpepe_case' } },${NL}\
    { tier: 9, cases: 25, free: { type: 'coins', amount: 200000 }, premium: { type: 'coins', amount: 10000 } },${NL}\
    { tier: 10, cases: 30, free: { type: 'coins', amount: 500000 }, premium: { type: 'case', id: 'cigara_case' } },${NL}\
    { tier: 11, cases: 36, free: { type: 'case', id: 'cigara_case' }, premium: { type: 'case', id: 'cats_case' } },${NL}\
    { tier: 12, cases: 42, free: { type: 'case', id: 'cats_case' }, premium: { type: 'coins', amount: 100000 } },${NL}\
    { tier: 13, cases: 50, free: { type: 'coins', amount: 500000 }, premium: { type: 'ton', amount: 2 } },${NL}\
    { tier: 14, cases: 58, free: { type: 'case', id: 'tgpin_case' }, premium: { type: 'case', id: 'spyagaric_case' } },${NL}\
    { tier: 15, cases: 67, free: { type: 'coins', amount: 1000000 }, premium: { type: 'coins', amount: 200000 } },${NL}\
    { tier: 16, cases: 77, free: { type: 'case', id: 'plushpepe_case' }, premium: { type: 'case', id: 'cigara_case' } },${NL}\
    { tier: 17, cases: 87, free: { type: 'coins', amount: 2000000 }, premium: { type: 'ton', amount: 5 } },${NL}\
    { tier: 18, cases: 95, free: { type: 'case', id: 'spyagaric_case' }, premium: { type: 'case', id: 'plushpepe_case' } },${NL}\
    { tier: 19, cases: 100, free: { type: 'coins', amount: 5000000 }, premium: { type: 'ton', amount: 10 } },${NL}\
    { tier: 20, cases: 110, free: { type: 'coins', amount: 10000000 }, premium: { type: 'case', id: 'ton_case', qty: 3 } },${NL}\
];`;
h = h.slice(0, bpStart) + newBP + h.slice(bpEnd);
console.log('1. Replaced BATTLEPASS_TIERS');

// 2. Add ton to defaultState
h = h.replace('inventory: [],', 'inventory: [],\r\n        ton: 0,');
console.log('2. Added ton to defaultState');

// 3. Replace grantBPReward
const oldGrantStart = h.indexOf('function grantBPReward');
const oldGrantEnd = h.indexOf('\r\nfunction ', oldGrantStart + 1);
const oldGrant = h.slice(oldGrantStart, oldGrantEnd);
if (h.includes(oldGrant)) {
  h = h.replace(oldGrant, grantCode.trimEnd());
  console.log('3. Updated grantBPReward');
} else {
  console.log('3. FAILED: old grantBPReward not found');
}

// 4. Replace renderFuse block
const fuseStart = h.indexOf('function renderFuse()');
const fuseBlockEnd = h.indexOf('// ==================== REWARDS ====================');
const oldFuseBlock = h.slice(fuseStart, fuseBlockEnd);
if (h.includes(oldFuseBlock)) {
  h = h.replace(oldFuseBlock, fuseCode.trimEnd());
  console.log('4. Replaced renderFuse block');
} else {
  console.log('4. FAILED: old renderFuse block not found');
}

// 5. Update refreshUI for TON
const refreshTarget = `    const luckHud = document.getElementById('luckHud');`;
const refreshReplace = `    const tonEl = document.getElementById('tonBalance');
    if (tonEl) tonEl.textContent = formatNum(G.ton || 0);
    const luckHud = document.getElementById('luckHud');`;
if (h.includes(refreshTarget)) {
  h = h.replace(refreshTarget, refreshReplace);
  console.log('5. Updated refreshUI for TON');
} else {
  console.log('5. FAILED: refreshUI target not found');
}

fs.writeFileSync('index.html', h);
console.log('Phase 2 complete!');
