let inventoryItems = [];
let selectedSlot = -1;
let selectedSkinSlot = -1;
let invMaxSlots = 30;
let skinMaxSlots = 10; // Số slot skin hiện tại của player (server gửi xuống)

// ================= HỆ THỐNG FIX LINK ẢNH =================
const BASE_URL = "https://sarphost.sa-rp.net/SARP-CEF-nvthihi/";

function getHoloImg(path) {
    if (!path) return BASE_URL + "images/items/default.png";
    if (path.startsWith("http")) return path; 
    if (path.startsWith("/")) path = path.substring(1);
    return BASE_URL + path;
}

// ================= HỆ THỐNG TAB INVENTORY =================
let currentInvTab = 'items';

// Biến lưu trữ data test (Sau này server sẽ gửi data thật đè lên biến này)
let skinData = [
    // // Bỏ comment 2 dòng dưới để test thử hiện hình ảnh
    { id: 1, name: "SKIN GACHA S", tier: "S", model: 299 },
    { id: 2, name: "SKIN GACHA S+", tier: "S+", model: 300 }
];

// ========================================================
// JNI BRIDGE: KẾT NỐI VỚI ANDROID VÀ FIX LỖI POPUP
// ========================================================
window.showInventoryMobile = function(jsonItems, jsonSkins, currentW, maxW) {
    try {
        if(jsonItems) inventoryItems = JSON.parse(jsonItems);

        // ✅ Parse skin đúng cách — giống hệt CEF handler
        if(jsonSkins) {
            let parsedSkins = JSON.parse(jsonSkins);
            if(Array.isArray(parsedSkins) && parsedSkins.length > 0) {
                // Lấy maxSlots từ field maxSlots trong từng entry (server gửi kèm)
                let newMax = parsedSkins[0].maxSlots;
                if(newMax && newMax > 0) skinMaxSlots = newMax;
            }

            // Reset rồi map đúng theo slot, giống CEF
            skinData = new Array(skinMaxSlots).fill(null);
            if(Array.isArray(parsedSkins)) {
                parsedSkins.forEach(skin => {
                    if(skin.slot >= 0 && skin.slot < skinMaxSlots) {
                        skinData[skin.slot] = {
                            id:    skin.slot,
                            model: skin.model,
                            name:  skin.name,
                            tier:  skin.tier
                        };
                    }
                });
            }
        }
        
        invMaxSlots = parseInt(maxW) || 30;
        let baloLevel = parseInt(currentW) || 0;

        const wVal = document.getElementById('inv-weight-val');
        const wFill = document.getElementById('inv-weight-fill');
        if(wVal) wVal.innerText = `BALO LV.${baloLevel}  —  ${invMaxSlots} SLOT`;
        if(wFill) wFill.style.width = `${Math.min(100, (baloLevel/10)*100)}%`;

        document.getElementById('inv-wrapper').style.display = 'flex';
        
        selectedSlot = -1;
        const infoPanel = document.getElementById('inv-info-panel');
        if (infoPanel) infoPanel.classList.remove('show');

        currentInvTab = 'items';
        const tabItems = document.getElementById('tab-items');
        const tabSkins = document.getElementById('tab-skins');
        if(tabItems) tabItems.classList.add('active');
        if(tabSkins) tabSkins.classList.remove('active');
        
        document.getElementById('inv-item-grid').style.display = 'grid';
        document.getElementById('inv-skin-grid').style.display = 'none';
        
        renderGrid();
        renderSkinInventory();
    } catch(e) {
        console.error("Lỗi parse JSON Inventory Mobile: ", e);
    }
};

function renderSkinInventory() {
    const skinGrid = document.getElementById('inv-skin-grid');
    if (!skinGrid) return;
    
    skinGrid.innerHTML = ''; 
    
    for (let i = 0; i < skinMaxSlots; i++) {
        let slotDiv = document.createElement('div');
        slotDiv.className = 'holo-slot'; 
        
        // NẾU CÓ SKIN
        if (skinData && skinData[i]) {
            const skin = skinData[i];
            slotDiv.innerHTML = `
                <img src="${getHoloImg(`images/skins/${skin.model}.png`)}" onerror="this.src='${getHoloImg(`images/vehicles/default.png`)}'">
                <div class="holo-slot-amt" style="color: gold;"></div>
                <div class="holo-slot-name">${skin.name}</div>
            `;
            
            slotDiv.onclick = () => {
                selectedSkinSlot = i;
                document.querySelectorAll('#inv-skin-grid .holo-slot').forEach(s => s.classList.remove('active'));
                slotDiv.classList.add('active');

                const detailImg = document.getElementById('inv-detail-img');
                const detailName = document.getElementById('inv-detail-name');
                const detailDesc = document.getElementById('inv-detail-desc');
                const infoPanel = document.getElementById('inv-info-panel');

                if (detailImg) detailImg.src = getHoloImg(`images/skins/${skin.model}.png`);
                if (detailName) detailName.innerText = skin.name;
                if (detailDesc) detailDesc.innerText = `Trang phục phẩm chất ${skin.tier}.\n\nNhấn SỬ DỤNG để thay đổi ngoại hình nhân vật của bạn sang trang phục này.`;

                // Ẩn nút GIAO DỊCH ở tab skin
                const btnTrade = document.getElementById('inv-btn-trade');
                if (btnTrade) btnTrade.style.display = '';

                if (infoPanel) infoPanel.classList.add('show');
            };
        } 
        // NẾU LÀ Ô TRỐNG
        else {
            slotDiv.onclick = () => {
                selectedSkinSlot = -1;
                const infoPanel = document.getElementById('inv-info-panel');
                if (infoPanel) infoPanel.classList.remove('show');
            };
        }
        
        skinGrid.appendChild(slotDiv);
    }
}

