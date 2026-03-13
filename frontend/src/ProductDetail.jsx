import { useState } from 'react';
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
  onGoLogin,
  onGoRegister,
}) {
  const [sizeSelection, setSizeSelection] = useState({ productId: null, size: null });

  const isMatchedProduct = product && product.id === currentProductId;
  const sizeOptions = isMatchedProduct ? getSizeOptions(product.size) : null;
  const selectedSize = sizeSelection.productId === product?.id ? sizeSelection.size : null;

  const handleSelectSize = (size) => {
    setSizeSelection({ productId: product.id, size });
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

          <p className="product-detail-price">{product.priceText}</p>

          <div className="product-detail-actions">
            <button type="button" className="btn-outline" onClick={onGoProducts}>
              Quay lại danh sách
            </button>
            <button
              type="button"
              className="catalog-button"
              disabled={!authState.isLoggedIn || (sizeOptions !== null && !selectedSize)}
              onClick={() => onAddToCart({ ...product, selectedSize: selectedSize ?? null })}
            >
              {!authState.isLoggedIn
                ? 'Chỉ xem - cần đăng nhập'
                : sizeOptions && !selectedSize
                ? 'Chọn size để thêm vào giỏ'
                : 'Thêm vào giỏ'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductDetail;
