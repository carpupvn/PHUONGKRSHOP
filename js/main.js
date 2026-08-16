// ====== Theme toggle (dùng chung từ utils.js) ======
initThemeToggle('themeToggle');

// ====== Đọc dữ liệu sản phẩm ======
const PRODUCTS_URL = 'https://raw.githubusercontent.com/carpupvn/PHUONGKRSHOP/main/data/products.json';

async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const products = await response.json();
        if (!products || products.length === 0) {
            document.getElementById('productGrid').innerHTML = `
                <div class="no-products"><i class="fas fa-box-open"></i> Chưa có sản phẩm nào</div>
            `;
            return;
        }
        renderProducts(products);
        window.productsData = products;
    } catch (error) {
        document.getElementById('productGrid').innerHTML = `
            <div class="no-products"><i class="fas fa-exclamation-triangle"></i> Lỗi tải sản phẩm: ${error.message}</div>
        `;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = p.id;
        // Xử lý giá
        let priceHtml = '';
        const hasDiscount = p.originalPrice > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
        if (hasDiscount) {
            priceHtml = `
                <span class="original">${formatCurrency(p.originalPrice)}</span>
                <span>${formatCurrency(p.price)}</span>
                <span class="discount-badge">-${discountPercent}%</span>
            `;
        } else {
            priceHtml = `<span>${formatCurrency(p.price)}</span>`;
        }
        // Trạng thái tồn kho
        const stockClass = p.stock === 0 ? 'out-of-stock' : '';
        const stockText = p.stock === 0 ? '🛒 Cần đặt trước' : `Còn ${p.stock} sản phẩm`;

        // Xử lý ảnh main
        let imgSrc = p.mainImage && p.mainImage.trim() !== '' ? p.mainImage : '';
        const imgTag = imgSrc ? `<img class="main-img" src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${NO_IMAGE_CARD}'">` :
            `<div class="no-image" style="height:180px;display:flex;align-items:center;justify-content:center;background:var(--border);color:var(--text-light);"><i class="fas fa-image" style="font-size:2rem;"></i></div>`;

        card.innerHTML = `
            ${imgTag}
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${priceHtml}</div>
                <div class="product-stock ${stockClass}">${stockText}</div>
            </div>
        `;
        card.addEventListener('click', () => openModal(p.id));
        grid.appendChild(card);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ====== Modal chi tiết ======
const modal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

function openModal(productId) {
    const product = window.productsData.find(p => p.id === productId);
    if (!product) return;
    let html = `
        <img class="detail-img" src="${product.mainImage || NO_IMAGE_DETAIL}" alt="${product.name}" onerror="this.onerror=null;this.src='${NO_IMAGE_DETAIL}'">
        <h2>${product.name}</h2>
        <div class="category"><i class="fas fa-tag"></i> ${product.category || 'Không có danh mục'}</div>
        <div class="description">${product.description || ''}</div>
        <div class="price-box">
            ${product.originalPrice > product.price ? `<span class="original">${formatCurrency(product.originalPrice)}</span>` : ''}
            <span>${formatCurrency(product.price)}</span>
            ${product.originalPrice > product.price ? `<span class="discount-badge">-${Math.round((1 - product.price/product.originalPrice) * 100)}%</span>` : ''}
        </div>
        <div class="product-stock ${product.stock === 0 ? 'out-of-stock' : ''}">
            <i class="fas ${product.stock === 0 ? 'fa-clock' : 'fa-check-circle'}"></i>
            ${product.stock === 0 ? 'Cần đặt trước' : `Còn ${product.stock} sản phẩm`}
        </div>
        <div class="thumbnails">
            ${(product.images || []).map(img => `<img src="${img}" alt="ảnh phụ" onerror="this.style.display='none'" onclick="document.querySelector('.detail-img').src = this.src">`).join('')}
        </div>
        <div class="modal-actions">
            <a href="${ZALO_LINK}" target="_blank" class="btn-contact btn-zalo" data-inquiry="${escapeAttr(product.name)}"><i class="fas fa-comment-dots"></i> Chat Zalo</a>
            <a href="${FB_LINK}" target="_blank" class="btn-contact btn-fb" data-inquiry="${escapeAttr(product.name)}"><i class="fab fa-facebook"></i> Nhắn tin</a>
        </div>
    `;
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
}

closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// ====== Popup mật khẩu quản lý (mở ngay trên trang chủ, không chuyển trang) ======
const passwordScreen = document.getElementById('passwordScreen');
const adminLink = document.getElementById('adminLink');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');

function openPasswordPopup() {
    loginError.textContent = '';
    passwordInput.value = '';
    passwordScreen.style.display = 'flex';
    passwordInput.focus();
}

function closePasswordPopup() {
    passwordScreen.style.display = 'none';
}

adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    openPasswordPopup();
});

document.getElementById('closePasswordBtn').addEventListener('click', closePasswordPopup);

passwordScreen.addEventListener('click', (e) => {
    if (e.target === passwordScreen) closePasswordPopup();
});

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPasswordIndex();
});

async function checkPasswordIndex() {
    const hash = await sha256(passwordInput.value);
    if (hash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('adminAuthed', '1'); // admin.html sẽ đọc cờ này và vào thẳng, không hỏi lại mật khẩu
        window.location.href = 'admin.html';
    } else {
        loginError.textContent = 'Sai mật khẩu, vui lòng thử lại.';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// ====== Khởi tạo ======
loadProducts();
