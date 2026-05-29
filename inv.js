// Cấu hình đường dẫn hình ảnh vật phẩm tương ứng với ID khai báo trong Pawn
const itemImages = {
    1: 'res/food.png',    // Thức ăn
    2: 'res/water.png',   // Nước uống
    3: 'res/radio.png',   // Hoạt động
    4: 'res/candy.png',   // Kẹo táo
    5: 'res/bandage.png'  // Băng gạc
};

let currentData = [];
let selectedSlot = -1;

/* ==========================================================
   1. LẮNG NGHE SỰ KIỆN TỪ GAME (PAWN -> JS)
   ========================================================== */

// Hàm nhận dữ liệu hiển thị Balo từ máy chủ Pawn
function renderInventoryEvent(eventData) {
    try {
        // Parse dữ liệu gửi từ máy chủ
        const data = JSON.parse(eventData);
        
        // Vì Pawn xuất ra định dạng JSON Array chứa các Object [{slot:0,...}, {slot:1,...}]
        // Tùy thuộc cấu trúc gói tin, nếu Cef tự bọc mảng ngoài cùng thì ta lấy data[0]
        currentData = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
        
        // Mở giao diện Balo
        const inventoryBody = document.getElementById('inventory-body');
        if (inventoryBody) {
            inventoryBody.style.display = 'block';
        }
        
        // Bắt đầu vẽ các ô đồ
        renderInventory();
    } catch (e) {
        console.error("Lỗi khi đồng bộ Inventory Menu:", e);
    }
}

// Đăng ký cổng nhận sự kiện mở từ Server SA-MP
if (typeof Cef !== 'undefined') {
    Cef.registerEventCallback("render_inventory", "renderInventoryEvent");
}


/* ==========================================================
   2. HÀM DỰNG (RENDER) LƯỚI TÚI ĐỒ VÀ CÁC SLOT
   ========================================================== */
function renderInventory() {
    const grid = document.getElementById('grid-container');
    if (!grid) return;
    
    grid.innerHTML = ''; 

    currentData.forEach(item => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'item-slot' + (selectedSlot === item.slot ? ' active' : '');
        slotDiv.onclick = () => selectItem(item.slot);

        if (item.id !== 0) {
            const imgSrc = itemImages[item.id] || 'assets/default.png';
            slotDiv.innerHTML = `
                <span class="count">x${item.count}</span>
                <img src="${imgSrc}" alt="${item.name}">
                <span class="name">${item.name}</span>
            `;
        }
        grid.appendChild(slotDiv);
    });

    updateRightPanel();
}

// Hàm xử lý chọn ô đồ
function selectItem(slotIndex) {
    selectedSlot = slotIndex;
    renderInventory(); 
}

// Hàm cập nhật khung chi tiết vật phẩm
function updateRightPanel() {
    const rightPanel = document.getElementById('right-panel');
    const item = currentData.find(i => i.slot === selectedSlot);

    if (item && item.id !== 0) {
        rightPanel.style.visibility = 'visible'; 
        document.getElementById('detail-name').innerText = item.name;
        document.getElementById('detail-desc').innerText = `Vật phẩm: ${item.name} | Số lượng hiện có: ${item.count}`;
        document.getElementById('detail-img').src = itemImages[item.id] || 'assets/default.png';
    } else {
        rightPanel.style.visibility = 'hidden'; 
    }
}


/* ==========================================================
   3. HÀM GỬI LỆNH TƯƠNG TÁC VỀ LẠI SERVER (JS -> PAWN)
   ========================================================== */
function actionItem(eventName) {
    if (selectedSlot === -1) return;
    
    if (typeof Cef !== 'undefined') {
        // Gửi dữ liệu lựa chọn về cho hệ thống Pawn xử lý
        // Đóng gói slot dưới dạng mảng JSON theo đúng API của bạn (ví dụ: '["0"]')
        Cef.sendEvent(eventName, `["${selectedSlot}"]`);
    } else {
        console.log(`[TEST MODE] Gọi sự kiện: ${eventName} tại Slot: ${selectedSlot}`);
    }
}


/* ==========================================================
   4. HÀM ĐÓNG GIAO DIỆN
   ========================================================== */
function closeInventory() {
    const inventoryBody = document.getElementById('inventory-body');
    if (inventoryBody) {
        inventoryBody.style.display = 'none';
    }
    
    selectedSlot = -1; // Reset trạng thái chọn
    
    if (typeof Cef !== 'undefined') {
        // Gửi sự kiện báo cho file Pawn biết Balo đã đóng để tắt chuột
        Cef.sendEvent("inv_close", "[]");
    }
}
