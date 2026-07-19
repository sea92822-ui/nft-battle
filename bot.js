const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const REQUESTS_FILE = path.join(__dirname, 'admin_requests.json');
const USERS_FILE = path.join(__dirname, 'users.json');

let config = {};
try { config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch {}
let bot = null;

// Expose function for server.js to call
global.notifyBotAdminRequest = (username, code) => {
  if (!bot || !config.adminChatId) return;
  const msg = `🔐 New admin request!\nUser: ${username}\nCode: ${code}\nReply with: /approve ${code}`;
  bot.sendMessage(config.adminChatId, msg).catch(() => {});
};

function startBot() {
  if (!config.botToken) {
    console.log('Bot token not configured. Set botToken in config.json');
    console.log('Admin requests will still work via the server API.');
    return;
  }

  const { TelegramBot } = require('node-telegram-bot-api');
  bot = new TelegramBot(config.botToken, { polling: true });

  // Handle /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      '🤖 NFT Battle Admin Bot\n\n' +
      'Commands:\n' +
      '/approve CODE — approve an admin request\n' +
      '/reject CODE — reject a request\n' +
      '/pending — list pending requests\n' +
      '/give USERNAME ITEMID — give an item to a player\n' +
      '/reset USERNAME — reset a player\'s inventory\n' +
      '/myid — get your chat ID'
    );
    // If adminChatId not set, ask to set it
    if (!config.adminChatId) {
      bot.sendMessage(chatId, `Your chat ID: ${chatId}\nAdd this to config.json as adminChatId`);
    }
  });

  bot.onText(/\/myid/, (msg) => {
    bot.sendMessage(msg.chat.id, `Your chat ID: ${msg.chat.id}`);
  });

  bot.onText(/\/approve (.+)/, (msg, match) => {
    const code = match[1].trim();
    const reqs = loadRequests();
    if (reqs[code]) {
      reqs[code].status = 'approved';
      saveRequests(reqs);
      bot.sendMessage(msg.chat.id, `✅ Request ${code} approved! User "${reqs[code].username}" can now enter the code.`);
    } else {
      bot.sendMessage(msg.chat.id, `❌ Code ${code} not found`);
    }
  });

  bot.onText(/\/reject (.+)/, (msg, match) => {
    const code = match[1].trim();
    const reqs = loadRequests();
    if (reqs[code]) {
      delete reqs[code];
      saveRequests(reqs);
      bot.sendMessage(msg.chat.id, `❌ Request ${code} rejected and removed.`);
    } else {
      bot.sendMessage(msg.chat.id, `❌ Code ${code} not found`);
    }
  });

  bot.onText(/\/pending/, (msg) => {
    const reqs = loadRequests();
    const pending = Object.entries(reqs).filter(([_, v]) => v.status === 'pending');
    if (pending.length === 0) {
      bot.sendMessage(msg.chat.id, '📭 No pending requests');
      return;
    }
    let text = '📋 Pending requests:\n';
    pending.forEach(([code, data]) => {
      text += `\n👤 ${data.username} — Code: ${code}`;
    });
    bot.sendMessage(msg.chat.id, text);
  });

  // /give username itemId — give an item to a player
  bot.onText(/\/give (.+) (.+)/, (msg, match) => {
    const username = match[1].trim();
    const itemId = match[2].trim();
    const users = loadUsers();
    if (!users[username]) {
      bot.sendMessage(msg.chat.id, `❌ User "${username}" not found`);
      return;
    }
    if (!users[username].inventory) users[username].inventory = [];
    const uid = itemId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    users[username].inventory.push({ id: itemId, uid });
    saveUsers(users);
    // Notify if online
    if (typeof global.notifyPlayerViaWs === 'function') {
      try {
        global.notifyPlayerViaWs(username, {
          type: 'admin_give_item',
          itemId,
          uid,
        });
      } catch {}
    }
    bot.sendMessage(msg.chat.id, `✅ Gave "${itemId}" to ${username}`);
  });

  // /reset username — reset a player's inventory
  bot.onText(/\/reset (.+)/, (msg, match) => {
    const username = match[1].trim();
    const users = loadUsers();
    if (!users[username]) {
      bot.sendMessage(msg.chat.id, `❌ User "${username}" not found`);
      return;
    }
    users[username].inventory = [];
    saveUsers(users);
    // Notify if online
    if (typeof global.notifyPlayerViaWs === 'function') {
      try {
        global.notifyPlayerViaWs(username, {
          type: 'admin_reset_inventory',
        });
      } catch {}
    }
    bot.sendMessage(msg.chat.id, `✅ Reset inventory of ${username}`);
  });

  console.log('Telegram bot started!');
}

function loadRequests() {
  try { return JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch { return {}; }
}
function saveRequests(data) {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(data, null, 2));
}
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}
function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Start if run directly
if (require.main === module) {
  startBot();
}

module.exports = { startBot };
