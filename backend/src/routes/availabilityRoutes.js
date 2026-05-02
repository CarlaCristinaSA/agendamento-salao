/**
 * src/routes/availabilityRoutes.js
 * Rotas de gestão de disponibilidade (EP-002, HU-005).
 */

const router       = require('express').Router();
const controller   = require('../controllers/availabilityController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// ---- Rotas administrativas ----

// GET    /api/admin/availability          — listar horários
router.get('/',
  authenticate, authorize('admin'),
  controller.listBusinessHours
);

// GET    /api/admin/availability/slots    — slots disponíveis (uso admin)
router.get('/slots',
  authenticate, authorize('admin'),
  controller.getAvailableSlots
);

// GET    /api/admin/availability/:id      — detalhe
router.get('/:id',
  authenticate, authorize('admin'),
  controller.getBusinessHourById
);

// POST   /api/admin/availability          — cadastrar horário (HU-005)
router.post('/',
  authenticate, authorize('admin'),
  controller.createBusinessHour
);

// DELETE /api/admin/availability/:id      — remover horário
router.delete('/:id',
  authenticate, authorize('admin'),
  controller.deleteBusinessHour
);

module.exports = router;
