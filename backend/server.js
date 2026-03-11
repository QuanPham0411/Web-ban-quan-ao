require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Bắt buộc để đọc dữ liệu từ Body (JSON)

// Sử dụng Pool để quản lý kết nối hiệu quả hơn trên môi trường Cloud (Aiven/Render)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 1. Trang chủ (Tránh lỗi Cannot GET /)
app.get('/', (req, res) => {
    res.send("Backend quản lý người dùng - Nhóm STU đang hoạt động!");
});

// 2. READ: Lấy danh sách toàn bộ người dùng
app.get('/users', (req, res) => {
    const q = "SELECT * FROM users";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json({ error: "Lỗi truy vấn: " + err.message });
        return res.json(data);
    });
});

// 3. CREATE: Thêm một người dùng mới
app.post('/users', (req, res) => {
    const { name, email, phone } = req.body;
    const q = "INSERT INTO users (name, email, phone) VALUES (?, ?, ?)";
    db.query(q, [name, email, phone], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi thêm dữ liệu: " + err.message });
        return res.status(201).json({ message: "Đã thêm người dùng thành công!", id: result.insertId });
    });
});

// 4. UPDATE: Cập nhật thông tin người dùng theo ID
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email, phone } = req.body;
    const q = "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?";
    db.query(q, [name, email, phone, userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi cập nhật: " + err.message });
        return res.json({ message: "Đã cập nhật thông tin thành công!" });
    });
});

// 5. DELETE: Xóa người dùng theo ID
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM users WHERE id = ?";
    db.query(q, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi xóa dữ liệu: " + err.message });
        return res.json({ message: "Đã xóa người dùng thành công!" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy mượt mà tại port ${PORT}`);
});
DAHDUKAHDKUABKUFAGFAFHA