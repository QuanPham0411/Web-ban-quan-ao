import ProductCard from './components/ProductCard';
import CartIconButton from './components/CartIconButton';

function Home({
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
  onAddToCart,
  cartCount,
  onGoProductDetail,
  products = [],
}) {
  // Pick 4 featured products (e.g., from different categories)
  const featuredProducts = products.length > 0 
    ? [products[0], products[50], products[100], products[150]].filter(Boolean)
    : [];

  return (
    <div className="home-page">
      <header className="top-header">
        <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>SunnyWear</div>
        <nav className="nav-menu">
          <button type="button" className="is-active" onClick={onGoHome}>
            Trang chủ
          </button>
          <button type="button" onClick={onGoProducts}>
            Sản phẩm
          </button>
          <button type="button" onClick={onGoOffers}>
            Ưu Đãi
          </button>
          <button type="button" className="nav-users-pill" onClick={onGoUsers}>
            Users
          </button>
          <button type="button" onClick={onGoOrders}>
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

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Bộ sưu tập 2026</span>
          <h1>Nâng tầm phong cách cùng SunnyWear</h1>
          <p>
            Khám phá những thiết kế hiện đại, trẻ trung và đầy màu sắc. 
            Mỗi bộ trang phục là một câu chuyện về sự tự tin và phong cách cá nhân.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={onGoProducts}>
              Khám phá ngay
            </button>
            <a className="btn-secondary" href="#featured-section">
              Xem nổi bật
            </a>
          </div>
        </div>
        <div className="hero-banner" aria-hidden="true">
          ✨ GIẢM ĐẾN 40%
        </div>
      </section>

      <section className="offers-section">
        <div className="section-heading">
          <h2>Quyền lợi mua sắm</h2>
          <p>Tại sao bạn nên chọn SunnyWear?</p>
        </div>
        <div className="highlights">
          <article className="highlight-item">
            <h3>Miễn phí vận chuyển</h3>
            <p>Hóa đơn từ 499k - Giao hàng cực nhanh</p>
          </article>
          <article className="highlight-item">
            <h3>Đổi trả dễ dàng</h3>
            <p>7 ngày đổi trả nếu không vừa ý</p>
          </article>
          <article className="highlight-item">
            <h3>Ưu đãi Vip</h3>
            <p>Tích điểm đổi quà cho khách hàng thân thiết</p>
          </article>
        </div>
      </section>

      <section id="featured-section" className="products-section">
        <div className="section-heading">
          <h2>Sản phẩm nổi bật</h2>
          <p>Gợi ý xu hướng thời trang mới nhất hôm nay</p>
        </div>
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              canAddToCart={authState.isLoggedIn}
              onAddToCart={onAddToCart}
              onViewDetail={() => onGoProductDetail(product)}
            />
          ))}
        </div>
        <div className="products-section-footer">
          <button type="button" className="btn-outline" onClick={onGoProducts}>
            Xem tất cả sản phẩm
          </button>
        </div>
      </section>

      <section className="subscribe-section">
        <h3>Tham gia cộng đồng SunnyWear</h3>
        <p>Để lại email để không bỏ lỡ các đợt giảm giá mạnh nhất năm.</p>
        <form className="subscribe-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Email của bạn..." required />
          <button type="submit">Đăng ký nhận tin</button>
        </form>
      </section>

      <footer className="site-footer">
        <div className="footer-branding">
          <h3>SunnyWear Shop</h3>
          <p>Thời trang trẻ trung, hiện đại và nhiều ưu đãi cho mọi khách hàng.</p>
        </div>
        <div className="footer-contact">
          <p><strong>Địa chỉ:</strong> 123 Nguyễn Trãi, Quận 5, TP. HCM</p>
          <p><strong>Hotline:</strong> 1900 6789</p>
          <p><strong>Email:</strong> hi@sunnywear.vn</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
