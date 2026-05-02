/**
 * src/validations/availabilityValidation.js
 * Schemas Joi para gestão de horários de funcionamento (EP-002, HU-005, RN-003).
 */

const Joi = require('joi');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createBusinessHourSchema = Joi.object({
  type: Joi.string()
    .valid('day_of_week', 'specific_date')
    .required()
    .messages({
      'any.only':    'O tipo deve ser "day_of_week" ou "specific_date".',
      'any.required': 'O tipo é obrigatório.',
    }),

  day_of_week: Joi.when('type', {
    is: 'day_of_week',
    then: Joi.number().integer().min(0).max(6).required().messages({
      'number.base':  'O dia da semana deve ser um número entre 0 (Dom) e 6 (Sáb).',
      'number.min':   'O dia da semana deve ser entre 0 e 6.',
      'number.max':   'O dia da semana deve ser entre 0 e 6.',
      'any.required': 'O dia da semana é obrigatório para o tipo "day_of_week".',
    }),
    otherwise: Joi.valid(null).optional(),
  }),

  specific_date: Joi.when('type', {
    is: 'specific_date',
    then: Joi.string().isoDate().required().messages({
      'string.isoDate': 'Informe uma data válida no formato AAAA-MM-DD.',
      'any.required':   'A data específica é obrigatória para o tipo "specific_date".',
    }),
    otherwise: Joi.valid(null).optional(),
  }),

  start_time: Joi.string()
    .pattern(timeRegex)
    .required()
    .messages({
      'string.pattern.base': 'A hora inicial deve estar no formato HH:MM.',
      'any.required':        'A hora inicial é obrigatória.',
    }),

  end_time: Joi.string()
    .pattern(timeRegex)
    .required()
    .messages({
      'string.pattern.base': 'A hora final deve estar no formato HH:MM.',
      'any.required':        'A hora final é obrigatória.',
    }),
}).custom((value, helpers) => {
  // Valida que end_time > start_time
  if (value.start_time && value.end_time && value.end_time <= value.start_time) {
    return helpers.error('any.invalid', {
      message: 'A hora final deve ser maior que a hora inicial.',
    });
  }
  return value;
}).messages({
  'any.invalid': 'A hora final deve ser maior que a hora inicial.',
});

const getAvailableSlotsSchema = Joi.object({
  date:       Joi.string().isoDate().required().messages({
    'string.isoDate': 'Informe uma data válida no formato AAAA-MM-DD.',
    'any.required':   'A data é obrigatória.',
  }),
  service_id: Joi.number().integer().min(1).required().messages({
    'number.base':  'O ID do serviço deve ser um número.',
    'any.required': 'O ID do serviço é obrigatório.',
  }),
});

module.exports = { createBusinessHourSchema, getAvailableSlotsSchema };