function switchInvTab(tabName) {
    if (currentInvTab === tabName) return;
    currentInvTab = tabName;

    document.getElementById('tab-items').classList.remove('active');
    document.getElementById('tab-skins').classList.remove('active');
    document.getElementById('tab-' + tabName).classList.add('active');

    // ✅ Luôn ẩn info panel và reset cả 2 slot khi switch tab
    const infoPanel = document.getElementById('inv-info-panel');
    if (infoPanel) infoPanel.classList.remove('show');

    if (tabName === 'items') {
        document.getElementById('inv-item-grid').style.display = 'grid';
        document.getElementById('inv-skin-grid').style.display = 'none';
        selectedSkinSlot = -1; // reset skin
    } else {
        document.getElementById('inv-item-grid').style.display = 'none';
        document.getElementById('inv-skin-grid').style.display = 'grid';
        selectedSlot = -1;     // ← THÊM: reset item
        renderSkinInventory();
    }

    const detailImg  = document.getElementById('inv-detail-img');
    const detailName = document.getElementById('inv-detail-name');
    const detailDesc = document.getElementById('inv-detail-desc');
    if (detailImg)  detailImg.src = '';
    if (detailName) detailName.innerText = 'CHƯA CHỌN MỤC NÀO';
    if (detailDesc) detailDesc.innerText = 'Vui lòng chọn một vật phẩm hoặc trang phục bên trái để xem thông tin chi tiết.';
}

