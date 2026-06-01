const Joi = require('joi');

const phoneValidator = (value, helpers) => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return helpers.error('any.invalid');
  }
  return value;
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const baseSlotFields = {
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
};

const selfAppointmentSchema = Joi.object({
  ...baseSlotFields,
  client_name:  Joi.string().trim().min(1).optional(),
  client_email: Joi.string().trim().email({ tlds: false }).optional(),
  client_phone: Joi.string().trim().custom(phoneValidator).optional().messages({
    'any.invalid': 'Informe um telefone válido com 10 ou 11 dígitos.',
  }),
});

const clientAppointmentSchema = Joi.object({
  ...baseSlotFields,
  client_name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome do cliente não pode estar vazio.',
    'any.required': 'O nome do cliente é obrigatório.',
  }),
  client_email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'O e-mail do cliente não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail do cliente é obrigatório.',
  }),
  client_phone: Joi.string().trim().custom(phoneValidator).required().messages({
    'any.invalid':  'Informe um telefone válido com 10 ou 11 dígitos.',
    'any.required': 'O telefone do cliente é obrigatório.',
  }),
});

const adminAppointmentSchema = Joi.object({
  ...baseSlotFields,
  client_name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome do cliente não pode estar vazio.',
    'any.required': 'O nome do cliente é obrigatório.',
  }),
  client_email: Joi.string().trim().email({ tlds: false }).allow('', null).optional().messages({
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
  selfAppointmentSchema,
  clientAppointmentSchema,
  adminAppointmentSchema,
  listAppointmentsSchema,
};
