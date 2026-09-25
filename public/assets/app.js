/* ===========================================================================
   RSPH Smart Timetable — derivation + rendering engine
   Every view on this site is computed from assets/data.js at page load.
   =========================================================================== */
(function (global) {
'use strict';

/* ---------- small helpers ------------------------------------------------ */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

const toMin = t => { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]); };
const fmtHM = m => {
  const h24 = Math.floor(m / 60), mm = m % 60;
  const h = ((h24 + 11) % 12) + 1;
  return h + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h24 < 12 ? ' am' : ' pm');
};
const hrs = m => {
  const h = m / 60;
  return (Math.round(h * 10) / 10).toString().replace(/\.0$/, '') + ' h';
};
const stripTags = s => String(s).replace(/<[^>]*>/g, '');
const decode = s => { const d = document.createElement('textarea'); d.innerHTML = String(s); return d.value; };
const plain = s => decode(stripTags(s));

const ISO_DAY = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 };

function parseDate(iso) {
  if (!iso) return null;
  const p = iso.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
function fmtDate(d) {
  if (!d) return null;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ---------- indexes ------------------------------------------------------ */
// Built lazily (not at script-load time): RSPH.courses is only populated once
// the async /api/bootstrap fetch in data.js resolves, which happens after
// this file has already run once as a <script> tag.
function course(prog, code) {
  if (!code || !RSPH.courses) return null;
  for (let i = 0; i < RSPH.courses.length; i++) {
    const c = RSPH.courses[i];
    if (c.prog === prog && c.code === code) return c;
  }
  return null;
}

/* Expand a timetable into flat session records with real clock times. */
function sessions(tt) {
  const out = [];
  RSPH.DAYS.forEach(day => {
    (tt.days[day] || []).forEach(b => {
      const first = tt.slots[b.i];
      const last  = tt.slots[Math.min(b.i + b.n - 1, tt.slots.length - 1)];
      out.push({
        tt, day, block: b,
        start: toMin(first.s), end: toMin(last.e),
        startLabel: fmtHM(toMin(first.s)), endLabel: fmtHM(toMin(last.e)),
        minutes: toMin(last.e) - toMin(first.s),
        // the lunch column is dead time inside a spanning block
        netMinutes: netMinutes(tt, b),
        title: b.t, code: b.c || null, kind: b.k,
        faculty: b.f || null, venue: b.v || tt.venue
      });
    });
  });
  return out;
}

function netMinutes(tt, b) {
  let m = 0;
  for (let k = b.i; k < b.i + b.n && k < tt.slots.length; k++) {
    if (tt.slots[k].lunch) continue;
    m += toMin(tt.slots[k].e) - toMin(tt.slots[k].s);
  }
  return m;
}

const allSessions = () => RSPH.timetables.reduce((a, tt) => a.concat(sessions(tt)), []);

function getTT(prog, sem) {
  return RSPH.timetables.filter(t => t.prog === prog && t.sem === +sem)[0] || null;
}

/* Is a timetable in session on a given date? */
function inTerm(tt, date) {
  const s = parseDate(tt.start), e = parseDate(tt.end);
  if (!s) return null;                       // dates not published
  if (date < s) return false;
  if (e && date > e) return false;
  return true;
}
function weekOfTerm(tt, date) {
  const s = parseDate(tt.start);
  if (!s || date < s) return null;
  return Math.floor((date - s) / 604800000) + 1;
}
function termWeeks(tt) {
  const s = parseDate(tt.start), e = parseDate(tt.end);
  if (!s || !e) return null;
  return Math.round((e - s) / 604800000) + 1;
}

/* ===========================================================================
   SMART VIEW 1 — what is happening right now
   =========================================================================== */
function liveStatus(now) {
  now = now || new Date();
  const dayKey = RSPH.DAYS[(now.getDay() + 6) % 7];
  const mins = now.getHours() * 60 + now.getMinutes();
  const current = [], next = [];

  RSPH.timetables.forEach(tt => {
    const running = inTerm(tt, now);
    const todays = sessions(tt).filter(s => s.day === dayKey && s.kind !== 'lunch');
    todays.sort((a, b) => a.start - b.start);
    const cur = todays.filter(s => mins >= s.start && mins < s.end)[0];
    const nxt = todays.filter(s => s.start > mins)[0];
    if (cur) current.push({ s: cur, running });
    if (nxt) next.push({ s: nxt, running, inMin: nxt.start - mins });
  });
  next.sort((a, b) => a.inMin - b.inMin);
  return { now, dayKey, mins, current, next };
}

/* ===========================================================================
   SMART VIEW 2 — weekly load per course / per kind
   =========================================================================== */
function courseLoad(tt) {
  const map = {};
  sessions(tt).forEach(s => {
    const key = s.code || ('~' + plain(s.title));
    if (!map[key]) {
      const c = course(tt.prog, s.code);
      map[key] = {
        code: s.code, title: c ? c.title : s.title, credits: c ? c.credits : null,
        scheduled: c ? true : false, minutes: 0, count: 0, kinds: {}
      };
    }
    map[key].minutes += s.netMinutes;
    map[key].count += 1;
    map[key].kinds[s.kind] = (map[key].kinds[s.kind] || 0) + 1;
  });
  return Object.keys(map).map(k => map[k]).sort((a, b) => b.minutes - a.minutes);
}

function kindLoad(tt) {
  const map = {};
  sessions(tt).forEach(s => {
    if (s.kind === 'lunch') return;
    map[s.kind] = (map[s.kind] || 0) + s.netMinutes;
  });
  return map;
}

function weeklyContact(tt) {
  return sessions(tt).reduce((a, s) => a + (RSPH.kinds[s.kind] && RSPH.kinds[s.kind].teaching ? s.netMinutes : 0), 0);
}

/* ===========================================================================
   SMART VIEW 3 — named-faculty load across the school
   =========================================================================== */
function facultyLoad() {
  const map = {};
  allSessions().forEach(s => {
    if (!s.faculty) return;
    const k = plain(s.faculty);
    if (!map[k]) map[k] = { name: s.faculty, minutes: 0, sessions: [], named: /^Dr\.|^Prof\.|^Mr\.|^Ms\./.test(k) };
    map[k].minutes += s.netMinutes;
    map[k].sessions.push(s);
  });
  return Object.keys(map).map(k => map[k]).sort((a, b) => b.minutes - a.minutes);
}

/* ===========================================================================
   SMART VIEW 4 — clash detection
   Two sessions clash when they overlap in clock time on the same weekday,
   their terms overlap, and they share a venue or a named faculty member.
   =========================================================================== */
function termsOverlap(a, b) {
  const as = parseDate(a.start), ae = parseDate(a.end);
  const bs = parseDate(b.start), be = parseDate(b.end);
  if (!as || !bs) return null;               // unknown — cannot rule in or out
  if (ae && bs > ae) return false;
  if (be && as > be) return false;
  return true;
}
function sameVenue(a, b) {
  // Exact match only. A hedged label such as "Classroom 1 / available
  // classroom" is deliberately NOT treated as equal to a plain "Classroom 1"
  // — the hedge is the source document itself saying the room isn't fixed,
  // so pairing it against every session that says "Classroom 1" would flag
  // dozens of non-clashes. That specific overlap is called out once, by
  // hand, in the Insights notes instead of by this pairwise check.
  const norm = v => plain(v).toLowerCase().replace(/[^a-z0-9]/g, '');
  const A = norm(a), B = norm(b);
  return !!A && !!B && A === B;
}

function clashes() {
  const list = allSessions().filter(s => s.kind !== 'lunch');
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.tt.id === b.tt.id) continue;
      if (a.day !== b.day) continue;
      if (a.start >= b.end || b.start >= a.end) continue;
      const overlap = termsOverlap(a.tt, b.tt);
      if (overlap === false) continue;
      const venueClash   = sameVenue(a.venue, b.venue);
      const facultyClash = a.faculty && b.faculty && plain(a.faculty) === plain(b.faculty);
      if (!venueClash && !facultyClash) continue;
      out.push({
        a, b, day: a.day,
        from: Math.max(a.start, b.start), to: Math.min(a.end, b.end),
        reason: facultyClash ? 'faculty' : 'venue',
        certain: overlap === true
      });
    }
  }
  return out.sort((x, y) => RSPH.DAYS.indexOf(x.day) - RSPH.DAYS.indexOf(y.day) || x.from - y.from);
}

