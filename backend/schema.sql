CREATE DATABASE IF NOT EXISTS defaultdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE defaultdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer', 'staff') NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  category_key VARCHAR(50) NOT NULL,
  category_label VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  price_formatted VARCHAR(50) NOT NULL,
  description TEXT,
  image_url MEDIUMTEXT,
  size_label VARCHAR(100),
  stock_label VARCHAR(100),
  quantity INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  badge VARCHAR(100),
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value INT NOT NULL DEFAULT 0,
  min_order INT DEFAULT 0,
  expiry_date DATE NULL,
  expire_text VARCHAR(120),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'fixed') NOT NULL,
  discount_value INT NOT NULL,
  min_order INT DEFAULT 0,
  category_key VARCHAR(50) DEFAULT 'all',
  expiry_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price_formatted VARCHAR(50),
  image_url MEDIUMTEXT,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
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
);

CREATE TABLE IF NOT EXISTS order_items (
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
);

CREATE TABLE IF NOT EXISTS audit_logs (
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
);
