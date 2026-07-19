import fs from 'fs';
const h = fs.readFileSync('index.html', 'utf8');
console.log('BATTLEPASS_TIERS tiers 13-20:');
// Check tiers 13-20 for ton/qty
const tiers13 = h.includes("tier: 13") && h.includes("type: 'ton', amount: 2");
const tiers17 = h.includes("tier: 17") && h.includes("type: 'ton', amount: 5");
const tiers19 = h.includes("tier: 19") && h.includes("type: 'ton', amount: 10");
const tiers20 = h.includes("tier: 20") && h.includes("qty: 3");
console.log('  Tier 13 (2 TON):', tiers13);
console.log('  Tier 17 (5 TON):', tiers17);
console.log('  Tier 19 (10 TON):', tiers19);
console.log('  Tier 20 (3x ton_case):', tiers20);

console.log('\ngrantBPReward has qty:', h.includes('const qty = rw.qty || 1;'));
console.log('grantBPReward has ton:', h.includes("rw.type === 'ton'"));
console.log('\ndefaultState has ton:', h.includes('ton: 0'));
console.log('\nrenderFuse 5 slots:', h.includes("for (let i = 0; i < 5; i++)"));
console.log('has doTonFusion:', h.includes('function doTonFusion'));
console.log('has doFuse:', h.includes('function doFuse'));
console.log('\nrefreshUI tonBalance:', h.includes("document.getElementById('tonBalance'"));
console.log('refreshUI G.ton:', h.includes('G.ton || 0'));
