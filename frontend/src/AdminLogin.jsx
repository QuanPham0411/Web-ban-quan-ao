import { useState } from 'react';

function AdminLogin({ onAdminLoginSubmit, onGoHome }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onAdminLoginSubmit(form);
    if (!success) {
      setError('Email hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path d="M18 14l2 2 4-4" />
          </svg>
          <div>
            <h1>SunnyWear</h1>
            <span>Admin Portal</span>
          </div>
        </div>

        <p className="admin-login-sub">Đăng nhập để truy cập trang quản trị</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email quản trị</label>
          <input
            id="admin-email"
            type="email"
            placeholder="admin@sunnywear.com"
            required
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label htmlFor="admin-password">Mật khẩu</label>
          <input
            id="admin-password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit" className="admin-login-btn">
            Đăng nhập
          </button>
        </form>

        <button type="button" className="admin-back-link" onClick={onGoHome}>
          ← Về trang khách hàng
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
