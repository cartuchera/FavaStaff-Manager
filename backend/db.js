const { Pool } = require('pg');
require('dotenv').config();

// Configuración para Railway o local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Fallback para desarrollo local
if (!process.env.DATABASE_URL) {
  pool.options = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  };
}

module.exports = pool;
