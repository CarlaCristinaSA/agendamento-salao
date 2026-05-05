const router     = require('express').Router();
const serviceController     = require('../controllers/serviceController');
const availabilityController = require('../controllers/availabilityController');
const appointmentController  = require('../controllers/appointmentController');

router.get('/services', serviceController.listActiveServices);

router.get('/availability', availabilityController.getAvailableSlots);

router.post('/appointments', appointmentController.createClientAppointment);

module.exports = router;
