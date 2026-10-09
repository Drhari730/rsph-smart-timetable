const { Pool, types } = require('pg');

// DATE columns come back as 'YYYY-MM-DD' strings, not JS Dates, so a date
// never shifts by a day through the server's time zone.
types.setTypeParser(1082, v => v);

// Render's managed Postgres requires SSL but presents a certificate chain
// `pg` won't validate by default in this network path; disabling verification
// (not the connection's encryption) is the standard approach for Render/Heroku-
// style hosted Postgres from a Node client.
const useSSL = /render\.com|amazonaws\.com|neon\.tech/.test(process.env.DATABASE_URL || '') ||
               process.env.PGSSL === 'require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

module.exports = pool;
