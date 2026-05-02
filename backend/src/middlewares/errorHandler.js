/**
 * src/middlewares/errorHandler.js
 * Handler centralizado de erros da aplicação.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log do erro no servidor
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err);

  // Erro de validação Joi
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: err.details ? err.details[0].message : err.message,
    });
  }

  // Erro de constraint do PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Registro duplicado. Verifique os dados informados.',
    });
  }

  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      error: 'Referência inválida. O registro relacionado não existe.',
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Erro interno do servidor.';

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Erro interno do servidor.' : message,
  });
}

module.exports = errorHandler;
