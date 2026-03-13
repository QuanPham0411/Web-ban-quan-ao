const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const mockStore = USE_MOCK_DATA ? require('../mockStore') : null;
const DEFAULT_PASSWORD = '123456';

const mapUser = (user) => ({
  id: user.id,
  name: user.full_name,
});

const buildFallbackEmail = () => `crud-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sunnywear.local`;

router.get('/', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const users = mockStore.getUsers().map(mapUser);

      return res.json(users);
    }

    const [rows] = await pool.query(
      'SELECT id, full_name FROM users ORDER BY created_at DESC, id DESC',
    );

    return res.json(rows.map(mapUser));
  } catch (err) {
    if (USE_MOCK_DATA) {
      const users = mockStore.getUsers().map(mapUser);

      return res.json(users);
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

router.get('/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(userId) || userId < 1) {
    return res.status(400).json({ message: 'ID user không hợp lệ.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user.' });
      }

      return res.json(mapUser(user));
    }

    const [rows] = await pool.query('SELECT id, full_name FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user.' });
    }

    return res.json(mapUser(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

router.post('/', async (req, res) => {
  const name = String(req.body.name || '').trim();

  if (!name) {
    return res.status(400).json({ message: 'Tên user không được để trống.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const createdUser = mockStore.createUser({
        fullName: name,
        email: buildFallbackEmail(),
        phone: null,
        passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
      });

      return res.status(201).json(mapUser(createdUser));
    }

    const fallbackEmail = buildFallbackEmail();
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, fallbackEmail, null, passwordHash],
    );

    return res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

router.put('/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const name = String(req.body.name || '').trim();

  if (Number.isNaN(userId) || userId < 1) {
    return res.status(400).json({ message: 'ID user không hợp lệ.' });
  }

  if (!name) {
    return res.status(400).json({ message: 'Tên user không được để trống.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user.' });
      }

      user.full_name = name;
      return res.json(mapUser(user));
    }

    const [result] = await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [name, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user.' });
    }

    return res.json({ id: userId, name });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(userId) || userId < 1) {
    return res.status(400).json({ message: 'ID user không hợp lệ.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const user = mockStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user.' });
      }

      return res.status(501).json({ message: 'Chế độ mock chưa hỗ trợ xóa user.' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user.' });
    }

    return res.json({ message: 'Đã xóa user thành công.', id: userId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;