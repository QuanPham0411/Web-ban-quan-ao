import CartIconButton from './components/CartIconButton';

const formatPrice = (value) => `${value.toLocaleString('vi-VN')}đ`;

function Cart({
  authState,
  cartItems,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onGoCheckout,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoOrders,
  onGoCart,
  onGoLogin,
  onGoRegister,
}) {
  const totalPrice = cartItems.reduce((total, item) => total + item.priceNumber * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="cart-page">
      <header className="top-header cart-header">
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
          <button type="button" className="catalog-nav-button" onClick={onGoOrders}>
            Đơn hàng
          </button>
          <CartIconButton count={totalItems} onClick={onGoCart} isActive />
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

      <section className="cart-hero">
        <span className="hero-badge">Giỏ hàng của bạn</span>
        <h1>Kiểm tra sản phẩm trước khi thanh toán</h1>
        <p>
          {authState.isLoggedIn
            ? 'Bạn có thể tăng giảm số lượng hoặc xóa sản phẩm trực tiếp tại đây.'
            : 'Bạn chưa đăng nhập nên chỉ xem được sản phẩm. Vui lòng đăng nhập để thêm và mua hàng.'}
        </p>
      </section>

      {!authState.isLoggedIn ? (
        <section className="cart-empty-state">
          <h2>Bạn chưa đăng nhập</h2>
          <p>Hãy đăng nhập để thêm sản phẩm vào giỏ và tiếp tục đặt hàng.</p>
          <button type="button" className="btn-primary" onClick={onGoLogin}>
            Đi tới đăng nhập
          </button>
        </section>
      ) : cartItems.length === 0 ? (
        <section className="cart-empty-state">
          <h2>Giỏ hàng đang trống</h2>
          <p>Chọn sản phẩm bạn thích ở trang sản phẩm và thêm vào giỏ ngay.</p>
          <button type="button" className="btn-primary" onClick={onGoProducts}>
            Đi tới trang sản phẩm
          </button>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-list">
            {cartItems.map((item) => (
              <article key={item.id} className="cart-item-card">
                <img className="cart-item-image" src={item.image} alt={item.name} />

                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>{item.categoryLabel}</p>
                  <p>{item.size}</p>
                  <strong>{item.priceText}</strong>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-quantity">
                    <button type="button" onClick={() => onUpdateCartQuantity(item.id, Math.max(1, item.quantity - 1))}>
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          onUpdateCartQuantity(item.id, val);
                        }
                      }}
                      style={{ width: '40px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                    />
                    <button type="button" onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => onRemoveFromCart(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary-box">
            <h3>Tóm tắt đơn hàng</h3>
            <p>
              <span>Tổng sản phẩm</span>
              <strong>{totalItems}</strong>
            </p>
            <p>
              <span>Tạm tính</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </p>
            <button type="button" className="btn-register" onClick={onGoProducts}>
              Tiếp tục mua sắm
            </button>
            <button type="button" className="btn-primary" onClick={onGoCheckout}>
              Thanh toán
            </button>
          </aside>
        </section>
      )}
    </div>
  );
}

export default Cart;
