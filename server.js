require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { migrate } = require('./db/migrate');
const api = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8790;

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use('/api', api);

// The student-facing site is just the timetable + course catalogue; there is
// no separate marketing homepage, so "/" goes straight to the timetable.
app.get('/', (req, res) => res.redirect('/timetable.html'));

app.use(express.static(path.join(__dirname, 'public')));

// Any other non-API, non-file path falls back to the timetable too.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'timetable.html'), err => { if (err) next(); });
});

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] RSPH Smart Timetable listening on :${PORT}`));
  })
  .catch(e => {
    console.error('[migrate] failed:', e);
    process.exit(1);
  });
