const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '9512',
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Adding risk_score column...');
    await client.query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "risk_score" DOUBLE PRECISION DEFAULT 0`);
    
    console.log('Adding anomaly_flag column...');
    await client.query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "anomaly_flag" INTEGER DEFAULT 0`);

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
