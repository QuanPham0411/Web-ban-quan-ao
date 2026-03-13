const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const mockStore = require('../mockStore');

const router = express.Router();
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Tất cả route giỏ hàng đều yêu cầu đăng nhập
router.use(authMiddleware);

// GET /api/cart — lấy toàn bộ giỏ hàng của user
router.get('/', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json({ items: mockStore.getUserCart(req.user.id) });
    }

    const [rows] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id],
    );
    return res.json({ items: rows });
  } catch (err) {
    if (USE_MOCK_DATA) {
      return res.json({ items: mockStore.getUserCart(req.user.id) });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// POST /api/cart — thêm sản phẩm vào giỏ
router.post('/', async (req, res) => {
  const { productId, productName, priceFormatted, imageUrl, quantity = 1 } = req.body;

  if (!productId || !productName) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm.' });
  }
  if (quantity < 1) {
    return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const result = mockStore.addToCart(req.user.id, { productId, productName, priceFormatted, imageUrl, quantity });
      if (result.updated) {
        return res.json({ message: 'Đã cập nhật số lượng trong giỏ hàng.', cartItemId: result.item.id });
      }
      return res.status(201).json({ message: 'Đã thêm vào giỏ hàng.', cartItemId: result.item.id });
    }

    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId],
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      return res.json({ message: 'Đã cập nhật số lượng trong giỏ hàng.', cartItemId: existing[0].id });
    }

    const [result] = await pool.query(
      'INSERT INTO cart_items (user_id, product_id, product_name, price_formatted, image_url, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, productId, productName, priceFormatted || '', imageUrl || '', Number(quantity)],
    );

    return res.status(201).json({ message: 'Đã thêm vào giỏ hàng.', cartItemId: result.insertId });
  } catch (err) {
    if (USE_MOCK_DATA) {
      const result = mockStore.addToCart(req.user.id, { productId, productName, priceFormatted, imageUrl, quantity });
      if (result.updated) {
        return res.json({ message: 'Đã cập nhật số lượng trong giỏ hàng.', cartItemId: result.item.id });
      }
      return res.status(201).json({ message: 'Đã thêm vào giỏ hàng.', cartItemId: result.item.id });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// PUT /api/cart/:id — cập nhật số lượng
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || Number(quantity) < 1) {
    return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
  }

  try {
    if (USE_MOCK_DATA) {
      const updated = mockStore.updateCartItem(req.user.id, req.params.id, quantity);
      if (!updated) {
        return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
      }
      return res.json({ message: 'Đã cập nhật số lượng.' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
    }

    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [Number(quantity), req.params.id]);
    return res.json({ message: 'Đã cập nhật số lượng.' });
  } catch (err) {
    if (USE_MOCK_DATA) {
      const updated = mockStore.updateCartItem(req.user.id, req.params.id, quantity);
      if (!updated) {
        return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
      }
      return res.json({ message: 'Đã cập nhật số lượng.' });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// DELETE /api/cart/:id — xóa khỏi giỏ
router.delete('/:id', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const removed = mockStore.removeCartItem(req.user.id, req.params.id);
      if (!removed) {
        return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
      }
      return res.json({ message: 'Đã xóa khỏi giỏ hàng.' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
    }

    await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Đã xóa khỏi giỏ hàng.' });
  } catch (err) {
    if (USE_MOCK_DATA) {
      const removed = mockStore.removeCartItem(req.user.id, req.params.id);
      if (!removed) {
        return res.status(404).json({ message: 'Không tìm thấy mục trong giỏ hàng.' });
      }
      return res.json({ message: 'Đã xóa khỏi giỏ hàng.' });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// DELETE /api/cart — xóa toàn bộ giỏ hàng
router.delete('/', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      mockStore.clearCart(req.user.id);
      return res.json({ message: 'Đã xóa toàn bộ giỏ hàng.' });
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'Đã xóa toàn bộ giỏ hàng.' });
  } catch (err) {
    if (USE_MOCK_DATA) {
      mockStore.clearCart(req.user.id);
      return res.json({ message: 'Đã xóa toàn bộ giỏ hàng.' });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;
