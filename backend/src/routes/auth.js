const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim() || (process.env.NODE_ENV !== 'production' ? 'sunnywear_secret_key' : '');
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const OTP_EXPIRE_MS = 5 * 60 * 1000;
const OTP_STORE = new Map();
const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 8;
const FORGOT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const FORGOT_RATE_LIMIT_MAX_ATTEMPTS = 6;
const RESET_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RESET_RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_STORE = {
  login: new Map(),
  forgot: new Map(),
  reset: new Map(),
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();

const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const RESEND_FROM = String(process.env.RESEND_FROM || '').trim();

const SMTP_HOST = String(process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true';
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || '').trim();

const shouldUseResend = () => EMAIL_PROVIDER === 'resend' || (Boolean(RESEND_API_KEY) && Boolean(RESEND_FROM));

const getClientIp = (req) => {
  const xff = String(req.headers['x-forwarded-for'] || '').trim();
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return String(req.ip || req.connection?.remoteAddress || 'unknown');
};

const pruneRateLimitMap = (store, now) => {
  for (const [key, entry] of store.entries()) {
    if (!entry || now - entry.startedAt > entry.windowMs) {
      store.delete(key);
    }
  }
};

const consumeRateLimit = (store, key, maxAttempts, windowMs) => {
  const now = Date.now();
  pruneRateLimitMap(store, now);

  const current = store.get(key);
  if (!current || now - current.startedAt > windowMs) {
    store.set(key, { attempts: 1, startedAt: now, windowMs });
    return { blocked: false };
  }

  if (current.attempts >= maxAttempts) {
    return { blocked: true, retryAfterMs: windowMs - (now - current.startedAt) };
  }

  current.attempts += 1;
  store.set(key, current);
  return { blocked: false };
};

const resetRateLimit = (store, key) => {
  store.delete(key);
};

let transporter;
const getTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return null;
  }

  if (!transporter) {
    const isPort465 = SMTP_PORT === 465;
    const isPort587 = SMTP_PORT === 587;
    const secure = isPort465 ? true : (isPort587 ? false : SMTP_SECURE);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure,
      requireTLS: !secure,
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 30000),
      tls: {
        servername: SMTP_HOST,
      },
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendOtpViaResend = async (email, otp) => {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw new Error('RESEND chưa được cấu hình đầy đủ. Hãy điền RESEND_API_KEY và RESEND_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: 'SunnyWear - Ma OTP khoi phuc mat khau',
      text: `Ma OTP cua ban la: ${otp}. Ma co hieu luc trong 5 phut. Vui long khong chia se ma nay cho bat ky ai.`,
      html: `<p>Ma OTP cua ban la: <b>${otp}</b></p><p>Ma co hieu luc trong <b>5 phut</b>.</p><p>Vui long khong chia se ma nay cho bat ky ai.</p>`,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`RESEND_HTTP_${response.status}: ${raw}`);
  }
};

const sendOtpEmail = async (email, otp) => {
  if (shouldUseResend()) {
    await sendOtpViaResend(email, otp);
    return;
  }

  const mailer = getTransporter();

  if (!mailer) {
    throw new Error('SMTP chưa được cấu hình đầy đủ. Với Gmail, hãy điền SMTP_USER và App Password 16 ký tự vào SMTP_PASS.');
  }

  await mailer.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'SunnyWear - Ma OTP khoi phuc mat khau',
    text: `Ma OTP cua ban la: ${otp}. Ma co hieu luc trong 5 phut. Vui long khong chia se ma nay cho bat ky ai.`,
    html: `<p>Ma OTP cua ban la: <b>${otp}</b></p><p>Ma co hieu luc trong <b>5 phut</b>.</p><p>Vui long khong chia se ma nay cho bat ky ai.</p>`,
  });
};

