let isOutgoingCall = false; 
let isEndingCall = false;
let currentInput = "";
let isPhoneOpen = false;
let callTimerInterval = null;
let callSeconds = 0;
let phoneContacts = [];
let chatHistory = {}; // Biến lưu toàn bộ lịch sử tin nhắn trong phiên chơi
let currentChatNumber = ""; // Đang mở chat với ai
let bankHistory = []; // Mảng lưu lịch sử giao dịch
let tactoPosts = [];
let myGallery = [];
let contextPhotoUrl = "";
let selectedTactoImgUrl = "";
let currentServiceType = "";
let globalMarketData = null; // Biến nhớ dữ liệu
let bankLoading = false;

// ==========================================
// 1. HỆ THỐNG ĐÓNG / MỞ / ĐIỀU HƯỚNG
// ==========================================
window.showPhone = function(show, timeStr) {
    const phWrapper = document.getElementById('phone-wrapper');
    const phClock = document.getElementById('ph-clock');

    if(!phWrapper) return;

    if(show) {
        phWrapper.classList.add('active');
        isPhoneOpen = true;
        if(timeStr && phClock) phClock.innerText = timeStr;
        window.goHome(); 
        
        // THÊM DÒNG NÀY: Kêu Android bật cảm ứng
        if(window.AndroidHUD && window.AndroidHUD.togglePhoneFocus) {
            window.AndroidHUD.togglePhoneFocus(true);
        }
        
    } else {
        phWrapper.classList.remove('active');
        isPhoneOpen = false;
        
        window.sendToGame('client:phone_close');
        
        // THÊM DÒNG NÀY: Kêu Android tắt cảm ứng, trả chuột cho game
        if(window.AndroidHUD && window.AndroidHUD.togglePhoneFocus) {
            window.AndroidHUD.togglePhoneFocus(false);
        }
    }
}

window.handleHomeBtn = function() {
    const homeScreen = document.getElementById('app-home');
    const callBanner = document.getElementById('ph-call-banner');
    
    const isCalling = callBanner && callBanner.classList.contains('show');
    
    if(homeScreen && homeScreen.classList.contains('active')) {
        if(isCalling) return; 
        window.showPhone(false);
    } else {
        window.goHome();
    }
}

window.goHome = function() {
    const wrapper = document.getElementById('phone-wrapper');
    const screens = document.querySelectorAll('.ph-screen');
    const homeScreen = document.getElementById('app-home');

    // 🔥 FIX LỖI KẸT CAMERA: Luôn luôn ép lột bỏ chế độ toàn màn hình khi về Home
    if(wrapper) {
        wrapper.classList.remove('fullscreen-camera');
    }

    screens.forEach(el => el.classList.remove('active'));
    if(homeScreen) homeScreen.classList.add('active');
}

window.openApp = function(appName) {
    const screens = document.querySelectorAll('.ph-screen');
    screens.forEach(el => el.classList.remove('active'));

    const target = document.getElementById(`app-${appName}`);
    if(target) {
        target.classList.add('active');
        
        // Dùng Hàm Tổng Tài để tự động phân luồng bắn lệnh cho cả PC và Mobile
        if(appName === 'contacts') {
            window.sendToGame('client:phone_get_contacts');
        }
        
        if(appName === 'bank') {
            if(bankLoading) return; // chặn spam
            bankLoading = true;
            setTimeout(() => bankLoading = false, 3000); // reset sau 3s
            window.sendToGame('client:phone_get_bank');
        }
        
        if(appName === 'tacto') {
            window.sendToGame('client:phone_get_tacto');
        }
        
        if(appName === 'gallery') {
            window.sendToGame('client:phone_get_gallery');
        }
        
        if(appName === 'market') {
            window.sendToGame('client:phone_get_market');
        }
    }
}

// ==========================================
// 2. BÀN PHÍM & GỌI ĐIỆN
// ==========================================
window.dial = function(key) {
    if(key === 'del') {
        currentInput = currentInput.slice(0, -1);
    } else {
        if(currentInput.length < 12) currentInput += key;
    }
    const display = document.getElementById('ph-input-num');
    if(display) display.innerText = currentInput;
}

window.makeCall = function() {
    if(currentInput.length > 0) {
        // 🔥 DÙNG HÀM TỔNG TÀI
        window.sendToGame('client:phone_call_number', currentInput);
    }
}

window.addContactFromDialer = function() {
    if(currentInput.length > 0) {
        window.sendToGame('client:phone_add_contact', currentInput);
    }
}

// ==========================================
// 3. UI CUỘC GỌI BẰNG BANNER 
// ==========================================
window.showIncomingCall = function(callerName, callerNumber) {
    isOutgoingCall = false; 
    isEndingCall = false;

    const nameEl = document.getElementById('ph-caller-name');
    const numberEl = document.getElementById('ph-caller-number');
    const banner = document.getElementById('ph-call-banner');
    const phWrapper = document.getElementById('phone-wrapper');
    const btnAnswer = document.querySelector('.btn-answer');
    
    // Khôi phục nút Nghe
    if(btnAnswer) btnAnswer.style.display = '';

    if(nameEl) nameEl.innerText = callerName;
    if(numberEl) numberEl.innerText = "SDT: " + callerNumber;
    if(banner) banner.classList.add('show');

    if(!isPhoneOpen && phWrapper) {
        phWrapper.classList.add('peeking');
        phWrapper.classList.remove('active');
    }
};

window.showOutgoingCall = function(targetName, targetNumber) {
    isOutgoingCall = true;  
    isEndingCall = false;
    
    const nameEl = document.getElementById('ph-caller-name');
    const numberEl = document.getElementById('ph-caller-number');
    const banner = document.getElementById('ph-call-banner');
    const phWrapper = document.getElementById('phone-wrapper');
    const btnAnswer = document.querySelector('.btn-answer');
    
    if(btnAnswer) btnAnswer.style.display = 'none';

    if(nameEl) nameEl.innerText = targetName;
    if(numberEl) numberEl.innerText = "Đang đổ chuông...";
    if(banner) banner.classList.add('show');

    if(phWrapper) {
        phWrapper.classList.add('peeking');
        phWrapper.classList.remove('active');
        isPhoneOpen = false; 
    }
};

