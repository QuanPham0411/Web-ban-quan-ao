require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const app = express();
const DB_STRICT_MODE = process.env.DB_STRICT_MODE !== 'false';
const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '').toLowerCase();

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

        return callback(new Error(`Origin ${origin} không được phép bởi CORS.`));
    },
    credentials: true,
}));
app.use(express.json());

// Kiểm tra kết nối DB khi khởi động
const { pool, getDbPublicConfig } = require('./src/db');

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
            db: getDbPublicConfig(),
            serverTime: rows[0]?.now || null,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mode: 'database',
            db: getDbPublicConfig(),
            message: 'Không thể kết nối MySQL.',
            error: err.message,
        });
    }
});

// === API Routes ===
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/offers', require('./src/routes/offers'));
app.use('/api/users', require('./src/routes/users'));

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
