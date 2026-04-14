const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const requireAdminOrStaff = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'staff') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này.' });
  }
  return next();
};

const parseQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const buildPriceFormatted = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

const normalizeProductRow = (row) => ({
  ...row,
  quantity: Number(row.quantity ?? 0),
  is_active: Boolean(row.is_active),
});

// GET /api/products?category=all|women|men|kids|intimates&page=1&limit=50
router.get('/', async (req, res) => {
  const { category, page = 1, limit = 50 } = req.query;
  const parsedLimit = Number(limit);
  const parsedPage = Number(page);
  const safeLimit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
  const safePage = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const offset = (safePage - 1) * safeLimit;

  try {
    let query = 'SELECT id, category_key, category_label, name, price, price_formatted, description, image_url, size_label, stock_label, quantity, is_active, created_at FROM products WHERE is_active = true';
    const params = [];

    if (category && category !== 'all') {
      if (category === 'women') {
        query += ' AND category_key IN (?, ?)';
        params.push('women', 'intimates');
      } else {
        query += ' AND category_key = ?';
        params.push(category);
      }
    }

    query += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) AS total FROM products WHERE is_active = true';
    const countParams = [];
    if (category && category !== 'all') {
      if (category === 'women') {
        countQuery += ' AND category_key IN (?, ?)';
        countParams.push('women', 'intimates');
      } else {
        countQuery += ' AND category_key = ?';
        countParams.push(category);
      }
    }
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return res.json({ products: rows.map(normalizeProductRow), total, page: safePage, limit: safeLimit });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, category_key, category_label, name, price, price_formatted, description, image_url, size_label, stock_label, quantity, is_active, created_at FROM products WHERE id = ? AND is_active = true',
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }
    return res.json(normalizeProductRow(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.post('/', authMiddleware, requireAdminOrStaff, async (req, res) => {
  const productId = String(req.body?.id || `prd-${Date.now()}`);
  const categoryKey = String(req.body?.categoryKey || '').trim();
  const categoryLabel = String(req.body?.categoryLabel || '').trim();
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  const imageUrl = String(req.body?.imageUrl || req.body?.image || '').trim();
  const sizeLabel = String(req.body?.sizeLabel || req.body?.size || '').trim();
  const stockLabel = String(req.body?.stockLabel || req.body?.stock || 'Còn hàng').trim();
  const price = Number(req.body?.price || 0);
  const quantity = parseQuantity(req.body?.quantity);

  if (!categoryKey || !categoryLabel || !name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc giá không hợp lệ.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Mã sản phẩm đã tồn tại.' });
    }

    await pool.query(
      'INSERT INTO products (id, category_key, category_label, name, price, price_formatted, description, image_url, size_label, stock_label, quantity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)',
      [
        productId,
        categoryKey,
        categoryLabel,
        name,
        Math.round(price),
        String(req.body?.priceFormatted || buildPriceFormatted(price)),
        description,
        imageUrl,
        sizeLabel,
        stockLabel,
        quantity,
      ],
    );

    const [rows] = await pool.query(
      'SELECT id, category_key, category_label, name, price, price_formatted, description, image_url, size_label, stock_label, quantity, is_active, created_at FROM products WHERE id = ?',
      [productId],
    );

    return res.status(201).json({ message: 'Đã thêm sản phẩm.', product: normalizeProductRow(rows[0]) });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.put('/:id', authMiddleware, requireAdminOrStaff, async (req, res) => {
  const productId = String(req.params.id || '').trim();
  const categoryKey = String(req.body?.categoryKey || '').trim();
  const categoryLabel = String(req.body?.categoryLabel || '').trim();
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  const imageUrl = String(req.body?.imageUrl || req.body?.image || '').trim();
  const sizeLabel = String(req.body?.sizeLabel || req.body?.size || '').trim();
  const stockLabel = String(req.body?.stockLabel || req.body?.stock || 'Còn hàng').trim();
  const price = Number(req.body?.price || 0);
  const quantity = parseQuantity(req.body?.quantity);

  if (!productId) {
    return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ.' });
  }

  if (!categoryKey || !categoryLabel || !name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc giá không hợp lệ.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE products SET category_key = ?, category_label = ?, name = ?, price = ?, price_formatted = ?, description = ?, image_url = ?, size_label = ?, stock_label = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        categoryKey,
        categoryLabel,
        name,
        Math.round(price),
        String(req.body?.priceFormatted || buildPriceFormatted(price)),
        description,
        imageUrl,
        sizeLabel,
        stockLabel,
        quantity,
        productId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }

    const [rows] = await pool.query(
      'SELECT id, category_key, category_label, name, price, price_formatted, description, image_url, size_label, stock_label, quantity, is_active, created_at FROM products WHERE id = ?',
      [productId],
    );

    return res.json({ message: 'Đã cập nhật sản phẩm.', product: normalizeProductRow(rows[0]) });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

router.delete('/:id', authMiddleware, requireAdminOrStaff, async (req, res) => {
  const productId = String(req.params.id || '').trim();

  if (!productId) {
    return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ.' });
  }

  try {
    const [result] = await pool.query('UPDATE products SET is_active = false WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }

    return res.json({ message: 'Đã xóa sản phẩm.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
