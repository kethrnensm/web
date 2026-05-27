/* ==========================================================
   NPC MENU SYSTEM - GIAO TIẾP PAWN <-> CEF CHUẨN (BẢN ĐỘNG)
   ========================================================== */

// Hàm gửi sự kiện CEF lên server Pawn
function sendToPawn(eventName, data = "") {
    if (typeof Cef !== 'undefined' && typeof Cef.sendEvent === 'function') {
        Cef.sendEvent(eventName, String(data));
    } else {
        // Chỉ dùng để Debug trên PC trình duyệt (nếu không có game)
        console.log(`[TEST WEB] Gửi Event: ${eventName} | Data: ${data}`);
    }
}

// 1. Hàm được gọi từ Pawn xuống để MỞ menu và nạp dữ liệu động
window.openNpcMenu = function(json_data) {
    try {
        // Cấu trúc Json gửi xuống từ Pawn
        const data = JSON.parse(json_data);
        
        if(data.name) document.getElementById('npc-name').innerText = data.name;
        if(data.job) document.getElementById('npc-subtext').innerText = data.job;
        if(data.speech) document.getElementById('npc-speech').innerHTML = data.speech;
        
        // 🔥 ĐOẠN ĐÃ ĐƯỢC CHỈNH SỬA: Tự động vẽ danh sách nút từ Pawn gửi xuống
        const btnContainer = document.getElementById('npc-buttons-container');
        if(btnContainer) {
            btnContainer.innerHTML = ""; // Xóa sạch các nút của NPC trước đó tránh trùng lặp
            
            if(data.buttons && Array.isArray(data.buttons)) {
                data.buttons.forEach(btn => {
                    // Tự động render cấu trúc HTML chuẩn kèm Class Icon và Mã Màu từ Pawn
                    btnContainer.innerHTML += `
                        <button class="option-btn" onclick="npcSelect('${btn.action}')">
                            <i class="fa-solid ${btn.icon}" style="color: ${btn.color} !important;"></i>
                            <span>${btn.text}</span>
                        </button>
                    `;
                });
            }
        }
    } catch(e) {
        console.log("CEF lỗi xử lý JSON dữ liệu hoặc chuỗi gửi xuống sai định dạng:", e);
    }

    // Hiển thị khung giao diện bằng class 'active'
    document.getElementById('cef-app-npc').classList.add('active');
}

// 2. Hàm khi chọn một dòng tính năng
function npcSelect(action) {
    // Nếu bấm trúng nút có hành động đóng giao diện thì tắt luôn ở client cho mượt
    if(action === 'close') {
        window.closeNpcMenu();
        return;
    }
    
    // Gửi sự kiện về cho Pawn Server xử lý (client:npc_select_action)
    sendToPawn('client:npc_select_action', action);
}

// 3. Hàm ĐÓNG menu (Bấm nút Đóng hoặc gọi từ Pawn xuống)
window.closeNpcMenu = function() {
    document.getElementById('cef-app-npc').classList.remove('active');
    
    // Báo về Pawn để giải phóng chuột (client:npc_close)
    sendToPawn('client:npc_close');
}

// ĐĂNG KÝ CALLBACK LẮNG NGHE SỰ KIỆN TỪ GAME GỬI XUỐNG
document.addEventListener("DOMContentLoaded", function() {
    if (typeof Cef !== 'undefined') {
        Cef.registerEventCallback("server:open_npc_interaction", "openNpcMenu");
        Cef.registerEventCallback("server:close_npc_interaction", "closeNpcMenu");
    } else {
        // Dự phòng nếu thư viện load trễ trên mobile
        document.addEventListener("OnCefInit", function() {
            Cef.registerEventCallback("server:open_npc_interaction", "openNpcMenu");
            Cef.registerEventCallback("server:close_npc_interaction", "closeNpcMenu");
        });
    }
});
