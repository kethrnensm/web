// Hàm đóng/mở menu nhận lệnh từ máy chủ Pawn
function toggleRadialMenu(eventData) {
    try {
        const data = JSON.parse(eventData);
        const isVisible = data[0]; 
        const menu = document.getElementById('radialMenuOverlay');
        
        if (menu) {
            menu.style.display = isVisible ? 'flex' : 'none';
        }
    } catch (e) {
        console.error("Lỗi Toggle Radial Menu", e);
    }
}

Cef.registerEventCallback("toggle_radial", "toggleRadialMenu");

function closeRadialMenu() {
    document.getElementById('radialMenuOverlay').style.display = 'none';
    // Mở khóa chuột hoặc báo cho server biết menu đã đóng
    Cef.sendEvent("radial_closed", "[]"); 
}

// Hàm chạy khi người chơi bấm vào một tính năng
function selectRadialItem(actionName) {
    // 1. Đóng giao diện
    closeRadialMenu(); 
    
    // 2. Gửi lệnh về Pawn để xử lý tính năng
    // Dữ liệu gửi đi dạng chuỗi JSON ["thongtin"], ["balo"]...
    Cef.sendEvent("radial_action", `["${actionName}"]`);
}
