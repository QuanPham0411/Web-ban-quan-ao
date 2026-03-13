require('dotenv').config();
const { pool, getDbPublicConfig } = require('../db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now, VERSION() AS version');
    console.log('DB_CHECK_OK');
    console.log({
      config: getDbPublicConfig(),
      serverTime: rows[0]?.now || null,
      version: rows[0]?.version || null,
    });
    process.exit(0);
  } catch (err) {
    console.error('DB_CHECK_FAIL');
    console.error({
      config: getDbPublicConfig(),
      error: err.message,
      code: err.code || null,
    });
    process.exit(1);
  }
})();
