const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/auditLogger');
const {
  parseBody,
  offerWriteSchema,
  voucherWriteSchema,
  voucherValidateSchema,
} = require('../validation/schemas');

const router = express.Router();

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

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parsePageQuery = (query) => {
  const parsedLimit = Number(query?.limit || 20);
  const parsedPage = Number(query?.page || 1);
  const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
  const page = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const mapOffer = (row) => ({
  id: Number(row.id),
  title: String(row.title || ''),
  description: String(row.description || ''),
  badge: String(row.badge || ''),
  discountType: String(row.discount_type || 'percent'),
  discountValue: Number(row.discount_value || 0),
  minOrder: Number(row.min_order || 0),
  expiryDate: row.expiry_date || null,
  expireText: String(row.expire_text || ''),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at || null,
});

const mapVoucher = (row) => ({
  id: Number(row.id),
  code: String(row.code || ''),
  discountType: String(row.discount_type || 'percent'),
  discountValue: Number(row.discount_value || 0),
  minOrder: Number(row.min_order || 0),
  categoryKey: String(row.category_key || 'all'),
  expiryDate: row.expiry_date || null,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at || null,
});

// GET /api/offers — danh sách ưu đãi đang hoạt động
router.get('/', async (req, res) => {
  const { page, limit, offset } = parsePageQuery(req.query);
  const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true';

  try {
    let listQuery =
      `SELECT id, title, description, badge, discount_type, discount_value, min_order, expiry_date, expire_text, is_active, created_at
       FROM offers`;
    let countQuery = 'SELECT COUNT(*) AS total FROM offers';
    const params = [];
    const countParams = [];

    if (!includeInactive) {
      listQuery += ' WHERE is_active = true';
      countQuery += ' WHERE is_active = true';
    }

    listQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(listQuery, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return res.json({ offers: rows.map(mapOffer), total: Number(total || 0), page, limit });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/offers/vouchers — danh sách voucher đang hoạt động
router.get('/vouchers', async (req, res) => {
  const { page, limit, offset } = parsePageQuery(req.query);
  const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true';

  try {
    let listQuery =
      `SELECT id, code, discount_type, discount_value, min_order, category_key, expiry_date, is_active, created_at
       FROM vouchers`;
    let countQuery = 'SELECT COUNT(*) AS total FROM vouchers';
    const params = [];
    const countParams = [];

    if (!includeInactive) {
      listQuery += ' WHERE is_active = true';
      countQuery += ' WHERE is_active = true';
    }

    listQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(listQuery, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return res.json({ vouchers: rows.map(mapVoucher), total: Number(total || 0), page, limit });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// POST /api/offers/vouchers/validate — kiểm tra và tính giảm giá voucher
router.post('/vouchers/validate', async (req, res) => {
  const validateResult = parseBody(voucherValidateSchema, {
    code: req.body?.code,
    orderAmount: Number(req.body?.orderAmount || 0),
  });

  if (!validateResult.ok) {
    return res.status(400).json({ valid: false, message: validateResult.message });
  }

  const { code, orderAmount: safeOrderAmount } = validateResult.data;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM vouchers WHERE code = ? AND is_active = true',
      [code],
    );

    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Mã voucher không hợp lệ.' });
    }

    const voucher = rows[0];

    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Mã voucher đã hết hạn.' });
    }

    if (safeOrderAmount < voucher.min_order) {
      return res.status(400).json({
        valid: false,
        message: `Đơn hàng tối thiểu ${Number(voucher.min_order).toLocaleString('vi-VN')}đ để dùng mã này.`,
      });
    }

    const discount =
      voucher.discount_type === 'percent'
        ? Math.round(safeOrderAmount * voucher.discount_value / 100)
        : voucher.discount_value;

    return res.json({
      valid: true,
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      discount,
      message: `Áp dụng thành công! Giảm ${discount.toLocaleString('vi-VN')}đ`,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.use(authMiddleware);
router.use(requireAdminOrStaff);

// POST /api/offers - tạo chương trình khuyến mãi
router.post('/', async (req, res) => {
  const parseResult = parseBody(offerWriteSchema, {
    title: req.body?.title,
    description: req.body?.description,
    badge: req.body?.badge,
    discountType: req.body?.discountType,
    discountValue: Number(req.body?.discountValue || 0),
    minOrder: Number(req.body?.minOrder || 0),
    expiryDate: req.body?.expiryDate,
  });

  if (!parseResult.ok) {
    return res.status(400).json({ message: parseResult.message });
  }

  const payload = parseResult.data;

  try {
    const [result] = await pool.query(
      `INSERT INTO offers (title, description, badge, discount_type, discount_value, min_order, expiry_date, expire_text, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        payload.title,
        payload.description,
        payload.badge,
        payload.discountType,
        payload.discountValue,
        payload.minOrder,
        normalizeDate(payload.expiryDate),
        payload.expiryDate || '',
      ],
    );

    await logAdminAction({
      actor: req.user,
      action: 'create_offer',
      entityType: 'offer',
      entityId: String(result.insertId),
      ip: getClientIp(req),
      details: payload,
    });

    const [rows] = await pool.query(
      `SELECT id, title, description, badge, discount_type, discount_value, min_order, expiry_date, expire_text, is_active, created_at
       FROM offers WHERE id = ?`,
      [result.insertId],
    );

    return res.status(201).json({ message: 'Đã tạo chương trình khuyến mãi.', offer: mapOffer(rows[0]) });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// PUT /api/offers/:id - cập nhật khuyến mãi
router.put('/:id', async (req, res) => {
  const offerId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(offerId) || offerId < 1) {
    return res.status(400).json({ message: 'Mã chương trình không hợp lệ.' });
  }

  const parseResult = parseBody(offerWriteSchema, {
    title: req.body?.title,
    description: req.body?.description,
    badge: req.body?.badge,
    discountType: req.body?.discountType,
    discountValue: Number(req.body?.discountValue || 0),
    minOrder: Number(req.body?.minOrder || 0),
    expiryDate: req.body?.expiryDate,
  });

  if (!parseResult.ok) {
    return res.status(400).json({ message: parseResult.message });
  }

  const payload = parseResult.data;

  try {
    const [result] = await pool.query(
      `UPDATE offers
       SET title = ?, description = ?, badge = ?, discount_type = ?, discount_value = ?, min_order = ?, expiry_date = ?, expire_text = ?, is_active = true
       WHERE id = ?`,
      [
        payload.title,
        payload.description,
        payload.badge,
        payload.discountType,
        payload.discountValue,
        payload.minOrder,
        normalizeDate(payload.expiryDate),
        payload.expiryDate || '',
        offerId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chương trình khuyến mãi.' });
    }

    await logAdminAction({
      actor: req.user,
      action: 'update_offer',
      entityType: 'offer',
      entityId: String(offerId),
      ip: getClientIp(req),
      details: payload,
    });

    const [rows] = await pool.query(
      `SELECT id, title, description, badge, discount_type, discount_value, min_order, expiry_date, expire_text, is_active, created_at
       FROM offers WHERE id = ?`,
      [offerId],
    );

    return res.json({ message: 'Đã cập nhật chương trình khuyến mãi.', offer: mapOffer(rows[0]) });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// DELETE /api/offers/:id - xóa mềm khuyến mãi
router.delete('/:id', async (req, res) => {
  const offerId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(offerId) || offerId < 1) {
    return res.status(400).json({ message: 'Mã chương trình không hợp lệ.' });
  }

  try {
    const [result] = await pool.query('UPDATE offers SET is_active = false WHERE id = ?', [offerId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chương trình khuyến mãi.' });
    }

    await logAdminAction({
      actor: req.user,
      action: 'delete_offer',
      entityType: 'offer',
      entityId: String(offerId),
      ip: getClientIp(req),
      details: {},
    });

    return res.json({ message: 'Đã xóa chương trình khuyến mãi.' });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// POST /api/offers/vouchers - tạo voucher
router.post('/vouchers', async (req, res) => {
  const parseResult = parseBody(voucherWriteSchema, {
    code: req.body?.code,
    discountType: req.body?.discountType,
    discountValue: Number(req.body?.discountValue || 0),
    minOrder: Number(req.body?.minOrder || 0),
    categoryKey: req.body?.categoryKey,
    expiryDate: req.body?.expiryDate,
  });

  if (!parseResult.ok) {
    return res.status(400).json({ message: parseResult.message });
  }

  const payload = parseResult.data;

  try {
    const [existing] = await pool.query('SELECT id FROM vouchers WHERE code = ?', [payload.code]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Mã voucher đã tồn tại.' });
    }

    const [result] = await pool.query(
      `INSERT INTO vouchers (code, discount_type, discount_value, min_order, category_key, expiry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, true)`,
      [
        payload.code,
        payload.discountType,
        payload.discountValue,
        payload.minOrder,
        payload.categoryKey,
        normalizeDate(payload.expiryDate),
      ],
    );

    await logAdminAction({
      actor: req.user,
      action: 'create_voucher',
      entityType: 'voucher',
      entityId: String(result.insertId),
      ip: getClientIp(req),
      details: payload,
    });

    const [rows] = await pool.query(
      `SELECT id, code, discount_type, discount_value, min_order, category_key, expiry_date, is_active, created_at
       FROM vouchers WHERE id = ?`,
      [result.insertId],
    );

    return res.status(201).json({ message: 'Đã tạo voucher.', voucher: mapVoucher(rows[0]) });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// PUT /api/offers/vouchers/:id - cập nhật voucher
router.put('/vouchers/:id', async (req, res) => {
  const voucherId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(voucherId) || voucherId < 1) {
    return res.status(400).json({ message: 'Mã voucher không hợp lệ.' });
  }

  const parseResult = parseBody(voucherWriteSchema, {
    code: req.body?.code,
    discountType: req.body?.discountType,
    discountValue: Number(req.body?.discountValue || 0),
    minOrder: Number(req.body?.minOrder || 0),
    categoryKey: req.body?.categoryKey,
    expiryDate: req.body?.expiryDate,
  });

  if (!parseResult.ok) {
    return res.status(400).json({ message: parseResult.message });
  }

  const payload = parseResult.data;

  try {
    const [duplicate] = await pool.query('SELECT id FROM vouchers WHERE code = ? AND id <> ?', [payload.code, voucherId]);
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Mã voucher đã tồn tại.' });
    }

    const [result] = await pool.query(
      `UPDATE vouchers
       SET code = ?, discount_type = ?, discount_value = ?, min_order = ?, category_key = ?, expiry_date = ?, is_active = true
       WHERE id = ?`,
      [
        payload.code,
        payload.discountType,
        payload.discountValue,
        payload.minOrder,
        payload.categoryKey,
        normalizeDate(payload.expiryDate),
        voucherId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy voucher.' });
    }

    await logAdminAction({
      actor: req.user,
      action: 'update_voucher',
      entityType: 'voucher',
      entityId: String(voucherId),
      ip: getClientIp(req),
      details: payload,
    });

    const [rows] = await pool.query(
      `SELECT id, code, discount_type, discount_value, min_order, category_key, expiry_date, is_active, created_at
       FROM vouchers WHERE id = ?`,
      [voucherId],
    );

    return res.json({ message: 'Đã cập nhật voucher.', voucher: mapVoucher(rows[0]) });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// DELETE /api/offers/vouchers/:id - xóa mềm voucher
router.delete('/vouchers/:id', async (req, res) => {
  const voucherId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(voucherId) || voucherId < 1) {
    return res.status(400).json({ message: 'Mã voucher không hợp lệ.' });
  }

  try {
    const [result] = await pool.query('UPDATE vouchers SET is_active = false WHERE id = ?', [voucherId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy voucher.' });
    }

    await logAdminAction({
      actor: req.user,
      action: 'delete_voucher',
      entityType: 'voucher',
      entityId: String(voucherId),
      ip: getClientIp(req),
      details: {},
    });

    return res.json({ message: 'Đã xóa voucher.' });
  } catch {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
