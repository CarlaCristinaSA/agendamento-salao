const { getClient, query } = require('../config/database');
const { validateSlotAvailability } = require('../services/availabilityService');
const {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendAdminCancellationNotice,
} = require('../services/emailService');
const {
  selfAppointmentSchema,
  clientAppointmentSchema,
  adminAppointmentSchema,
  listAppointmentsSchema,
} = require('../validations/appointmentValidation');

const SALON_TZ = process.env.SALON_TIMEZONE || 'America/Fortaleza';

const MIN_CANCEL_SECONDS = 24 * 60 * 60;

async function lockDate(dbClient, dateStr) {
  await dbClient.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [dateStr]);
}

async function fetchAppointmentById(id, dbClient) {
  const exec = dbClient ? dbClient.query.bind(dbClient) : query;
  const result = await exec(
    `SELECT
        a.id, a.client_id,
        a.client_name, a.client_email, a.client_phone,
        a.appointment_date::text, a.appointment_time::text,
        a.status, a.created_by_admin, a.created_at, a.updated_at,
        s.id AS service_id, s.name AS service_name, s.duration_minutes, s.price
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
      WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function createMyAppointment(req, res) {
  const { error, value } = selfAppointmentSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const merged = {
    service_id:       value.service_id,
    appointment_date: value.appointment_date,
    appointment_time: value.appointment_time,
    client_name:  (value.client_name  ?? req.user.name  ?? '').trim(),
    client_email: (value.client_email ?? req.user.email ?? '').trim().toLowerCase(),
    client_phone: (value.client_phone ?? req.user.phone ?? '').trim(),
  };

  const finalCheck = clientAppointmentSchema.validate(merged, { abortEarly: true });
  if (finalCheck.error) {
    return res.status(422).json({ success: false, error: finalCheck.error.details[0].message });
  }

  return _createAppointment(res, {
    ...finalCheck.value,
    client_email: finalCheck.value.client_email.toLowerCase(),
    created_by_admin: false,
    client_id: req.user.id,
  });
}

async function createAdminAppointment(req, res) {
  const { error, value } = adminAppointmentSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const email = value.client_email ? value.client_email.trim().toLowerCase() : null;

  return _createAppointment(res, {
    service_id:       value.service_id,
    appointment_date: value.appointment_date,
    appointment_time: value.appointment_time,
    client_name:      value.client_name,
    client_email:     email || null,
    client_phone:     value.client_phone,
    created_by_admin: true,
    client_id:        null,
  });
}

async function _createAppointment(res, data) {
  const {
    service_id, appointment_date, appointment_time,
    client_name, client_email, client_phone, created_by_admin, client_id,
  } = data;

  const dbClient = await getClient();
  try {
    await dbClient.query('BEGIN');

    await lockDate(dbClient, appointment_date);

    const serviceResult = await dbClient.query(
      `SELECT id, name, duration_minutes, price FROM services WHERE id = $1 AND status = 'active'`,
      [service_id]
    );
    if (serviceResult.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Serviço não encontrado ou inativo.' });
    }
    const service = serviceResult.rows[0];

    const validation = await validateSlotAvailability(
      appointment_date, appointment_time, service.duration_minutes, dbClient
    );
    if (!validation.available) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ success: false, error: validation.reason });
    }

    const insertResult = await dbClient.query(
      `INSERT INTO appointments
         (client_id, client_name, client_email, client_phone, service_id,
          appointment_date, appointment_time, status, created_by_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8)
       RETURNING id, client_id, client_name, client_email, client_phone,
                 appointment_date::text, appointment_time::text,
                 status, created_by_admin, created_at`,
      [
        client_id, client_name.trim(), client_email, client_phone,
        service_id, appointment_date, appointment_time, created_by_admin,
      ]
    );

    await dbClient.query('COMMIT');
    const appointment = insertResult.rows[0];

    sendConfirmationEmail(appointment, service);

    return res.status(201).json({
      success: true,
      message: 'Agendamento realizado com sucesso!',
      data: {
        ...appointment,
        service: {
          id: service.id, name: service.name,
          duration_minutes: service.duration_minutes, price: service.price,
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

  const countResult = await query(`SELECT COUNT(*) FROM appointments a ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query(
    `SELECT
        a.id, a.client_id,
        a.client_name, a.client_email, a.client_phone,
        a.appointment_date::text, a.appointment_time::text,
        a.status, a.created_by_admin, a.created_at,
        s.id AS service_id, s.name AS service_name, s.price
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
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
}

async function getAppointmentById(req, res) {
  const appointment = await fetchAppointmentById(req.params.id, null);
  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
  }
  return res.status(200).json({ success: true, data: appointment });
}

async function cancelAppointment(req, res) {
  const { id } = req.params;
  const dbClient = await getClient();

  try {
    await dbClient.query('BEGIN');

    const existing = await dbClient.query(
      `SELECT a.id, a.status, a.appointment_date::text, a.appointment_time::text,
              a.client_name, a.client_email, a.client_phone,
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
      return res.status(409).json({ success: false, error: 'Este agendamento já foi cancelado.' });
    }

    await dbClient.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [id]);
    await dbClient.query('COMMIT');

    sendCancellationEmail(appt, { name: appt.service_name, price: appt.price });

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

async function listMyAppointments(req, res) {
  const result = await query(
    `SELECT
        a.id,
        a.appointment_date::text,
        a.appointment_time::text,
        a.status,
        s.id   AS service_id,
        s.name AS service_name,
        s.price,
        EXTRACT(EPOCH FROM (
          ((a.appointment_date::timestamp + a.appointment_time) AT TIME ZONE $2) - now()
        )) AS seconds_until
       FROM appointments a
       JOIN services     s ON s.id = a.service_id
      WHERE a.client_id = $1
      ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    [req.user.id, SALON_TZ]
  );

  const upcoming = [];
  const history  = [];

  for (const row of result.rows) {
    const secondsUntil = Number(row.seconds_until);
    const isFuture     = secondsUntil >= 0;

    let displayStatus;
    if (row.status === 'cancelled')      displayStatus = 'Cancelado';
    else if (isFuture)                   displayStatus = 'Pendente';
    else                                 displayStatus = 'Concluído';

    const item = {
      id:               row.id,
      service_id:       row.service_id,
      service_name:     row.service_name,
      professional:     null,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time.substring(0, 5),
      price:            parseFloat(row.price).toFixed(2),
      status:           row.status,
      display_status:   displayStatus,
      can_cancel:       isFuture && row.status === 'confirmed' && secondsUntil >= MIN_CANCEL_SECONDS,
    };

    if (isFuture) upcoming.push(item);
    else          history.push(item);
  }

  history.reverse();

  return res.status(200).json({
    success: true,
    data: { upcoming, history },
  });
}

async function cancelMyAppointment(req, res) {
  const { id } = req.params;
  const dbClient = await getClient();

  try {
    await dbClient.query('BEGIN');

    const existing = await dbClient.query(
      `SELECT a.id, a.status, a.client_id,
              a.appointment_date::text, a.appointment_time::text,
              a.client_name, a.client_email, a.client_phone,
              s.id AS service_id, s.name AS service_name, s.price,
              EXTRACT(EPOCH FROM (
                ((a.appointment_date::timestamp + a.appointment_time) AT TIME ZONE $2) - now()
              )) AS seconds_until
         FROM appointments a
         JOIN services     s ON s.id = a.service_id
        WHERE a.id = $1
        FOR UPDATE`,
      [id, SALON_TZ]
    );

    if (existing.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }

    const appt = existing.rows[0];

    if (appt.client_id !== req.user.id) {
      await dbClient.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para cancelar este agendamento.',
      });
    }

    if (appt.status === 'cancelled') {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Este agendamento já foi cancelado.' });
    }

    if (Number(appt.seconds_until) < MIN_CANCEL_SECONDS) {
      await dbClient.query('ROLLBACK');
      return res.status(422).json({
        success: false,
        error: 'Cancelamentos com menos de 24h de antecedência devem ser feitos exclusivamente por telefone/WhatsApp do salão.',
      });
    }

    await dbClient.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [id]);
    await dbClient.query('COMMIT');

    const service = { name: appt.service_name, price: appt.price };
    sendCancellationEmail(appt, service);
    sendAdminCancellationNotice(appt, service);

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

  createMyAppointment,
  listMyAppointments,
  cancelMyAppointment,

  createAdminAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
};
