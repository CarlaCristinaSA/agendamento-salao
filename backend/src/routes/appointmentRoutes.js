const router       = require('express').Router();
const controller   = require('../controllers/appointmentController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

router.get('/',
  authenticate, authorize('admin'),
  controller.listAppointments
);

router.get('/:id',
  authenticate, authorize('admin'),
  controller.getAppointmentById
);

router.post('/',
  authenticate, authorize('admin'),
  controller.createAdminAppointment
);

router.patch('/:id/cancel',
  authenticate, authorize('admin'),
  controller.cancelAppointment
);

module.exports = router;