// ============================================================
// POPUP SYSTEM (HTML VÀ CSS TRONG JS)
// ============================================================
function createPopupHTML() {
    if (document.getElementById('inv-popup-overlay')) return;
    const el = document.createElement('div');
    el.id = 'inv-popup-overlay';
    el.innerHTML = `
        <style>
            #inv-popup-overlay {
                display: none; position: fixed; inset: 0;
                z-index: 99999; align-items: center; justify-content: center;
                background: rgba(0,0,0,0.65);
                pointer-events: all !important;
            }
            #inv-popup-overlay.show { display: flex; }
            .inv-popup-box {
                pointer-events: all !important;
                background: linear-gradient(135deg, rgba(6,10,20,0.98) 0%, rgba(2,4,10,0.98) 100%);
                border: 1px solid rgba(0,240,255,0.2);
                box-shadow: 0 0 40px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,240,255,0.04), inset 0 2px 0 rgba(0,240,255,0.3);
                clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
                width: 420px; padding: 30px; position: relative;
            }
            .inv-popup-title {
                font-family: 'Chakra Petch', sans-serif; font-size: 20px;
                color: #fff; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 2px;
            }
            .inv-popup-sub {
                font-family: 'Rajdhani', sans-serif; font-size: 13px;
                color: rgba(0,240,255,0.7); letter-spacing: 3px; margin-bottom: 22px; font-weight: 700;
            }
            .inv-popup-item-preview {
                display: flex; align-items: center; gap: 15px;
                background: rgba(0,240,255,0.04); border: 1px solid rgba(0,240,255,0.1);
                padding: 12px 16px; margin-bottom: 22px;
                clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
            }
            .inv-popup-item-img { width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8)); }
            .inv-popup-item-name { font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
            .inv-popup-item-amt  { font-family: 'Rajdhani', sans-serif; font-size: 13px; color: rgba(0,240,255,0.7); margin-top: 2px; }
            .inv-popup-label {
                font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700;
                color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;
            }
            .inv-popup-input {
                width: 100%; box-sizing: border-box;
                pointer-events: all !important;
                background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
                color: #fff; padding: 12px 16px; margin-bottom: 18px;
                font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 600;
                outline: none; transition: 0.2s;
                clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
            }
            .inv-popup-input:focus { border-color: rgba(0,240,255,0.5); box-shadow: 0 0 10px rgba(0,240,255,0.1); }
            .inv-popup-input::placeholder { color: #475569; }
            .inv-popup-warn {
                font-family: 'Rajdhani', sans-serif; font-size: 13px; color: #ef4444;
                margin: -10px 0 14px 0; display: none;
            }
            .inv-popup-actions { display: flex; gap: 12px; }
            .inv-popup-btn {
                flex: 1; padding: 14px; border: none; cursor: pointer;
                pointer-events: all !important;
                font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 700;
                letter-spacing: 1.5px; text-transform: uppercase; transition: 0.2s;
                clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
            }
            .inv-popup-btn.choice-player {
                background: rgba(0,240,255,0.1); color: #00f0ff;
                border: 1px solid rgba(0,240,255,0.3); flex-direction: column;
                display: flex; align-items: center; justify-content: center; gap: 6px; padding: 18px 10px;
            }
            .inv-popup-btn.choice-player:hover { background: rgba(0,240,255,0.25); box-shadow: 0 0 20px rgba(0,240,255,0.2); }
            .inv-popup-btn.choice-market {
                background: rgba(245,158,11,0.1); color: #f59e0b;
                border: 1px solid rgba(245,158,11,0.3);
                display: flex; align-items: center; justify-content: center; gap: 6px; padding: 18px 10px;
                flex-direction: column;
            }
            .inv-popup-btn.choice-market:hover { background: rgba(245,158,11,0.25); box-shadow: 0 0 20px rgba(245,158,11,0.2); }
            .inv-popup-btn.choice-icon { font-size: 22px; }
            .inv-popup-btn.choice-label { font-size: 12px; letter-spacing: 1px; }
            .inv-popup-btn.confirm-trade {
                background: rgba(0,240,255,0.15); color: #00f0ff;
                border: 1px solid rgba(0,240,255,0.3);
            }
            .inv-popup-btn.confirm-trade:hover { background: rgba(0,240,255,0.3); box-shadow: 0 0 20px rgba(0,240,255,0.2); }
            .inv-popup-btn.confirm-delete {
                background: rgba(220,38,38,0.15); color: #ef4444;
                border: 1px solid rgba(220,38,38,0.3);
            }
            .inv-popup-btn.confirm-delete:hover { background: rgba(220,38,38,0.4); color: #fff; }
            .inv-popup-btn.cancel-btn {
                background: rgba(255,255,255,0.04); color: #64748b;
                border: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; padding: 14px 20px;
            }
            .inv-popup-btn.cancel-btn:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
            .inv-popup-divider {
                border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;
            }
            .inv-popup-back {
                background: none; border: none; color: rgba(0,240,255,0.5);
                font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700;
                cursor: pointer; pointer-events: all !important;
                letter-spacing: 1px; margin-bottom: 16px; padding: 0;
                display: flex; align-items: center; gap: 6px; transition: 0.2s;
            }
            .inv-popup-back:hover { color: #00f0ff; }

            /* MOBILE RESPONSIVE OVERRIDES CHO POPUP */
            @media screen and (max-width: 950px), screen and (max-height: 600px) {
                .inv-popup-box { width: 300px !important; padding: 15px !important; }
                .inv-popup-title { font-size: 16px !important; margin-bottom: 4px !important; }
                .inv-popup-sub { font-size: 10px !important; margin-bottom: 12px !important; }
                .inv-popup-item-preview { padding: 8px !important; gap: 10px !important; margin-bottom: 12px !important; }
                .inv-popup-item-img { width: 36px !important; height: 36px !important; }
                .inv-popup-item-name { font-size: 13px !important; }
                .inv-popup-item-amt { font-size: 11px !important; }
                .inv-popup-label { font-size: 11px !important; margin-bottom: 4px !important; }
                .inv-popup-input { padding: 8px 10px !important; font-size: 14px !important; margin-bottom: 10px !important; }
                .inv-popup-btn { padding: 10px !important; font-size: 11px !important; }
                .inv-popup-actions { margin-bottom: 5px !important; gap: 8px !important; }
                .inv-popup-warn { font-size: 11px !important; margin: -5px 0 10px 0 !important; }
                .inv-popup-back { font-size: 11px !important; margin-bottom: 10px !important; }
                .inv-popup-divider { margin: 10px 0 !important; }
                .inv-popup-btn.choice-player, .inv-popup-btn.choice-market { padding: 12px 8px !important; }
                .inv-popup-btn.choice-icon { font-size: 18px !important; }
                .inv-popup-btn.choice-label { font-size: 10px !important; }
            }
        </style>

        <div class="inv-popup-box" id="popup-trade-choice" style="display:none;">
            <p class="inv-popup-title"><i class="fa-solid fa-handshake" style="color:#00f0ff;margin-right:10px;"></i>GIAO DỊCH VẬT PHẨM</p>
            <p class="inv-popup-sub">CHỌN HÌNH THỨC GIAO DỊCH</p>
            <div class="inv-popup-item-preview" id="popup-choice-item-preview">
                <img class="inv-popup-item-img" id="popup-choice-img" src="">
                <div>
                    <div class="inv-popup-item-name" id="popup-choice-name">—</div>
                    <div class="inv-popup-item-amt" id="popup-choice-amt">Số lượng: 0</div>
                </div>
            </div>
            <div class="inv-popup-actions" style="gap:16px; margin-bottom: 16px;">
                <button class="inv-popup-btn choice-player" onclick="openPlayerTradePopup()">
                    <span class="choice-icon">👤</span>
                    <span class="choice-label">NGƯỜI CHƠI</span>
                </button>
                <button class="inv-popup-btn choice-market" onclick="chooseMarketplace()">
                    <span class="choice-icon">🏪</span>
                    <span class="choice-label">CHỢ TRỜI</span>
                </button>
            </div>
            <div class="inv-popup-actions">
                <button class="inv-popup-btn cancel-btn" style="flex:1;" onclick="closePopup()">HUỶ BỎ</button>
            </div>
        </div>

        <div class="inv-popup-box" id="popup-trade-player" style="display:none;">
            <button class="inv-popup-back" onclick="showTradeChoice()">← QUAY LẠI</button>
            <p class="inv-popup-title"><i class="fa-solid fa-user" style="color:#00f0ff;margin-right:10px;"></i>GIAO DỊCH NGƯỜI CHƠI</p>
            <p class="inv-popup-sub">PLAYER TRADE SYSTEM</p>
            <div class="inv-popup-item-preview">
                <img class="inv-popup-item-img" id="popup-trade-img" src="">
                <div>
                    <div class="inv-popup-item-name" id="popup-trade-name">—</div>
                    <div class="inv-popup-item-amt" id="popup-trade-maxamt">Số lượng: 0</div>
                </div>
            </div>
            <div class="inv-popup-label">ID người nhận</div>
            <input class="inv-popup-input" id="popup-trade-targetid" type="number" min="0" placeholder="Nhập ID người chơi...">
            <div class="inv-popup-label">Số lượng muốn giao dịch</div>
            <input class="inv-popup-input" id="popup-trade-amount" type="number" min="1" placeholder="Nhập số lượng...">
            <div class="inv-popup-warn" id="popup-trade-warn">⚠ Vui lòng nhập đầy đủ thông tin hợp lệ!</div>
            <div class="inv-popup-actions">
                <button class="inv-popup-btn confirm-trade" onclick="confirmPlayerTrade()"><i class="fa-solid fa-check"></i> XÁC NHẬN</button>
                <button class="inv-popup-btn cancel-btn" onclick="closePopup()">HUỶ BỎ</button>
            </div>
        </div>

        <div class="inv-popup-box" id="popup-delete" style="display:none;">
            <p class="inv-popup-title"><i class="fa-solid fa-trash-can" style="color:#ef4444;margin-right:10px;"></i>XOÁ VẬT PHẨM</p>
            <p class="inv-popup-sub" style="color:rgba(239,68,68,0.7);">REMOVE ITEM FROM INVENTORY</p>
            <div class="inv-popup-item-preview" style="border-color:rgba(239,68,68,0.15);">
                <img class="inv-popup-item-img" id="popup-delete-img" src="">
                <div>
                    <div class="inv-popup-item-name" id="popup-delete-name">—</div>
                    <div class="inv-popup-item-amt" id="popup-delete-maxamt">Số lượng: 0</div>
                </div>
            </div>
            <div class="inv-popup-label">Số lượng muốn xoá</div>
            <input class="inv-popup-input" id="popup-delete-amount" type="number" min="1" placeholder="Nhập số lượng cần xoá...">
            <div class="inv-popup-warn" id="popup-delete-warn">⚠ Số lượng không hợp lệ!</div>
            <hr class="inv-popup-divider">
            <div class="inv-popup-actions">
                <button class="inv-popup-btn confirm-delete" onclick="confirmDelete()"><i class="fa-solid fa-trash-can"></i> XÁC NHẬN XOÁ</button>
                <button class="inv-popup-btn cancel-btn" onclick="closePopup()">HUỶ BỎ</button>
            </div>
        </div>

        <div class="inv-popup-box" id="popup-trade-skin" style="display:none;">
            <button class="inv-popup-back" onclick="closePopup()">← QUAY LẠI</button>
            <p class="inv-popup-title"><i class="fa-solid fa-shirt" style="color:#00f0ff;margin-right:10px;"></i>GIAO DỊCH TRANG PHỤC</p>
            <p class="inv-popup-sub">SKIN TRADE SYSTEM</p>
            <div class="inv-popup-item-preview">
                <img class="inv-popup-item-img" id="popup-tradeskin-img" src="">
                <div>
                    <div class="inv-popup-item-name" id="popup-tradeskin-name">—</div>
                    <div class="inv-popup-item-amt" id="popup-tradeskin-tier">Phẩm chất: -</div>
                </div>
            </div>
            <div class="inv-popup-label">ID người nhận</div>
            <input class="inv-popup-input" id="popup-tradeskin-targetid" type="number" min="0" placeholder="Nhập ID người chơi...">
            <div class="inv-popup-label">Giá tiền bán ($)</div>
            <input class="inv-popup-input" id="popup-tradeskin-price" type="number" min="1" placeholder="Ví dụ: 50000...">
            <div class="inv-popup-warn" id="popup-tradeskin-warn">⚠ Vui lòng nhập đầy đủ ID và Giá tiền hợp lệ!</div>
            <div class="inv-popup-actions">
                <button class="inv-popup-btn confirm-trade" onclick="confirmSkinTradeCEF()"><i class="fa-solid fa-check"></i> GỬI YÊU CẦU</button>
            </div>
        </div>

        <div class="inv-popup-box" id="popup-storeweapon" style="display:none;">
            <p class="inv-popup-title"><i class="fa-solid fa-gun" style="color:#00f0ff;margin-right:10px;"></i>CẤT VŨ KHÍ VÀO BALO</p>
            <p class="inv-popup-sub">STORE WEAPON SYSTEM</p>
            <div id="popup-storeweapon-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;max-height:300px;overflow-y:auto;"></div>
            <div class="inv-popup-warn" id="popup-storeweapon-warn" style="display:none;">⚠ Không có vũ khí nào để cất!</div>
            <div class="inv-popup-actions">
                <button class="inv-popup-btn cancel-btn" style="flex:1;" onclick="closePopup()">HUỶ BỎ</button>
            </div>
        </div>

        <div class="inv-popup-box" id="popup-storeweapon-confirm" style="display:none;">
            <button class="inv-popup-back" onclick="backToWeaponList()">← QUAY LẠI</button>
            <p class="inv-popup-title"><i class="fa-solid fa-box-archive" style="color:#00f0ff;margin-right:10px;"></i>XÁC NHẬN CẤT SÚNG</p>
            <p class="inv-popup-sub">CONFIRM STORE WEAPON</p>
            <div class="inv-popup-item-preview" id="popup-swconfirm-preview">
                <img id="popup-swconfirm-img" class="inv-popup-item-img"
                     src="${getHoloImg('images/items/default.png')}"
                     onerror="this.src='${getHoloImg('images/items/default.png')}'">
                <div>
                    <div class="inv-popup-item-name" id="popup-swconfirm-name">—</div>
                    <div class="inv-popup-item-amt" id="popup-swconfirm-ammo">Đạn: 0</div>
                </div>
            </div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:14px;color:#94a3b8;margin-bottom:20px;line-height:1.6;">
                Vũ khí sẽ được lưu vào balo. Bạn có thể lấy ra lúc khác.
            </div>
            <div class="inv-popup-actions">
                <button class="inv-popup-btn confirm-trade" onclick="confirmStoreWeapon()"><i class="fa-solid fa-box-archive"></i> CẤT VÀO BALO</button>
                <button class="inv-popup-btn cancel-btn" onclick="closePopup()">HUỶ BỎ</button>
            </div>
        </div>
    `;
    document.body.appendChild(el);
}

