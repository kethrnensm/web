/* ==========================================================
   CẤU HÌNH & BIẾN TOÀN CỤC
   ========================================================== */
const itemImages = {
    1: 'res/hamburger.png',
    2: 'res/water.png',
    3: 'res/radio.png',
    4: 'res/candy.png',
    5: 'res/bandage.png'
};

let currentData = [];
let selectedSlot = -1;
let lastTapTime = 0;

/* ==========================================================
   1. ĐĂNG KÝ CỔNG NHẬN LỆNH TỪ SERVER
   ========================================================== */
function initCefInventory() {
    Cef.registerEventCallback("render_inventory", "renderInventoryEvent");
    Cef.registerEventCallback("toggle_inventory", "toggleInventoryEvent");
    
    // Đăng ký nhận sự kiện cập nhật cân nặng từ Pawn gửi về
    Cef.registerEventCallback("update_inventory_weight", "updateWeightEvent");
    
    console.log("[CEF Mobile] Hệ thống Balo đã sẵn sàng!");
}

function renderInventoryEvent(eventData) {
    try {
        const data = JSON.parse(eventData);
        currentData = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
        const inv = document.getElementById('inventory-wrapper');
        if (inv) inv.style.display = 'flex';
        renderInventory();
    } catch (e) { console.error("Lỗi render:", e); }
}

function toggleInventoryEvent(eventData) {
    const data = JSON.parse(eventData);
    const isVisible = Array.isArray(data) ? data[0] : data;
    const inv = document.getElementById('inventory-wrapper');
    if (inv) inv.style.display = isVisible ? 'flex' : 'none';
    if (!isVisible) selectedSlot = -1;
}

// Hàm mới xử lý cân nặng Balo
function updateWeightEvent(eventData) {
    try {
        const data = JSON.parse(eventData);
        const currentWeight = data[0];
        const maxWeight = data[1];
        
        // Tìm thẻ hiển thị cân nặng trên HTML (Bạn cần thêm thẻ id="inventory-weight" vào HTML)
        const weightDisplay = document.getElementById('inventory-weight');
        if (weightDisplay) {
            weightDisplay.innerText = `Cân nặng: ${currentWeight.toFixed(2)} / ${maxWeight.toFixed(2)} kg`;
            
            // Nếu Balo đầy/quá tải, chữ sẽ đổi sang màu đỏ để cảnh báo
            if (currentWeight >= maxWeight) {
                weightDisplay.style.color = "#ff5252"; 
            } else {
                weightDisplay.style.color = "#ffffff";
            }
        }
    } catch (e) { console.error("Lỗi update weight:", e); }
}

/* ==========================================================
   2. XỬ LÝ GIAO DIỆN & TƯƠNG TÁC
   ========================================================== */
function renderInventory() {
    const grid = document.getElementById('grid-container');
    if (!grid) return;
    grid.innerHTML = '';

    currentData.forEach(item => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'item-slot' + (selectedSlot === item.slot ? ' active' : '');
        slotDiv.addEventListener('touchend', (e) => { e.preventDefault(); handleSlotTouch(item.slot); });
        
        if (item.id !== 0) {
            slotDiv.innerHTML = `<span class="count">x${item.count}</span><img src="${itemImages[item.id] || 'assets/default.png'}" draggable="false"><span class="name">${item.name}</span>`;
        }
        grid.appendChild(slotDiv);
    });
    updateRightPanel();
}

function handleSlotTouch(slotIndex) {
    const item = currentData.find(i => i.slot === slotIndex);
    if (!item || item.id === 0) { selectedSlot = slotIndex; renderInventory(); return; }

    const currentTime = new Date().getTime();
    if (selectedSlot === slotIndex && (currentTime - lastTapTime) < 300) actionItem('inv_use_item');
    else { selectedSlot = slotIndex; renderInventory(); }
    lastTapTime = currentTime;
}

function updateRightPanel() {
    const rightPanel = document.getElementById('right-panel');
    const item = currentData.find(i => i.slot === selectedSlot);
    if (item && item.id !== 0) {
        rightPanel.style.visibility = 'visible';
        document.getElementById('detail-name').innerText = item.name;
        document.getElementById('detail-desc').innerText = `Vật phẩm: ${item.name}\nSố lượng: ${item.count}`;
        document.getElementById('detail-img').src = itemImages[item.id] || 'assets/default.png';
    } else { rightPanel.style.visibility = 'hidden'; }
}

/* ==========================================================
   3. GỬI LỆNH VỀ PAWN
   ========================================================== */
function actionItem(eventName) {
    if (selectedSlot === -1) return;
    if (typeof Cef !== 'undefined') Cef.sendEvent(eventName, `["${selectedSlot}"]`);
}

function closeInventory() {
    document.getElementById('inventory-wrapper').style.display = 'none';
    if (typeof Cef !== 'undefined') Cef.sendEvent("inv_close", "[]");
}

if (typeof Cef !== 'undefined') initCefInventory();
