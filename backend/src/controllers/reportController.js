/**
 * src/controllers/reportController.js
 * Relatórios gerenciais (EP-006).
 * HU-016, HU-017 — RN-008, RNF-001, RNF-007.
 */

const { query } = require('../config/database');
const Joi       = require('joi');

const reportFilterSchema = Joi.object({
  date_start: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Informe uma data inicial válida (AAAA-MM-DD).',
    'any.required':   'O período inicial é obrigatório.',
  }),
  date_end: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Informe uma data final válida (AAAA-MM-DD).',
    'any.required':   'O período final é obrigatório.',
  }),
  service_id: Joi.number().integer().min(1).optional(),
}).custom((value, helpers) => {
  if (value.date_start > value.date_end) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'A data inicial não pode ser maior que a data final.',
});

const indicatorsFilterSchema = Joi.object({
  date_start: Joi.string().isoDate().optional(),
  date_end:   Joi.string().isoDate().optional(),
}).custom((value, helpers) => {
  if (value.date_start && value.date_end && value.date_start > value.date_end) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'A data inicial não pode ser maior que a data final.',
});

// -----------------------------------------------------------------------
// GET /api/admin/reports/appointments  (HU-016 — Relatório de Agendamentos)
// -----------------------------------------------------------------------
async function getAppointmentsReport(req, res) {
  const { error, value } = reportFilterSchema.validate(req.query, { abortEarly: true });
  if (error) {
    const msg = error.details ? error.details[0].message : 'Datas inválidas.';
    return res.status(422).json({ success: false, error: msg });
  }

  const { date_start, date_end, service_id } = value;

  const conditions = [
    `a.appointment_date >= $1`,
    `a.appointment_date <= $2`,
    `a.status = 'confirmed'`,
  ];
  const params = [date_start, date_end];

  if (service_id) {
    conditions.push(`a.service_id = $${params.length + 1}`);
    params.push(service_id);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // Lista de agendamentos filtrados
  const dataResult = await query(
    `SELECT
        a.id,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date::text,
        a.appointment_time::text,
        a.status,
        s.id   AS service_id,
        s.name AS service_name,
        s.price
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
       ${where}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    params
  );

  // Totalizador financeiro (apenas agendamentos confirmados)
  const totalsResult = await query(
    `SELECT COUNT(*) AS total_appointments,
            COALESCE(SUM(s.price), 0) AS total_revenue
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
       ${where}`,
    params
  );

  const totals = totalsResult.rows[0];

  return res.status(200).json({
    success: true,
    data: {
      filters: { date_start, date_end, service_id: service_id || null },
      summary: {
        total_appointments: parseInt(totals.total_appointments, 10),
        total_revenue:      parseFloat(totals.total_revenue).toFixed(2),
      },
      appointments: dataResult.rows,
    },
  });
}

// -----------------------------------------------------------------------
// GET /api/admin/reports/services  (HU-017 — Indicadores de Serviços)
// -----------------------------------------------------------------------
async function getServicesIndicators(req, res) {
  const { error, value } = indicatorsFilterSchema.validate(req.query, { abortEarly: true });
  if (error) {
    const msg = error.details ? error.details[0].message : 'Datas inválidas.';
    return res.status(422).json({ success: false, error: msg });
  }

  const { date_start, date_end } = value;

  const conditions = [`a.status = 'confirmed'`];
  const params     = [];

  if (date_start) {
    conditions.push(`a.appointment_date >= $${params.length + 1}`);
    params.push(date_start);
  }
  if (date_end) {
    conditions.push(`a.appointment_date <= $${params.length + 1}`);
    params.push(date_end);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // Ranking de serviços mais solicitados (ordem decrescente, HU-017)
  const rankingResult = await query(
    `SELECT
        s.id,
        s.name,
        s.price,
        s.duration_minutes,
        s.status,
        COUNT(a.id)::int           AS total_appointments,
        COALESCE(SUM(s.price), 0)  AS total_revenue
       FROM services     s
  LEFT JOIN appointments a ON a.service_id = s.id ${where ? 'AND ' + conditions.slice(0).join(' AND ') : ''}
      GROUP BY s.id, s.name, s.price, s.duration_minutes, s.status
      ORDER BY total_appointments DESC, s.name ASC`,
    params
  );

  if (rankingResult.rows.length === 0 || rankingResult.rows.every(r => r.total_appointments === 0)) {
    return res.status(200).json({
      success: true,
      message: 'Não há dados suficientes para análise no período informado.',
      data: {
        filters: { date_start: date_start || null, date_end: date_end || null },
        indicators: [],
      },
    });
  }

  // Totais gerais
  const grandTotal = rankingResult.rows.reduce(
    (acc, row) => {
      acc.total_appointments += row.total_appointments;
      acc.total_revenue      += parseFloat(row.total_revenue);
      return acc;
    },
    { total_appointments: 0, total_revenue: 0 }
  );

  const indicators = rankingResult.rows.map((row, idx) => ({
    rank:              idx + 1,
    service_id:        row.id,
    service_name:      row.name,
    service_price:     parseFloat(row.price).toFixed(2),
    service_status:    row.status,
    total_appointments: row.total_appointments,
    total_revenue:     parseFloat(row.total_revenue).toFixed(2),
  }));

  return res.status(200).json({
    success: true,
    data: {
      filters: { date_start: date_start || null, date_end: date_end || null },
      summary: {
        total_appointments: grandTotal.total_appointments,
        total_revenue:      grandTotal.total_revenue.toFixed(2),
      },
      indicators,
    },
  });
}

module.exports = { getAppointmentsReport, getServicesIndicators };