window.startCallTimer = function() {
    callSeconds = 0;
    const numberEl = document.getElementById('ph-caller-number');
    if(numberEl) numberEl.innerText = "00:00";

    if(callTimerInterval) clearInterval(callTimerInterval);

    callTimerInterval = setInterval(() => {
        callSeconds++;
        let m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
        let s = (callSeconds % 60).toString().padStart(2, '0');
        if(numberEl) numberEl.innerText = `${m}:${s}`;
    }, 1000);
};

window.endCallUI = function() {
    if(isEndingCall) return; 
    isEndingCall = true;

    const numberEl = document.getElementById('ph-caller-number');
    if(numberEl) numberEl.innerText = "Đã kết thúc";

    if(callTimerInterval) clearInterval(callTimerInterval);

    setTimeout(() => {
        const banner = document.getElementById('ph-call-banner');
        const phWrapper = document.getElementById('phone-wrapper');

        if(banner) banner.classList.remove('show');

        if(phWrapper && phWrapper.classList.contains('peeking')) {
            phWrapper.classList.remove('peeking');
            
            if(isOutgoingCall) {
                phWrapper.classList.add('active');
                isPhoneOpen = true;
                window.openApp('dialer'); 
                window.sendToGame('client:phone_focus_on');
            }
        }
        
        currentInput = "";
        const display = document.getElementById('ph-input-num');
        if(display) display.innerText = "";
        
        isOutgoingCall = false; 
    }, 1500); 
};

window.answerCall = function() {
    const btnAnswer = document.querySelector('.btn-answer');
    if(btnAnswer) btnAnswer.style.display = 'none';

    // Gửi lên server để server xử lý AnswerPhoneCall()
    // Server sẽ gửi phone:call_started về cho cả 2 người
    window.sendToGame('client:phone_answer');

    const phWrapper = document.getElementById('phone-wrapper');
    if(phWrapper && phWrapper.classList.contains('peeking')) {
        phWrapper.classList.remove('peeking');
        window.showPhone(true);
    }
};

window.declineCall = function() {
    window.sendToGame('client:phone_hangup'); // Gọi thẳng, vì Hàm Tổng Tài đã tự lo PC/Mobile rồi
    window.endCallUI();
};

// ==========================================
// 4. APP DANH BẠ 
// ==========================================
window.loadContacts = function(contactsJson) {
    try {
        phoneContacts = JSON.parse(contactsJson);
        window.renderContacts(phoneContacts);
    } catch(e) { console.log("Lỗi Parse Danh Bạ:", e); }
}

window.renderContacts = function(list) {
    const listEl = document.getElementById('ph-contact-list');
    if(!listEl) return;
    
    listEl.innerHTML = ""; 
    
    if(list.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px; font-size: 14px;">Chưa có liên hệ nào</div>`;
        return;
    }

    list.sort((a, b) => a.name.localeCompare(b.name));
    const colors = ['#fbc2eb', '#a18cd1', '#ff9a9e', '#fecfef', '#84fab0', '#8fd3f4', '#ffb199'];

    list.forEach(c => {
        const initial = c.name.charAt(0).toUpperCase();
        const bgColor = colors[c.name.length % colors.length];

        listEl.innerHTML += `
            <div class="ph-contact-item">
                <div class="ph-contact-avatar" style="background: ${bgColor}">${initial}</div>
                <div class="ph-contact-info">
                    <div class="ph-contact-name">${c.name}</div>
                    <div class="ph-contact-num">${c.number}</div>
                </div>
                <div class="ph-contact-actions">
                    <div class="ph-contact-btn call" onclick="window.callFromContact('${c.number}')"><i class="fa-solid fa-phone"></i></div>
                    
                    <div class="ph-contact-btn" onclick="window.openChat('${c.name}', '${c.number}')"><i class="fa-solid fa-comment"></i></div>
                </div>
            </div>
        `;
    });
}

window.searchContact = function(val) {
    const keyword = val.toLowerCase();
    const filtered = phoneContacts.filter(c => 
        c.name.toLowerCase().includes(keyword) || 
        c.number.toString().includes(keyword)
    );
    window.renderContacts(filtered);
}

window.callFromContact = function(number) {
    window.openApp('dialer');
    currentInput = number;
    const display = document.getElementById('ph-input-num');
    if(display) display.innerText = currentInput;
    window.makeCall();
}

window.addNewContact = function() {
    window.sendToGame('client:phone_add_contact', "");
}

// ==========================================
// 5. EVENT BÀN PHÍM (VOICE)
// ==========================================
document.addEventListener("keydown", function(event) {
    if (event.key === 'b' || event.key === 'B') {
        if (document.activeElement.tagName === 'INPUT') return;
        const wrapper = document.getElementById('phone-wrapper');
        if (wrapper && (wrapper.classList.contains('active') || wrapper.classList.contains('peeking'))) {
            const oldToast = document.getElementById('ph-voice-toast');
            if(oldToast) oldToast.remove();

            let toast = document.createElement('div');
            toast.id = 'ph-voice-toast';
            toast.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> Bấm [Y] ẩn chuột để dùng Voice!';
            toast.style.position = 'absolute'; toast.style.bottom = '100px';
            toast.style.left = '50%'; toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(255, 59, 48, 0.9)'; toast.style.color = '#fff';
            toast.style.padding = '8px 14px'; toast.style.borderRadius = '20px';
            toast.style.fontSize = '12px'; toast.style.fontWeight = '600';
            toast.style.zIndex = '9999'; toast.style.pointerEvents = 'none';
            toast.style.whiteSpace = 'nowrap'; toast.style.boxShadow = '0 5px 15px rgba(255,0,0,0.4)';
            
            wrapper.appendChild(toast);
            setTimeout(() => { if(toast) toast.remove(); }, 3000);
        }
    }
});

// ==========================================
// THÊM DANH BẠ QUA POPUP CEF
// ==========================================
// Mở popup (có thể tự điền sẵn số nếu bấm từ bàn phím gọi)
window.openAddContactModal = function(prefillNumber = "") {
    const modal = document.getElementById('ph-add-contact-modal');
    const nameInput = document.getElementById('ph-new-name');
    const numberInput = document.getElementById('ph-new-number');

    if(modal) {
        nameInput.value = ""; // Xóa tên cũ
        numberInput.value = prefillNumber; // Điền sẵn số nếu có
        modal.classList.add('active');
    }
}

// Đóng popup
window.closeAddContactModal = function() {
    const modal = document.getElementById('ph-add-contact-modal');
    if(modal) modal.classList.remove('active');
}

