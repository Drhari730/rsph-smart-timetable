const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');
const seed = require('./seed-data');
const courseModulesSeed = require('./course-modules-seed');

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

  // Checked independently of the block above: course_modules is a table
  // added after the first release, so it starts empty even on an
  // already-seeded database — it needs its own "seed if empty" gate rather
  // than piggybacking on courseCount, which is already non-zero by then.
  const { rows: [{ count: moduleCount }] } = await pool.query('SELECT count(*)::int AS count FROM course_modules');
  if (Number(moduleCount) === 0 && courseModulesSeed.length) {
    console.log('[migrate] seeding course_modules...');
    await seedCourseModules();
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
        `INSERT INTO courses (prog, sem, code, title, credits, type, notes, faculty, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (prog, code) DO NOTHING`,
        [c.prog, c.sem, c.code, c.title, c.credits, c.type, c.notes || null, c.faculty || null, order++]
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

async function seedCourseModules() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const m of courseModulesSeed) {
      await client.query(
        `INSERT INTO course_modules (prog, code, seq, title, hours, objectives, topics, guide)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (prog, code, seq) DO NOTHING`,
        [m.prog, m.code, m.seq, m.title, m.hours, JSON.stringify(m.objectives || []),
         JSON.stringify(m.topics || []), JSON.stringify(m.guide || {})]
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
  // Exactly one admin account, controlled entirely by ADMIN_USERNAME /
  // ADMIN_PASSWORD. If the username env var is changed (e.g. switched to an
  // email address), the old login is removed rather than left active
  // alongside the new one.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM admin_users WHERE username <> $1', [username]);
    await client.query(
      `INSERT INTO admin_users (username, password_hash) VALUES ($1,$2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
      [username, hash]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { migrate };