/* ===========================================================================
   SMART VIEW 5 — scheme coverage
   Which approved-scheme courses actually appear on a published timetable?
   =========================================================================== */
function coverage(prog, sem) {
  const tt = getTT(prog, sem);
  const scheme = RSPH.courses.filter(c => c.prog === prog && c.sem === +sem);
  const seen = {};
  if (tt) sessions(tt).forEach(s => { if (s.code) seen[s.code] = (seen[s.code] || 0) + s.netMinutes; });
  return scheme.map(c => ({
    course: c,
    minutes: seen[c.code] || 0,
    present: !!seen[c.code]
  }));
}

/* ===========================================================================
   ICS export
   =========================================================================== */
function pad(n) { return String(n).padStart(2, '0'); }
function icsStamp(d, mins) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' +
         pad(Math.floor(mins / 60)) + pad(mins % 60) + '00';
}
function firstOccurrence(from, dayKey) {
  const target = ISO_DAY[dayKey];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const cur = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() + ((target - cur + 7) % 7));
  return d;
}

function buildICS(tt) {
  const anchor = parseDate(tt.start) || new Date();
  const until  = parseDate(tt.end);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Ramaiah School of Public Health//RSPH Smart Timetable//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + RSPH.programmes[tt.prog].short + ' Semester ' + tt.sem + ' — RSPH',
    'X-WR-TIMEZONE:Asia/Kolkata'
  ];
  let n = 0;
  sessions(tt).forEach(s => {
    if (s.kind === 'lunch') return;
    const d = firstOccurrence(anchor, s.day);
    const uid = tt.id + '-' + s.day + '-' + s.start + '-' + (++n) + '@rsph.msruas';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + icsStamp(new Date(), 0) );
    lines.push('DTSTART:' + icsStamp(d, s.start));
    lines.push('DTEND:'   + icsStamp(d, s.end));
    lines.push('RRULE:FREQ=WEEKLY;BYDAY=' + s.day.toUpperCase().slice(0, 2) +
               (until ? ';UNTIL=' + icsStamp(until, 1439) : ''));
    lines.push('SUMMARY:' + esc(plain(s.title) + (s.code ? ' (' + s.code + ')' : '')));
    lines.push('LOCATION:' + esc(plain(s.venue)));
    const desc = [RSPH.programmes[tt.prog].name + ' · Semester ' + tt.sem,
                  s.faculty ? 'Faculty: ' + plain(s.faculty) : null,
                  RSPH.kinds[s.kind].label].filter(Boolean).join('\\n');
    lines.push('DESCRIPTION:' + esc(desc));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');

  function esc(t) { return String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
}

function downloadICS(tt) {
  const blob = new Blob([buildICS(tt)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'RSPH-' + RSPH.programmes[tt.prog].short + '-Sem' + tt.sem + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ===========================================================================
   Rendering
   =========================================================================== */
/* ---------- date helpers used by the week-aware views -------------------- */
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dateInWeek(weekStart, dayKey) {
  return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + RSPH.DAYS.indexOf(dayKey));
}
/* true / false against the timetable's own dates; true when no dates exist */
function dateInTerm(tt, d) {
  const s = tt.start ? parseDate(tt.start) : null, e = tt.end ? parseDate(tt.end) : null;
  return (!s || d >= s) && (!e || d <= e);
}
/* the module a given block covers on a given date, or null. Field postings
   carry a course code but aren't classroom teaching, so they don't consume
   (or show) a module. */
function moduleOnDate(tt, b, date) {
  if (!date || !b.c || b.k === 'field' || !dateInTerm(tt, date)) return null;
  return moduleForDate(tt, b.c, date);
}

/* ctx = { day, bi, date } — bi is the block's index in tt.days[day], which is
   how a click finds its way back to the exact session */
function cellHTML(tt, b, opts, ctx) {
  ctx = ctx || {};
  const k = RSPH.kinds[b.k] || RSPH.kinds.lecture;
  const dim = opts && opts.filter && !matches(b, opts.filter) ? ' is-dim' : '';
  const mod = moduleOnDate(tt, b, ctx.date);
  return '<div class="tt-cell tt-click k-' + b.k + dim + '" style="--k:' + k.color + ';--kbg:' + k.bg + '"' +
    (b.c ? ' data-code="' + b.c + '"' : '') + ' data-kind="' + b.k + '"' +
    (ctx.day ? ' data-day="' + ctx.day + '" data-bi="' + ctx.bi + '"' : '') +
    (ctx.date ? ' data-date="' + ymd(ctx.date) + '"' : '') + ' tabindex="0" role="button">' +
      (b.c ? '<span class="tt-code">' + b.c + '</span>' : '') +
      '<span class="tt-title">' + b.t + '</span>' +
      (mod ? '<span class="tt-module">&#128214; ' + mod.module.title + '</span>' : '') +
      (b.f ? '<span class="tt-fac">' + b.f + '</span>' : '') +
    '</div>';
}

function matches(b, f) {
  if (!f) return true;
  if (f.kind && b.k !== f.kind) return false;
  if (f.code && b.c !== f.code) return false;
  if (f.q) {
    const hay = plain(b.t + ' ' + (b.c || '') + ' ' + (b.f || '')).toLowerCase();
    if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
  }
  return true;
}

/* The weekly grid. Days are rows, slots are columns. With opts.weekStart
   (a Monday) it becomes a specific week: real dates on each row and, for
   subjects with a module plan, the module that falls on that date. Without
   it (e.g. the admin preview) it stays the plain recurring template. */
function renderGrid(tt, opts) {
  opts = opts || {};
  const days = RSPH.DAYS.filter(d => tt.days[d] && tt.days[d].length);
  const nowD = new Date();
  const todayKey = RSPH.DAYS[(nowD.getDay() + 6) % 7];
  const liveOK = inTerm(tt, nowD) === true;
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  const ws = opts.weekStart || null;

  let h = '<div class="tt-scroll"><table class="tt-grid"><thead><tr><th class="tt-daycol">Day</th>';
  tt.slots.forEach(s => {
    h += '<th' + (s.lunch ? ' class="tt-lunch-h"' : '') + '><span class="tt-slot">' + s.label + '</span></th>';
  });
  h += '</tr></thead><tbody>';

  days.forEach(day => {
    const date = ws ? dateInWeek(ws, day) : null;
    const isToday = date ? sameYMD(date, nowD) : (liveOK && day === todayKey);
    const outTerm = date && !dateInTerm(tt, date);
    h += '<tr class="' + (isToday ? 'is-today' : '') + (outTerm ? ' is-out' : '') + '"><th class="tt-daycol">' +
         '<span class="tt-day">' + RSPH.DAY_FULL[day] + '</span>' +
         (date ? '<span class="tt-date">' + date.getDate() + ' ' + MONTH_NAMES[date.getMonth()].slice(0, 3) + '</span>' : '') +
         (isToday ? '<span class="tt-today-tag">Today</span>' : '') +
         (outTerm ? '<span class="tt-out-tag">Not in term</span>' : '') + '</th>';

    const blocks = (tt.days[day] || []).map((b, bi) => ({ b, bi })).sort((x, y) => x.b.i - y.b.i);
    let col = 0;
    blocks.forEach(item => {
      const b = item.b, bi = item.bi;
      while (col < b.i) {
        const sl = tt.slots[col];
        h += sl.lunch ? lunchCell(1) : '<td class="tt-empty"></td>';
        col++;
      }
      const spansLunch = tt.slots.slice(b.i, b.i + b.n).some(s => s.lunch);
      const live = isToday && liveOK && nowMin >= toMin(tt.slots[b.i].s) &&
                   nowMin < toMin(tt.slots[Math.min(b.i + b.n - 1, tt.slots.length - 1)].e);
      h += '<td colspan="' + b.n + '" class="tt-td' + (live ? ' is-live' : '') +
           (spansLunch ? ' spans-lunch' : '') + '">' + cellHTML(tt, b, opts, { day: day, bi: bi, date: date }) + '</td>';
      col = b.i + b.n;
    });
    while (col < tt.slots.length) {
      const sl = tt.slots[col];
      h += sl.lunch ? lunchCell(1) : '<td class="tt-empty"></td>';
      col++;
    }
    h += '</tr>';
  });

  h += '</tbody></table></div>';
  return h;

  function lunchCell(n) {
    return '<td class="tt-lunch" colspan="' + n + '"><span>Lunch</span></td>';
  }
}

/* Day-by-day list — the mobile/agenda reading of the same data, week-aware
   in the same way as the grid when opts.weekStart is given. */
function renderAgenda(tt, opts) {
  opts = opts || {};
  const days = RSPH.DAYS.filter(d => tt.days[d] && tt.days[d].length);
  const nowD = new Date();
  const todayKey = RSPH.DAYS[(nowD.getDay() + 6) % 7];
  const liveOK = inTerm(tt, nowD) === true;
  const ws = opts.weekStart || null;

  return '<div class="agenda">' + days.map(day => {
    const date = ws ? dateInWeek(ws, day) : null;
    const isToday = date ? sameYMD(date, nowD) : (liveOK && day === todayKey);
    const outTerm = date && !dateInTerm(tt, date);
    const rows = sessions(tt).filter(s => s.day === day)
      .sort((a, b) => a.start - b.start)
      .filter(s => matches(s.block, opts.filter));
    if (!rows.length) return '';
    return '<section class="agenda-day' + (isToday ? ' is-today' : '') + (outTerm ? ' is-out' : '') + '">' +
      '<h3>' + RSPH.DAY_FULL[day] + (date ? ' <span class="agenda-date">' + fmtDate(date) + '</span>' : '') +
      (isToday ? ' <span class="tt-today-tag">Today</span>' : '') +
      (outTerm ? ' <span class="tt-out-tag">Not in term</span>' : '') + '</h3>' +
      rows.map(s => {
        const k = RSPH.kinds[s.kind];
        const bi = tt.days[day].indexOf(s.block);
        const mod = moduleOnDate(tt, s.block, date);
        return '<div class="agenda-row tt-click" style="--k:' + k.color + ';--kbg:' + k.bg + '" data-day="' + day +
          '" data-bi="' + bi + '"' + (date ? ' data-date="' + ymd(date) + '"' : '') + ' tabindex="0" role="button">' +
          '<span class="agenda-time">' + s.startLabel + '<em>' + s.endLabel + '</em></span>' +
          '<span class="agenda-body">' +
            (s.code ? '<span class="tt-code">' + s.code + '</span>' : '') +
            '<strong>' + s.title + '</strong>' +
            (mod ? '<span class="tt-module">&#128214; Module ' + (mod.moduleIndex + 1) + ': ' + mod.module.title + '</span>' : '') +
            (s.faculty ? '<span class="tt-fac">' + s.faculty + '</span>' : '') +
            '<span class="agenda-meta">' + k.label + ' &middot; ' + s.venue + '</span>' +
          '</span><span class="agenda-open">Details &rsaquo;</span></div>';
      }).join('') + '</section>';
  }).join('') + '</div>';
}

function renderLegend(tt) {
  const used = {};
  sessions(tt).forEach(s => { used[s.kind] = true; });
  return '<div class="tt-legend">' + Object.keys(RSPH.kinds)
    .filter(k => used[k])
    .map(k => '<span class="legend-chip" data-kind="' + k + '" style="--k:' + RSPH.kinds[k].color +
              ';--kbg:' + RSPH.kinds[k].bg + '">' + RSPH.kinds[k].label + '</span>').join('') +
    '</div>';
}

/* ===========================================================================
   Month calendar — the same recurring weekly pattern laid over real dates.
   =========================================================================== */

/* The list of {y, m} (m = 0-indexed) months worth showing for a timetable:
   from its start month (or September of the current year if no start date
   is on record) through its end month (or three months later, i.e.
   September-December, if no end date is on record). Capped at 8 months. */
function monthList(tt) {
  const now = new Date();
  const s = tt.start ? parseDate(tt.start) : new Date(now.getFullYear(), 8, 1);
  const e = tt.end ? parseDate(tt.end) : new Date(s.getFullYear(), s.getMonth() + 3, 1);
  const months = [];
  let y = s.getFullYear(), m = s.getMonth();
  const endKey = e.getFullYear() * 12 + e.getMonth();
  while (y * 12 + m <= endKey && months.length < 8) {
    months.push({ y, m });
    m++; if (m > 11) { m = 0; y++; }
  }
  return months;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function sameYMD(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ===========================================================================
   Day-wise module plan — which module of a subject's approved syllabus lands
   on which real calendar date, worked out from that subject's own module
   hours and its actual weekly timetable slots. Nothing here is typed in by
   date; it is entirely derived, so a timetable edit or a module-hours edit
   both immediately reflow the whole plan.
   =========================================================================== */
function courseModules(prog, code) {
  return (RSPH.modules && RSPH.modules[prog + ':' + code]) || [];
}

function mondayOfWeek(d) {
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
}

const _moduleScheduleCache = {};

/* Walks every real weekly occurrence of `code` on `tt` forward from the
   timetable's own start date (or 1 September of the current year, when no
   start date is on record — the same default the calendar view itself
   falls back to), consuming each module's approved hours in order. Returns
   [{ date, day, module, moduleIndex }], capped at `maxWeeks` (default ~2
   semesters' worth) so a course with no end date doesn't run forever. */
function moduleSchedule(tt, code, maxWeeks) {
  maxWeeks = maxWeeks || 30;
  const cacheKey = tt.id + '|' + code;
  if (_moduleScheduleCache[cacheKey]) return _moduleScheduleCache[cacheKey];

  const mods = courseModules(tt.prog, code);
  const occurrences = [];
  RSPH.DAYS.forEach(day => {
    (tt.days[day] || []).forEach(b => { if (b.c === code && b.k !== 'field') occurrences.push({ day, block: b }); });
  });
  let out = [];
  if (mods.length && occurrences.length) {
    occurrences.sort((a, b) => RSPH.DAYS.indexOf(a.day) - RSPH.DAYS.indexOf(b.day) || a.block.i - b.block.i);

    const now = new Date();
    const realStart = tt.start ? parseDate(tt.start) : new Date(now.getFullYear(), 8, 1);
    const termEnd = tt.end ? parseDate(tt.end) : null;
    const weekStart0 = mondayOfWeek(realStart);

    let modIdx = 0, hoursUsed = 0;
    outer:
    for (let week = 0; week < maxWeeks; week++) {
      for (const occ of occurrences) {
        if (modIdx >= mods.length) break outer;
        const idx = RSPH.DAYS.indexOf(occ.day);
        const date = new Date(weekStart0.getFullYear(), weekStart0.getMonth(), weekStart0.getDate() + week * 7 + idx);
        if (date < realStart) continue;
        if (termEnd && date > termEnd) break outer;
        out.push({ date, day: occ.day, module: mods[modIdx], moduleIndex: modIdx });
        hoursUsed += netMinutes(tt, occ.block) / 60;
        if (hoursUsed >= mods[modIdx].hours) { modIdx++; hoursUsed = 0; }
      }
    }
  }
  _moduleScheduleCache[cacheKey] = out;
  return out;
}

function moduleForDate(tt, code, date) {
  const sched = moduleSchedule(tt, code);
  for (let i = 0; i < sched.length; i++) { if (sameYMD(sched[i].date, date)) return sched[i]; }
  return null;
}

/* A standard Mon-Sun month grid. Days outside the timetable's own term dates
   (when known) are dimmed rather than hidden, so the shape of the month
   stays recognisable. */
function renderMonthCalendar(tt, year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const termStart = tt.start ? parseDate(tt.start) : null;
  const termEnd = tt.end ? parseDate(tt.end) : null;
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: prevMonthDays - startOffset + i + 1, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(year, month, d) });
  let nextDay = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nextDay++, other: true });

  let h = '<div class="cal-wrap"><div class="cal-head">' +
    RSPH.DAYS.map(d => '<div class="cal-dow">' + d + '</div>').join('') +
    '</div><div class="cal-grid">';

  cells.forEach(c => {
    if (c.other || !c.date) { h += '<div class="cal-cell other-month"><span class="cal-daynum">' + c.day + '</span></div>'; return; }
    const dayKey = RSPH.DAYS[(c.date.getDay() + 6) % 7];
    const inTerm = (!termStart || c.date >= termStart) && (!termEnd || c.date <= termEnd);
    const isToday = sameYMD(c.date, today);
    // Outside the timetable's own term dates nothing is actually running, so
    // the day is shown empty rather than listing a timetable that isn't in force.
    const blocks = inTerm ? (tt.days[dayKey] || []).map((b, bi) => ({ b, bi }))
      .filter(x => x.b.k !== 'lunch').sort((x, y) => x.b.i - y.b.i) : [];
    h += '<div class="cal-cell' + (inTerm ? '' : ' out-term') + (isToday ? ' is-today' : '') + '">' +
      '<span class="cal-daynum">' + c.day + (isToday ? '<span class="cal-today-dot"></span>' : '') + '</span>' +
      '<div class="cal-sessions">' + blocks.map(x => {
        const b = x.b, k = RSPH.kinds[b.k] || RSPH.kinds.lecture, slot = tt.slots[b.i];
        const mod = moduleOnDate(tt, b, c.date);
        return '<div class="cal-chip tt-click' + (mod ? ' has-module' : '') + '" style="--k:' + k.color + ';--kbg:' + k.bg + '"' +
          ' data-day="' + dayKey + '" data-bi="' + x.bi + '" data-date="' + ymd(c.date) + '" tabindex="0" role="button">' +
          (slot ? '<span class="cal-chip-time">' + fmtHM(toMin(slot.s)) + '</span> ' : '') + b.t +
          (mod ? '<span class="cal-chip-module">&#128214; ' + mod.module.title + '</span>' : '') +
        '</div>';
      }).join('') + '</div>' +
      (inTerm ? '' : '<span class="cal-out-tag">Not in term</span>') +
    '</div>';
  });

  h += '</div></div>';
  return h;
}

/* The full module detail for one day's session — objectives, topics and the
   lecture delivery guide — reusing the exact same CSS classes as the module
   sheets on the MPH course-notes site, so it reads as the same document. */
function guideRow(icon, label, bodyHTML) {
  return '<div class="guide-row"><span class="guide-icon">' + icon + '</span>' +
    '<div class="guide-body"><span class="guide-label">' + label + '</span>' + bodyHTML + '</div></div>';
}
const TOPIC_TAG_LABEL = { must: 'Must know', desirable: 'Desirable', nice: 'Nice to know' };

function renderModuleDetail(tt, code, dateStr) {
  const date = parseDate(dateStr);
  const c = course(tt.prog, code);
  const entry = date ? moduleForDate(tt, code, date) : null;
  if (!entry) return '<p style="font-size:13.5px;color:var(--ink-soft)">No module plan on record for this date.</p>';
  const m = entry.module, g = m.guide || {};

  let h = '<div class="module-sheet"><div class="module-sheet-head">' +
    '<span class="modnum">' + (entry.moduleIndex + 1) + '</span><h3>' + m.title + '</h3></div>' +
    '<div style="padding:13px 20px;background:var(--surface-alt);border-bottom:1px solid var(--border);' +
    'font-size:12.5px;color:var(--ink-soft)">' +
      fmtDate(date) + ' &middot; ' + (c ? c.title : code) + ' <span style="color:var(--wine);font-weight:700">' + code + '</span>' +
      ' &middot; ~' + m.hours + ' classroom hours for this module' +
    '</div>';

  if (m.objectives && m.objectives.length) {
    h += '<div class="mod-objectives" style="padding:16px 20px 14px"><span class="mod-objectives-lbl">' +
      '&#127919; Module objectives &mdash; by the end of this module, the student will be able to:</span><ol>' +
      m.objectives.map(o => '<li><span class="obj-text">' + o.text + '</span>' +
        (o.bloom ? '<span class="bloom-chip">' + o.bloom + '</span>' : '') +
        (o.co ? '<span class="co-chip">' + o.co + '</span>' : '') + '</li>').join('') +
    '</ol></div>';
  }
  if (m.topics && m.topics.length) {
    h += '<ul style="padding:14px 24px 16px;list-style:none;display:flex;flex-direction:column;gap:8px;' +
      'background:var(--surface);border-top:1px dashed var(--border)">' +
      m.topics.map(t => '<li style="font-size:13.5px;color:var(--ink);position:relative;padding-left:16px">' +
        '<span style="position:absolute;left:0;color:var(--wine)">&bull;</span>' + t.text +
        '<span class="topic-tag ' + t.priority + '">' + (TOPIC_TAG_LABEL[t.priority] || t.priority) + '</span></li>').join('') +
    '</ul>';
  }
  if (g.notesFocus || g.videoIdea || g.readingIdea || g.exercise || (g.pptOutline && g.pptOutline.length)) {
    h += '<div class="lecture-guide" style="padding:16px 22px 20px">';
    if (g.notesFocus) h += guideRow('&#128221;', 'Lecture Notes Focus', '<p>' + g.notesFocus + '</p>');
    if (g.pptOutline && g.pptOutline.length) h += guideRow('&#128421;&#65039;', 'Suggested PPT Outline', '<ol>' + g.pptOutline.map(x => '<li>' + x + '</li>').join('') + '</ol>');
    if (g.videoIdea) h += guideRow('&#127909;', 'Video Idea', '<p>' + g.videoIdea + '</p>');
    if (g.readingIdea) h += guideRow('&#128196;', 'Article / Reading Idea', '<p>' + g.readingIdea + '</p>');
    if (g.exercise) h += guideRow('&#129514;', 'Hands-on Exercise', '<p>' + g.exercise + '</p>');
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ===========================================================================
   Session detail — what opens when any session is clicked, in any view.
   One card answers: what is this, what is the course for (aim + outcomes),
   what is being taught in this particular session (the module that falls on
   this date, with its objectives, topics and teaching guide), and where this
   session sits in the whole course's teaching plan.
   =========================================================================== */
function fmtShort(d) {
  return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0, 3);
}

/* Module-by-module plan for one course on one timetable: the dates each module
   runs across, derived from the same schedule the views use. */
function teachingPlanTable(tt, code, currentIdx) {
  const mods = courseModules(tt.prog, code);
  if (!mods.length) return '';
  const sched = moduleSchedule(tt, code);
  const undated = !tt.start;
  const rows = mods.map((m, i) => {
    const sess = sched.filter(x => x.moduleIndex === i);
    const when = sess.length
      ? fmtShort(sess[0].date) + (sess.length > 1 ? ' &ndash; ' + fmtShort(sess[sess.length - 1].date) : '')
      : '<span style="color:var(--ink-soft)">after the dated term</span>';
    return '<tr' + (i === currentIdx ? ' class="plan-current"' : '') + '>' +
      '<td class="num">' + (i + 1) + '</td><td>' + m.title + (i === currentIdx ? ' <span class="pill warn">this session</span>' : '') + '</td>' +
      '<td class="num">' + m.hours + ' h</td><td class="num">' + sess.length + '</td><td>' + when + '</td></tr>';
  }).join('');
  return '<h3 class="sd-h">Teaching plan for the course</h3>' +
    '<p class="sd-sub">Modules in the order of the approved Course Specification, each given its approved classroom hours ' +
    'and laid over this subject&rsquo;s real weekly slots' + (undated ? ' &mdash; dates assume teaching from 1 September, since ' +
    'no start date is on record for this timetable' : '') + '.</p>' +
    '<table class="data-table"><thead><tr><th class="num">#</th><th>Module</th><th class="num">Hours</th>' +
    '<th class="num">Sessions</th><th>Dates</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function sessionDetail(tt, day, bi, dateStr) {
  const b = (tt.days[day] || [])[bi];
  if (!b) return '<p>Session not found.</p>';
  const k = RSPH.kinds[b.k] || RSPH.kinds.lecture;
  const c = course(tt.prog, b.c);
  const p = RSPH.programmes[tt.prog];
  const date = dateStr ? parseDate(dateStr) : null;
  const first = tt.slots[b.i], last = tt.slots[Math.min(b.i + b.n - 1, tt.slots.length - 1)];
  const when = (date ? RSPH.DAY_FULL[day] + ' ' + fmtDate(date) : 'Every ' + RSPH.DAY_FULL[day]) +
    ' &middot; ' + fmtHM(toMin(first.s)) + ' &ndash; ' + fmtHM(toMin(last.e));
  const venue = b.v || tt.venue;

  let h = '<div class="sd-head" style="--k:' + k.color + ';--kbg:' + k.bg + '">' +
    '<span class="sd-kind">' + k.label + '</span>' +
    (b.c ? ' <span class="sd-code">' + b.c + '</span>' : '') +
    '<h2>' + (c ? c.title : b.t) + '</h2>' +
    (c && plain(c.title) !== plain(b.t) ? '<div class="sd-as">On the timetable as: ' + b.t + '</div>' : '') +
    '<div class="sd-when">' + when + ' &middot; ' + venue + '</div>' +
    '<div class="sd-pills">' +
      '<span class="pill ' + tt.prog + '">' + p.short + ' &middot; Semester ' + tt.sem + '</span>' +
      (c ? '<span class="pill mute">' + c.credits + ' credits &middot; ' + c.type + '</span>' : '') +
      (b.f ? '<span class="pill mute">Taking this session: ' + b.f + '</span>' : '') +
      (c && c.faculty ? '<span class="pill mute">In charge of subject: ' + c.faculty + '</span>' : '') +
    '</div></div>';

  if (!c) {
    h += '<p class="sd-sub" style="margin-top:14px">A ' + k.label.toLowerCase() + ' slot on the ' + p.short + ' Semester ' + tt.sem +
      ' timetable rather than a taught course, so it has no course outcomes or module plan of its own.</p>';
    return h;
  }

  if (c.aim) h += '<h3 class="sd-h">What this course is for</h3><p class="sd-aim">' + c.aim + '</p>';
  if (c.outcomes && c.outcomes.length) {
    h += '<h3 class="sd-h">Course outcomes</h3><ol class="sd-outcomes">' +
      c.outcomes.map((o, i) => '<li><span class="co-chip">CO-' + (i + 1) + '</span> ' + o + '</li>').join('') + '</ol>';
  }

  const mod = moduleOnDate(tt, b, date);
  let currentIdx = -1;
  if (mod) {
    currentIdx = mod.moduleIndex;
    const sched = moduleSchedule(tt, b.c);
    const same = sched.filter(x => x.moduleIndex === mod.moduleIndex);
    const pos = same.findIndex(x => sameYMD(x.date, date)) + 1;
    const total = courseModules(tt.prog, b.c).length;
    h += '<h3 class="sd-h">In this session</h3>' +
      '<p class="sd-sub">Module ' + (mod.moduleIndex + 1) + ' of ' + total + ' &middot; session ' + pos + ' of ' + same.length +
      ' for this module' + (pos === 1 ? ' &mdash; <strong>module starts today</strong>' : '') +
      (pos === same.length ? ' &mdash; <strong>module finishes today</strong>' : '') + '</p>' +
      renderModuleDetail(tt, b.c, dateStr);
  } else if (b.k === 'field') {
    h += '<p class="note" style="margin-top:14px"><span class="note-lbl">Field posting</span>Practical time attached to this ' +
      'course; it doesn&rsquo;t use up the classroom hours of its modules.</p>';
  } else if (date && !dateInTerm(tt, date)) {
    h += '<p class="note warn" style="margin-top:14px"><span class="note-lbl">Not in term</span>This date falls outside the ' +
      'timetable&rsquo;s own term dates.</p>';
  } else if (!courseModules(tt.prog, b.c).length) {
    h += '<p class="note" style="margin-top:14px"><span class="note-lbl">No module plan yet</span>This subject has no ' +
      'day-wise module plan on record, so the session can&rsquo;t be tied to a module. It can be added under Admin &rarr; Module Plans.</p>';
  } else if (date) {
    h += '<p class="note" style="margin-top:14px"><span class="note-lbl">Syllabus already covered</span>Every module&rsquo;s ' +
      'approved hours have been used by this date &mdash; this session is free for revision, assessment or catch-up.</p>';
  }

  h += teachingPlanTable(tt, b.c, currentIdx);
  if (c.notes && tt.prog === 'mph') {
    h += '<p style="margin-top:14px"><a class="btn" href="' + RSPH.meta.notesBase + c.notes + '" target="_blank" rel="noopener">' +
      'Open the full course notes &rarr;</a></p>';
  }
  return h;
}

/* A single reusable modal. */
function openModal(innerHTML) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'tt-modal-backdrop';
  wrap.innerHTML = '<div class="tt-modal" role="dialog" aria-modal="true">' +
    '<button class="tt-modal-close" type="button" aria-label="Close">&times;</button>' + innerHTML + '</div>';
  document.body.appendChild(wrap);
  document.body.classList.add('modal-open');
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.tt-modal-close')) closeModal(); });
  wrap.querySelector('.tt-modal-close').focus();
}
function closeModal() {
  const m = document.querySelector('.tt-modal-backdrop');
  if (m) m.remove();
  document.body.classList.remove('modal-open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* Delegated click (and Enter key) handling for every session in a container
   rendered by renderGrid / renderAgenda / renderMonthCalendar. */
function wireSessionClicks(root, tt) {
  if (!root) return;
  root.__tt = tt; // always the timetable currently on screen, even after switching
  if (root.__ttWired) return;
  root.__ttWired = true;
  const open = el => openModal(sessionDetail(root.__tt, el.getAttribute('data-day'), +el.getAttribute('data-bi'), el.getAttribute('data-date')));
  root.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const el = e.target.closest('.tt-click[data-bi]');
    if (el && root.contains(el)) open(el);
  });
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const el = e.target.closest('.tt-click[data-bi]');
    if (el) { e.preventDefault(); open(el); }
  });
}

