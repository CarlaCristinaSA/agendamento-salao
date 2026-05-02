/**
 * src/routes/reportRoutes.js
 * Rotas de relatórios gerenciais (EP-006).
 */

const router       = require('express').Router();
const controller   = require('../controllers/reportController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// GET /api/admin/reports/appointments — relatório de agendamentos (HU-016)
router.get('/appointments',
  authenticate, authorize('admin'),
  controller.getAppointmentsReport
);

// GET /api/admin/reports/services — indicadores de serviços (HU-017)
router.get('/services',
  authenticate, authorize('admin'),
  controller.getServicesIndicators
);

module.exports = router;
