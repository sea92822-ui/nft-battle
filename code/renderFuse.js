function renderFuse() {
    const el = document.getElementById('fuseContent');
    const items = getInventoryItems();
    let html = '<h3>Fuse 5 identical items to upgrade rarity</h3>';
    html += '<p style="text-align:center;font-size:12px;color:#aaa;">All 5 must be the same type. If all are ton_case items → TON fusion.</p>';

    html += '<div style="display:flex;gap:8px;justify-content:center;margin:20px 0;flex-wrap:wrap;">';
    for (let i = 0; i < 5; i++) {
        const sel = fuseSelected[i];
        if (sel) {
            const inv = items.find(x => x.uid === sel);
            if (inv) {
                const color = getRarityColor(inv.data.rarity);
                html += `<div class="item-card" style="border-color:${color};width:90px;" onclick="fuseRemoveSlot(${i})">
                    <div>${renderIcon(inv.data.icon)}</div>
                    <div style="font-size:9px;color:${color};">${inv.data.name}</div>
                </div>`;
            }
        } else {
            html += `<div class="item-card" style="border-color:rgba(255,255,255,0.1);width:90px;opacity:0.4;">Empty</div>`;
        }
    }
    html += '</div>';

    const filled = fuseSelected.filter(Boolean).length;
    if (filled === 5) {
        const first = items.find(i => i.uid === fuseSelected[0]);
        const allSame = fuseSelected.every(uid => {
            const inv = items.find(i => i.uid === uid);
            return inv && inv.data.id === first.data.id;
        });
        if (!allSame) {
            html += '<p style="text-align:center;color:#ef4444;">All items must be identical!</p>';
        } else {
            const isTonFuse = first.data.type === 'ton_case';
            if (isTonFuse) {
                const avgStars = fuseSelected.reduce((sum, uid) => {
                    const inv = items.find(i => i.uid === uid);
                    return sum + (ITEM_PRICES[inv.data.id] || 0);
                }, 0) / 5;
                const minTon = Math.floor(avgStars * 0.7 / 255);
                const maxTon = Math.floor(avgStars * 1.3 / 255);
                html += `<div style="text-align:center;">
                    <p>💎 TON Fusion: ${minTon}–${maxTon} TON (1% black bg = 2x)</p>
                    <button class="btn btn-gold" onclick="doTonFusion()">💎 Fuse to TON!</button>
                </div>`;
            } else {
                const rarity = first.data.rarity;
                if (rarity >= 5) {
                    html += '<p style="text-align:center;color:#f59e0b;">⭐ Already max rarity! Use TON fusion instead.</p>';
                } else {
                    const cost = (rarity + 1) * 500;
                    const chance = Math.max(20, 80 - rarity * 10);
                    html += `<div style="text-align:center;">
                        <p>Cost: 🪙 ${formatNum(cost)} | Success: ${chance}%</p>
                        <button class="btn btn-gold" onclick="doFuse()">💎 Fuse!</button>
                    </div>`;
                }
            }
        }
    } else {
        html += `<p style="text-align:center;color:#888;">Select ${5 - filled} more item${5 - filled !== 1 ? 's' : ''}</p>`;
    }

    html += '<div class="inv-grid" style="margin-top:15px;">';
    items.forEach(inv => {
        if (fuseSelected.includes(inv.uid)) return;
        const color = getRarityColor(inv.data.rarity);
        html += `<div class="item-card" onclick="fuseAddSlot('${inv.uid}')" style="border-color:${color}44;">
            <div class="item-icon">${renderIcon(inv.data.icon)}</div>
            <div class="item-name" style="color:${color};">${inv.data.name}</div>
        </div>`;
    });
    html += '</div>';

    el.innerHTML = html;
}

function fuseAddSlot(uid) {
    if (fuseSelected.filter(Boolean).length >= 5) return notify('Already 5 selected', 'warning');
    if (fuseSelected.includes(uid)) return;
    fuseSelected.push(uid);
    renderFuse();
}

function fuseRemoveSlot(idx) {
    fuseSelected.splice(idx, 1);
    renderFuse();
}

function doFuse() {
    const items = getInventoryItems();
    const selected = fuseSelected.map(uid => items.find(i => i.uid === uid)).filter(Boolean);
    if (selected.length !== 5) return;
    if (!selected.every(s => s.data.id === selected[0].data.id)) return notify('Items must be identical!', 'error');
    const rarity = selected[0].data.rarity;
    if (rarity >= 5) return notify('Already max rarity! Use TON fusion.', 'error');
    const cost = (rarity + 1) * 500;
    const chance = Math.max(20, 80 - rarity * 10);
    if (!spendCoins(cost)) return;

    selected.forEach(s => removeItemFromInventory(s.uid));
    if (rand(1, 100) <= chance) {
        const newItem = randomItemForRarity(rarity + 1);
        addItemToInventory(newItem.id);
        notify(`💎 Fuse success! ${newItem.name}!`, 'success');
    } else {
        notify('💥 Fuse failed! Items lost!', 'error');
    }
    saveState();
    fuseSelected = [];
    renderFuse();
    refreshUI();
}

function doTonFusion() {
    const items = getInventoryItems();
    const selected = fuseSelected.map(uid => items.find(i => i.uid === uid)).filter(Boolean);
    if (selected.length !== 5) return;
    if (!selected.every(s => s.data.id === selected[0].data.id)) return notify('Items must be identical!', 'error');
    if (selected[0].data.type !== 'ton_case') return notify('Not TON-type items!', 'error');

    const avgStars = selected.reduce((sum, s) => sum + (ITEM_PRICES[s.data.id] || 0), 0) / 5;
    const variance = 0.7 + Math.random() * 0.6;
    let tonAmount = Math.max(1, Math.floor(avgStars / 255 * variance));

    const isBlackBg = Math.random() < 0.01;
    if (isBlackBg) tonAmount *= 2;

    selected.forEach(s => removeItemFromInventory(s.uid));
    G.ton = (G.ton || 0) + tonAmount;
    saveState();
    fuseSelected = [];
    renderFuse();
    refreshUI();
    if (isBlackBg) {
        notify(`⬛ BLACK BACKGROUND! TON doubled! +${tonAmount} TON!`, 'success');
    } else {
        notify(`💎 +${tonAmount} TON from fusion!`, 'success');
    }
}