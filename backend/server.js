require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình kết nối tới Aiven MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Bắt buộc để kết nối tới Aiven
    }
});

db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối Database: ', err);
        return;
    }
    console.log('Đã kết nối thành công tới MySQL trên Aiven!');
});

// API lấy danh sách người dùng (Mục số 2 yêu cầu của thầy)
app.get('/users', (req, res) => {
    const q = "SELECT * FROM users";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json({ error: "Lỗi truy vấn database" });
        return res.json(data);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});