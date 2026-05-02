/**
 * src/routes/appointmentRoutes.js
 * Rotas de agendamento (EP-003, EP-005).
 */

const router       = require('express').Router();
const controller   = require('../controllers/appointmentController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// ---- Rotas administrativas ----

// GET   /api/admin/appointments        — listar agendamentos (HU-013)
router.get('/',
  authenticate, authorize('admin'),
  controller.listAppointments
);

// GET   /api/admin/appointments/:id    — detalhe (HU-014)
router.get('/:id',
  authenticate, authorize('admin'),
  controller.getAppointmentById
);

// POST  /api/admin/appointments        — agendamento administrativo (HU-008)
router.post('/',
  authenticate, authorize('admin'),
  controller.createAdminAppointment
);

// PATCH /api/admin/appointments/:id/cancel — cancelar (HU-015)
router.patch('/:id/cancel',
  authenticate, authorize('admin'),
  controller.cancelAppointment
);

module.exports = router;
