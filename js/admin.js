// ====== Cấu hình mật khẩu (dùng Web Crypto API) ======
const SALT = "LuyenGoTiengViet";
const PASSWORD_HASH = "a0a94fdbbfd4d501c3016aae5e261cda27a66f9c16ccb004631b809a81560adf"; // "cocaimatkhaucungkhongbiet" + salt

async function sha256WithSalt(message, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const input = document.getElementById('passwordInput').value;
    const hash = await sha256WithSalt(input, SALT);
    if (hash === PASSWORD_HASH) {
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadProductsAdmin();
    } else {
        document.getElementById('loginError').textContent = 'Sai mật khẩu!';
    }
}

// ====== Theme ======
document.getElementById('themeToggleAdmin').addEventListener('click', function() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    this.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggleAdmin').innerHTML = '<i class="fas fa-sun"></i>';
}

// ====== Dữ liệu ======
let products = [];
const PRODUCTS_URL = 'https://raw.githubusercontent.com/carpupvn/PHUONGKRSHOP/main/data/products.json';

async function loadProductsAdmin() {
    try {
        const res = await fetch(PRODUCTS_URL);
        if (!res.ok) throw new Error('Không tải được');
        products = await res.json();
        renderProductList();
    } catch (e) {
        alert('Lỗi tải dữ liệu: ' + e.message);
    }
}

function renderProductList() {
    const container = document.getElementById('productList');
    if (!products || products.length === 0) {
        container.innerHTML = `<div class="no-products"><i class="fas fa-box-open"></i> Chưa có sản phẩm nào</div>`;
        return;
    }
    container.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <strong>${p.name}</strong> (${p.id})
            <br>Giá: ${formatCurrency(p.price)} - Tồn: ${p.stock}
            <div class="actions">
                <button class="btn btn-primary" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Sửa</button>
                <button class="btn btn-danger" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Xóa</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ====== Thêm/Sửa ======
let editingId = null;
let cropper = null;

function showAddForm() {
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Thêm sản phẩm mới';
    document.getElementById('editId').value = '';
    document.getElementById('editName').value = '';
    document.getElementById('editCategory').value = '';
    document.getElementById('editDescription').value = '';
    document.getElementById('editPrice').value = '';
    document.getElementById('editOriginalPrice').value = '';
    document.getElementById('editStock').value = 0;
    document.getElementById('editMainImage').value = '';
    document.getElementById('editImages').value = '';
    editingId = null;
}

function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Sửa sản phẩm';
    document.getElementById('editId').value = p.id;
    document.getElementById('editName').value = p.name;
    document.getElementById('editCategory').value = p.category || '';
    document.getElementById('editDescription').value = p.description || '';
    document.getElementById('editPrice').value = p.price;
    document.getElementById('editOriginalPrice').value = p.originalPrice || p.price;
    document.getElementById('editStock').value = p.stock;
    document.getElementById('editMainImage').value = p.mainImage || '';
    document.getElementById('editImages').value = (p.images || []).join(', ');
    editingId = id;
}

function cancelEdit() {
    document.getElementById('editForm').style.display = 'none';
    closeCrop();
}

function deleteProduct(id) {
    if (!confirm('Xóa sản phẩm này?')) return;
    products = products.filter(p => p.id !== id);
    renderProductList();
}

function saveProduct() {
    const id = document.getElementById('editId').value.trim() || generateId();
    const name = document.getElementById('editName').value.trim();
    const category = document.getElementById('editCategory').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const originalPrice = parseFloat(document.getElementById('editOriginalPrice').value) || price;
    const stock = parseInt(document.getElementById('editStock').value) || 0;
    const mainImage = document.getElementById('editMainImage').value.trim() || `products/${id}.jpg`;
    const imagesStr = document.getElementById('editImages').value.trim();
    const images = imagesStr ? imagesStr.split(',').map(s => s.trim()) : [];

    if (!name) { alert('Vui lòng nhập tên sản phẩm'); return; }
    if (isNaN(price) || price <= 0) { alert('Giá bán không hợp lệ'); return; }

    const existing = products.find(p => p.id === id);
    if (existing) {
        existing.name = name;
        existing.category = category;
        existing.description = description;
        existing.price = price;
        existing.originalPrice = originalPrice;
        existing.stock = stock;
        existing.mainImage = mainImage;
        existing.images = images;
    } else {
        products.push({ id, name, category, description, price, originalPrice, stock, mainImage, images });
    }
    renderProductList();
    cancelEdit();
    alert('Đã lưu! Nhớ tải JSON và push lên GitHub.');
}

function generateId() {
    const max = products.reduce((max, p) => {
        const num = parseInt(p.id.replace('sp', ''));
        return num > max ? num : max;
    }, 0);
    return `sp${String(max + 1).padStart(3, '0')}`;
}

// ====== Xuất JSON ======
function exportJSON() {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'products.json');
}

// ====== Crop ảnh ======
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('cropImage');
        img.src = event.target.result;
        document.getElementById('cropContainer').style.display = 'block';
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.8,
        });
    };
    reader.readAsDataURL(file);
});

function closeCrop() {
    document.getElementById('cropContainer').style.display = 'none';
    if (cropper) { cropper.destroy(); cropper = null; }
    document.getElementById('imageUpload').value = '';
}

function cropAndDownload() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 500, height: 500 });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const id = document.getElementById('editId').value.trim() || 'product';
    const link = document.createElement('a');
    link.download = `${id}.jpg`;
    link.href = dataUrl;
    link.click();
    alert('Ảnh đã tải xuống. Hãy upload lên thư mục products/ trên GitHub.');
    closeCrop();
}