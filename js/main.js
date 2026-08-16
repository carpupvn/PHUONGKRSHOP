// ====== Chuyển đổi theme (hiệu ứng loang nước) ======
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark', currentTheme === 'dark');
themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

themeToggle.addEventListener('click', function(e) {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Hiệu ứng loang nước
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        width: 0; height: 0;
        border-radius: 50%;
        background: ${isDark ? '#1a1a1a' : '#f4f6fc'};
        transform: translate(-50%, -50%) scale(0);
        z-index: 9999;
        pointer-events: none;
        transition: none;
    `;
    document.body.appendChild(ripple);
    const size = Math.max(window.innerWidth, window.innerHeight) * 2;
    ripple.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    requestAnimationFrame(() => {
        ripple.style.transform = `translate(-50%, -50%) scale(${size})`;
    });
    setTimeout(() => {
        ripple.remove();
    }, 700);
    this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ====== Ảnh placeholder khi lỗi (SVG nhúng sẵn, không phụ thuộc dịch vụ ngoài) ======
// via.placeholder.com đã ngừng hoạt động ổn định nên không dùng nữa.
function placeholderSvg(text, w, h) {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#6b6b80" text-anchor="middle" dy=".3em">${text}</text></svg>`
    );
}
const NO_IMAGE_CARD = placeholderSvg('Không có ảnh', 300, 200);
const NO_IMAGE_DETAIL = placeholderSvg('Không có ảnh', 500, 400);

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

// ====== Modal chi tiết (cập nhật) ======
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
            <a href="tel:0913326354" class="btn-contact btn-phone"><i class="fas fa-phone"></i> Gọi ngay</a>
            <a href="https://www.facebook.com/phuong.doan.9619934" target="_blank" class="btn-contact btn-fb"><i class="fab fa-facebook"></i> Nhắn tin</a>
        </div>
    `;
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
}

closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// ====== Khởi tạo ======
loadProducts();