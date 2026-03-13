import CartIconButton from './components/CartIconButton';

const offers = [
  {
    id: 1,
    title: 'Giảm 20% toàn bộ đầm nữ',
    description: 'Áp dụng cho dòng đầm midi, maxi và váy công sở nữ.',
    badge: 'Hot deal',
    expire: 'Hết hạn: 30/03/2026',
  },
  {
    id: 2,
    title: 'Mua 2 áo thun nam tặng 1 quần short',
    description: 'Tự động áp dụng trong giỏ hàng cho nhóm thời trang nam.',
    badge: 'Combo',
    expire: 'Hết hạn: 25/03/2026',
  },
  {
    id: 3,
    title: 'Đồ trẻ em đồng giá từ 129.000đ',
    description: 'Áp dụng cho sản phẩm bé trai, bé gái và set đi học.',
    badge: 'Kids',
    expire: 'Hết hạn: 31/03/2026',
  },
  {
    id: 4,
    title: 'Đồ lót & mặc nhà giảm đến 35%',
    description: 'Áp dụng cho bra cotton, đồ ngủ satin và bộ mặc nhà.',
    badge: 'Intimates',
    expire: 'Hết hạn: 05/04/2026',
  },
  {
    id: 5,
    title: 'Freeship toàn quốc',
    description: 'Đơn hàng từ 399.000đ được miễn phí vận chuyển.',
    badge: 'Freeship',
    expire: 'Áp dụng mỗi ngày',
  },
  {
    id: 6,
    title: 'Tặng 50K cho đơn đầu tiên',
    description: 'Khách hàng mới nhập mã NEW50 để nhận giảm trực tiếp.',
    badge: 'New user',
    expire: 'Hết hạn: 15/04/2026',
  },
  {
    id: 7,
    title: 'Giảm 15% cho thành viên thân thiết',
    description: 'Áp dụng khi tài khoản đạt từ 5 đơn hàng trở lên.',
    badge: 'Member',
    expire: 'Áp dụng hằng tháng',
  },
  {
    id: 8,
    title: 'Flash sale 10h - 12h',
    description: 'Giảm thêm 10% cho các sản phẩm đang có giá ưu đãi.',
    badge: 'Flash',
    expire: 'Mỗi ngày 10:00 - 12:00',
  },
];

const vouchers = [
  { code: 'SUNNY10', discount: 'Giảm 10%', rule: 'Đơn từ 299.000đ' },
  { code: 'WOMEN20', discount: 'Giảm 20%', rule: 'Danh mục Nữ từ 499.000đ' },
  { code: 'MEN15', discount: 'Giảm 15%', rule: 'Danh mục Nam từ 399.000đ' },
  { code: 'KIDS25', discount: 'Giảm 25%', rule: 'Danh mục Trẻ em từ 350.000đ' },
  { code: 'INTI30', discount: 'Giảm 30%', rule: 'Đồ lót & mặc nhà từ 300.000đ' },
  { code: 'VIP50', discount: 'Giảm 50.000đ', rule: 'Cho thành viên VIP' },
];

function Offers({
  authState,
  onLogout,
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoCart,
  onGoLogin,
  onGoRegister,
  cartCount,
}) {
  return (
    <div className="offers-page">
      <header className="top-header offers-header">
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
          <button type="button" className="catalog-nav-button is-active" onClick={onGoOffers}>
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

      <section className="offers-hero">
        <span className="hero-badge">Ưu đãi cập nhật mỗi ngày</span>
        <h1>Trang Ưu Đãi SunnyWear</h1>
        <p>
          Tổng hợp tất cả ưu đãi đang áp dụng tại shop: flash sale, voucher, freeship và
          giảm theo danh mục cho Nữ, Nam, Trẻ em, Đồ lót & mặc nhà.
        </p>
      </section>

      <section className="offers-grid">
        {offers.map((offer) => (
          <article key={offer.id} className="offer-card">
            <div className="offer-top">
              <span className="offer-badge">{offer.badge}</span>
              <span className="offer-expire">{offer.expire}</span>
            </div>
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
          </article>
        ))}
      </section>

      <section className="voucher-section">
        <div className="section-heading">
          <h2>Mã giảm giá của shop</h2>
          <p>Nhập mã ở bước thanh toán để áp dụng khuyến mãi.</p>
        </div>

        <div className="voucher-grid">
          {vouchers.map((voucher) => (
            <article key={voucher.code} className="voucher-card">
              <h3>{voucher.code}</h3>
              <p className="voucher-discount">{voucher.discount}</p>
              <p>{voucher.rule}</p>
            </article>
          ))}
        </div>
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

export default Offers;
