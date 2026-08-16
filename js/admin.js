// =========================================================================
// MẬT KHẨU QUẢN TRỊ
// -------------------------------------------------------------------------
// Đây KHÔNG phải bảo mật thật sự vì đây là web tĩnh (không có server/backend).
// Toàn bộ mã nguồn, kể cả file này, ai cũng xem được qua "View Page Source"
// hoặc DevTools -> người rành kỹ thuật vẫn có thể bỏ qua màn hình này.
// Mật khẩu chỉ để chặn người vô tình bấm nhầm vào trang quản lý, KHÔNG dùng
// để bảo vệ dữ liệu thật sự nhạy cảm.
//
// CÁCH ĐỔI MẬT KHẨU:
// 1. Mở Console trình duyệt (F12 -> tab Console) ở BẤT KỲ trang nào, chạy:
//
//      crypto.subtle.digest('SHA-256', new TextEncoder().encode('matkhaumoi'))
//        .then(buf => console.log([...new Uint8Array(buf)]
//          .map(b => b.toString(16).padStart(2, '0')).join('')));
//
//    (thay 'matkhaumoi' bằng mật khẩu bạn muốn đặt)
// 2. Console sẽ in ra 1 chuỗi hex 64 ký tự -> copy chuỗi đó.
// 3. Dán đè vào biến ADMIN_PASSWORD_HASH bên dưới, commit lại lên GitHub.
// Mật khẩu mặc định hiện tại đang set là: admin123
// =========================================================================
const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorEl = document.getElementById('loginError');
    const hash = await sha256(input.value);
    if (hash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('adminAuthed', '1'); // chỉ tồn tại trong phiên làm việc (đóng tab là mất)
        errorEl.textContent = '';
        showAdmin();
    } else {
        errorEl.textContent = 'Sai mật khẩu, vui lòng thử lại.';
        input.value = '';
        input.focus();
    }
}

function showAdmin() {
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    loadProducts();
}

// Cho phép nhấn Enter để đăng nhập
document.getElementById('passwordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
});

// Nếu đã đăng nhập trong phiên này rồi thì khỏi hỏi lại mật khẩu
if (sessionStorage.getItem('adminAuthed') === '1') {
    showAdmin();
}

// ====== Chuyển đổi theme (hiệu ứng loang nước) ======
const themeToggleAdmin = document.getElementById('themeToggleAdmin');
const currentTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark', currentTheme === 'dark');
themeToggleAdmin.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

