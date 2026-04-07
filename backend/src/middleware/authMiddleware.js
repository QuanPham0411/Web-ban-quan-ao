const jwt = require('jsonwebtoken');

const JWT_SECRET = String(process.env.JWT_SECRET || '').trim() || (process.env.NODE_ENV !== 'production' ? 'sunnywear_secret_key' : '');

function authMiddleware(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server thiếu cấu hình bảo mật JWT_SECRET.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

module.exports = authMiddleware;