// Bấm lưu liên hệ mới
window.submitNewContact = function() {
    const name = document.getElementById('ph-new-name').value.trim();
    const numberStr = document.getElementById('ph-new-number').value.trim();

    if(name.length < 1 || name.length > 31) return;
    if(numberStr.length < 3) return;

    const numberInt = parseInt(numberStr, 10);
    const sendData = name + "|" + numberInt;

    // 🔥 GỌI HÀM TỔNG TÀI LÀ XONG
    window.sendToGame('client:phone_save_contact', sendData);
    
    window.closeAddContactModal();
}

// Ghi đè 2 hàm cũ để gọi Popup thay vì gửi lệnh ngay
window.addContactFromDialer = function() {
    if(currentInput.length > 0) {
        window.openAddContactModal(currentInput); // Mở popup và tự điền số vừa nhập
    } else {
        console.log("Chưa nhập số điện thoại để thêm!");
    }
}

window.addNewContact = function() {
    window.openAddContactModal(); // Bấm dấu + thì mở popup trống
}

// ==========================================
// HỆ THỐNG TIN NHẮN (SMS)
// ==========================================

// Hàm phụ: Lấy tên từ danh bạ nếu có số trùng
function getNameFromContact(number, defaultName = "Số lạ") {
    const found = phoneContacts.find(c => c.number.toString() === number.toString());
    return found ? found.name : defaultName;
}

// 1. Vẽ Danh Sách Các Cuộc Trò Chuyện ra màn hình
window.renderChatList = function() {
    const listEl = document.getElementById('ph-msg-list');
    if(!listEl) return;
    listEl.innerHTML = "";

    const chats = Object.entries(chatHistory);
    
    if(chats.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px; font-size: 14px;">Chưa có tin nhắn nào</div>`;
        return;
    }

    // Đảo ngược mảng để tin nhắn mới nhất nằm trên cùng
    chats.reverse().forEach(([number, chatData]) => {
        if(chatData.messages.length === 0) return;
        
        const lastMsg = chatData.messages[chatData.messages.length - 1];
        const initial = chatData.name.charAt(0).toUpperCase();

        listEl.innerHTML += `
            <div class="ph-msg-item" onclick="openChat('${chatData.name}', '${number}')">
                <div class="ph-msg-avatar" style="background:#007aff">${initial}</div>
                <div class="ph-msg-preview">
                    <div class="ph-msg-top">
                        <span class="ph-msg-name">${chatData.name}</span>
                        <span class="ph-msg-time">Vừa xong</span>
                    </div>
                    <div class="ph-msg-text">${lastMsg.type === 'sent' ? 'Bạn: ' : ''}${lastMsg.text}</div>
                </div>
            </div>
        `;
    });
}

// 2. Mở một cuộc trò chuyện cụ thể
window.openChat = function(name, number) {
    currentChatNumber = number.toString();
    
    // Check lại tên trong danh bạ cho chắc
    let finalName = getNameFromContact(currentChatNumber, name);

    // Nếu chưa có lịch sử, tạo mới 1 mảng rỗng
    if(!chatHistory[currentChatNumber]) {
        chatHistory[currentChatNumber] = { name: finalName, messages: [] };
    }

    // Đổi tên trên Header
    const titleEl = document.querySelector('#ph-chat-title .chat-name');
    if(titleEl) titleEl.innerText = finalName;

    window.openApp('chat');

    // NẠP TOÀN BỘ TIN NHẮN CŨ RA MÀN HÌNH
    const body = document.getElementById('ph-chat-body');
    body.innerHTML = "";
    chatHistory[currentChatNumber].messages.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-row ${m.type}`;
        div.innerHTML = `<div class="chat-bubble">${m.text}</div>`;
        body.appendChild(div);
    });

    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
    renderChatList(); // Cập nhật lại danh sách bên ngoài
}

// 2. Xử lý khi bấm phím Enter trong ô nhập tin nhắn
window.handleChatEnter = function(e) {
    if(e.key === 'Enter') {
        window.sendChatMessage();
    }
}

// 3. Gửi tin nhắn
window.sendChatMessage = function() {
    const inputEl = document.getElementById('ph-chat-input');
    const msg = inputEl.value.trim();

    if(msg.length > 0) {
        // Lưu vào bộ nhớ cục bộ
        if(!chatHistory[currentChatNumber]) {
            let n = getNameFromContact(currentChatNumber, "Số lạ");
            chatHistory[currentChatNumber] = { name: n, messages: [] };
        }
        chatHistory[currentChatNumber].messages.push({ type: 'sent', text: msg });

        // In ngay ra màn hình đang mở
        const body = document.getElementById('ph-chat-body');
        const div = document.createElement('div');
        div.className = `chat-row sent`;
        div.innerHTML = `<div class="chat-bubble">${msg}</div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;

        inputEl.value = "";

        // Gửi lệnh lên Server
        const sendData = currentChatNumber + "|" + msg;
        window.sendToGame('client:phone_send_sms', sendData); // 🔥 GỌI HÀM NÀY LÀ ĐỦ
        
        renderChatList();
    }
}

