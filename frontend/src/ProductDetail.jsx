import { useState } from 'react';
import ProductCard from './components/ProductCard';
import CartIconButton from './components/CartIconButton';

const getSizeOptions = (sizeTag) => {
  if (!sizeTag || sizeTag.toLowerCase().includes('free size')) return null;
  if (sizeTag.includes('S - XL')) return ['S', 'M', 'L', 'XL'];
  if (sizeTag.includes('M - 2XL')) return ['M', 'L', 'XL', '2XL'];
  if (sizeTag.includes('90 - 140')) return ['90', '100', '110', '120', '130', '140'];
  if (sizeTag.includes('tiêu chuẩn')) return ['S', 'M', 'L'];
  return null;
};

function ProductDetail({
  authState,
  product,
  currentProductId,
  cartCount,
  onAddToCart,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoCart,
  onGoCheckout,
  onGoProductDetail,
  onGoLogin,
  onGoRegister,
  products = [],
}) {
  const [sizeSelection, setSizeSelection] = useState({ productId: null, size: null });
  const [quantity, setQuantity] = useState(1);

  // Filter 4 products from same category, excluding current
  const relatedProducts = products
    .filter((p) => p.categoryKey === product?.categoryKey && p.id !== product?.id)
    .slice(0, 4);

  const isMatchedProduct = product && product.id === currentProductId;
  const sizeOptions = isMatchedProduct ? getSizeOptions(product.size) : null;
  const selectedSize = sizeSelection.productId === product?.id ? sizeSelection.size : null;

  const handleSelectSize = (size) => {
    setSizeSelection({ productId: product.id, size });
  };

  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setQuantity(num);
    } else if (val === '') {
      setQuantity('');
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === '' || quantity < 1) {
      setQuantity(1);
    }
  };

  if (!isMatchedProduct) {
    return (
      <div className="product-detail-page">
        <header className="top-header product-detail-header">
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
            <CartIconButton count={cartCount} onClick={onGoCart} />
          </nav>
        </header>

        <section className="product-detail-missing">
          <h1>Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm này không còn dữ liệu. Bạn quay lại trang sản phẩm để chọn lại nhé.</p>
          <button type="button" className="btn-primary" onClick={onGoProducts}>
            Quay lại trang sản phẩm
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <header className="top-header product-detail-header">
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

      <section className="product-detail-card">
        <div className="product-detail-image-wrap">
          <img src={product.image} alt={product.name} className="product-detail-image" />
        </div>

        <div className="product-detail-info">
          <span className="hero-badge">{product.categoryLabel}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>

          <div className="product-detail-meta">
            <span className="catalog-stock">{product.stockLabel}</span>
            {!sizeOptions && <span className="catalog-size">{product.size}</span>}
          </div>

          {sizeOptions && (
            <div className="size-picker">
              <span className="size-picker-label">Chọn size:</span>
              <div className="size-picker-options">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-btn${selectedSize === size ? ' is-selected' : ''}`}
                    onClick={() => handleSelectSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="size-picker-hint">Vui lòng chọn size trước khi thêm vào giỏ.</p>
              )}
            </div>
          )}

          <div className="quantity-picker" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="picker-label" style={{ fontWeight: '700' }}>Số lượng:</span>
            <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="quantity-btn"
                style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                onClick={() => setQuantity(Math.max(1, (parseInt(quantity) || 1) - 1))}
              >
                -
              </button>
              <input
                type="number"
                className="quantity-input"
                style={{ width: '60px', height: '32px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleQuantityBlur}
                min="1"
              />
              <button
                type="button"
                className="quantity-btn"
                style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                onClick={() => setQuantity((parseInt(quantity) || 0) + 1)}
              >
                +
              </button>
            </div>
          </div>

          <p className="product-detail-price">{product.priceText}</p>

          <div className="product-detail-actions">
            <button type="button" className="btn-outline" onClick={onGoProducts}>
              Quay lại danh sách
            </button>
            <button
              type="button"
              className="catalog-button"
              disabled={!authState.isLoggedIn || (sizeOptions !== null && !selectedSize)}
              onClick={() => onAddToCart({ ...product, selectedSize: selectedSize ?? null, customQuantity: parseInt(quantity) || 1 })}
            >
              {!authState.isLoggedIn
                ? 'Chỉ xem - cần đăng nhập'
                : sizeOptions && !selectedSize
                ? 'Chọn size để thêm vào giỏ'
                : 'Thêm vào giỏ'}
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ marginLeft: '12px' }}
              disabled={!authState.isLoggedIn || (sizeOptions !== null && !selectedSize)}
              onClick={() => {
                onAddToCart({ ...product, selectedSize: selectedSize ?? null, customQuantity: parseInt(quantity) || 1 });
                if (typeof onGoCheckout === 'function') onGoCheckout();
              }}
            >
              Thanh toán
            </button>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section" style={{ marginTop: '40px' }}>
          <div className="section-heading">
            <h2>Sản phẩm tương tự</h2>
            <p>Có thể bạn cũng sẽ thích những mẫu này</p>
          </div>
          <div className="products-grid" style={{ marginTop: '20px' }}>
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                canAddToCart={authState.isLoggedIn}
                onAddToCart={onAddToCart}
                onViewDetail={() => {
                  onGoProductDetail(p);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
