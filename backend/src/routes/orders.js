const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { parseBody, orderStatusSchema, orderCreateSchema } = require('../validation/schemas');
const { logAdminAction } = require('../utils/auditLogger');

const router = express.Router();

const PHONE_REGEX = /^0\d{9}$/;
const ALLOWED_STATUSES = new Set(['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã huỷ']);

const getClientIp = (req) => {
  const xff = String(req.headers['x-forwarded-for'] || '').trim();
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return String(req.ip || req.connection?.remoteAddress || 'unknown');
};

const parseSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.round(parsed);
};

const getStockLabelByQuantity = (quantity) => {
  const qty = Math.max(0, Number(quantity || 0));
  if (qty <= 3) return 'Sắp cháy hàng';
  if (qty <= 8) return 'Sắp hết hàng';
  if (qty >= 100) return 'Bán chạy';
  return 'Còn hàng';
};

const isAdminOrStaff = (req) => {
  const role = String(req.user?.role || '').toLowerCase();
  return role === 'admin' || role === 'staff';
};

const requireAdminOrStaff = (req, res, next) => {
  if (!isAdminOrStaff(req)) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này.' });
  }
  return next();
};

const normalizeOrderRow = (row) => ({
  id: Number(row.id),
  orderCode: String(row.order_code || ''),
  userId: Number(row.user_id),
  status: String(row.status || 'Chờ xác nhận'),
  customerName: String(row.customer_name || ''),
  customerPhone: String(row.customer_phone || ''),
  customerAddress: String(row.customer_address || ''),
  note: String(row.note || ''),
  paymentMethod: String(row.payment_method || 'cod'),
  voucherCode: String(row.voucher_code || ''),
  promotionTitle: String(row.promotion_title || ''),
  subtotal: Number(row.subtotal || 0),
  discountAmount: Number(row.discount_amount || 0),
  totalAmount: Number(row.total_amount || 0),
  placedAt: row.placed_at || null,
  updatedAt: row.updated_at || null,
});

const normalizeOrderItemRow = (row) => ({
  id: Number(row.id),
  orderId: Number(row.order_id),
  productId: String(row.product_id || ''),
  productName: String(row.product_name || ''),
  unitPrice: Number(row.unit_price || 0),
  quantity: Number(row.quantity || 0),
  lineTotal: Number(row.line_total || 0),
});

const attachItemsToOrders = (orders, itemRows) => {
  const bucket = new Map();
  for (const order of orders) {
    bucket.set(order.id, []);
  }

  for (const row of itemRows) {
    const normalized = normalizeOrderItemRow(row);
    const target = bucket.get(normalized.orderId);
    if (target) {
      target.push(normalized);
    }
  }

  return orders.map((order) => ({ ...order, items: bucket.get(order.id) || [] }));
};

const createOrderCode = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
};

router.use(authMiddleware);