// Hàm nhận tin nhắn từ Server đẩy xuống
window.receiveSMS = function(senderName, senderNumber, message) {
    let finalName = getNameFromContact(senderNumber, senderName);
    let sNumberStr = senderNumber.toString();

    // Lưu vào bộ nhớ cục bộ
    if(!chatHistory[sNumberStr]) {
        chatHistory[sNumberStr] = { name: finalName, messages: [] };
    }
    chatHistory[sNumberStr].messages.push({ type: 'received', text: message });

    renderChatList();

    const chatApp = document.getElementById('app-chat');
    
    // Trạng thái 1: Đang trực tiếp mở khung chat với người này -> Hiện bong bóng chat
    if(chatApp && chatApp.classList.contains('active') && currentChatNumber === sNumberStr) {
        const body = document.getElementById('ph-chat-body');
        const div = document.createElement('div');
        div.className = `chat-row received`;
        div.innerHTML = `<div class="chat-bubble">${message}</div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    } 
    // Trạng thái 2: Đang ở màn hình khác (hoặc cất điện thoại) -> Hiện Popup rơi xuống
    else {
        showSMSNotify(finalName, message, sNumberStr);
    }
}

window.showSMSNotify = function(name, text, number) {
    const notify = document.getElementById('ph-sms-notify');
    if(!notify) return;

    document.getElementById('notify-name').innerText = name;
    document.getElementById('notify-text').innerText = text;

    // Gắn lệnh: Bấm vào thông báo thì mở hộp thoại chat luôn
    notify.onclick = function() {
        notify.classList.remove('show');
        window.showPhone(true); // Kéo đt lên
        openChat(name, number); // Nhảy vào chat
    };

    notify.classList.add('show');
    
    // Tự động thu lại sau 4 giây
    setTimeout(() => {
        notify.classList.remove('show');
    }, 4000);
}

// ==========================================
// CÁC POPUP CỦA TIN NHẮN
// ==========================================

// 1. Popup Soạn tin mới
window.openNewMsgModal = function() {
    const modal = document.getElementById('ph-new-msg-modal');
    if(modal) { document.getElementById('ph-new-msg-num').value = ""; modal.classList.add('active'); }
}

window.closeNewMsgModal = function() {
    const modal = document.getElementById('ph-new-msg-modal');
    if(modal) modal.classList.remove('active');
}

window.startNewChat = function() {
    const num = document.getElementById('ph-new-msg-num').value.trim();
    if(num.length < 3) return;
    window.closeNewMsgModal();
    let chatName = getNameFromContact(num, "Số lạ");
    window.openChat(chatName, num);
}

// 2. Popup Option (Khi bấm nút i trong Chat)
window.openChatOptions = function() {
    const modal = document.getElementById('ph-chat-opt-modal');
    document.getElementById('ph-opt-name').innerText = document.querySelector('#ph-chat-title .chat-name').innerText;
    document.getElementById('ph-opt-num').innerText = "SDT: " + currentChatNumber;
    if(modal) modal.classList.add('active');
}

window.closeChatOptions = function() {
    const modal = document.getElementById('ph-chat-opt-modal');
    if(modal) modal.classList.remove('active');
}
window.callFromChat = function() {
    window.closeChatOptions();
    window.callFromContact(currentChatNumber); 
}

// 4. Hàm vẽ bong bóng chat ra màn hình
window.appendMessage = function(type, text) {
    const body = document.getElementById('ph-chat-body');
    if(!body) return;

    const div = document.createElement('div');
    div.className = `chat-row ${type}`;
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
    
    body.appendChild(div);
    body.scrollTop = body.scrollHeight; // Tự cuộn xuống dưới cùng
}

// ==========================================
// HỆ THỐNG NGÂN HÀNG (SA-BANK)
// ==========================================

// Cập nhật số dư lên màn hình
window.updateBankBalance = function(balance) {
    const balEl = document.getElementById('ph-bank-balance');
    if(balEl) {
        // Hàm toLocaleString giúp hiển thị 1000000 thành 1,000,000 cực đẹp
        balEl.innerText = parseInt(balance).toLocaleString('en-US'); 
    }
}

// Bấm nút chuyển tiền
window.submitBankTransfer = function() {
    const targetStr = document.getElementById('ph-bank-target').value.trim();
    const amountStr = document.getElementById('ph-bank-amount').value.trim();
    let msg = document.getElementById('ph-bank-msg').value.trim();

    if(targetStr.length < 3) return;
    const amount = parseInt(amountStr);
    if(isNaN(amount) || amount <= 0 || amount > 1000000) return;
    
    if(msg.length === 0) msg = "Chuyen tien";

    const sendData = `${targetStr}|${amount}|${msg}`;
    
    // 🔥 DÙNG HÀM TỔNG TÀI
    window.sendToGame('client:phone_transfer_money', sendData);

    document.getElementById('ph-bank-target').value = "";
    document.getElementById('ph-bank-amount').value = "";
    document.getElementById('ph-bank-msg').value = "";
    window.goHome(); 
}

// Hàm thêm giao dịch mới (Server sẽ gọi hàm này)
window.addBankHistory = function(type, targetName, amount, msg) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Đẩy giao dịch lên đầu mảng
    bankHistory.unshift({ type, targetName, amount, msg, timeStr });
    window.renderBankHistory();
}

// Hàm vẽ danh sách ra màn hình
window.renderBankHistory = function() {
    const listEl = document.getElementById('ph-bank-hist-list');
    if(!listEl) return;
    listEl.innerHTML = "";
    
    if(bankHistory.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px; font-size: 14px;">Chưa có giao dịch nào</div>`;
        return;
    }
    
    bankHistory.forEach(item => {
        const isSent = item.type === 'sent';
        const sign = isSent ? '-' : '+';
        const iconClass = isSent ? 'sent' : 'recv';
        const icon = isSent ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>';
        
        listEl.innerHTML += `
            <div class="ph-hist-item">
                <div class="ph-hist-left">
                    <div class="ph-hist-icon ${iconClass}">${icon}</div>
                    <div class="ph-hist-info">
                        <div class="ph-hist-name">${item.targetName}</div>
                        <div class="ph-hist-msg">${item.timeStr} • ${item.msg}</div>
                    </div>
                </div>
                <div class="ph-hist-amount ${iconClass}">${sign}$${parseInt(item.amount).toLocaleString('en-US')}</div>
            </div>
        `;
    });
}

