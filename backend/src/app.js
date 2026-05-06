require('dotenv').config();
require('express-async-errors'); // Captura erros assíncronos automaticamente

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const authRoutes         = require('./routes/authRoutes');
const serviceRoutes      = require('./routes/serviceRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const publicRoutes       = require('./routes/publicRoutes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());

app.use(cors({
  origin:  process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status:  'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/public', publicRoutes);

app.use('/api/auth',          authRoutes);
app.use('/api/admin/services',      serviceRoutes);
app.use('/api/admin/availability',  availabilityRoutes);
app.use('/api/admin/appointments',  appointmentRoutes);
app.use('/api/admin/reports',       reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log('════════════════════════════════════════════');
  console.log('  🏪  Salão de Beleza — Agendamento API');
  console.log('════════════════════════════════════════════');
  console.log(`  Ambiente : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Porta    : ${PORT}`);
  console.log(`  Health   : http://localhost:${PORT}/health`);
  console.log('────────────────────────────────────────────');
  console.log('  Endpoints públicos (cliente):');
  console.log(`    GET  /api/public/services`);
  console.log(`    GET  /api/public/availability`);
  console.log(`    POST /api/public/appointments`);
  console.log('────────────────────────────────────────────');
  console.log('  Endpoints administrativos:');
  console.log(`    POST /api/auth/login`);
  console.log(`    GET  /api/admin/services`);
  console.log(`    GET  /api/admin/appointments`);
  console.log(`    GET  /api/admin/reports/appointments`);
  console.log('════════════════════════════════════════════');
});

module.exports = app;
