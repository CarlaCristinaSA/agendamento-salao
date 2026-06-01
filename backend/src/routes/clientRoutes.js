const router       = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

const serviceController      = require('../controllers/serviceController');
const availabilityController = require('../controllers/availabilityController');
const appointmentController  = require('../controllers/appointmentController');

router.use(authenticate, authorize('client'));

router.get('/services',      serviceController.listActiveServices);
router.get('/availability',  availabilityController.getAvailableSlots);
router.post('/appointments', appointmentController.createMyAppointment);

router.get('/appointments',  appointmentController.listMyAppointments);

router.patch('/appointments/:id/cancel', appointmentController.cancelMyAppointment);

module.exports = router;