window.renderTactoFeed = function(postsJson) {
    try {
        tactoPosts = JSON.parse(postsJson);
    } catch(e) { console.log("Lỗi Parse Tacto:", e); return; }

    const feedEl = document.getElementById('ph-tacto-feed');
    if(!feedEl) return;
    feedEl.innerHTML = "";

    if(tactoPosts.length === 0) {
        feedEl.innerHTML = `<div style="text-align:center; color:#888; padding:30px; font-size: 14px;">Chưa có bài viết nào</div>`;
        return;
    }

    // Mảng màu Pastel rực rỡ cho Avatar
    const colors = ['#fbc2eb', '#a18cd1', '#ff9a9e', '#fecfef', '#84fab0', '#8fd3f4', '#ffb199', '#6441a5'];

    tactoPosts.forEach(post => {
        let imgHtml = "";
        // Nếu Server gửi link ảnh hợp lệ thì render thẻ img có kèm sự kiện Phóng to
        if(post.image && post.image.length > 5) {
            imgHtml = `<img src="${post.image}" class="tacto-image" onclick="viewImage('${post.image}')" onerror="this.style.display='none'" style="cursor:pointer;">`;
        }

        // Chọn màu Avatar dựa trên tên người đăng
        const bgColor = colors[post.author.length % colors.length];

        feedEl.innerHTML += `
            <div class="tacto-post">
                <div class="tacto-post-head">
                    <div class="tacto-avatar" style="background: ${bgColor}">${post.author.charAt(0)}</div>
                    <div>
                        <div class="tacto-author">${post.author}</div>
                        <div class="tacto-time">Vừa xong</div>
                    </div>
                </div>
                <div class="tacto-content">${post.content}</div>
                ${imgHtml}
                <div class="tacto-actions">
                    <div class="tacto-action-btn" onclick="likeTacto(${post.id})">
                        <i class="fa-regular fa-heart"></i> <span>${post.likes || 0}</span>
                    </div>
                    
                    <div class="tacto-action-btn" onclick="openComments(${post.id})">
                        <i class="fa-regular fa-comment"></i> <span>${post.comments || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

// Mở & Đóng Popup Đăng Bài
window.openNewPostModal = function() {
    const modal = document.getElementById('ph-tacto-post-modal');
    if(modal) {
        document.getElementById('ph-tacto-new-text').value = "";
        window.removeTactoImg(); // Xóa ảnh hiển thị cũ nếu có
        modal.classList.add('active');
    }
}
window.closeNewPostModal = function() {
    const modal = document.getElementById('ph-tacto-post-modal');
    if(modal) modal.classList.remove('active');
}

// Bấm Đăng Bài
window.submitTactoPost = function() {
    const text = document.getElementById('ph-tacto-new-text').value.trim();
    const imgUrl = selectedTactoImgUrl; 

    if(text.length < 1) return;

    // 🔥 DÙNG HÀM TỔNG TÀI
    window.sendToGame('client:phone_tacto_post', `${text}|${imgUrl}`);
    
    window.closeNewPostModal();
}

// 2. Mở trình duyệt lưới ảnh (Gallery Picker)
window.openGalleryPicker = function() {
    const picker = document.getElementById('ph-gallery-picker-modal');
    const gridEl = document.getElementById('ph-picker-grid');
    
    if(picker && gridEl) {
        gridEl.innerHTML = "";
        
        // Nếu bộ sưu tập trống
        if(myGallery.length === 0) {
            gridEl.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:#888; padding:30px 20px; font-size: 13px;">Bộ sưu tập trống.<br>Hãy dùng Camera chụp vài tấm nhé!</div>`;
        } else {
            // Đổ mảng ảnh của người chơi vào lưới
            [...myGallery].reverse().forEach(photoUrl => {
                if(photoUrl.length > 5) {
                    gridEl.innerHTML += `<div class="ph-gallery-item" style="background-image: url('${photoUrl}')" onclick="selectImgForTacto('${photoUrl}')"></div>`;
                }
            });
        }
        picker.classList.add('active');
    }
}
window.closeGalleryPicker = function() {
    const picker = document.getElementById('ph-gallery-picker-modal');
    if(picker) picker.classList.remove('active');
}

// 3. Khi người chơi click chọn 1 tấm ảnh trong lưới
window.selectImgForTacto = function(url) {
    selectedTactoImgUrl = url;
    
    // Hiện ảnh thumbnail nhỏ lên khung soạn thảo
    const previewDiv = document.getElementById('ph-tacto-img-preview');
    const previewImg = document.getElementById('ph-tacto-preview-src');
    if(previewDiv && previewImg) {
        previewImg.src = url;
        previewDiv.style.display = 'block';
    }
    window.closeGalleryPicker();
}

// 4. Bấm dấu X đỏ để hủy chọn ảnh
window.removeTactoImg = function() {
    selectedTactoImgUrl = "";
    const previewDiv = document.getElementById('ph-tacto-img-preview');
    if(previewDiv) previewDiv.style.display = 'none';
}

// Bấm Like
window.likeTacto = function(postId) {
    window.sendToGame('client:phone_tacto_like', postId);
}

// Tính năng Phóng to ảnh
window.viewImage = function(url) {
    const viewer = document.getElementById('ph-image-viewer');
    const img = document.getElementById('ph-viewer-img');
    if(viewer && img) { img.src = url; viewer.classList.add('active'); }
}
window.closeImageViewer = function() {
    const viewer = document.getElementById('ph-image-viewer');
    if(viewer) viewer.classList.remove('active');
}

// Tính năng Bình luận
let currentTactoPostId = -1;

window.openComments = function(postId) {
    currentTactoPostId = postId;
    const modal = document.getElementById('ph-tacto-cmt-modal');
    if(modal) {
        document.getElementById('tacto-cmt-list').innerHTML = "<div style='text-align:center; color:#888; margin-top:20px;'>Đang tải bình luận...</div>";
        modal.classList.add('active');
        
        // Gọi Server lấy list comment của bài này
        window.sendToGame('client:phone_get_comments', postId.toString());
    }
}

window.closeComments = function() {
    const modal = document.getElementById('ph-tacto-cmt-modal');
    if(modal) modal.classList.remove('active');
}

window.renderTactoComments = function(commentsJson) {
    const listEl = document.getElementById('tacto-cmt-list');
    if(!listEl) return;
    listEl.innerHTML = "";
    
    let comments = [];
    try { comments = JSON.parse(commentsJson); } catch(e) {}
    
    if(comments.length === 0) {
        listEl.innerHTML = "<div style='text-align:center; color:#888; margin-top:20px; font-size:13px;'>Chưa có bình luận nào. Hãy là người đầu tiên!</div>";
        return;
    }
    
    const colors = ['#fbc2eb', '#a18cd1', '#ff9a9e', '#fecfef', '#84fab0', '#8fd3f4', '#ffb199', '#6441a5'];
    
    comments.forEach(c => {
        const bgColor = colors[c.author.length % colors.length];
        listEl.innerHTML += `
            <div class="tacto-cmt-item">
                <div class="tacto-cmt-avatar" style="background: ${bgColor}">${c.author.charAt(0)}</div>
                <div class="tacto-cmt-box">
                    <div class="tacto-cmt-author">${c.author}</div>
                    <div class="tacto-cmt-text">${c.content}</div>
                </div>
            </div>
        `;
    });
    // Cuộn xuống cuối
    setTimeout(() => { listEl.scrollTop = listEl.scrollHeight; }, 50);
}

