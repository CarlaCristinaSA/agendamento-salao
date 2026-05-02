function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err);

  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: err.details ? err.details[0].message : err.message,
    });
  }

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

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Erro interno do servidor.';

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Erro interno do servidor.' : message,
  });
}

module.exports = errorHandler;
