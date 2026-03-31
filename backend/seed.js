const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function seedDatabase() {
  const pool = mysql.createPool(config);

  try {
    console.log('🌱 Bắt đầu seeding database...');

    // Kiểm tra nếu users table đã có role column
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role' 
      AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      console.log('⚙️  Thêm role column vào users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('admin', 'customer', 'staff') NOT NULL DEFAULT 'customer' AFTER password_hash
      `);
      console.log('✅ Đã thêm role column');

      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER role
      `);
      console.log('✅ Đã thêm is_active column');

      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN last_login TIMESTAMP NULL AFTER is_active
      `);
      console.log('✅ Đã thêm last_login column');

      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);
      console.log('✅ Đã thêm updated_at column');

      await pool.query(`
        ALTER TABLE users 
        ADD INDEX idx_email (email),
        ADD INDEX idx_role (role),
        ADD INDEX idx_is_active (is_active)
      `);
      console.log('✅ Đã thêm indexes');
    } else {
      console.log('ℹ️  Users table đã có role column');
    }

    // Demo users
    const demoUsers = [
      {
        id: 1,
        full_name: 'Admin Nghĩa',
        email: 'admin@sunnywear.com',
        phone: '0901234567',
        role: 'admin',
      },
      {
        id: 2,
        full_name: 'Admin Thành',
        email: 'admin2@sunnywear.com',
        phone: '0901234568',
        role: 'admin',
      },
      {
        id: 3,
        full_name: 'Nguyễn Văn A',
        email: 'customer1@example.com',
        phone: '0987654321',
        role: 'customer',
      },
      {
        id: 4,
        full_name: 'Trần Thị B',
        email: 'customer2@example.com',
        phone: '0987654322',
        role: 'customer',
      },
      {
        id: 5,
        full_name: 'Lê Minh C',
        email: 'customer3@example.com',
        phone: '0987654323',
        role: 'customer',
      },
    ];

    const defaultPassword = '123456';
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

    console.log('👥 Xóa dữ liệu users cũ...');
    await pool.query('DELETE FROM cart_items WHERE user_id > 0');
    await pool.query('DELETE FROM users WHERE id > 0');
    console.log('✅ Đã xóa dữ liệu cũ');

    console.log('➕ Thêm demo users...');
    for (const user of demoUsers) {
      try {
        await pool.query(
          `INSERT INTO users (id, full_name, email, phone, password_hash, role, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.full_name, user.email, user.phone, defaultPasswordHash, user.role, true],
        );
        console.log(`  ✅ ${user.full_name} (${user.role})`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ℹ️  ${user.full_name} đã tồn tại, bỏ qua`);
        } else {
          throw err;
        }
      }
    }

    console.log('🔧 Cập nhật AUTO_INCREMENT...');
    await pool.query('ALTER TABLE users AUTO_INCREMENT = 1000');
    console.log('✅ Cập nhật AUTO_INCREMENT thành 1000');

    console.log('\n✨ Seeding hoàn thành!');
    console.log('\n📝 Demo Admin Accounts:');
    demoUsers.filter(u => u.role === 'admin').forEach(u => {
      console.log(`  • Email: ${u.email}, Password: ${defaultPassword}, Role: ${u.role}`);
    });

    console.log('\n📝 Demo Customer Accounts:');
    demoUsers.filter(u => u.role === 'customer').forEach(u => {
      console.log(`  • Email: ${u.email}, Password: ${defaultPassword}, Role: ${u.role}`);
    });

  } catch (err) {
    console.error('❌ Lỗi seeding:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
