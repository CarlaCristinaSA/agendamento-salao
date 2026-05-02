/**
 * src/config/database.js
 * Configuração e pool de conexões com o PostgreSQL.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configurações adicionais de pool
  max: 20,               // máximo de conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
});

/**
 * Executa uma query simples no pool.
 * @param {string} text - SQL
 * @param {Array}  params - Parâmetros
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtém um client do pool (para transações manuais).
 * Lembre-se de chamar client.release() após uso.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
