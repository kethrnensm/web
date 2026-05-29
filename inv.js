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

// 1. LẮNG NGHE SỰ KIỆN TỪ GAME (PAWN) GỬI SANG
if (typeof cef !== 'undefined') {
    cef.on("render_inventory", (jsonString) => {
        // Hiện giao diện lên màn hình
        document.getElementById('inventory-body').style.display = 'block';
        // Giải mã chuỗi dữ liệu JSON nhận được từ Server thành mảng
        currentData = JSON.parse(jsonString);
        // Tiến hành vẽ lưới vật phẩm
        renderInventory();
    });
}

// 2. HÀM DỰNG (RENDER) LƯỚI TÚI ĐỒ VÀ CÁC SLOT
function renderInventory() {
    const grid = document.getElementById('grid-container');
    grid.innerHTML = ''; // Xóa sạch dữ liệu cũ trước khi vẽ lại

    currentData.forEach(item => {
        const slotDiv = document.createElement('div');
        // Nếu slot này đang được chọn thì kích hoạt class "active" (đổi màu viền)
        slotDiv.className = 'item-slot' + (selectedSlot === item.slot ? ' active' : '');
        
        // Sự kiện khi người chơi nhấp chọn ô đồ này
        slotDiv.onclick = () => selectItem(item.slot);

        // Kiểm tra nếu ID > 0 (tức là ô có chứa vật phẩm)
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

    // Cập nhật lại thông số hiển thị bảng thông tin chi tiết bên phải
    updateRightPanel();
}

// 3. HÀM CHỌN VẬT PHẨM
function selectItem(slotIndex) {
    selectedSlot = slotIndex;
    renderInventory(); // Gọi lại hàm render để cập nhật viền sáng xanh ngọc cho ô được chọn
}

// 4. HÀM CẬP NHẬT THÔNG TIN CHI TIẾT VẬT PHẨM BẢNG PHẢI
function updateRightPanel() {
    const rightPanel = document.getElementById('right-panel');
    const item = currentData.find(i => i.slot === selectedSlot);

    // Nếu chọn trúng ô có đồ
    if (item && item.id !== 0) {
        rightPanel.style.visibility = 'visible'; // Hiện bảng lên
        document.getElementById('detail-name').innerText = item.name;
        document.getElementById('detail-desc').innerText = `Vật phẩm: ${item.name} | Số lượng hiện có: ${item.count}`;
        document.getElementById('detail-img').src = itemImages[item.id] || 'assets/default.png';
    } else {
        rightPanel.style.visibility = 'hidden'; // Nếu bấm vào ô trống thì tự động ẩn bảng phải
    }
}

// 5. HÀM GỬI LỆNH TƯƠNG TÁC VỀ LẠI SERVER (PAWN)
function actionItem(eventName) {
    if (selectedSlot === -1) return;
    
    if (typeof cef !== 'undefined') {
        // Gửi ID của slot đang tương tác về cho callback OnCefEvent xử lý tiếp
        cef.emit(eventName, selectedSlot.toString());
    } else {
        // Log ra màn hình Console F12 để bạn dễ dàng debug khi test trên trình duyệt PC
        console.log(`[TEST MODE] Đã gửi sự kiện: ${eventName} | Tại ô Slot số: ${selectedSlot}`);
    }
}

// 6. HÀM ĐÓNG GIAO DIỆN
function closeInventory() {
    document.getElementById('inventory-body').style.display = 'none';
    selectedSlot = -1; // Reset lại ô chọn về mặc định
    if (typeof cef !== 'undefined') {
        cef.emit("inv_close");
    }
}
