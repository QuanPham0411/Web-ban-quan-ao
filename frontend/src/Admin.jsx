import { useState } from 'react';
import { filterProductsBySearch } from './catalog';
import AdminInventory from './AdminInventory';
import ScrollTopButton from './components/ScrollTopButton';

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
  inventory: 'Tồn kho',
  offers: 'Ưu đãi',
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

const parseExpiryDate = (value) => {
  const raw = String(value || '').trim();

  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return new Date(year, month - 1, day);
  }

  const dmyMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    return new Date(year, month - 1, day);
  }

  return null;
};

const formatDateToDmy = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatExpireLabel = (value) => {
  const date = parseExpiryDate(value);
  if (!date) {
    return String(value || '').trim() || 'Không có thời hạn';
  }

  return `Hết hạn: ${formatDateToDmy(date)}`;
};

const toInputDateValue = (value) => {
  const date = parseExpiryDate(value);

  if (!date) {
    return '';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const isExpiredByDateValue = (value) => {
  const date = parseExpiryDate(value);
  if (!date) {
    return false;
  }

  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return Date.now() > endOfDay.getTime();
};

const getOrderItems = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }

  if (order.product) {
    return [{ id: order.id, name: order.product, quantity: 1 }];
  }

  return [];
};

function OrderItemsCell({ order }) {
  const items = getOrderItems(order);
  const groupedItems = items.reduce((accumulator, item) => {
    const key = String(item.name || '').trim();
    if (!key) {
      return accumulator;
    }

    const existing = accumulator.find((entry) => entry.name === key);
    if (existing) {
      existing.quantity += Number(item.quantity || 0);
      return accumulator;
    }

    accumulator.push({
      name: key,
      quantity: Number(item.quantity || 0),
    });
    return accumulator;
  }, []);

  return (
    <div className="admin-order-product-list">
      {groupedItems.map((item, index) => (
        <div key={`${order.id}-${item.name}-${index}`} className="admin-order-product-item">
          <span>
            {item.name}
            {Number(item.quantity || 0) > 1 ? ` (SL: ${item.quantity})` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

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
                  <td><OrderItemsCell order={order} /></td>
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
        <textarea
          rows="2"
          className="admin-product-description-input"
          placeholder="Mô tả sản phẩm"
          value={draft.description}
          onChange={(e) => onDraftChange('description', e.target.value)}
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
              <th>Mô tả</th>
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
                  <td className="admin-product-description-cell">{p.description || 'Chưa có mô tả'}</td>
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

function OrdersTab({ orders, onUpdateOrderStatus, onDeleteOrder }) {
  const canConfirmOrder = (status) => !['Đã giao', 'Đã huỷ', 'Đang giao', 'Đã xác nhận'].includes(status);
  const canShipOrder = (status) => !['Đã giao', 'Đã huỷ', 'Đang giao'].includes(status);
  const canDeliverOrder = (status) => !['Đã giao', 'Đã huỷ'].includes(status);
  const canCancelOrder = (status) => !['Đã giao', 'Đã huỷ'].includes(status);
  const canDeleteOrder = (status) => status === 'Đã huỷ';

  const isActionDisabled = (actionKey, status) => {
    if (actionKey === 'confirm') return !canConfirmOrder(status);
    if (actionKey === 'shipping') return !canShipOrder(status);
    if (actionKey === 'delivered') return !canDeliverOrder(status);
    if (actionKey === 'cancel') return !canCancelOrder(status);
    return false;
  };

  const handleDeleteOrder = (order) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hẳn đơn ${order.id} không?\nSau khi xóa, đơn sẽ biến mất khỏi Dashboard và danh sách đơn hàng.`,
    );

    if (!confirmed) {
      return;
    }

    onDeleteOrder(order.id);
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
                <td><OrderItemsCell order={order} /></td>
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
                    {canDeleteOrder(order.status) ? (
                      <button
                        type="button"
                        className="admin-order-action-btn admin-order-action-delete"
                        onClick={() => handleDeleteOrder(order)}
                      >
                        Xóa đơn
                      </button>
                    ) : null}
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

function CustomersTab({ customers, onDeleteCustomer }) {
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
              <th>Hành động</th>
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
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="admin-action-btn admin-action-delete" onClick={() => onDeleteCustomer(c)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-table-note">Đang hiển thị {customers.length} tài khoản khách hàng đang có.</p>
    </div>
  );
}

function OffersTab({
  promotions,
  vouchers,
  promotionDraft,
  voucherDraft,
  editingPromotionId,
  editingVoucherId,
  onPromotionDraftChange,
  onVoucherDraftChange,
  onSubmitPromotion,
  onSubmitVoucher,
  onEditPromotion,
  onEditVoucher,
  onDeletePromotion,
  onDeleteVoucher,
  onCancelPromotionEdit,
  onCancelVoucherEdit,
}) {
  const promotionItems = promotions.map((offer) => {
    const expirySource = offer.expiresAt || offer.expire;
    return {
      ...offer,
      expireLabel: formatExpireLabel(expirySource),
      isExpired: isExpiredByDateValue(expirySource),
    };
  });

  const voucherItems = vouchers.map((voucher) => {
    const expirySource = voucher.expiresAt || voucher.expire;
    return {
      ...voucher,
      expireLabel: formatExpireLabel(expirySource),
      isExpired: isExpiredByDateValue(expirySource),
    };
  });

  return (
    <div className="admin-offers-layout">
      <section className="admin-offers-block">
        <div className="admin-tab-topbar">
          <span className="admin-count-badge">{promotions.length} chương trình khuyến mãi</span>
        </div>

        <form className="admin-offer-form" onSubmit={onSubmitPromotion}>
          <input
            type="text"
            placeholder="Nhãn (VD: Hot deal)"
            value={promotionDraft.badge}
            onChange={(e) => onPromotionDraftChange('badge', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Tiêu đề chương trình"
            value={promotionDraft.title}
            onChange={(e) => onPromotionDraftChange('title', e.target.value)}
            required
          />
          <input
            type="date"
            value={promotionDraft.expiresAt}
            onChange={(e) => onPromotionDraftChange('expiresAt', e.target.value)}
            required
          />
          <textarea
            rows="2"
            placeholder="Mô tả chương trình"
            value={promotionDraft.description}
            onChange={(e) => onPromotionDraftChange('description', e.target.value)}
            required
          />
          <button type="submit" className="admin-action-btn admin-action-save">
            {editingPromotionId ? 'Lưu chương trình' : 'Thêm chương trình'}
          </button>
          {editingPromotionId && (
            <button type="button" className="admin-action-btn admin-action-cancel" onClick={onCancelPromotionEdit}>
              Hủy
            </button>
          )}
        </form>

        <div className="offers-grid admin-offers-grid">
          {promotionItems.map((offer) => (
            <article key={offer.id} className={`offer-card admin-offer-card${offer.isExpired ? ' is-expired' : ''}`}>
              <div className="offer-top">
                <span className="offer-badge">{offer.badge}</span>
                <span className="offer-expire">{offer.expireLabel}</span>
              </div>
              {offer.isExpired ? <span className="admin-expired-pill">Hết hạn</span> : null}
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <div className="admin-row-actions">
                <button type="button" className="admin-action-btn admin-action-edit" onClick={() => onEditPromotion(offer)}>
                  Sửa
                </button>
                <button type="button" className="admin-action-btn admin-action-delete" onClick={() => onDeletePromotion(offer)}>
                  {offer.isExpired ? 'Xóa hết hạn' : 'Xóa'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-offers-block">
        <div className="admin-tab-topbar">
          <span className="admin-count-badge">{vouchers.length} voucher</span>
        </div>

        <form className="admin-offer-form" onSubmit={onSubmitVoucher}>
          <input
            type="text"
            placeholder="Mã voucher (VD: SUNNY10)"
            value={voucherDraft.code}
            onChange={(e) => onVoucherDraftChange('code', e.target.value.toUpperCase())}
            required
          />
          <input
            type="text"
            placeholder="Mức giảm (VD: Giảm 10%)"
            value={voucherDraft.discount}
            onChange={(e) => onVoucherDraftChange('discount', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Điều kiện áp dụng"
            value={voucherDraft.rule}
            onChange={(e) => onVoucherDraftChange('rule', e.target.value)}
            required
          />
          <input
            type="date"
            value={voucherDraft.expiresAt}
            onChange={(e) => onVoucherDraftChange('expiresAt', e.target.value)}
            required
          />
          <button type="submit" className="admin-action-btn admin-action-save">
            {editingVoucherId ? 'Lưu voucher' : 'Thêm voucher'}
          </button>
          {editingVoucherId && (
            <button type="button" className="admin-action-btn admin-action-cancel" onClick={onCancelVoucherEdit}>
              Hủy
            </button>
          )}
        </form>

        <div className="voucher-grid admin-voucher-grid">
          {voucherItems.map((voucher) => (
            <article key={voucher.id} className={`voucher-card admin-voucher-card${voucher.isExpired ? ' is-expired' : ''}`}>
              <h3>{voucher.code}</h3>
              <p className="voucher-discount">{voucher.discount}</p>
              <p>{voucher.rule}</p>
              <p className="offer-expire">{voucher.expireLabel}</p>
              {voucher.isExpired ? <span className="admin-expired-pill">Hết hạn</span> : null}
              <div className="admin-row-actions">
                <button type="button" className="admin-action-btn admin-action-edit" onClick={() => onEditVoucher(voucher)}>
                  Sửa
                </button>
                <button type="button" className="admin-action-btn admin-action-delete" onClick={() => onDeleteVoucher(voucher)}>
                  {voucher.isExpired ? 'Xóa hết hạn' : 'Xóa'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const NAV_TABS = ['dashboard', 'products', 'inventory', 'offers', 'orders', 'customers'];

function Admin({
  adminAuth,
  onAdminLogout,
  products,
  onSetProducts,
  customers,
  onSetCustomers,
  orders,
  onSetOrders,
  onDeleteOrder,
  promotions,
  onSetPromotions,
  vouchers,
  onSetVouchers,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingPromotionId, setEditingPromotionId] = useState(null);
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [productDraft, setProductDraft] = useState({
    name: '',
    description: '',
    category: PRODUCT_CATEGORY_OPTIONS[0],
    priceInput: '',
    size: PRODUCT_SIZE_OPTIONS[0],
    stock: PRODUCT_STOCK_OPTIONS[0],
    quantity: '',
    image: '',
  });
  const [promotionDraft, setPromotionDraft] = useState({
    badge: '',
    title: '',
    expiresAt: '',
    description: '',
  });
  const [voucherDraft, setVoucherDraft] = useState({
    code: '',
    discount: '',
    rule: '',
    expiresAt: '',
  });

  const resetDraft = () => {
    setEditingId(null);
    setProductDraft({
      name: '',
      description: '',
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

  const handlePromotionDraftChange = (field, value) => {
    setPromotionDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleVoucherDraftChange = (field, value) => {
    setVoucherDraft((prev) => ({ ...prev, [field]: value }));
  };

  const resetPromotionDraft = () => {
    setEditingPromotionId(null);
    setPromotionDraft({
      badge: '',
      title: '',
      expiresAt: '',
      description: '',
    });
  };

  const resetVoucherDraft = () => {
    setEditingVoucherId(null);
    setVoucherDraft({
      code: '',
      discount: '',
      rule: '',
      expiresAt: '',
    });
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
      description: productDraft.description.trim(),
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
      description: product.description || '',
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

  const handleDeleteCustomer = (customer) => {
    const customerLabel = customer?.name ? `${customer.name} (${customer.email})` : customer?.email || 'tài khoản này';
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản ${customerLabel} không?`);

    if (!confirmed) {
      return;
    }

    onSetCustomers((prev) => prev.filter((item) => item.id !== customer.id));
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    const order = orders.find((item) => item.id === orderId);
    const shouldDeductInventory =
      Boolean(order) &&
      !order.inventoryDeducted &&
      nextStatus === 'Đã giao' &&
      order.status !== 'Đã huỷ';

    if (nextStatus === 'Đã huỷ') {
      const orderLabel = order ? `${order.id} - ${order.customer}` : 'đơn hàng này';
      const confirmed = window.confirm(
        `Bạn có chắc muốn hủy ${orderLabel} không?\nHành động này sẽ chuyển đơn hàng sang trạng thái đã hủy.`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (shouldDeductInventory) {
      const orderedItems = getOrderItems(order);

      onSetProducts((prev) =>
        prev.map((product) => {
          const matchedOrderItem = orderedItems.find((item) => item.name === product.name);

          if (!matchedOrderItem) {
            return product;
          }

          const nextQuantity = Math.max(0, Number(product.quantity || 0) - Number(matchedOrderItem.quantity || 0));

          return {
            ...product,
            quantity: nextQuantity,
            stockLabel: getStockLabelByQuantity(nextQuantity),
          };
        }),
      );
    }

    onSetOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
              inventoryDeducted: shouldDeductInventory ? true : order.inventoryDeducted,
            }
          : order,
      ),
    );
  };

  const handleSubmitPromotion = (e) => {
    e.preventDefault();

    if (!promotionDraft.title.trim() || !promotionDraft.description.trim() || !promotionDraft.expiresAt) {
      return;
    }

    const nextPromotion = {
      id: editingPromotionId || `PRM-${Date.now()}`,
      badge: promotionDraft.badge.trim(),
      title: promotionDraft.title.trim(),
      expiresAt: promotionDraft.expiresAt,
      expire: formatExpireLabel(promotionDraft.expiresAt),
      description: promotionDraft.description.trim(),
    };

    if (editingPromotionId) {
      onSetPromotions((prev) => prev.map((item) => (item.id === editingPromotionId ? nextPromotion : item)));
      resetPromotionDraft();
      return;
    }

    onSetPromotions((prev) => [nextPromotion, ...prev]);
    resetPromotionDraft();
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotionId(promotion.id);
    setPromotionDraft({
      badge: promotion.badge,
      title: promotion.title,
      expiresAt: toInputDateValue(promotion.expiresAt || promotion.expire),
      description: promotion.description,
    });
  };

  const handleDeletePromotion = (promotion) => {
    const target = typeof promotion === 'object' ? promotion : promotions.find((item) => item.id === promotion);
    const promotionId = target?.id || promotion;
    const expired = isExpiredByDateValue(target?.expiresAt || target?.expire);
    const confirmMessage = expired
      ? 'Chương trình này đã hết hạn. Bạn có chắc muốn xóa khỏi admin không?'
      : 'Bạn có chắc muốn xóa chương trình ưu đãi này không?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    onSetPromotions((prev) => prev.filter((item) => item.id !== promotionId));
    if (editingPromotionId === promotionId) {
      resetPromotionDraft();
    }
  };

  const handleSubmitVoucher = (e) => {
    e.preventDefault();

    if (!voucherDraft.code.trim() || !voucherDraft.discount.trim() || !voucherDraft.rule.trim() || !voucherDraft.expiresAt) {
      return;
    }

    const nextVoucher = {
      id: editingVoucherId || `VCR-${Date.now()}`,
      code: voucherDraft.code.trim().toUpperCase(),
      discount: voucherDraft.discount.trim(),
      rule: voucherDraft.rule.trim(),
      expiresAt: voucherDraft.expiresAt,
      expire: formatExpireLabel(voucherDraft.expiresAt),
    };

    if (editingVoucherId) {
      onSetVouchers((prev) => prev.map((item) => (item.id === editingVoucherId ? nextVoucher : item)));
      resetVoucherDraft();
      return;
    }

    onSetVouchers((prev) => [nextVoucher, ...prev]);
    resetVoucherDraft();
  };

  const handleEditVoucher = (voucher) => {
    setEditingVoucherId(voucher.id);
    setVoucherDraft({
      code: voucher.code,
      discount: voucher.discount,
      rule: voucher.rule,
      expiresAt: toInputDateValue(voucher.expiresAt || voucher.expire),
    });
  };

  const handleDeleteVoucher = (voucher) => {
    const target = typeof voucher === 'object' ? voucher : vouchers.find((item) => item.id === voucher);
    const voucherId = target?.id || voucher;
    const expired = isExpiredByDateValue(target?.expiresAt || target?.expire);
    const confirmMessage = expired
      ? 'Voucher này đã hết hạn. Bạn có chắc muốn xóa khỏi admin không?'
      : 'Bạn có chắc muốn xóa voucher này không?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    onSetVouchers((prev) => prev.filter((item) => item.id !== voucherId));
    if (editingVoucherId === voucherId) {
      resetVoucherDraft();
    }
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
          {activeTab === 'inventory' && <AdminInventory products={products} />}
          {activeTab === 'offers' && (
            <OffersTab
              promotions={promotions}
              vouchers={vouchers}
              promotionDraft={promotionDraft}
              voucherDraft={voucherDraft}
              editingPromotionId={editingPromotionId}
              editingVoucherId={editingVoucherId}
              onPromotionDraftChange={handlePromotionDraftChange}
              onVoucherDraftChange={handleVoucherDraftChange}
              onSubmitPromotion={handleSubmitPromotion}
              onSubmitVoucher={handleSubmitVoucher}
              onEditPromotion={handleEditPromotion}
              onEditVoucher={handleEditVoucher}
              onDeletePromotion={handleDeletePromotion}
              onDeleteVoucher={handleDeleteVoucher}
              onCancelPromotionEdit={resetPromotionDraft}
              onCancelVoucherEdit={resetVoucherDraft}
            />
          )}
          {activeTab === 'orders' && <OrdersTab orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} onDeleteOrder={onDeleteOrder} />}
          {activeTab === 'customers' && <CustomersTab customers={customers} onDeleteCustomer={handleDeleteCustomer} />}
        </main>

        {(activeTab === 'products' || activeTab === 'inventory') ? <ScrollTopButton /> : null}
      </div>
    </div>
  );
}

export default Admin;
