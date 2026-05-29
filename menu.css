/* ==========================================================
   CẤU HÌNH CỔNG KẾT NỐI CEF (CHỐNG LỖI SẬP SCRIPT TRÊN MOBILE)
   ========================================================== */
// Tự động nhận diện launcher dùng chữ hoa "Cef" hay chữ thường "cef"
const SAMPCF = (typeof Cef !== 'undefined') ? Cef : ((typeof cef !== 'undefined') ? cef : null);

if (!SAMPCF) {
    console.warn("Cảnh báo: Không tìm thấy thư viện CEF của Launcher. Có thể đang chạy trên trình duyệt PC để test.");
}

/* ==========================================================
   HÀM ĐỒNG BỘ ĐÓNG/MỞ MENU TỪ SERVER PAWN
   ========================================================== */
function toggleRadialMenu(eventData) {
    try {
        console.log("-> [Radial Menu] Nhận lệnh toggle từ Pawn, Dữ liệu:", eventData);
        
        let isVisible = false;
        
        // Tự động xử lý nếu dữ liệu truyền về là chuỗi JSON hoặc mảng thuần
        if (typeof eventData === 'string') {
            const data = JSON.parse(eventData);
            isVisible = data[0]; 
        } else if (Array.isArray(eventData)) {
            isVisible = eventData[0];
        } else {
            isVisible = !!eventData;
        }
        
        const menu = document.getElementById('radialMenuOverlay');
        if (menu) {
            menu.style.display = isVisible ? 'flex' : 'none';
            console.log("-> [Radial Menu] Trạng thái hiển thị hiện tại:", menu.style.display);
        } else {
            console.error("-> [Radial Menu] LỖI: Không tìm thấy thẻ HTML có id='radialMenuOverlay'");
        }
    } catch (e) {
        console.error("-> [Radial Menu] Lỗi xử lý hàm toggleRadialMenu:", e);
    }
}
// Đăng ký cổng nhận sự kiện mở từ Server SA-MP
if (SAMPCF) {
    SAMPCF.registerEventCallback("toggle_radial", "toggleRadialMenu");
}


/* ==========================================================
   HÀM XỬ LÝ KHI BẤM NÚT "CLOSE" Ở GIỮA
   ========================================================== */
function closeRadialMenu() {
    console.log("-> [Radial Menu] Người chơi đã click nút [CLOSE]");
    
    // 1. Ẩn menu ngay lập tức trên màn hình
    const menu = document.getElementById('radialMenuOverlay');
    if (menu) {
        menu.style.display = 'none';
    }
    
    // 2. Gửi sự kiện báo cho file Pawn biết menu đã đóng
    if (SAMPCF) {
        SAMPCF.sendEvent("radial_closed", "[]"); 
        console.log("-> [Radial Menu] Đã gửi sự kiện 'radial_closed' về Pawn.");
    }
}


/* ==========================================================
   HÀM XỬ LÝ KHI BẤM CHỌN CÁC Ô TÍNH NĂNG (BALO, THÔNG TIN...)
   ========================================================== */
function selectRadialItem(actionName) {
    console.log(`-> [Radial Menu] Người chơi đã click chọn ô: [${actionName.toUpperCase()}]`);
    
    // 1. Ẩn menu ngay lập tức để tránh đè giao diện
    const menu = document.getElementById('radialMenuOverlay');
    if (menu) {
        menu.style.display = 'none';
    }
    
    // 2. Gửi dữ liệu lựa chọn về cho hệ thống Pawn xử lý
    if (SAMPCF) {
        SAMPCF.sendEvent("radial_action", `["${actionName}"]`);
        console.log(`-> [Radial Menu] Đã gửi radial_action với tham số ["${actionName}"] về Pawn.`);
    }
}
