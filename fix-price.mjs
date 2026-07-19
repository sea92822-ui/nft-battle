import fs from 'fs';
let h = fs.readFileSync('index.html', 'utf8');

// Update the case card price display (first occurrence in render)
const target1 = "${c.free ? 'FREE' : '\uD83D\uDFAA ' + formatNum(c.cost)}";
const replacement1 = "${c.free ? 'FREE' : c.tonCost ? '\uD83D\uDCD8 ' + formatNum(c.tonCost) : '\uD83D\uDFAA ' + formatNum(c.cost)}";
h = h.replace(target1, replacement1);
console.log('1. Updated case card price display');

// Update the second display (in another section - maybe case list)
const target2 = "${c.free ? 'FREE' : '\uD83D\uDFAA ' + formatNum(c.cost)} | Own: ${owns}";
const replacement2 = "${c.free ? 'FREE' : c.tonCost ? '\uD83D\uDCD8 ' + formatNum(c.tonCost) : '\uD83D\uDFAA ' + formatNum(c.cost)} | Own: ${owns}";
h = h.replace(target2, replacement2);
console.log('2. Updated second price display');

// Also update the quick open (single-click) cost check
// Found at: if (spendCoins(c.cost)) {
const target3 = "if (spendCoins(c.cost)) {";
const replacement3 = "if (c.tonCost) { if ((G.ton||0) < c.tonCost) return; G.ton -= c.tonCost; G.cases[caseId]=(G.cases[caseId]||0)+1; saveState(); refreshUI(); startCSGOOpening(caseId); return; } if (spendCoins(c.cost)) {";
// Actually this is too fragile, let me find where quick-open happens
// Let me search for the single-case open pattern
const idx = h.indexOf("if (spendCoins(c.cost)) {");
if (idx >= 0) {
  const line = h.slice(h.lastIndexOf('\n', idx - 2), h.indexOf('\n', idx + 100));
  console.log('Quick open line:', line);
  h = h.replace("if (spendCoins(c.cost)) {\r\n        G.cases[caseId] = (G.cases[caseId] || 0) + 1;\r\n        saveState();\r\n        refreshUI();\r\n        startCSGOOpening(caseId);\r\n        return;", 
    "if (c.tonCost) {\r\n            if ((G.ton||0) < c.tonCost) return;\r\n            G.ton -= c.tonCost;\r\n        } else if (!spendCoins(c.cost)) return;\r\n        G.cases[caseId] = (G.cases[caseId] || 0) + 1;\r\n        saveState();\r\n        refreshUI();\r\n        startCSGOOpening(caseId);\r\n        return;"
  );
  console.log('3. Updated quick-open cost check');
}

fs.writeFileSync('index.html', h);
console.log('Price display updates complete!');
