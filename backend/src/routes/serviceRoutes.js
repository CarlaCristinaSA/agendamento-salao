const router     = require('express').Router();
const controller = require('../controllers/serviceController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/',
  authenticate, authorize('admin'),
  controller.listServices
);

router.get('/:id',
  authenticate, authorize('admin'),
  controller.getServiceById
);

router.post('/',
  authenticate, authorize('admin'),
  controller.createService
);

router.put('/:id',
  authenticate, authorize('admin'),
  controller.updateService
);

router.patch('/:id/toggle-status',
  authenticate, authorize('admin'),
  controller.toggleServiceStatus
);

module.exports = router;
