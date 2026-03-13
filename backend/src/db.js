require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'undefined') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

const buildSslConfig = () => {
  const host = process.env.DB_HOST || '';
  const isAivenHost = host.includes('aivencloud.com');
  const sslEnabled = parseBoolean(process.env.DB_SSL, isAivenHost);

  if (!sslEnabled) {
    return false;
  }

  const sslMode = String(process.env.DB_SSL_MODE || (isAivenHost ? 'required' : 'verify-ca')).toLowerCase();
  const sslConfig = {
    rejectUnauthorized: sslMode !== 'required',
  };

  if (process.env.DB_CA_PATH) {
    const resolvedPath = path.isAbsolute(process.env.DB_CA_PATH)
      ? process.env.DB_CA_PATH
      : path.resolve(__dirname, '..', process.env.DB_CA_PATH);
    if (fs.existsSync(resolvedPath)) {
      sslConfig.ca = fs.readFileSync(resolvedPath, 'utf8');
    }
  }

  if (!sslConfig.ca && process.env.DB_CA_CERT_BASE64) {
    sslConfig.ca = Buffer.from(process.env.DB_CA_CERT_BASE64, 'base64').toString('utf8');
  }

  return sslConfig;
};

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sunnywear',
  port: Number(process.env.DB_PORT) || 3306,
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

const pool = mysql.createPool(dbConfig);

const getDbPublicConfig = () => ({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: dbConfig.ssl ? { enabled: true, rejectUnauthorized: dbConfig.ssl.rejectUnauthorized } : { enabled: false },
});

module.exports = { pool, getDbPublicConfig };
