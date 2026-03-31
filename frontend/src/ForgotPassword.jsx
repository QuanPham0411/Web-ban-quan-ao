import { useEffect, useState } from 'react';
import CartIconButton from './components/CartIconButton';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const OTP_ROTATE_SECONDS = 300;
const PRODUCTION_API_BASE_URL = 'https://api-ban-quan-ao-backend.onrender.com';

const resolveApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return PRODUCTION_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

const parseApiResponse = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

function ForgotPassword({
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoCart,
  onGoLogin,
  cartCount,
}) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_ROTATE_SECONDS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step !== 'otp' || !otpSecondsLeft) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setOtpSecondsLeft((previousSeconds) => {
        if (previousSeconds <= 1) {
          setMessage('OTP đã hết hạn. Vui lòng quay lại để tạo OTP mới.');
          return 0;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [step]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        setError(data.message || 'Không thể tạo OTP.');
        return;
      }

      setGeneratedOtp(String(data.otp || ''));
      setStep('otp');
      setOtp('');
      setOtpSecondsLeft(Number(data.expiresInSeconds || OTP_ROTATE_SECONDS));
      setMessage(`OTP của bạn là: ${String(data.otp || '')}`);
    } catch (err) {
      setError(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp) {
      setError('Vui lòng nhập OTP');
      return;
    }

    if (otp !== generatedOtp) {
      setError('OTP không chính xác');
      return;
    }

    setStep('password');
    setMessage('OTP xác minh thành công! Vui lòng đặt mật khẩu mới');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizeEmail(email),
          otp,
          newPassword,
        }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        setError(data.message || 'Không thể cập nhật mật khẩu');
        return;
      }

      setMessage('Mật khẩu đã được cập nhật thành công!');
      setTimeout(() => {
        onGoLogin();
      }, 1500);
    } catch (err) {
      setError(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setGeneratedOtp('');
    setError('');
    setMessage('');
    setOtpSecondsLeft(OTP_ROTATE_SECONDS);
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
        <form className="auth-card" onSubmit={step === 'email' ? handleEmailSubmit : step === 'otp' ? handleOtpSubmit : handlePasswordSubmit}>
          <h1>Quên mật khẩu</h1>

          {step === 'email' && (
            <>
              <p>Nhập email đã đăng ký để lấy lại mật khẩu</p>

              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="ban@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {step === 'otp' && (
            <>
              <p>Mã OTP được tạo cho email <strong>{email}</strong></p>

              <div className="otp-display-box">
                <p>OTP của bạn:</p>
                <div className="otp-code">{generatedOtp}</div>
                <small>Tự đổi sau {otpSecondsLeft} giây</small>
              </div>

              <label htmlFor="forgot-otp">Nhập OTP</label>
              <input
                id="forgot-otp"
                type="text"
                placeholder="000000"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </>
          )}

          {step === 'password' && (
            <>
              <p>Tạo mật khẩu mới cho tài khoản</p>

              <label htmlFor="forgot-new-password">Mật khẩu mới</label>
              <input
                id="forgot-new-password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label htmlFor="forgot-confirm-password">Xác nhận mật khẩu</label>
              <input
                id="forgot-confirm-password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button className="auth-submit" type="submit" disabled={isLoading || (step === 'otp' && otpSecondsLeft === 0)}>
            {step === 'email' && 'Tiếp tục'}
            {step === 'otp' && 'Xác minh OTP'}
            {step === 'password' && (isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu')}
          </button>

          {step !== 'email' && (
            <button type="button" className="auth-back-btn" onClick={handleBack}>
              Quay lại
            </button>
          )}

          {step === 'email' && (
            <p className="auth-switch">
              Nhớ mật khẩu?{' '}
              <button type="button" className="auth-link-btn" onClick={onGoLogin}>
                Đăng nhập
              </button>
            </p>
          )}
        </form>
      </section>
    </div>
  );
}

export default ForgotPassword;
