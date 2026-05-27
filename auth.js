let getSkin = -1;

// --- HÀM BỔ TRỢ: GỬI DỮ LIỆU LÊN PAWN SERVER ---
function sendToPawn(eventName, data = "") {
    if (typeof Cef !== 'undefined' && typeof Cef.sendEvent === 'function') {
        Cef.sendEvent(eventName, String(data));
    } else {
        console.log(`[DEBUG WEB] Gửi Event: ${eventName} | Data: ${data}`);
    }
}

// --- ĐIỀU KHIỂN GIAO DIỆN HỒI ĐÁP ---
let showReg = () => {
    resetError();
    document.getElementById('login').style.display = 'none';
    document.getElementById('register').style.display = 'block';
    document.getElementById('cc-selector').style.display = 'none';
    document.getElementById('cc-selector-fem').style.display = 'none';
}

let showLogin = () => {
    resetError();
    document.getElementById('login').style.display = 'block';
    document.getElementById('register').style.display = 'none';
    document.getElementById('cc-selector').style.display = 'none';
    document.getElementById('cc-selector-fem').style.display = 'none';
}

let resetWindow = () => {
    document.getElementById('login').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    document.getElementById('cc-selector').style.display = 'none';
    document.getElementById('cc-selector-fem').style.display = 'none';
    document.getElementById('windowr').style.display = 'none';
    document.getElementById('radios').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    if(document.getElementsByClassName('form')[0]) {
        document.getElementsByClassName('form')[0].style.display = 'none';
    }
}

// --- CÁC HÀM ĐƯỢC GỌI TỪ PAWN XUỐNG (CALLBACKS) ---

// 1. Nhận trạng thái tài khoản (Đã ĐK hay Chưa)
window.onPlayerStatus = function(response) {
    if(parseInt(response) === 1) showLogin();
    else showReg();
}

// 2. Nhận tên hiển thị từ server gắn vào Form
window.onPlayerName = function(response) {
    document.getElementById('reg-login').placeholder = response;
    document.getElementById('reg-login').value = response;
    document.getElementById('reg-login').readOnly = true;

    document.getElementById('log-login').placeholder = response;
    document.getElementById('log-login').value = response;
    document.getElementById('log-login').readOnly = true;
}

// 3. Nhận thông báo lỗi từ Pawn hiển thị ra UI
window.onErrorMessage = function(response) {
    showError(response);
}

// 4. Nhận thông báo chấp nhận đăng nhập thành công
window.onLoginAccept = function(response) {
    if(parseInt(response) === 1) {
        resetWindow();
        if (typeof Cef !== 'undefined' && typeof Cef.set_focus === 'function') {
            Cef.set_focus(false);
        }
        document.getElementById('bodyd').style.backgroundColor = '#000';
        document.getElementById('bodyd').style.transition = '0.5s';
        setTimeout(screenDimming, 4000);
    }
}

// 5. Nhận thông báo xử lý kết thúc toàn bộ Form đăng nhập/đăng ký
window.onLoginSuccess = function(response) {
    if (parseInt(response) === 1) {
        if (typeof Cef !== 'undefined') {
            if(typeof Cef.set_focus === 'function') Cef.set_focus(false);
            if(typeof Cef.hide === 'function') Cef.hide(true);
        }
        sendToPawn('pwd:exit_forms');
    } else {
        if (typeof Cef !== 'undefined') {
            if(typeof Cef.hide === 'function') Cef.hide(true);
            if(typeof Cef.set_focus === 'function') Cef.set_focus(false);
        }
        resetWindow();
    }
}

// --- XỬ LÝ SỰ KIỆN TỪ PHÍA NGƯỜI DÙNG BẤM NÚT ---

function loginAttempt(){
    const login = document.getElementById('log-login').value || document.getElementById('log-login').placeholder;
    const password = document.getElementById('log-password').value;
    resetError();

    if(!password || password.length < 6){
        return showError('Введите Пароль');
    }

    let attemp = login + ',' + password;
    sendToPawn('pwd:try', attemp);
}

