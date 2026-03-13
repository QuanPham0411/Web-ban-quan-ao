require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const DB_STRICT_MODE = process.env.DB_STRICT_MODE !== 'false';
const allowedOrigins = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
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
    if (USE_MOCK_DATA) {
        return res.json({
            ok: true,
            mode: 'mock',
            db: null,
            message: 'Backend đang chạy với mock data.',
        });
    }

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
    if (!USE_MOCK_DATA) {
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
    } else {
        console.log('Đang chạy ở chế độ mock data (USE_MOCK_DATA=true).');
    }

    app.listen(PORT, () => {
        console.log(`Server SunnyWear đang chạy tại http://localhost:${PORT}`);
    });
};

startServer();
