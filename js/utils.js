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
const ZALO_LINK = 'https://zalo.me/84913326354';           // Zalo của mẹ (chủ shop)
const FB_LINK = 'https://www.facebook.com/phuong.doan.9619934'; // Facebook của mẹ
const ZALO_WEB_LINK = 'https://zalo.me/8426422984';         // Zalo người làm web
const FB_WEB_LINK = 'https://www.facebook.com/ngocphuocccccc/'; // Facebook người làm web
const PHONE_DISPLAY = '0913 326 354';
const PHONE_TEL = 'tel:0913326354';

// =========================================================================
// THEME TOGGLE — hiệu ứng loang nước (view transition) xuất phát từ nút bấm
// =========================================================================
function initThemeToggle(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const SUN = '<i class="fas fa-sun"></i>';
    const MOON = '<i class="fas fa-moon"></i>';

    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark', currentTheme === 'dark');
    btn.innerHTML = currentTheme === 'dark' ? SUN : MOON;

    function applyTheme() {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        btn.innerHTML = isDark ? SUN : MOON;
    }

    btn.addEventListener('click', function (e) {
        const x = e.clientX || (btn.getBoundingClientRect().left + btn.offsetWidth / 2);
        const y = e.clientY || (btn.getBoundingClientRect().top + btn.offsetHeight / 2);

        // Trình duyệt không hỗ trợ View Transition API -> đổi theme bình thường,
        // không có hiệu ứng loang (an toàn, không lỗi).
        if (!document.startViewTransition) {
            applyTheme();
            return;
        }

        // Bán kính đủ lớn để phủ hết màn hình từ điểm bấm xa nhất
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => applyTheme());
        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 650,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });
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

// =========================================================================
// SOẠN SẴN TIN NHẮN khi bấm Chat Zalo / Nhắn tin Facebook
// -------------------------------------------------------------------------
// LƯU Ý QUAN TRỌNG: Zalo và Facebook (với link cá nhân, không phải Official
// Account / Fanpage) KHÔNG hỗ trợ prefill tin nhắn qua URL như WhatsApp.
// Cách khả thi nhất trên web tĩnh: tự động COPY sẵn tin nhắn vào clipboard,
// rồi mở Zalo/Facebook — khách chỉ cần dán (Ctrl+V hoặc giữ rồi chọn Dán)
// vào khung chat là gửi được ngay.
// =========================================================================
function escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildInquiryMessage(productName) {
    return `Chủ shop ơi, mình đang quan tâm sản phẩm "${productName}", shop tư vấn giúp mình với ạ!`;
}

function showToast(text) {
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = `
        position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(20px);
        background: #1e1e2a; color: #fff; padding: 12px 22px; border-radius: 30px;
        font-size: 0.9rem; z-index: 10000; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 90vw; text-align: center;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Bấm vào bất kỳ phần tử nào có [data-inquiry] (chứa tên sản phẩm) sẽ:
// copy sẵn tin nhắn vào clipboard rồi mới mở link Zalo/Facebook.
document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-inquiry]');
    if (!el) return;
    e.preventDefault();
    const message = buildInquiryMessage(el.dataset.inquiry);
    const url = el.getAttribute('href');

    const openLink = () => window.open(url, '_blank');

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(message)
            .then(() => showToast('Đã copy sẵn tin nhắn — dán (Ctrl+V) vào khung chat nhé!'))
            .catch(() => {})
            .finally(openLink);
    } else {
        openLink();
    }
});
