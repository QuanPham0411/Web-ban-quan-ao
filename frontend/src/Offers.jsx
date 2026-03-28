import CartIconButton from './components/CartIconButton';

function Offers({
  authState,
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
  promotions,
  vouchers,
}) {
  return (
    <div className="offers-page">
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
          <button type="button" className="catalog-nav-button is-active" onClick={onGoOffers}>
            Ưu Đãi
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoUsers}>
            Users
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOrders}>
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

      <section className="offers-hero">
        <span className="hero-badge">Ưu đãi cập nhật mỗi ngày</span>
        <h1>Trang Ưu Đãi SunnyWear</h1>
        <p>
          Tổng hợp tất cả ưu đãi đang áp dụng tại shop: flash sale, voucher, freeship và
          giảm theo danh mục cho Nữ, Nam, Trẻ em, Đồ lót & mặc nhà.
        </p>
      </section>

      <section className="offers-grid">
        {promotions.length > 0 ? (
          promotions.map((offer) => (
            <article key={offer.id} className="offer-card">
              <div className="offer-top">
                <span className="offer-badge">{offer.badge}</span>
                <span className="offer-expire">{offer.expire}</span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
            </article>
          ))
        ) : (
          <article className="offer-card">
            <h3>Chưa có chương trình ưu đãi</h3>
            <p>Shop chưa thêm khuyến mãi nào. Vui lòng quay lại sau.</p>
          </article>
        )}
      </section>

      <section className="voucher-section">
        <div className="section-heading">
          <h2>Mã giảm giá của shop</h2>
          <p>Nhập mã ở bước thanh toán để áp dụng khuyến mãi.</p>
        </div>

        <div className="voucher-grid">
          {vouchers.length > 0 ? (
            vouchers.map((voucher) => (
              <article key={voucher.id || voucher.code} className="voucher-card">
                <h3>{voucher.code}</h3>
                <p className="voucher-discount">{voucher.discount}</p>
                <p>{voucher.rule}</p>
              </article>
            ))
          ) : (
            <article className="voucher-card">
              <h3>Chưa có voucher</h3>
              <p className="voucher-discount">Hiện chưa có mã áp dụng</p>
              <p>Admin chưa thêm voucher nào cho shop.</p>
            </article>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-branding">
          <h3>SunnyWear Shop</h3>
          <p>Thời trang trẻ trung, hiện đại và nhiều ưu đãi cho mọi khách hàng.</p>
        </div>
        <div className="footer-contact">
          <p>
            <strong>Địa chỉ:</strong> 123 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh
          </p>
          <p>
            <strong>Số điện thoại:</strong> 0909 123 456
          </p>
          <p>
            <strong>Email:</strong> support@sunnywear.vn
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Offers;
