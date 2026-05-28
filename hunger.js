/* ================= HUD HUNGER & THIRST ================= */

// Hàm cập nhật giao diện thanh HUD
function updateStatusHUD(eventData) {
    const data = JSON.parse(eventData);
    // Sử dụng Math.min/max để giới hạn trong khoảng 0-100
    const hunger = Math.max(0, Math.min(100, parseFloat(data[0])));
    const thirst = Math.max(0, Math.min(100, parseFloat(data[1])));

    const hungerBar = document.getElementById('hunger-bar');
    const thirstBar = document.getElementById('thirst-bar');

    if (hungerBar) {
        hungerBar.style.width = `${hunger}%`;
        hungerBar.style.backgroundColor = hunger < 20 ? '#ff3d00' : '#ff9f1a';
    }

    if (thirstBar) {
        thirstBar.style.width = `${thirst}%`;
        thirstBar.style.backgroundColor = thirst < 20 ? '#ff3d00' : '#3498db';
    }
}


// Đăng ký sự kiện hứng từ Server (Pawn/Lua)
// Tên sự kiện "hud_update" là tên bạn sẽ gọi bên phía Server
Cef.registerEventCallback("hud_update", "updateStatusHUD");
