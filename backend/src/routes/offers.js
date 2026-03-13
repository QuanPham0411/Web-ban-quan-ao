const express = require('express');
const { pool } = require('../db');

const router = express.Router();
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const mockStore = USE_MOCK_DATA ? require('../mockStore') : null;

// GET /api/offers — danh sách ưu đãi đang hoạt động
router.get('/', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json({ offers: mockStore.getOffers() });
    }

    const [rows] = await pool.query('SELECT * FROM offers WHERE is_active = true ORDER BY id');
    return res.json({ offers: rows });
  } catch (err) {
    if (USE_MOCK_DATA) {
      return res.json({ offers: mockStore.getOffers() });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// GET /api/offers/vouchers — danh sách voucher đang hoạt động
router.get('/vouchers', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json({ vouchers: mockStore.getVouchers() });
    }

    const [rows] = await pool.query(
      'SELECT id, code, discount_type, discount_value, min_order, expiry_date, category_key FROM vouchers WHERE is_active = true ORDER BY id',
    );
    return res.json({ vouchers: rows });
  } catch (err) {
    if (USE_MOCK_DATA) {
      return res.json({ vouchers: mockStore.getVouchers() });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// POST /api/offers/vouchers/validate — kiểm tra và tính giảm giá voucher
router.post('/vouchers/validate', async (req, res) => {
  const { code, orderAmount = 0 } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Vui lòng nhập mã voucher.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const voucher = mockStore.getVoucherByCode(code);
      if (!voucher) {
        return res.status(404).json({ valid: false, message: 'Mã voucher không hợp lệ.' });
      }

      if (Number(orderAmount) < voucher.min_order) {
        return res.status(400).json({
          valid: false,
          message: `Đơn hàng tối thiểu ${Number(voucher.min_order).toLocaleString('vi-VN')}đ để dùng mã này.`,
        });
      }

      const discount =
        voucher.discount_type === 'percent'
          ? Math.round(Number(orderAmount) * voucher.discount_value / 100)
          : voucher.discount_value;

      return res.json({
        valid: true,
        code: voucher.code,
        discountType: voucher.discount_type,
        discountValue: voucher.discount_value,
        discount,
        message: `Áp dụng thành công! Giảm ${discount.toLocaleString('vi-VN')}đ`,
      });
    }

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

    if (Number(orderAmount) < voucher.min_order) {
      return res.status(400).json({
        valid: false,
        message: `Đơn hàng tối thiểu ${Number(voucher.min_order).toLocaleString('vi-VN')}đ để dùng mã này.`,
      });
    }

    const discount =
      voucher.discount_type === 'percent'
        ? Math.round(Number(orderAmount) * voucher.discount_value / 100)
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
    if (USE_MOCK_DATA) {
      const voucher = mockStore.getVoucherByCode(code);
      if (!voucher) {
        return res.status(404).json({ valid: false, message: 'Mã voucher không hợp lệ.' });
      }

      if (Number(orderAmount) < voucher.min_order) {
        return res.status(400).json({
          valid: false,
          message: `Đơn hàng tối thiểu ${Number(voucher.min_order).toLocaleString('vi-VN')}đ để dùng mã này.`,
        });
      }

      const discount =
        voucher.discount_type === 'percent'
          ? Math.round(Number(orderAmount) * voucher.discount_value / 100)
          : voucher.discount_value;

      return res.json({
        valid: true,
        code: voucher.code,
        discountType: voucher.discount_type,
        discountValue: voucher.discount_value,
        discount,
        message: `Áp dụng thành công! Giảm ${discount.toLocaleString('vi-VN')}đ`,
      });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;
