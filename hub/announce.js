// --- 1. ANNOUNCEMENT LOGIC ---
let annQueue = [];
let annActive = false;
let annTimeout = null;

function showAnn(msg) {
    annQueue.push(msg);
    processAnn();
}

function processAnn() {
    if (annActive || annQueue.length === 0) return;
    annActive = true;
    const msg = annQueue.shift();
    const container = document.getElementById('announcement-container');
    const text = document.getElementById('announcement-text');
    const bar = document.getElementById('ann-bar');

    text.innerText = msg;
    const duration = Math.max(7000, msg.length * 90);
    
    // Reset animation bằng cách clone element (Trick để restart CSS animation)
    const newText = text.cloneNode(true);
    text.parentNode.replaceChild(newText, text);
    const newBar = bar.cloneNode(true);
    bar.parentNode.replaceChild(newBar, bar);

    newText.innerText = msg;
    
    container.style.display = 'block';
    container.classList.remove('ann-hide');
    container.classList.add('ann-show');
    
    newText.style.animation = `marquee ${duration/1000}s linear infinite`;
    newBar.style.animation = `progress ${duration/1000}s linear`;

    annTimeout = setTimeout(() => {
        container.classList.remove('ann-show');
        container.classList.add('ann-hide');
        setTimeout(() => {
            container.style.display = 'none';
            annActive = false;
            processAnn();
        }, 400);
    }, duration);
}

// --- CEF INTEGRATION (Announce) PC ---
if (typeof cef !== 'undefined') {
    cef.on("show_announcement", (msg) => showAnn(msg));
}

// --- ANDROID WEBVIEW BRIDGE (MOBILE) ---
window.onJavaShowAnnouncement = function(msg) {
    try {
        // Trả lại dấu nháy đơn bị escape
        const cleanMsg = msg.replace(/\\'/g, "'"); 
        showAnn(cleanMsg); // Gọi thẳng hàm showAnn giống PC
    } catch (e) {
        console.error("[ANNOUNCE MOBILE] Error:", e);
    }
};