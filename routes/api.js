const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken, setAuthCookie, clearAuthCookie, requireAdmin, readAdmin } = require('../middleware/auth');

const router = express.Router();

/* =========================================================================
   PUBLIC — read-only, shapes the payload exactly like the old static
   RSPH object so the existing frontend code needs no rewrite beyond
   fetching it once at load.
   ========================================================================= */
router.get('/bootstrap', async (req, res) => {
  try {
    const [settings, courses, electivesRows, timetables, moduleRows] = await Promise.all([
      pool.query('SELECT key, value FROM site_settings'),
      pool.query('SELECT id, prog, sem, code, title, credits, type, notes, faculty FROM courses ORDER BY prog, sem, sort_order, code'),
      pool.query('SELECT prog, code, title FROM electives ORDER BY prog, sort_order, code'),
      pool.query(`SELECT id, prog, sem, batch, ay, faculty, venue,
                         to_char(start_date,'YYYY-MM-DD') AS start,
                         to_char(end_date,'YYYY-MM-DD') AS end,
                         source, flags, slots, days
                  FROM timetables ORDER BY prog, sem`),
      pool.query('SELECT prog, code, seq, title, hours, objectives, topics, guide FROM course_modules ORDER BY prog, code, seq')
    ]);

    const settingsMap = {};
    settings.rows.forEach(r => { settingsMap[r.key] = r.value; });

    const electives = {};
    electivesRows.rows.forEach(e => {
      (electives[e.prog] = electives[e.prog] || []).push({ code: e.code, title: e.title });
    });

    // pending = (prog, sem 1-4) combinations that have scheme courses but no timetable
    const havePairs = new Set(timetables.rows.map(t => t.prog + ':' + t.sem));
    const schemePairs = new Set(courses.rows.map(c => c.prog + ':' + c.sem));
    const pending = [];
    [...schemePairs].forEach(key => {
      if (!havePairs.has(key)) {
        const [prog, sem] = key.split(':');
        pending.push({ prog, sem: +sem });
      }
    });
    pending.sort((a, b) => a.prog.localeCompare(b.prog) || a.sem - b.sem);

    const modules = {}; // { 'mph:PHC501A': [ {seq,title,hours,objectives,topics,guide}, ... ] }
    moduleRows.rows.forEach(m => {
      const key = m.prog + ':' + m.code;
      (modules[key] = modules[key] || []).push({
        seq: m.seq, title: m.title, hours: Number(m.hours),
        objectives: m.objectives, topics: m.topics, guide: m.guide
      });
    });

    res.json({
      meta: settingsMap.meta || {},
      programmes: settingsMap.programmes || {},
      kinds: settingsMap.kinds || {},
      courses: courses.rows,
      electives,
      timetables: timetables.rows,
      modules,
      pending
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load timetable data.' });
  }
});

/* =========================================================================
   AUTH
   ========================================================================= */
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const { rows } = await pool.query('SELECT username, password_hash FROM admin_users WHERE username = $1', [username]);
  if (!rows.length) return res.status(401).json({ error: 'Incorrect username or password.' });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' });

  setAuthCookie(res, signToken(rows[0].username));
  res.json({ ok: true, username: rows[0].username });
});

router.post('/auth/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });

router.get('/auth/me', (req, res) => {
  const admin = readAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ username: admin.u });
});

router.post('/auth/change-password', requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters; current password is required.' });
  }
  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE username = $1', [req.admin.u]);
  if (!rows.length) return res.status(404).json({ error: 'Account not found.' });
  const ok = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = now() WHERE username = $2', [hash, req.admin.u]);
  res.json({ ok: true });
});

/* =========================================================================
   ADMIN — courses
   ========================================================================= */
router.get('/admin/courses', requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY prog, sem, sort_order, code');
  res.json(rows);
});

