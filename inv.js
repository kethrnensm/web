// ==========================================================
// CẤU HÌNH HÌNH ẢNH VÀ BIẾN TOÀN CỤC
// ==========================================================
const itemImages = {
    1: 'res/food.png',    // Thức ăn
    2: 'res/water.png',   // Nước uống
    3: 'res/radio.png',   // Hoạt động
    4: 'res/candy.png',   // Kẹo táo
    5: 'res/bandage.png'  // Băng gạc
};

let currentData = [];   // Lưu trữ danh sách vật phẩm từ Server Pawn gửi sang
let selectedSlot = -1;  // Ô đang được chọn (-1 là chưa chọn ô nào)
let lastTapTime = 0;    // Biến lưu mốc thời gian chạm để tính toán Double Tap trên Mobile

/* ==========================================================
   1. ĐĂNG KÝ CÁC CỔNG NHẬN LỆNH TỪ SERVER (PAWN -> JS)
   ========================================================== */

// CỔNG A: Nhận dữ liệu vật phẩm và TỰ ĐỘNG MỞ giao diện khi Server gọi lệnh /balo
function renderInventoryEvent(eventData) {
    try {
        const data = JSON.parse(eventData);
        // Tự động bóc tách mảng nếu Pawn gửi bọc tầng mảng ngoài []
        currentData = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
        
        // Mở hiển thị giao diện khung Balo
        const inventoryBody = document.getElementById('inventory-body');
        if (inventoryBody) {
            inventoryBody.style.display = 'block';
        }
        
        renderInventory(); // Tiến hành dựng lưới vật phẩm
    } catch (e) {
        console.error("Lỗi khi đồng bộ dữ liệu render_inventory:", e);
    }
}

// CỔNG B: Server ép ĐÓNG hoặc MỞ từ xa (Ví dụ: Player bị chết, admin ép đóng balo...)
function toggleInventoryEvent(eventData) {
    try {
        const data = JSON.parse(eventData);
        const isVisible = Array.isArray(data) ? data[0] : data; // Nhận giá trị true hoặc false
        
        const inventoryBody = document.getElementById('inventory-body');
        if (inventoryBody) {
            if (isVisible) {
                inventoryBody.style.display = 'block';
                renderInventory();
            } else {
                inventoryBody.style.display = 'none';
                selectedSlot = -1; // Reset ô chọn khi đóng từ xa
            }
        }
    } catch (e) {
        console.error("Lỗi lệnh toggle_inventory từ Server:", e);
    }
}

// HÀM KHỞI TẠO CHUNG: Đăng ký an toàn chống lỗi hoãn nạp của Launcher Mobile
function initCefInventory() {
    // Đăng ký cổng nhận dữ liệu & tự mở balo
    Cef.registerEventCallback("render_inventory", "renderInventoryEvent");
    
    // Đăng ký cổng nhận lệnh ép ẩn/hiện chủ động từ xa từ Pawn
    Cef.registerEventCallback("toggle_inventory", "toggleInventoryEvent");
    
    console.log("[CEF Mobile] Hệ thống Balo đã đăng ký toàn bộ cổng kết nối thành công!");
}

// BỘ LỌC VÒNG LẶP CHỐNG LỖI "Cef is not defined" (Cực kỳ quan trọng trên Mobile)
if (typeof Cef !== 'undefined') {
    initCefInventory();
} else {
    const checkCefExist = setInterval(() => {
        if (typeof Cef !== 'undefined') {
            initCefInventory();
            clearInterval(checkCefExist); // Dừng vòng lặp khi đã kết nối thành công
        }
    }, 50); // Cứ mỗi 50 mili-giây kiểm tra lại 1 lần cho đến khi Launcher nạp xong đối tượng Cef
}


/* ==========================================================
   2. DỰNG LƯỚI VẬT PHẨM VÀ TỐI ƯU CẢM ỨNG (TOUCH EVENTS)
   ========================================================== */

function renderInventory() {
    const grid = document.getElementById('grid-container');
    if (!grid) return;
    
    grid.innerHTML = ''; // Xóa dữ liệu cũ trước khi vẽ lưới mới

    currentData.forEach(item => {
        const slotDiv = document.createElement('div');
        // Kích hoạt viền sáng xanh (active) nếu ô này đang được chọn
        slotDiv.className = 'item-slot' + (selectedSlot === item.slot ? ' active' : '');
        
        // SỬ DỤNG SỰ KIỆN CHẠM TOUCHEND ĐỂ PHẢN HỒI NGAY LẬP TỨC (Nhanh hơn click chuột giả lập 300ms)
        slotDiv.addEventListener('touchend', (e) => {
            e.preventDefault(); // Chặn không cho kích hoạt click giả lập của trình duyệt di động
            handleSlotTouch(item.slot);
        });

        // Dự phòng nếu bạn chạy thử nghiệm trên môi trường Web PC (Chrome/Edge F12)
        slotDiv.onclick = () => {
            if (typeof Cef === 'undefined') handleSlotTouch(item.slot);
        };

        // Nếu ô có chứa vật phẩm (ID khác 0)
        if (item.id !== 0) {
            const imgSrc = itemImages[item.id] || 'assets/default.png';
            slotDiv.innerHTML = `
                <span class="count">x${item.count}</span>
                <img src="${imgSrc}" alt="${item.name}" draggable="false">
                <span class="name">${item.name}</span>
            `;
        }
        grid.appendChild(slotDiv);
    });

    updateRightPanel(); // Cập nhật bảng thông tin/nút bấm bên phải
    setupMobileScroll(); // Kích hoạt khóa chặn cuộn thông minh cho Mobile
}

