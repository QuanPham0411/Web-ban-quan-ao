const ProductCard = ({ name, price, image, canAddToCart, onAddToCart }) => {
  return (
    <article className="product-card">
      <div className="product-image-frame">
        <img className="product-image" src={image} alt={name} />
      </div>
      <h3 className="product-name">{name}</h3>
      <p className="product-price">{price}đ</p>
      <button className="product-button" disabled={!canAddToCart} onClick={onAddToCart}>
        {canAddToCart ? 'Thêm vào giỏ hàng' : 'Đăng nhập để thêm giỏ'}
      </button>
    </article>
  );
};

export default ProductCard;
