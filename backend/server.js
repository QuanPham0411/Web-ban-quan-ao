require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const app = express();
const DB_STRICT_MODE = process.env.DB_STRICT_MODE !== 'false';
const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '').toLowerCase();
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const isOriginAllowed = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin) {
        return true;
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
        return true;
    }

    if (allowedOrigins.includes(normalizedOrigin)) {
        return true;
    }

    // Always allow Vercel preview/production domains for this frontend deployment flow.
    try {
        const originUrl = new URL(normalizedOrigin);
        if (LOCAL_HOSTNAMES.has(originUrl.hostname)) {
            return true;
        }

        if (originUrl.hostname === 'vercel.app' || originUrl.hostname.endsWith('.vercel.app')) {
            return true;
        }
    } catch {
        // Ignore URL parse failures and continue checks.
    }

    // Support wildcard domains, e.g. "*.vercel.app"
    return allowedOrigins.some((allowedOrigin) => {
        if (!allowedOrigin.startsWith('*.')) {
            return false;
        }

        const suffix = allowedOrigin.slice(1); // keep leading dot
        return normalizedOrigin.endsWith(suffix);
    });
};

app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }

        // Reject CORS without turning it into a 500 Internal Server Error.
        return callback(null, false);
    },
    credentials: true,
}));
app.use(express.json({ limit: '20mb' }));

// Kiểm tra kết nối DB khi khởi động
const { pool, getDbPublicConfig } = require('./src/db');

const ensureProductQuantityColumn = async () => {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'quantity'`,
    );

    const hasQuantityColumn = Number(rows[0]?.count || 0) > 0;

    if (!hasQuantityColumn) {
        await pool.query('ALTER TABLE products ADD COLUMN quantity INT NOT NULL DEFAULT 0 AFTER stock_label');
    }

    const [updatedAtRows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'updated_at'`,
    );

    const hasUpdatedAtColumn = Number(updatedAtRows[0]?.count || 0) > 0;

    if (!hasUpdatedAtColumn) {
        await pool.query('ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    }

    await pool.query('UPDATE products SET quantity = COALESCE(quantity, 0)');
    await pool.query('UPDATE products SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)');
};

const ensureImageStorageColumns = async () => {
    const ensureMediumTextColumn = async (tableName) => {
        const [rows] = await pool.query(
            `SELECT DATA_TYPE AS data_type
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = 'image_url'
             LIMIT 1`,
            [tableName],
        );

        const currentType = String(rows[0]?.data_type || '').toLowerCase();
        if (currentType && !['mediumtext', 'longtext'].includes(currentType)) {
            await pool.query(`ALTER TABLE ${tableName} MODIFY COLUMN image_url MEDIUMTEXT NULL`);
        }
    };

    await ensureMediumTextColumn('products');
    await ensureMediumTextColumn('cart_items');
};

const ensureDecimalMoneyColumns = async () => {
    const ensureDecimalColumn = async (tableName, columnName, options = {}) => {
        const [rows] = await pool.query(
            `SELECT DATA_TYPE AS data_type, NUMERIC_PRECISION AS numeric_precision, NUMERIC_SCALE AS numeric_scale
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1`,
            [tableName, columnName],
        );

        const currentType = String(rows[0]?.data_type || '').toLowerCase();
        const currentPrecision = Number(rows[0]?.numeric_precision || 0);
        const currentScale = Number(rows[0]?.numeric_scale || 0);
        const expectedPrecision = Number(options.precision || 12);
        const expectedScale = Number(options.scale || 2);

        const needsMigration =
            currentType !== 'decimal' || currentPrecision !== expectedPrecision || currentScale !== expectedScale;

        if (!needsMigration) {
            return;
        }

        const nullableSql = options.nullable ? 'NULL' : 'NOT NULL';
        const defaultSql = Object.prototype.hasOwnProperty.call(options, 'default')
            ? ` DEFAULT ${options.default}`
            : '';

        await pool.query(
            `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} DECIMAL(${expectedPrecision},${expectedScale}) ${nullableSql}${defaultSql}`,
        );
    };

    await ensureDecimalColumn('products', 'price', { nullable: false });
    await ensureDecimalColumn('orders', 'subtotal', { nullable: false, default: '0.00' });
    await ensureDecimalColumn('orders', 'discount_amount', { nullable: false, default: '0.00' });
    await ensureDecimalColumn('orders', 'total_amount', { nullable: false, default: '0.00' });
    await ensureDecimalColumn('order_items', 'unit_price', { nullable: false });
    await ensureDecimalColumn('order_items', 'line_total', { nullable: false });
};

const buildPriceFormatted = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

const ensureProductPriceFormattedSync = async () => {
    const [rows] = await pool.query('SELECT id, price, price_formatted FROM products');

    for (const row of rows) {
        const normalized = buildPriceFormatted(row.price);
        if (String(row.price_formatted || '') !== normalized) {
            await pool.query('UPDATE products SET price_formatted = ? WHERE id = ?', [normalized, row.id]);
        }
    }
};

const ensureOrderTables = async () => {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS orders (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            order_code VARCHAR(40) NOT NULL UNIQUE,
            user_id INT NOT NULL,
            status ENUM('Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã huỷ') NOT NULL DEFAULT 'Chờ xác nhận',
            customer_name VARCHAR(150) NOT NULL,
            customer_phone VARCHAR(30) NOT NULL,
            customer_address TEXT NOT NULL,
            note TEXT,
            payment_method VARCHAR(30) NOT NULL DEFAULT 'cod',
            voucher_code VARCHAR(50),
            promotion_title VARCHAR(255),
            subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_orders_user (user_id),
            INDEX idx_orders_status (status),
            INDEX idx_orders_placed_at (placed_at)
        )`,
    );

    await pool.query(
        `CREATE TABLE IF NOT EXISTS order_items (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            order_id BIGINT NOT NULL,
            product_id VARCHAR(50) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            unit_price DECIMAL(12,2) NOT NULL,
            quantity INT NOT NULL,
            line_total DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            INDEX idx_order_items_order (order_id),
            INDEX idx_order_items_product (product_id)
        )`,
    );
};

const ensureOfferColumns = async () => {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'offers'`,
    );

    const existing = new Set(rows.map((row) => String(row.COLUMN_NAME || '')));

    if (!existing.has('discount_type')) {
        await pool.query("ALTER TABLE offers ADD COLUMN discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent' AFTER badge");
    }

    if (!existing.has('discount_value')) {
        await pool.query('ALTER TABLE offers ADD COLUMN discount_value INT NOT NULL DEFAULT 0 AFTER discount_type');
    }

    if (!existing.has('min_order')) {
        await pool.query('ALTER TABLE offers ADD COLUMN min_order INT DEFAULT 0 AFTER discount_value');
    }

    if (!existing.has('expiry_date')) {
        await pool.query('ALTER TABLE offers ADD COLUMN expiry_date DATE NULL AFTER min_order');
    }
};