window.submitComment = function() {
    const input = document.getElementById('tacto-cmt-input');
    const text = input.value.trim();
    if(text.length < 1 || currentTactoPostId === -1) return;
    
    // 🔥 DÙNG HÀM TỔNG TÀI
    window.sendToGame('client:phone_tacto_comment', `${currentTactoPostId}|${text}`);
    input.value = "";
}

// ==========================================
// HỆ THỐNG MÁY ẢNH (CAMERA MODE)
// ==========================================

// Bật Camera
window.openCameraMode = function() {
    const wrapper = document.getElementById('phone-wrapper');
    if(wrapper) {
        // Thêm class biến điện thoại thành Toàn màn hình
        wrapper.classList.add('fullscreen-camera');
        window.openApp('camera');
        
        // Gửi thông báo nhỏ cho người chơi biết cách chụp
        console.log("Đã bật Camera. Hãy bấm nút chụp hoặc F8.");
    }
}

// Tắt Camera
window.closeCameraMode = function() {
    const wrapper = document.getElementById('phone-wrapper');
    if(wrapper) {
        // Gỡ class Toàn màn hình ra
        wrapper.classList.remove('fullscreen-camera');
        window.goHome(); // Trở về màn hình chính
    }
}

// Bấm nút Chụp ảnh
window.takePhoto = function() {
    // 1. Chớp Flash trắng màn hình
    const flash = document.getElementById('cam-flash');
    if(flash) {
        flash.classList.remove('flashing');
        void flash.offsetWidth; // Mẹo nhỏ để reset animation
        flash.classList.add('flashing');
    }

    // 2. Phát âm thanh "Tách" (Chạy audio base64 thẳng trên web cực mượt)
    // Đây là đoạn mã âm thanh Shutter gốc của iOS
    const shutterSound = new Audio("https://actions.google.com/sounds/v1/doors/wood_door_open_close.ogg"); 
    // Ghi chú: Mình để link audio tạm, bạn có thể tải file tiếng máy ảnh .mp3 bỏ vào thư mục web rồi trỏ link tới nhé! VD: new Audio("sounds/camera.mp3")
    shutterSound.volume = 0.8;
    shutterSound.play().catch(e => {});

    // 3. (Tùy chọn) Gửi lệnh Pawn để Pawn tự ép phím F8 hoặc báo text cho người chơi
    window.sendToGame('client:phone_take_photo'); 
}

// Bấm nút Chụp ảnh
window.takePhoto = function() {
    // 1. Chớp Flash trắng màn hình
    const flash = document.getElementById('cam-flash');
    if(flash) {
        flash.classList.remove('flashing');
        void flash.offsetWidth; // Mẹo nhỏ để reset animation
        flash.classList.add('flashing');
    }

    // 2. Phát âm thanh "Tách"
    const shutterSound = new Audio("https://actions.google.com/sounds/v1/doors/wood_door_open_close.ogg"); 
    shutterSound.volume = 0.8;
    shutterSound.play().catch(e => {});

    // 3. Gửi lệnh Pawn hoặc in Log trên Web
    window.sendToGame('client:phone_take_photo'); 
}

window.renderGallery = function(photosJson) {
    try {
        myGallery = JSON.parse(photosJson);
    } catch(e) { return; }

    const gridEl = document.getElementById('ph-gallery-grid');
    if(!gridEl) return;
    gridEl.innerHTML = "";

    if(myGallery.length === 0) {
        gridEl.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:#888; padding:50px 20px; font-size: 14px;">Chưa có bức ảnh nào.<br>Bấm dấu + để thêm ảnh mới.</div>`;
        return;
    }

    [...myGallery].reverse().forEach(photoUrl => {
        if(photoUrl.length > 5) {
            // ĐÃ THÊM: oncontextmenu="openGalleryContextMenu(...)" để bắt sự kiện chuột phải
            gridEl.innerHTML += `<div class="ph-gallery-item" style="background-image: url('${photoUrl}')" onclick="viewImage('${photoUrl}')" oncontextmenu="openGalleryContextMenu(event, '${photoUrl}')"></div>`;
        }
    });
}

// Bắt sự kiện Click Chuột Phải
window.openGalleryContextMenu = function(e, url) {
    e.preventDefault(); // Ngăn cái menu chuột phải mặc định xấu xí của Chrome hiện lên
    contextPhotoUrl = url;
    
    const menu = document.getElementById('ph-context-menu');
    if(menu) {
        // Lấy tọa độ con chuột để đặt vị trí Menu
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.add('active');
    }
}

// Bấm chữ Xóa trong Menu
window.confirmDeleteFromMenu = function() {
    // Ngăn chặn sự kiện click nhầm lan ra ngoài
    if(window.event) window.event.stopPropagation(); 
    
    // Chỉ ẩn giao diện menu, KHÔNG XÓA biến link ảnh
    const menu = document.getElementById('ph-context-menu');
    if(menu) menu.classList.remove('active');
    
    // Mở Popup Xác nhận
    if(!contextPhotoUrl) return;
    const modal = document.getElementById('ph-confirm-delete-modal');
    if(modal) modal.classList.add('active');
}

// 2. Nút Hủy bỏ
window.closeConfirmDeleteModal = function() {
    const modal = document.getElementById('ph-confirm-delete-modal');
    if(modal) modal.classList.remove('active');
    contextPhotoUrl = ""; // Bấm hủy xóa thì mới làm rỗng trí nhớ
}

// 3. Nút Xóa ảnh (Chạy lệnh CEF)
window.executeDeletePhoto = function() {
    if(!contextPhotoUrl) return;
    
    // 🔥 DÙNG HÀM TỔNG TÀI
    window.sendToGame('client:phone_delete_photo', contextPhotoUrl);
    
    window.closeConfirmDeleteModal(); 
}

// Hàm Ẩn Menu (Khi không muốn xóa nữa)
window.hideContextMenu = function() {
    const menu = document.getElementById('ph-context-menu');
    if(menu) menu.classList.remove('active');
}

// Lắng nghe sự kiện: Nếu click chuột trái ra chỗ khác thì tự động ẩn Menu
document.addEventListener('click', function(e) {
    const menu = document.getElementById('ph-context-menu');
    if(menu && menu.classList.contains('active')) {
        window.hideContextMenu();
        contextPhotoUrl = ""; // Click ra chỗ khác (hủy) thì mới làm rỗng biến
    }
});

