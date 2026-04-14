const ProductCard = ({ product, canAddToCart, onAddToCart, onViewDetail }) => {
  const { name, priceText, image, categoryLabel, stockLabel } = product;
  const fallbackImage =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="#f4efe7"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#7a6658" font-family="Arial,sans-serif" font-size="28">SunnyWear</text><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#a08f80" font-family="Arial,sans-serif" font-size="16">Không có ảnh</text></svg>',
    );

  return (
    <article className="product-card">
      <div className="product-image-container" onClick={onViewDetail}>
        <img
          className="product-image"
          src={image || fallbackImage}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage;
          }}
        />
        <div className="product-badge-group">
          {stockLabel && <span className="product-badge stock">{stockLabel}</span>}
          {categoryLabel && <span className="product-badge category">{categoryLabel}</span>}
        </div>
        <div className="product-overlay">
          <button className="btn-view" onClick={(e) => { e.stopPropagation(); onViewDetail(); }}>
            Xem chi tiết
          </button>
        </div>
      </div>
      <div className="product-content">
        <h3 className="product-name" onClick={onViewDetail}>{name}</h3>
        <div className="product-info-row">
          <span className="product-price">{priceText}</span>
          <button
            className="add-to-cart-bubble"
            disabled={!canAddToCart}
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            title={canAddToCart ? 'Thêm vào giỏ hàng' : 'Đăng nhập để mua'}
          >
            <span className="cart-plus-icon">+</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
