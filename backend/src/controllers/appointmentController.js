/**
 * src/controllers/appointmentController.js
 * Gestão de agendamentos (EP-003, EP-005).
 * HU-006, HU-007, HU-008, HU-013, HU-014, HU-015.
 * RN-001, RN-002, RN-003, RN-004, RN-005, RN-006, RN-007, RN-008, RNF-009.
 */

const { getClient }    = require('../config/database');
const { validateSlotAvailability } = require('../services/availabilityService');
const { sendConfirmationEmail, sendCancellationEmail } = require('../services/emailService');
const {
  clientAppointmentSchema,
  adminAppointmentSchema,
  listAppointmentsSchema,
} = require('../validations/appointmentValidation');

// -----------------------------------------------------------------------
// Helper: busca agendamento completo por ID
// -----------------------------------------------------------------------
async function fetchAppointmentById(id, dbClient) {
  const exec = dbClient.query.bind(dbClient);
  const result = await exec(
    `SELECT
        a.id,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date::text,
        a.appointment_time::text,
        a.status,
        a.created_by_admin,
        a.created_at,
        a.updated_at,
        s.id   AS service_id,
        s.name AS service_name,
        s.duration_minutes,
        s.price
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
      WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// -----------------------------------------------------------------------
// POST /api/public/appointments  (HU-006 — Agendamento pelo Cliente)
// -----------------------------------------------------------------------
async function createClientAppointment(req, res) {
  const { error, value } = clientAppointmentSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const {
    service_id, appointment_date, appointment_time,
    client_name, client_email, client_phone,
  } = value;

  return _createAppointment(req, res, {
    service_id, appointment_date, appointment_time,
    client_name, client_email, client_phone,
    created_by_admin: false,
  });
}

// -----------------------------------------------------------------------
// POST /api/admin/appointments  (HU-008 — Agendamento Administrativo)
// -----------------------------------------------------------------------
async function createAdminAppointment(req, res) {
  const { error, value } = adminAppointmentSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const {
    service_id, appointment_date, appointment_time,
    client_name, client_email, client_phone,
  } = value;

  return _createAppointment(req, res, {
    service_id, appointment_date, appointment_time,
    client_name,
    client_email: client_email || null, // e-mail opcional no fluxo admin (RN-005)
    client_phone,
    created_by_admin: true,
  });
}

// -----------------------------------------------------------------------
// Lógica compartilhada de criação de agendamento com transação (RNF-009)
// -----------------------------------------------------------------------
async function _createAppointment(req, res, data) {
  const {
    service_id, appointment_date, appointment_time,
    client_name, client_email, client_phone, created_by_admin,
  } = data;

  const dbClient = await getClient();
  try {
    await dbClient.query('BEGIN');

    // Lock na tabela de agendamentos para o dia — evita race condition (RNF-009)
    await dbClient.query(
      `SELECT id FROM appointments
        WHERE appointment_date = $1 AND status = 'confirmed'
        FOR UPDATE`,
      [appointment_date]
    );

    // Verifica se o serviço existe e está ativo (RN-004)
    const serviceResult = await dbClient.query(
      'SELECT id, name, duration_minutes, price FROM services WHERE id = $1 AND status = $2',
      [service_id, 'active']
    );
    if (serviceResult.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado ou inativo.',
      });
    }
    const service = serviceResult.rows[0];

    // Revalida disponibilidade no exato momento da confirmação (RNF-009, HU-006)
    const validation = await validateSlotAvailability(
      appointment_date,
      appointment_time,
      service.duration_minutes,
      dbClient
    );

    if (!validation.available) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ success: false, error: validation.reason });
    }

    // Persiste o agendamento
    const insertResult = await dbClient.query(
      `INSERT INTO appointments
         (client_name, client_email, client_phone, service_id,
          appointment_date, appointment_time, status, created_by_admin)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7)
       RETURNING id, client_name, client_email, client_phone,
                 appointment_date::text, appointment_time::text,
                 status, created_by_admin, created_at`,
      [
        client_name.trim(), client_email, client_phone,
        service_id, appointment_date, appointment_time,
        created_by_admin,
      ]
    );

    await dbClient.query('COMMIT');
    const appointment = insertResult.rows[0];

    // Disparo assíncrono do e-mail de confirmação (RN-006, RNF-010)
    sendConfirmationEmail(appointment, service);

    return res.status(201).json({
      success: true,
      message: 'Agendamento realizado com sucesso!',
      data: {
        ...appointment,
        service: {
          id:               service.id,
          name:             service.name,
          duration_minutes: service.duration_minutes,
          price:            service.price,
        },
      },
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

// -----------------------------------------------------------------------
// GET /api/admin/appointments  (HU-013 — Consultar Agendamentos)
// -----------------------------------------------------------------------
async function listAppointments(req, res) {
  const { error, value } = listAppointmentsSchema.validate(req.query, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { date, date_start, date_end, service_id, status, sort, page, limit } = value;

  const conditions = [];
  const params     = [];

  if (date) {
    conditions.push(`a.appointment_date = $${params.length + 1}`);
    params.push(date);
  } else {
    if (date_start) {
      conditions.push(`a.appointment_date >= $${params.length + 1}`);
      params.push(date_start);
    }
    if (date_end) {
      conditions.push(`a.appointment_date <= $${params.length + 1}`);
      params.push(date_end);
    }
  }

  if (service_id) {
    conditions.push(`a.service_id = $${params.length + 1}`);
    params.push(service_id);
  }

  if (status) {
    conditions.push(`a.status = $${params.length + 1}`);
    params.push(status);
  }

  const where   = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortDir = sort === 'desc' ? 'DESC' : 'ASC';
  const offset  = (page - 1) * limit;

  // Total sem paginação
  const countResult = await require('../config/database').query(
    `SELECT COUNT(*) FROM appointments a ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Query com paginação
  const dataResult = await require('../config/database').query(
    `SELECT
        a.id,
        a.client_name,
        a.client_email,
        a.client_phone,
        a.appointment_date::text,
        a.appointment_time::text,
        a.status,
        a.created_by_admin,
        a.created_at,
        s.id   AS service_id,
        s.name AS service_name,
        s.price
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
       ${where}
      ORDER BY a.appointment_date ${sortDir}, a.appointment_time ${sortDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return res.status(200).json({
    success: true,
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
}

// -----------------------------------------------------------------------
// GET /api/admin/appointments/:id  (HU-014 — Visualizar Detalhes)
// -----------------------------------------------------------------------
async function getAppointmentById(req, res) {
  const { id } = req.params;
  const dbClient = await getClient();
  try {
    const appointment = await fetchAppointmentById(id, dbClient);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }
    return res.status(200).json({ success: true, data: appointment });
  } finally {
    dbClient.release();
  }
}

// -----------------------------------------------------------------------
// PATCH /api/admin/appointments/:id/cancel  (HU-015 — Cancelar Agendamento)
// -----------------------------------------------------------------------
async function cancelAppointment(req, res) {
  const { id } = req.params;
  const dbClient = await getClient();

  try {
    await dbClient.query('BEGIN');

    const existing = await dbClient.query(
      `SELECT a.id, a.status, a.client_name, a.client_email, a.client_phone,
              a.appointment_date::text, a.appointment_time::text,
              s.id AS service_id, s.name AS service_name, s.price
         FROM appointments a
         JOIN services     s ON s.id = a.service_id
        WHERE a.id = $1
        FOR UPDATE`,
      [id]
    );

    if (existing.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }

    const appt = existing.rows[0];

    if (appt.status === 'cancelled') {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Este agendamento já foi cancelado.',
      });
    }

    // Altera status para cancelado (preserva histórico — RN-002, HU-015)
    await dbClient.query(
      `UPDATE appointments SET status = 'cancelled' WHERE id = $1`,
      [id]
    );

    await dbClient.query('COMMIT');

    // Notificação assíncrona de cancelamento (RN-006, HU-007, RNF-010)
    const service = { name: appt.service_name, price: appt.price };
    sendCancellationEmail(appt, service);

    return res.status(200).json({
      success: true,
      message: 'Agendamento cancelado com sucesso. O horário foi liberado.',
      data: { id: appt.id, status: 'cancelled' },
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  createClientAppointment,
  createAdminAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
};
