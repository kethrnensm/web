/* ==========================================================
   NPC MENU SYSTEM - GIAO TIẾP PAWN <-> CEF CHUẨN
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
        // Cấu trúc Json gửi xuống: {"name": "Tuấn Ngọc", "job": "AE:Now Ship", "speech": "Xin chào, tôi là..."}
        const data = JSON.parse(json_data);
        
        if(data.name) document.getElementById('npc-name').innerText = data.name;
        if(data.job) document.getElementById('npc-subtext').innerText = data.job;
        // Phần speech hỗ trợ HTML để dùng highlight màu
        if(data.speech) document.getElementById('npc-speech').innerHTML = data.speech;
    } catch(e) {
        // Nếu không có dữ liệu JSON gửi xuống, dùng dữ liệu HTML mặc định
        console.log("CEF không nhận dữ liệu JSON, dùng mặc định.");
    }

    // Hiển thị khung giao diện bằng class 'active'
    document.getElementById('cef-app-npc').classList.add('active');
}

// 2. Hàm khi chọn một dòng tính năng
function npcSelect(action) {
    // Gửi sự kiện về cho Pawn Server xử lý (client:npc_select_action)
    // Ví dụ: Bấm "Xin việc", 'action' sẽ là 'apply'
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
        // Dự phòng nếu thư viện load trễ
        document.addEventListener("OnCefInit", function() {
            Cef.registerEventCallback("server:open_npc_interaction", "openNpcMenu");
            Cef.registerEventCallback("server:close_npc_interaction", "closeNpcMenu");
        });
    }
});
