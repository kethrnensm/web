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

// Đăng ký nhận sự kiện từ hệ thống game của bạn
Cef.registerEventCallback("hud_update", "updateStatusHUD");
