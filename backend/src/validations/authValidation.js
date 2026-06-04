const Joi = require('joi');

const phoneValidator = (value, helpers) => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return helpers.error('any.invalid');
  }
  return value;
};

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

const registerClientSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O nome não pode estar vazio ou conter apenas espaços.',
    'any.required': 'O nome é obrigatório.',
  }),
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'O e-mail não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail é obrigatório.',
  }),
  phone: Joi.string().trim().custom(phoneValidator).required().messages({
    'string.empty': 'O telefone não pode estar vazio.',
    'any.invalid':  'Informe um telefone válido com 10 ou 11 dígitos.',
    'any.required': 'O telefone é obrigatório.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'A senha não pode estar vazia.',
    'string.min':   'A senha deve ter pelo menos 6 caracteres.',
    'any.required': 'A senha é obrigatória.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only':     'A confirmação de senha deve ser idêntica à senha.',
    'any.required': 'A confirmação de senha é obrigatória.',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(3).required().messages({
    'string.empty': 'O nome não pode estar vazio.',
    'string.min':   'O nome deve ter pelo menos 3 caracteres.',
    'any.required': 'O nome é obrigatório.',
  }),
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'O e-mail não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail é obrigatório.',
  }),
  phone: Joi.string().trim().custom(phoneValidator).required().messages({
    'string.empty': 'O telefone não pode estar vazio.',
    'any.invalid':  'Informe um telefone válido com 10 ou 11 dígitos.',
    'any.required': 'O telefone é obrigatório.',
  }),
});

const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'A senha atual não pode estar vazia.',
    'any.required': 'A senha atual é obrigatória.',
  }),
  newPassword: Joi.string().pattern(strongPasswordPattern).required().messages({
    'string.empty':        'A nova senha não pode estar vazia.',
    'string.pattern.base': 'A nova senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.',
    'any.required':        'A nova senha é obrigatória.',
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only':     '"Confirmar Nova Senha" deve ser idêntica à "Nova Senha".',
    'any.required': '"Confirmar Nova Senha" é obrigatória.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'O e-mail não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail é obrigatório.',
  }),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'O e-mail não pode estar vazio.',
    'string.email': 'Informe um e-mail válido (com "@" e domínio).',
    'any.required': 'O e-mail é obrigatório.',
  }),
  code: Joi.string().trim().pattern(/^\d{6}$/).required().messages({
    'string.empty':        'O código não pode estar vazio.',
    'string.pattern.base': 'O código deve conter exatamente 6 dígitos.',
    'any.required':        'O código é obrigatório.',
  }),
  newPassword: Joi.string().pattern(strongPasswordPattern).required().messages({
    'string.empty':        'A nova senha não pode estar vazia.',
    'string.pattern.base': 'A nova senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.',
    'any.required':        'A nova senha é obrigatória.',
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only':     '"Confirmar Nova Senha" deve ser idêntica à "Nova Senha".',
    'any.required': '"Confirmar Nova Senha" é obrigatória.',
  }),
});

module.exports = {
  loginSchema,
  registerClientSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
