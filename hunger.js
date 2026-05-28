// Hàm tiếp nhận lệnh ẩn/hiện từ Pawn
function toggleHudStatus(status) {
    try {
        const hudContainer = document.getElementById('player-hud-stats');
        if (!hudContainer) return;

        if (parseInt(status, 10) === 1) {
            hudContainer.style.display = 'flex'; // Hiện HUD
        } else {
            hudContainer.style.display = 'none'; // Ẩn HUD
        }
    } catch (e) { console.error(e); }
}

/* Bộ lọc dữ liệu đa năng chống sập Script */
function updatePlayerStats(arg1, arg2) {
    let hunger = 100;
    let thirst = 100;

    try {
        if (typeof arg1 === 'string' && arg1.trim().startsWith('[')) {
            const data = JSON.parse(arg1);
            hunger = parseInt(data[0], 10);
            thirst = parseInt(data[1], 10);
        } 
        else if (arg1 !== undefined) {
            hunger = parseInt(arg1, 10);
            if (arg2 !== undefined) {
                thirst = parseInt(arg2, 10);
            }
        }

        if (isNaN(hunger) || hunger < 0) hunger = 0; if (hunger > 100) hunger = 100;
        if (isNaN(thirst) || thirst < 0) thirst = 0; if (thirst > 100) thirst = 100;

        // CẬP NHẬT THANH THỨC ĂN (HUNGER)
        const barHunger = document.getElementById('bar-hunger');
        const textHunger = document.getElementById('text-hunger');
        if (barHunger && textHunger) {
            barHunger.style.width = hunger + "%";
            textHunger.innerText = hunger + "%";

            const hungerBox = barHunger.closest('.stat-bar-box');
            if (hunger <= 20) hungerBox.classList.add('bar-danger');
            else hungerBox.classList.remove('bar-danger');
        }

        // CẬP NHẬT THANH NƯỚC UỐNG (THIRST)
        const barThirst = document.getElementById('bar-thirst');
        const textThirst = document.getElementById('text-thirst');
        if (barThirst && textThirst) {
            barThirst.style.width = thirst + "%";
            textThirst.innerText = thirst + "%";

            const thirstBox = barThirst.closest('.stat-bar-box');
            if (thirst <= 20) thirstBox.classList.add('bar-danger');
            else thirstBox.classList.remove('bar-danger');
        }

    } catch (error) {
        console.error("[CEF HUD Error] Lỗi phân tích:", error);
    }
}

// ĐĂNG KÝ LẮNG NGHE SỰ KIỆN TỪ GAME SERVER
if (typeof Cef !== 'undefined') {
    Cef.registerEventCallback("hud_toggle", "toggleHudStatus");
    Cef.registerEventCallback("hud_update_stats", "updatePlayerStats");
}
