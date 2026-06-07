const { query } = require('../config/database');

const SLOT_INTERVAL = 30;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

async function getIntervalsForDate(dateStr, dbClient = null) {
  const exec = dbClient ? dbClient.query.bind(dbClient) : query;

  const specificResult = await exec(
    `SELECT start_time::text, end_time::text
       FROM business_hours
      WHERE type = 'specific_date' AND specific_date = $1
      ORDER BY start_time`,
    [dateStr]
  );

  if (specificResult.rows.length > 0) {
    return specificResult.rows;
  }

  const weekResult = await exec(
    `SELECT start_time::text, end_time::text
       FROM business_hours
      WHERE type = 'day_of_week'
        AND day_of_week = EXTRACT(DOW FROM $1::date)::smallint
      ORDER BY start_time`,
    [dateStr]
  );

  return weekResult.rows;
}

async function getConfirmedAppointmentsForDate(dateStr, dbClient = null) {
  const exec = dbClient ? dbClient.query.bind(dbClient) : query;

  const result = await exec(
    `SELECT a.appointment_time::text, s.duration_minutes
       FROM appointments a
       JOIN services      s ON s.id = a.service_id
      WHERE a.appointment_date = $1
        AND a.status = 'confirmed'
      ORDER BY a.appointment_time`,
    [dateStr]
  );
  return result.rows;
}

function hasConflict(newTime, newDuration, existingAppts) {
  const newStart = timeToMinutes(newTime);
  const newEnd   = newStart + newDuration;

  for (const appt of existingAppts) {
    const apptTimeStr = appt.appointment_time.substring(0, 5);
    const apptStart   = timeToMinutes(apptTimeStr);
    const apptEnd     = apptStart + appt.duration_minutes;

    if (newStart < apptEnd && apptStart < newEnd) {
      return true;
    }
  }
  return false;
}

function fitsInBusinessHours(time, duration, intervals) {
  const start = timeToMinutes(time);
  const end   = start + duration;

  for (const interval of intervals) {
    const iStart = timeToMinutes(interval.start_time.substring(0, 5));
    const iEnd   = timeToMinutes(interval.end_time.substring(0, 5));
    if (start >= iStart && end <= iEnd) {
      return true;
    }
  }
  return false;
}

function buildGridStartTimes(intervals, duration) {
  if (!Number.isInteger(duration) || duration <= 0) return [];

  const slots = [];

  for (const interval of intervals) {
    const iStart   = timeToMinutes(interval.start_time.substring(0, 5));
    const iEnd     = timeToMinutes(interval.end_time.substring(0, 5));
    const turnSize = iEnd - iStart;

    if (duration > turnSize) continue;

    if (duration * 2 === turnSize) {

      slots.push(minutesToTime(iStart));
      slots.push(minutesToTime(iEnd - duration));
    } else {

      for (let s = iStart; s + duration <= iEnd; s += SLOT_INTERVAL) {
        slots.push(minutesToTime(s));
      }
    }
  }

  return [...new Set(slots)].sort();
}

async function getAvailableSlots(dateStr, duration, dbClient = null) {
  const [intervals, existingAppts] = await Promise.all([
    getIntervalsForDate(dateStr, dbClient),
    getConfirmedAppointmentsForDate(dateStr, dbClient),
  ]);

  if (intervals.length === 0) return [];

  return buildGridStartTimes(intervals, duration)
    .filter((slot) => !hasConflict(slot, duration, existingAppts));
}

async function validateSlotAvailability(dateStr, timeStr, duration, dbClient) {
  const intervals = await getIntervalsForDate(dateStr, dbClient);

  if (intervals.length === 0) {
    return { available: false, reason: 'O salão não tem horário de funcionamento nesta data.' };
  }

  const normalizedTime = timeStr.substring(0, 5);

  if (!fitsInBusinessHours(normalizedTime, duration, intervals)) {
    return {
      available: false,
      reason: 'O horário selecionado não está dentro do horário de funcionamento do salão.',
    };
  }

  const gridSlots = buildGridStartTimes(intervals, duration);
  if (!gridSlots.includes(normalizedTime)) {
    return {
      available: false,
      reason: 'O horário selecionado não é válido para este serviço. Escolha um dos horários disponíveis.',
    };
  }

  const existingAppts = await getConfirmedAppointmentsForDate(dateStr, dbClient);
  if (hasConflict(normalizedTime, duration, existingAppts)) {
    return {
      available: false,
      reason: 'Este horário não está mais disponível. Por favor, escolha outro.',
    };
  }

  return { available: true };
}

function hasIntervalOverlap(existingIntervals, newStart, newEnd) {
  const ns = timeToMinutes(newStart);
  const ne = timeToMinutes(newEnd);

  for (const iv of existingIntervals) {
    const is = timeToMinutes(iv.start_time.substring(0, 5));
    const ie = timeToMinutes(iv.end_time.substring(0, 5));
    if (ns < ie && is < ne) return true;
  }
  return false;
}

module.exports = {
  getAvailableSlots,
  validateSlotAvailability,
  getIntervalsForDate,
  buildGridStartTimes,
  hasIntervalOverlap,
  hasConflict,
  fitsInBusinessHours,
  timeToMinutes,
  minutesToTime,
};
