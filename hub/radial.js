// Cấu hình 9 Slots (Mỗi slot 40 độ)
const menuConfig = [
    { id: 0, name: "BALO", icon: "M20,6h-4V4c0-1.11-0.89-2-2-2h-4C8.89,2,8,2.89,8,4v2H4C2.89,6,2,6.89,2,8v12c0,1.11,0.89,2,2,2h16c1.11,0,2-0.89,2-2V8C22,6.89,21.11,6,20,6z M10,4h4v2h-4V4z M20,20H4V8h16V20z" },
    { id: 1, name: "KHO XE", icon: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-0.66 0-1.21 0.42-1.42 1.01L3 12v8c0 0.55 0.45 1 1 1h1c0.55 0 1-0.45 1-1v-1h12v1c0 0.55 0.45 1 1 1h1c0.55 0 1-0.45 1-1v-8l-2.08-5.99zM6.5 16c-0.83 0-1.5-0.67-1.5-1.5S5.67 13 6.5 13s1.5 0.67 1.5 1.5S7.33 16 6.5 16zM19 13v5h-2v-5H19z" },
    { id: 2, name: "CÔNG VIỆC", icon: "M20,6h-4V4c0-1.11-0.89-2-2-2h-4C8.89,2,8,2.89,8,4v2H4C2.89,6,2,6.89,2,8v12c0,1.11,0.89,2,2,2h16c1.11,0,2-0.89,2-2V8C22,6.89,21.11,6,20,6z M10,4h4v2h-4V4z M20,20H4V8h16V20z" },
    { id: 3, name: "ĐIỂM DANH", icon: "M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z" },
    { id: 4, name: "CỬA HÀNG", icon: "M7,18c-1.1,0-1.99,0.9-1.99,2S5.9,22,7,22s2-0.9,2-2S8.1,18,7,18z M1,2v2h2l3.6,7.59l-1.35,2.45c-0.16,0.28-0.25,0.61-0.25,0.96c0,1.1,0.9,2,2,2h12v-2H7.42c-0.14,0-0.25-0.11-0.25-0.25l0.03-0.12l0.9-1.63h7.45c0.75,0,1.41-0.41,1.75-1.03l3.58-6.49C20.97,4.78,20.89,4.65,20.76,4.58C20.67,4.53,20.57,4.5,20.46,4.5H5.21l-0.94-2H1z M17,18c-1.1,0-1.99,0.9-1.99,2s0.89,2,1.99,2s2-0.9,2-2S18.1,18,17,18z" },
    { id: 5, name: "BẢNG XẾP HẠNG", icon: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1l2.33 4.08 2.33 2.33L7.67 21h8.67l0-6.58 2.32-2.33 2.33-4.08V7c0-1.1-.9-2-2-2zm-9 12.42V21h-2v-3.58l-1.75-1.75L7.67 19h8.67l1.42-3.33-1.76 1.76zM19 7v1l-2 3.5h-2.5l2-3.5V7h2.5zM7 7h2.5L11.5 10.5H9L7 7z" },
    { id: 6, name: "GIẤY PHÉP", icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z M6 8h5v6H6zm7 1h5v2h-5zm0 3h5v2h-5z" },
    { id: 7, name: "TÌM ĐƯỜNG", icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
    { id: 8, name: "THÔNG TIN", icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }
];

const svgNamespace = "http://www.w3.org/2000/svg";
const menuSvg = document.getElementById('menuSvg');
const centerBtn = document.getElementById('centerBtn');
const menuContainer = document.getElementById('menuContainer');

let isMenuOpen = false;

const cx = 250, cy = 250; 
const rOut = 240;         
const rIn = 70;           
const count = 9;          
const gap = 2;
const startOffset = -90;

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

function initMenu() {
    if(!menuSvg || !centerBtn) return;
    
    // AN TOÀN: Dọn dẹp các lát cắt cũ để tránh đè lớp (lỗi sinh ra gấp đôi element khi bị gọi lại)
    const existingSlices = menuSvg.querySelectorAll('.slice-group');
    existingSlices.forEach(slice => slice.remove());

    const angleStep = 360 / count;
    menuConfig.forEach((item, index) => {
        const startAngle = (index * angleStep) + (gap / 2);
        const endAngle = ((index + 1) * angleStep) - (gap / 2);
        
        const g = document.createElementNS(svgNamespace, "g");
        g.setAttribute("class", "slice-group");

        g.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menuAction(item.id);
        }, { passive: false });

        g.addEventListener('click', (e) => {
            if (window.AndroidHUD) return; 
            menuAction(item.id);
        });

        /* * ĐÃ XOÁ BỎ HOÀN TOÀN TÁC NHÂN GÂY LỖI:
         * Xoá g.style.transform = 'scale(0.98)' ở các sự kiện touch/mouse.
         * Việc này chống lỗi lệch tâm SVG vĩnh viễn khi nhả chuột/tay quá nhanh.
         */
        
        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("class", "slice-path");
        path.setAttribute("d", describeArc(cx, cy, rIn, rOut, startAngle, endAngle));
        g.appendChild(path);

        const midAngle = startAngle + (angleStep - gap)/2;
        const iconPos = polarToCartesian(cx, cy, rIn + (rOut - rIn)/2, midAngle);

        const contentG = document.createElementNS(svgNamespace, "g");
        contentG.setAttribute("class", "content-group");
        contentG.setAttribute("transform", `translate(${iconPos.x}, ${iconPos.y})`);

        const icon = document.createElementNS(svgNamespace, "path");
        icon.setAttribute("d", item.icon);
        icon.setAttribute("class", "menu-icon");
        icon.setAttribute("transform", "translate(-12, -20) scale(1.0)"); 
        contentG.appendChild(icon);

        const text = document.createElementNS(svgNamespace, "text");
        text.setAttribute("x", 0); text.setAttribute("y", 18);
        text.setAttribute("class", "label-text");
        text.textContent = item.name;
        contentG.appendChild(text);

        g.appendChild(contentG);
        menuSvg.insertBefore(g, centerBtn);
    });
}
initMenu();

function openMenu() {
    menuContainer.classList.add('active');
    isMenuOpen = true;
}

function closeMenu(isAction = false) {
    if (!isMenuOpen) return;
    if (menuContainer) menuContainer.classList.remove('active');
    isMenuOpen = false;
    
    try {
        if (typeof cef !== 'undefined' && cef.emit) {
            cef.emit('radial_menu_closed');
            if (cef.focus) cef.focus(false);
        }
    } catch(e) { console.log("CEF PC Bypass"); }

    if (!isAction) {
        try {
            if (window.AndroidHUD && window.AndroidHUD.sendRadialClose) {
                window.AndroidHUD.sendRadialClose();
            }
        } catch(e) { console.error("Lỗi gửi Close Android", e); }
    }
}

function menuAction(itemid) {
    console.log("[HUD_DEBUG] JS da click vao slot: " + itemid);
    
    try {
        if (typeof cef !== 'undefined' && cef.emit) {
            cef.emit('radial_menu_item_selected', String(itemid));
        }
    } catch(e) { console.log("CEF PC Bypass"); }
    
    try {
        if (window.AndroidHUD && window.AndroidHUD.sendRadialAction) {
            console.log("[HUD_DEBUG] Bắn dữ liệu sang Kotlin AndroidHUD...");
            window.AndroidHUD.sendRadialAction(String(itemid));
        } else {
            console.log("[HUD_DEBUG] LỖI: window.AndroidHUD không tồn tại!");
        }
    } catch(e) { console.error("[HUD_DEBUG] Lỗi gửi ID Android", e); }
    
    closeMenu(true); 
}

window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' && isMenuOpen) closeMenu();
});

if (typeof cef !== 'undefined') {
    cef.on('radial:show', openMenu);
    cef.on('radial:hide', closeMenu);
}

window.onJavaToggleRadialMenu = function(state) {
    if (state) openMenu();
    else closeMenu();
};