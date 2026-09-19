const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');
const seed = require('./seed-data');

/* Runs on every boot. Creates tables if missing (cheap, idempotent), then
   seeds them ONLY if empty — so an admin's edits are never overwritten by a
   redeploy. The admin password is the one exception: it is re-synced from
   ADMIN_USERNAME / ADMIN_PASSWORD on every boot so rotating the Render env
   var is how the password is changed from outside the admin panel too. */
async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows: [{ count: courseCount }] } = await pool.query('SELECT count(*)::int AS count FROM courses');
  if (Number(courseCount) === 0) {
    console.log('[migrate] seeding courses, electives, timetables, site_settings...');
    await seedAll();
  }

  await syncAdminUser();
  console.log('[migrate] ready.');
}

async function seedAll() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO site_settings (key, value) VALUES ($1,$2),($3,$4),($5,$6)
       ON CONFLICT (key) DO NOTHING`,
      ['meta', seed.meta, 'programmes', seed.programmes, 'kinds', seed.kinds]
    );

    let order = 0;
    for (const c of seed.courses) {
      await client.query(
        `INSERT INTO courses (prog, sem, code, title, credits, type, notes, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (prog, code) DO NOTHING`,
        [c.prog, c.sem, c.code, c.title, c.credits, c.type, c.notes || null, order++]
      );
    }

    let eorder = 0;
    for (const prog of Object.keys(seed.electives)) {
      for (const e of seed.electives[prog]) {
        await client.query(
          `INSERT INTO electives (prog, code, title, sort_order) VALUES ($1,$2,$3,$4)
           ON CONFLICT (prog, code) DO NOTHING`,
          [prog, e.code, e.title, eorder++]
        );
      }
    }

    for (const tt of seed.timetables) {
      await client.query(
        `INSERT INTO timetables (id, prog, sem, batch, ay, faculty, venue, start_date, end_date, source, flags, slots, days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [tt.id, tt.prog, tt.sem, tt.batch, tt.ay, tt.faculty, tt.venue, tt.start, tt.end,
         tt.source, JSON.stringify(tt.flags || []), JSON.stringify(tt.slots), JSON.stringify(tt.days)]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function syncAdminUser() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('[migrate] ADMIN_PASSWORD not set — admin login will be unavailable until it is.');
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash) VALUES ($1,$2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
    [username, hash]
  );
}

module.exports = { migrate };
