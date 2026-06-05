const jwt  = require('jsonwebtoken');
const { query } = require('../config/database');

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. Token não informado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const blacklisted = await query(
      'SELECT id FROM token_blacklist WHERE token_jti = $1',
      [decoded.jti]
    );
    if (blacklisted.rowCount > 0) {
      return res.status(401).json({
        success: false,
        error: 'Sessão encerrada. Faça login novamente.',
      });
    }

    const userResult = await query(
      'SELECT id, name, email, phone, role FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.id]
    );
    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo.',
      });
    }

    const user = userResult.rows[0];

    req.user = {
      id:    user.id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      jti:   decoded.jti,
      exp:   decoded.exp,
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token inválido.',
    });
  }
}

module.exports = authenticate;
