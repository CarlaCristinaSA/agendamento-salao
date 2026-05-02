/**
 * src/controllers/serviceController.js
 * Gestão do catálogo de serviços (EP-001).
 * HU-001, HU-002, HU-003, HU-004 — RN-001, RN-004, RN-008.
 */

const { query } = require('../config/database');
const { createServiceSchema, updateServiceSchema } = require('../validations/serviceValidation');

// -----------------------------------------------------------------------
// POST /api/admin/services  (HU-001 — Cadastrar Serviço)
// -----------------------------------------------------------------------
async function createService(req, res) {
  const { error, value } = createServiceSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { name, duration_minutes, price } = value;
  const trimmedName = name.trim();

  // Verifica duplicidade de nome (case-insensitive, RN-001)
  const dup = await query(
    'SELECT id FROM services WHERE LOWER(TRIM(name)) = LOWER($1)',
    [trimmedName]
  );
  if (dup.rowCount > 0) {
    return res.status(409).json({
      success: false,
      error: `Já existe um serviço cadastrado com o nome "${trimmedName}".`,
    });
  }

  const result = await query(
    `INSERT INTO services (name, duration_minutes, price, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING id, name, duration_minutes, price, status, created_at`,
    [trimmedName, duration_minutes, price]
  );

  return res.status(201).json({
    success: true,
    message: 'Serviço cadastrado com sucesso.',
    data: result.rows[0],
  });
}

// -----------------------------------------------------------------------
// GET /api/admin/services  (HU-002 — Listar Serviços — todos para admin)
// -----------------------------------------------------------------------
async function listServices(req, res) {
  const { sort = 'asc', status } = req.query;
  const sortDir = sort === 'desc' ? 'DESC' : 'ASC';

  const conditions = [];
  const params     = [];

  if (status === 'active' || status === 'inactive') {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT id, name, duration_minutes, price, status, created_at, updated_at
       FROM services
       ${where}
      ORDER BY name ${sortDir}`,
    params
  );

  return res.status(200).json({
    success: true,
    data: result.rows,
    total: result.rowCount,
  });
}

// -----------------------------------------------------------------------
// GET /api/public/services  (HU-006 — apenas serviços ATIVOS para o cliente)
// -----------------------------------------------------------------------
async function listActiveServices(req, res) {
  const result = await query(
    `SELECT id, name, duration_minutes, price
       FROM services
      WHERE status = 'active'
      ORDER BY name ASC`
  );

  return res.status(200).json({
    success: true,
    data: result.rows,
    total: result.rowCount,
  });
}

// -----------------------------------------------------------------------
// GET /api/admin/services/:id
// -----------------------------------------------------------------------
async function getServiceById(req, res) {
  const { id } = req.params;

  const result = await query(
    'SELECT id, name, duration_minutes, price, status, created_at, updated_at FROM services WHERE id = $1',
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Serviço não encontrado.' });
  }

  return res.status(200).json({ success: true, data: result.rows[0] });
}

// -----------------------------------------------------------------------
// PUT /api/admin/services/:id  (HU-003 — Editar Serviço)
// -----------------------------------------------------------------------
async function updateService(req, res) {
  const { id } = req.params;

  // Verifica existência
  const existing = await query('SELECT id FROM services WHERE id = $1', [id]);
  if (existing.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Serviço não encontrado.' });
  }

  const { error, value } = updateServiceSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { name, duration_minutes, price } = value;
  const trimmedName = name.trim();

  // Verifica duplicidade (case-insensitive), excluindo o próprio serviço (RN-001)
  const dup = await query(
    'SELECT id FROM services WHERE LOWER(TRIM(name)) = LOWER($1) AND id <> $2',
    [trimmedName, id]
  );
  if (dup.rowCount > 0) {
    return res.status(409).json({
      success: false,
      error: `Já existe outro serviço cadastrado com o nome "${trimmedName}".`,
    });
  }

  const result = await query(
    `UPDATE services
        SET name = $1, duration_minutes = $2, price = $3
      WHERE id = $4
    RETURNING id, name, duration_minutes, price, status, updated_at`,
    [trimmedName, duration_minutes, price, id]
  );

  return res.status(200).json({
    success: true,
    message: 'Serviço atualizado com sucesso.',
    data: result.rows[0],
  });
}

// -----------------------------------------------------------------------
// PATCH /api/admin/services/:id/toggle-status  (HU-004 — Ativar/Desativar)
// -----------------------------------------------------------------------
async function toggleServiceStatus(req, res) {
  const { id } = req.params;

  const existing = await query(
    'SELECT id, name, status FROM services WHERE id = $1',
    [id]
  );
  if (existing.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Serviço não encontrado.' });
  }

  const service    = existing.rows[0];
  const newStatus  = service.status === 'active' ? 'inactive' : 'active';
  const action     = newStatus === 'active' ? 'reativado' : 'desativado';

  const result = await query(
    `UPDATE services SET status = $1 WHERE id = $2
     RETURNING id, name, status, updated_at`,
    [newStatus, id]
  );

  return res.status(200).json({
    success: true,
    message: `Serviço "${service.name}" ${action} com sucesso.`,
    data: result.rows[0],
  });
}

module.exports = {
  createService,
  listServices,
  listActiveServices,
  getServiceById,
  updateService,
  toggleServiceStatus,
};
