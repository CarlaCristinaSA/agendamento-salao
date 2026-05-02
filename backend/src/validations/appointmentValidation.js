/**
 * src/validations/appointmentValidation.js
 * Schemas Joi para agendamentos (EP-003, HU-006, HU-008, RN-005).
 */

const Joi = require('joi');

/**
 * Valida formato de telefone brasileiro.
 * Aceita com ou sem formatação; verifica que possui 10 ou 11 dígitos.
 */
const phoneValidator = (value, helpers) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return helpers.error('any.invalid');
  }
  return value;
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema para agendamento pelo cliente (HU-006).
 * E-mail obrigatório (RN-005).
 */
const clientAppointmentSchema = Joi.object({
  service_id: Joi.number().integer().min(1).required().messages({
    'number.base':  'O ID do serviço deve ser um número válido.',
    'any.required': 'O serviço é obrigatório.',
  }),

  appointment_date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Informe uma data válida (AAAA-MM-DD).',
    'any.required':   'A data do agendamento é obrigatória.',
  }),

  appointment_time: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'O horário deve estar no formato HH:MM.',
    'any.required':        'O horário do agendamento é obrigatório.',
  }),

  client_name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome do cliente não pode estar vazio.',
    'any.required': 'O nome do cliente é obrigatório.',
  }),

  client_email: Joi.string().trim().email().required().messages({
    'string.empty': 'O e-mail do cliente não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail do cliente é obrigatório.',
  }),

  client_phone: Joi.string().trim().custom(phoneValidator).required().messages({
    'any.invalid':  'Informe um telefone válido com 10 ou 11 dígitos.',
    'any.required': 'O telefone do cliente é obrigatório.',
  }),
});

/**
 * Schema para agendamento administrativo (HU-008).
 * E-mail opcional (flexibilização RN-005 para clientes presenciais/telefone).
 */
const adminAppointmentSchema = Joi.object({
  service_id: Joi.number().integer().min(1).required().messages({
    'number.base':  'O ID do serviço deve ser um número válido.',
    'any.required': 'O serviço é obrigatório.',
  }),

  appointment_date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Informe uma data válida (AAAA-MM-DD).',
    'any.required':   'A data do agendamento é obrigatória.',
  }),

  appointment_time: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'O horário deve estar no formato HH:MM.',
    'any.required':        'O horário do agendamento é obrigatório.',
  }),

  client_name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome do cliente não pode estar vazio.',
    'any.required': 'O nome do cliente é obrigatório.',
  }),

  client_email: Joi.string().trim().email().allow('', null).optional().messages({
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
  }),

  client_phone: Joi.string().trim().custom(phoneValidator).required().messages({
    'any.invalid':  'Informe um telefone válido com 10 ou 11 dígitos.',
    'any.required': 'O telefone do cliente é obrigatório.',
  }),
});

const listAppointmentsSchema = Joi.object({
  date:       Joi.string().isoDate().optional(),
  date_start: Joi.string().isoDate().optional(),
  date_end:   Joi.string().isoDate().optional(),
  service_id: Joi.number().integer().min(1).optional(),
  status:     Joi.string().valid('confirmed', 'cancelled').optional(),
  sort:       Joi.string().valid('asc', 'desc').default('asc').optional(),
  page:       Joi.number().integer().min(1).default(1).optional(),
  limit:      Joi.number().integer().min(1).max(100).default(50).optional(),
});

module.exports = {
  clientAppointmentSchema,
  adminAppointmentSchema,
  listAppointmentsSchema,
};
