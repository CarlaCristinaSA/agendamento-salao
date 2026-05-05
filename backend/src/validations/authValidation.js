const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().required().messages({
    'string.empty': 'O campo login não pode estar vazio.',
    'any.required': 'O campo login é obrigatório.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'O campo senha não pode estar vazio.',
    'any.required': 'O campo senha é obrigatório.',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome não pode estar vazio.',
    'any.required': 'O nome é obrigatório.',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'O e-mail não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail é obrigatório.',
  }),
  phone: Joi.string().trim().allow('', null).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'A senha atual não pode estar vazia.',
    'any.required': 'A senha atual é obrigatória.',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty':  'A nova senha não pode estar vazia.',
    'string.min':    'A nova senha deve ter pelo menos 6 caracteres.',
    'any.required':  'A nova senha é obrigatória.',
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only':    '"Confirmar Nova Senha" deve ser idêntica à "Nova Senha".',
    'any.required': '"Confirmar Nova Senha" é obrigatória.',
  }),
});

module.exports = { loginSchema, updateProfileSchema, changePasswordSchema };