// POST /api/orders - tạo đơn từ giỏ hàng hiện tại (transaction)
router.post('/', async (req, res) => {
  const parsed = parseBody(orderCreateSchema, {
    fullName: req.body?.fullName,
    phone: String(req.body?.phone || '').replace(/\D/g, ''),
    address: req.body?.address,
    note: req.body?.note,
    paymentMethod: req.body?.paymentMethod,
    voucherCode: String(req.body?.voucherCode || '').trim().toUpperCase(),
    promotionTitle: req.body?.promotionTitle,
    discountAmount: Math.max(0, parseSafeNumber(req.body?.discountAmount || 0, 0)),
  });

  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }

  const payload = parsed.data;
  const customerName = payload.fullName;
  const customerPhone = payload.phone;
  const customerAddress = payload.address;
  const note = payload.note;
  const paymentMethod = payload.paymentMethod;
  const voucherCode = payload.voucherCode;
  const promotionTitle = payload.promotionTitle;
  const requestedDiscount = payload.discountAmount;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.query(
      'SELECT id, product_id, product_name, quantity FROM cart_items WHERE user_id = ? FOR UPDATE',
      [req.user.id],
    );

    if (!Array.isArray(cartRows) || cartRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Giỏ hàng đang trống.' });
    }

    const productIds = [...new Set(cartRows.map((item) => String(item.product_id || '').trim()).filter(Boolean))];
    if (productIds.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Giỏ hàng không hợp lệ.' });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const [productRows] = await conn.query(
      `SELECT id, name, price, quantity, is_active FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds,
    );

    const productMap = new Map(productRows.map((item) => [String(item.id), item]));
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cartRows) {
      const productId = String(cartItem.product_id || '');
      const product = productMap.get(productId);
      const qty = Number(cartItem.quantity || 0);

      if (!product || !Boolean(product.is_active)) {
        await conn.rollback();
        return res.status(400).json({ message: `Sản phẩm ${productId} không còn khả dụng.` });
      }

      if (!Number.isInteger(qty) || qty < 1) {
        await conn.rollback();
        return res.status(400).json({ message: 'Số lượng sản phẩm trong giỏ không hợp lệ.' });
      }

      const available = Number(product.quantity || 0);
      if (available < qty) {
        await conn.rollback();
        return res.status(400).json({
          message: `Sản phẩm ${product.name || productId} chỉ còn ${available} trong kho, không đủ cho số lượng đặt.`,
        });
      }

      const unitPrice = Math.max(0, parseSafeNumber(product.price, 0));
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      orderItems.push({
        productId,
        productName: String(product.name || cartItem.product_name || productId),
        unitPrice,
        quantity: qty,
        lineTotal,
        nextQuantity: available - qty,
      });
    }

    const discountAmount = Math.min(requestedDiscount, subtotal);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderCode = createOrderCode();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (
        order_code, user_id, status, customer_name, customer_phone, customer_address,
        note, payment_method, voucher_code, promotion_title, subtotal, discount_amount, total_amount
      ) VALUES (?, ?, 'Chờ xác nhận', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        req.user.id,
        customerName,
        customerPhone,
        customerAddress,
        note,
        paymentMethod,
        voucherCode,
        promotionTitle,
        subtotal,
        discountAmount,
        totalAmount,
      ],
    );

    const orderId = Number(orderResult.insertId);

    const itemPlaceholders = orderItems.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
    const itemParams = orderItems.flatMap((item) => [
      orderId,
      item.productId,
      item.productName,
      item.unitPrice,
      item.quantity,
      item.lineTotal,
    ]);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES ${itemPlaceholders}`,
      itemParams,
    );

    for (const item of orderItems) {
      await conn.query(
        'UPDATE products SET quantity = ?, stock_label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.nextQuantity, getStockLabelByQuantity(item.nextQuantity), item.productId],
      );
    }

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    const [orderRows] = await pool.query(
      `SELECT id, order_code, user_id, status, customer_name, customer_phone, customer_address,
              note, payment_method, voucher_code, promotion_title, subtotal, discount_amount,
              total_amount, placed_at, updated_at
       FROM orders WHERE id = ?`,
      [orderId],
    );

    const [itemRows] = await pool.query(
      'SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id',
      [orderId],
    );

    const order = normalizeOrderRow(orderRows[0]);
    return res.status(201).json({
      message: 'Đặt hàng thành công.',
      order: {
        ...order,
        items: itemRows.map(normalizeOrderItemRow),
      },
    });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ message: 'Không thể tạo đơn hàng. Vui lòng thử lại sau.' });
  } finally {
    conn.release();
  }
});

