const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const { query, getClient } = require('../config/database');
const { sendPasswordResetEmail } = require('../services/emailService');
const {
  loginSchema,
  registerClientSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/authValidation');

const generateJti = () => crypto.randomBytes(16).toString('hex');

const homeRouteFor = (role) => (role === 'admin' ? '/admin/dashboard' : '/agendamento');

const RESET_CODE_TTL_MINUTES = parseInt(process.env.PASSWORD_RESET_CODE_TTL_MINUTES || '15', 10);
const MAX_RESET_ATTEMPTS     = parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS || '5', 10);

const generateResetCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

async function login(req, res) {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { email, password } = value;

  const GENERIC_ERROR = 'E-mail ou senha incorretos.';

  const result = await query(
    `SELECT id, name, email, phone, password_hash, role, is_active
       FROM users WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const user = result.rows[0];

  if (!user.is_active) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const jti = generateJti();
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso.',
    data: {
      token,
      redirect_to: homeRouteFor(user.role),
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    },
  });
}

async function logout(req, res) {
  const decoded = req.user;

  try {
    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 8 * 3600 * 1000).toISOString();

    await query(
      `INSERT INTO token_blacklist (token_jti, expires_at)
       VALUES ($1, $2) ON CONFLICT (token_jti) DO NOTHING`,
      [decoded.jti, expiresAt]
    );
  } catch (err) {
    console.error('[Logout] Erro ao invalidar token:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Sessão encerrada com sucesso.',
  });
}

async function registerClient(req, res) {
  const { error, value } = registerClientSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { name, email, phone, password } = value;
  const normalizedEmail = email.trim().toLowerCase();

  const duplicate = await query(
    'SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = TRUE',
    [normalizedEmail]
  );
  if (duplicate.rowCount > 0) {
    return res.status(409).json({
      success: false,
      error: 'Este e-mail já está cadastrado.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'client')
     RETURNING id, name, email, phone, role, created_at`,
    [name.trim(), normalizedEmail, phone.trim(), passwordHash]
  );

  return res.status(201).json({
    success: true,
    message: 'Conta criada com sucesso.',
    data: result.rows[0],
  });
}

async function getProfile(req, res) {
  const result = await query(
    'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  }

  return res.status(200).json({ success: true, data: result.rows[0] });
}

async function updateProfile(req, res) {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { name, email, phone } = value;
  const normalizedEmail = email.trim().toLowerCase();

  const duplicate = await query(
    'SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2',
    [normalizedEmail, req.user.id]
  );
  if (duplicate.rowCount > 0) {
    return res.status(409).json({
      success: false,
      error: 'Este e-mail já está em uso por outro usuário.',
    });
  }

  const result = await query(
    `UPDATE users
        SET name = $1, email = $2, phone = $3
      WHERE id = $4
    RETURNING id, name, email, phone, role, updated_at`,
    [name.trim(), normalizedEmail, phone.trim(), req.user.id]
  );

  return res.status(200).json({
    success: true,
    message: 'Dados atualizados com sucesso.',
    data: result.rows[0],
  });
}

async function changePassword(req, res) {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { currentPassword, newPassword } = value;

  const userResult = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );
  if (userResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  }

  const match = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
  if (!match) {
    return res.status(422).json({
      success: false,
      error: 'A "Senha Atual" informada não corresponde à cadastrada.',
    });
  }

  if (currentPassword === newPassword) {
    return res.status(422).json({
      success: false,
      error: 'A nova senha deve ser diferente da senha atual.',
    });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

  return res.status(200).json({
    success: true,
    message: 'Senha alterada com sucesso.',
  });
}

async function requestPasswordReset(req, res) {
  const { error, value } = forgotPasswordSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const email = value.email.trim().toLowerCase();
  const GENERIC_OK = 'Se houver uma conta associada a este e-mail, enviaremos um código de recuperação.';

  const userResult = await query(
    'SELECT id, name, email FROM users WHERE LOWER(email) = $1 AND is_active = TRUE',
    [email]
  );

  if (userResult.rowCount > 0) {
    const user = userResult.rows[0];
    const code = generateResetCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    await query(
      'UPDATE password_reset_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );
    await query(
      `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, codeHash, expiresAt]
    );

    sendPasswordResetEmail(user, code, RESET_CODE_TTL_MINUTES);
  }

  return res.status(200).json({ success: true, message: GENERIC_OK });
}

async function resetPassword(req, res) {
  const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const email = value.email.trim().toLowerCase();
  const { code, newPassword } = value;
  const GENERIC_INVALID = 'Código inválido ou expirado. Solicite um novo código.';

  const dbClient = await getClient();
  try {
    await dbClient.query('BEGIN');

    const userResult = await dbClient.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = TRUE',
      [email]
    );
    if (userResult.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(422).json({ success: false, error: GENERIC_INVALID });
    }
    const userId = userResult.rows[0].id;

    const codeResult = await dbClient.query(
      `SELECT id, code_hash, attempts FROM password_reset_codes
        WHERE user_id = $1 AND used = FALSE AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [userId]
    );
    if (codeResult.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(422).json({ success: false, error: GENERIC_INVALID });
    }
    const reset = codeResult.rows[0];

    if (reset.attempts >= MAX_RESET_ATTEMPTS) {
      await dbClient.query('UPDATE password_reset_codes SET used = TRUE WHERE id = $1', [reset.id]);
      await dbClient.query('COMMIT');
      return res.status(422).json({ success: false, error: GENERIC_INVALID });
    }

    const match = await bcrypt.compare(code, reset.code_hash);
    if (!match) {
      const attempts = reset.attempts + 1;
      await dbClient.query(
        'UPDATE password_reset_codes SET attempts = $1, used = $2 WHERE id = $3',
        [attempts, attempts >= MAX_RESET_ATTEMPTS, reset.id]
      );
      await dbClient.query('COMMIT');
      return res.status(422).json({ success: false, error: GENERIC_INVALID });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await dbClient.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    await dbClient.query(
      'UPDATE password_reset_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [userId]
    );
    await dbClient.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso. Você já pode entrar com a nova senha.',
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  login,
  logout,
  registerClient,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
