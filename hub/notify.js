try {
    const MAX_NOTIFICATIONS = 5;
    const NOTIFICATION_QUEUE = [];

    const notifyTypes = {
        0: { icon: 'fa-check-circle', title: 'THÀNH CÔNG' },
        1: { icon: 'fa-times-circle', title: 'THẤT BẠI' },
        2: { icon: 'fa-info-circle',  title: 'THÔNG TIN' },
        3: { icon: 'fa-exclamation-triangle', title: 'CẢNH BÁO' }
    };

    const notifyContainer = document.getElementById('notify-container');

    function processNotifyQueue() {
        if (!notifyContainer) return;
        if (NOTIFICATION_QUEUE.length === 0) return;
        if (notifyContainer.children.length >= MAX_NOTIFICATIONS) return;

        const next = NOTIFICATION_QUEUE.shift();
        displayNotification(next.type, next.message, next.time);
    }

    function displayNotification(type, message, time) {
        if (!notifyContainer) return;

        const config = notifyTypes[type] || notifyTypes[2];
        const duration = (time || 5) * 1000; // Mặc định 5s nếu thiếu
        
        const card = document.createElement('div');
        card.className = `notify-card type-${type}`;
        card.innerHTML = `
            <div class="notify-header">
                <i class="fas ${config.icon} notify-icon"></i>
                <span class="notify-title">${config.title}</span>
            </div>
            <div class="notify-message">${message}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="animation-duration: ${duration}ms"></div>
            </div>
        `;

        // Tự động xóa sau khi animation progress kết thúc
        const progressBar = card.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.addEventListener('animationend', () => {
                closeNotifyCard(card);
            }, { once: true });
        }

        // Fallback: Nếu animation lỗi thì dùng timeout
        setTimeout(() => {
            if (document.body.contains(card)) closeNotifyCard(card);
        }, duration + 500);

        notifyContainer.prepend(card);

        // Hiệu ứng hiện (slide in)
        requestAnimationFrame(() => {
            card.classList.add('show');
        });
    }

    function closeNotifyCard(card) {
        card.classList.remove('show');
        card.classList.add('hide');
        setTimeout(() => {
            if(card.parentNode) {
                card.parentNode.removeChild(card);
                processNotifyQueue(); // Xử lý tin tiếp theo trong hàng đợi
            }
        }, 400); // Khớp với transition CSS
    }

    function createNotify(type, message, time) {
        if (!notifyContainer) return;
        
        if (notifyContainer.children.length >= MAX_NOTIFICATIONS) {
            NOTIFICATION_QUEUE.push({ type, message, time });
            return;
        }
        displayNotification(type, message, time);
    }

    // --- CEF EVENT LISTENER ---
    // --- BẮT SỰ KIỆN TỪ GAME GỬI SANG ---
    
    // 1. Dành cho PC (CEF Plugin chuẩn)
    if (typeof cef !== 'undefined') {
        cef.on("show_notification", (data) => {
            try {
                const notifyData = (typeof data === 'string') ? JSON.parse(data) : data;
                createNotify(notifyData.type, notifyData.message, notifyData.time);
            } catch (e) {
                console.error("[NOTIFY] Error:", e);
            }
        });
    }

    // 2. Dành cho Mobile (Android WebView Bridge - Giống với HUD)
    window.onJavaShowNotification = function(jsonString) {
        try {
            // Fix lỗi escape ký tự từ Kotlin (giống cách bạn làm ở HUD)
            const cleanJson = jsonString.replace(/\\'/g, "'");
            const data = JSON.parse(cleanJson);
            createNotify(data.type, data.message, data.time);
        } catch (e) {
            console.error("[NOTIFY MOBILE] Error:", e);
        }
    };

} catch (err) {
    console.log("Global Notify Error: " + err);
}