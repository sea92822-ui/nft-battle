const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const AUCTIONS_FILE = path.join(__dirname, 'auctions.json');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(__dirname));

// ==================== USER STORE ====================
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ==================== AUCTION STORE ====================
function loadAuctions() {
  try { return JSON.parse(fs.readFileSync(AUCTIONS_FILE, 'utf8')); } catch { return []; }
}
function saveAuctions(auctions) {
  fs.writeFileSync(AUCTIONS_FILE, JSON.stringify(auctions, null, 2));
}
function cleanExpiredAuctions() {
  const auctions = loadAuctions();
  const now = Date.now();
  let changed = false;
  for (const a of auctions) {
    if (a.expiresAt > now || a.status !== 'active') continue;
    a.status = 'expired';
    changed = true;
    if (a.winner) {
      // Notify winner gets item
      if (online[a.winner]) {
        try {
          online[a.winner].ws.send(JSON.stringify({ type: 'auction_won', auctionId: a.id, itemId: a.itemId, itemName: a.itemName }));
        } catch {}
      }
      // Notify seller gets payment
      if (online[a.seller]) {
        try {
          online[a.seller].ws.send(JSON.stringify({ type: 'auction_sold', auctionId: a.id, itemId: a.itemId, itemName: a.itemName, bid: a.bid, bidTon: a.bidTon, currency: a.currency, winner: a.winner }));
        } catch {}
      }
    } else {
      // No bids — return item to seller
      if (online[a.seller]) {
        try {
          online[a.seller].ws.send(JSON.stringify({ type: 'auction_returned', auctionId: a.id, itemId: a.itemId, itemName: a.itemName }));
        } catch {}
      }
    }
  }
  if (changed) saveAuctions(auctions);
}
setInterval(cleanExpiredAuctions, 5000);

// ==================== REST AUTH ====================
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 2 || password.length < 3)
    return res.json({ ok: false, error: 'Username (2+) and password (3+) required' });
  const users = loadUsers();
  if (users[username]) return res.json({ ok: false, error: 'Username taken' });
  const hash = await bcrypt.hash(password, 10);
  users[username] = { password: hash, admin: false, inventory: [] };
  saveUsers(users);
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const u = users[username];
  if (!u || !(await bcrypt.compare(password, u.password)))
    return res.json({ ok: false, error: 'Invalid credentials' });
  res.json({ ok: true, username, isAdmin: u.admin || false });
});

// ==================== ADMIN REQUESTS ====================
const REQUESTS_FILE = path.join(__dirname, 'admin_requests.json');

function loadRequests() {
  try { return JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch { return {}; }
}
function saveRequests(data) {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(data, null, 2));
}