function _hideAllPopupBoxes() {
    ['popup-trade-choice','popup-trade-player','popup-delete','popup-storeweapon','popup-storeweapon-confirm','popup-trade-skin'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
}

// ---- Weapon Store State ----
let _weaponList = [];
let _selectedWeaponIdx = -1;

// Mở popup chọn hình thức giao dịch
function openTradePopup() {
    if(selectedSlot === -1) return;
    const item = inventoryItems.find(x => x.slot === selectedSlot);
    if(!item) return;
    createPopupHTML();
    // Điền thông tin item vào preview
    document.getElementById('popup-choice-img').src           = getHoloImg(item.img);
    document.getElementById('popup-choice-name').innerText    = item.name;
    document.getElementById('popup-choice-amt').innerText     = `Số lượng hiện có: ${item.amount}`;
    _hideAllPopupBoxes();
    document.getElementById('popup-trade-choice').style.display = 'block';
    document.getElementById('inv-popup-overlay').classList.add('show');
}

// Quay lại popup chọn từ popup trade player
function showTradeChoice() {
    _hideAllPopupBoxes();
    document.getElementById('popup-trade-choice').style.display = 'block';
}

// Mở popup nhập thông tin giao dịch người chơi
function openPlayerTradePopup() {
    const item = inventoryItems.find(x => x.slot === selectedSlot);
    if(!item) return;

    // Vũ khí (1-36) hoặc item đặc biệt (150, 216-219): giao dịch hết amount, ẩn ô nhập số lượng
    const isTradeAll = (item.model >= 1 && item.model <= 36)
        || item.model === 150
        || (item.model >= 216 && item.model <= 219);

    document.getElementById('popup-trade-img').src           = getHoloImg(item.img);
    document.getElementById('popup-trade-name').innerText    = item.name;
    document.getElementById('popup-trade-warn').style.display = 'none';
    document.getElementById('popup-trade-targetid').value    = '';

    const amountInput = document.getElementById('popup-trade-amount');
    const amountLabel = document.querySelector('#popup-trade-player .inv-popup-label:last-of-type');

    if(isTradeAll) {
        amountInput.value          = item.amount;
        amountInput.style.display  = 'none';
        if(amountLabel) amountLabel.style.display = 'none';
        document.getElementById('popup-trade-maxamt').innerText = `Sẽ giao dịch toàn bộ: ${item.amount} ${item.model >= 22 && item.model <= 36 ? 'viên đạn' : ''}`;
    } else {
        amountInput.value          = '';
        amountInput.max            = item.amount;
        amountInput.style.display  = 'block';
        if(amountLabel) amountLabel.style.display = 'block';
        document.getElementById('popup-trade-maxamt').innerText = `Số lượng hiện có: ${item.amount}`;
    }

    const confirmBtn = document.querySelector('#popup-trade-player .confirm-trade');
    if (confirmBtn) confirmBtn.setAttribute('onclick', 'confirmPlayerTrade()');
    
    _hideAllPopupBoxes();
    document.getElementById('popup-trade-player').style.display = 'block';
}

// Chọn Chợ trời → đóng CEF, emit lên server, server dùng SAMP dialog bình thường
function chooseMarketplace() {
    closePopup();
    if(typeof Android !== 'undefined') Android.doInvAction("marketplace", selectedSlot);
    window.closeInventory(); 
}

function closePopup() {
    const overlay = document.getElementById('inv-popup-overlay');
    if(overlay) overlay.classList.remove('show');
}

window.chooseMarketplace = function() {
    closePopup();
    if(typeof Android !== 'undefined') Android.doInvAction("marketplace", selectedSlot);
    window.closeInventory(); 
}

function confirmPlayerTrade() {
    const targetid = parseInt(document.getElementById('popup-trade-targetid').value);
    const item     = inventoryItems.find(x => x.slot === selectedSlot);
    const warn     = document.getElementById('popup-trade-warn');

    const isTradeAll = (item.model >= 1 && item.model <= 36)
        || item.model === 150
        || (item.model >= 216 && item.model <= 219);

    // Với weapon/item đặc biệt: dùng hết amount, không validate ô nhập
    const amount = isTradeAll
        ? item.amount
        : parseInt(document.getElementById('popup-trade-amount').value);

    if(isNaN(targetid) || targetid < 0) {
        warn.style.display = 'block';
        return;
    }
    if(!isTradeAll && (isNaN(amount) || amount < 1 || amount > item.amount)) {
        warn.style.display = 'block';
        return;
    }

    warn.style.display = 'none';
    closePopup();
    if(typeof Android !== 'undefined') Android.doInvAction(`trade|${selectedSlot}|${targetid}|${amount}`, selectedSlot);
    window.closeInventory(); 
}

function openDeletePopup() {
    if(selectedSlot === -1) return;
    const item = inventoryItems.find(x => x.slot === selectedSlot);
    if(!item) return;
    createPopupHTML();

    document.getElementById('popup-delete-img').src          = getHoloImg(item.img);
    document.getElementById('popup-delete-name').innerText   = item.name;
    document.getElementById('popup-delete-maxamt').innerText = `Số lượng hiện có: ${item.amount}`;
    document.getElementById('popup-delete-warn').style.display = 'none';

    // Vũ khí (1-36) hoặc item đặc biệt (150, 216-219): xoá all, ẩn ô nhập số lượng
    const isDeleteAll = (item.model >= 1 && item.model <= 36)
        || item.model === 150
        || (item.model >= 216 && item.model <= 219);
    const amountLabel = document.querySelector('#popup-delete .inv-popup-label');
    const amountInput = document.getElementById('popup-delete-amount');
    if(isDeleteAll) {
        amountInput.value = item.amount;
        amountInput.style.display = 'none';
        if(amountLabel) amountLabel.style.display = 'none';
        document.getElementById('popup-delete-maxamt').innerText = `Sẽ xoá toàn bộ ${item.amount} khỏi túi đồ`;
    } else {
        amountInput.value = '';
        amountInput.max   = item.amount;
        amountInput.style.display = 'block';
        if(amountLabel) amountLabel.style.display = 'block';
        document.getElementById('popup-delete-maxamt').innerText = `Số lượng hiện có: ${item.amount}`;
    }

    // Reset confirm button về đúng handler cho item
    const confirmBtn = document.querySelector('#popup-delete .confirm-delete');
    if (confirmBtn) confirmBtn.setAttribute('onclick', 'confirmDelete()');

    _hideAllPopupBoxes();
    document.getElementById('popup-delete').style.display   = 'block';
    document.getElementById('inv-popup-overlay').classList.add('show');
}

function confirmDelete() {
    const item = inventoryItems.find(x => x.slot === selectedSlot);
    const warn = document.getElementById('popup-delete-warn');
    const isDeleteAll = (item.model >= 1 && item.model <= 36)
        || item.model === 150
        || (item.model >= 216 && item.model <= 219);

    let amount;
    if(isDeleteAll) {
        // Vũ khí → xoá all
        amount = item.amount;
    } else {
        amount = parseInt(document.getElementById('popup-delete-amount').value);
        if(isNaN(amount) || amount < 1 || amount > item.amount) {
            warn.style.display = 'block';
            return;
        }
    }

    warn.style.display = 'none';
    closePopup();
    if(typeof Android !== 'undefined') Android.doInvAction(`delete|${selectedSlot}|${amount}`, selectedSlot);
    window.closeInventory();
}

// ============================================================
// CORE INVENTORY
// ============================================================
function getRarityClass(rarity) {
    if (!rarity) return 'common';
    return rarity.toLowerCase();
}

window.openInventory = function(jsonStr, weightStr) {
    const wrapper = document.getElementById('inv-wrapper');
    if(!wrapper) return;

    try { inventoryItems = JSON.parse(jsonStr); }
    catch(e) { inventoryItems = []; }

    let wData = weightStr.split('|');
    const baloLevel = parseInt(wData[0]) || 0;
    const maxSlots  = parseInt(wData[1]) || 30;
    invMaxSlots = maxSlots;

    const weightVal = document.getElementById('inv-weight-val');
    if(weightVal) {
        weightVal.innerText = `BALO LV.${baloLevel}  —  ${maxSlots} SLOT`;
        let pct = Math.min((baloLevel / 10) * 100, 100);
        let fillEl = document.getElementById('inv-weight-fill');
        if(fillEl) fillEl.style.width = pct + "%";
    }

    selectedSlot = -1;
    const infoPanel = document.getElementById('inv-info-panel');
    if (infoPanel) infoPanel.classList.remove('show');

    currentInvTab = 'items';
    document.getElementById('tab-items')?.classList.add('active');
    document.getElementById('tab-skins')?.classList.remove('active');
    document.getElementById('inv-item-grid').style.display = 'grid';
    document.getElementById('inv-skin-grid').style.display = 'none';

    renderGrid();
    createPopupHTML();
    wrapper.style.display = 'flex';
    if (typeof cef !== 'undefined') cef.focus(true);
}

function renderGrid() {
    const grid = document.getElementById('inv-item-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for(let i = 0; i < invMaxSlots; i++) {
        const item = inventoryItems.find(x => x.slot === i);
        const slotDiv = document.createElement('div');

        let rarityName = item ? getRarityClass(item.rarity) : '';
        slotDiv.className = `holo-slot ${selectedSlot === i ? 'active' : ''} ${item ? 'rarity-' + rarityName : ''}`;
        slotDiv.onclick = () => onInvSlotClick(i, item);

        if(item) {
            slotDiv.innerHTML = `
                <img src="${getHoloImg(item.img)}" onerror="this.src='${getHoloImg('images/items/default.png')}'">
                <div class="holo-slot-amt">x${item.amount}</div>
                <div class="holo-slot-name">${item.name}</div>
            `;
        }
        grid.appendChild(slotDiv);
    }
}

function onInvSlotClick(slotId, itemData) {
    selectedSlot = slotId;
    renderGrid();

    const infoPanel = document.getElementById('inv-info-panel');
    if (!infoPanel) return;

    if(!itemData) {
        infoPanel.classList.remove('show');
        if(typeof Android !== 'undefined') Android.doInvAction("storeweapon", 0);
        return;
    }

    if(itemData) {
        let rarityName = getRarityClass(itemData.rarity);

        document.getElementById('inv-detail-img').src = getHoloImg(itemData.img);
        document.getElementById('inv-detail-name').innerText = itemData.name;
        document.getElementById('inv-detail-desc').innerText = itemData.desc || "Vật phẩm chưa có mô tả.";

        let rarityElement = document.getElementById('inv-detail-rarity');
        if(!rarityElement) {
            rarityElement = document.createElement('div');
            rarityElement.id = 'inv-detail-rarity';
            rarityElement.className = 'holo-item-rarity';
            let nameElement = document.getElementById('inv-detail-name');
            nameElement.parentNode.insertBefore(rarityElement, nameElement.nextSibling);
        }
        rarityElement.innerText = itemData.rarity || 'Common';
        rarityElement.className = `holo-item-rarity text-${rarityName}`;

        const previewBox = document.querySelector('.holo-preview');
        if (previewBox) {
            previewBox.style.background = `radial-gradient(circle, var(--rarity-${rarityName}), transparent 70%)`;
        }

        infoPanel.classList.add('show');
    } else {
        infoPanel.classList.remove('show');
    }
}

window.closeInventory = function() {
    closePopup();
    const wrapper = document.getElementById('inv-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    if (typeof Android !== 'undefined') {
        Android.doInvAction("close", 0);
        Android.closeInventory();
    }
}

window.invAction = function(actionType) {

    if (currentInvTab === 'skins') {
        if (selectedSkinSlot === -1) return;
        const skin = skinData[selectedSkinSlot];
        if (!skin) return;

        if (actionType === 'use') {
            if (typeof Android !== 'undefined') Android.doInvAction("equip_skin", selectedSkinSlot);
            window.closeInventory();
            return;
        }

        if (actionType === 'delete') {
            openSkinDeletePopup(skin);
            return;
        }
        
        if (actionType === 'trade') {
            openSkinTradePopup(skin);
            return;
        }
    }

    if(selectedSlot === -1) return;

    if(actionType === 'use') {
        if(typeof Android !== 'undefined') Android.doInvAction("use", selectedSlot);
        window.closeInventory();
        return;
    }

    if(actionType === 'trade') {
        openTradePopup();
        return;
    }

    if(actionType === 'delete') {
        openDeletePopup();
        return;
    }
}

function openSkinTradePopup(skin) {
    createPopupHTML();
    
    document.getElementById('popup-tradeskin-img').src  = getHoloImg(`images/skins/${skin.model}.png`);
    document.getElementById('popup-tradeskin-name').innerText = skin.name;
    document.getElementById('popup-tradeskin-tier').innerText = `Phẩm chất: [${skin.tier}]`;
    document.getElementById('popup-tradeskin-warn').style.display = 'none';
    
    document.getElementById('popup-tradeskin-targetid').value = '';
    document.getElementById('popup-tradeskin-price').value = '';

    _hideAllPopupBoxes();
    document.getElementById('popup-trade-skin').style.display = 'block';
    document.getElementById('inv-popup-overlay').classList.add('show');
}

function confirmSkinTradeCEF() {
    if (selectedSkinSlot === -1) return;
    
    const targetid = parseInt(document.getElementById('popup-tradeskin-targetid').value);
    const price    = parseInt(document.getElementById('popup-tradeskin-price').value);
    const warn     = document.getElementById('popup-tradeskin-warn');

    if (isNaN(targetid) || targetid < 0 || isNaN(price) || price <= 0) {
        warn.style.display = 'block';
        return;
    }

    warn.style.display = 'none';
    closePopup();
    
    // PC/CEF
    if (typeof cef !== 'undefined') {
        cef.emit('client:skin_trade_req', `${selectedSkinSlot}|${targetid}|${price}`);
    }
    
    // ✅ Mobile
    if (typeof Android !== 'undefined') {
        Android.doInvAction(`skin_trade|${targetid}|${price}`, selectedSkinSlot);
        // slotId = selectedSkinSlot, action chứa targetid và price
    }
    
    window.closeInventory(); 
}

function openSkinDeletePopup(skin) {
    createPopupHTML();
    document.getElementById('popup-delete-img').src          = getHoloImg(`images/skins/${skin.model}.png`);
    document.getElementById('popup-delete-name').innerText   = skin.name;
    document.getElementById('popup-delete-maxamt').innerText = `Trang phục: [${skin.tier}]`;
    document.getElementById('popup-delete-warn').style.display = 'none';

    const amountInput = document.getElementById('popup-delete-amount');
    const amountLabel = document.querySelector('#popup-delete .inv-popup-label');
    if (amountInput) amountInput.style.display = 'none';
    if (amountLabel) amountLabel.style.display = 'none';

    const confirmBtn = document.querySelector('#popup-delete .confirm-delete');
    if (confirmBtn) confirmBtn.setAttribute('onclick', 'confirmSkinDelete()');

    _hideAllPopupBoxes();
    document.getElementById('popup-delete').style.display = 'block';
    document.getElementById('inv-popup-overlay').classList.add('show');
}

function confirmSkinDelete() {
    if (selectedSkinSlot === -1) return;
    closePopup();
    if (typeof Android !== 'undefined') Android.doInvAction(`skin_delete`, selectedSkinSlot);
    //                                                        ^^^^^^^^^^^  action riêng, không đụng item
    skinData[selectedSkinSlot] = null;
    selectedSkinSlot = -1;
    document.getElementById('inv-info-panel')?.classList.remove('show');
    renderSkinInventory();
}

if (typeof cef !== 'undefined') {
    cef.on('inv:open', function(jsonStr, weightStr) {
        window.openInventory(jsonStr, weightStr);
    });

    cef.on('inv:reload', function(jsonStr, weightStr) {
        const wrapper = document.getElementById('inv-wrapper');

        try { 
            inventoryItems = JSON.parse(jsonStr); 
        } catch(e) { 
            inventoryItems = []; 
        }

        if(weightStr) {
            let wData = weightStr.split('|');
            const baloLevel = parseInt(wData[0]) || 0;
            const maxSlots  = parseInt(wData[1]) || 30;
            invMaxSlots = maxSlots;
            
            const weightVal = document.getElementById('inv-weight-val');
            if(weightVal) {
                weightVal.innerText = `BALO LV.${baloLevel}  —  ${maxSlots} SLOT`;
            }
            
            const weightFill = document.getElementById('inv-weight-fill');
            if(weightFill) {
                let pct = Math.min((baloLevel / 10) * 100, 100);
                weightFill.style.width = pct + "%";
            }
        }

        selectedSlot = -1;
        const infoPanel = document.getElementById('inv-info-panel');
        if(infoPanel) infoPanel.classList.remove('show');

        renderGrid();
    });

    cef.on('inv:weaponlist', function(jsonStr) {
        try { _weaponList = JSON.parse(jsonStr); } catch(e) { _weaponList = []; }
        _showWeaponStorePopup();
    });

    cef.on("update_skin_inventory", function(dataJSON, maxSlotsRaw) {
        const newMax = parseInt(maxSlotsRaw);
        if (!isNaN(newMax) && newMax > 0) skinMaxSlots = newMax;

        skinData = new Array(skinMaxSlots).fill(null);

        try {
            let parsed = JSON.parse(dataJSON);
            
            if (Array.isArray(parsed)) {
                parsed.forEach(skin => {
                    if (skin.slot >= 0 && skin.slot < skinMaxSlots) {
                        skinData[skin.slot] = {
                            id: skin.slot,
                            model: skin.model,
                            name: skin.name,
                            tier: skin.tier
                        };
                    }
                });
            }
        } catch (e) {
            console.error("[CEF-SKIN-JS] Lỗi parse JSON: ", e);
        }

        if (currentInvTab === 'skins') {
            renderSkinInventory();
        }
    });
}

function _showWeaponStorePopup() {
    createPopupHTML();
    const warn = document.getElementById('popup-storeweapon-warn');
    const list = document.getElementById('popup-storeweapon-list');

    if(!_weaponList || _weaponList.length === 0) {
        list.innerHTML = '';
        if(warn) warn.style.display = 'block';
    } else {
        if(warn) warn.style.display = 'none';
        list.innerHTML = _weaponList.map(w => `
            <div onclick="selectWeaponToStore(${w.idx})" style="
                display:flex;align-items:center;gap:14px;
                background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.1);
                padding:12px 16px;cursor:pointer;transition:0.2s;
                clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%);
            " onmouseover="this.style.background='rgba(0,240,255,0.1)'"
               onmouseout="this.style.background='rgba(0,240,255,0.04)'">
                <img src="${getHoloImg(`images/weapons/${w.imgid || w.weaponid}.png`)}"
                     onerror="this.src='${getHoloImg('images/items/default.png')}'"
                     style="width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.8));">
                <div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:#fff;">${w.name}</div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:12px;color:rgba(0,240,255,0.7);">
                        ${w.ammo > 1 ? (w.ammo + ' viên đạn') : 'Tối đa'}
                    </div>
                </div>
                <div style="margin-left:auto;color:rgba(0,240,255,0.4);font-size:18px;">›</div>
            </div>
        `).join('');
    }

    _hideAllPopupBoxes();
    document.getElementById('popup-storeweapon').style.display = 'block';
    document.getElementById('inv-popup-overlay').classList.add('show');
}

function selectWeaponToStore(idx) {
    const w = _weaponList.find(x => x.idx === idx);
    if(!w) return;
    _selectedWeaponIdx = idx;

    const img = document.getElementById('popup-swconfirm-img');
    if(img) {
        img.src = getHoloImg(`images/weapons/${w.imgid || w.weaponid}.png`);
        img.onerror = function() { this.src = getHoloImg('images/items/default.png'); };
    }
    document.getElementById('popup-swconfirm-name').innerText  = w.name;
    document.getElementById('popup-swconfirm-ammo').innerText  = w.ammo > 1 ? `Đạn: ${w.ammo} viên` : 'Đạn: Tối đa';

    _hideAllPopupBoxes();
    document.getElementById('popup-storeweapon-confirm').style.display = 'block';
}

function backToWeaponList() {
    _hideAllPopupBoxes();
    document.getElementById('popup-storeweapon').style.display = 'block';
}

function confirmStoreWeapon() {
    if(_selectedWeaponIdx === -1) {
        return;
    }
    closePopup();
    if(typeof Android !== 'undefined') Android.doInvAction(`storeweapon_confirm`, _selectedWeaponIdx);
}

// Thêm hàm nhận weapon list từ mobile bridge
window.showWeaponListMobile = function(jsonStr) {
    try {
        _weaponList = JSON.parse(jsonStr);
    } catch(e) {
        _weaponList = [];
    }
    createPopupHTML();
    _showWeaponStorePopup(); // hàm này đã có sẵn, dùng lại luôn
};

document.addEventListener('keydown', function(e) {
    const wrapper = document.getElementById('inv-wrapper');
    if(wrapper && wrapper.style.display === 'flex') {
        if (e.key === "Escape" || e.keyCode === 27 || e.key === "Tab") {
            e.preventDefault();
            const overlay = document.getElementById('inv-popup-overlay');
            if(overlay && overlay.classList.contains('show')) {
                const tradePlayer = document.getElementById('popup-trade-player');
                if(tradePlayer && tradePlayer.style.display === 'block') {
                    showTradeChoice();
                } else {
                    closePopup();
                }
            } else {
                window.closeInventory();
            }
        }
    }
});
