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
function cellHTML(tt, b, opts) {
  const k = RSPH.kinds[b.k] || RSPH.kinds.lecture;
  const c = course(tt.prog, b.c);
  const notesHref = (c && c.notes && tt.prog === 'mph')
    ? RSPH.meta.notesBase + c.notes : null;
  const dim = opts && opts.filter && !matches(b, opts.filter) ? ' is-dim' : '';
  return '<div class="tt-cell k-' + b.k + dim + '" style="--k:' + k.color + ';--kbg:' + k.bg + '"' +
    (b.c ? ' data-code="' + b.c + '"' : '') + ' data-kind="' + b.k + '">' +
      (b.c ? '<span class="tt-code">' + b.c + '</span>' : '') +
      '<span class="tt-title">' + b.t + '</span>' +
      (b.f ? '<span class="tt-fac">' + b.f + '</span>' : '') +
      (notesHref ? '<a class="tt-notes" href="' + notesHref + '">Course notes &rarr;</a>' : '') +
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

/* The weekly grid. Days are rows, slots are columns. */
function renderGrid(tt, opts) {
  opts = opts || {};
  const days = RSPH.DAYS.filter(d => tt.days[d] && tt.days[d].length);
  const nowD = new Date();
  const todayKey = RSPH.DAYS[(nowD.getDay() + 6) % 7];
  const liveOK = inTerm(tt, nowD) === true;
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();

  let h = '<div class="tt-scroll"><table class="tt-grid"><thead><tr><th class="tt-daycol">Day</th>';
  tt.slots.forEach(s => {
    h += '<th' + (s.lunch ? ' class="tt-lunch-h"' : '') + '><span class="tt-slot">' + s.label + '</span></th>';
  });
  h += '</tr></thead><tbody>';

  days.forEach(day => {
    const isToday = liveOK && day === todayKey;
    h += '<tr' + (isToday ? ' class="is-today"' : '') + '><th class="tt-daycol">' +
         '<span class="tt-day">' + RSPH.DAY_FULL[day] + '</span>' +
         (isToday ? '<span class="tt-today-tag">Today</span>' : '') + '</th>';

    const blocks = (tt.days[day] || []).slice().sort((a, b) => a.i - b.i);
    let col = 0;
    blocks.forEach(b => {
      while (col < b.i) {
        const sl = tt.slots[col];
        h += sl.lunch ? lunchCell(1) : '<td class="tt-empty"></td>';
        col++;
      }
      const spansLunch = tt.slots.slice(b.i, b.i + b.n).some(s => s.lunch);
      const live = isToday && nowMin >= toMin(tt.slots[b.i].s) &&
                   nowMin < toMin(tt.slots[Math.min(b.i + b.n - 1, tt.slots.length - 1)].e);
      h += '<td colspan="' + b.n + '" class="tt-td' + (live ? ' is-live' : '') +
           (spansLunch ? ' spans-lunch' : '') + '">' + cellHTML(tt, b, opts) + '</td>';
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

/* Day-by-day list — the mobile/agenda reading of the same data. */
function renderAgenda(tt, opts) {
  opts = opts || {};
  const days = RSPH.DAYS.filter(d => tt.days[d] && tt.days[d].length);
  const nowD = new Date();
  const todayKey = RSPH.DAYS[(nowD.getDay() + 6) % 7];
  const liveOK = inTerm(tt, nowD) === true;

  return '<div class="agenda">' + days.map(day => {
    const rows = sessions(tt).filter(s => s.day === day)
      .sort((a, b) => a.start - b.start)
      .filter(s => matches(s.block, opts.filter));
    if (!rows.length) return '';
    return '<section class="agenda-day' + (liveOK && day === todayKey ? ' is-today' : '') + '">' +
      '<h3>' + RSPH.DAY_FULL[day] +
      (liveOK && day === todayKey ? ' <span class="tt-today-tag">Today</span>' : '') + '</h3>' +
      rows.map(s => {
        const k = RSPH.kinds[s.kind];
        return '<div class="agenda-row" style="--k:' + k.color + ';--kbg:' + k.bg + '">' +
          '<span class="agenda-time">' + s.startLabel + '<em>' + s.endLabel + '</em></span>' +
          '<span class="agenda-body">' +
            (s.code ? '<span class="tt-code">' + s.code + '</span>' : '') +
            '<strong>' + s.title + '</strong>' +
            (s.faculty ? '<span class="tt-fac">' + s.faculty + '</span>' : '') +
            '<span class="agenda-meta">' + k.label + ' &middot; ' + s.venue + '</span>' +
          '</span></div>';
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

/* ---------- shared chrome ------------------------------------------------ */
function header(active) {
  const nav = [
    ['index.html', 'Home'],
    ['timetable.html', 'Timetables'],
    ['courses.html', 'Courses'],
    ['faculty.html', 'Faculty Load'],
    ['insights.html', 'Insights &amp; Checks']
  ];
  return '<header class="site-header"><div class="bar">' +
    '<a href="index.html" class="brand"><img src="assets/rsph_logo.svg" alt="Ramaiah School of Public Health"/>' +
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
  mountChrome, reveal, countUp
};

})(window);
