function updateStatusHUD(eventData) {
    try {
        const data = JSON.parse(eventData);
        // data[0] là đói, data[1] là nước. Giới hạn giá trị từ 0 đến 100.
        const hunger = Math.max(0, Math.min(100, parseFloat(data[0])));
        const thirst = Math.max(0, Math.min(100, parseFloat(data[1])));

        // Cập nhật giao diện Thức ăn
        const hungerBar = document.getElementById('hunger-bar');
        const hungerText = document.getElementById('hunger-text');
        if (hungerBar) hungerBar.style.width = `${hunger}%`;
        if (hungerText) hungerText.innerText = `${Math.round(hunger)}%`;

        // Cập nhật giao diện Nước uống
        const waterBar = document.getElementById('water-bar');
        const waterText = document.getElementById('water-text');
        if (waterBar) waterBar.style.width = `${thirst}%`;
        if (waterText) waterText.innerText = `${Math.round(thirst)}%`;

    } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu HUD hình ảnh:", error);
    }
}
// Hàm Ẩn/Hiện giao diện HUD
function toggleHUD(eventData) {
    try {
        const data = JSON.parse(eventData);
        const isVisible = data[0]; // Server sẽ gửi true (hiện) hoặc false (ẩn)

        // Tìm thẻ container chứa toàn bộ HUD của bạn (thay class cho khớp với HTML của bạn)
        const hudContainer = document.querySelector('.game-hud-container'); 
        
        if (hudContainer) {
            // Chuyển đổi trạng thái hiển thị
            hudContainer.style.display = isVisible ? 'flex' : 'none'; 
        }
    } catch (error) {
        console.error("Lỗi đồng bộ trạng thái Ẩn/Hiện HUD:", error);
    }
}

// Đăng ký nhận sự kiện Ẩn/Hiện từ Server
Cef.registerEventCallback("hud_toggle", "toggleHUD");

// Đăng ký nhận sự kiện từ hệ thống game của bạn
Cef.registerEventCallback("hud_update", "updateStatusHUD");
