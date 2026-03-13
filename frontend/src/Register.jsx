import { useState } from 'react';
import CartIconButton from './components/CartIconButton';

function Register({ onGoHome, onGoProducts, onGoOffers, onGoCart, onGoLogin, cartCount, onSubmit }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="auth-page">
      <header className="top-header auth-header">
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

      <section className="auth-card-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản mới để nhận voucher thành viên và ưu đãi độc quyền.</p>

          <label htmlFor="register-name">Họ và tên</label>
          <input
            id="register-name"
            type="text"
            placeholder="Nguyễn Văn A"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            placeholder="ban@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label htmlFor="register-phone">Số điện thoại</label>
          <input
            id="register-phone"
            type="tel"
            placeholder="09xxxxxxxx"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <label htmlFor="register-password">Mật khẩu</label>
          <input
            id="register-password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="auth-submit" type="submit">
            Tạo tài khoản
          </button>

          <p className="auth-switch">
            Đã có tài khoản?{' '}
            <button type="button" className="auth-link-btn" onClick={onGoLogin}>
              Đăng nhập ngay
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}

export default Register;
