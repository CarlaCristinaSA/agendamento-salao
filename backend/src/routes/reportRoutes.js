const router       = require('express').Router();
const controller   = require('../controllers/reportController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/appointments',
  authenticate, authorize('admin'),
  controller.getAppointmentsReport
);

router.get('/services',
  authenticate, authorize('admin'),
  controller.getServicesIndicators
);

module.exports = router;
