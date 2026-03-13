function CartIconButton({ count, onClick, isActive = false }) {
  return (
    <button
      type="button"
      className={`cart-icon-button ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      title="Giỏ hàng"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 4h2l1.4 7.2a2 2 0 0 0 2 1.6H17a2 2 0 0 0 2-1.5l1.2-5.3H7.1" />
        <circle cx="10" cy="18.5" r="1.7" />
        <circle cx="17" cy="18.5" r="1.7" />
      </svg>
      <span key={count} className="cart-icon-badge cart-icon-badge-animated">
        {count}
      </span>
    </button>
  );
}

export default CartIconButton;
