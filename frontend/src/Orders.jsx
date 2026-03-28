import CartIconButton from './components/CartIconButton';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim().toLowerCase();

const STATUS_CLASS = {
  'Chờ xác nhận': 'order-status-pending',
  'Đã xác nhận': 'order-status-confirmed',
  'Đang giao': 'order-status-shipping',
  'Đã giao': 'order-status-delivered',
  'Đã huỷ': 'order-status-cancelled',
};

const getPaymentLabel = (method) => (method === 'bank' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)');

function Orders({
  authState,
  orders,
  onCancelOrder,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoOrders,
  onGoCart,
  onGoLogin,
  onGoRegister,
  cartCount,
}) {
  const currentEmail = normalizeEmail(authState.email);
  const currentLabel = normalizeText(authState.accountLabel);
  const customerOrders = orders
    .filter((order) => {
      const orderEmail = normalizeEmail(order.customerEmail);

      if (currentEmail && orderEmail) {
        return orderEmail === currentEmail;
      }

      // Backward compatibility: old orders created before customerEmail was added.
      const orderCustomer = normalizeText(order.customer);
      const orderFullName = normalizeText(order.fullName);
      return Boolean(currentLabel) && (orderCustomer === currentLabel || orderFullName === currentLabel);
    })
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const canCancelOrder = (status) => !['Đã giao', 'Đã huỷ'].includes(status);

  const handleCancelOrder = (order) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đơn ${order.id} không?\nSau khi hủy, admin sẽ nhận được cập nhật và có thể xóa đơn này.`,
    );

    if (!confirmed) {
      return;
    }

    onCancelOrder(order.id);
  };

  return (
    <div className="orders-page">
      <header className="top-header offers-header">
        <button type="button" className="brand-button" onClick={onGoHome}>
          <div className="brand">SunnyWear</div>
        </button>

        <nav className="catalog-nav">
          <button type="button" className="catalog-nav-button" onClick={onGoHome}>
            Trang chủ
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoProducts}>
            Sản phẩm
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOffers}>
            Ưu Đãi
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoUsers}>
            Users
          </button>
          <button type="button" className="catalog-nav-button is-active" onClick={onGoOrders}>
            Đơn hàng
          </button>
          <CartIconButton count={cartCount} onClick={onGoCart} />
        </nav>

        <div className="auth-actions">
          {authState.isLoggedIn ? (
            <>
              <span className="auth-status">Xin chào, {authState.accountLabel}</span>
              <button className="btn-outline" onClick={onLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={onGoLogin}>
                Đăng nhập
              </button>
              <button className="btn-register" onClick={onGoRegister}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </header>

      <section className="orders-hero">
        <span className="hero-badge">Theo dõi đơn hàng</span>
        <h1>Đơn hàng của bạn</h1>
        <p>Xem trạng thái xử lý, thông tin giao hàng và chi tiết ưu đãi đã áp dụng cho từng đơn.</p>
      </section>

      {!authState.isLoggedIn ? (
        <section className="orders-empty-state">
          <h2>Bạn chưa đăng nhập</h2>
          <p>Vui lòng đăng nhập để theo dõi đơn hàng đã đặt.</p>
          <button type="button" className="btn-primary" onClick={onGoLogin}>
            Đi tới đăng nhập
          </button>
        </section>
      ) : customerOrders.length === 0 ? (
        <section className="orders-empty-state">
          <h2>Chưa có đơn hàng nào</h2>
          <p>Bạn chưa đặt đơn nào. Mua sắm ngay để tạo đơn đầu tiên.</p>
          <button type="button" className="btn-primary" onClick={onGoProducts}>
            Đi tới trang sản phẩm
          </button>
        </section>
      ) : (
        <section className="orders-list">
          {customerOrders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <h3>{order.id}</h3>
                  <p>Ngày đặt: {order.date}</p>
                </div>
                <span className={`order-status-badge ${STATUS_CLASS[order.status] || 'order-status-pending'}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-card-grid">
                <p>
                  <span>Sản phẩm</span>
                  <strong>{order.product}</strong>
                </p>
                <p>
                  <span>Tổng thanh toán</span>
                  <strong>{order.amount}</strong>
                </p>
                <p>
                  <span>Phương thức</span>
                  <strong>{getPaymentLabel(order.paymentMethod)}</strong>
                </p>
                <p>
                  <span>Số điện thoại</span>
                  <strong>{order.phone || 'Chưa có'}</strong>
                </p>
              </div>

              <div className="order-card-meta">
                <p>
                  <span>Địa chỉ giao hàng:</span> {order.address || 'Chưa có'}
                </p>
                <p>
                  <span>Khuyến mãi tự động:</span> {order.promotionTitle || 'Không có'}
                </p>
                <p>
                  <span>Voucher:</span> {order.voucherCode || 'Không áp dụng'}
                </p>
                <p>
                  <span>Ghi chú:</span> {order.note || 'Không có'}
                </p>
              </div>

              {canCancelOrder(order.status) ? (
                <div className="order-card-actions">
                  <button type="button" className="order-cancel-btn" onClick={() => handleCancelOrder(order)}>
                    Hủy đơn
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Orders;
