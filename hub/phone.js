/* ==========================================================
   SMARTPHONE SYSTEM - SA-RP MOBILE CEF (FULL FIXED)
   ========================================================== */

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
    } else {
        phWrapper.classList.remove('active');
        isPhoneOpen = false;
        
        // Gọi lệnh về Pawn để tắt chuột & giải phóng bàn phím di chuyển
        window.sendToGame('client:phone_close');
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
        
        if(appName === 'contacts') {
            window.sendToGame('client:phone_get_contacts');
        }
        else if(appName === 'bank') {
            if(bankLoading) return; // chặn spam
            bankLoading = true;
            setTimeout(() => bankLoading = false, 3000); // reset sau 3s
            window.sendToGame('client:phone_get_bank');
        }
        else if(appName === 'tacto') {
            window.sendToGame('client:phone_get_tacto');
        }
        else if(appName === 'gallery') {
            window.sendToGame('client:phone_get_gallery');
        }
        else if(appName === 'market') {
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
        window.sendToGame('client:phone_call_number', currentInput);
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

    window.sendToGame('client:phone_answer');

    const phWrapper = document.getElementById('phone-wrapper');
    if(phWrapper && phWrapper.classList.contains('peeking')) {
        phWrapper.classList.remove('peeking');
        window.showPhone(true);
    }
};

window.declineCall = function() {
    window.sendToGame('client:phone_hangup');
    window.endCallUI();
};

// ==========================================
// 4. DANH BẠ (CONTACTS)
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
        c.name.toLowerCase().includes(keyword) || c.number.toString().includes(keyword)
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

window.openAddContactModal = function(prefillNumber = "") {
    const modal = document.getElementById('ph-add-contact-modal');
    const nameInput = document.getElementById('ph-new-name');
    const numberInput = document.getElementById('ph-new-number');
    if(modal) {
        nameInput.value = ""; 
        numberInput.value = prefillNumber; 
        modal.classList.add('active');
    }
}
window.closeAddContactModal = function() {
    const modal = document.getElementById('ph-add-contact-modal');
    if(modal) modal.classList.remove('active');
}
window.submitNewContact = function() {
    const name = document.getElementById('ph-new-name').value.trim();
    const numberStr = document.getElementById('ph-new-number').value.trim();
    if(name.length < 1 || name.length > 31 || numberStr.length < 3) return;
    
    window.sendToGame('client:phone_save_contact', name + "|" + parseInt(numberStr, 10));
    window.closeAddContactModal();
}
window.addContactFromDialer = function() {
    if(currentInput.length > 0) window.openAddContactModal(currentInput);
}
window.addNewContact = function() { window.openAddContactModal(); }

// ==========================================
// 5. TIN NHẮN (SMS)
// ==========================================
function getNameFromContact(number, defaultName = "Số lạ") {
    const found = phoneContacts.find(c => c.number.toString() === number.toString());
    return found ? found.name : defaultName;
}

window.renderChatList = function() {
    const listEl = document.getElementById('ph-msg-list');
    if(!listEl) return;
    listEl.innerHTML = "";

    const chats = Object.entries(chatHistory);
    if(chats.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px; font-size: 14px;">Chưa có tin nhắn nào</div>`;
        return;
    }

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

window.openChat = function(name, number) {
    currentChatNumber = number.toString();
    let finalName = getNameFromContact(currentChatNumber, name);

    if(!chatHistory[currentChatNumber]) chatHistory[currentChatNumber] = { name: finalName, messages: [] };

    const titleEl = document.querySelector('#ph-chat-title .chat-name');
    if(titleEl) titleEl.innerText = finalName;

    window.openApp('chat');

    const body = document.getElementById('ph-chat-body');
    body.innerHTML = "";
    chatHistory[currentChatNumber].messages.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-row ${m.type}`;
        div.innerHTML = `<div class="chat-bubble">${m.text}</div>`;
        body.appendChild(div);
    });
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
    renderChatList(); 
}

window.handleChatEnter = function(e) { if(e.key === 'Enter') window.sendChatMessage(); }

window.sendChatMessage = function() {
    const inputEl = document.getElementById('ph-chat-input');
    const msg = inputEl.value.trim();

    if(msg.length > 0) {
        if(!chatHistory[currentChatNumber]) chatHistory[currentChatNumber] = { name: getNameFromContact(currentChatNumber, "Số lạ"), messages: [] };
        chatHistory[currentChatNumber].messages.push({ type: 'sent', text: msg });

        const body = document.getElementById('ph-chat-body');
        const div = document.createElement('div');
        div.className = `chat-row sent`;
        div.innerHTML = `<div class="chat-bubble">${msg}</div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        inputEl.value = "";

        window.sendToGame('client:phone_send_sms', currentChatNumber + "|" + msg);
        renderChatList();
    }
}

window.receiveSMS = function(senderName, senderNumber, message) {
    let finalName = getNameFromContact(senderNumber, senderName);
    let sNumberStr = senderNumber.toString();

    if(!chatHistory[sNumberStr]) chatHistory[sNumberStr] = { name: finalName, messages: [] };
    chatHistory[sNumberStr].messages.push({ type: 'received', text: message });

    renderChatList();
    const chatApp = document.getElementById('app-chat');
    
    if(chatApp && chatApp.classList.contains('active') && currentChatNumber === sNumberStr) {
        const body = document.getElementById('ph-chat-body');
        const div = document.createElement('div');
        div.className = `chat-row received`;
        div.innerHTML = `<div class="chat-bubble">${message}</div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    } else {
        showSMSNotify(finalName, message, sNumberStr);
    }
}

window.showSMSNotify = function(name, text, number) {
    const notify = document.getElementById('ph-sms-notify');
    if(!notify) return;
    document.getElementById('notify-name').innerText = name;
    document.getElementById('notify-text').innerText = text;
    notify.onclick = function() {
        notify.classList.remove('show');
        window.showPhone(true); 
        openChat(name, number); 
    };
    notify.classList.add('show');
    setTimeout(() => { notify.classList.remove('show'); }, 4000);
}

// ==========================================
// 6. HỆ THỐNG GIAO TIẾP VÀ ĐĂNG KÝ SỰ KIỆN CEF CHUẨN (FIXED)
// ==========================================

// HÀM GỬI LÊN SERVER PAWN
window.sendToGame = function(eventName, data = "") {
    if (typeof Cef !== 'undefined' && typeof Cef.sendEvent === 'function') {
        Cef.sendEvent(eventName, String(data));
    } else {
        console.log("[TEST WEB] Gửi lệnh CEF:", eventName, "| Data:", data); 
    }
}

// Hàm hỗ trợ Parse dữ liệu an toàn tránh crash
function parseEventData(eventData) {
    try { 
        return JSON.parse(eventData); 
    } catch(e) { 
        return [eventData]; 
    }
}

// Đăng ký toàn bộ callback hứng sự kiện từ Game gửi xuống Web
function InitCefCallbacks() {
    if (typeof Cef === 'undefined') return;

    Cef.registerEventCallback("phone_show", "cb_phone_show");
    window.cb_phone_show = function(eventData) {
        const args = parseEventData(eventData);
        window.showPhone(args[0], args[1]);
    };

    Cef.registerEventCallback("phone_incoming_call", "cb_phone_incoming_call");
    window.cb_phone_incoming_call = function(eventData) {
        const args = parseEventData(eventData);
        window.showIncomingCall(args[0], args[1]);
    };

    Cef.registerEventCallback("phone_call_started", "cb_phone_call_started");
    window.cb_phone_call_started = function() {
        window.startCallTimer();
    };

    Cef.registerEventCallback("phone_call_ended", "cb_phone_call_ended");
    window.cb_phone_call_ended = function() {
        window.endCallUI();
    };

    Cef.registerEventCallback("phone_outgoing_call", "cb_phone_outgoing_call");
    window.cb_phone_outgoing_call = function(eventData) {
        const args = parseEventData(eventData);
        window.showOutgoingCall(args[0], args[1]);
    };

    Cef.registerEventCallback("phone_load_contacts", "cb_phone_load_contacts");
    window.cb_phone_load_contacts = function(eventData) {
        const args = parseEventData(eventData);
        window.loadContacts(args[0]);
    };

    Cef.registerEventCallback("phone_receive_sms", "cb_phone_receive_sms");
    window.cb_phone_receive_sms = function(eventData) {
        const args = parseEventData(eventData);
        window.receiveSMS(args[0], args[1], args[2]);
    };

    Cef.registerEventCallback("phone_update_bank", "cb_phone_update_bank");
    window.cb_phone_update_bank = function(eventData) {
        const args = parseEventData(eventData);
        if (typeof window.updateBankBalance === 'function') {
            window.updateBankBalance(args[0]);
        }
    };
}

// [FIX QUAN TRỌNG] Đợi toàn bộ HTML nạp xong hoàn toàn mới tiến hành đăng ký lắng nghe sự kiện
document.addEventListener("DOMContentLoaded", function() {
    if (typeof Cef !== 'undefined') {
        InitCefCallbacks();
    } else {
        // Dự phòng trường hợp thư viện CEF trên Mobile khởi tạo trễ hơn trang web
        document.addEventListener("OnCefInit", function() {
            InitCefCallbacks();
        });
    }
});
