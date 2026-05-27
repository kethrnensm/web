function createAlert(title, message, callback) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;

    const overlay = document.getElementById('alert-overlay');
    overlay.classList.remove('hidden');

    document.getElementById('okay-button').onclick = () => {
        hideAlert();
        callback(true);
    };

    document.getElementById('cancel-button').onclick = () => {
        hideAlert();
        callback(false);
    };
}

function hideAlert() {
    const overlay = document.getElementById('alert-overlay');
    overlay.classList.add('hidden');
}

function showAlert(eventData) {
	const eventDataJson = JSON.parse(eventData);
	const alertId = parseInt(eventDataJson[0]);
	const alertTitle = eventDataJson[1];
	const alertMessage = eventDataJson[2];
	
	createAlert(alertTitle, alertMessage, (response) => {
		let outgoingEventData = new Array();
		outgoingEventData.push(alertId);
		outgoingEventData.push(response);
		
		console.log(`Response status: ${response}`);
		Cef.sendEvent("alert_response", JSON.stringify(outgoingEventData));
	});
}
/* ================= FIVEM STYLE NOTIFY ================= */
// Cấu trúc Data nhận từ Pawn: ["success", "Tiêu Đề", "Nội dung", 5000]
function showModernNotify(eventData) {
    const data = JSON.parse(eventData);
    const type = data[0] || "info"; 
    const title = data[1] || "THÔNG BÁO";
    const message = data[2] || "";
    const duration = parseInt(data[3]) || 5000;

    const container = document.getElementById("notify-container");
    if (!container) return;

    // Kho SVG Icons (Chất lượng cao, không cần tải thêm file)
    const icons = {
        success: `<svg class="notify-icon" style="fill:#00E676;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
        error: `<svg class="notify-icon" style="fill:#FF3D00;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
        warning: `<svg class="notify-icon" style="fill:#FFC400;" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
        info: `<svg class="notify-icon" style="fill:#00B0FF;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
    };

    const notifyBox = document.createElement("div");
    notifyBox.className = `notify-box ${type}`;

    // Khởi tạo HTML bên trong Notify
    notifyBox.innerHTML = `
        ${icons[type] || icons.info}
        <div class="notify-content">
            <div class="notify-title" style="color: ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : type === 'warning' ? '#FFC400' : '#00B0FF'}">${title}</div>
            <div class="notify-message">${message}</div>
        </div>
        <div class="notify-progress">
            <div class="notify-progress-fill" style="transition: width ${duration}ms linear;"></div>
        </div>
    `;

    // Thêm vào vùng chứa
    container.appendChild(notifyBox);

    // Kích hoạt thanh Progress Bar tụt từ 100% về 0%
    setTimeout(() => {
        const progressFill = notifyBox.querySelector('.notify-progress-fill');
        if (progressFill) progressFill.style.width = '0%';
    }, 50); // Delay 50ms để CSS kịp bắt transition

    // Kích hoạt animation slide-out khi hết giờ
    setTimeout(() => {
        notifyBox.classList.add("hiding");
        // Đợi animation trượt ra chạy xong (400ms) rồi mới xóa DOM
        setTimeout(() => notifyBox.remove(), 400); 
    }, duration);
}

// Đăng ký sự kiện hứng từ Pawn CEF API
Cef.registerEventCallback("notify_show", "showModernNotify");

Cef.registerEventCallback("alert_show", "showAlert");
