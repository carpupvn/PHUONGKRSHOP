// ĐẶT TRƯỚC TIÊN: PRODUCTS_URL phải được khởi tạo trước vì đoạn code phía dưới
// (kiểm tra sessionStorage) có thể gọi loadProducts() ngay khi script chạy lần
// đầu -> nếu khai báo const này ở cuối file sẽ bị lỗi
// "Cannot access 'PRODUCTS_URL' before initialization" (temporal dead zone).
const PRODUCTS_URL = 'https://raw.githubusercontent.com/carpupvn/PHUONGKRSHOP/main/data/products.json';

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

document.getElementById('passwordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
});

// Nút "x" trên popup mật khẩu -> quay lại trang chủ
document.getElementById('closePasswordBtn').addEventListener('click', () => {
    window.location.href = './';
});

if (sessionStorage.getItem('adminAuthed') === '1') {
    showAdmin();
}

// ====== Theme toggle (dùng chung từ utils.js) ======
initThemeToggle('themeToggleAdmin');

// ====== Đọc dữ liệu sản phẩm ======
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
        const imgSrc = p.mainImage && p.mainImage.trim() !== '' ? p.mainImage : NO_IMAGE_CARD;
        item.innerHTML = `
            <img class="thumb" src="${imgSrc}" alt="${p.name}" onerror="this.onerror=null;this.src='${NO_IMAGE_CARD}'">
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

function resetImageInputs() {
    document.getElementById('mainImageUpload').value = '';
    document.getElementById('subImageUpload').value = '';
    closeCrop();
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
    resetImageInputs();
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
    resetImageInputs();
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('editForm').style.display = 'none';
    resetImageInputs();
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

// ====== Crop ảnh: 2 nút riêng biệt cho ảnh chính và ảnh phụ ======
let cropper = null;
let cropTarget = null; // 'main' hoặc 'sub'

function startCrop(file, target) {
    if (!file) return;
    cropTarget = target;
    const reader = new FileReader();
    reader.onload = function (evt) {
        const img = document.getElementById('cropImage');
        img.src = evt.target.result;
        document.getElementById('cropContainer').style.display = 'block';
        document.getElementById('cropContainer').scrollIntoView({ behavior: 'smooth' });
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 1, // ảnh sản phẩm vuông; đổi thành NaN nếu muốn crop tự do
            viewMode: 1,
            autoCropArea: 1
        });
    };
    reader.readAsDataURL(file);
}

document.getElementById('mainImageUpload').addEventListener('change', function (e) {
    startCrop(e.target.files[0], 'main');
});
document.getElementById('subImageUpload').addEventListener('change', function (e) {
    startCrop(e.target.files[0], 'sub');
});

function cropAndDownload() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
    canvas.toBlob(function (blob) {
        const id = document.getElementById('editId').value.trim() || generateNextId();
        let filename;
        if (cropTarget === 'main') {
            filename = `${id}.jpg`;
            document.getElementById('editMainImage').value = `products/${filename}`;
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
        resetImageInputs();
    }, 'image/jpeg', 0.9);
}

function closeCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropTarget = null;
    const container = document.getElementById('cropContainer');
    if (container) container.style.display = 'none';
    const img = document.getElementById('cropImage');
    if (img) img.src = '';
}
