import { useState } from 'react';
import CartIconButton from './components/CartIconButton';

function Login({
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoCart,
  onGoRegister,
  onGoForgotPassword,
  cartCount,
  onSubmit,
  errorMessage,
}) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setIsLoading(false);
    }
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
          <h1>Đăng nhập</h1>
          <p>Đăng nhập để lưu giỏ hàng, nhận ưu đãi và theo dõi đơn hàng.</p>

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="ban@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label htmlFor="login-password">Mật khẩu</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <p className="auth-switch">
            <button type="button" className="auth-link-btn" onClick={onGoForgotPassword}>
              Quên mật khẩu?
            </button>
          </p>

          <p className="auth-switch">
            Chưa có tài khoản?{' '}
            <button type="button" className="auth-link-btn" onClick={onGoRegister}>
              Tạo tài khoản
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}

export default Login;