// Thuật toán xử lý Chạm đơn (Hiện thông tin) và Chạm kép (Double Tap để sử dụng nhanh)
function handleSlotTouch(slotIndex) {
    const item = currentData.find(i => i.slot === slotIndex);
    
    // Nếu chạm trúng ô trống (ID = 0 hoặc không có item), chỉ reset vị trí chọn
    if (!item || item.id === 0) {
        selectedSlot = slotIndex;
        renderInventory();
        return;
    }

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    // Nếu chạm cùng 1 ô liên tiếp trong vòng dưới 300 mili-giây
    if (selectedSlot === slotIndex && tapLength < 300 && tapLength > 0) {
        // PHÁT HIỆN DOUBLE TAP -> Tự động kích hoạt hành động SỬ DỤNG vật phẩm luôn
        actionItem('inv_use_item');
    } else {
        // CHẠM ĐƠN -> Chỉ chọn ô đó và cập nhật bảng chi tiết bên phải
        selectedSlot = slotIndex;
        renderInventory();
    }
    lastTapTime = currentTime;
}

// Cô lập thao tác cuộn vuốt trong balo (Giúp vuốt mượt mà, không bị lỗi xoay camera góc nhìn nhân vật)
function setupMobileScroll() {
    const grid = document.getElementById('grid-container');
    if (!grid) return;

    grid.style.overflowY = 'auto';
    grid.style.webkitOverflowScrolling = 'touch'; // Kích hoạt lướt quán tính mượt mà trên Mobile

    // Khi ngón tay người chơi lướt lên xuống vùng lưới balo, khóa không cho đẩy sự kiện ra ngoài game
    grid.addEventListener('touchmove', (e) => {
        e.stopPropagation(); 
    }, { passive: true });
}

// Cập nhật nội dung hiển thị của panel thông tin bên phải
function updateRightPanel() {
    const rightPanel = document.getElementById('right-panel');
    const item = currentData.find(i => i.slot === selectedSlot);

    if (item && item.id !== 0) {
        rightPanel.style.visibility = 'visible'; // Hiện bảng lên
        document.getElementById('detail-name').innerText = item.name;
        document.getElementById('detail-desc').innerText = `Vật phẩm: ${item.name}\nSố lượng hiện có: ${item.count}`;
        document.getElementById('detail-img').src = itemImages[item.id] || 'assets/default.png';
    } else {
        rightPanel.style.visibility = 'hidden'; // Ẩn bảng nếu chọn trúng ô trống
    }
}


/* ==========================================================
   3. GỬI SỰ KIỆN TƯƠNG TÁC BUTTON VÀ ĐÓNG (JS -> PAWN)
   ========================================================== */

// Hàm xử lý khi người chơi bấm nút SỬ DỤNG, GIAO DỊCH, XOÁ trên giao diện
function actionItem(eventName) {
    if (selectedSlot === -1) return;
    
    if (typeof Cef !== 'undefined') {
        // Gửi dữ liệu về Server Pawn dưới dạng mảng chuỗi JSON đúng API của bạn (Ví dụ: '["2"]')
        Cef.sendEvent(eventName, `["${selectedSlot}"]`);
    } else {
        console.log(`[TEST MOBILE MODE] Đã gọi Event: ${eventName} tại Slot số: ${selectedSlot}`);
    }
}

// Hàm xử lý khi người chơi tự bấm nút đóng (X) trên điện thoại
function closeInventory() {
    // 1. Ẩn giao diện trên màn hình ngay lập tức để tạo cảm giác mượt mà không trễ
    const inventoryBody = document.getElementById('inventory-body');
    if (inventoryBody) {
        inventoryBody.style.display = 'none';
    }
    
    selectedSlot = -1; // Reset ô chọn về mặc định
    
    // 2. Gửi lệnh báo về Pawn biết menu đã đóng (Để Pawn tắt chuột/mở khóa di chuyển cho người chơi)
    if (typeof Cef !== 'undefined') {
        Cef.sendEvent("inv_close", "[]");
    } else {
        console.log("[TEST MOBILE MODE] Giao diện Balo đã đóng.");
    }
}