/* ---------- shared chrome ------------------------------------------------ */
function header(active) {
  // Student-facing site: only the two pages students need. Faculty load and
  // the data-quality/clash checks moved into the admin panel — not nav items
  // here at all, so students never see them.
  const nav = [
    ['timetable.html', 'Timetables'],
    ['courses.html', 'Courses']
  ];
  return '<header class="site-header"><div class="bar">' +
    '<a href="timetable.html" class="brand"><img src="assets/rsph_logo.svg" alt="Ramaiah School of Public Health"/>' +
    '<span class="brand-text">Smart Timetable<br/>MPH &amp; MHA</span></a>' +
    '<nav class="mainnav">' + nav.map(n =>
      '<a class="mainnav-link' + (n[0] === active ? ' active' : '') + '" href="' + n[0] + '">' + n[1] + '</a>'
    ).join('') + '</nav></div><div class="header-rule"></div></header>';
}

function footer() {
  return '<footer class="site-footer"><div class="header-rule"></div><div class="footer-bar">' +
    '<div class="footer-brand"><img src="assets/rsph_logo.svg" alt="RSPH"/><span>' +
    RSPH.meta.school + ' &middot; ' + RSPH.meta.university + '</span></div>' +
    '<span class="footer-meta">Generated from the issued timetables &amp; approved specifications &middot; ' +
    'Smart Timetable v' + RSPH.meta.version + ' &middot; <a href="admin.html" style="text-decoration:underline">Admin</a></span>' +
    '</div></footer>';
}

