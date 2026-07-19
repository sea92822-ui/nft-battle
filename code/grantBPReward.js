function grantBPReward(rw) {
    if (!rw) return;
    const qty = rw.qty || 1;
    if (rw.type === 'coins') {
        addCoins(rw.amount * qty);
        notify(`🪙 +${formatNum(rw.amount * qty)} coins!`, 'success');
    } else if (rw.type === 'ton') {
        G.ton = (G.ton || 0) + rw.amount * qty;
        notify(`💎 +${rw.amount * qty} TON!`, 'success');
    } else if (rw.type === 'case') {
        G.cases[rw.id] = (G.cases[rw.id] || 0) + qty;
        const c = CASES.find(x => x.id === rw.id);
        notify(`📦 +${qty}x ${c ? c.name : rw.id}!`, 'success');
    } else if (rw.type === 'item') {
        for (let i = 0; i < qty; i++) addItemToInventory(rw.id);
        const it = getItemData(rw.id);
        notify(`🎁 +${qty > 1 ? qty + 'x ' : ''}${it.name}!`, 'success');
    } else if (rw.type === 'luck') {
        G.luck = Math.max(G.luck, rw.mult);
        refreshUI();
        notify(`🍀 Luck ${G.luck}x!`, 'success');
    }
}