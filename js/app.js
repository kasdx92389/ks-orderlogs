// ตัวแปรสำหรับเก็บหมายเลขออเดอร์ปัจจุบัน
let currentOrderNumber = getLastOrderNumber();

// ฟังก์ชันสำหรับดึงหมายเลขออเดอร์ล่าสุดจาก localStorage
function getLastOrderNumber() {
  const savedNumber = localStorage.getItem('lastOrderNumber');
  return savedNumber ? parseInt(savedNumber) : 3303; // เริ่มต้นที่ KSN0000003304
}

// ฟังก์ชันสำหรับบันทึกหมายเลขออเดอร์ล่าสุดลงใน localStorage
function saveLastOrderNumber(number) {
  localStorage.setItem('lastOrderNumber', number.toString());
  currentOrderNumber = number;
}

// ฟังก์ชันสำหรับสร้าง key ของวันนี้
function getTodayKey() {
  return "orders-" + new Date().toISOString().split("T")[0];
}

// ฟังก์ชันสำหรับสร้าง key ตามวันที่ที่ระบุ
function getDateKey(date) {
  return "orders-" + date;
}


// ฟังก์ชันสำหรับแสดง/ซ่อนฟิลด์อัตราแลกเปลี่ยน
function toggleRateField() {
  const channel = document.getElementById('channel').value;
  const rateGroup = document.getElementById('rateGroup');
  const rateInput = document.getElementById('rate');
  if (channel !== '') {
    rateGroup.style.display = 'block';
    rateInput.value = '';
  } else {
    rateGroup.style.display = 'none';
    rateInput.value = '';
  }
}

function toggleEditRateField() {
  const channel = document.getElementById('edit-channel').value;
  const rateGroup = document.getElementById('edit-rateGroup');
  const rateInput = document.getElementById('edit-rate');
  if (channel !== '') {
    rateGroup.style.display = 'block';
    rateInput.value = '';
  } else {
    rateGroup.style.display = 'none';
    rateInput.value = '';
  }
}

// ฟังก์ชันสำหรับแสดง Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toast.classList.remove('bg-success', 'bg-danger');
  toast.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');
  toastMessage.textContent = message;
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// ฟังก์ชันสำหรับบันทึกออเดอร์
function saveOrder(event) {
  if (event) event.preventDefault();
  
  const c = id => document.getElementById(id).value.trim();
  const orderId = c('orderId');
  
  if (!c('customer') || !c('game') || !c('package') || !c('channel') || !c('amount') || !c('admin') || !orderId) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'danger');
    return;
  }

  const orderNumber = parseInt(orderId.replace('KSN', ''));
  saveLastOrderNumber(orderNumber);

  const newOrder = {
    orderId, 
    customer: c('customer'), 
    game: c('game'),
    package: c('package'), 
    channel: c('channel'), 
    rate: c('rate') || 'N/A',
    admin: c('admin'), 
    amount: parseFloat(c('amount')),
    timestamp: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem(getTodayKey()) || '[]');
    existing.push(newOrder);
    localStorage.setItem(getTodayKey(), JSON.stringify(existing));
    
    document.getElementById('orderId').value = '';
    document.getElementById('orderForm').reset();
    
    showToast('บันทึกออเดอร์สำเร็จ');
    renderOrders();
    updateStats();
  } catch (error) {
    console.error('Error saving order:', error);
    showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'danger');
  }
}

