try {
    const groupContainer = document.getElementById('group-container');

    function createGroupNotify(data) {
        if(!groupContainer) return;
        
        const duration = (data.time || 10) * 1000;
        const color = data.color || '#95a5a6';
        
        let iconClass = 'fa-bell';
        if(data.title == 'POLICE') iconClass = 'fa-shield-halved';
        else if(data.title == 'EMS' || data.title == 'MEDIC') iconClass = 'fa-truck-medical';
        else if(data.title == 'TAXI') iconClass = 'fa-taxi';
        else if(data.title == 'MECHANIC') iconClass = 'fa-wrench';

        const card = document.createElement('div');
        card.className = 'g-card'; 
        card.style.borderLeftColor = color;

        card.innerHTML = `
            <div class="g-header">
                <div class="g-title-block">
                    <i class="fas ${iconClass} g-icon" style="color: ${color}"></i>
                    <span class="g-title" style="color: ${color}">${data.title}</span>
                </div>
                <div class="g-subtitle">${data.subtitle}</div>
            </div>
            <div class="g-body">
                <div class="g-message">${data.message}</div>
                <div class="g-zone">
                    <i class="fas fa-location-dot"></i> ${data.zone}
                </div>
            </div>
            <div class="g-progress">
                <div class="g-fill" style="background: ${color}; animation-duration: ${duration}ms"></div>
            </div>
        `;

        groupContainer.prepend(card);
        requestAnimationFrame(() => card.classList.add('show'));

        // Tự động đóng sau thời gian quy định
        setTimeout(() => {
            removeGroupCard(card);
        }, duration);
    }

    function removeGroupCard(card) {
        if (!card) return;
        card.classList.remove('show');
        card.classList.add('hide');
        
        setTimeout(() => {
            if(card.parentNode) card.parentNode.removeChild(card);
        }, 450); // Đợi hiệu ứng transition kết thúc
    }

    // --- LẮNG NGHE CEF ---
    if (typeof cef !== 'undefined') {
        cef.on("show_group_notify", (jsonString) => {
            try {
                const data = (typeof jsonString === 'string') ? JSON.parse(jsonString) : jsonString;
                createGroupNotify(data);
                
                // Giải phóng focus để người chơi có thể tiếp tục điều khiển game
                setTimeout(() => {
                   if (typeof cef !== 'undefined') cef.focus(false);
                }, 50);
            } catch (e) {
                console.error("Group JSON Error:", e);
            }
        });
    }

    // 2. Dành cho Mobile (Android WebView Bridge - Giống với HUD)
    window.onJavaShowGroupNotification = function(jsonString) {
        try {
            const cleanJson = jsonString.replace(/\\'/g, "'");
            const data = JSON.parse(cleanJson);
            createGroupNotify(data); // ĐÃ SỬA THÀNH CREATE GROUP NOTIFY!
        } catch (e) {
            console.error("[GROUP NOTIFY MOBILE] Error:", e);
        }
    };

} catch(err) {
    console.log("Global Group Notify Error: " + err);
}