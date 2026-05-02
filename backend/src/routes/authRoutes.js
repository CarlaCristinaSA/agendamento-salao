/**
 * src/routes/authRoutes.js
 * Rotas de autenticação e perfil do administrador (EP-004).
 */

const router     = require('express').Router();
const controller = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

// POST /api/auth/login  — login (HU-009)
router.post('/login', controller.login);

// POST /api/auth/logout  — encerrar sessão (HU-010) [requer auth]
router.post('/logout', authenticate, controller.logout);

// GET  /api/auth/me     — perfil do admin (HU-012)
router.get('/me', authenticate, controller.getProfile);

// PUT  /api/auth/me     — atualizar dados pessoais (HU-012)
router.put('/me', authenticate, controller.updateProfile);

// PUT  /api/auth/me/password — alterar senha (HU-012)
router.put('/me/password', authenticate, controller.changePassword);

module.exports = router;
