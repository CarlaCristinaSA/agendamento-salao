/**
 * src/routes/publicRoutes.js
 * Rotas públicas (sem autenticação) — acesso do cliente.
 * HU-006: seleção de serviço, disponibilidade e agendamento.
 */

const router     = require('express').Router();
const serviceController     = require('../controllers/serviceController');
const availabilityController = require('../controllers/availabilityController');
const appointmentController  = require('../controllers/appointmentController');

// GET  /api/public/services         — listar serviços ativos (HU-006, RN-004)
router.get('/services', serviceController.listActiveServices);

// GET  /api/public/availability     — slots disponíveis (HU-006)
// Query params: date, service_id
router.get('/availability', availabilityController.getAvailableSlots);

// POST /api/public/appointments     — criar agendamento (HU-006, RN-005)
router.post('/appointments', appointmentController.createClientAppointment);

module.exports = router;
