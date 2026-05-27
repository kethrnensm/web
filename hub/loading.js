try {
    const container = document.getElementById('orbit-loader');
    const circle = document.getElementById('progress-circle');
    const iconEl = document.getElementById('action-icon');
    const textEl = document.getElementById('action-text');
    const percentEl = document.getElementById('percent-text');

    const circumference = 220; // Chu vi cho r=35
    let updateInterval = null;

    function getTheme(text) {
        const t = (text || '').toLowerCase();
        let icon = 'fa-spinner';
        let color = '#00d2ff'; 

        if(t.includes('ăn') || t.includes('uống')) { icon = 'fa-burger'; color = '#ff9f43'; }
        else if(t.includes('sửa') || t.includes('chế') || t.includes('xe')) { icon = 'fa-wrench'; color = '#54a0ff'; }
        else if(t.includes('cứu') || t.includes('y tế') || t.includes('thuốc')) { icon = 'fa-briefcase-medical'; color = '#ff6b6b'; }
        else if(t.includes('cướp') || t.includes('bẻ') || t.includes('lấy')) { icon = 'fa-mask'; color = '#ee5253'; }
        else if(t.includes('giao') || t.includes('vận')) { icon = 'fa-box'; color = '#feca57'; }
        else if(t.includes('khai') || t.includes('đào')) { icon = 'fa-hammer'; color = '#1dd1a1'; }

        return { icon, color };
    }

    function startLoading(text, time) {
        if(!container || !circle) return;

        if(updateInterval) clearInterval(updateInterval);
        
        // Reset trạng thái
        circle.style.transition = 'none';
        circle.style.strokeDashoffset = circumference;
        percentEl.innerText = '0%';
        
        // Cập nhật nội dung
        textEl.innerText = text;
        const theme = getTheme(text);
        
        iconEl.className = `fa-solid ${theme.icon} main-icon`;
        circle.style.stroke = theme.color;
        circle.style.color = theme.color; // Dùng cho drop-shadow

        // Hiện loader
        container.classList.add('show');
        void circle.offsetWidth; // Trigger reflow

        // Bắt đầu chạy vòng tròn
        circle.style.transition = `stroke-dashoffset ${time}ms linear`;
        
        requestAnimationFrame(() => {
            circle.style.strokeDashoffset = '0';
        });

        // Chạy số %
        let startTime = Date.now();
        updateInterval = setInterval(() => {
            let elapsed = Date.now() - startTime;
            let progress = Math.min(100, Math.floor((elapsed / time) * 100));
            percentEl.innerText = progress + '%';
            if (progress >= 100) clearInterval(updateInterval);
        }, 50);
    }

    function stopLoading() {
        if(!container) return;
        
        container.classList.remove('show');
        if(updateInterval) clearInterval(updateInterval);
        
        // Reset về vị trí ban đầu sau khi ẩn
        setTimeout(() => {
            if(circle) {
                circle.style.transition = 'none';
                circle.style.strokeDashoffset = circumference;
            }
        }, 400);
    }

    window.onJavaStartLoading = function(text, time) {
        // Ép kiểu time về số nguyên vì Java thường truyền qua dạng chuỗi
        startLoading(text, parseInt(time)); 
    };

    window.onJavaStopLoading = function() {
        stopLoading();
    };

} catch(err) {
    console.log("Global Loading Error: " + err);
}