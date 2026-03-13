const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sunnywear_secret_key';
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const mockStore = USE_MOCK_DATA ? require('../mockStore') : null;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedName = String(fullName || '').trim();

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (USE_MOCK_DATA) {
      const existingMock = mockStore.findUserByEmail(normalizedEmail);
      if (existingMock) {
        return res.status(409).json({ message: 'Email này đã được đăng ký.' });
      }

      const createdUser = mockStore.createUser({
        fullName: normalizedName,
        email: normalizedEmail,
        phone,
        passwordHash,
      });

      const token = jwt.sign(
        { id: createdUser.id, email: createdUser.email, fullName: createdUser.full_name },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.status(201).json({
        token,
        user: { id: createdUser.id, fullName: createdUser.full_name, email: createdUser.email, phone: createdUser.phone },
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [normalizedName, normalizedEmail, phone || null, passwordHash],
    );

    const token = jwt.sign(
      { id: result.insertId, email: normalizedEmail, fullName: normalizedName },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(201).json({
      token,
      user: { id: result.insertId, fullName: normalizedName, email: normalizedEmail },
    });
  } catch (err) {
    if (USE_MOCK_DATA) {
      const existingMock = mockStore.findUserByEmail(normalizedEmail);
      if (existingMock) {
        return res.status(409).json({ message: 'Email này đã được đăng ký.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const createdUser = mockStore.createUser({
        fullName: normalizedName,
        email: normalizedEmail,
        phone,
        passwordHash,
      });

      const token = jwt.sign(
        { id: createdUser.id, email: createdUser.email, fullName: createdUser.full_name },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.status(201).json({
        token,
        user: { id: createdUser.id, fullName: createdUser.full_name, email: createdUser.email, phone: createdUser.phone },
      });
    }

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
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, fullName: user.full_name },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.json({
        token,
        user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
      });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, fullName: user.full_name },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      return res.json({
        token,
        user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
      });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// GET /api/auth/me — trả về thông tin người dùng hiện tại
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }

      return res.json({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
      });
    }

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
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }

      return res.json({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
      });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;