themeToggleAdmin.addEventListener('click', function () {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const bgColor = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        width: 0; height: 0;
        border-radius: 50%;
        background: ${bgColor || (isDark ? '#12121a' : '#f4f6fc')};
        transform: translate(-50%, -50%) scale(0);
        z-index: 9999;
        pointer-events: none;
        transition: none;
    `;
    document.body.appendChild(ripple);
    const size = Math.max(window.innerWidth, window.innerHeight) * 2;
    ripple.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    requestAnimationFrame(() => { ripple.style.transform = `translate(-50%, -50%) scale(${size})`; });
    setTimeout(() => ripple.remove(), 700);
    this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ====== Ảnh placeholder khi lỗi (không phụ thuộc dịch vụ ngoài) ======
const NO_IMAGE_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#6b6b80" text-anchor="middle" dy=".3em">Không có ảnh</text></svg>`
);

// ====== Đọc dữ liệu sản phẩm ======
const PRODUCTS_URL = 'https://raw.githubusercontent.com/carpupvn/PHUONGKRSHOP/main/data/products.json';

async function loadProducts() {
    const list = document.getElementById('productList');
    try {
        const response = await fetch(PRODUCTS_URL + '?t=' + Date.now()); // tránh cache trình duyệt
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const products = await response.json();
        window.productsData = Array.isArray(products) ? products : [];
        renderProductList();
    } catch (error) {
        window.productsData = [];
        list.innerHTML = `<div class="no-products"><i class="fas fa-exclamation-triangle"></i> Lỗi tải sản phẩm: ${error.message}</div>`;
    }
}

function renderProductList() {
    const list = document.getElementById('productList');
    if (!window.productsData || window.productsData.length === 0) {
        list.innerHTML = `<div class="no-products"><i class="fas fa-box-open"></i> Chưa có sản phẩm nào</div>`;
        return;
    }
    list.innerHTML = '';
    window.productsData.forEach(p => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <strong>${p.name}</strong><br>
            <small>${p.id} • ${p.category || 'Không danh mục'}</small><br>
            <span>${formatCurrency(p.price)}</span>
            ${p.originalPrice > p.price ? `<del style="color:var(--text-light); margin-left:6px;">${formatCurrency(p.originalPrice)}</del>` : ''}
            <br><small>Tồn kho: ${p.stock === 0 ? 'Cần đặt trước' : p.stock}</small>
            <div class="actions">
                <button class="btn btn-primary" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Sửa</button>
                <button class="btn btn-danger" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Xóa</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// ====== Thêm / Sửa sản phẩm ======
function generateNextId() {
    const nums = (window.productsData || [])
        .map(p => parseInt((p.id || '').replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return 'sp' + String(next).padStart(3, '0');
}

function showAddForm() {
    document.getElementById('formTitle').textContent = 'Thêm sản phẩm';
    document.getElementById('editId').value = generateNextId();
    document.getElementById('editName').value = '';
    document.getElementById('editCategory').value = '';
    document.getElementById('editDescription').value = '';
    document.getElementById('editOriginalPrice').value = '';
    document.getElementById('editPrice').value = '';
    document.getElementById('editStock').value = '';
    document.getElementById('editMainImage').value = '';
    document.getElementById('editImages').value = '';
    document.getElementById('imageUpload').value = '';
    closeCrop();
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
}

function editProduct(id) {
    const p = (window.productsData || []).find(x => x.id === id);
    if (!p) return;
    document.getElementById('formTitle').textContent = 'Sửa sản phẩm: ' + p.name;
    document.getElementById('editId').value = p.id;
    document.getElementById('editName').value = p.name || '';
    document.getElementById('editCategory').value = p.category || '';
    document.getElementById('editDescription').value = p.description || '';
    document.getElementById('editOriginalPrice').value = p.originalPrice ?? '';
    document.getElementById('editPrice').value = p.price ?? '';
    document.getElementById('editStock').value = p.stock ?? '';
    document.getElementById('editMainImage').value = p.mainImage || '';
    document.getElementById('editImages').value = (p.images || []).join(', ');
    document.getElementById('imageUpload').value = '';
    closeCrop();
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('editForm').style.display = 'none';
    closeCrop();
}

function saveProduct() {
    const id = document.getElementById('editId').value.trim();
    const name = document.getElementById('editName').value.trim();
    if (!id || !name) {
        alert('Vui lòng nhập ít nhất Mã sản phẩm và Tên sản phẩm.');
        return;
    }
    const price = Number(document.getElementById('editPrice').value) || 0;
    const originalPrice = Number(document.getElementById('editOriginalPrice').value) || price;
    const stock = Number(document.getElementById('editStock').value) || 0;
    const mainImageInput = document.getElementById('editMainImage').value.trim();
    const imagesInput = document.getElementById('editImages').value.trim();

    const existingIndex = (window.productsData || []).findIndex(p => p.id === id);
    const existing = existingIndex > -1 ? window.productsData[existingIndex] : null;

    const product = {
        id,
        name,
        category: document.getElementById('editCategory').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        price,
        originalPrice,
        stock,
        // Nếu để trống ô ảnh khi đang sửa -> giữ nguyên ảnh cũ
        mainImage: mainImageInput || (existing ? existing.mainImage : ''),
        images: imagesInput
            ? imagesInput.split(',').map(s => s.trim()).filter(Boolean)
            : (existing ? existing.images : [])
    };

    if (existingIndex > -1) {
        window.productsData[existingIndex] = product;
    } else {
        window.productsData.push(product);
    }

    renderProductList();
    cancelEdit();
    alert('Đã lưu vào danh sách tạm trên trình duyệt.\nNhớ bấm "Tải JSON" rồi thay file data/products.json trên GitHub để lưu vĩnh viễn!');
}

function deleteProduct(id) {
    if (!confirm('Xóa sản phẩm này khỏi danh sách?')) return;
    window.productsData = (window.productsData || []).filter(p => p.id !== id);
    renderProductList();
}

// ====== Xuất file JSON ======
function exportJSON() {
    const blob = new Blob([JSON.stringify(window.productsData || [], null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'products.json');
    alert('Đã tải products.json.\nHãy vào GitHub -> data/products.json -> Edit -> dán/thay nội dung file này rồi Commit.');
}

// ====== Crop ảnh ======
let cropper = null;

document.getElementById('imageUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
        const img = document.getElementById('cropImage');
        img.src = evt.target.result;
        document.getElementById('cropContainer').style.display = 'block';
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 1, // ảnh sản phẩm vuông; đổi thành NaN nếu muốn crop tự do
            viewMode: 1,
            autoCropArea: 1
        });
    };
    reader.readAsDataURL(file);
});

function cropAndDownload() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
    canvas.toBlob(function (blob) {
        const id = document.getElementById('editId').value.trim() || generateNextId();
        // Đếm xem đây là ảnh chính hay ảnh phụ dựa vào việc ô "Ảnh chính" đã có giá trị chưa
        const mainImageField = document.getElementById('editMainImage');
        let filename;
        if (!mainImageField.value.trim()) {
            filename = `${id}.jpg`;
            mainImageField.value = `products/${filename}`;
        } else {
            const imagesField = document.getElementById('editImages');
            const current = imagesField.value.trim() ? imagesField.value.split(',').map(s => s.trim()).filter(Boolean) : [];
            const nextIndex = current.length + 1;
            filename = `${id}_${nextIndex}.jpg`;
            current.push(`products/${filename}`);
            imagesField.value = current.join(', ');
        }
        saveAs(blob, filename);
        alert(`Đã tải ảnh "${filename}".\nNhớ upload ảnh này vào thư mục products/ trên GitHub.`);
        closeCrop();
    }, 'image/jpeg', 0.9);
}

function closeCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropContainer').style.display = 'none';
    document.getElementById('cropImage').src = '';
}