const mapOtpMailErrorMessage = (err) => {
  const msg = String(err?.message || '');

  if (/your own email address|testing emails/i.test(msg)) {
    return 'Không thể gửi OTP: tài khoản Resend test chỉ gửi tới email đăng ký tài khoản Resend. Muốn gửi tới email khác, cần verify domain.';
  }

  if (/RESEND_HTTP_401|RESEND_HTTP_403|RESEND chưa được cấu hình/i.test(msg)) {
    return 'Không thể gửi OTP: cấu hình Resend chưa đúng. Hãy kiểm tra RESEND_API_KEY và RESEND_FROM.';
  }

  if (/RESEND_HTTP_429/i.test(msg)) {
    return 'Không thể gửi OTP: dịch vụ email đang quá tải. Vui lòng thử lại sau ít phút.';
  }

  if (/RESEND_HTTP_5\d\d|RESEND_HTTP_4\d\d/i.test(msg)) {
    return 'Không thể gửi OTP: dịch vụ email tạm thời lỗi. Vui lòng thử lại sau.';
  }

  if (/Connection timeout|ETIMEDOUT|timeout/i.test(msg)) {
    return 'Không thể gửi OTP: kết nối SMTP bị timeout. Vui lòng thử lại sau.';
  }

  if (/Invalid login|BadCredentials|535-5\.7\.8|Username and Password not accepted/i.test(msg)) {
    return 'Không thể gửi OTP: tài khoản Gmail hoặc App Password chưa đúng. Hãy kiểm tra SMTP_USER và SMTP_PASS (App Password 16 ký tự).';
  }

  if (/SMTP chưa được cấu hình|Missing credentials/i.test(msg)) {
    return 'Không thể gửi OTP: SMTP chưa cấu hình đầy đủ trên server.';
  }

  return 'Không thể gửi OTP qua email vào lúc này. Vui lòng thử lại sau.';
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedName = String(fullName || '').trim();
  const normalizedPhone = String(phone || '').replace(/\D/g, '');

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
  }
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server thiếu cấu hình bảo mật JWT_SECRET.' });
  }
  if (!PHONE_REGEX.test(normalizedPhone)) {
    return res.status(400).json({ message: 'Số điện thoại phải gồm đúng 10 chữ số.' });
  }
  if (!PASSWORD_REGEX.test(String(password || ''))) {
    return res.status(400).json({
      message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [normalizedName, normalizedEmail, normalizedPhone, passwordHash],
    );

    return res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.',
      user: { id: result.insertId, fullName: normalizedName, email: normalizedEmail, role: 'customer' },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const ip = getClientIp(req);
  const rateLimitKey = `${ip}|${normalizedEmail || 'unknown'}`;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
  }
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server thiếu cấu hình bảo mật JWT_SECRET.' });
  }

  const rateLimit = consumeRateLimit(
    RATE_LIMIT_STORE.login,
    rateLimitKey,
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    LOGIN_RATE_LIMIT_WINDOW_MS,
  );

  if (rateLimit.blocked) {
    return res.status(429).json({ message: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (user.is_active === false || user.is_active === 0) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    resetRateLimit(RATE_LIMIT_STORE.login, rateLimitKey);

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// POST /api/auth/forgot-password/request
router.post('/forgot-password/request', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  const ip = getClientIp(req);
  const rateLimitKey = `${ip}|${normalizedEmail || 'unknown'}`;

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }

  const rateLimit = consumeRateLimit(
    RATE_LIMIT_STORE.forgot,
    rateLimitKey,
    FORGOT_RATE_LIMIT_MAX_ATTEMPTS,
    FORGOT_RATE_LIMIT_WINDOW_MS,
  );

  if (rateLimit.blocked) {
    return res.status(429).json({ message: 'Bạn yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau ít phút.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.json({
        message: 'Nếu email tồn tại trong hệ thống, OTP đã được gửi. Vui lòng kiểm tra hộp thư.',
        expiresInSeconds: Math.floor(OTP_EXPIRE_MS / 1000),
      });
    }

    const otp = generateOtp();
    const otpRecord = {
      otp,
      expiresAt: Date.now() + OTP_EXPIRE_MS,
      attempts: 0,
    };

    await sendOtpEmail(normalizedEmail, otp);
    OTP_STORE.set(normalizedEmail, otpRecord);

    return res.json({
      message: 'OTP đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.',
      expiresInSeconds: Math.floor(OTP_EXPIRE_MS / 1000),
    });
  } catch (err) {
    return res.status(500).json({ message: mapOtpMailErrorMessage(err) });
  }
});

// POST /api/auth/forgot-password/resend
router.post('/forgot-password/resend', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  const ip = getClientIp(req);
  const rateLimitKey = `${ip}|${normalizedEmail || 'unknown'}`;

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }

  const rateLimit = consumeRateLimit(
    RATE_LIMIT_STORE.forgot,
    rateLimitKey,
    FORGOT_RATE_LIMIT_MAX_ATTEMPTS,
    FORGOT_RATE_LIMIT_WINDOW_MS,
  );

  if (rateLimit.blocked) {
    return res.status(429).json({ message: 'Bạn yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau ít phút.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.json({
        message: 'Nếu email tồn tại trong hệ thống, OTP đã được gửi. Vui lòng kiểm tra hộp thư.',
        expiresInSeconds: Math.floor(OTP_EXPIRE_MS / 1000),
      });
    }

    const otp = generateOtp();
    const otpRecord = {
      otp,
      expiresAt: Date.now() + OTP_EXPIRE_MS,
      attempts: 0,
    };

    await sendOtpEmail(normalizedEmail, otp);
    OTP_STORE.set(normalizedEmail, otpRecord);

    return res.json({
      message: 'Đã gửi lại OTP mới về email của bạn.',
      expiresInSeconds: Math.floor(OTP_EXPIRE_MS / 1000),
    });
  } catch (err) {
    return res.status(500).json({ message: mapOtpMailErrorMessage(err) });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  const otp = String(req.body?.otp || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  const ip = getClientIp(req);
  const rateLimitKey = `${ip}|${normalizedEmail || 'unknown'}`;

  if (!normalizedEmail || !otp || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, OTP và mật khẩu mới.' });
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
    });
  }

  const rateLimit = consumeRateLimit(
    RATE_LIMIT_STORE.reset,
    rateLimitKey,
    RESET_RATE_LIMIT_MAX_ATTEMPTS,
    RESET_RATE_LIMIT_WINDOW_MS,
  );

  if (rateLimit.blocked) {
    return res.status(429).json({ message: 'Bạn thử đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau ít phút.' });
  }

  const otpRecord = OTP_STORE.get(normalizedEmail);
  if (!otpRecord) {
    return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn.' });
  }

  if (Date.now() > otpRecord.expiresAt) {
    OTP_STORE.delete(normalizedEmail);
    return res.status(400).json({ message: 'OTP đã hết hạn. Vui lòng gửi lại OTP mới.' });
  }

  if (otpRecord.attempts >= 5) {
    OTP_STORE.delete(normalizedEmail);
    return res.status(429).json({ message: 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng gửi lại OTP mới.' });
  }

  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    OTP_STORE.set(normalizedEmail, otpRecord);
    return res.status(400).json({ message: 'OTP không chính xác.' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      OTP_STORE.delete(normalizedEmail);
      return res.status(404).json({ message: 'Email này chưa đăng ký tài khoản.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [
      passwordHash,
      normalizedEmail,
    ]);

    OTP_STORE.delete(normalizedEmail);
    resetRateLimit(RATE_LIMIT_STORE.reset, rateLimitKey);
    return res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?',
      [req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    const u = rows[0];
    return res.json({ id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, createdAt: u.created_at });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
