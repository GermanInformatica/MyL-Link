const mysql = require('mysql2/promise');

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myl_link_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: (process.env.DB_SSL === 'true' || isRemote) ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
