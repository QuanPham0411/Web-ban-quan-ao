import ProductCard from './components/ProductCard';
import CartIconButton from './components/CartIconButton';

const products = [
  {
    id: 1,
    name: 'Áo thun basic pastel',
    price: '249.000',
    image:
      'https://product.hstatic.net/1000184601/product/men_xanh-infinity__2__7b3f5224f5af4e8b987af577c50c35cd_2048x2048.jpg',
  },
  {
    id: 2,
    name: 'Quần jean ống suông',
    price: '429.000',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Jumpsuit',
    price: '399.000',
    image:
      'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'Áo sơ mi linen',
    price: '359.000',
    image:
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80',
  },
];

function Home({
  authState,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoCart,
  onGoLogin,
  onGoRegister,
  onAddToCart,
  cartCount,
}) {
  const handleAddFeaturedToCart = (product) => {
    if (!authState.isLoggedIn) {
      return;
    }

    onAddToCart({
      id: `home-${product.id}`,
      name: product.name,
      priceNumber: Number(product.price.replace(/\./g, '')),
      priceText: `${product.price}đ`,
      image: product.image,
      size: 'Size tiêu chuẩn',
      stockLabel: 'Mới lên kệ',
      categoryLabel: 'Nổi bật',
      description: 'Sản phẩm nổi bật tại SunnyWear với thiết kế trẻ trung.',
    });
  };

  return (
    <div className="home-page">
      <header className="top-header">
        <div className="brand">SunnyWear</div>
        <nav className="nav-menu">
          <button type="button" onClick={onGoHome}>
            Trang chủ
          </button>
          <button type="button" onClick={onGoProducts}>
            Sản phẩm
          </button>
          <button type="button" onClick={onGoOffers}>
            Ưu Đãi
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
          <span className="hero-badge">Bộ sưu tập mới 2026</span>
          <h1>Diện đẹp mỗi ngày với phong cách trẻ trung</h1>
          <p>
            Chọn ngay các mẫu quần áo tươi sáng, hiện đại, giá tốt cho cả nam và nữ.
            Miễn phí giao hàng cho đơn từ 499.000đ.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={onGoProducts}>
              Mua ngay
            </button>
            <a className="btn-secondary" href="#san-pham">
              Xem nổi bật
            </a>
          </div>
        </div>
        <div className="hero-banner" aria-hidden="true">
          ✨ SALE UP TO 40%
        </div>
      </section>

      <section id="uu-dai" className="offers-section">
        <div className="section-heading">
          <h2>Ưu Đãi</h2>
          <p>Quyền lợi dành cho người mua tại SunnyWear</p>
        </div>
        <div className="highlights">
          <article className="highlight-item">
            <h3>Freeship toàn quốc</h3>
            <p>Áp dụng cho đơn hàng từ 499.000đ</p>
          </article>
          <article className="highlight-item">
            <h3>Đổi trả 7 ngày</h3>
            <p>Hỗ trợ đổi size nhanh chóng</p>
          </article>
          <article className="highlight-item">
            <h3>Ưu đãi thành viên</h3>
            <p>Tích điểm mỗi đơn hàng khi đăng nhập</p>
          </article>
        </div>
      </section>

      <section id="san-pham" className="products-section">
        <div className="section-heading">
          <h2>Sản phẩm nổi bật</h2>
          <p>Những thiết kế được yêu thích nhất tuần này</p>
        </div>
        <div className="products-section-action">
          <button type="button" className="btn-outline" onClick={onGoProducts}>
            Xem tất cả sản phẩm
          </button>
        </div>
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              canAddToCart={authState.isLoggedIn}
              onAddToCart={() => handleAddFeaturedToCart(product)}
            />
          ))}
        </div>
      </section>

      <section id="lien-he" className="subscribe-section">
        <h3>Nhận mã giảm giá 10%</h3>
        <p>Đăng ký email để nhận ưu đãi và bộ sưu tập mới sớm nhất.</p>
        <form className="subscribe-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Nhập email của bạn" required />
          <button type="submit">Đăng ký</button>
        </form>
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

export default Home;
