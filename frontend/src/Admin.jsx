import { useState } from 'react';
import { filterProductsBySearch } from './catalog';

const ORDER_STATUS_CLASS = {
  'Đã xác nhận': 'admin-status-confirmed',
  'Đã giao': 'admin-status-done',
  'Đã huỷ': 'admin-status-cancelled',
  'Đang giao': 'admin-status-shipping',
  'Đang xử lý': 'admin-status-pending',
  'Chờ xác nhận': 'admin-status-pending',
};

const ORDER_ACTIONS = [
  { key: 'confirm', label: 'Xác nhận đơn hàng', nextStatus: 'Đã xác nhận', className: 'admin-order-action-confirm' },
  { key: 'shipping', label: 'Đang giao', nextStatus: 'Đang giao', className: 'admin-order-action-shipping' },
  { key: 'delivered', label: 'Đã giao', nextStatus: 'Đã giao', className: 'admin-order-action-done' },
  { key: 'cancel', label: 'Hủy đơn', nextStatus: 'Đã huỷ', className: 'admin-order-action-cancel' },
];

const TAB_LABELS = {
  dashboard: 'Dashboard',
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
  customers: 'Khách hàng',
};

const CATEGORY_KEY_MAP = {
  'Nữ': 'women',
  'Nam': 'men',
  'Trẻ em': 'kids',
  'Đồ lót & mặc nhà': 'intimates',
};

const PRODUCT_CATEGORY_OPTIONS = ['Nữ', 'Nam', 'Trẻ em', 'Đồ lót & mặc nhà'];
const PRODUCT_SIZE_OPTIONS = ['Size S - XL', 'Size M - 2XL', 'Size Free size', 'Size 90 - 140', 'Size tiêu chuẩn'];
const PRODUCT_STOCK_OPTIONS = ['Còn hàng', 'Mới lên kệ', 'Bán chạy', 'Sắp hết hàng', 'Sắp cháy hàng'];

const getStockLabelByQuantity = (quantity) => {
  if (quantity <= 3) return 'Sắp cháy hàng';
  if (quantity <= 8) return 'Sắp hết hàng';
  if (quantity >= 100) return 'Bán chạy';
  return 'Còn hàng';
};

const getStockClass = (stock) =>
  stock === 'Bán chạy'
    ? 'admin-status-shipping'
    : stock === 'Sắp hết hàng' || stock === 'Sắp cháy hàng'
    ? 'admin-status-pending'
    : 'admin-status-done';

const formatVnd = (value) => Number(value).toLocaleString('vi-VN');

const parsePriceInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
};

const parseAmount = (amount) => Number(String(amount || '').replace(/\D/g, ''));

function StatCard({ label, value, colorClass, icon }) {
  return (
    <div className={`admin-stat-card ${colorClass}`}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-text">
        <p className="admin-stat-value">{value}</p>
        <p className="admin-stat-label">{label}</p>
      </div>
    </div>
  );
}