app.post('/api/admin/request', (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ ok: false, error: 'No username' });
  const reqs = loadRequests();
  // Check if already has pending
  for (const code in reqs) {
    if (reqs[code].username === username && reqs[code].status === 'pending')
      return res.json({ ok: false, error: 'Already have pending request' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  reqs[code] = { username, status: 'pending', createdAt: Date.now() };
  saveRequests(reqs);
  // Notify bot
  if (typeof notifyBotAdminRequest === 'function') {
    try { notifyBotAdminRequest(username, code); } catch {}
  }
  res.json({ ok: true, code });
});

app.post('/api/admin/verify', (req, res) => {
  const { username, code } = req.body;
  if (!username || !code) return res.json({ ok: false, error: 'Missing data' });
  const reqs = loadRequests();
  const entry = reqs[code];
  if (!entry) return res.json({ ok: false, error: 'Invalid code' });
  if (entry.username !== username) return res.json({ ok: false, error: 'Code not for you' });
  if (entry.status !== 'approved') return res.json({ ok: false, error: 'Not approved yet. Wait for admin.' });
  delete reqs[code];
  saveRequests(reqs);
  // Save admin flag to user account
  const users = loadUsers();
  if (users[username]) { users[username].admin = true; saveUsers(users); }
  res.json({ ok: true });
});

// ==================== LEADERBOARD ====================
app.get('/api/leaderboard', (req, res) => {
  const users = loadUsers();
  const entries = [];
  for (const [name, data] of Object.entries(users)) {
    if (name.startsWith('Guest_')) continue;
    const stats = data.stats || {};
    entries.push({
      username: name,
      coins: stats.coins || 0,
      battleWins: stats.battleWins || 0,
      battleRating: stats.battleRating || 1000,
      totalOpenings: stats.totalOpenings || 0,
      inventoryCount: (data.inventory || []).length,
    });
  }
  entries.sort((a, b) => b.battleRating - a.battleRating);
  res.json({ ok: true, entries: entries.slice(0, 50) });
});

// ==================== WEBSOCKET ====================
const online = {}; // username -> { ws, username }
const tradeSessions = {}; // username -> partnerUsername
const adminUsers = new Set(); // in-memory admin tracking

function isAdmin(username) {
  if (adminUsers.has(username)) return true;
  const users = loadUsers();
  return users[username] && users[username].admin === true;
}

wss.on('connection', (ws) => {
  let currentUser = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'login': {
        const { username, adminCode } = msg;
        // disconnect old session if same user
        if (online[username]) {
          try { online[username].ws.close(); } catch {}
        }
        currentUser = username;
        online[username] = { ws, username };
        // Check admin code if provided or already admin in DB
        const users = loadUsers();
        if (adminCode === '327659' || (users[username] && users[username].admin)) {
          adminUsers.add(username);
          if (users[username]) { users[username].admin = true; saveUsers(users); }
        }
        // Send server-stored inventory on login
        const serverInventory = (users[username] && users[username].inventory) || [];
        const isAdminUser = adminUsers.has(username);
        ws.send(JSON.stringify({
          type: 'login_ok',
          online: Object.keys(online).filter(u => u !== username),
          inventory: serverInventory,
          isAdmin: isAdminUser,
        }));
        broadcastOnline();
        break;
      }

      case 'logout': {
        if (currentUser) {
          delete online[currentUser];
          currentUser = null;
          broadcastOnline();
        }
        break;
      }

      case 'set_admin': {
        if (!currentUser) return;
        if (msg.code === '327659') {
          adminUsers.add(currentUser);
          const users = loadUsers();
          if (users[currentUser]) {
            users[currentUser].admin = true;
            saveUsers(users);
          }
          ws.send(JSON.stringify({ type: 'admin_success', message: 'Admin access granted' }));
        }
        break;
      }

      case 'find_player': {
        const { target } = msg;
        if (!target || target === currentUser) {
          ws.send(JSON.stringify({ type: 'find_result', found: false, error: 'Invalid target' }));
          return;
        }
        const found = online[target];
        ws.send(JSON.stringify({
          type: 'find_result',
          found: !!found,
          target,
          online: !!found,
        }));
        break;
      }

      // ==================== TRADE SYSTEM (REWRITTEN) ====================
      // tradeSessions[username] = partnerUsername
      // Server only tracks who's connected to whom; items/coins are client-side.

      case 'trade_request': {
        const { target } = msg;
        if (!target || !online[target]) {
          ws.send(JSON.stringify({ type: 'trade_error', error: 'Player offline' }));
          return;
        }
        if (tradeSessions[currentUser]) {
          ws.send(JSON.stringify({ type: 'trade_error', error: 'Already in a trade' }));
          return;
        }
        if (tradeSessions[target]) {
          ws.send(JSON.stringify({ type: 'trade_error', error: 'Player is already trading' }));
          return;
        }
        online[target].ws.send(JSON.stringify({ type: 'trade_incoming', from: currentUser }));
        ws.send(JSON.stringify({ type: 'trade_request_sent', target }));
        break;
      }

      case 'trade_accept': {
        const { from } = msg;
        if (!from || !online[from]) return;
        if (tradeSessions[currentUser]) return;
        if (tradeSessions[from]) return;
        tradeSessions[currentUser] = from;
        tradeSessions[from] = currentUser;
        online[from].ws.send(JSON.stringify({ type: 'trade_started', partner: currentUser }));
        ws.send(JSON.stringify({ type: 'trade_started', partner: from }));
        break;
      }

      case 'trade_decline': {
        const { from } = msg;
        if (from && online[from]) {
          online[from].ws.send(JSON.stringify({ type: 'trade_declined', by: currentUser }));
        }
        break;
      }

      case 'trade_offer_update': {
        const partner = tradeSessions[currentUser];
        if (!partner || !online[partner]) return;
        online[partner].ws.send(JSON.stringify({
          type: 'trade_offer_updated',
          from: currentUser,
          offerItems: msg.offerItems || [],
        }));
        break;
      }

      case 'trade_confirm_trade': {
        const partner = tradeSessions[currentUser];
        if (!partner || !online[partner]) return;
        online[partner].ws.send(JSON.stringify({ type: 'trade_partner_confirmed', from: currentUser }));
        ws.send(JSON.stringify({ type: 'trade_awaiting' }));
        break;
      }

      case 'trade_execute_now': {
        const partner = tradeSessions[currentUser];
        if (!partner || !online[partner]) return;
        online[partner].ws.send(JSON.stringify({ type: 'trade_do_execute' }));
        ws.send(JSON.stringify({ type: 'trade_do_execute' }));
        delete tradeSessions[currentUser];
        delete tradeSessions[partner];
        break;
      }

      case 'trade_cancel': {
        const partner = tradeSessions[currentUser];
        if (partner) {
          if (online[partner]) {
            online[partner].ws.send(JSON.stringify({ type: 'trade_cancelled', by: currentUser }));
          }
          delete tradeSessions[currentUser];
          delete tradeSessions[partner];
        }
        break;
      }

      // ==================== INVENTORY SYNC ====================
      case 'sync_inventory': {
        if (!currentUser) return;
        const { inventory } = msg;
        const users = loadUsers();
        if (users[currentUser]) {
          users[currentUser].inventory = inventory || [];
          saveUsers(users);
        }
        break;
      }

      case 'sync_stats': {
        if (!currentUser) return;
        const { stats } = msg;
        const users = loadUsers();
        if (users[currentUser]) {
          users[currentUser].stats = stats || {};
          saveUsers(users);
        }
        break;
      }

      // ==================== AUCTIONS ====================
      case 'auction_get_all': {
        const auctions = loadAuctions().filter(a => a.status === 'active');
        ws.send(JSON.stringify({ type: 'auction_list', auctions }));
        break;
      }

      case 'auction_create': {
        if (!currentUser) return;
        const { itemId, itemUid, itemName, itemRarity, startPrice, currency } = msg;
        if (!itemId || !itemUid || !itemName || !startPrice) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Missing fields' }));
          return;
        }
        const auction = {
          id: 'auction_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          seller: currentUser,
          itemId,
          itemUid,
          itemName,
          itemRarity: itemRarity || 0,
          startPrice: startPrice,
          bid: currency === 'ton' ? 0 : startPrice,
          bidTon: currency === 'ton' ? startPrice : 0,
          currency: currency || 'stars',
          winner: null,
          status: 'active',
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 3600000,
          bids: 0,
        };
        const auctions = loadAuctions();
        auctions.push(auction);
        saveAuctions(auctions);
        ws.send(JSON.stringify({ type: 'auction_created', auction }));
        broadcastAuctions();
        break;
      }

      case 'auction_bid': {
        if (!currentUser) return;
        const { auctionId, bidAmount, bidAmountTon } = msg;
        if (!auctionId) return;
        const auctions = loadAuctions();
        const auction = auctions.find(a => a.id === auctionId && a.status === 'active');
        if (!auction) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Auction not found or ended' }));
          return;
        }
        if (auction.seller === currentUser) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Cannot bid on your own auction' }));
          return;
        }
        if (auction.expiresAt <= Date.now()) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Auction expired' }));
          return;
        }
        if (auction.currency === 'ton') {
          const newBidTon = (auction.bidTon || auction.startPrice) + (bidAmountTon || 1);
          auction.bidTon = newBidTon;
          auction.winner = currentUser;
        } else {
          const newBid = (auction.bid || auction.startPrice) + (bidAmount || 0);
          auction.bid = newBid;
          auction.winner = currentUser;
        }
        auction.bids = (auction.bids || 0) + 1;
        saveAuctions(auctions);
        ws.send(JSON.stringify({ type: 'auction_bid_ok', auctionId, bid: auction.bid, bidTon: auction.bidTon }));
        broadcastAuctions();
        break;
      }

      case 'auction_cancel': {
        if (!currentUser) return;
        const { auctionId: cancelId } = msg;
        const auctions = loadAuctions();
        const toCancel = auctions.find(a => a.id === cancelId && a.seller === currentUser && a.status === 'active');
        if (!toCancel) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Cannot cancel' }));
          return;
        }
        if (toCancel.bids > 0) {
          ws.send(JSON.stringify({ type: 'auction_error', error: 'Cannot cancel — already has bids' }));
          return;
        }
        toCancel.status = 'cancelled';
        saveAuctions(auctions);
        ws.send(JSON.stringify({ type: 'auction_cancelled_ok', auctionId: cancelId }));
        broadcastAuctions();
        break;
      }

      // ==================== ADMIN COMMANDS ====================
      case 'live_drop': {
        const dropPayload = JSON.stringify({
          type: 'live_drop',
          username: currentUser,
          sourceType: msg.sourceType,
          sourceName: msg.sourceName,
          itemName: msg.itemName,
          chancePct: msg.chancePct,
          itemId: msg.itemId || '',
          rarity: msg.rarity,
          itemPrice: msg.itemPrice,
        });
        wss.clients.forEach(c => {
          if (c !== ws && c.readyState === 1) {
            try { c.send(dropPayload); } catch {}
          }
        });
        break;
      }

      case 'admin_give_item': {
        if (!currentUser || !isAdmin(currentUser)) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Not authorized' }));
          return;
        }
        const { target: targetPlayer, itemId } = msg;
        if (!targetPlayer || !itemId) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Missing target or itemId' }));
          return;
        }
        // Update server-side inventory
        const users = loadUsers();
        if (!users[targetPlayer]) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Player not found' }));
          return;
        }
        if (!users[targetPlayer].inventory) users[targetPlayer].inventory = [];
        const uid = itemId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        users[targetPlayer].inventory.push({ id: itemId, uid });
        saveUsers(users);
        // Notify if online
        if (online[targetPlayer]) {
          online[targetPlayer].ws.send(JSON.stringify({
            type: 'admin_give_item',
            itemId,
            uid,
          }));
        }
        ws.send(JSON.stringify({ type: 'admin_success', message: `Gave ${itemId} to ${targetPlayer}` }));
        break;
      }

      case 'admin_reset_inventory': {
        if (!currentUser || !isAdmin(currentUser)) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Not authorized' }));
          return;
        }
        const { target: targetPlayer } = msg;
        if (!targetPlayer) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Missing target' }));
          return;
        }
        const users = loadUsers();
        if (!users[targetPlayer]) {
          ws.send(JSON.stringify({ type: 'admin_error', error: 'Player not found' }));
          return;
        }
        users[targetPlayer].inventory = [];
        saveUsers(users);
        // Notify if online
        if (online[targetPlayer]) {
          online[targetPlayer].ws.send(JSON.stringify({
            type: 'admin_reset_inventory',
          }));
        }
        ws.send(JSON.stringify({ type: 'admin_success', message: `Reset inventory of ${targetPlayer}` }));
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      // Cleanup trade sessions
      const partner = tradeSessions[currentUser];
      if (partner) {
        if (online[partner]) {
          try { online[partner].ws.send(JSON.stringify({ type: 'trade_cancelled', by: currentUser })); } catch {}
        }
        delete tradeSessions[partner];
        delete tradeSessions[currentUser];
      }
      delete online[currentUser];
      broadcastOnline();
    }
  });

  function broadcastOnline() {
    const list = Object.keys(online);
    const payload = JSON.stringify({ type: 'online_list', list });
    wss.clients.forEach(c => { try { c.send(payload); } catch {} });
  }

  function broadcastAuctions() {
    const auctions = loadAuctions().filter(a => a.status === 'active');
    const payload = JSON.stringify({ type: 'auction_list', auctions });
    wss.clients.forEach(c => { try { c.send(payload); } catch {} });
  }
});

// Expose WebSocket notify function for bot.js
global.notifyPlayerViaWs = (username, data) => {
  if (online[username]) {
    try { online[username].ws.send(JSON.stringify(data)); } catch {}
  }
};

// Start Telegram bot
try {
  const bot = require('./bot.js');
  bot.startBot();
} catch(e) {
  console.log('Bot module not loaded:', e.message);
}

server.listen(PORT, () => {
  console.log(`NFT Battle server running at http://localhost:${PORT}`);
  console.log(`Open in browser: http://localhost:${PORT}`);
});