window.openAddPhotoModal = function() {
    const modal = document.getElementById('ph-add-photo-modal');
    if(modal) {
        document.getElementById('ph-new-photo-url').value = "";
        modal.classList.add('active');
    }
}

window.closeAddPhotoModal = function() {
    const modal = document.getElementById('ph-add-photo-modal');
    if(modal) modal.classList.remove('active');
}

window.submitNewPhoto = function() {
    const url = document.getElementById('ph-new-photo-url').value.trim();
    if(url.length < 5) return;

    window.sendToGame('client:phone_save_photo', url);
    window.closeAddPhotoModal();
}

// Hàm giao tiếp với ImgBB API (Hỗ trợ cả File máy tính lẫn Link URL)
window.uploadToImgBB = async function(imageInput) {
    const apiKey = 'a39a5aff845dc02f2387ed3825cde770'; // API Key của bạn
    const formData = new FormData();
    
    // ImgBB chấp nhận biến 'image' là File tải lên HOẶC là 1 chuỗi URL
    formData.append('image', imageInput);
    formData.append('key', apiKey);

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if(result.success) {
            return result.data.url; // Trả về link i.ibb.co vĩnh viễn
        } else {
            console.log("Lỗi ImgBB API:", result);
            return null;
        }
    } catch(e) {
        console.log("Lỗi mạng khi tải ảnh:", e);
        return null;
    }
}

// Xử lý khi người chơi bấm nút "Lưu ảnh"
window.submitNewPhoto = async function() {
    const fileInput = document.getElementById('ph-new-photo-file');
    const urlInput = document.getElementById('ph-new-photo-url');
    const statusText = document.getElementById('ph-upload-status');
    
    let imageToProcess = null;

    // Ưu tiên 1: Lấy File từ máy tính
    if(fileInput.files.length > 0) {
        imageToProcess = fileInput.files[0];
    } 
    // Ưu tiên 2: Lấy Link URL do người chơi dán vào
    else if(urlInput.value.trim().length > 5) {
        imageToProcess = urlInput.value.trim();
    } 
    // Không nhập gì cả thì dừng
    else {
        return; 
    }

    // Hiện thông báo đang xử lý
    statusText.style.display = 'block';
    statusText.style.color = '#007aff';
    statusText.innerText = 'Đang tải và lưu trữ ảnh vĩnh viễn... Vui lòng chờ!';

    // Quăng File hoặc Link qua cho ImgBB xử lý
    const finalUrl = await window.uploadToImgBB(imageToProcess);

    // Nếu tải thất bại
    if(!finalUrl) {
        statusText.innerText = 'Tải ảnh thất bại! Vui lòng kiểm tra lại ảnh hoặc link.';
        statusText.style.color = '#ff3b30';
        return; 
    }

    // Tải thành công thì ẩn thông báo
    statusText.style.display = 'none';

    window.sendToGame('client:phone_save_photo', finalUrl);
    
    // Đóng Popup và dọn dẹp Form
    window.closeAddPhotoModal();
    fileInput.value = "";
    urlInput.value = "";
}

// Gọi thẳng (không cần nhập lý do)
window.submitDirectService = function(type) {
    window.sendToGame('client:phone_service', `${type}|`);
    window.goHome(); // Gọi xong văng ra Home cho ngầu
}

// Mở bảng nhập lý do (Cảnh sát/Bác sĩ)
window.openServiceInput = function(type, title, placeholder) {
    currentServiceType = type;
    const modal = document.getElementById('ph-service-modal');
    if(modal) {
        document.getElementById('ph-service-title').innerText = title;
        document.getElementById('ph-service-reason').placeholder = placeholder;
        document.getElementById('ph-service-reason').value = ""; // Xóa text cũ
        modal.classList.add('active');
    }
}

// Tắt bảng
window.closeServiceModal = function() {
    const modal = document.getElementById('ph-service-modal');
    if(modal) modal.classList.remove('active');
    currentServiceType = "";
}

// Gửi lý do lên Server
window.submitServiceRequest = function() {
    const reason = document.getElementById('ph-service-reason').value.trim();
    if(reason.length < 2) return; // Phải nhập ít nhất 2 ký tự
    
    window.sendToGame('client:phone_service', `${currentServiceType}|${reason}`);
    
    window.closeServiceModal();
    window.goHome();
}

// Gửi tín hiệu gọi chức năng Server (SA ADS, Việc Làm...)
window.triggerServerApp = function(appCode) {
    window.sendToGame('client:phone_trigger_app', appCode);
    
    // Đóng điện thoại xuống để người chơi tương tác với Dialog của Server
    window.showPhone(false); 
}

// Hàm lưu dữ liệu ngầm khi Server gửi tới
window.renderMarket = function(jsonStr) {
    try { 
        globalMarketData = JSON.parse(jsonStr); 
    } catch(e) { 
        console.log("Lỗi Parse Market:", e); 
    }
}

