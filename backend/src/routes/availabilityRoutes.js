const router       = require('express').Router();
const controller   = require('../controllers/availabilityController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/',
  authenticate, authorize('admin'),
  controller.listBusinessHours
);

router.get('/slots',
  authenticate, authorize('admin'),
  controller.getAvailableSlots
);

router.get('/:id',
  authenticate, authorize('admin'),
  controller.getBusinessHourById
);

router.post('/',
  authenticate, authorize('admin'),
  controller.createBusinessHour
);

router.delete('/:id',
  authenticate, authorize('admin'),
  controller.deleteBusinessHour
);

module.exports = router;
