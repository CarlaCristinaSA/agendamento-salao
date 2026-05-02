/**
 * src/config/database.js
 * Configuração e pool de conexões com o PostgreSQL.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
});

/**
 * @param {string} text - SQL
 * @param {Array}  params - Parâmetros
 */
const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
