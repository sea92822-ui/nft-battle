import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');

const checks = {
  'image constants': h.includes('const JELLY_BUNNY_IMG'),
  'items data': h.includes("id: 'jelly_bunny'"),
  'item prices': h.includes('jelly_bunny: 10001'),
  'ton_case': h.includes("id: 'ton_case'"),
  'tonCase cost 0': h.includes("tonCost: 40000"),
  'BP tier 13 TON': h.includes("type: 'ton', amount: 2"),
  'BP tier 20 qty': h.includes("qty: 3"),
  'defaultState ton': h.includes('ton: 0'),
  'spendTon function': h.includes('function spendTon'),
  'openCases tonCost': h.includes("if (c.tonCost)"),
  'single-click tonCost': h.includes("c.tonCost) { if (!spendTon(c.tonCost))"),
  'grantBPReward ton': h.includes("rw.type === 'ton'"),
  'grantBPReward qty': h.includes('const qty = rw.qty || 1'),
  'renderFuse 5 slots': h.includes("for (let i = 0; i < 5; i++)"),
  'doTonFusion': h.includes('function doTonFusion'),
  'refreshUI tonBalance': h.includes("getElementById('tonBalance'"),
  'tonBalance DOM': h.includes('id="tonBalance"'),
};

let allOk = true;
Object.entries(checks).forEach(([name, ok]) => {
  console.log(ok ? '\u2713' : '\u2717', name);
  if (!ok) allOk = false;
});

// Check JS syntax by parsing relevant parts
console.log('\n--- Additional checks ---');
// Verify no stray {
const stray = h.indexOf('else if (!spendCoins(c.cost)) { return; }\r\n    {');
if (stray < 0) {
  console.log('\u2713 No stray braces from step 12/19');
} else {
  console.log('\u2717 STRAY BRACE FOUND at', stray);
  console.log(h.slice(stray, stray + 80));
}

const fileLen = h.length;
console.log(`File size: ${fileLen} bytes`);

if (allOk) console.log('\nALL CHECKS PASSED');
