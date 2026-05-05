const { query }             = require('../config/database');
const { getAvailableSlots: computeAvailableSlots, hasIntervalOverlap } = require('../services/availabilityService');
const {
  createBusinessHourSchema,
  getAvailableSlotsSchema,
} = require('../validations/availabilityValidation');

async function createBusinessHour(req, res) {
  const { error, value } = createBusinessHourSchema.validate(req.body, { abortEarly: true });
  if (error) {
    const msg = error.details
      ? error.details[0].message
      : 'A hora final deve ser maior que a hora inicial.';
    return res.status(422).json({ success: false, error: msg });
  }

  const { type, day_of_week, specific_date, start_time, end_time } = value;

  let existingIntervals = [];
  if (type === 'day_of_week') {
    const r = await query(
      `SELECT start_time::text, end_time::text
         FROM business_hours
        WHERE type = 'day_of_week' AND day_of_week = $1`,
      [day_of_week]
    );
    existingIntervals = r.rows;
  } else {
    const r = await query(
      `SELECT start_time::text, end_time::text
         FROM business_hours
        WHERE type = 'specific_date' AND specific_date = $1`,
      [specific_date]
    );
    existingIntervals = r.rows;
  }

  if (hasIntervalOverlap(existingIntervals, start_time, end_time)) {
    return res.status(409).json({
      success: false,
      error: 'O intervalo informado conflita com um horário de funcionamento já existente.',
    });
  }

  const result = await query(
    `INSERT INTO business_hours (type, day_of_week, specific_date, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, day_of_week, specific_date::text, start_time::text, end_time::text, created_at`,
    [type, day_of_week ?? null, specific_date ?? null, start_time, end_time]
  );

  return res.status(201).json({
    success: true,
    message: 'Horário de funcionamento cadastrado com sucesso.',
    data: result.rows[0],
  });
}

async function listBusinessHours(req, res) {
  const result = await query(
    `SELECT id, type, day_of_week, specific_date::text, start_time::text, end_time::text,
            created_at, updated_at
       FROM business_hours
      ORDER BY type, day_of_week NULLS LAST, specific_date NULLS LAST, start_time`
  );

  const formatted = result.rows.map((row) => ({
    ...row,
    day_label: row.type === 'day_of_week'
      ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][row.day_of_week]
      : null,
  }));

  return res.status(200).json({
    success: true,
    data: formatted,
    total: result.rowCount,
  });
}

async function getBusinessHourById(req, res) {
  const { id } = req.params;
  const result = await query(
    `SELECT id, type, day_of_week, specific_date::text, start_time::text, end_time::text
       FROM business_hours WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Horário não encontrado.' });
  }
  return res.status(200).json({ success: true, data: result.rows[0] });
}

async function deleteBusinessHour(req, res) {
  const { id } = req.params;

  const existing = await query('SELECT id FROM business_hours WHERE id = $1', [id]);
  if (existing.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Horário não encontrado.' });
  }

  await query('DELETE FROM business_hours WHERE id = $1', [id]);

  return res.status(200).json({
    success: true,
    message: 'Horário de funcionamento removido com sucesso.',
  });
}

async function getAvailableSlots(req, res) {
  const { error, value } = getAvailableSlotsSchema.validate(req.query, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { date, service_id } = value;

  const serviceResult = await query(
    'SELECT id, name, duration_minutes FROM services WHERE id = $1 AND status = $2',
    [service_id, 'active']
  );

  if (serviceResult.rowCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'Serviço não encontrado ou inativo.',
    });
  }

  const service = serviceResult.rows[0];
  const slots   = await computeAvailableSlots(date, service.duration_minutes);

  return res.status(200).json({
    success: true,
    data: {
      date,
      service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
      available_slots: slots,
      total: slots.length,
    },
  });
}

module.exports = {
  createBusinessHour,
  listBusinessHours,
  getBusinessHourById,
  deleteBusinessHour,
  getAvailableSlots,
};