// ฟังก์ชันสำหรับแสดงรายการออเดอร์
function renderOrders() {
  const orderList = document.getElementById('order-list');
  const emptyState = document.getElementById('empty-orders');
  const dateFilter = document.getElementById('dateFilter').value;
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  
  let orders = [];
  
  try {
    // ดึงข้อมูลออเดอร์ตามฟิลเตอร์วันที่
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('orders-'));
    
    switch(dateFilter) {
      case 'today':
        const todayKey = getTodayKey();
        if (allKeys.includes(todayKey)) {
          orders = JSON.parse(localStorage.getItem(todayKey) || '[]');
        }
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getDateKey(yesterday.toISOString().split('T')[0]);
        if (allKeys.includes(yesterdayKey)) {
          orders = JSON.parse(localStorage.getItem(yesterdayKey) || '[]');
        }
        break;
      case 'week':
        for(let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const weekKey = getDateKey(date.toISOString().split('T')[0]);
          if (allKeys.includes(weekKey)) {
            const dayOrders = JSON.parse(localStorage.getItem(weekKey) || '[]');
            orders = orders.concat(dayOrders);
          }
        }
        break;
      case 'month':
        for(let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const monthKey = getDateKey(date.toISOString().split('T')[0]);
          if (allKeys.includes(monthKey)) {
            const dayOrders = JSON.parse(localStorage.getItem(monthKey) || '[]');
            orders = orders.concat(dayOrders);
          }
        }
        break;
      default:
        // แสดงทุกออเดอร์
        allKeys.forEach(key => {
          const dayOrders = JSON.parse(localStorage.getItem(key) || '[]');
          orders = orders.concat(dayOrders);
        });
    }
    
    // กรองตามคำค้นหา
    if (searchInput) {
      orders = orders.filter(order => 
        order.customer.toLowerCase().includes(searchInput) ||
        order.orderId.toLowerCase().includes(searchInput) ||
        order.game.toLowerCase().includes(searchInput) ||
        order.package.toLowerCase().includes(searchInput)
      );
    }
    
    // เรียงลำดับตามเวลาล่าสุด
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (orders.length === 0) {
      orderList.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    orderList.innerHTML = orders.map((order, index) => `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card order-card">
          <div class="order-actions">
            <button class="action-btn edit" onclick="editOrder(${index})">
              <i class="material-icons-round">edit</i>
            </button>
            <button class="action-btn delete" onclick="deleteOrder(${index})">
              <i class="material-icons-round">delete</i>
            </button>
          </div>
          <h5><i class="material-icons-round me-1">receipt</i>${order.orderId}</h5>
          <p><i class="material-icons-round me-1">person</i>${order.customer}</p>
          <p><i class="material-icons-round me-1">sports_esports</i>${order.game} - ${order.package}</p>
          <p>
            <i class="material-icons-round me-1">account_balance_wallet</i>${order.channel} (${order.amount.toLocaleString()} บาท)
            ${order.rate !== 'N/A' ? `<br><i class="material-icons-round me-1">currency_exchange</i>${order.rate}` : ''}
          </p>
          <p><i class="material-icons-round me-1">admin_panel_settings</i>${order.admin}</p>
          <div class="timestamp">
            <i class="material-icons-round me-1">history</i>
            ${new Date(order.timestamp).toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error rendering orders:', error);
    showToast('เกิดข้อผิดพลาดในการแสดงรายการ', 'danger');
  }
}

// ฟังก์ชันสำหรับแก้ไขออเดอร์
function editOrder(index) {
  try {
    // หาออเดอร์จากทุกวัน
    let allOrders = [];
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('orders-'));
    allKeys.forEach(key => {
      const dayOrders = JSON.parse(localStorage.getItem(key) || '[]');
      allOrders = allOrders.concat(dayOrders.map(order => ({ ...order, orderKey: key })));
    });
    
    // เรียงลำดับตามเวลาล่าสุด (เหมือนกับที่แสดงในหน้าเว็บ)
    allOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // ตรวจสอบว่า index ถูกต้องหรือไม่
    if (index < 0 || index >= allOrders.length) {
      showToast('ไม่พบข้อมูลออเดอร์ (index ไม่ถูกต้อง)', 'danger');
      return;
    }

    const orderToEdit = allOrders[index];
    if (!orderToEdit) {
      showToast('ไม่พบข้อมูลออเดอร์', 'danger');
      return;
    }
    
    // Fill the edit form with the order data
    document.getElementById('edit-order-index').value = index;
    document.getElementById('edit-orderKey').value = orderToEdit.orderKey;
    document.getElementById('edit-customer').value = orderToEdit.customer;
    document.getElementById('edit-orderId').value = orderToEdit.orderId || '';
    document.getElementById('edit-game').value = orderToEdit.game;
    document.getElementById('edit-package').value = orderToEdit.package;
    document.getElementById('edit-channel').value = orderToEdit.channel;
    document.getElementById('edit-admin').value = orderToEdit.admin;
    document.getElementById('edit-amount').value = orderToEdit.amount;
    document.getElementById('edit-timestamp').value = orderToEdit.timestamp;
    
    // Handle the rate field visibility
    document.getElementById('edit-rateGroup').style.display = 'block';
    document.getElementById('edit-rate').value = orderToEdit.rate || 'N/A';
    
    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
    editModal.show();
  } catch (error) {
    console.error('Error editing order:', error);
    showToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล', 'danger');
  }
}

// ฟังก์ชันสำหรับอัพเดทออเดอร์
function updateOrder() {
  try {
    // ดึงข้อมูลจากฟอร์ม
    const orderKey = document.getElementById('edit-orderKey').value;
    const timestamp = document.getElementById('edit-timestamp').value;
    const orderId = document.getElementById('edit-orderId').value;
    const index = parseInt(document.getElementById('edit-order-index').value);
    
    const c = id => document.getElementById(id).value.trim();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!c('edit-customer') || !c('edit-game') || !c('edit-package') || !c('edit-channel') || !c('edit-amount') || !c('edit-admin')) {
      showToast('กรุณากรอกข้อมูลให้ครบ', 'danger');
      return;
    }
    
    // ตรวจสอบว่า orderKey มีค่าหรือไม่
    if (!orderKey) {
      showToast('ไม่พบข้อมูลวันที่ของออเดอร์', 'danger');
      return;
    }
    
    // ดึงข้อมูลออเดอร์จากวันที่ถูกต้อง
    const dayOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
    
    // ค้นหาออเดอร์ด้วย orderId
    const orderIndex = dayOrders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex === -1) {
      showToast('ไม่พบข้อมูลออเดอร์ในระบบ', 'danger');
      return;
    }
    
    // สร้างข้อมูลออเดอร์ที่อัพเดท
    const updatedOrder = {
      orderId: orderId,
      customer: c('edit-customer'),
      game: c('edit-game'),
      package: c('edit-package'),
      channel: c('edit-channel'),
      rate: c('edit-rate') || 'N/A',
      admin: c('edit-admin'),
      amount: parseFloat(c('edit-amount')),
      timestamp: timestamp
    };
    
    // อัพเดทข้อมูลในออเดอร์ที่เลือก
    dayOrders[orderIndex] = updatedOrder;
    
    // บันทึกข้อมูลลงใน localStorage
    localStorage.setItem(orderKey, JSON.stringify(dayOrders));
    
    // ปิด Modal และแสดงข้อความสำเร็จ
    bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
    showToast('อัพเดทออเดอร์สำเร็จ');
    
    // อัพเดทการแสดงผลและสถิติ
    renderOrders();
    updateStats();
  } catch (error) {
    console.error('Error updating order:', error);
    showToast('เกิดข้อผิดพลาดในการอัพเดทข้อมูล', 'danger');
  }
}



// ฟังก์ชันสำหรับอัพเดทสถิติต์
function updateStats() {
  try {
    let allOrders = [];
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('orders-'));
    allKeys.forEach(key => {
      const dayOrders = JSON.parse(localStorage.getItem(key) || '[]');
      allOrders = allOrders.concat(dayOrders);
    });
    
    // สถิติพื้นฐาน
    document.getElementById('total-orders').textContent = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.amount, 0);
    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString() + ' บาท';
    const averageOrder = allOrders.length ? (totalRevenue / allOrders.length).toFixed(2) : 0;
    document.getElementById('average-order').textContent = parseFloat(averageOrder).toLocaleString() + ' บาท';
    
    // สถิติช่องทางการเติม
    const channelStats = {};
    allOrders.forEach(order => {
      channelStats[order.channel] = (channelStats[order.channel] || 0) + 1;
    });
    
    const channelHtml = Object.entries(channelStats)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span>${channel}</span>
          <span class="badge bg-primary">${count}</span>
        </div>
      `).join('');
    
    document.getElementById('channel-stats').innerHTML = channelHtml;
    
    // สถิติเกมยอดนิยม
    const gameStats = {};
    allOrders.forEach(order => {
      gameStats[order.game] = (gameStats[order.game] || 0) + 1;
    });
    
    const gameHtml = Object.entries(gameStats)
      .sort((a, b) => b[1] - a[1])
      .map(([game, count]) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span>${game}</span>
          <span class="badge bg-primary">${count}</span>
        </div>
      `).join('');
    
    document.getElementById('game-stats').innerHTML = gameHtml;
  } catch (error) {
    console.error('Error updating stats:', error);
    showToast('เกิดข้อผิดพลาดในการอัพเดทสถิติต์', 'danger');
  }
}

// ฟังก์ชันสำหรับส่งออกข้อมูลเป็น CSV
function exportToCSV() {
  try {
    let allOrders = [];
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('orders-'));
    allKeys.forEach(key => {
      const dayOrders = JSON.parse(localStorage.getItem(key) || '[]');
      allOrders = allOrders.concat(dayOrders);
    });
    
    if (allOrders.length === 0) {
      showToast('ไม่มีข้อมูลสำหรับส่งออก', 'danger');
      return;
    }
    
    const headers = ['หมายเลขออเดอร์', 'ลูกค้า', 'เกม', 'แพ็คเกจ', 'ช่องทาง', 'อัตราแลกเปลี่ยน', 'แอดมิน', 'จำนวนเงิน', 'วันที่และเวลา'];
    const csvContent = [
      headers.join(','),
      ...allOrders.map(order => [
        order.orderId,
        `"${order.customer}"`,
        `"${order.game}"`,
        `"${order.package}"`,
        order.channel,
        order.rate,
        order.admin,
        order.amount,
        new Date(order.timestamp).toLocaleString('th-TH')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('ส่งออกข้อมูลสำเร็จ');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    showToast('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'danger');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('orderForm').addEventListener('submit', saveOrder);
  document.getElementById('searchInput').addEventListener('input', renderOrders);
  document.getElementById('dateFilter').addEventListener('change', renderOrders);
  
  renderOrders();
  updateStats();
});