window.openMarketCategory = function(type) {
    if(!globalMarketData) {
        console.log("Dữ liệu đang tải...");
        return; 
    }

    const detailView = document.getElementById('mkt-detail-view');
    const titleEl = document.getElementById('mkt-detail-title');
    const contentEl = document.getElementById('mkt-detail-content');
    
    let html = "";

    if(type === 'jobs') {
        titleEl.innerText = "Việc làm";
        html += `<div class="mkt-list-box">`;
        if(globalMarketData.jobs.length === 0) html += `<div style="padding:20px;text-align:center;color:#888;font-size:13px;">Chưa có dữ liệu</div>`;
        
        globalMarketData.jobs.forEach(j => {
            let cashClass = j.cash > 0 ? "text-up" : (j.cash < 0 ? "text-down" : "text-neu");
            let xpClass   = j.xp   > 0 ? "text-up" : (j.xp   < 0 ? "text-down" : "text-neu");
            let cashSign  = j.cash > 0 ? "+" : "";
            let xpSign    = j.xp   > 0 ? "+" : "";
            html += `
                <div class="mkt-list-item">
                    <div class="mkt-list-name"><i class="fa-solid fa-user-tie"></i> ${j.name}</div>
                    <div class="mkt-list-stats">
                        <div class="mkt-stat-row ${cashClass}"><i class="fa-solid fa-sack-dollar"></i> ${cashSign}${j.cash}%</div>
                        <div class="mkt-stat-row ${xpClass}" style="margin-top:4px;"><i class="fa-solid fa-star"></i> ${xpSign}${j.xp}%</div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    else if(type === 'wholesale') {
        titleEl.innerText = "Chợ đầu mối";
        html += `<div class="mkt-list-box">`;
        globalMarketData.wholesale.forEach(w => {
            let wDiff  = w.new - w.old;
            let wClass = wDiff > 0 ? "text-up" : (wDiff < 0 ? "text-down" : "text-neu");
            let wSign  = wDiff > 0 ? "+" : "";
            html += `
                <div class="mkt-list-item">
                    <div class="mkt-list-name"><i class="fa-solid fa-box"></i> ${w.name}</div>
                    <div class="mkt-list-stats">
                        <div class="mkt-stat-row" style="color:#000;">$${w.new.toLocaleString('en-US')}</div>
                        <div class="mkt-stat-sub ${wClass}">${wSign}${wDiff.toLocaleString('en-US')} (Cũ: $${w.old})</div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    else if(type === 'gas') {
        titleEl.innerText = "Giá xăng";
        let gasDiff  = globalMarketData.gas.new - globalMarketData.gas.old;
        let gasClass = gasDiff > 0 ? "text-up" : (gasDiff < 0 ? "text-down" : "text-neu");
        let gasSign  = gasDiff > 0 ? "+" : "";
        let gasIcon  = gasDiff > 0 ? "fa-arrow-trend-up" : (gasDiff < 0 ? "fa-arrow-trend-down" : "fa-minus");
        html = `
            <div class="mkt-single-card">
                <i class="fa-solid fa-gas-pump mkt-single-icon" style="color: #ff9500;"></i>
                <div style="font-size: 14px; color:#888; font-weight: 600; margin-bottom: 5px;">MỨC GIÁ HIỆN TẠI</div>
                <div class="mkt-single-price">$${globalMarketData.gas.new.toLocaleString('en-US')} / Lít</div>
                <div class="mkt-stat-row ${gasClass}" style="justify-content:center; font-size:15px; margin-top:10px;">
                    <i class="fa-solid ${gasIcon}"></i> ${gasSign}${Math.abs(gasDiff)} so với trước
                </div>
            </div>
        `;
    }
    else if(type === 'diamond') {
        titleEl.innerText = "Kim Cương";
        html = `
            <div class="mkt-single-card">
                <i class="fa-regular fa-gem mkt-single-icon" style="color: #bf5af2;"></i>
                <div style="font-size: 14px; color:#888; font-weight: 600; margin-bottom: 5px;">TỶ GIÁ GIAO DỊCH NGÂN HÀNG</div>
                <div class="mkt-single-price">$${globalMarketData.diamond.toLocaleString('en-US')}</div>
                <div class="mkt-stat-row text-neu" style="justify-content:center; font-size:14px; margin-top:10px;">
                    Giá quy đổi 1 Kim Cương
                </div>
            </div>
        `;
    }
    else if(type === 'fish') {
        titleEl.innerText = "Giá cá hôm nay";
        html += `<div class="mkt-list-box">`;
        if(!globalMarketData.fish || globalMarketData.fish.length === 0) {
            html += `<div style="padding:20px;text-align:center;color:#888;font-size:13px;">Chưa có dữ liệu</div>`;
        } else {
            globalMarketData.fish.forEach(f => {
                let fDiff  = f.new - f.old;
                let fClass = fDiff > 0 ? "text-up" : (fDiff < 0 ? "text-down" : "text-neu");
                let fSign  = fDiff > 0 ? "+" : "";
                let fIcon  = fDiff > 0 ? "fa-arrow-trend-up" : (fDiff < 0 ? "fa-arrow-trend-down" : "fa-minus");
                html += `
                    <div class="mkt-list-item">
                        <div class="mkt-list-name" style="display:flex;align-items:center;gap:8px;">
                            <img src="images/fishing/${f.img}.png" 
                                onerror="this.src='images/fish/116.png'"
                                style="width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
                            ${f.name}
                        </div>
                        <div class="mkt-list-stats">
                            <div class="mkt-stat-row" style="color:#000;">$${f.new.toLocaleString('en-US')} / con</div>
                            <div class="mkt-stat-sub ${fClass}">
                                <i class="fa-solid ${fIcon}"></i> ${fSign}${Math.abs(fDiff).toLocaleString('en-US')} (Cũ: $${f.old.toLocaleString('en-US')})
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        html += `</div>`;
    }

    contentEl.innerHTML = html;
    detailView.classList.add('active');
}

// Bấm nút "Trở lại"
window.closeMarketCategory = function() {
    document.getElementById('mkt-detail-view').classList.remove('active');
}

// ==========================================
// 6. GIAO TIẾP SERVER & MOBILE (HÀM TỔNG TÀI)
// ==========================================

// HÀM TỔNG TÀI: Tự động phân luồng PC hay Mobile
window.sendToGame = function(eventName, data = "") {
    if (typeof cef !== 'undefined' && cef.emit) {
        cef.emit(eventName, String(data)); // Chạy trên PC
    } else if (window.AndroidHUD && window.AndroidHUD.sendPhoneEvent) {
        window.AndroidHUD.sendPhoneEvent(eventName, String(data)); // Chạy trên Mobile
    } else {
        console.log("[TEST WEB] Gửi lệnh:", eventName, "| Data:", data); // Test trên Chrome
    }
}

// Nhận dữ liệu từ Mobile
window.onJavaPhoneEvent = function(eventName, ...args) {
    switch(eventName) {
        case "phone:show": window.showPhone(args[0], args[1]); break;
        case "phone:incoming_call": window.showIncomingCall(args[0], args[1]); break;
        case "phone:call_started": window.startCallTimer(); break;
        case "phone:call_ended": window.endCallUI(); break;
        case "phone:outgoing_call": window.showOutgoingCall(args[0], args[1]); break;
        case "phone:load_contacts": window.loadContacts(args[0]); break;
        case "phone:receive_sms": window.receiveSMS(args[0], args[1], args[2]); break;
        case "phone:update_bank": window.updateBankBalance(args[0]); break;
        case "phone:add_bank_history": window.addBankHistory(args[0], args[1], args[2], args[3]); break;
        case "phone:load_tacto": window.renderTactoFeed(args[0]); break;
        case "phone:load_comments": window.renderTactoComments(args[0]); break;
        case "phone:load_gallery": window.renderGallery(args[0]); break;
        case "phone:load_market": window.renderMarket(args[0]); break;
    }
}