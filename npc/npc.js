// HÀM GỬI DỮ LIỆU LÊN SERVER PAWN CHUẨN CEF SA-MP
function sendToPawn(eventName, data = "") {
    if (typeof Cef !== 'undefined' && typeof Cef.sendEvent === 'function') {
        Cef.sendEvent(eventName, String(data));
    } else {
        // Log debug khi kiểm tra giao diện trên trình duyệt máy tính
        console.log(`[CEF DEBUG] Event: ${eventName} | Data: ${data}`);
    }
}

// 1. Hàm mở menu và nạp dữ liệu động (Được gọi từ Pawn xuống)
window.openNpcMenu = function(json_data) {
    try {
        // Dữ liệu nhận dạng: {"name": "Tuấn Ngọc", "job": "AE:Now Ship", "text": "..."}
        const data = JSON.parse(json_data);
        
        if(data.name) document.getElementById('npc-name').innerText = data.name;
        if(data.job) document.getElementById('npc-subtext').innerText = data.job;
        if(data.text) document.getElementById('npc-speech').innerHTML = data.text;
    } catch(e) {
        console.log("Không dùng dữ liệu động, chạy dữ liệu mặc định.");
    }

    // Hiển thị khung giao diện
    document.getElementById('npc-container').classList.add('active');
}

// 2. Hàm khi chọn một dòng tính năng bất kỳ
function selectOption(actionName) {
    // Gửi sự kiện về cho Pawn xử lý (ví dụ: client:npc_select) kèm theo tên hành động
    sendToPawn('client:npc_select', actionName);
    
    // Tùy chọn: Tự động đóng menu sau khi lựa chọn thành công
    closeNpcMenu();
}

// 3. Hàm đóng menu (Bấm nút đóng hoặc gọi từ Pawn)
window.closeNpcMenu = function() {
    document.getElementById('npc-container').classList.remove('active');
    
    // Gửi tín hiệu về Pawn để giải phóng tiêu điểm chuột và phím di chuyển
    sendToPawn('client:npc_close');
}

// ĐĂNG KÝ CALLBACK VỚI THƯ VIỆN CEF GAME
document.addEventListener("DOMContentLoaded", function() {
    if (typeof Cef !== 'undefined') {
        Cef.registerEventCallback("server:open_npc_menu", "openNpcMenu");
        Cef.registerEventCallback("server:close_npc_menu", "closeNpcMenu");
    } else {
        document.addEventListener("OnCefInit", function() {
            Cef.registerEventCallback("server:open_npc_menu", "openNpcMenu");
            Cef.registerEventCallback("server:close_npc_menu", "closeNpcMenu");
        });
    }
});
