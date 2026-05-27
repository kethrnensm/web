// case.js - CEF → Android Bridge
// ITEM_WIDTH phải khớp với CSS .item-card width!

const ITEM_WIDTH = 140; // Khớp CSS: .item-card { width: 140px }
const WIN_INDEX  = 45;

let boxItems = [];
let winnerData = null;
let isSpinning = false;
let currentBoxName = "";
let currentKeyCount = 0;
let currentBoxID = 0;

// ============================================================
// HÀM ANDROID GỌI VÀO (thay thế cef.on)
// ============================================================

function setupCaseData(jsonData, boxName, keyCount, boxID) {
    try { boxItems = JSON.parse(jsonData); } catch(e) { return; }
    currentBoxName  = boxName;
    currentKeyCount = keyCount;
    currentBoxID    = boxID;

    document.getElementById('boxTitle').innerText  = boxName;
    document.getElementById('keyCount').innerText  = keyCount;

    // Reset state hoàn toàn mỗi lần mở
    isSpinning = false;
    document.getElementById('resultOverlay').classList.remove('show');
    document.querySelector('.controls').style.display = 'flex';
    document.getElementById('btnOpen').disabled = false;
    document.getElementById('mainCaseContainer').classList.add('active');

    preparePreviewTrack();
}

function triggerSpinServer(name, rarity, slotId, newKeyCount, modelID) {
    // XÓA: if (isSpinning) return;   ← dòng này đang block animation!
    winnerData = { name, rarity, id: slotId, model: modelID };
    currentKeyCount = newKeyCount;
    document.getElementById('keyCount').innerText = newKeyCount;
    spinCase();
}

function showCaseHistory(jsonData, boxName) {
    try { displayHistory(JSON.parse(jsonData), boxName); } catch(e) {}
}

// ============================================================
// HÀM GỌI LÊN ANDROID (thay thế cef.emit)
// ============================================================

function requestSpin() {
    if (isSpinning) return;
    if (currentKeyCount <= 0) { alert("Không đủ key!"); return; }
    document.getElementById('btnOpen').disabled = true;
    if (typeof Android !== "undefined") {
        Android.log("[DEBUG] requestSpin → gọi Android.requestSpin()");
        Android.requestSpin();
    } else {
        alert("[DEBUG] Android bridge UNDEFINED!");
    }
}

function closeSystem() {
    // Gửi RPC TRƯỚC, bất kể state nào
    if (typeof Android !== "undefined") Android.caseClosed();

    if (isSpinning && !document.getElementById('resultOverlay').classList.contains('show')) return;

    document.getElementById('mainCaseContainer').classList.remove('active');
    document.getElementById('resultOverlay').classList.remove('show');
    isSpinning = false;
}

function showHistory() {
    if (typeof Android !== "undefined") Android.showHistory();
}

// ============================================================
// CORE SPIN LOGIC
// ============================================================

function preparePreviewTrack() {
    const track = document.getElementById('itemsTrack');
    if (!track || !boxItems.length) return;
    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    for (let i = 0; i < 20; i++)
        track.appendChild(createCard(boxItems[Math.floor(Math.random() * boxItems.length)]));
}

function createCard(item) {
    const div = document.createElement('div');
    div.className = `item-card ${item.rarity || 'common'}`;
    div.innerHTML = `
        <img class="card-img" src="${getImagePath(item.model)}" alt="${item.name}"
             onerror="this.src='images/default.png'">
        <div class="card-name">${item.name}</div>`;
    return div;
}

function getImagePath(modelID) {
    if (!modelID) return 'images/default.png';
    if (typeof modelID === 'string' && (modelID.includes('/') || modelID.includes('\\')))
        return modelID.replace(/\\/g, '/');
    return `images/${modelID}.png`;
}

function spinCase() {
    isSpinning = true;
    document.querySelector('.controls').style.display = 'none';

    const track = document.getElementById('itemsTrack');
    track.innerHTML = '';
    for (let i = 0; i < 80; i++) {
        const item = (i === WIN_INDEX) ? winnerData : boxItems[Math.floor(Math.random() * boxItems.length)];
        const card = createCard(item);
        if (i === WIN_INDEX) card.id = 'winner-card-scroll';
        track.appendChild(card);
    }

    // Dùng width thật của container, KHÔNG dùng window.innerWidth
    const container     = document.getElementById('mainCaseContainer');
    const containerWidth = container ? container.offsetWidth : 680;
    const centerOffset   = containerWidth / 2;
    const randomOffset   = Math.floor(Math.random() * (ITEM_WIDTH - 20)) + 10;
    const targetPos      = -((WIN_INDEX * ITEM_WIDTH) - centerOffset + randomOffset);

    track.style.transition = 'none';
    track.style.transform   = 'translateX(0px)';
    void track.offsetWidth;

    setTimeout(() => {
        track.style.transition = 'transform 6s cubic-bezier(0.15, 0, 0.10, 1)';
        track.style.transform   = `translateX(${targetPos}px)`;
    }, 50);

    setTimeout(() => {
        showWinnerPopup();
        if (typeof Android !== "undefined") Android.caseSpinFinished();
    }, 6500);
}

// ============================================================
// WINNER POPUP
// ============================================================

function showWinnerPopup() {
    const colors = {
        special:   '#ffd700',
        mythical:  '#eb4b4b',
        legendary: '#d32ce6',
        epic:      '#8847ff',
        rare:      '#4b69ff',
        uncommon:  '#5e98d9'
    };
    const color = colors[winnerData.rarity] || '#b0c3d9';

    const card = document.getElementById('winnerCard');
    document.getElementById('winName').innerText         = winnerData.name;
    document.getElementById('winName').style.color       = color;
    document.getElementById('winRarityText').innerText   = winnerData.rarity.toUpperCase();
    document.getElementById('winRarityText').style.color = color;

    card.style.borderColor = color;
    card.style.boxShadow   = `0 0 50px ${color}`;

    // ✅ FIX: gán onerror TRƯỚC khi set src
    const img = document.getElementById('winnerImage');
    img.onerror = () => { img.src = 'images/default.png'; };
    img.src = ''; // reset trước để force reload
    img.src = getImagePath(winnerData.model);

    document.getElementById('resultOverlay').classList.add('show');
}

function continueSpinning() {
    document.getElementById('resultOverlay').classList.remove('show');

    // Reset hoàn toàn để có thể quay tiếp
    isSpinning = false;
    document.querySelector('.controls').style.display = 'flex';
    document.getElementById('btnOpen').disabled = (currentKeyCount <= 0);

    preparePreviewTrack();
}

// ============================================================
// HISTORY
// ============================================================

function displayHistory(data, boxName) {
    document.getElementById('historyTitle').innerText = `LICH SU MO ${boxName.toUpperCase()}`;
    const empty = document.getElementById('emptyState');
    const table = document.getElementById('historyTable');
    const body  = document.getElementById('historyBody');

    if (!data || !data.length) {
        empty.style.display = 'block';
        table.style.display = 'none';
    } else {
        empty.style.display = 'none';
        table.style.display = 'table';
        body.innerHTML = '';
        data.forEach((item, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td class="player-name">${item.playerName}</td>
                <td class="reward">${item.itemName} <span class="amount">x${item.amount}</span></td>
                <td>${item.timestamp}</td>`;
            body.appendChild(row);
        });
    }
    document.getElementById('historyContainer').classList.add('active');
}

function closeHistory() {
    document.getElementById('historyContainer').classList.remove('active');
}