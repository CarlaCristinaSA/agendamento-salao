const Joi = require('joi');

const createServiceSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'O nome do serviço não pode estar vazio ou conter apenas espaços.',
      'any.required': 'O nome do serviço é obrigatório.',
    }),

  duration_minutes: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base':    'A duração deve ser um número inteiro.',
      'number.integer': 'A duração deve ser um número inteiro.',
      'number.min':     'A duração deve ser maior que zero.',
      'any.required':   'A duração do serviço é obrigatória.',
    }),

  price: Joi.number()
    .precision(2)
    .min(0.01)
    .required()
    .messages({
      'number.base':  'O valor do serviço deve ser numérico.',
      'number.min':   'O valor do serviço deve ser maior que zero.',
      'any.required': 'O valor do serviço é obrigatório.',
    }),
});

const updateServiceSchema = createServiceSchema;

module.exports = { createServiceSchema, updateServiceSchema };
