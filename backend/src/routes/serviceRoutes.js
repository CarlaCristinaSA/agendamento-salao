/**
 * src/routes/serviceRoutes.js
 * Rotas de gestão de serviços (EP-001).
 */

const router     = require('express').Router();
const controller = require('../controllers/serviceController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// ---- Rotas administrativas (requerem autenticação + papel admin) ----

// GET    /api/admin/services         — listar todos (HU-002)
router.get('/',
  authenticate, authorize('admin'),
  controller.listServices
);

// GET    /api/admin/services/:id     — detalhe de um serviço
router.get('/:id',
  authenticate, authorize('admin'),
  controller.getServiceById
);

// POST   /api/admin/services         — cadastrar (HU-001)
router.post('/',
  authenticate, authorize('admin'),
  controller.createService
);

// PUT    /api/admin/services/:id     — editar (HU-003)
router.put('/:id',
  authenticate, authorize('admin'),
  controller.updateService
);

// PATCH  /api/admin/services/:id/toggle-status — ativar/desativar (HU-004)
router.patch('/:id/toggle-status',
  authenticate, authorize('admin'),
  controller.toggleServiceStatus
);

module.exports = router;
