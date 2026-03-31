const ProductCard = ({ product, canAddToCart, onAddToCart, onViewDetail }) => {
  const { name, priceText, image, categoryLabel, stockLabel } = product;

  return (
    <article className="product-card">
      <div className="product-image-container" onClick={onViewDetail}>
        <img className="product-image" src={image} alt={name} loading="lazy" />
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
