-- RSPH Smart Timetable — schema
-- JSONB is used for the shape that is naturally nested (slot grids, per-day
-- blocks, flags) rather than forcing a deep relational model onto data that
-- the admin UI and the frontend both already treat as one editable document.

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
-- keys used: 'meta', 'programmes', 'kinds'

CREATE TABLE IF NOT EXISTS courses (
  id         SERIAL PRIMARY KEY,
  prog       TEXT NOT NULL,
  sem        INT NOT NULL,
  code       TEXT NOT NULL,
  title      TEXT NOT NULL,
  credits    NUMERIC NOT NULL DEFAULT 0,
  type       TEXT NOT NULL DEFAULT 'core',   -- core | elective | ogec | experiential
  notes      TEXT,                            -- optional relative link to a course-notes page
  faculty    TEXT,                            -- who is in charge of this subject (for load/appraisal)
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(prog, code)
);
-- Added after the first release; safe to run again on an already-existing table.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS faculty TEXT;

CREATE TABLE IF NOT EXISTS electives (
  id         SERIAL PRIMARY KEY,
  prog       TEXT NOT NULL,
  code       TEXT NOT NULL,
  title      TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(prog, code)
);

CREATE TABLE IF NOT EXISTS timetables (
  id         TEXT PRIMARY KEY,               -- e.g. 'mph-1'
  prog       TEXT NOT NULL,
  sem        INT NOT NULL,
  batch      TEXT,
  ay         TEXT,
  faculty    TEXT,
  venue      TEXT,
  start_date DATE,
  end_date   DATE,
  source     TEXT,
  flags      JSONB NOT NULL DEFAULT '[]',
  slots      JSONB NOT NULL DEFAULT '[]',     -- [{s,e,label,lunch?}]
  days       JSONB NOT NULL DEFAULT '{}',     -- {Mon:[{i,n,t,c?,f?,k,v?}], ...}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prog, sem)
);
