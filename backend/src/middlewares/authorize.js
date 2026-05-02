/**
 * Retorna um middleware que verifica se o usuário autenticado possui
 * um dos papéis permitidos.
 *
 * @param {...string} roles - Papéis permitidos, ex: 'admin'
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Você não tem permissão para esta operação.',
      });
    }

    next();
  };
}

module.exports = authorize;
