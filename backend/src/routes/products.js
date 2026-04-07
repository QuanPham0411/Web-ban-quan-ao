const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/products?category=all|women|men|kids|intimates&page=1&limit=50
router.get('/', async (req, res) => {
  const { category, page = 1, limit = 50 } = req.query;
  const parsedLimit = Number(limit);
  const parsedPage = Number(page);
  const safeLimit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
  const safePage = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const offset = (safePage - 1) * safeLimit;

  try {
    let query = 'SELECT * FROM products';
    const params = [];

    if (category && category !== 'all') {
      if (category === 'women') {
        query += ' WHERE category_key IN (?, ?)';
        params.push('women', 'intimates');
      } else {
        query += ' WHERE category_key = ?';
        params.push(category);
      }
    }

    query += ' ORDER BY id LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) AS total FROM products';
    const countParams = [];
    if (category && category !== 'all') {
      if (category === 'women') {
        countQuery += ' WHERE category_key IN (?, ?)';
        countParams.push('women', 'intimates');
      } else {
        countQuery += ' WHERE category_key = ?';
        countParams.push(category);
      }
    }
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return res.json({ products: rows, total, page: safePage, limit: safeLimit });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
