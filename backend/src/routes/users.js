const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/auditLogger');
const { parseBody, userCreateSchema, userUpdateSchema } = require('../validation/schemas');

const router = express.Router();
const generateTempPassword = () => crypto.randomBytes(9).toString('base64url');

const getClientIp = (req) => {
  const xff = String(req.headers['x-forwarded-for'] || '').trim();
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return String(req.ip || req.connection?.remoteAddress || 'unknown');
};

const requireAdminOrStaff = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'staff') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này.' });
  }
  return next();
};

router.use(authMiddleware);
router.use(requireAdminOrStaff);

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
  const parsedLimit = Number(req.query?.limit || 20);
  const parsedPage = Number(req.query?.page || 1);
  const safeLimit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
  const safePage = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const offset = (safePage - 1) * safeLimit;
  const roleFilter = String(req.query?.role || '').trim().toLowerCase();
  const search = String(req.query?.search || '').trim();
  const sortByRaw = String(req.query?.sortBy || 'created_at').trim().toLowerCase();
  const sortOrderRaw = String(req.query?.sortOrder || 'desc').trim().toLowerCase();
  const sortByMap = {
    created_at: 'created_at',
    name: 'full_name',
    email: 'email',
    role: 'role',
  };
  const sortBy = sortByMap[sortByRaw] || 'created_at';
  const sortOrder = sortOrderRaw === 'asc' ? 'ASC' : 'DESC';

  try {
    let listQuery = 'SELECT id, full_name, email, phone, role, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) AS total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (roleFilter) {
      listQuery += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(roleFilter);
      countParams.push(roleFilter);
    }

    if (search) {
      listQuery += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue);
      countParams.push(searchValue, searchValue, searchValue);
    }

    listQuery += ` ORDER BY ${sortBy} ${sortOrder}, id DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const [rows] = await pool.query(listQuery, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return res.json({
      users: rows.map(mapUser),
      total: Number(total || 0),
      page: safePage,
      limit: safeLimit,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
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
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.post('/', async (req, res) => {
  const parsed = parseBody(userCreateSchema, {
    name: req.body?.name,
  });

  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }

  const { name } = parsed.data;

  try {
    const fallbackEmail = buildFallbackEmail();
    const passwordHash = await bcrypt.hash(generateTempPassword(), 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, fallbackEmail, null, passwordHash],
    );

    await logAdminAction({
      actor: req.user,
      action: 'create_user',
      entityType: 'user',
      entityId: String(result.insertId),
      ip: getClientIp(req),
      details: { name },
    });

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
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.put('/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  const parsed = parseBody(userUpdateSchema, {
    name: req.body?.name,
    role: req.body?.role,
    phone: req.body?.phone,
  });

  if (Number.isNaN(userId) || userId < 1) {
    return res.status(400).json({ message: 'ID user không hợp lệ.' });
  }

  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }

  const { name, role, phone } = parsed.data;

  try {
    const [result] = await pool.query('UPDATE users SET full_name = ?, role = COALESCE(?, role), phone = COALESCE(?, phone) WHERE id = ?', [name, role || null, phone || null, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user.' });
    }

    await logAdminAction({
      actor: req.user,
      action: 'update_user',
      entityType: 'user',
      entityId: String(userId),
      ip: getClientIp(req),
      details: { name, role: role || undefined, phone: phone || undefined },
    });

    return res.json({ id: userId, name, role: role || undefined, phone: phone || undefined });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
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

    await logAdminAction({
      actor: req.user,
      action: 'delete_user',
      entityType: 'user',
      entityId: String(userId),
      ip: getClientIp(req),
      details: {},
    });

    return res.json({ message: 'Đã xóa user thành công.', id: userId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
