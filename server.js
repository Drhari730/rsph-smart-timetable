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

app.use(express.static(path.join(__dirname, 'public')));

// Any non-API, non-file path falls back to index.html (keeps deep links tidy
// if the site ever grows client-side routes).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => { if (err) next(); });
});

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] RSPH Smart Timetable listening on :${PORT}`));
  })
  .catch(e => {
    console.error('[migrate] failed:', e);
    process.exit(1);
  });
