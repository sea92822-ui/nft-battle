import fs from 'fs';
let h = fs.readFileSync('index.html', 'utf8');
const NL = '\r\n';

// Add TON balance display in top bar after coin balance
const target = '</div>' + NL + '    <div class="profile-container"';
const insert = '</div>' + NL +
  '    <div class="balance-container" style="margin-left:8px;">' + NL +
  '        <span style="color:#f59e0b;font-weight:bold;">TON</span>' + NL +
  '        <span class="balance-amount" id="tonBalance">0</span>' + NL +
  '    </div>' + NL +
  '    <div class="profile-container"';

if (h.includes(target)) {
  h = h.replace(target, insert);
  console.log('Added tonBalance to top bar');
} else {
  console.log('FAILED: target not found');
}

fs.writeFileSync('index.html', h);
console.log('Done');
