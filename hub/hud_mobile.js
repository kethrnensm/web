try {
    let isHudVisible = true;

    // =========================================================
    // HELPER FUNCTIONS
    // =========================================================

    function setHexFill(id, value) {
        const el = document.getElementById(id);
        if (el) {
            let val = Math.max(0, Math.min(100, parseFloat(value) || 0));
            el.style.height = val + "%";
        }
    }

    function updateText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = (text !== undefined && text !== null) ? text : "";
    }

    function formatMoney(amount) {
        return (amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // =========================================================
    // MAG BAR: khởi tạo 10 pip một lần duy nhất
    // =========================================================
    const magBar = document.getElementById('mag-bar');
    if (magBar && magBar.children.length === 0) {
        for (let i = 0; i < 10; i++) {
            let pip = document.createElement('div');
            pip.className = 'mag-pip';
            magBar.appendChild(pip);
        }
    }

    function updateMagBar(clip, maxClip) {
        if (maxClip <= 0) maxClip = 1;
        let percent = Math.min(clip / maxClip, 1);
        let activePips = Math.ceil(percent * 10);
        let pips = document.querySelectorAll('.mag-pip');
        pips.forEach((pip, index) => {
            pip.classList.toggle('active', index < activePips);
        });
    }

    // Bảng max clip theo weaponid (GTA SA)
    function getMaxClip(weaponId) {
        // Melee / unarmed
        if (weaponId <= 1)  return 1;
        // Brass knuckle, clubs, etc
        if (weaponId <= 9)  return 1;
        // Pistols
        if (weaponId === 22) return 17;  // Colt 45
        if (weaponId === 23) return 1;   // Silenced
        if (weaponId === 24) return 1;   // Desert Eagle — 1 viên/phát, tổng ammo là clip
        if (weaponId === 25) return 1;   // Shotgun
        if (weaponId === 26) return 1;   // Sawnoff
        if (weaponId === 27) return 1;   // Combat shotgun
        if (weaponId === 28) return 30;  // Micro UZI
        if (weaponId === 29) return 30;  // MP5
        if (weaponId === 30) return 30;  // AK47
        if (weaponId === 31) return 30;  // M4
        if (weaponId === 32) return 30;  // Tec9
        if (weaponId === 33) return 1;   // Country Rifle
        if (weaponId === 34) return 1;   // Sniper
        if (weaponId >= 35 && weaponId <= 38) return 1; // Rocket/Grenade
        return 30; // Default
    }

    // =========================================================
    // TOGGLE HUD (gọi từ Kotlin)
    // =========================================================
    function toggleHUD(state) {
        isHudVisible = state;
        document.querySelectorAll('.hud-element').forEach(el => {
            el.classList.toggle('hud-hidden', !state);
        });
    }

    window.onJavaToggleHUD = function(state) {
        toggleHUD(!!state);
    };

    // =========================================================
    // UPDATE HUD (gọi từ Kotlin mỗi khi C++ bắn dữ liệu sang)
    // =========================================================
    window.onJavaUpdateHUD = function(jsonString) {
        try {
            if (!isHudVisible) return;

            // [FIX] Bỏ escape \' mà Kotlin có thể đã thêm vào trước khi parse
            const cleanJson = jsonString.replace(/\\'/g, "'");
            const hud = JSON.parse(cleanJson);

            // --- STATS (Lục giác) ---
            setHexFill('hp-fill',  hud.health);
            setHexFill('arm-fill', hud.armor);
            setHexFill('hun-fill', hud.hunger);
            setHexFill('thi-fill', hud.thirst);
            setHexFill('str-fill', hud.stress);

            // --- THÔNG TIN NGƯỜI CHƠI ---
            // Chỉ cập nhật nếu server gửi tên không rỗng (tránh ghi đè khi RPC 401 tới trước 400)
            if (hud.name && hud.name.trim() !== "") {
                updateText('player-name', hud.name);
            }
            if (hud.jobName && hud.jobName.trim() !== "") {
                updateText('player-job', hud.jobName);
            }

            updateText('player-money',  formatMoney(hud.money));
            updateText('player-count',  hud.onlinePlayers);
            updateText('player-id',     hud.playerid);
            updateText('police-count',  hud.cops);
            updateText('medic-count',   hud.medics);

            // --- VŨ KHÍ ---
            const weaponHud = document.getElementById('weapon-hud');
            const weaponImg = document.getElementById('weapon-img');

            if (!weaponHud) return;

            if (!hud.weaponid || hud.weaponid === 0) {
                // [FIX] Phải đổi display chứ không phải opacity
                weaponHud.style.display = 'none';
            } else {
                // [FIX] Hiện panel vũ khí đúng cách
                weaponHud.style.display = 'block';
                weaponHud.style.opacity = '1';

                if (weaponImg) {
                    weaponImg.src = `https://sarphost.sa-rp.net/SARP-CEF-nvthihi/images/weapons/${hud.imgid || hud.weaponid}.png`;
                }

                updateText('ammo-clip',  hud.clip);
                updateText('ammo-total', hud.weaponName || ("Ammo: " + hud.ammo));

                const maxClip = getMaxClip(hud.weaponid);
                updateMagBar(hud.clip, maxClip);
            }

        } catch (e) {
            console.log("HUD Update Error: " + e + " | JSON: " + jsonString);
        }
    };

} catch (err) {
    console.log("Global HUD Error: " + err);
}

// =========================================================
// EVENT LISTENER: GỌI ĐỔI VŨ KHÍ TỪ GIAO DIỆN WEB
// =========================================================
document.addEventListener("DOMContentLoaded", function() {
    const weaponHud = document.getElementById('weapon-hud');
    if (weaponHud) {
        weaponHud.addEventListener('click', function() {
            // Kiểm tra xem cầu nối AndroidHUD có tồn tại không rồi gọi hàm
            if (window.AndroidHUD && window.AndroidHUD.triggerChangeWeapon) {
                window.AndroidHUD.triggerChangeWeapon();
            } else {
                console.log("Không tìm thấy AndroidHUD bridge!");
            }
        });
    }
});