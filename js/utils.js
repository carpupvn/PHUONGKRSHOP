// =========================================================================
// utils.js — code dùng chung cho index.html và admin.html
// Nhớ include file này TRƯỚC main.js / admin.js trong HTML.
// =========================================================================

// ---- Ảnh placeholder khi lỗi (SVG nhúng sẵn, không phụ thuộc dịch vụ ngoài) ----
function placeholderSvg(text, w, h) {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#6b6b80" text-anchor="middle" dy=".3em">${text}</text></svg>`
    );
}
const NO_IMAGE_CARD = placeholderSvg('Không có ảnh', 300, 200);
const NO_IMAGE_DETAIL = placeholderSvg('Không có ảnh', 500, 400);

// ---- Thông tin liên hệ ----
// Link Zalo cá nhân: https://zalo.me/<số điện thoại, bỏ số 0 đầu, thêm 84>
const ZALO_LINK = 'https://zalo.me/84913326354';
const PHONE_DISPLAY = '0913 326 354';
const PHONE_TEL = 'tel:0913326354';

// ---- Theme toggle: hiệu ứng loang nước xuất phát TỪ NÚT BẤM ----
function initThemeToggle(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark', currentTheme === 'dark');
    btn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    btn.addEventListener('click', function (e) {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const bgColor = getComputedStyle(document.body).getPropertyValue('--bg').trim();

        // Toạ độ điểm bấm (hỗ trợ cả trường hợp không có toạ độ, ví dụ gọi bằng bàn phím)
        const rect = btn.getBoundingClientRect();
        const originX = e.clientX || (rect.left + rect.width / 2);
        const originY = e.clientY || (rect.top + rect.height / 2);

        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            top: ${originY}px; left: ${originX}px;
            width: 0; height: 0;
            border-radius: 50%;
            background: ${bgColor || (isDark ? '#12121a' : '#f4f6fc')};
            transform: translate(-50%, -50%) scale(0);
            z-index: 9999;
            pointer-events: none;
            transition: none;
        `;
        document.body.appendChild(ripple);
        // Nhân với căn 2 để đảm bảo phủ hết màn hình dù bấm ở góc nào
        const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.1;
        ripple.style.transition = 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        requestAnimationFrame(() => {
            ripple.style.transform = `translate(-50%, -50%) scale(${size})`;
        });
        setTimeout(() => ripple.remove(), 750);

        btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// ---- Ripple nhỏ khi bấm bất kỳ nút nào (hiệu ứng dạng material, phản hồi khi chạm) ----
document.addEventListener('click', function (e) {
    const el = e.target.closest('.btn, .icon-btn, .admin-link, .btn-contact, .contact-link');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const span = document.createElement('span');
    span.className = 'ripple-span';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left - size / 2) + 'px';
    span.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
});
