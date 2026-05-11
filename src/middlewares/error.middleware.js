function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
  }

  const status = err && err.status && Number.isInteger(err.status) ? err.status : 500;
  const message =
    status === 500
      ? 'Error interno del servidor'
      : err.message || 'Error en la petición';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
