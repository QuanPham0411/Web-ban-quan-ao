import { useState } from 'react';
import ProductCard from './components/ProductCard';
import CartIconButton from './components/CartIconButton';
import ScrollTopButton from './components/ScrollTopButton';
import { categoryConfigs, filterProductsBySearch } from './catalog';

function Products({
  authState,
  onLogout,
  onGoHome,
  onGoOffers,
  onGoUsers,
  onGoOrders,
  onGoCart,
  onGoLogin,
  onGoRegister,
  onAddToCart,
  onGoProductDetail,
  cartCount,
  products,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryFilterMap = {
    all: ['women', 'men', 'kids', 'intimates'],
    women: ['women', 'intimates'],
    men: ['men'],
    kids: ['kids'],
    intimates: ['intimates'],
  };

  const handleScrollProducts = () => {
    document.getElementById('catalog-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredProducts = filterProductsBySearch(
    products.filter((product) => categoryFilterMap[activeCategory]?.includes(product.categoryKey)),
    searchQuery,
  );

  return (
    <div className="catalog-page">
      <header className="top-header catalog-header">
        <button type="button" className="brand-button" onClick={onGoHome}>
          <div className="brand">SunnyWear</div>
        </button>
        <nav className="catalog-nav">
          <button type="button" className="catalog-nav-button" onClick={onGoHome}>
            Trang chủ
          </button>
          <button
            type="button"
            className="catalog-nav-button is-active"
            onClick={handleScrollProducts}
          >
            Sản phẩm
          </button>
          <button type="button" className="catalog-nav-button" onClick={onGoOffers}>
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

      <section className="catalog-hero">
        <div>
          <span className="hero-badge">Danh mục shop</span>
          <h1>Bộ sưu tập SunnyWear</h1>
          <p>
            Hàng trăm mẫu thời trang mới nhất được cập nhật mỗi ngày.
            Lọc nhanh theo sở thích và phong cách của bạn ngay bên dưới.
          </p>
        </div>
        <div className="catalog-hero-stats">
          <div className="catalog-stat-card">
            <strong>200+</strong>
            <span>Sản phẩm</span>
          </div>
          <div className="catalog-stat-card">
            <strong>4</strong>
            <span>Nhóm hàng</span>
          </div>
          <div className="catalog-stat-card">
            <strong>Hot</strong>
            <span>Trending 2026</span>
          </div>
        </div>
      </section>

      <section className="catalog-toolbar">
        <div className="catalog-toolbar-row">
          <div className="catalog-filter-group">
            <button
              type="button"
              className={`catalog-filter ${activeCategory === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Tất cả
            </button>
            {categoryConfigs.map((category) => (
              <button
                key={category.key}
                type="button"
                className={`catalog-filter ${activeCategory === category.key ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>
          <p className="catalog-result">Hiển thị {filteredProducts.length} món</p>
        </div>
        <div className="catalog-search-wrap">
          <span className="catalog-search-icon">&#128269;</span>
          <input
            type="text"
            className="catalog-search-input"
            placeholder="Bạn đang tìm sản phẩm nào?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="catalog-search-clear" onClick={() => setSearchQuery('')}>
              &#10005;
            </button>
          )}
        </div>
      </section>

      <section id="catalog-products" className="catalog-grid">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            canAddToCart={authState.isLoggedIn}
            onAddToCart={onAddToCart}
            onViewDetail={() => onGoProductDetail(product)}
          />
        ))}
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

      <ScrollTopButton />
    </div>
  );
}

export default Products;
