const API_URL = "http://localhost:5000/api/linhkien";
const CAT_API_URL = "http://localhost:5000/api/loailinhkien";
const ATTR_API_URL = "http://localhost:5000/api/thuoctinh";
const ORDER_API_URL = "http://localhost:5000/api/donhang";
const STAT_API_URL = "http://localhost:5000/api/thongke";
const TOP5_API_URL = "http://localhost:5000/api/thongke/top5";
const CUSTOMER_API_URL = "http://localhost:5000/api/khachhang";

let adminProducts = [];
let adminCategories = [];
let adminAttributes = [];
let adminOrders = [];
let filteredOrders = [];
let adminCustomers = [];
let filteredCustomers = [];
let currentPage = 1;
let currentCustomerPage = 1;
const PAGE_SIZE = 50;
function switchView(viewName) {
    document.getElementById('view-products').style.display = viewName === 'products' ? 'block' : 'none';
    document.getElementById('view-categories').style.display = viewName === 'categories' ? 'block' : 'none';
    document.getElementById('view-attributes').style.display = viewName === 'attributes' ? 'block' : 'none';
    document.getElementById('view-orders').style.display = viewName === 'orders' ? 'block' : 'none';
    document.getElementById('view-stats').style.display = viewName === 'stats' ? 'block' : 'none';
    if(document.getElementById('view-customers')) document.getElementById('view-customers').style.display = viewName === 'customers' ? 'block' : 'none';
    
    document.getElementById('menu-products').classList.toggle('active', viewName === 'products');
    document.getElementById('menu-categories').classList.toggle('active', viewName === 'categories');
    document.getElementById('menu-attributes').classList.toggle('active', viewName === 'attributes');
    document.getElementById('menu-orders').classList.toggle('active', viewName === 'orders');
    document.getElementById('menu-stats').classList.toggle('active', viewName === 'stats');
    if(document.getElementById('menu-customers')) document.getElementById('menu-customers').classList.toggle('active', viewName === 'customers');

    if (viewName === 'attributes') loadAttributes();
    if (viewName === 'orders') loadOrders();
    if (viewName === 'stats') loadStats();
    if (viewName === 'customers') loadCustomers();
}
async function loadCategories() {
    try {
        const response = await fetch(CAT_API_URL);
        if(response.ok) {
            adminCategories = await response.json();
            renderCategoryTable();
            populateCategoryDropdown();
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function renderCategoryTable() {
    const tbody = document.getElementById('cat-tbody');
    let html = '';
    adminCategories.forEach(c => {
        html += `
            <tr>
                <td>#${c.id}</td>
                <td><strong>${c.tenLoai}</strong></td>
                <td>
                    <button class="action-btn btn-edit" onclick="editCategory(${c.id})">Sửa</button>
                    <button class="action-btn btn-delete" onclick="deleteCategory(${c.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function populateCategoryDropdown() {
    const select = document.getElementById('item-category');
    const prodFilter = document.getElementById('product-category-filter');
    const attrFilter = document.getElementById('attr-category-filter');
    
    let html = '<option value="">-- Chọn Loại --</option>';
    let filterHtml = '<option value="">Tất cả danh mục</option>';
    
    adminCategories.forEach(c => {
        html += `<option value="${c.id}">${c.tenLoai}</option>`;
        filterHtml += `<option value="${c.id}">${c.tenLoai}</option>`;
    });
    
    if (select) select.innerHTML = html;
    if (prodFilter) prodFilter.innerHTML = filterHtml;
    if (attrFilter) attrFilter.innerHTML = filterHtml;
}

function toggleCategoryModal() {
    const m = document.getElementById('category-modal');
    m.classList.toggle('active');
    if(!m.classList.contains('active')){
        document.getElementById('category-form').reset();
        document.getElementById('cat-id').value = '';
    }
}

document.getElementById('category-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const tenLoai = document.getElementById('cat-name').value;
    const payload = { tenLoai };

    if(id) {
        await fetch(CAT_API_URL + '/' + id, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    } else {
        await fetch(CAT_API_URL, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    }
    
    toggleCategoryModal();
    loadCategories(); 
});

function editCategory(id) {
    const c = adminCategories.find(x => x.id == id);
    if(c) {
        document.getElementById('cat-modal-title').innerText = 'Sửa Loại Linh kiện';
        document.getElementById('cat-id').value = c.id;
        document.getElementById('cat-name').value = c.tenLoai;
        document.getElementById('category-modal').classList.add('active');
    }
}

async function deleteCategory(id) {
    if(confirm('Bạn có chắc chắn muốn xóa loại này? Các linh kiện thuộc loại này có thể bị lỗi hiển thị.')) {
        await fetch(CAT_API_URL + '/' + id, { method: 'DELETE' });
        loadCategories(); 
    }
}
async function loadAttributes() {
    try {
        const response = await fetch(ATTR_API_URL);
        if(response.ok) {
            adminAttributes = await response.json();
            renderAttributeTable();
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function renderAttributeTable() {
    const tbody = document.getElementById('attr-tbody');
    const filterVal = document.getElementById('attr-category-filter') ? document.getElementById('attr-category-filter').value : '';
    let html = '';
    
    let displayList = adminAttributes;
    if (filterVal) {
        displayList = adminAttributes.filter(a => a.categoryId == filterVal);
    }
    
    displayList.forEach(a => {
        html += `
            <tr>
                <td>#${a.id}</td>
                <td><span class="category-badge">${a.categoryName}</span></td>
                <td><strong>${a.name}</strong></td>
                <td style="color:var(--color-text);">${a.unit || ''}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editAttribute(${a.id})">Sửa</button>
                    <button class="action-btn btn-delete" onclick="deleteAttribute(${a.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function toggleAttributeModal() {
    const m = document.getElementById('attribute-modal');
    m.classList.toggle('active');
    if(m.classList.contains('active')){
        const select = document.getElementById('attr-category-id');
        select.innerHTML = '<option value="">-- Chọn Loại Linh Kiện --</option>';
        adminCategories.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.tenLoai}</option>`;
        });
    } else {
        document.getElementById('attribute-form').reset();
        document.getElementById('attr-id').value = '';
        document.getElementById('attr-unit').value = '';
    }
}

document.getElementById('attribute-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('attr-id').value;
    const categoryId = parseInt(document.getElementById('attr-category-id').value);
    const name = document.getElementById('attr-name').value;
    const unit = document.getElementById('attr-unit').value;
    const payload = { categoryId, name, unit };

    if(id) {
        await fetch(ATTR_API_URL + '/' + id, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    } else {
        await fetch(ATTR_API_URL, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
    }
    
    toggleAttributeModal();
    loadAttributes(); 
});

function editAttribute(id) {
    const a = adminAttributes.find(x => x.id == id);
    if(a) {
        toggleAttributeModal();
        document.getElementById('attr-id').value = a.id;
        document.getElementById('attr-category-id').value = a.categoryId;
        document.getElementById('attr-name').value = a.name;
        document.getElementById('attr-unit').value = a.unit || '';
        document.getElementById('attr-modal-title').innerText = "Sửa Thuộc Tính";
    }
}

async function deleteAttribute(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa thuộc tính này?")) return;
    await fetch(ATTR_API_URL + '/' + id, { method: 'DELETE' });
    loadAttributes();
}
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if(response.ok) {
            adminProducts = await response.json();
            renderTable();
        } else {
            const err = await response.json();
            alert(err.message || "Lỗi tải dữ liệu!");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Hệ thống đang bảo trì hoặc mất kết nối tới máy chủ!");
    }
}

function renderTable() {
    const tbody = document.getElementById('admin-tbody');
    const filterVal = document.getElementById('product-category-filter') ? document.getElementById('product-category-filter').value : '';
    const searchVal = document.getElementById('product-search-filter') ? document.getElementById('product-search-filter').value.toLowerCase().trim() : '';
    let html = '';
    
    let displayList = adminProducts;
    if (filterVal) {
        displayList = displayList.filter(p => p.categoryId == filterVal);
    }
    if (searchVal) {
        displayList = displayList.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            (p.id && p.id.toString().includes(searchVal)) ||
            (p.id && ("#" + p.id).includes(searchVal))
        );
    }
    
    displayList.forEach(p => {
        html += `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td><span style="background:var(--color-bg); border:1px solid var(--color-border); padding:4px 8px; border-radius:4px; font-size:0.8rem;">${p.categoryName}</span></td>
                <td>${Number(p.price).toLocaleString()}đ</td>
                <td><strong style="color:var(--color-accent)">${p.discount}%</strong></td>
                <td><strong>${p.stock || 0}</strong></td>
                <td style="width:60px;">
                    <img src="${p.img ? p.img.split(',')[0] : ''}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.onerror=null; this.src='https://placehold.co/50x50/1A312C/FFF4E1?text=PC'">
                </td>
                <td>
                    <button class="action-btn btn-edit" onclick="editItem(${p.id})">Sửa</button>
                    <button class="action-btn btn-delete" onclick="deleteItem(${p.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function toggleAdminModal() {
    const m = document.getElementById('crud-modal');
    m.classList.toggle('active');
    if(!m.classList.contains('active')){
        document.getElementById('crud-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-images').value = '';
        document.getElementById('existing-images-preview').innerHTML = '';
        document.getElementById('item-existing-images').value = '';
        document.getElementById('dynamic-attributes-container').innerHTML = '';
        document.getElementById('dynamic-attributes-container').style.display = 'none';
    } else {
        if (!document.getElementById('item-id').value) {
            document.getElementById('modal-title').innerText = 'Thêm Linh kiện';
        }
    }
}

document.getElementById('item-category').addEventListener('change', async function(e) {
    await renderDynamicAttributes(e.target.value);
});

async function renderDynamicAttributes(categoryId, existingValues = []) {
    const container = document.getElementById('dynamic-attributes-container');
    if (!categoryId) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(ATTR_API_URL + '/loai/' + categoryId);
        if (res.ok) {
            const attributes = await res.json();
            if (attributes.length > 0) {
                container.style.display = 'block';
                let html = '<h4 style="margin-bottom:10px; color:var(--color-primary);">Thuộc tính kỹ thuật</h4>';
                attributes.forEach(attr => {
                    const existing = existingValues.find(x => x.maThuocTinh === attr.id);
                    const val = existing ? existing.giaTri : '';
                    
                    const unitSuffix = attr.unit ? `<span style="padding: 10px 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-left: none; border-radius: 0 4px 4px 0; color: var(--color-text); font-size: 0.9em; font-weight: 500; display: flex; align-items: center;">${attr.unit}</span>` : '';
                    const inputStyle = attr.unit ? `style="border-radius:4px 0 0 4px; border-right:none;"` : ``;
                    
                    html += `
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="font-size:0.9em; font-weight:600; color:var(--color-text);">${attr.name}</label>
                            <div style="display:flex;">
                                <input type="text" class="dynamic-attr-input" data-id="${attr.id}" value="${val}" ${inputStyle}>
                                ${unitSuffix}
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.style.display = 'none';
                container.innerHTML = '';
            }
        }
    } catch (e) {
        console.error("Lỗi lấy thuộc tính:", e);
    }
}

document.getElementById('crud-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const itemName = document.getElementById('item-name').value;
    const itemPrice = Number(document.getElementById('item-price').value);
    const itemCategory = parseInt(document.getElementById('item-category').value);
    const itemDiscount = parseInt(document.getElementById('item-discount').value) || 0;
    const itemStock = parseInt(document.getElementById('item-stock').value) || 0;

    let existingImages = document.getElementById('item-existing-images').value;
    const fileInput = document.getElementById('item-images');
    let newImageUrls = [];
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('files', fileInput.files[i]);
        }
        try {
            const uploadRes = await fetch(API_URL.replace('/api/linhkien', '/api/upload'), {
                method: 'POST',
                body: formData
            });
            if (uploadRes.ok) {
                newImageUrls = await uploadRes.json();
            }
        } catch (err) {
            console.error("Upload error", err);
        }
    }
    let allImages = [];
    if (existingImages) allImages = allImages.concat(existingImages.split(',').filter(x => x));
    if (newImageUrls.length > 0) allImages = allImages.concat(newImageUrls);

    let finalImgStr = allImages.join(',');

    const payload = {
        name: itemName,
        price: itemPrice,
        img: finalImgStr,
        categoryId: itemCategory,
        discount: itemDiscount,
        stock: itemStock
    };

    let savedId = id;

    if(id) {
        const res = await fetch(API_URL + '/' + id, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.message || "Lỗi cập nhật!");
            return;
        }
    } else {
        const res = await fetch(API_URL, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        if(res.ok) {
            const data = await res.json();
            savedId = data.id;
        } else {
            const err = await res.json();
            alert(err.message || "Lỗi thêm mới!");
            return;
        }
    }
    if (savedId) {
        const attrInputs = document.querySelectorAll('.dynamic-attr-input');
        const attrPayload = Array.from(attrInputs).map(input => ({
            maThuocTinh: parseInt(input.getAttribute('data-id')),
            giaTri: input.value
        }));
        
        await fetch(API_URL + '/' + savedId + '/thuoctinh', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(attrPayload)
        });
    }
    
    toggleAdminModal();
    loadProducts(); 
});

async function editItem(id) {
    const p = adminProducts.find(x => x.id == id);
    if(p) {
        document.getElementById('modal-title').innerText = 'Sửa Linh kiện';
        document.getElementById('item-id').value = p.id;
        document.getElementById('item-name').value = p.name;
        document.getElementById('item-price').value = p.price;
        document.getElementById('item-discount').value = p.discount || 0;
        document.getElementById('item-stock').value = p.stock || 10;
        document.getElementById('item-category').value = p.categoryId;
        document.getElementById('item-existing-images').value = p.img || '';
        document.getElementById('item-images').value = '';
        renderImagePreview();
        let existingValues = [];
        try {
            const res = await fetch(API_URL + '/' + id + '/thuoctinh');
            if (res.ok) existingValues = await res.json();
        } catch(e) {}
        
        await renderDynamicAttributes(p.categoryId, existingValues);
        
        document.getElementById('crud-modal').classList.add('active');
    }
}

async function deleteItem(id) {
    if(confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi MySQL?')) {
        await fetch(API_URL + '/' + id, { method: 'DELETE' });
        loadProducts();
    }
}

function renderImagePreview() {
    const existingStr = document.getElementById('item-existing-images').value;
    const previewDiv = document.getElementById('existing-images-preview');
    previewDiv.innerHTML = '';
    if (existingStr) {
        const urls = existingStr.split(',').filter(x => x);
        urls.forEach((url, idx) => {
            previewDiv.innerHTML += `<div style="position:relative; display:inline-block;">
                <img src="${url}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" onerror="this.onerror=null; this.src='https://placehold.co/60x60/1A312C/FFF4E1?text=Error'">
                <button type="button" onclick="removeExistingImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px; line-height:20px; text-align:center; padding:0;">×</button>
            </div>`;
        });
    }
}

function removeExistingImage(index) {
    const existingStr = document.getElementById('item-existing-images').value;
    if (existingStr) {
        const urls = existingStr.split(',').filter(x => x);
        urls.splice(index, 1);
        document.getElementById('item-existing-images').value = urls.join(',');
        renderImagePreview();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadCategories();
    loadProducts();
});
async function loadOrders() {
    try {
        const res = await fetch(ORDER_API_URL);
        if (res.ok) {
            adminOrders = await res.json();
            filteredOrders = [...adminOrders];
            currentPage = 1;
            renderOrdersTable();
        }
    } catch(e) { console.error(e); }
}

function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    let html = '';
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filteredOrders.slice(start, end);

    pageItems.forEach(o => {
        const date = new Date(o.date).toLocaleString('vi-VN');
        let statusColor = '#333';
        if(o.status === 'Hoàn thành') statusColor = 'var(--color-primary)';
        if(o.status === 'Hủy') statusColor = 'red';
        if(o.status === 'Chờ xác nhận') statusColor = 'orange';

        html += `
            <tr>
                <td>#${o.id}</td>
                <td><strong>${o.customerName}</strong></td>
                <td>${date}</td>
                <td>${o.address}</td>
                <td><strong style="color:var(--color-accent)">${Number(o.total).toLocaleString()} ₫</strong></td>
                <td><span style="font-weight:600; color:${statusColor}">${o.status}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="showOrderDetails(${o.id})">Xem chi tiết</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
    const pageInfo = document.getElementById('page-info');
    if(pageInfo) pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
}

function filterOrders() {
    const query = document.getElementById('order-search').value.toLowerCase();
    const statusFilter = document.getElementById('order-status-filter').value;
    
    filteredOrders = adminOrders.filter(o => {
        const matchSearch = o.customerName.toLowerCase().includes(query) || 
                            o.id.toString().includes(query) ||
                            ("#" + o.id).includes(query);
        const matchStatus = statusFilter === "" || o.status === statusFilter;
        return matchSearch && matchStatus;
    });
    currentPage = 1;
    renderOrdersTable();
}

function jumpToPage() {
    const target = parseInt(document.getElementById('jump-page').value);
    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
    if(target >= 1 && target <= totalPages) {
        currentPage = target;
        renderOrdersTable();
    } else {
        alert(`Vui lòng nhập số trang từ 1 đến ${totalPages}`);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderOrdersTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        renderOrdersTable();
    }
}

function toggleOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.toggle('active');
}

async function showOrderDetails(id) {
    const order = adminOrders.find(o => o.id === id);
    if(!order) return;
    
    document.getElementById('order-modal-title').innerText = `Chi tiết Đơn hàng #${order.id}`;
    document.getElementById('order-modal-customer').innerText = order.customerName;
    document.getElementById('order-modal-address').innerText = order.address || "Chưa cập nhật";
    document.getElementById('order-modal-total').innerText = Number(order.total).toLocaleString() + " ₫";
    document.getElementById('order-modal-status').value = order.status;
    document.getElementById('order-modal-id').value = order.id;

    const tbody = document.getElementById('order-details-tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Đang tải...</td></tr>';
    
    toggleOrderModal();
    
    try {
        const res = await fetch(`${ORDER_API_URL}/${id}/chitiet`);
        if(res.ok) {
            const details = await res.json();
            let html = '';
            details.forEach(d => {
                html += `
                    <tr style="border-bottom:1px solid var(--color-border);">
                        <td style="padding:8px 10px;">${d.productName}</td>
                        <td style="padding:8px 10px; font-weight:bold;">${d.quantity}</td>
                        <td style="padding:8px 10px;">${Number(d.unitPrice).toLocaleString()} ₫</td>
                    </tr>
                `;
            });
            if(details.length === 0) html = '<tr><td colspan="3" style="text-align:center;">Không có chi tiết.</td></tr>';
            tbody.innerHTML = html;
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Lỗi tải chi tiết!</td></tr>';
    }
}

async function saveOrderStatus() {
    const id = document.getElementById('order-modal-id').value;
    const newStatus = document.getElementById('order-modal-status').value;
    
    try {
        await fetch(`${ORDER_API_URL}/${id}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: newStatus})
        });
        toggleOrderModal();
        loadOrders();
    } catch (e) {
        alert('Lỗi cập nhật trạng thái');
    }
}
async function loadStats() {
    try {
        const res = await fetch(STAT_API_URL);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('stat-total-orders').innerText = data.tongDon;
            document.getElementById('stat-total-revenue').innerText = Number(data.tongDoanhThu).toLocaleString() + ' ₫';
        }
        
        const resTop = await fetch(TOP5_API_URL);
        if (resTop.ok) {
            const top5 = await resTop.json();
            renderTop5(top5);
        }
    } catch(e) { console.error(e); }
}

function renderTop5(items) {
    const tbody = document.getElementById('top5-tbody');
    if(!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding:15px; text-align:center;">Chưa có dữ liệu đơn hàng hoàn thành.</td></tr>';
        return;
    }
    
    let html = '';
    const medals = [
        '<i class="fas fa-medal" style="color: gold; font-size: 1.2rem;"></i>',
        '<i class="fas fa-medal" style="color: silver; font-size: 1.2rem;"></i>',
        '<i class="fas fa-medal" style="color: #cd7f32; font-size: 1.2rem;"></i>',
        '<span style="font-weight: 800; color: #64748b; font-size: 1.1rem;">#4</span>',
        '<span style="font-weight: 800; color: #64748b; font-size: 1.1rem;">#5</span>'
    ];
    items.forEach((p, idx) => {
        html += `
            <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px 10px; font-size:1.1rem;"><strong>${medals[idx] || ''} ${p.name}</strong></td>
                <td style="padding: 12px 10px; font-weight:600;">${p.totalSold}</td>
                <td style="padding: 12px 10px; color:var(--color-accent); font-weight:bold;">${Number(p.totalRevenue).toLocaleString()} ₫</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    if(icon) {
        if(isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('theme-icon');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if(icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}


async function loadCustomers() {
    try {
        const res = await fetch(CUSTOMER_API_URL + '/all');
        if (res.ok) {
            adminCustomers = await res.json();
            filteredCustomers = [...adminCustomers];
            currentCustomerPage = 1;
            renderCustomersTable();
        }
    } catch(e) { console.error(e); }
}

function renderCustomersTable() {
    const tbody = document.getElementById('customer-tbody');
    let html = '';
    const start = (currentCustomerPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filteredCustomers.slice(start, end);

    pageItems.forEach(c => {
        const date = c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : 'N/A';
        html += `
            <tr>
                <td>#${c.id}</td>
                <td><strong>${c.username}</strong></td>
                <td>${c.fullName}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn btn-view" onclick="showCustomerDetails(${c.id})" style="background: rgba(66, 132, 117, 0.1); color: var(--color-primary);">Chi tiết</button>
                    <button class="action-btn btn-edit" onclick="editCustomer(${c.id})">Sửa</button>
                    <button class="action-btn btn-delete" onclick="deleteCustomer(${c.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
    if(tbody) tbody.innerHTML = html;

    const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;
    const pageInfo = document.getElementById('customer-page-info');
    if(pageInfo) pageInfo.innerText = `Trang ${currentCustomerPage} / ${totalPages}`;
}

function filterCustomers() {
    const query = document.getElementById('customer-search-filter') ? document.getElementById('customer-search-filter').value.toLowerCase() : '';
    
    filteredCustomers = adminCustomers.filter(c => {
        return (c.username && c.username.toLowerCase().includes(query)) ||
               (c.fullName && c.fullName.toLowerCase().includes(query)) ||
               (c.email && c.email.toLowerCase().includes(query)) ||
               (c.phone && c.phone.includes(query)) ||
               (c.id && c.id.toString().includes(query)) ||
               (c.id && ("#" + c.id).includes(query));
    });
    currentCustomerPage = 1;
    renderCustomersTable();
}

function prevCustomerPage() {
    if (currentCustomerPage > 1) {
        currentCustomerPage--;
        renderCustomersTable();
    }
}

function nextCustomerPage() {
    const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;
    if (currentCustomerPage < totalPages) {
        currentCustomerPage++;
        renderCustomersTable();
    }
}

function toggleCustomerModal() {
    const m = document.getElementById('customer-modal');
    if(m) {
        m.classList.toggle('active');
        if(!m.classList.contains('active')){
            document.getElementById('customer-form').reset();
            document.getElementById('cust-id').value = '';
        }
    }
}

function editCustomer(id) {
    const c = adminCustomers.find(x => x.id === id);
    if(c) {
        document.getElementById('cust-id').value = c.id;
        document.getElementById('cust-username').value = c.username;
        document.getElementById('cust-fullname').value = c.fullName;
        document.getElementById('cust-email').value = c.email;
        document.getElementById('cust-phone').value = c.phone;
        document.getElementById('cust-address').value = c.address;
        
        document.getElementById('customer-modal').classList.add('active');
    }
}

async function deleteCustomer(id) {
    if(confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
        try {
            await fetch(CUSTOMER_API_URL + '/' + id, { method: 'DELETE' });
            loadCustomers();
        } catch(e) {
            alert('Lỗi xóa khách hàng');
        }
    }
}

async function showCustomerDetails(id) {
    try {
        const resUser = await fetch(CUSTOMER_API_URL + '/' + id);
        if(resUser.ok) {
            const u = await resUser.json();
            document.getElementById('detail-fullname').innerText = u.fullName;
            document.getElementById('detail-username').innerText = u.username;
            document.getElementById('detail-email').innerText = u.email;
            document.getElementById('detail-phone').innerText = u.phone;
            document.getElementById('detail-address').innerText = u.address || 'Chưa cập nhật';
        }

        const tbody = document.getElementById('detail-orders-tbody');
        tbody.innerHTML = '<tr><td colspan="4" style="padding:15px; text-align:center;">Đang tải...</td></tr>';
        
        const resOrders = await fetch(CUSTOMER_API_URL + '/' + id + '/donhang');
        if(resOrders.ok) {
            const orders = await resOrders.json();
            if(orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding:15px; text-align:center;">Khách hàng chưa có đơn hàng nào.</td></tr>';
            } else {
                let html = '';
                orders.forEach(o => {
                    const date = new Date(o.date).toLocaleString('vi-VN');
                    let statusColor = '#333';
                    if(o.status === 'Hoàn thành') statusColor = 'var(--color-primary)';
                    if(o.status === 'Hủy') statusColor = 'red';
                    if(o.status === 'Chờ xác nhận') statusColor = 'orange';
                    
                    html += `
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 10px;">#${o.id}</td>
                            <td style="padding: 10px;">${date}</td>
                            <td style="padding: 10px; font-weight: 600; color: var(--color-accent);">${Number(o.total).toLocaleString()} ₫</td>
                            <td style="padding: 10px; font-weight: 600; color: ${statusColor};">${o.status}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        }
        
        document.getElementById('customer-details-modal').classList.add('active');
    } catch(e) {
        console.error(e);
        alert('Lỗi tải chi tiết khách hàng');
    }
}

function openCreateCustomerModal() {
    document.getElementById('customer-form').reset();
    document.getElementById('cust-id').value = '';
    document.getElementById('customer-modal').classList.add('active');
}

if(document.getElementById('customer-form')) {
    document.getElementById('customer-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('cust-id').value;
        const fullName = document.getElementById('cust-fullname').value;
        const email = document.getElementById('cust-email').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;
        
        if(id) {
            await fetch(CUSTOMER_API_URL + '/' + id, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ fullName, email, phone, address })
            });
        } else {
            const username = document.getElementById('cust-username').value;
            const password = '123456'; 
            await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password, fullName, email, phone })
            });
        }
        toggleCustomerModal();
        loadCustomers();
    });
}

let orderItemCount = 0;

function toggleCreateOrderModal() {
    const m = document.getElementById('create-order-modal');
    if(m) m.classList.toggle('active');
}

function openCreateOrderModal() {
    document.getElementById('create-order-form').reset();
    document.getElementById('new-order-items').innerHTML = '';
    document.getElementById('new-order-total').innerText = '0 ₫';
    orderItemCount = 0;
    
    const custSearch = document.getElementById('new-order-customer-search');
    const custId = document.getElementById('new-order-customer');
    const dropdown = document.getElementById('customer-search-dropdown');
    
    if (custSearch) custSearch.value = '';
    if (custId) custId.value = '';
    if (dropdown) dropdown.style.display = 'none';

    addOrderRow();
    document.getElementById('create-order-modal').classList.add('active');
}

function searchCustomerForOrder() {
    const input = document.getElementById('new-order-customer-search');
    const dropdown = document.getElementById('customer-search-dropdown');
    const val = input.value.toLowerCase().trim();
    
    if (!val) {
        dropdown.style.display = 'none';
        return;
    }
    
    const results = adminCustomers.filter(c => 
        (c.fullName && c.fullName.toLowerCase().includes(val)) ||
        (c.username && c.username.toLowerCase().includes(val)) ||
        (c.phone && c.phone.includes(val))
    ).slice(0, 10); // Limit to 10 results
    
    if (results.length > 0) {
        let html = '';
        results.forEach(c => {
            html += `<div style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--color-border);" 
                     onmouseover="this.style.background='var(--color-surface)'" 
                     onmouseout="this.style.background='transparent'"
                     onclick="selectCustomerForOrder(${c.id}, '${c.fullName.replace(/'/g, "\\'")}')">
                <strong>${c.fullName}</strong> <br>
                <small style="color: #666;">${c.phone || c.email || c.username}</small>
            </div>`;
        });
        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = '<div style="padding: 10px; color: #888;">Không tìm thấy khách hàng</div>';
        dropdown.style.display = 'block';
    }
}

function selectCustomerForOrder(id, name) {
    document.getElementById('new-order-customer').value = id;
    document.getElementById('new-order-customer-search').value = name;
    document.getElementById('customer-search-dropdown').style.display = 'none';
}

function addOrderRow() {
    orderItemCount++;
    const rowId = `order-row-${orderItemCount}`;
    let productOptions = '<option value="">-- Chọn linh kiện --</option>';
    
    // Limit to 1000 products to prevent massive DOM if database is huge
    const maxProducts = Math.min(adminProducts.length, 1000);
    for(let i = 0; i < maxProducts; i++) {
        const p = adminProducts[i];
        productOptions += `<option value="${p.id}" data-price="${p.price}">${p.name} - ${Number(p.price).toLocaleString()} ₫</option>`;
    }
    
    if (adminProducts.length > 1000) {
        productOptions += `<option value="" disabled>... và ${adminProducts.length - 1000} linh kiện khác</option>`;
    }

    const html = `
        <div id="${rowId}" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
            <select class="order-product-select" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border);" onchange="calculateOrderTotal()" required>
                ${productOptions}
            </select>
            <input type="number" class="order-product-qty" min="1" value="1" style="width: 80px; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border);" oninput="calculateOrderTotal()" required>
            <button type="button" onclick="document.getElementById('${rowId}').remove(); calculateOrderTotal();" style="background: transparent; color: #e74c3c; border: none; font-size: 1.2rem; cursor: pointer;"><i class="fas fa-trash"></i></button>
        </div>
    `;
    document.getElementById('new-order-items').insertAdjacentHTML('beforeend', html);
}

function calculateOrderTotal() {
    let total = 0;
    const rows = document.querySelectorAll('#new-order-items > div');
    rows.forEach(row => {
        const select = row.querySelector('.order-product-select');
        const qty = row.querySelector('.order-product-qty');
        if(select && select.value && qty && qty.value) {
            const option = select.options[select.selectedIndex];
            const price = parseFloat(option.getAttribute('data-price')) || 0;
            total += price * parseInt(qty.value);
        }
    });
    document.getElementById('new-order-total').innerText = total.toLocaleString() + ' ₫';
    return total;
}

if(document.getElementById('create-order-form')) {
    document.getElementById('create-order-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const custId = document.getElementById('new-order-customer').value;
        const custSearch = document.getElementById('new-order-customer-search');
        
        if (!custId) {
            alert('Vui lòng chọn khách hàng từ danh sách!');
            return;
        }
        
        const custName = custSearch.value;
        const address = document.getElementById('new-order-address').value;
        const total = calculateOrderTotal();
        
        const details = [];
        const rows = document.querySelectorAll('#new-order-items > div');
        rows.forEach(row => {
            const select = row.querySelector('.order-product-select');
            const qty = row.querySelector('.order-product-qty');
            if(select && select.value && qty && qty.value) {
                const option = select.options[select.selectedIndex];
                const price = parseFloat(option.getAttribute('data-price')) || 0;
                details.push({
                    productId: parseInt(select.value),
                    productName: option.text.split(' - ')[0],
                    quantity: parseInt(qty.value),
                    unitPrice: price
                });
            }
        });

        if(details.length === 0) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm!');
            return;
        }

        const payload = {
            customerId: parseInt(custId),
            customerName: custName,
            address: address,
            total: total,
            details: details
        };

        try {
            await fetch('http://localhost:5000/api/donhang', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            toggleCreateOrderModal();
            loadOrders();
        } catch(err) {
            alert('Lỗi tạo đơn hàng');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if(typeof initTheme === 'function') initTheme();
    loadCategories();
    loadProducts();

    // Enable horizontal scroll with mouse wheel for sidebar menu
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.addEventListener('wheel', (evt) => {
            if (window.innerWidth <= 1200) {
                evt.preventDefault();
                sidebarMenu.scrollLeft += evt.deltaY;
            }
        });
    }
});
