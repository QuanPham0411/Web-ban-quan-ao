const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sunnywear_secret_key';
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const OTP_EXPIRE_MS = 5 * 60 * 1000;
const OTP_STORE = new Map();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedName = String(fullName || '').trim();
  const normalizedPhone = String(phone || '').replace(/\D/g, '');

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
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

    const token = jwt.sign(
      { id: result.insertId, email: normalizedEmail, fullName: normalizedName, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(201).json({
      token,
      user: { id: result.insertId, fullName: normalizedName, email: normalizedEmail, role: 'customer' },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
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
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// POST /api/auth/forgot-password/request
router.post('/forgot-password/request', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email này chưa đăng ký tài khoản.' });
    }

    const otp = generateOtp();
    OTP_STORE.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRE_MS,
      attempts: 0,
    });

    return res.json({
      message: 'Đã tạo OTP. Vui lòng dùng OTP để đặt lại mật khẩu.',
      otp,
      expiresInSeconds: Math.floor(OTP_EXPIRE_MS / 1000),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  const otp = String(req.body?.otp || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!normalizedEmail || !otp || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, OTP và mật khẩu mới.' });
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
    });
  }

  const otpRecord = OTP_STORE.get(normalizedEmail);
  if (!otpRecord) {
    return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn.' });
  }

  if (Date.now() > otpRecord.expiresAt) {
    OTP_STORE.delete(normalizedEmail);
    return res.status(400).json({ message: 'OTP đã hết hạn. Vui lòng tạo OTP mới.' });
  }

  if (otpRecord.attempts >= 5) {
    OTP_STORE.delete(normalizedEmail);
    return res.status(429).json({ message: 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng tạo OTP mới.' });
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
    return res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
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
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;