function DashboardTab({ orders, products, customers }) {
  const processedOrders = orders.filter((order) => order.status === 'Đã giao' || order.status === 'Đã huỷ');
  const deliveredRevenue = orders
    .filter((order) => order.status === 'Đã giao')
    .reduce((total, order) => total + parseAmount(order.amount), 0);

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <StatCard
          label="Tổng sản phẩm"
          value={String(products.length)}
          colorClass="admin-stat-blue"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
        />
        <StatCard
          label="Đơn đã xử lý"
          value={String(processedOrders.length)}
          colorClass="admin-stat-orange"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          }
        />
        <StatCard
          label="Khách hàng"
          value={String(customers.length)}
          colorClass="admin-stat-green"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Doanh thu tháng"
          value={`${deliveredRevenue.toLocaleString('vi-VN')}đ`}
          colorClass="admin-stat-red"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      <div className="admin-recent-section">
        <h3>Đơn hàng gần đây</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {processedOrders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td className="admin-td-id">{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.product}</td>
                  <td className="admin-td-amount">{order.amount}</td>
                  <td>
                    <span className={`admin-status-badge ${ORDER_STATUS_CLASS[order.status] ?? 'admin-status-pending'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({
  products,
  draft,
  editingId,
  onDraftChange,
  onSubmitProduct,
  onStartEdit,
  onDelete,
  onCancelEdit,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const visibleProducts = filterProductsBySearch(products, searchQuery);

  return (
    <div>
      <div className="admin-tab-topbar">
        <div className="admin-tab-topbar-row">
          <span className="admin-count-badge">{products.length} sản phẩm</span>
        </div>
        <div className="admin-search-wrap">
          <span className="admin-search-icon">&#128269;</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="admin-search-clear" onClick={() => setSearchQuery('')}>
              &#10005;
            </button>
          )}
        </div>
      </div>

      <form className="admin-product-form" onSubmit={onSubmitProduct}>
        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={draft.name}
          onChange={(e) => onDraftChange('name', e.target.value)}
          required
        />
        <select value={draft.category} onChange={(e) => onDraftChange('category', e.target.value)}>
          {PRODUCT_CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Giá (VD: 245000)"
          value={draft.priceInput}
          onChange={(e) => onDraftChange('priceInput', e.target.value)}
          required
        />
        <select value={draft.size} onChange={(e) => onDraftChange('size', e.target.value)}>
          {PRODUCT_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={draft.stock} onChange={(e) => onDraftChange('stock', e.target.value)}>
          {PRODUCT_STOCK_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Số lượng"
          min="0"
          value={draft.quantity}
          onChange={(e) => onDraftChange('quantity', e.target.value)}
        />
        <input
          type="text"
          placeholder="URL hình ảnh"
          value={draft.image}
          onChange={(e) => onDraftChange('image', e.target.value)}
        />
        <button type="submit" className="admin-action-btn admin-action-save">
          {editingId ? 'Lưu sửa' : 'Thêm mới'}
        </button>
        {editingId && (
          <button type="button" className="admin-action-btn admin-action-cancel" onClick={onCancelEdit}>
            Hủy
          </button>
        )}
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Size</th>
              <th>Tình trạng</th>
              <th>Số lượng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((p) => {
              const stockClass = getStockClass(p.stockLabel);
              return (
                <tr key={p.id}>
                  <td className="admin-td-id">{p.id}</td>
                  <td className="admin-img-cell">
                    {p.image ? (
                      <img className="admin-product-img-thumb" src={p.image} alt={p.name} />
                    ) : (
                      <span className="admin-img-placeholder">Chưa có</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>
                    <span className="admin-category-badge">{p.categoryLabel}</span>
                  </td>
                  <td className="admin-td-amount">{p.price}đ</td>
                  <td>{p.size}</td>
                  <td>
                    <span className={`admin-status-badge ${stockClass}`}>{p.stockLabel}</span>
                  </td>
                  <td className="admin-td-amount">{p.quantity}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-action-btn admin-action-edit" onClick={() => onStartEdit(p)}>
                        Sửa
                      </button>
                      <button type="button" className="admin-action-btn admin-action-delete" onClick={() => onDelete(p.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="admin-table-note">
        {searchQuery.trim() ? `Tìm thấy ${visibleProducts.length} / ${products.length} sản phẩm` : `Đang hiển thị ${products.length} sản phẩm`}
      </p>
    </div>
  );
}

function OrdersTab({ orders, onUpdateOrderStatus }) {
  const canConfirmOrder = (status) => !['Đã giao', 'Đã huỷ', 'Đang giao', 'Đã xác nhận'].includes(status);
  const canShipOrder = (status) => !['Đã giao', 'Đã huỷ', 'Đang giao'].includes(status);
  const canDeliverOrder = (status) => !['Đã giao', 'Đã huỷ'].includes(status);
  const canCancelOrder = (status) => !['Đã giao', 'Đã huỷ'].includes(status);

  const isActionDisabled = (actionKey, status) => {
    if (actionKey === 'confirm') return !canConfirmOrder(status);
    if (actionKey === 'shipping') return !canShipOrder(status);
    if (actionKey === 'delivered') return !canDeliverOrder(status);
    if (actionKey === 'cancel') return !canCancelOrder(status);
    return false;
  };

  return (
    <div>
      <div className="admin-tab-topbar">
        <span className="admin-count-badge">{orders.length} đơn hàng gần đây</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="admin-td-id">{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.product}</td>
                <td className="admin-td-amount">{order.amount}</td>
                <td>
                  <span className={`admin-status-badge ${ORDER_STATUS_CLASS[order.status] ?? 'admin-status-pending'}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.date}</td>
                <td>
                  <div className="admin-order-actions">
                    {ORDER_ACTIONS.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        className={`admin-order-action-btn ${action.className}`}
                        disabled={isActionDisabled(action.key, order.status)}
                        onClick={() => onUpdateOrderStatus(order.id, action.nextStatus)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-table-note">Admin có thể xác nhận, chuyển sang đang giao, hoàn tất hoặc hủy từng đơn hàng.</p>
    </div>
  );
}

function CustomersTab({ customers }) {
  return (
    <div>
      <div className="admin-tab-topbar">
        <span className="admin-count-badge">{customers.length} khách hàng</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số đơn</th>
              <th>Ngày tham gia</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="admin-td-id">{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.orders}</td>
                <td>{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-table-note">Đang hiển thị {customers.length} tài khoản khách hàng đang có.</p>
    </div>
  );
}

const NAV_TABS = ['dashboard', 'products', 'orders', 'customers'];

function Admin({ adminAuth, onAdminLogout, products, onSetProducts, customers, orders, onSetOrders }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productDraft, setProductDraft] = useState({
    name: '',
    category: PRODUCT_CATEGORY_OPTIONS[0],
    priceInput: '',
    size: PRODUCT_SIZE_OPTIONS[0],
    stock: PRODUCT_STOCK_OPTIONS[0],
    quantity: '',
    image: '',
  });

  const resetDraft = () => {
    setEditingId(null);
    setProductDraft({
      name: '',
      category: PRODUCT_CATEGORY_OPTIONS[0],
      priceInput: '',
      size: PRODUCT_SIZE_OPTIONS[0],
      stock: PRODUCT_STOCK_OPTIONS[0],
      quantity: '',
      image: '',
    });
  };

  const handleDraftChange = (field, value) => {
    setProductDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();

    const priceNumber = parsePriceInput(productDraft.priceInput);
    if (!productDraft.name.trim() || priceNumber <= 0) {
      return;
    }

    const nextProduct = {
      id: editingId || `admin-${Date.now()}`,
      categoryKey: CATEGORY_KEY_MAP[productDraft.category] || 'women',
      categoryLabel: productDraft.category,
      name: productDraft.name.trim(),
      price: formatVnd(priceNumber),
      description: '',
      image: productDraft.image.trim(),
      size: productDraft.size,
      stockLabel: productDraft.stock,
      quantity: parseInt(productDraft.quantity, 10) || 0,
    };

    if (editingId) {
      onSetProducts((prev) => prev.map((item) => (item.id === editingId ? nextProduct : item)));
      resetDraft();
      return;
    }

    onSetProducts((prev) => [nextProduct, ...prev]);
    resetDraft();
  };

  const handleStartEditProduct = (product) => {
    setEditingId(product.id);
    setProductDraft({
      name: product.name,
      category: product.categoryLabel,
      priceInput: String(parsePriceInput(product.price)),
      size: product.size,
      stock: product.stockLabel,
      quantity: String(product.quantity ?? ''),
      image: product.image || '',
    });
  };

  const handleDeleteProduct = (productId) => {
    const product = products.find((item) => item.id === productId);
    const name = product ? `"${product.name}"` : 'sản phẩm này';
    if (!window.confirm(`Bạn có chắc muốn xóa ${name} không?\nHành động này không thể hoàn tác.`)) {
      return;
    }
    onSetProducts((prev) => prev.filter((item) => item.id !== productId));
    if (editingId === productId) {
      resetDraft();
    }
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    const order = orders.find((item) => item.id === orderId);
    const isMovingToShipping = order?.status !== 'Đang giao' && nextStatus === 'Đang giao';

    if (nextStatus === 'Đã huỷ') {
      const orderLabel = order ? `${order.id} - ${order.customer}` : 'đơn hàng này';
      const confirmed = window.confirm(
        `Bạn có chắc muốn hủy ${orderLabel} không?\nHành động này sẽ chuyển đơn hàng sang trạng thái đã hủy.`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (isMovingToShipping && order?.product) {
      onSetProducts((prev) =>
        prev.map((product) => {
          if (product.name !== order.product) {
            return product;
          }

          const nextQuantity = Math.max(0, Number(product.quantity || 0) - 1);

          return {
            ...product,
            quantity: nextQuantity,
            stockLabel: getStockLabelByQuantity(nextQuantity),
          };
        }),
      );
    }

    onSetOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path d="M18 14l2 2 4-4" />
          </svg>
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-brand-name">SunnyWear</span>
            <span className="admin-sidebar-brand-sub">Admin Portal</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-nav-btn${activeTab === tab ? ' is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-email" title={adminAuth.email}>
            {adminAuth.email}
          </span>
          <button type="button" className="admin-logout-btn" onClick={onAdminLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Mở menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h2 className="admin-topbar-title">{TAB_LABELS[activeTab]}</h2>
          <span className="admin-topbar-badge">Admin</span>
        </header>

        <main className="admin-content">
          {activeTab === 'dashboard' && <DashboardTab orders={orders} products={products} customers={customers} />}
          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              draft={productDraft}
              editingId={editingId}
              onDraftChange={handleDraftChange}
              onSubmitProduct={handleSubmitProduct}
              onStartEdit={handleStartEditProduct}
              onDelete={handleDeleteProduct}
              onCancelEdit={resetDraft}
            />
          )}
          {activeTab === 'orders' && <OrdersTab orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />}
          {activeTab === 'customers' && <CustomersTab customers={customers} />}
        </main>
      </div>
    </div>
  );
}

export default Admin;