router.post('/admin/courses', requireAdmin, async (req, res) => {
  const c = req.body || {};
  if (!c.prog || !c.sem || !c.code || !c.title) return res.status(400).json({ error: 'prog, sem, code and title are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (prog, sem, code, title, credits, type, notes, faculty, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE((SELECT max(sort_order)+1 FROM courses WHERE prog=$1),0))
       RETURNING *`,
      [c.prog, c.sem, c.code, c.title, c.credits || 0, c.type || 'core', c.notes || null, c.faculty || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'That course code already exists for this programme.' });
    console.error(e); res.status(500).json({ error: 'Could not create the course.' });
  }
});

router.put('/admin/courses/:id', requireAdmin, async (req, res) => {
  const c = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE courses SET prog=$1, sem=$2, code=$3, title=$4, credits=$5, type=$6, notes=$7, faculty=$8
       WHERE id=$9 RETURNING *`,
      [c.prog, c.sem, c.code, c.title, c.credits || 0, c.type || 'core', c.notes || null, c.faculty || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found.' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'That course code already exists for this programme.' });
    console.error(e); res.status(500).json({ error: 'Could not update the course.' });
  }
});

router.delete('/admin/courses/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* =========================================================================
   ADMIN — electives
   ========================================================================= */
router.get('/admin/electives', requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM electives ORDER BY prog, sort_order, code');
  res.json(rows);
});

router.post('/admin/electives', requireAdmin, async (req, res) => {
  const e = req.body || {};
  if (!e.prog || !e.code || !e.title) return res.status(400).json({ error: 'prog, code and title are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO electives (prog, code, title, sort_order)
       VALUES ($1,$2,$3, COALESCE((SELECT max(sort_order)+1 FROM electives WHERE prog=$1),0)) RETURNING *`,
      [e.prog, e.code, e.title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That elective code already exists for this programme.' });
    console.error(err); res.status(500).json({ error: 'Could not create the elective.' });
  }
});

router.put('/admin/electives/:id', requireAdmin, async (req, res) => {
  const e = req.body || {};
  const { rows } = await pool.query(
    'UPDATE electives SET prog=$1, code=$2, title=$3 WHERE id=$4 RETURNING *',
    [e.prog, e.code, e.title, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Elective not found.' });
  res.json(rows[0]);
});

router.delete('/admin/electives/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM electives WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* =========================================================================
   ADMIN — timetables (meta + full slots/days document)
   ========================================================================= */
router.get('/admin/timetables', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, prog, sem, batch, ay, faculty, venue,
            to_char(start_date,'YYYY-MM-DD') AS start,
            to_char(end_date,'YYYY-MM-DD') AS end, source
     FROM timetables ORDER BY prog, sem`);
  res.json(rows);
});

router.get('/admin/timetables/:id', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, prog, sem, batch, ay, faculty, venue,
            to_char(start_date,'YYYY-MM-DD') AS start,
            to_char(end_date,'YYYY-MM-DD') AS end,
            source, flags, slots, days
     FROM timetables WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Timetable not found.' });
  res.json(rows[0]);
});

function validTimetableBody(t) {
  if (!t.id || !t.prog || !t.sem) return 'id, prog and sem are required.';
  if (!Array.isArray(t.slots) || !t.slots.length) return 'At least one time slot is required.';
  if (!t.days || typeof t.days !== 'object') return 'days must be an object keyed by weekday.';
  return null;
}

router.post('/admin/timetables', requireAdmin, async (req, res) => {
  const t = req.body || {};
  const err = validTimetableBody(t);
  if (err) return res.status(400).json({ error: err });
  try {
    const { rows } = await pool.query(
      `INSERT INTO timetables (id, prog, sem, batch, ay, faculty, venue, start_date, end_date, source, flags, slots, days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [t.id, t.prog, t.sem, t.batch || null, t.ay || null, t.faculty || null, t.venue || null,
       t.start || null, t.end || null, t.source || null,
       JSON.stringify(t.flags || []), JSON.stringify(t.slots), JSON.stringify(t.days)]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A timetable with that id (or that programme+semester) already exists.' });
    console.error(e); res.status(500).json({ error: 'Could not create the timetable.' });
  }
});

router.put('/admin/timetables/:id', requireAdmin, async (req, res) => {
  const t = req.body || {};
  const err = validTimetableBody({ ...t, id: t.id || req.params.id });
  if (err) return res.status(400).json({ error: err });
  try {
    const { rows } = await pool.query(
      `UPDATE timetables SET
         id=$1, prog=$2, sem=$3, batch=$4, ay=$5, faculty=$6, venue=$7,
         start_date=$8, end_date=$9, source=$10, flags=$11, slots=$12, days=$13, updated_at=now()
       WHERE id = $14 RETURNING id`,
      [t.id || req.params.id, t.prog, t.sem, t.batch || null, t.ay || null, t.faculty || null, t.venue || null,
       t.start || null, t.end || null, t.source || null,
       JSON.stringify(t.flags || []), JSON.stringify(t.slots), JSON.stringify(t.days), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Timetable not found.' });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Another timetable already uses that id or programme+semester.' });
    console.error(e); res.status(500).json({ error: 'Could not update the timetable.' });
  }
});

router.delete('/admin/timetables/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM timetables WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* =========================================================================
   ADMIN — course modules (the day-wise syllabus plan behind a subject)
   Edited whole-course-at-a-time: the admin panel sends the complete ordered
   module list for one (prog, code) and it replaces whatever was there.
   ========================================================================= */
router.get('/admin/modules/:prog/:code', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT seq, title, hours, objectives, topics, guide FROM course_modules WHERE prog=$1 AND code=$2 ORDER BY seq',
    [req.params.prog, req.params.code]
  );
  res.json(rows);
});

router.put('/admin/modules/:prog/:code', requireAdmin, async (req, res) => {
  const list = Array.isArray(req.body) ? req.body : null;
  if (!list) return res.status(400).json({ error: 'Body must be a JSON array of modules.' });
  const { prog, code } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM course_modules WHERE prog=$1 AND code=$2', [prog, code]);
    let seq = 1;
    for (const m of list) {
      if (!m.title) throw Object.assign(new Error('Every module needs a title.'), { status: 400 });
      await client.query(
        `INSERT INTO course_modules (prog, code, seq, title, hours, objectives, topics, guide)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [prog, code, seq++, m.title, m.hours || 0,
         JSON.stringify(m.objectives || []), JSON.stringify(m.topics || []), JSON.stringify(m.guide || {})]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: list.length });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.status === 400) return res.status(400).json({ error: e.message });
    console.error(e); res.status(500).json({ error: 'Could not save the module plan.' });
  } finally {
    client.release();
  }
});

/* =========================================================================
   ADMIN — site settings (advanced: programmes / kinds / meta as raw JSON)
   ========================================================================= */
router.get('/admin/settings', requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  const out = {}; rows.forEach(r => { out[r.key] = r.value; });
  res.json(out);
});

router.put('/admin/settings/:key', requireAdmin, async (req, res) => {
  const key = req.params.key;
  if (!['meta', 'programmes', 'kinds'].includes(key)) return res.status(400).json({ error: 'Unknown settings key.' });
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ($1,$2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, req.body]
  );
  res.json({ ok: true });
});

module.exports = router;