function registerAttempt(){
    const login = document.getElementById('reg-login').value || document.getElementById('reg-login').placeholder;
    const mail = document.getElementById('reg-mail').value;
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    const gender_female = document.getElementById('female');
    const gender_male = document.getElementById('male');

    resetError();

    let reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if(!mail || mail.length < 3 || reg.test(mail) == false){
        return showError('Введите корректный email');
    }
    let pass_r = /^[A-Za-z0-9]{6,18}$/;
    if(pass_r.test(password) == false)
        return showError('Пароль может из состоять из латинских букв и цифр (Содержать от 6 до 18 символов)')

    if(password != passwordConfirm){
        return showError('Пароли не совпадают');
    }

    if(gender_male.checked == false && gender_female.checked == false)
        return showError('Выбери пол персонажа');

    if(getSkin == -1)
        return showError('Выбери скин персонажа');

    const skin = [6, 22, 48, 56, 69, 41];
    const gender = gender_male.checked == false ? 1 : 2;
    
    let attemp = login + ',' + password + ',' + mail + ',' + gender  + ',' + skin[getSkin-1];
    sendToPawn('pwd:reg', attemp);
    
    resetWindow();
    document.getElementById('bodyd').style.backgroundColor = '#000';
    document.getElementById('bodyd').style.transition = '0.5s';
    setTimeout(screenDimming, 4000);
}

function onExitClick(event) {
    sendToPawn('pwd:exit_forms');
}

// --- CÁC HÀM TIỆN ÍCH KHÁC ---
function screenDimming() {
    document.getElementById('bodyd').style.backgroundColor = '';
    document.getElementById('bodyd').style.transition = '2s';
}

function showError(message){
    const errorBlock = document.getElementById('error');
    if(errorBlock) { errorBlock.innerText = message; errorBlock.style.display = 'block'; }

    const errorBlock2 = document.getElementById('error_reg');
    if(errorBlock2) { errorBlock2.innerText = message; errorBlock2.style.display = 'block'; }
}

function resetError(){
    const errorBlock = document.getElementById('error');
    if(errorBlock) { errorBlock.innerText = ''; errorBlock.style.display = 'none'; }

    const errorBlock2 = document.getElementById('error_reg');
    if(errorBlock2) { errorBlock2.innerText = ''; errorBlock2.style.display = 'none'; }
}

function clickgender(res) {
    if(res == 1) {
        document.querySelector('#cc-selector-fem').style.display = 'none';
        document.querySelector('#cc-selector').style.display = 'block';
    } else {
        document.querySelector('#cc-selector-fem').style.display = 'block';
        document.querySelector('#cc-selector').style.display = 'none';
    }
}

function isCheckedSkinGender(res) {
   getSkin = res;
}

// ==========================================================
// ĐĂNG KÝ CALLBACK LẮNG NGHE SỰ KIỆN TỪ GAME GỬI XUỐNG CHUẨN API
// ==========================================================
document.addEventListener("DOMContentLoaded", function() {
    function initLoginCefCallbacks() {
        Cef.registerEventCallback("login:player_status", "onPlayerStatus");
        Cef.registerEventCallback("login:name", "onPlayerName");
        Cef.registerEventCallback("error:msg", "onErrorMessage");
        Cef.registerEventCallback("login:accept", "onLoginAccept");
        Cef.registerEventCallback("pwd:login_succes", "onLoginSuccess");

        // Gửi lệnh check data khởi đầu ngay sau khi đăng ký xong callback
        sendToPawn("login:player_status");
        sendToPawn("login:name");
    }

    if (typeof Cef !== 'undefined') {
        initLoginCefCallbacks();
    } else {
        document.addEventListener("OnCefInit", function() {
            initLoginCefCallbacks();
        });
    }
});
