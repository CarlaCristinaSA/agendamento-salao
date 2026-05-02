/**
 * src/app.js
 * Configuração principal do servidor Express.
 * Sistema de Agendamento de Salão de Beleza — UFC Quixadá 2026.
 */

require('dotenv').config();
require('express-async-errors'); // Captura erros assíncronos automaticamente

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

// Importa rotas
const authRoutes         = require('./routes/authRoutes');
const serviceRoutes      = require('./routes/serviceRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const publicRoutes       = require('./routes/publicRoutes');

// Middleware de tratamento de erros
const errorHandler = require('./middlewares/errorHandler');

// ──────────────────────────────────────────────
const app = express();

// ── Segurança (RNF-007) ─────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────
app.use(cors({
  origin:  process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ─────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status:  'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Rotas públicas (clientes — sem autenticação) ─
app.use('/api/public', publicRoutes);

// ── Rotas administrativas ────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/admin/services',      serviceRoutes);
app.use('/api/admin/availability',  availabilityRoutes);
app.use('/api/admin/appointments',  appointmentRoutes);
app.use('/api/admin/reports',       reportRoutes);

// ── 404 ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

// ── Tratamento centralizado de erros ─────────
app.use(errorHandler);

// ── Inicialização do servidor ─────────────────
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
