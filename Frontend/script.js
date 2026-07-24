const API_BASE = "http://localhost:5000/api";

let statsData = null;
let productsData = [];
let ordersData = [];
let customersData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadStats();
    loadProducts();
    loadOrders();
    loadCustomers();
});

function switchView(viewId, element) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById('view-' + viewId).classList.add('active');
    if(element) element.classList.add('active');
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// ======================== API CALLS ======================== //
async function loadStats() {
    try {
        const [statsRes, topRes] = await Promise.all([
            fetch(`${API_BASE}/thongke`),
            fetch(`${API_BASE}/thongke/top5`)
        ]);
        if(statsRes.ok) {
            const data = await statsRes.json();
            document.getElementById('stat-orders').innerText = data.tongDonHangHoanThanh;
            document.getElementById('stat-revenue').innerText = formatPrice(data.tongDoanhThu);
        }
        if(topRes.ok) {
            const topData = await topRes.json();
            const tbody = document.getElementById('top-products-tbody');
            if(topData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Chưa có dữ liệu</td></tr>';
                return;
            }
            tbody.innerHTML = topData.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.totalSold}</td>
                    <td style="color: var(--success); font-weight:600;">${formatPrice(p.totalRevenue)}</td>
                </tr>
            `).join('');
        }
    } catch(e) { console.error("Lỗi Stats:", e); }
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/linhkien`);
        if(res.ok) {
            productsData = await res.json();
            filterProducts();
        }
    } catch(e) { console.error("Lỗi Products:", e); }
}

async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/donhang`);
        if(res.ok) {
            ordersData = await res.json();
            filterOrders();
        }
    } catch(e) { console.error("Lỗi Orders:", e); }
}

async function loadCustomers() {
    try {
        const res = await fetch(`${API_BASE}/khachhang/all`);
        if(res.ok) {
            customersData = await res.json();
            filterCustomers();
        }
    } catch(e) { console.error("Lỗi Customers:", e); }
}

// ======================== RENDERING ======================== //
function filterProducts() {
    const query = document.getElementById('product-search').value.toLowerCase();
    const filtered = productsData.filter(p => p.name.toLowerCase().includes(query));
    document.getElementById('products-tbody').innerHTML = filtered.slice(0, 100).map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${p.stock}</td>
        </tr>
    `).join('');
}

function filterOrders() {
    const query = document.getElementById('order-search').value.toLowerCase();
    const filtered = ordersData.filter(o => o.id.toString().includes(query) || o.customerName.toLowerCase().includes(query));
    document.getElementById('orders-tbody').innerHTML = filtered.slice(0, 100).map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.customerName}</td>
            <td>${new Date(o.date).toLocaleDateString('vi-VN')}</td>
            <td style="color: var(--success); font-weight:600;">${formatPrice(o.total)}</td>
            <td>${o.status}</td>
        </tr>
    `).join('');
}

function filterCustomers() {
    const query = document.getElementById('customer-search').value.toLowerCase();
    const filtered = customersData.filter(c => c.username.toLowerCase().includes(query) || c.fullName.toLowerCase().includes(query) || (c.phone && c.phone.includes(query)));
    document.getElementById('customers-tbody').innerHTML = filtered.slice(0, 100).map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.username}</td>
            <td>${c.fullName}</td>
            <td>${c.phone || ''}</td>
            <td>${c.email}</td>
        </tr>
    `).join('');
}

// ======================== MODALS & FORMS ======================== //
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openCustomerModal() {
    document.getElementById('form-customer').reset();
    openModal('modal-customer');
}

async function submitCustomer(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('cust-username').value,
        password: document.getElementById('cust-password').value,
        fullName: document.getElementById('cust-name').value,
        email: document.getElementById('cust-email').value,
        phone: document.getElementById('cust-phone').value
    };
    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if(res.ok) {
            alert("Thêm khách hàng thành công!");
            closeModal('modal-customer');
            loadCustomers();
        } else {
            alert("Có lỗi xảy ra khi thêm khách hàng.");
        }
    } catch(e) { console.error(e); }
}

function openOrderModal() {
    const select = document.getElementById('order-customer');
    select.innerHTML = '<option value="">-- Chọn Khách Hàng --</option>' + 
        customersData.slice(0, 500).map(c => `<option value="${c.id}" data-addr="${c.address||''}">${c.username} - ${c.fullName}</option>`).join('');
    
    select.onchange = (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        document.getElementById('order-address').value = opt.getAttribute('data-addr') || '';
    };
    
    document.getElementById('order-items-container').innerHTML = '';
    addOrderItem();
    updateOrderTotal();
    openModal('modal-order');
}

function addOrderItem() {
    const container = document.getElementById('order-items-container');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    
    const prodSelect = `<select class="order-item-prod" style="flex:1; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border-color); color:var(--text-main); outline:none; border-radius:4px;" onchange="updateOrderTotal()" required>
        <option value="">-- Chọn Linh Kiện --</option>
        ${productsData.map(p => `<option value="${p.id}" data-price="${p.price - (p.price*p.discount/100)}">${p.name} - ${formatPrice(p.price - (p.price*p.discount/100))}</option>`).join('')}
    </select>`;
    
    div.innerHTML = `
        ${prodSelect}
        <input type="number" class="order-item-qty" min="1" value="1" style="width:70px; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border-color); color:var(--text-main); outline:none; border-radius:4px;" oninput="updateOrderTotal()" required>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove(); updateOrderTotal();"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

function updateOrderTotal() {
    let total = 0;
    const prods = document.querySelectorAll('.order-item-prod');
    const qtys = document.querySelectorAll('.order-item-qty');
    for(let i=0; i<prods.length; i++) {
        if(prods[i].value) {
            const price = parseFloat(prods[i].options[prods[i].selectedIndex].getAttribute('data-price'));
            const qty = parseInt(qtys[i].value) || 0;
            total += price * qty;
        }
    }
    document.getElementById('order-total').innerText = formatPrice(total);
}

async function submitOrder(e) {
    e.preventDefault();
    const customerId = document.getElementById('order-customer').value;
    const address = document.getElementById('order-address').value;
    
    const details = [];
    let total = 0;
    const prods = document.querySelectorAll('.order-item-prod');
    const qtys = document.querySelectorAll('.order-item-qty');
    
    for(let i=0; i<prods.length; i++) {
        if(!prods[i].value) continue;
        const opt = prods[i].options[prods[i].selectedIndex];
        const price = parseFloat(opt.getAttribute('data-price'));
        const qty = parseInt(qtys[i].value);
        details.push({
            productId: parseInt(prods[i].value),
            productName: opt.text.split(' - ')[0],
            quantity: qty,
            unitPrice: price
        });
        total += price * qty;
    }
    
    if(details.length === 0) {
        alert("Vui lòng thêm ít nhất 1 linh kiện!");
        return;
    }
    
    const customerName = document.getElementById('order-customer').options[document.getElementById('order-customer').selectedIndex].text.split(' - ')[1];
    
    const payload = { customerId: parseInt(customerId), customerName, address, total, details };
    
    try {
        const res = await fetch(`${API_BASE}/donhang`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            alert("Tạo đơn hàng thành công!");
            closeModal('modal-order');
            loadOrders();
            loadStats();
        } else {
            alert("Lỗi tạo đơn hàng!");
        }
    } catch(e) { console.error(e); }
}
