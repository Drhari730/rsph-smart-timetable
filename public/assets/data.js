/* ===========================================================================
   RSPH Smart Timetable — client-side data bootstrap
   ---------------------------------------------------------------------------
   The dataset used to live here as a static object. It now lives in Postgres
   behind /api/bootstrap, edited through the admin panel. This file fetches
   it once per page load and builds the exact same `RSPH` object shape the
   rest of the site (assets/app.js and every page's inline script) already
   expects — so nothing downstream needed to change.

   Every page's script must wait on `RSPH_READY` before touching `RSPH`:
     RSPH_READY.then(function () { ...existing per-page code... });
   =========================================================================== */

const RSPH = {};

RSPH.DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
RSPH.DAY_FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
                  Fri:'Friday', Sat:'Saturday', Sun:'Sunday' };

const RSPH_READY = fetch('/api/bootstrap', { credentials: 'same-origin' })
  .then(function (r) {
    if (!r.ok) throw new Error('bootstrap ' + r.status);
    return r.json();
  })
  .then(function (data) {
    RSPH.meta = data.meta || {};
    RSPH.programmes = data.programmes || {};
    RSPH.kinds = data.kinds || {};
    RSPH.electives = data.electives || {};
    RSPH.pending = data.pending || [];
    // { 'mph:PHC501A': [ {seq,title,hours,objectives,topics,guide}, ... ] } — the
    // day-wise syllabus plan behind a subject, keyed by "prog:code". Empty for
    // any course that has no module plan entered yet (e.g. all of MHA so far).
    RSPH.modules = data.modules || {};

    // courses: DB rows already match the {prog,sem,code,title,credits,type,notes} shape
    RSPH.courses = (data.courses || []).map(function (c) {
      return { prog: c.prog, sem: c.sem, code: c.code, title: c.title,
               credits: Number(c.credits), type: c.type, notes: c.notes || undefined,
               faculty: c.faculty || undefined };
    });

    // timetables: DB rows carry slots/days as JSON already in the shape app.js expects
    RSPH.timetables = (data.timetables || []).map(function (t) {
      return {
        id: t.id, prog: t.prog, sem: t.sem, batch: t.batch, ay: t.ay,
        faculty: t.faculty, venue: t.venue, start: t.start || null, end: t.end || null,
        source: t.source, flags: t.flags || [], slots: t.slots || [], days: t.days || {}
      };
    });

    return RSPH;
  })
  .catch(function (e) {
    console.error('Failed to load timetable data from the server:', e);
    var el = document.getElementById('boot-error');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boot-error';
      el.style.cssText = 'max-width:1180px;margin:24px auto;padding:16px 20px;border:1px solid #C0383A;' +
        'background:#FBEAE7;color:#C0383A;border-radius:12px;font-family:Georgia,serif;font-size:14px;';
      el.textContent = 'Could not load the timetable data from the server. Please refresh, or try again shortly.';
      document.body.insertBefore(el, document.body.firstChild);
    }
    throw e;
  });
