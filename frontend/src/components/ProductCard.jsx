const ProductCard = ({ name, price, image }) => {
  return (
    <article className="product-card">
      <div className="product-image-frame">
        <img className="product-image" src={image} alt={name} />
      </div>
      <h3 className="product-name">{name}</h3>
      <p className="product-price">{price}đ</p>
      <button className="product-button">
        Thêm vào giỏ hàng
      </button>
    </article>
  );
};

export default ProductCard;