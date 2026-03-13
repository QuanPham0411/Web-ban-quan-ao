import { useState } from 'react';
import CartIconButton from './components/CartIconButton';
import { categoryConfigs, filterProductsBySearch } from './catalog';

function Products({
  authState,
  onLogout,
  onGoHome,
  onGoOffers,
  onGoUsers,
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
          <span className="hero-badge">Danh mục đầy đủ của shop</span>
          <h1>Trang Sản Phẩm SunnyWear</h1>
          <p>
            Tổng hợp khoảng 200 mặt hàng cho phụ nữ, đàn ông, trẻ em và đồ lót/mặc nhà.
            Bạn có thể lọc nhanh theo từng nhóm để xem đầy đủ món shop đang bán.
          </p>
        </div>
        <div className="catalog-hero-stats">
          <div className="catalog-stat-card">
            <strong>200+</strong>
            <span>Sản phẩm</span>
          </div>
          <div className="catalog-stat-card">
            <strong>4</strong>
            <span>Nhóm hàng chính</span>
          </div>
          <div className="catalog-stat-card">
            <strong>New</strong>
            <span>Cập nhật theo mùa</span>
          </div>
        </div>
      </section>

      <section className="catalog-summary">
        {categoryConfigs.map((category) => (
          <article key={category.key} className="catalog-summary-card">
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <span>{category.count} sản phẩm</span>
          </article>
        ))}
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
          <p className="catalog-result">Hiển thị {filteredProducts.length} / {products.length} sản phẩm</p>
        </div>
        <div className="catalog-search-wrap">
          <span className="catalog-search-icon">&#128269;</span>
          <input
            type="text"
            className="catalog-search-input"
            placeholder="Tìm kiếm sản phẩm..."
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
          <article key={product.id} className="catalog-card">
            <div className="catalog-image-wrap">
              <img className="catalog-image" src={product.image} alt={product.name} loading="lazy" />
            </div>
            <div className="catalog-card-content">
              <div className="catalog-card-top">
                <span className="catalog-category">{product.categoryLabel}</span>
                <span className="catalog-stock">{product.stockLabel}</span>
              </div>
              <h3 className="catalog-name">
                <button
                  type="button"
                  className="catalog-name-button"
                  onClick={() =>
                    onGoProductDetail({
                      id: product.id,
                      name: product.name,
                      priceNumber: Number(product.price.replace(/\./g, '')),
                      priceText: `${product.price}đ`,
                      image: product.image,
                      size: product.size,
                      stockLabel: product.stockLabel,
                      categoryLabel: product.categoryLabel,
                      description: product.description,
                    })
                  }
                >
                  {product.name}
                </button>
              </h3>
              <p className="catalog-desc">{product.description}</p>
              <div className="catalog-price-row">
                <span className="catalog-price">{product.price}đ</span>
                <span className="catalog-size">{product.size}</span>
              </div>
              <button
                className="catalog-button"
                disabled={!authState.isLoggedIn}
                onClick={() =>
                  onAddToCart({
                    id: product.id,
                    name: product.name,
                    priceNumber: Number(product.price.replace(/\./g, '')),
                    priceText: `${product.price}đ`,
                    image: product.image,
                    size: product.size,
                    stockLabel: product.stockLabel,
                    categoryLabel: product.categoryLabel,
                    description: product.description,
                  })
                }
              >
                {authState.isLoggedIn ? 'Thêm vào giỏ' : 'Chỉ xem - cần đăng nhập'}
              </button>
            </div>
          </article>
        ))}
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

export default Products;