function mountChrome(active) {
  const h = document.getElementById('site-header');
  if (h) h.outerHTML = header(active);
  const f = document.getElementById('site-footer');
  if (f) f.outerHTML = footer();
  reveal();
}

function reveal() {
  const els = $$('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in-view')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(e => io.observe(e));
}

function countUp() {
  const els = $$('.stat-num[data-count]');
  if (!els.length) return;
  const finalText = el => {
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    return el.hasAttribute('data-no-format') ? String(target) : Number(target).toLocaleString('en-IN');
  };
  const run = el => {
    // requestAnimationFrame is throttled to near-zero on a hidden/backgrounded
    // tab (a link opened in a background tab, a prerender, etc.) — animating
    // against it can leave the number visibly stuck at 0 indefinitely. Skip
    // straight to the final value in that case instead of hoping rAF ticks.
    if (document.hidden) { el.textContent = finalText(el); return; }
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const noFmt = el.hasAttribute('data-no-format');
    const t0 = performance.now(), dur = 1000;
    (function tick(now) {
      if (document.hidden) { el.textContent = finalText(el); return; }
      const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      const v = target % 1 ? (target * eased).toFixed(1) : Math.round(target * eased);
      el.textContent = noFmt ? String(v) : Number(v).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = finalText(el);
    })(performance.now());
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach(e => io.observe(e));
  } else {
    els.forEach(run);
  }

  // Belt-and-suspenders, unconditional: if a hidden document never fires the
  // observer at all (seen in some embedded/automated contexts), or the tab
  // never becomes visible for the visibilitychange fallback to catch, force
  // every counter to its correct final value once, a couple of seconds in.
  // Harmless no-op if the animation already got there on its own.
  setTimeout(() => { els.forEach(el => { el.textContent = finalText(el); }); }, 2000);
}

/* ---------- export ------------------------------------------------------- */
global.TT = {
  $, $$, toMin, fmtHM, hrs, plain, parseDate, fmtDate,
  course, sessions, allSessions, getTT, inTerm, weekOfTerm, termWeeks,
  liveStatus, courseLoad, kindLoad, weeklyContact, facultyLoad, clashes, coverage,
  buildICS, downloadICS,
  renderGrid, renderAgenda, renderLegend,
  monthList, renderMonthCalendar, MONTH_NAMES,
  courseModules, moduleSchedule, moduleForDate, renderModuleDetail,
  sessionDetail, openModal, closeModal, wireSessionClicks, mondayOfWeek, ymd, dateInTerm,
  mountChrome, reveal, countUp
};

})(window);
