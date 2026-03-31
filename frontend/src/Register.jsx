import { useState } from 'react';
import CartIconButton from './components/CartIconButton';

const normalizePhoneInput = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value) => /^\d{10}$/.test(String(value || ''));
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(value || ''));

function Register({ onGoHome, onGoProducts, onGoOffers, onGoUsers, onGoCart, onGoLogin, cartCount, onSubmit }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPasswordError('');

    if (!isValidPhone(form.phone)) {
      setPhoneError('Số điện thoại phải đủ 10 số và không chứa ký tự khác.');
      return;
    }
    if (!isStrongPassword(form.password)) {
      setPasswordError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value) => {
    setForm({ ...form, phone: normalizePhoneInput(value) });
    setPhoneError('');
  };

  const handlePasswordChange = (value) => {
    setForm({ ...form, password: value });
    setPasswordError('');
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
          <button type="button" className="catalog-nav-button" onClick={onGoUsers}>
            Users
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
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
          />
          {phoneError ? <p className="auth-form-error">{phoneError}</p> : null}

          <label htmlFor="register-password">Mật khẩu</label>
          <input
            id="register-password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
          />
          {passwordError ? <p className="auth-form-error">{passwordError}</p> : null}

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
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