// GET /api/orders/my - đơn hàng của user hiện tại
router.get('/my', async (req, res) => {
  try {
    const [orderRows] = await pool.query(
      `SELECT id, order_code, user_id, status, customer_name, customer_phone, customer_address,
              note, payment_method, voucher_code, promotion_title, subtotal, discount_amount,
              total_amount, placed_at, updated_at
       FROM orders WHERE user_id = ?
       ORDER BY placed_at DESC, id DESC`,
      [req.user.id],
    );

    const orders = orderRows.map(normalizeOrderRow);
    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((order) => order.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const [itemRows] = await pool.query(
      `SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id IN (${placeholders})
       ORDER BY id`,
      orderIds,
    );

    return res.json({ orders: attachItemsToOrders(orders, itemRows) });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/orders - danh sách đơn cho admin/staff
router.get('/', requireAdminOrStaff, async (req, res) => {
  const parsedLimit = Number(req.query?.limit || 50);
  const parsedPage = Number(req.query?.page || 1);
  const safeLimit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
  const safePage = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const offset = (safePage - 1) * safeLimit;
  const statusFilter = String(req.query?.status || '').trim();
  const search = String(req.query?.search || '').trim();
  const sortByRaw = String(req.query?.sortBy || 'placed_at').trim().toLowerCase();
  const sortOrderRaw = String(req.query?.sortOrder || 'desc').trim().toLowerCase();
  const sortByMap = {
    placed_at: 'placed_at',
    total_amount: 'total_amount',
    status: 'status',
    customer_name: 'customer_name',
  };
  const sortBy = sortByMap[sortByRaw] || 'placed_at';
  const sortOrder = sortOrderRaw === 'asc' ? 'ASC' : 'DESC';

  try {
    let listQuery =
      `SELECT id, order_code, user_id, status, customer_name, customer_phone, customer_address,
              note, payment_method, voucher_code, promotion_title, subtotal, discount_amount,
              total_amount, placed_at, updated_at
       FROM orders`;
    let countQuery = 'SELECT COUNT(*) AS total FROM orders';
    const params = [];
    const countParams = [];

    if (statusFilter) {
      listQuery += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(statusFilter);
      countParams.push(statusFilter);
    }

    if (search) {
      listQuery += statusFilter ? ' AND' : ' WHERE';
      countQuery += statusFilter ? ' AND' : ' WHERE';
      listQuery += ' (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      countQuery += ' (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue);
      countParams.push(searchValue, searchValue, searchValue);
    }

    listQuery += ` ORDER BY ${sortBy} ${sortOrder}, id DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const [rows] = await pool.query(listQuery, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    const orders = rows.map(normalizeOrderRow);
    if (orders.length === 0) {
      return res.json({ orders: [], total: Number(total || 0), page: safePage, limit: safeLimit });
    }

    const orderIds = orders.map((order) => order.id);
    const itemPlaceholders = orderIds.map(() => '?').join(',');
    const [itemRows] = await pool.query(
      `SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id IN (${itemPlaceholders})
       ORDER BY id`,
      orderIds,
    );

    return res.json({
      orders: attachItemsToOrders(orders, itemRows),
      total: Number(total || 0),
      page: safePage,
      limit: safeLimit,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// GET /api/orders/:id - chi tiết đơn (owner hoặc admin/staff)
router.get('/:id', async (req, res) => {
  const orderId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(orderId) || orderId < 1) {
    return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, order_code, user_id, status, customer_name, customer_phone, customer_address,
              note, payment_method, voucher_code, promotion_title, subtotal, discount_amount,
              total_amount, placed_at, updated_at
       FROM orders WHERE id = ? LIMIT 1`,
      [orderId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    const order = normalizeOrderRow(rows[0]);
    if (!isAdminOrStaff(req) && order.userId !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
    }

    const [itemRows] = await pool.query(
      'SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id',
      [orderId],
    );

    return res.json({ order: { ...order, items: itemRows.map(normalizeOrderItemRow) } });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// PUT /api/orders/:id/cancel - khách hủy đơn của chính mình
router.put('/:id/cancel', async (req, res) => {
  const orderId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(orderId) || orderId < 1) {
    return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      'SELECT id, user_id, status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
      [orderId],
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    const order = orderRows[0];
    if (Number(order.user_id) !== Number(req.user.id)) {
      await conn.rollback();
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    const currentStatus = String(order.status || 'Chờ xác nhận');
    if (currentStatus === 'Đã huỷ') {
      await conn.commit();
      return res.json({ message: 'Đơn hàng đã ở trạng thái hủy.' });
    }

    if (currentStatus === 'Đã giao') {
      await conn.rollback();
      return res.status(400).json({ message: 'Đơn hàng đã giao không thể hủy.' });
    }

    const [itemRows] = await conn.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ? FOR UPDATE',
      [orderId],
    );

    for (const item of itemRows) {
      const productId = String(item.product_id || '');
      const qty = Number(item.quantity || 0);
      if (!productId || qty <= 0) {
        continue;
      }

      const [productRows] = await conn.query(
        'SELECT id, quantity FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
        [productId],
      );

      if (productRows.length === 0) {
        continue;
      }

      const nextQuantity = Number(productRows[0].quantity || 0) + qty;
      await conn.query(
        'UPDATE products SET quantity = ?, stock_label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextQuantity, getStockLabelByQuantity(nextQuantity), productId],
      );
    }

    await conn.query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['Đã huỷ', orderId]);
    await conn.commit();

    return res.json({ message: 'Đã hủy đơn hàng thành công.', status: 'Đã huỷ' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ message: 'Không thể hủy đơn hàng. Vui lòng thử lại sau.' });
  } finally {
    conn.release();
  }
});

// PUT /api/orders/:id/status - admin/staff cập nhật trạng thái
router.put('/:id/status', requireAdminOrStaff, async (req, res) => {
  const orderId = Number.parseInt(req.params.id, 10);
  const parsed = parseBody(orderStatusSchema, {
    status: req.body?.status,
  });

  if (Number.isNaN(orderId) || orderId < 1) {
    return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
  }

  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }

  const nextStatus = parsed.data.status;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
      [orderId],
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    const currentStatus = String(orderRows[0].status || 'Chờ xác nhận');

    if (currentStatus === nextStatus) {
      await conn.commit();
      return res.json({ message: 'Trạng thái đơn hàng không thay đổi.' });
    }

    if (currentStatus === 'Đã huỷ' && nextStatus !== 'Đã huỷ') {
      await conn.rollback();
      return res.status(400).json({ message: 'Đơn đã huỷ không thể chuyển lại trạng thái khác.' });
    }

    if (nextStatus === 'Đã huỷ' && currentStatus !== 'Đã huỷ') {
      const [itemRows] = await conn.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ? FOR UPDATE',
        [orderId],
      );

      for (const item of itemRows) {
        const productId = String(item.product_id || '');
        const qty = Number(item.quantity || 0);
        if (!productId || qty <= 0) {
          continue;
        }

        const [productRows] = await conn.query(
          'SELECT id, quantity FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
          [productId],
        );

        if (productRows.length === 0) {
          continue;
        }

        const nextQuantity = Number(productRows[0].quantity || 0) + qty;
        await conn.query(
          'UPDATE products SET quantity = ?, stock_label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [nextQuantity, getStockLabelByQuantity(nextQuantity), productId],
        );
      }
    }

    await conn.query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextStatus, orderId]);

    await logAdminAction({
      actor: req.user,
      action: 'update_order_status',
      entityType: 'order',
      entityId: String(orderId),
      ip: getClientIp(req),
      details: { fromStatus: currentStatus, toStatus: nextStatus },
      connection: conn,
    });

    await conn.commit();

    return res.json({ message: 'Đã cập nhật trạng thái đơn hàng.', status: nextStatus });
  } catch (err) {
    console.error('update_order_status failed:', err);
    await conn.rollback();
    return res.status(500).json({ message: 'Không thể cập nhật trạng thái đơn hàng.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/orders/:id - admin/staff xóa đơn đã hủy
router.delete('/:id', requireAdminOrStaff, async (req, res) => {
  const orderId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(orderId) || orderId < 1) {
    return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, status FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (String(rows[0].status || '') !== 'Đã huỷ') {
      return res.status(400).json({ message: 'Chỉ có thể xóa đơn ở trạng thái Đã huỷ.' });
    }

    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);

    await logAdminAction({
      actor: req.user,
      action: 'delete_order',
      entityType: 'order',
      entityId: String(orderId),
      ip: getClientIp(req),
      details: { status: 'Đã huỷ' },
    });

    return res.json({ message: 'Đã xóa đơn hàng.' });
  } catch (err) {
    return res.status(500).json({ message: 'Không thể xóa đơn hàng. Vui lòng thử lại sau.' });
  }
});

module.exports = router;