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

    const adminEmail = 'admin@salao.com';
    const adminPass  = 'Admin@123';
    const adminHash  = await bcrypt.hash(adminPass, 12);

    await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', adminEmail, '(85) 99999-9999', adminHash]
    );
    console.log('✔  Admin padrão criado (ou já existente).');
    console.log(`   E-mail : ${adminEmail}`);
    console.log(`   Senha  : ${adminPass}`);

    const clientEmail = 'cliente@exemplo.com';
    const clientPass  = 'Cliente@123';
    const clientHash  = await bcrypt.hash(clientPass, 12);

    await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client')
       ON CONFLICT (email) DO NOTHING`,
      ['Maria Cliente', clientEmail, '(85) 98888-7777', clientHash]
    );
    console.log('✔  Cliente de exemplo criado (ou já existente).');
    console.log(`   E-mail : ${clientEmail}`);
    console.log(`   Senha  : ${clientPass}`);

    const services = [
      { name: 'Corte Feminino',  duration: 60,  price: 80.00 },
      { name: 'Corte Masculino', duration: 30,  price: 40.00 },
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
      { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
      { day_of_week: 2, start_time: '09:00', end_time: '18:00' },
      { day_of_week: 3, start_time: '09:00', end_time: '18:00' },
      { day_of_week: 4, start_time: '09:00', end_time: '18:00' },
      { day_of_week: 5, start_time: '09:00', end_time: '18:00' },
      { day_of_week: 6, start_time: '09:00', end_time: '13:00' },
    ];

    const existingHours = await client.query(`SELECT COUNT(*)::int AS c FROM business_hours`);
    if (existingHours.rows[0].c === 0) {
      for (const bh of businessHours) {
        await client.query(
          `INSERT INTO business_hours (type, day_of_week, start_time, end_time)
           VALUES ('day_of_week', $1, $2, $3)`,
          [bh.day_of_week, bh.start_time, bh.end_time]
        );
      }
      console.log('✔  Horários de funcionamento de exemplo criados.');
    } else {
      console.log('✔  Horários de funcionamento já existentes (ignorado).');
    }

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
