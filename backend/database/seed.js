/**
 * database/seed.js
 * Popula o banco com dados iniciais (admin padrão).
 * Execute: npm run db:seed
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('▶  Aplicando schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✔  Schema aplicado.');

    const email = 'admin@salao.com';
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO admins (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', email, '(85) 99999-9999', hash]
    );
    console.log('✔  Admin padrão criado (ou já existente).');
    console.log(`   E-mail : ${email}`);
    console.log(`   Senha  : ${password}`);

    const services = [
      { name: 'Corte Feminino', duration: 60, price: 80.00 },
      { name: 'Corte Masculino', duration: 30, price: 40.00 },
      { name: 'Coloração',       duration: 120, price: 150.00 },
      { name: 'Escova',          duration: 45,  price: 60.00 },
      { name: 'Manicure',        duration: 45,  price: 35.00 },
    ];

    for (const s of services) {
      await client.query(
        `INSERT INTO services (name, duration_minutes, price)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [s.name, s.duration, s.price]
      );
    }
    console.log('✔  Serviços de exemplo criados (ou já existentes).');

    const businessHours = [
      { type: 'day_of_week', day_of_week: 1, start_time: '09:00', end_time: '18:00' }, // Segunda
      { type: 'day_of_week', day_of_week: 2, start_time: '09:00', end_time: '18:00' }, // Terça
      { type: 'day_of_week', day_of_week: 3, start_time: '09:00', end_time: '18:00' }, // Quarta
      { type: 'day_of_week', day_of_week: 4, start_time: '09:00', end_time: '18:00' }, // Quinta
      { type: 'day_of_week', day_of_week: 5, start_time: '09:00', end_time: '18:00' }, // Sexta
      { type: 'day_of_week', day_of_week: 6, start_time: '09:00', end_time: '13:00' }, // Sábado
    ];

    for (const bh of businessHours) {
      await client.query(
        `INSERT INTO business_hours (type, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [bh.type, bh.day_of_week, bh.start_time, bh.end_time]
      );
    }
    console.log('✔  Horários de funcionamento de exemplo criados.');

    console.log('\n✅ Seed concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
