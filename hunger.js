function updateStatusHUD(eventData) {
    try {
        const data = JSON.parse(eventData);
        // Giả sử data gửi về dạng [hp, hunger, thirst]
        const values = {
            hp: Math.max(0, Math.min(100, parseFloat(data[0]))),
            hunger: Math.max(0, Math.min(100, parseFloat(data[1]))),
            thirst: Math.max(0, Math.min(100, parseFloat(data[2])))
        };

        const elements = {
            hp: document.getElementById('hp-bar'),
            hunger: document.getElementById('hunger-bar'),
            thirst: document.getElementById('water-bar')
        };

        // Cập nhật từng thanh
        for (let key in elements) {
            if (elements[key]) {
                elements[key].style.width = `${values[key]}%`;
            }
        }
    } catch (e) {
        console.error("Lỗi cập nhật HUD:", e);
    }
}

Cef.registerEventCallback("hud_update", "updateStatusHUD");
