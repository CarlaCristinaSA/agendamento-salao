const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto').randomUUID
  ? { v4: () => require('crypto').randomBytes(16).toString('hex') }
  : { v4: () => require('crypto').randomBytes(16).toString('hex') };

const { query }  = require('../config/database');
const {
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validations/authValidation');

const generateJti = () => require('crypto').randomBytes(16).toString('hex');

async function login(req, res) {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(422).json({ success: false, error: error.details[0].message });
  }

  const { email, password } = value;

  const GENERIC_ERROR = 'Credenciais inválidas.';

  const result = await query(
    `SELECT id, name, email, phone, password_hash, is_active
       FROM admins WHERE email = $1`,
    [email.trim().toLowerCase()]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const admin = result.rows[0];

  if (!admin.is_active) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, error: GENERIC_ERROR });
  }

  const jti = generateJti();
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin', jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso.',
    data: {
      token,
      admin: {
        id:    admin.id,
        name:  admin.name,
        email: admin.email,
        phone: admin.phone,
        role:  'admin',
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

async function getProfile(req, res) {
  const result = await query(
    'SELECT id, name, email, phone, created_at, updated_at FROM admins WHERE id = $1',
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
    'SELECT id FROM admins WHERE email = $1 AND id <> $2',
    [normalizedEmail, req.user.id]
  );
  if (duplicate.rowCount > 0) {
    return res.status(409).json({
      success: false,
      error: 'Este e-mail já está em uso por outro administrador.',
    });
  }

  const result = await query(
    `UPDATE admins
        SET name = $1, email = $2, phone = $3
      WHERE id = $4
    RETURNING id, name, email, phone, updated_at`,
    [name.trim(), normalizedEmail, phone || null, req.user.id]
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

  const adminResult = await query(
    'SELECT password_hash FROM admins WHERE id = $1',
    [req.user.id]
  );
  if (adminResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  }

  const match = await bcrypt.compare(currentPassword, adminResult.rows[0].password_hash);
  if (!match) {
    return res.status(422).json({
      success: false,
      error: 'A "Senha Atual" informada não corresponde à cadastrada.',
    });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

  return res.status(200).json({
    success: true,
    message: 'Senha alterada com sucesso.',
  });
}

module.exports = { login, logout, getProfile, updateProfile, changePassword };
