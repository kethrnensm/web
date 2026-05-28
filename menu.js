// Hàm Đóng/Mở hiển thị menu nhận lệnh từ máy chủ Pawn
function toggleRadialMenu(eventData) {
    try {
        const data = JSON.parse(eventData);
        const isVisible = data[0]; 
        const menu = document.getElementById('radialMenuOverlay');
        
        if (menu) {
            menu.style.display = isVisible ? 'flex' : 'none';
        }
    } catch (e) {
        console.error("Lỗi khi đồng bộ hiển thị Radial Menu:", e);
    }
}
// Đăng ký cổng nhận sự kiện mở từ Server SA-MP
Cef.registerEventCallback("toggle_radial", "toggleRadialMenu");


// Hàm xử lý đóng Menu
function closeRadialMenu() {
    const menu = document.getElementById('radialMenuOverlay');
    if (menu) {
        menu.style.display = 'none';
    }
    // Gửi sự kiện báo cho file Pawn biết menu đã đóng (để tắt chuột/mở khóa di chuyển)
    Cef.sendEvent("radial_closed", "[]"); 
}


// Hàm xử lý khi bấm chọn một chức năng
function selectRadialItem(actionName) {
    // 1. Ẩn menu ngay lập tức
    const menu = document.getElementById('radialMenuOverlay');
    if (menu) {
        menu.style.display = 'none';
    }
    
    // 2. Gửi dữ liệu lựa chọn về cho hệ thống Pawn xử lý
    Cef.sendEvent("radial_action", `["${actionName}"]`);
}
