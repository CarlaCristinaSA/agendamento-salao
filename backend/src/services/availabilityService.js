/**
 * src/services/availabilityService.js
 * Lógica de cálculo de disponibilidade de horários (EP-002, RN-002, RN-003, RNF-009).
 */

const { query } = require('../config/database');

/**
 * Converte string "HH:MM" em minutos desde meia-noite.
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos desde meia-noite em string "HH:MM".
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Obtém os intervalos de funcionamento aplicáveis para uma data.
 *
 * Regra de prioridade:
 *   Se existirem registros do tipo 'specific_date' para a data informada,
 *   eles têm prioridade e substituem os do tipo 'day_of_week'.
 *   Caso contrário, usa os registros do dia da semana correspondente.
 *
 * @param {string} dateStr - Data no formato "YYYY-MM-DD"
 * @param {object} [dbClient] - Client de transação (opcional)
 * @returns {Array<{start_time: string, end_time: string}>}
 */
async function getIntervalsForDate(dateStr, dbClient = null) {
  const exec = dbClient ? dbClient.query.bind(dbClient) : query;

  // Tenta buscar por data específica primeiro
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

  // Fallback: dia da semana (0=Dom … 6=Sáb)
  const date      = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // getDay() já retorna 0–6

  const weekResult = await exec(
    `SELECT start_time::text, end_time::text
       FROM business_hours
      WHERE type = 'day_of_week' AND day_of_week = $1
      ORDER BY start_time`,
    [dayOfWeek]
  );

  return weekResult.rows;
}

/**
 * Busca agendamentos confirmados de uma data para checagem de conflito.
 *
 * @param {string} dateStr   - "YYYY-MM-DD"
 * @param {object} [dbClient]
 * @returns {Array<{appointment_time: string, duration_minutes: number}>}
 */
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

/**
 * Verifica se um novo agendamento conflita com os existentes (RN-002).
 *
 * Um conflito ocorre quando os intervalos [T, T+D) e [T', T'+D') se sobrepõem.
 *
 * @param {string} newTime         - "HH:MM" - horário do novo agendamento
 * @param {number} newDuration     - Duração em minutos do novo agendamento
 * @param {Array}  existingAppts   - Agendamentos confirmados do dia
 * @returns {boolean} true se houver conflito
 */
function hasConflict(newTime, newDuration, existingAppts) {
  const newStart = timeToMinutes(newTime);
  const newEnd   = newStart + newDuration;

  for (const appt of existingAppts) {
    // Normaliza "HH:MM:SS" → "HH:MM"
    const apptTimeStr = appt.appointment_time.substring(0, 5);
    const apptStart   = timeToMinutes(apptTimeStr);
    const apptEnd     = apptStart + appt.duration_minutes;

    // Sobreposição: newStart < apptEnd && apptStart < newEnd
    if (newStart < apptEnd && apptStart < newEnd) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica se um horário e duração cabem dentro de algum intervalo de funcionamento.
 *
 * @param {string} time       - "HH:MM"
 * @param {number} duration   - Duração em minutos
 * @param {Array}  intervals  - Intervalos de funcionamento
 * @returns {boolean}
 */
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

/**
 * Gera os horários disponíveis para uma data e serviço (EP-002, EP-003).
 *
 * Algoritmo:
 *  1. Obtém intervalos de funcionamento para a data.
 *  2. Para cada intervalo, gera slots de `duration_minutes` em `duration_minutes`.
 *  3. Filtra slots que conflitam com agendamentos existentes.
 *
 * @param {string} dateStr    - "YYYY-MM-DD"
 * @param {number} duration   - Duração do serviço em minutos
 * @param {object} [dbClient]
 * @returns {string[]} Lista de horários disponíveis "HH:MM"
 */
async function getAvailableSlots(dateStr, duration, dbClient = null) {
  const [intervals, existingAppts] = await Promise.all([
    getIntervalsForDate(dateStr, dbClient),
    getConfirmedAppointmentsForDate(dateStr, dbClient),
  ]);

  if (intervals.length === 0) return [];

  const available = [];

  for (const interval of intervals) {
    const iStart = timeToMinutes(interval.start_time.substring(0, 5));
    const iEnd   = timeToMinutes(interval.end_time.substring(0, 5));

    // Gera slots a cada `duration` minutos dentro do intervalo
    for (let slot = iStart; slot + duration <= iEnd; slot += duration) {
      const slotTime = minutesToTime(slot);
      if (!hasConflict(slotTime, duration, existingAppts)) {
        available.push(slotTime);
      }
    }
  }

  return available;
}

/**
 * Valida se um horário específico está disponível para agendamento.
 * Usado no momento da confirmação para evitar race conditions (RNF-009).
 * Deve ser chamado dentro de uma transação com lock.
 *
 * @param {string} dateStr   - "YYYY-MM-DD"
 * @param {string} timeStr   - "HH:MM"
 * @param {number} duration  - Duração em minutos
 * @param {object} dbClient  - Client da transação
 * @returns {{ available: boolean, reason?: string }}
 */
async function validateSlotAvailability(dateStr, timeStr, duration, dbClient) {
  const intervals    = await getIntervalsForDate(dateStr, dbClient);
  const existingAppts = await getConfirmedAppointmentsForDate(dateStr, dbClient);

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

  if (hasConflict(normalizedTime, duration, existingAppts)) {
    return {
      available: false,
      reason: 'Este horário não está mais disponível. Por favor, escolha outro.',
    };
  }

  return { available: true };
}

/**
 * Verifica se há sobreposição entre intervalos de um mesmo dia (HU-005).
 *
 * @param {Array}  existingIntervals - Intervalos já cadastrados
 * @param {string} newStart          - "HH:MM"
 * @param {string} newEnd            - "HH:MM"
 * @returns {boolean}
 */
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
  hasIntervalOverlap,
  timeToMinutes,
  minutesToTime,
};
