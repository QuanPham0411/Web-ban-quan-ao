const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();
const DEFAULT_PASSWORD = '123456';

const mapUser = (user) => ({
  id: user.id,
  name: user.full_name,
  email: user.email || '',
  phone: user.phone || '',
  role: user.role || 'customer',
  createdAt: user.created_at || null,
  orders: Number(user.orders || 0),
});

const buildFallbackEmail = () => `crud-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sunnywear.local`;

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC, id DESC',
    );

    return res.json(rows.map(mapUser));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

router.get('/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(userId) || userId < 1) {
    return res.status(400).json({ message: 'ID user không hợp lệ.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?',
      [userId],
    );
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
    const fallbackEmail = buildFallbackEmail();
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, fallbackEmail, null, passwordHash],
    );

    return res.status(201).json({
      id: result.insertId,
      name,
      email: fallbackEmail,
      phone: '',
      role: 'customer',
      createdAt: new Date().toISOString(),
      orders: 0,
    });
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