const ensureAuditLogTable = async () => {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            actor_user_id INT NULL,
            actor_email VARCHAR(190),
            actor_role VARCHAR(30),
            action VARCHAR(80) NOT NULL,
            entity_type VARCHAR(80) NOT NULL,
            entity_id VARCHAR(80),
            ip_address VARCHAR(120),
            details_json JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_actor (actor_user_id),
            INDEX idx_audit_entity (entity_type, entity_id),
            INDEX idx_audit_created_at (created_at)
        )`,
    );
};

const verifyDatabaseConnection = async () => {
    const conn = await pool.getConnection();
    try {
        await conn.ping();
    } finally {
        conn.release();
    }
};

// Trang chủ
app.get('/', (req, res) => {
    res.json({ message: 'SunnyWear API đang hoạt động!', version: '2.0' });
});

app.get('/api/health/db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS now');
        return res.json({
            ok: true,
            mode: 'database',
            serverTime: rows[0]?.now || null,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mode: 'database',
            message: 'Không thể kết nối MySQL.',
        });
    }
});

// === API Routes ===
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/offers', require('./src/routes/offers'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/orders', require('./src/routes/orders'));

// Giữ tương thích link cũ để test nhanh theo BASE_API/users
app.use('/users', require('./src/routes/users'));

// Xử lý route không tồn tại
app.use((req, res) => {
    res.status(404).json({ message: 'Đường dẫn không tồn tại.' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await verifyDatabaseConnection();
        await ensureProductQuantityColumn();
        await ensureImageStorageColumns();
        await ensureOfferColumns();
        await ensureOrderTables();
        await ensureDecimalMoneyColumns();
        await ensureProductPriceFormattedSync();
        await ensureAuditLogTable();
        console.log('Kết nối MySQL thành công.', getDbPublicConfig());
    } catch (err) {
        console.error('Không thể kết nối MySQL:', err.message);

        if (DB_STRICT_MODE) {
            console.error('DB_STRICT_MODE=true nên server sẽ dừng để tránh chạy sai cấu hình.');
            process.exit(1);
        }
    }

    app.listen(PORT, () => {
        console.log(`Server SunnyWear đang chạy tại http://localhost:${PORT}`);
    });
};

startServer();
