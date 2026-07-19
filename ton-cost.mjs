import fs from 'fs';
const NL = '\r\n';
let h = fs.readFileSync('index.html', 'utf8');

// 1. Update ton_case cost to 40000 TON
const oldCase = `{${NL}        id: 'ton_case', name: '\u{1F48E} 30k TON', icon: '\u{1F48E}', cost: 30000, free: false,`;
const newCase = `{${NL}        id: 'ton_case', name: '\u{1F48E} 40k TON', icon: '\u{1F48E}', cost: 0, tonCost: 40000, free: false,`;
h = h.replace(oldCase, newCase);
console.log('1. Updated ton_case cost to 40000 TON');

// 2. Update openCases to handle tonCost
const oldOpen = `function openCases(caseId, qty) {
    const c = CASES.find(x => x.id === caseId);
    if (!c) return;
    qty = Math.max(1, Math.min(10, qty | 0));
    if (c.free) qty = 1;
    if (c.free) {
        startCSGOOpening(caseId, qty);
        return;
    }
    const owns = G.cases[caseId] || 0;
    const need = qty - owns;
    if (need > 0) {
        if (!spendCoins(c.cost * need)) { notify('Not enough coins', 'warning'); return; }
        G.cases[caseId] = owns + need;
        saveState();
    }
    startCSGOOpening(caseId, qty);
}`;

const newOpen = `function openCases(caseId, qty) {
    const c = CASES.find(x => x.id === caseId);
    if (!c) return;
    qty = Math.max(1, Math.min(10, qty | 0));
    if (c.free) qty = 1;
    if (c.free) {
        startCSGOOpening(caseId, qty);
        return;
    }
    const owns = G.cases[caseId] || 0;
    const need = qty - owns;
    if (need > 0) {
        if (c.tonCost) {
            if ((G.ton || 0) < c.tonCost * need) { notify('Not enough TON', 'warning'); return; }
            G.ton = (G.ton || 0) - c.tonCost * need;
        } else {
            if (!spendCoins(c.cost * need)) { notify('Not enough coins', 'warning'); return; }
        }
        G.cases[caseId] = owns + need;
        saveState();
    }
    startCSGOOpening(caseId, qty);
}`;

h = h.replace(oldOpen, newOpen);
console.log('2. Updated openCases to support tonCost');

// 3. Add spendTon helper (optional but useful)
const spendFn = `function spendCoins(amount) {
    if (G.coins < amount) return false;
    G.coins -= amount;
    return true;
}

function spendTon(amount) {
    if ((G.ton || 0) < amount) return false;
    G.ton -= amount;
    return true;
}`;
const oldSpend = `function spendCoins(amount) {
    if (G.coins < amount) return false;
    G.coins -= amount;
    return true;
}`;
h = h.replace(oldSpend, spendFn);
console.log('3. Added spendTon function');

// 4. Update renderCaseCard or store display to show TON price
// Find the renderCases/store function where case prices are shown
const priceDisplayTarget = `\${renderIcon(c.icon)} \${c.name}`;
// Check if this pattern exists and if we need to add TON price display
if (h.includes("c.tonCost ? '💎 ' + formatNum(c.tonCost) : '⭐ ' + formatNum(c.cost)")) {
  console.log('4. TON price display already exists');
} else {
  // Find where case price is displayed in the shop/store
  const shopTarget = "c.cost ? '⭐ ' + formatNum(c.cost) : ''";
  if (h.includes(shopTarget)) {
    h = h.replace(shopTarget, "c.tonCost ? '💎 ' + formatNum(c.tonCost) : c.cost ? '⭐ ' + formatNum(c.cost) : ''");
    console.log('4. Updated TON price display in shop');
  } else {
    console.log('4. No standard price display pattern found, checking alternatives');
    // Try another common pattern
    const altTarget = "showPrice(c.id)";
    if (h.includes(altTarget)) {
      console.log('4. Found showPrice usage, leaving as-is');
    }
  }
}

fs.writeFileSync('index.html', h);
console.log('All TON cost changes applied!');
