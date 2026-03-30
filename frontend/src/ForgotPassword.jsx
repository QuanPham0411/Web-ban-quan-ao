import { useEffect, useState } from 'react';
import CartIconButton from './components/CartIconButton';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const OTP_ROTATE_SECONDS = 30;

const generateOTP = () => {
  return String(Math.floor(Math.random() * 900000) + 100000);
};

function ForgotPassword({
  onGoHome,
  onGoProducts,
  onGoOffers,
  onGoUsers,
  onGoCart,
  onGoLogin,
  cartCount,
  customers,
  onUpdateCustomer,
}) {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_ROTATE_SECONDS);

  useEffect(() => {
    if (step !== 'otp') {
      return undefined;
    }

    const timerId = setInterval(() => {
      setOtpSecondsLeft((previousSeconds) => {
        if (previousSeconds <= 1) {
          const refreshedOtp = generateOTP();
          setGeneratedOtp(refreshedOtp);
          setOtp('');
          setMessage(`OTP mới đã được tạo: ${refreshedOtp}`);
          return OTP_ROTATE_SECONDS;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [step]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError('Vui lòng nhập email');
      return;
    }

    const customer = customers.find((c) => normalizeEmail(c.email) === normalizedEmail);

    if (!customer) {
      setError('Email này chưa đăng ký tài khoản');
      return;
    }

    // Sinh OTP
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    setSelectedCustomer(customer);
    setStep('otp');
    setOtpSecondsLeft(OTP_ROTATE_SECONDS);
    setMessage(`OTP của bạn là: ${newOtp}`);
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

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Cập nhật mật khẩu cho khách hàng
    if (selectedCustomer) {
      onUpdateCustomer({
        ...selectedCustomer,
        password: newPassword,
      });
    }

    setMessage('Mật khẩu đã được cập nhật thành công!');
    setTimeout(() => {
      onGoLogin();
    }, 2000);
  };

  const handleBack = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setGeneratedOtp('');
    setSelectedCustomer(null);
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
              <p>Mã OTP được gửi đến email <strong>{selectedCustomer?.email}</strong></p>

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
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label htmlFor="forgot-confirm-password">Xác nhận mật khẩu</label>
              <input
                id="forgot-confirm-password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button className="auth-submit" type="submit">
            {step === 'email' && 'Tiếp tục'}
            {step === 'otp' && 'Xác minh OTP'}
            {step === 'password' && 'Cập nhật mật khẩu'}
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
