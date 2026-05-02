/**
 * src/middlewares/authenticate.js
 * Middleware de autenticação via JWT (HU-009, HU-010, HU-011).
 */

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

    // Verifica se o token está na blacklist (logout)
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

    // Verifica se o admin ainda está ativo
    const adminResult = await query(
      'SELECT id, name, email, role FROM admins WHERE id = $1 AND is_active = TRUE',
      [decoded.id]
    );
    if (adminResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo.',
      });
    }

    req.user = { ...decoded, ...adminResult.rows[0] };
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
