const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/offers — danh sách ưu đãi đang hoạt động
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM offers WHERE is_active = true ORDER BY id');
    return res.json({ offers: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/offers/vouchers — danh sách voucher đang hoạt động
router.get('/vouchers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, code, discount_type, discount_value, min_order, expiry_date, category_key FROM vouchers WHERE is_active = true ORDER BY id',
    );
    return res.json({ vouchers: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// POST /api/offers/vouchers/validate — kiểm tra và tính giảm giá voucher
router.post('/vouchers/validate', async (req, res) => {
  const { code, orderAmount = 0 } = req.body;
  const safeOrderAmount = Number(orderAmount);

  if (!code) {
    return res.status(400).json({ message: 'Vui lòng nhập mã voucher.' });
  }

  if (!Number.isFinite(safeOrderAmount) || safeOrderAmount < 0) {
    return res.status(400).json({ valid: false, message: 'Giá trị đơn hàng không hợp lệ.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM vouchers WHERE code = ? AND is_active = true',
      [code.toUpperCase().trim()],
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

module.exports = router;
