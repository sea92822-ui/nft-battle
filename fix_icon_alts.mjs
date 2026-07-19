import fs from 'fs';
let h = fs.readFileSync('index.html', 'utf8');
const target = "BITE_ME_IMG:'🦇'};";
const replacement = "BITE_ME_IMG:'🦇', JELLY_BUNNY_IMG:'🐰', CRYSTAL_EAGLE_THUNDERBIRD_IMG:'🦅', CRYSTAL_EAGLE_LUCIFER_IMG:'😈', INPUT_KET_TON_IMG:'💎', SNOP_DOG_GOLD_IMG:'🐕'};";
if (h.includes(target)) {
  h = h.replace(target, replacement);
  fs.writeFileSync('index.html', h);
  console.log('ICON_ALTS fixed');
} else {
  console.log('Target not found in file');
}
