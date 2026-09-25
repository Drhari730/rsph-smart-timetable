/* ===========================================================================
   RSPH Smart Timetable — admin panel
   =========================================================================== */
(function () {
'use strict';

var $ = TT.$, $$ = TT.$$;

/* ---------- tiny fetch helper ---------- */
function api(method, url, body) {
  return fetch(url, {
    method: method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (data) {
      if (!r.ok) throw new Error(data.error || (r.status + ' ' + r.statusText));
      return data;
    });
  });
}

function toast(msg, isErr) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + (isErr ? 'err' : 'ok');
  el.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.style.display = 'none'; }, 3200);
}

function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

/* ===========================================================================
   AUTH
   =========================================================================== */
function checkAuth() {
  return api('GET', '/api/auth/me').then(function (d) {
    showAdmin(d.username);
  }).catch(function () {
    showLogin();
  });
}

function showLogin() {
  document.getElementById('login-panel').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
}

function showAdmin(username) {
  document.getElementById('login-panel').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('whoami').textContent = 'Signed in as ' + username;
  switchSection('guide');
}

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var user = document.getElementById('login-user').value.trim();
  var pass = document.getElementById('login-pass').value;
  var err = document.getElementById('login-error');
  err.textContent = '';
  api('POST', '/api/auth/login', { username: user, password: pass })
    .then(function (d) { showAdmin(d.username); })
    .catch(function (e) { err.textContent = e.message; });
});

document.getElementById('btn-logout').addEventListener('click', function () {
  api('POST', '/api/auth/logout').then(function () { location.reload(); });
});

/* ---------- section switching ---------- */
document.getElementById('seg-section').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-section]'); if (!b) return;
  switchSection(b.getAttribute('data-section'));
});

function switchSection(name) {
  $$('#seg-section button').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-section') === name));
  });
  ['guide', 'courses', 'electives', 'timetables', 'modules', 'faculty', 'insights', 'account'].forEach(function (s) {
    document.getElementById('sec-' + s).style.display = (s === name) ? 'block' : 'none';
  });
  if (name === 'guide') renderGuide();
  if (name === 'courses') loadCourses();
  if (name === 'electives') loadElectives();
  if (name === 'timetables') loadTimetables();
  if (name === 'modules') renderModulesSection();
  if (name === 'faculty') renderFaculty();
  if (name === 'insights') renderInsights();
  if (name === 'account') renderAccount();
}

var TYPE_OPTS = ['core', 'elective', 'ogec', 'experiential'];

/* ===========================================================================
   GUIDE — plain-language walkthrough of every tab, written for whoever runs
   this panel day to day rather than for another developer.
   =========================================================================== */
function guideStep(icon, label, bodyHTML) {
  return '<div class="guide-row"><span class="guide-icon">' + icon + '</span>' +
    '<div class="guide-body"><span class="guide-label">' + label + '</span>' + bodyHTML + '</div></div>';
}

function renderGuide() {
  var html =
    '<div class="page-title-bar" style="border-bottom:none;padding-bottom:0">' +
    '<span class="eyebrow smallcaps">Start here</span>' +
    '<h1 style="font-size:22px;margin:6px 0">How this panel works</h1>' +
    '<p style="font-size:13.5px">One walkthrough per tab. Everything you change here appears on the public ' +
    'site (Timetables and Courses) immediately &mdash; there is nothing to publish or redeploy.</p></div>';

  html += '<div class="admin-card"><h2>Courses</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#10133;', 'Add a course',
      '<p>Fill in Programme, Semester, Code (e.g. <code>PHC501A</code>), Type, Credits and Title at the top of the tab, ' +
      'then click <strong>Add course</strong>. The optional &ldquo;Course-notes link&rdquo; field only matters for MPH courses ' +
      'that already have a page on the course-notes site (e.g. <code>phc501a.html</code>) &mdash; leave it blank otherwise.</p>') +
    guideStep('&#9998;', 'Edit a course',
      '<p>Click <strong>Edit</strong> on its row. The form at the top fills in with that course&rsquo;s details &mdash; change ' +
      'whatever you need and click <strong>Save changes</strong>, or <strong>Cancel</strong> to leave it as it was.</p>') +
    guideStep('&#128100;', '&ldquo;Faculty in charge of this subject&rdquo;',
      '<p>This is the field the <strong>Faculty Load</strong> tab uses to total up load hours automatically. Type in whoever ' +
      'owns that subject &mdash; once every course has someone assigned, Faculty Load shows each person&rsquo;s subjects with ' +
      'their credits, weekly hours and hours for the semester, computed from that subject&rsquo;s own timetable rather than typed ' +
      'in by hand. Useful for year-end appraisal write-ups.</p>') +
    guideStep('&#128465;', 'Delete a course',
      '<p>Click <strong>Delete</strong> on its row and confirm. This only removes it from the catalogue &mdash; if it&rsquo;s ' +
      'still referenced by a code on a timetable, that session will just show without a credits/notes link.</p>') +
  '</div></div>';

  html += '<div class="admin-card"><h2>Electives</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#128218;', 'The MDEC / O-GEC pool',
      '<p>This is the list shown on the public Courses page under &ldquo;Elective pool&rdquo; &mdash; the courses a ' +
      'programme&rsquo;s MDEC/O-GEC slots can be filled from. Add, edit and delete work exactly like the Courses tab: ' +
      'Programme, Code, Title, then <strong>Add elective</strong>.</p>') +
  '</div></div>';

  html += '<div class="admin-card"><h2>Timetables</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#10133;', 'Add a new timetable',
      '<p>Click <strong>+ New timetable</strong> at the top of the list. Give it a unique <strong>id</strong> ' +
      '(short and simple, e.g. <code>mph-2</code> or <code>mha-1</code>), pick the Programme and Semester, and fill in ' +
      'Batch, Academic year, Venue, Faculty/owning department and the start/end dates if they&rsquo;re known. Leave a date ' +
      'blank rather than guessing &mdash; the public site says &ldquo;not issued&rdquo; instead of showing a wrong one.</p>') +
    guideStep('&#128337;', 'Time slots = the columns of the grid',
      '<p>Each row under &ldquo;Time slots&rdquo; is one column of the weekly grid, in order (e.g. 9:00&ndash;10:00, ' +
      '10:00&ndash;11:00&hellip;). Tick <strong>Lunch?</strong> for the break column so it renders as the shaded &ldquo;Lunch&rdquo; ' +
      'strip instead of an empty session slot. Use <strong>+ Add time slot</strong> to add a row and the &times; button to remove one ' +
      '&mdash; the Label box is free text and only affects what visitors read at the top of that column.</p>') +
    guideStep('&#128197;', 'Weekly blocks = the actual sessions',
      '<p>Each day (Monday&hellip;Sunday) has its own <strong>+ Add block to &hellip;</strong> button. A block needs: which time slot ' +
      'it <strong>starts</strong> in, how many slots it <strong>spans</strong> (2 if a session runs across two consecutive columns), ' +
      'a <strong>Title</strong>, an optional <strong>Code</strong> if it&rsquo;s a course from the catalogue (this is what links the ' +
      'session to its credits and, for MPH, its course-notes page), a <strong>Kind</strong> (this sets the colour and whether it ' +
      'counts as teaching time in the load figures), and optionally who is teaching it and where.</p>') +
    guideStep('&#127979;', '&ldquo;Classrooms&rdquo; &mdash; there isn&rsquo;t a separate list',
      '<p>Rooms are just typed text, not a picklist. The timetable&rsquo;s own <strong>Venue</strong> field (in the meta fields at ' +
      'the top) is the default room for every session in it. If one particular session meets somewhere else &mdash; hospital ' +
      'training in a ward, a session in the library &mdash; leave that block&rsquo;s own <strong>Venue override</strong> field filled in ' +
      'with that room instead. <strong>Type the room name exactly the same way every time</strong> (e.g. always &ldquo;Classroom 1&rdquo;, ' +
      'never sometimes &ldquo;Classroom 1&rdquo; and sometimes &ldquo;Class Room-1&rdquo;) &mdash; the clash checker under Insights &amp; Checks ' +
      'only catches two sessions double-booking a room when the text matches exactly.</p>') +
    guideStep('&#128064;', 'Check the live preview before saving',
      '<p>The grid at the bottom of the editor updates as you type. If a session doesn&rsquo;t appear where you expect, the ' +
      'most common cause is the wrong starting slot or span &mdash; fix it there and the preview updates immediately.</p>') +
    guideStep('&#128190;', 'Save, or delete the whole timetable',
      '<p>Click <strong>Create timetable</strong> / <strong>Save changes</strong> when you&rsquo;re done. To remove an entire ' +
      'timetable, use <strong>Delete</strong> on its row in the list (or the button inside the editor) &mdash; this deletes every ' +
      'session in it, so there&rsquo;s no undo.</p>') +
  '</div></div>';

  html += '<div class="admin-card"><h2>Module Plans</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#128214;', 'The day-wise plan behind a subject',
      '<p>This is what turns a recurring &ldquo;Biostatistics, Thursday&rdquo; slot into &ldquo;Biostatistics, Thursday 6 Nov &mdash; ' +
      'Introduction to Biostatistics&rdquo; on the Calendar view. Pick a subject, click <strong>Load current plan</strong> to see what&rsquo;s ' +
      'there (empty for anything without one yet), and edit the JSON directly &mdash; each module needs a <code>title</code> and its ' +
      '<code>hours</code> (the approved classroom hours for that module; this is what decides how many real sessions it takes up), ' +
      'plus optional objectives, topics and a teaching guide. <strong>Insert a blank module as a template</strong> appends a starter ' +
      'you can fill in rather than typing the structure from scratch.</p>') +
    guideStep('&#128260;', 'Nothing here is tied to a date',
      '<p>Save replaces the whole ordered list for that subject. The Timetables page works out which module lands on which real date ' +
      'itself &mdash; module 1&rsquo;s hours are consumed by that subject&rsquo;s first real sessions, then module 2 takes over, and so on, ' +
      'against whichever timetable that subject is actually on. Edit an hours figure or the timetable itself and the whole plan reflows ' +
      'automatically; nothing needs re-entering by date.</p>') +
    guideStep('&#127891;', 'Currently MPH only',
      '<p>All 9 MPH Semester 1 &amp; 3 subjects already have a plan, carried over from the course-notes site. MHA has none yet &mdash; ' +
      'add it here the same way once that content exists.</p>') +
  '</div></div>';

  html += '<div class="admin-card"><h2>Faculty Load &amp; Insights &amp; Checks</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#128202;', 'Nothing to edit here',
      '<p>Both tabs are read-only and recompute themselves from whatever is in Courses, Electives and Timetables &mdash; there is ' +
      'nothing to type on either one. <strong>Faculty Load</strong> opens on <em>Load by Subject</em>: every subject with a ' +
      '&ldquo;Faculty in charge&rdquo; set on the Courses tab, rolled up per person into total credits, weekly hours and hours for ' +
      'the semester (the numbers to lift straight into an appraisal form). Underneath that is the school&rsquo;s own record of ' +
      'who the issued timetable itself names, session by session. <strong>Insights &amp; Checks</strong> flags venue/teacher clashes, ' +
      'compares timetabled hours against each course&rsquo;s approved credits, and lists any semester in the scheme that still has ' +
      'no timetable. If something looks wrong here, the fix is always back in the Courses or Timetables tab.</p>') +
  '</div></div>';

  html += '<div class="admin-card"><h2>Account</h2><div class="lecture-guide" style="padding:0">' +
    guideStep('&#128273;', 'Change your password',
      '<p>Enter your current password and a new one (8 characters minimum) and click <strong>Update password</strong>. ' +
      'The sign-in email itself is set on the server, not from this panel &mdash; ask whoever manages the deployment to change it.</p>') +
  '</div></div>';

  document.getElementById('sec-guide').innerHTML = html;
}

/* ===========================================================================
   COURSES
   =========================================================================== */
var editingCourseId = null;

function loadCourses() {
  api('GET', '/api/admin/courses').then(renderCourses).catch(function (e) { toast(e.message, true); });
}

function courseForm(c) {
  c = c || {};
  return '<div class="admin-form">' +
    '<h3>' + (c.id ? 'Edit course' : 'Add a course') + '</h3>' +
    '<input type="hidden" id="cf-id" value="' + (c.id || '') + '"/>' +
    '<div class="field-row">' +
      field('Programme', '<select id="cf-prog">' + progOpts(c.prog) + '</select>') +
      field('Semester', '<select id="cf-sem">' + [1,2,3,4].map(function(s){return '<option value="'+s+'"'+(c.sem===s?' selected':'')+'>Semester '+s+'</option>';}).join('') + '</select>') +
      field('Code', '<input id="cf-code" value="' + escAttr(c.code) + '" placeholder="e.g. PHC501A"/>') +
      field('Type', '<select id="cf-type">' + TYPE_OPTS.map(function(t){return '<option value="'+t+'"'+(c.type===t?' selected':'')+'>'+t+'</option>';}).join('') + '</select>') +
      field('Credits', '<input id="cf-credits" type="number" step="0.5" min="0" value="' + (c.credits != null ? c.credits : '') + '"/>') +
      field('Course-notes link (optional)', '<input id="cf-notes" value="' + escAttr(c.notes) + '" placeholder="e.g. phc501a.html"/>') +
    '</div>' +
    field('Title', '<input id="cf-title" value="' + escAttr(TT.plain(c.title || '')) + '" placeholder="Full course title"/>') +
    field('Faculty in charge of this subject (used to auto-total load hours below)',
      '<input id="cf-faculty" value="' + escAttr(c.faculty) + '" placeholder="e.g. Dr. Mrinalini &mdash; leave blank if not yet assigned"/>') +
    '<p class="form-error" id="cf-error"></p>' +
    '<div class="actions">' +
      '<button class="btn primary" id="cf-save" type="button">' + (c.id ? 'Save changes' : 'Add course') + '</button>' +
      (c.id ? '<button class="btn" id="cf-cancel" type="button">Cancel</button>' : '') +
    '</div></div>';
}

function field(label, inputHTML) {
  return '<label>' + label + inputHTML + '</label>';
}
function progOpts(sel) {
  return Object.keys(RSPH.programmes).map(function (k) {
    return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + RSPH.programmes[k].short + '</option>';
  }).join('');
}

function renderCourses(rows) {
  var html = courseForm(editingCourseId ? rows.filter(function(r){return r.id===editingCourseId;})[0] : null);

  [1,2,3,4].forEach(function (sem) {
    Object.keys(RSPH.programmes).forEach(function (prog) {
      var list = rows.filter(function (c) { return c.prog === prog && c.sem === sem; });
      if (!list.length) return;
      html += '<h3 style="margin-top:22px">' + RSPH.programmes[prog].short + ' &middot; Semester ' + sem + '</h3>';
      html += '<table class="data-table"><thead><tr><th>Code</th><th>Title</th><th>Type</th>' +
        '<th class="num">Credits</th><th>Faculty</th><th>Notes link</th><th></th></tr></thead><tbody>' +
        list.map(function (c) {
          return '<tr><td class="code">' + c.code + '</td><td>' + c.title + '</td>' +
            '<td>' + c.type + '</td><td class="num">' + c.credits + '</td>' +
            '<td style="font-size:12.5px">' + (c.faculty || '<span style="color:var(--warn)">Unassigned</span>') + '</td>' +
            '<td style="font-size:12px;color:var(--ink-soft)">' + (c.notes || '&mdash;') + '</td>' +
            '<td class="row-actions">' +
              '<button class="edit" data-edit="' + c.id + '">Edit</button>' +
              '<button class="del" data-del="' + c.id + '">Delete</button>' +
            '</td></tr>';
        }).join('') + '</tbody></table>';
    });
  });

  var el = document.getElementById('sec-courses');
  el.innerHTML = html;
  wireCourseForm(rows);

  $$('#sec-courses [data-edit]').forEach(function (b) {
    b.addEventListener('click', function () {
      editingCourseId = +b.getAttribute('data-edit');
      renderCourses(rows);
      document.getElementById('sec-courses').scrollIntoView({ behavior: 'smooth' });
    });
  });
  $$('#sec-courses [data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del');
      if (!confirm('Delete this course? This cannot be undone.')) return;
      api('DELETE', '/api/admin/courses/' + id).then(function () { toast('Course deleted.'); loadCourses(); })
        .catch(function (e) { toast(e.message, true); });
    });
  });
}

function wireCourseForm(rows) {
  var cancel = document.getElementById('cf-cancel');
  if (cancel) cancel.addEventListener('click', function () { editingCourseId = null; renderCourses(rows); });

  document.getElementById('cf-save').addEventListener('click', function () {
    var id = document.getElementById('cf-id').value;
    var body = {
      prog: document.getElementById('cf-prog').value,
      sem: +document.getElementById('cf-sem').value,
      code: document.getElementById('cf-code').value.trim(),
      type: document.getElementById('cf-type').value,
      credits: parseFloat(document.getElementById('cf-credits').value) || 0,
      notes: document.getElementById('cf-notes').value.trim() || null,
      title: document.getElementById('cf-title').value.trim(),
      faculty: document.getElementById('cf-faculty').value.trim() || null
    };
    var err = document.getElementById('cf-error');
    if (!body.code || !body.title) { err.textContent = 'Code and title are required.'; return; }
    err.textContent = '';
    var call = id ? api('PUT', '/api/admin/courses/' + id, body) : api('POST', '/api/admin/courses', body);
    call.then(function () {
      toast(id ? 'Course updated.' : 'Course added.');
      editingCourseId = null;
      loadCourses();
    }).catch(function (e) { err.textContent = e.message; });
  });
}

/* ===========================================================================
   ELECTIVES
   =========================================================================== */
var editingElectiveId = null;

function loadElectives() {
  api('GET', '/api/admin/electives').then(renderElectives).catch(function (e) { toast(e.message, true); });
}

function renderElectives(rows) {
  var editing = editingElectiveId ? rows.filter(function (r) { return r.id === editingElectiveId; })[0] : null;
  var html = '<div class="admin-form"><h3>' + (editing ? 'Edit elective' : 'Add an elective') + '</h3>' +
    '<input type="hidden" id="ef-id" value="' + (editing ? editing.id : '') + '"/>' +
    '<div class="field-row">' +
      field('Programme', '<select id="ef-prog">' + progOpts(editing && editing.prog) + '</select>') +
      field('Code', '<input id="ef-code" value="' + escAttr(editing && editing.code) + '" placeholder="e.g. PHE501A"/>') +
    '</div>' +
    field('Title', '<input id="ef-title" value="' + escAttr(TT.plain(editing ? editing.title : '')) + '"/>') +
    '<p class="form-error" id="ef-error"></p>' +
    '<div class="actions">' +
      '<button class="btn primary" id="ef-save" type="button">' + (editing ? 'Save changes' : 'Add elective') + '</button>' +
      (editing ? '<button class="btn" id="ef-cancel" type="button">Cancel</button>' : '') +
    '</div></div>';

  Object.keys(RSPH.programmes).forEach(function (prog) {
    var list = rows.filter(function (e) { return e.prog === prog; });
    if (!list.length) return;
    html += '<h3>' + RSPH.programmes[prog].short + ' elective pool</h3>' +
      '<table class="data-table"><thead><tr><th>Code</th><th>Title</th><th></th></tr></thead><tbody>' +
      list.map(function (e) {
        return '<tr><td class="code">' + e.code + '</td><td>' + e.title + '</td>' +
          '<td class="row-actions"><button class="edit" data-edit="' + e.id + '">Edit</button>' +
          '<button class="del" data-del="' + e.id + '">Delete</button></td></tr>';
      }).join('') + '</tbody></table>';
  });

  document.getElementById('sec-electives').innerHTML = html;

  var cancel = document.getElementById('ef-cancel');
  if (cancel) cancel.addEventListener('click', function () { editingElectiveId = null; renderElectives(rows); });

  document.getElementById('ef-save').addEventListener('click', function () {
    var id = document.getElementById('ef-id').value;
    var body = {
      prog: document.getElementById('ef-prog').value,
      code: document.getElementById('ef-code').value.trim(),
      title: document.getElementById('ef-title').value.trim()
    };
    var err = document.getElementById('ef-error');
    if (!body.code || !body.title) { err.textContent = 'Code and title are required.'; return; }
    var call = id ? api('PUT', '/api/admin/electives/' + id, body) : api('POST', '/api/admin/electives', body);
    call.then(function () { toast(id ? 'Elective updated.' : 'Elective added.'); editingElectiveId = null; loadElectives(); })
      .catch(function (e) { err.textContent = e.message; });
  });

  $$('#sec-electives [data-edit]').forEach(function (b) {
    b.addEventListener('click', function () { editingElectiveId = +b.getAttribute('data-edit'); renderElectives(rows); });
  });
  $$('#sec-electives [data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!confirm('Delete this elective?')) return;
      api('DELETE', '/api/admin/electives/' + b.getAttribute('data-del')).then(function () { toast('Deleted.'); loadElectives(); })
        .catch(function (e) { toast(e.message, true); });
    });
  });
}

/* ===========================================================================
   TIMETABLES — list + full editor
   =========================================================================== */
function loadTimetables() {
  api('GET', '/api/admin/timetables').then(renderTimetableList).catch(function (e) { toast(e.message, true); });
}

function renderTimetableList(rows) {
  var html = '<div class="ctrl-actions" style="margin-bottom:16px">' +
    '<button class="btn primary" id="tt-new">+ New timetable</button></div>' +
    '<table class="data-table"><thead><tr><th>Programme</th><th>Semester</th><th>Batch</th>' +
    '<th>Term</th><th>Venue</th><th></th></tr></thead><tbody>' +
    rows.map(function (t) {
      var p = RSPH.programmes[t.prog];
      return '<tr><td><span class="pill ' + t.prog + '">' + (p ? p.short : t.prog) + '</span></td>' +
        '<td>Semester ' + t.sem + '</td><td>' + (t.batch || '&mdash;') + '</td>' +
        '<td style="font-size:12.5px;color:var(--ink-soft)">' + (t.start || '?') + ' &ndash; ' + (t.end || '?') + '</td>' +
        '<td style="font-size:12.5px">' + (t.venue || '&mdash;') + '</td>' +
        '<td class="row-actions"><button class="edit" data-edit="' + t.id + '">Edit</button>' +
        '<button class="del" data-del="' + t.id + '">Delete</button></td></tr>';
    }).join('') + '</tbody></table>' +
    '<div id="tt-editor-slot"></div>';

  document.getElementById('sec-timetables').innerHTML = html;

  document.getElementById('tt-new').addEventListener('click', function () { openEditor(blankTimetable()); });
  $$('#sec-timetables [data-edit]').forEach(function (b) {
    b.addEventListener('click', function () {
      api('GET', '/api/admin/timetables/' + b.getAttribute('data-edit')).then(openEditor)
        .catch(function (e) { toast(e.message, true); });
    });
  });
  $$('#sec-timetables [data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!confirm('Delete this entire timetable? This cannot be undone.')) return;
      api('DELETE', '/api/admin/timetables/' + b.getAttribute('data-del')).then(function () { toast('Timetable deleted.'); loadTimetables(); })
        .catch(function (e) { toast(e.message, true); });
    });
  });
}

function blankTimetable() {
  return {
    id: '', prog: 'mph', sem: 1, batch: '', ay: '', faculty: '', venue: '',
    start: '', end: '', source: '', flags: [],
    slots: [{ s: '09:00', e: '10:00', label: '9:00 &ndash; 10:00 am' }],
    days: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
  };
}

var EDITOR_STATE = null;
var isNewTimetable = false;

function openEditor(tt) {
  isNewTimetable = !tt.id;
  EDITOR_STATE = JSON.parse(JSON.stringify(tt));
  RSPH.DAYS.forEach(function (d) { if (!EDITOR_STATE.days[d]) EDITOR_STATE.days[d] = []; });
  renderEditor();
  document.getElementById('tt-editor-slot').scrollIntoView({ behavior: 'smooth' });
}

function fmtClockGuess(hhmm) {
  var p = hhmm.split(':'); var h = +p[0], m = +p[1] || 0;
  var period = h < 12 ? 'am' : 'pm'; var h12 = ((h + 11) % 12) + 1;
  return h12 + (m ? ':' + String(m).padStart(2, '0') : ':00') + ' ' + period;
}
function suggestLabel(slot) {
  if (!slot.s || !slot.e) return slot.label || '';
  return fmtClockGuess(slot.s) + ' &ndash; ' + fmtClockGuess(slot.e);
}

function renderEditor() {
  var t = EDITOR_STATE;
  var html = '<div class="tt-editor">' +
    '<div class="tt-editor-head"><h2>' + (isNewTimetable ? 'New timetable' : 'Editing ' +
      (RSPH.programmes[t.prog] ? RSPH.programmes[t.prog].short : t.prog) + ' &middot; Semester ' + t.sem) + '</h2>' +
      '<button class="btn" id="ed-close" type="button">Close editor</button></div>' +

    '<div class="field-row">' +
      field('Timetable id (unique, e.g. mph-2)', '<input id="ed-id" value="' + escAttr(t.id) + '"' + (isNewTimetable ? '' : ' disabled') + '/>') +
      field('Programme', '<select id="ed-prog">' + progOpts(t.prog) + '</select>') +
      field('Semester', '<select id="ed-sem">' + [1,2,3,4].map(function(s){return '<option value="'+s+'"'+(t.sem===s?' selected':'')+'>Semester '+s+'</option>';}).join('') + '</select>') +
    '</div>' +
    '<div class="field-row">' +
      field('Batch', '<input id="ed-batch" value="' + escAttr(t.batch) + '"/>') +
      field('Academic year', '<input id="ed-ay" value="' + escAttr(t.ay) + '"/>') +
      field('Venue', '<input id="ed-venue" value="' + escAttr(t.venue) + '"/>') +
    '</div>' +
    '<div class="field-row">' +
      field('Faculty / owning department', '<input id="ed-faculty" value="' + escAttr(t.faculty) + '"/>') +
      field('Start date', '<input id="ed-start" type="date" value="' + escAttr(t.start) + '"/>') +
      field('End date', '<input id="ed-end" type="date" value="' + escAttr(t.end) + '"/>') +
    '</div>' +
    field('Source (shown to visitors)', '<input id="ed-source" value="' + escAttr(t.source) + '"/>') +
    field('Notes on the source document (one per line, HTML allowed) &mdash; shown as flags', '<textarea id="ed-flags" rows="3">' + escAttr((t.flags || []).join('\n')) + '</textarea>') +

    '<h3 style="margin-top:20px">Time slots</h3>' +
    '<table class="slot-table" id="slot-table"><thead><tr><th>Start</th><th>End</th><th>Label</th><th>Lunch?</th><th></th></tr></thead>' +
    '<tbody>' + t.slots.map(slotRow).join('') + '</tbody></table>' +
    '<button class="mini-btn" id="add-slot" type="button">+ Add time slot</button>' +

    '<h3 style="margin-top:24px">Weekly blocks</h3>' +
    '<p style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 12px">Pick the slot each block starts in and how many slots it spans. Blocks render in the grid automatically sorted by start time.</p>' +
    RSPH.DAYS.map(function (d) { return dayBlockEditor(d, t.days[d] || []); }).join('') +

    '<div class="actions" style="margin-top:18px">' +
      '<button class="btn primary" id="ed-save" type="button">' + (isNewTimetable ? 'Create timetable' : 'Save changes') + '</button>' +
      '<button class="mini-btn" id="ed-preview" type="button">Refresh preview</button>' +
      (isNewTimetable ? '' : '<button class="mini-btn danger" id="ed-delete" type="button" style="margin-left:auto">Delete this timetable</button>') +
    '</div>' +
    '<p class="form-error" id="ed-error"></p>' +
    '<div class="preview-pane"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-soft)">Live preview</strong>' +
      '<div id="ed-preview-pane" style="margin-top:10px"></div></div>' +
  '</div>';

  document.getElementById('tt-editor-slot').innerHTML = html;
  wireEditor();
  refreshPreview();
}

function slotRow(s, i) {
  return '<tr data-idx="' + i + '">' +
    '<td><input type="time" class="s-start" value="' + escAttr(s.s) + '"/></td>' +
    '<td><input type="time" class="s-end" value="' + escAttr(s.e) + '"/></td>' +
    '<td><input type="text" class="s-label" value="' + escAttr(s.label) + '"/></td>' +
    '<td style="text-align:center"><input type="checkbox" class="s-lunch"' + (s.lunch ? ' checked' : '') + '/></td>' +
    '<td><button class="mini-btn danger" type="button" data-rm-slot="' + i + '">Remove</button></td></tr>';
}

function dayBlockEditor(day, blocks) {
  var t = EDITOR_STATE;
  return '<details class="day-block" open>' +
    '<summary>' + RSPH.DAY_FULL[day] + ' <span style="font-weight:400;color:var(--ink-soft);font-size:12px">' +
      blocks.length + ' block' + (blocks.length === 1 ? '' : 's') + '</span></summary>' +
    '<div class="day-block-body">' +
    '<table class="block-table" data-day="' + day + '"><thead><tr>' +
      '<th style="width:16%">Starts at</th><th style="width:8%">Span</th><th>Title</th>' +
      '<th style="width:12%">Code</th><th style="width:14%">Kind</th><th style="width:14%">Faculty/owner</th>' +
      '<th style="width:14%">Venue override</th><th></th></tr></thead><tbody>' +
      blocks.map(function (b, i) { return blockRow(day, b, i); }).join('') +
    '</tbody></table>' +
    '<button class="mini-btn" type="button" data-add-block="' + day + '">+ Add block to ' + RSPH.DAY_FULL[day] + '</button>' +
    '</div></details>';
}

function slotOptions(selectedIdx) {
  return EDITOR_STATE.slots.map(function (s, i) {
    return '<option value="' + i + '"' + (i === selectedIdx ? ' selected' : '') + '>' + TT.plain(s.label || (s.s + '–' + s.e)) + '</option>';
  }).join('');
}
function kindOptions(selected) {
  return Object.keys(RSPH.kinds).map(function (k) {
    return '<option value="' + k + '"' + (k === selected ? ' selected' : '') + '>' + RSPH.kinds[k].label + '</option>';
  }).join('');
}

function blockRow(day, b, i) {
  return '<tr data-idx="' + i + '">' +
    '<td><select class="b-i">' + slotOptions(b.i) + '</select></td>' +
    '<td><input type="number" class="b-n" min="1" max="' + EDITOR_STATE.slots.length + '" value="' + (b.n || 1) + '"/></td>' +
    '<td><input type="text" class="b-t" value="' + escAttr(b.t) + '" placeholder="Session title"/></td>' +
    '<td><input type="text" class="b-c" value="' + escAttr(b.c) + '" placeholder="optional"/></td>' +
    '<td><select class="b-k">' + kindOptions(b.k) + '</select></td>' +
    '<td><input type="text" class="b-f" value="' + escAttr(b.f) + '" placeholder="optional"/></td>' +
    '<td><input type="text" class="b-v" value="' + escAttr(b.v) + '" placeholder="optional"/></td>' +
    '<td><button class="mini-btn danger" type="button" data-rm-block="' + day + ':' + i + '">&times;</button></td></tr>';
}

function readEditorFormIntoState() {
  var t = EDITOR_STATE;
  t.id = document.getElementById('ed-id').value.trim();
  t.prog = document.getElementById('ed-prog').value;
  t.sem = +document.getElementById('ed-sem').value;
  t.batch = document.getElementById('ed-batch').value.trim();
  t.ay = document.getElementById('ed-ay').value.trim();
  t.venue = document.getElementById('ed-venue').value.trim();
  t.faculty = document.getElementById('ed-faculty').value.trim();
  t.start = document.getElementById('ed-start').value || null;
  t.end = document.getElementById('ed-end').value || null;
  t.source = document.getElementById('ed-source').value.trim();
  t.flags = document.getElementById('ed-flags').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);

  t.slots = $$('#slot-table tbody tr').map(function (tr) {
    return {
      s: tr.querySelector('.s-start').value,
      e: tr.querySelector('.s-end').value,
      label: tr.querySelector('.s-label').value,
      lunch: tr.querySelector('.s-lunch').checked
    };
  });

  RSPH.DAYS.forEach(function (day) {
    var table = document.querySelector('.block-table[data-day="' + day + '"]');
    if (!table) { t.days[day] = []; return; }
    t.days[day] = $$('tbody tr', table).map(function (tr) {
      var block = {
        i: +tr.querySelector('.b-i').value,
        n: Math.max(1, +tr.querySelector('.b-n').value || 1),
        t: tr.querySelector('.b-t').value.trim(),
        k: tr.querySelector('.b-k').value
      };
      var c = tr.querySelector('.b-c').value.trim(); if (c) block.c = c;
      var f = tr.querySelector('.b-f').value.trim(); if (f) block.f = f;
      var v = tr.querySelector('.b-v').value.trim(); if (v) block.v = v;
      return block;
    });
  });
}

function refreshPreview() {
  try {
    readEditorFormIntoState();
    var t = EDITOR_STATE;
    var pane = document.getElementById('ed-preview-pane');
    if (!t.slots.length) { pane.innerHTML = '<p style="font-size:13px;color:var(--ink-soft)">Add at least one time slot to preview the grid.</p>'; return; }
    pane.innerHTML = TT.renderGrid(t) + TT.renderLegend(t);
  } catch (e) {
    document.getElementById('ed-preview-pane').innerHTML = '<p style="font-size:13px;color:var(--alert)">Preview error: ' + e.message + '</p>';
  }
}

function wireEditor() {
  document.getElementById('ed-close').addEventListener('click', function () {
    EDITOR_STATE = null;
    document.getElementById('tt-editor-slot').innerHTML = '';
  });

  document.getElementById('add-slot').addEventListener('click', function () {
    readEditorFormIntoState();
    EDITOR_STATE.slots.push({ s: '', e: '', label: '' });
    renderEditor();
  });
  $$('#slot-table [data-rm-slot]').forEach(function (b) {
    b.addEventListener('click', function () {
      readEditorFormIntoState();
      var idx = +b.getAttribute('data-rm-slot');
      EDITOR_STATE.slots.splice(idx, 1);
      renderEditor();
    });
  });
  $$('.s-start, .s-end').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var tr = inp.closest('tr'); var idx = +tr.getAttribute('data-idx');
      var s = EDITOR_STATE.slots[idx];
      s.s = tr.querySelector('.s-start').value; s.e = tr.querySelector('.s-end').value;
      if (!s.label) { tr.querySelector('.s-label').value = suggestLabel(s); }
      refreshPreview();
    });
  });

  RSPH.DAYS.forEach(function (day) {
    var btn = document.querySelector('[data-add-block="' + day + '"]');
    if (btn) btn.addEventListener('click', function () {
      readEditorFormIntoState();
      EDITOR_STATE.days[day].push({ i: 0, n: 1, t: '', k: 'academic' });
      renderEditor();
    });
  });
  $$('[data-rm-block]').forEach(function (b) {
    b.addEventListener('click', function () {
      readEditorFormIntoState();
      var parts = b.getAttribute('data-rm-block').split(':');
      EDITOR_STATE.days[parts[0]].splice(+parts[1], 1);
      renderEditor();
    });
  });

  document.getElementById('ed-preview').addEventListener('click', refreshPreview);
  $$('.tt-editor input, .tt-editor select, .tt-editor textarea').forEach(function (el) {
    el.addEventListener('input', debounce(refreshPreview, 350));
  });

  document.getElementById('ed-save').addEventListener('click', function () {
    readEditorFormIntoState();
    var t = EDITOR_STATE;
    var err = document.getElementById('ed-error');
    if (!t.id || !t.prog || !t.sem) { err.textContent = 'Timetable id, programme and semester are required.'; return; }
    if (!t.slots.length) { err.textContent = 'At least one time slot is required.'; return; }
    err.textContent = '';
    var call = isNewTimetable ? api('POST', '/api/admin/timetables', t) : api('PUT', '/api/admin/timetables/' + t.id, t);
    call.then(function () {
      toast(isNewTimetable ? 'Timetable created.' : 'Timetable saved.');
      document.getElementById('tt-editor-slot').innerHTML = '';
      loadTimetables();
    }).catch(function (e) { err.textContent = e.message; });
  });

  var delBtn = document.getElementById('ed-delete');
  if (delBtn) delBtn.addEventListener('click', function () {
    if (!confirm('Delete this entire timetable? This cannot be undone.')) return;
    api('DELETE', '/api/admin/timetables/' + EDITOR_STATE.id).then(function () {
      toast('Timetable deleted.');
      document.getElementById('tt-editor-slot').innerHTML = '';
      loadTimetables();
    }).catch(function (e) { toast(e.message, true); });
  });
}

function debounce(fn, ms) {
  var h; return function () { clearTimeout(h); var a = arguments; h = setTimeout(function () { fn.apply(null, a); }, ms); };
}

/* ===========================================================================
   MODULE PLANS — the day-wise syllabus behind a subject. Edited whole-course-
   at-a-time as JSON (objectives/topics/teaching-guide nest too deeply for a
   quick form); the Timetables' Calendar view sequences these automatically
   against each course's real weekly hours, so nothing here mentions a date.
   =========================================================================== */
var SAMPLE_MODULE = {
  title: 'Module title', hours: 6,
  objectives: [{ text: 'By the end of this module, the student will be able to...', bloom: 'Understand', co: 'CO-1' }],
  topics: [{ text: 'A topic covered in this module', priority: 'must' }],
  guide: { notesFocus: '', pptOutline: [], videoIdea: '', readingIdea: '', exercise: '' }
};

function renderModulesSection() {
  var sorted = RSPH.courses.slice().sort(function (a, b) {
    return a.prog.localeCompare(b.prog) || a.sem - b.sem || a.code.localeCompare(b.code);
  });
  var options = sorted.map(function (c) {
    var key = c.prog + '|' + c.code;
    var mods = RSPH.modules[c.prog + ':' + c.code] || [];
    return '<option value="' + key + '">' + RSPH.programmes[c.prog].short + ' Sem ' + c.sem + ' &middot; ' +
      c.code + ' &mdash; ' + TT.plain(c.title) + ' (' + (mods.length ? mods.length + ' module' + (mods.length === 1 ? '' : 's') : 'none yet') + ')</option>';
  });

  var html = '<div class="page-title-bar" style="border-bottom:none;padding-bottom:0"><span class="eyebrow smallcaps">Day-wise syllabus</span>' +
    '<h1 style="font-size:22px;margin:6px 0">Module Plans</h1>' +
    '<p style="font-size:13.5px">Pick a subject, edit its module list as JSON, save. The Timetables page&rsquo;s Calendar view then ' +
    'works out which module lands on which real date on its own, from each module&rsquo;s <code>hours</code> against that subject&rsquo;s ' +
    'actual weekly timetable slots &mdash; nothing here is tied to a date.</p></div>' +

    '<div class="admin-form">' +
    '<label>Subject<select id="mp-course">' + options.join('') + '</select></label>' +
    '<div class="actions" style="margin:4px 0 14px">' +
      '<button class="mini-btn" id="mp-load" type="button">Load current plan</button>' +
      '<button class="mini-btn" id="mp-sample" type="button">Insert a blank module as a template</button>' +
    '</div>' +
    '<label>Modules (JSON array, in teaching order)<textarea id="mp-json" rows="18" ' +
      'style="font-family:ui-monospace,Consolas,monospace;font-size:12.5px;white-space:pre"></textarea></label>' +
    '<p style="font-size:12px;color:var(--ink-soft);margin:-8px 0 12px">Each module: <code>title</code>, <code>hours</code> (approved ' +
    'classroom hours &mdash; this is what drives how many sessions it consumes), <code>objectives</code> (<code>text</code>, ' +
    '<code>bloom</code>, <code>co</code>), <code>topics</code> (<code>text</code>, <code>priority</code>: must / desirable / nice), ' +
    'and <code>guide</code> (<code>notesFocus</code>, <code>pptOutline</code> array, <code>videoIdea</code>, <code>readingIdea</code>, ' +
    '<code>exercise</code>). Leave any of those blank rather than deleting the key. Saving replaces the <strong>whole</strong> list for ' +
    'this subject and re-numbers it in the order given.</p>' +
    '<p class="form-error" id="mp-error"></p>' +
    '<div class="actions"><button class="btn primary" id="mp-save" type="button">Save module plan</button></div>' +
    '</div>' +

    '<h3 style="margin-top:8px">All subjects with a plan on record</h3>' +
    moduleSummaryTable();

  document.getElementById('sec-modules').innerHTML = html;

  document.getElementById('mp-load').addEventListener('click', function () {
    var parts = document.getElementById('mp-course').value.split('|');
    var err = document.getElementById('mp-error'); err.textContent = '';
    api('GET', '/api/admin/modules/' + parts[0] + '/' + parts[1]).then(function (mods) {
      document.getElementById('mp-json').value = JSON.stringify(mods.map(function (m) {
        return { title: m.title, hours: Number(m.hours), objectives: m.objectives, topics: m.topics, guide: m.guide };
      }), null, 2);
      toast(mods.length ? mods.length + ' module(s) loaded.' : 'No plan on record yet for this subject — start from the template button.');
    }).catch(function (e) { err.textContent = e.message; });
  });

  document.getElementById('mp-sample').addEventListener('click', function () {
    var ta = document.getElementById('mp-json');
    var current = [];
    try { current = ta.value.trim() ? JSON.parse(ta.value) : []; } catch (e) { /* start fresh if it wasn't valid JSON */ }
    current.push(JSON.parse(JSON.stringify(SAMPLE_MODULE)));
    ta.value = JSON.stringify(current, null, 2);
  });

  document.getElementById('mp-save').addEventListener('click', function () {
    var parts = document.getElementById('mp-course').value.split('|');
    var err = document.getElementById('mp-error'); err.textContent = '';
    var parsed;
    try { parsed = JSON.parse(document.getElementById('mp-json').value || '[]'); }
    catch (e) { err.textContent = 'That isn’t valid JSON: ' + e.message; return; }
    if (!Array.isArray(parsed)) { err.textContent = 'Must be a JSON array of modules.'; return; }
    api('PUT', '/api/admin/modules/' + parts[0] + '/' + parts[1], parsed).then(function () {
      toast('Module plan saved (' + parsed.length + ' module' + (parsed.length === 1 ? '' : 's') + ').');
      // Reflect the save in the in-memory RSPH.modules immediately (it was
      // only populated once, at page load, from /api/bootstrap) so the
      // summary table and dropdown counts below are correct without a reload.
      RSPH.modules[parts[0] + ':' + parts[1]] = parsed.map(function (m, i) {
        return { seq: i + 1, title: m.title, hours: Number(m.hours) || 0,
                 objectives: m.objectives || [], topics: m.topics || [], guide: m.guide || {} };
      });
      renderModulesSection();
    }).catch(function (e) { err.textContent = e.message; });
  });
}

function moduleSummaryTable() {
  var rows = Object.keys(RSPH.modules).sort().map(function (key) {
    var parts = key.split(':'), prog = parts[0], code = parts[1];
    var mods = RSPH.modules[key];
    var c = RSPH.courses.filter(function (x) { return x.prog === prog && x.code === code; })[0];
    var totalHours = mods.reduce(function (a, m) { return a + (Number(m.hours) || 0); }, 0);
    return '<tr><td><span class="pill ' + prog + '">' + RSPH.programmes[prog].short + '</span></td>' +
      '<td class="code">' + code + '</td><td>' + (c ? c.title : '&mdash;') + '</td>' +
      '<td class="num">' + mods.length + '</td><td class="num">' + totalHours + ' h</td></tr>';
  }).join('');
  if (!rows) return '<p class="note"><span class="note-lbl">Nothing yet</span>No subject has a module plan on record.</p>';
  return '<table class="data-table"><thead><tr><th>Programme</th><th>Code</th><th>Subject</th>' +
    '<th class="num">Modules</th><th class="num">Total hours</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

/* ===========================================================================
   FACULTY LOAD — moved here from the old public faculty.html; students don't
   need to see who's teaching what, but the course coordinator does.
   =========================================================================== */
function renderFaculty() {
  var load = TT.facultyLoad();
  var named = load.filter(function (f) { return f.named; });
  var depts = load.filter(function (f) { return !f.named; });
  var all = TT.allSessions().filter(function (s) { return s.kind !== 'lunch'; });
  var unattributed = all.filter(function (s) { return !s.faculty; });
  var max = load.reduce(function (a, f) { return Math.max(a, f.minutes); }, 0) || 1;

  function table(list, caption) {
    if (!list.length) return '';
    return '<table class="data-table"><thead><tr>' +
      '<th>' + caption + '</th><th class="num">Sessions</th><th>Programmes</th>' +
      '<th>Hours per week</th><th>What they hold</th></tr></thead><tbody>' +
      list.map(function (f) {
        var progs = {};
        f.sessions.forEach(function (s) { progs[s.tt.prog] = true; });
        var what = {};
        f.sessions.forEach(function (s) { what[TT.plain(s.title)] = (what[TT.plain(s.title)] || 0) + 1; });
        return '<tr>' +
          '<td><strong style="color:var(--indigo)">' + f.name + '</strong></td>' +
          '<td class="num">' + f.sessions.length + '</td>' +
          '<td>' + Object.keys(progs).map(function (p) {
            return '<span class="pill ' + p + '">' + RSPH.programmes[p].short + '</span>';
          }).join(' ') + '</td>' +
          '<td><div class="bar-cell" style="--k:var(--indigo)">' +
            '<div class="bar-track"><div class="bar-fill" style="width:' + (f.minutes / max * 100) + '%"></div></div>' +
            '<span class="bar-val">' + TT.hrs(f.minutes) + '</span></div></td>' +
          '<td style="font-size:12.5px;color:var(--ink-soft)">' +
            Object.keys(what).map(function (t) { return t + (what[t] > 1 ? ' &times;' + what[t] : ''); }).join('<br/>') +
          '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  var byTT = {};
  unattributed.forEach(function (s) { (byTT[s.tt.id] = byTT[s.tt.id] || []).push(s); });
  var unattrHTML = Object.keys(byTT).map(function (id) {
    var list = byTT[id], tt = list[0].tt, p = RSPH.programmes[tt.prog];
    var mins = list.reduce(function (a, s) { return a + s.netMinutes; }, 0);
    var titles = {};
    list.forEach(function (s) { titles[TT.plain(s.title)] = (titles[TT.plain(s.title)] || 0) + 1; });
    return '<tr><td><span class="pill ' + tt.prog + '">' + p.short + '</span> Semester ' + tt.sem + '</td>' +
      '<td class="num">' + list.length + '</td><td class="num">' + TT.hrs(mins) + '</td>' +
      '<td style="font-size:12.5px;color:var(--ink-soft)">' +
        Object.keys(titles).sort().map(function (t) { return t + (titles[t] > 1 ? ' &times;' + titles[t] : ''); }).join(' &middot; ') +
      '</td></tr>';
  }).join('');

  var attributedMin = load.reduce(function (a, f) { return a + f.minutes; }, 0);
  var totalMin = all.reduce(function (a, s) { return a + s.netMinutes; }, 0);
  var pct = totalMin ? Math.round(attributedMin / totalMin * 100) : 0;

  function m(lbl, val, sub) {
    return '<div><span class="lbl">' + lbl + '</span><span class="val">' + val + '</span><span class="sub">' + sub + '</span></div>';
  }

  /* ---- subject-level mapping: Courses tab's "Faculty in charge" field,
     joined against each course's own timetabled hours — the automated load
     total for appraisal write-ups. Independent of whether the issued
     timetable itself names anyone in a block. ---- */
  var subjectRows = [];
  var bySem = {};
  RSPH.courses.forEach(function (c) { (bySem[c.prog + ':' + c.sem] = bySem[c.prog + ':' + c.sem] || []).push(c); });
  Object.keys(bySem).forEach(function (key) {
    var parts = key.split(':'), prog = parts[0], sem = +parts[1];
    var cov = TT.coverage(prog, sem);
    var tt = TT.getTT(prog, sem);
    var weeks = tt ? TT.termWeeks(tt) : null;
    cov.forEach(function (c) {
      subjectRows.push({
        faculty: c.course.faculty || null, prog: prog, sem: sem,
        code: c.course.code, title: c.course.title, credits: c.course.credits,
        minutes: c.minutes, present: c.present, weeks: weeks
      });
    });
  });
  var byFacultySubject = {};
  subjectRows.forEach(function (r) { if (r.faculty) (byFacultySubject[r.faculty] = byFacultySubject[r.faculty] || []).push(r); });
  var unassignedSubjects = subjectRows.filter(function (r) { return !r.faculty; });
  var facultyNames = Object.keys(byFacultySubject).sort();

  var subjectSection = facultyNames.length ? facultyNames.map(function (name) {
    var list = byFacultySubject[name];
    var totalCredits = list.reduce(function (a, r) { return a + r.credits; }, 0);
    var totalMin = list.reduce(function (a, r) { return a + r.minutes; }, 0);
    var anyWeeksUnknown = list.some(function (r) { return r.minutes && r.weeks == null; });
    var totalSemHours = list.reduce(function (a, r) { return a + (r.weeks ? (r.minutes / 60 * r.weeks) : 0); }, 0);
    var rows = list.map(function (r) {
      var p = RSPH.programmes[r.prog];
      return '<tr><td><span class="pill ' + r.prog + '">' + p.short + '</span> Sem ' + r.sem + '</td>' +
        '<td class="code">' + r.code + '</td><td>' + r.title + '</td>' +
        '<td class="num">' + r.credits + '</td>' +
        '<td class="num">' + (r.minutes ? TT.hrs(r.minutes) : (r.present === false ? '<span class="pill mute">No timetable</span>' : '&mdash;')) + '</td>' +
        '<td class="num">' + (r.weeks && r.minutes ? Math.round(r.minutes / 60 * r.weeks * 10) / 10 + ' h' : '&mdash;') + '</td></tr>';
    }).join('');
    return '<details class="module-block" style="margin-bottom:12px">' +
      '<summary><span class="modtitle"><strong style="color:var(--indigo)">' + name + '</strong></span>' +
      '<span class="modtitle-right"><span class="mod-duration">' + list.length + ' subject' + (list.length === 1 ? '' : 's') +
        ' &middot; ' + totalCredits + ' credits &middot; ' + TT.hrs(totalMin) + '/wk' +
        (totalSemHours ? ' &middot; ~' + Math.round(totalSemHours) + ' h this semester' + (anyWeeksUnknown ? '*' : '') : '') +
        '</span><span class="chev">&#9660;</span></span></summary>' +
      '<div style="padding:12px 20px 16px"><table class="data-table" style="margin-bottom:0"><thead><tr>' +
      '<th>Programme &amp; sem</th><th>Code</th><th>Subject</th><th class="num">Credits</th>' +
      '<th class="num">Hours / week</th><th class="num">Hours this semester</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</details>';
  }).join('') : '';

  document.getElementById('sec-faculty').innerHTML =
    '<div class="page-title-bar" style="border-bottom:none;padding-bottom:0"><span class="eyebrow smallcaps">For appraisal write-ups</span>' +
    '<h1 style="font-size:22px;margin:6px 0">Load by Subject</h1>' +
    '<p style="font-size:13.5px">Set &ldquo;Faculty in charge&rdquo; on each subject in the Courses tab; the credits and ' +
    'weekly/semester hours below are computed automatically from that subject&rsquo;s own timetable, not typed in twice.</p></div>' +
    (facultyNames.length ? subjectSection : '<p class="note"><span class="note-lbl">No subjects assigned yet</span>' +
      'Open the <strong>Courses</strong> tab and fill in &ldquo;Faculty in charge of this subject&rdquo; for each one &mdash; ' +
      'the totals here fill in as soon as you do.</p>') +
    (unassignedSubjects.length
      ? '<p class="note warn"><span class="note-lbl">' + unassignedSubjects.length + ' subject' +
        (unassignedSubjects.length === 1 ? '' : 's') + ' with no faculty assigned</span>' +
        unassignedSubjects.map(function (r) { return r.code + ' &middot; ' + r.title; }).join('<br/>') + '</p>'
      : '') +
    '<p class="note"><span class="note-lbl">How this is counted</span>&ldquo;Hours this semester&rdquo; = weekly contact ' +
    'hours &times; the number of teaching weeks between that timetable&rsquo;s start and end date &mdash; shown only where ' +
    'both dates are on record (a * marks a total where at least one of the faculty&rsquo;s subjects is missing an end date, ' +
    'so that subject is left out of the semester total, not guessed at).</p>' +

    '<div class="section-title" style="margin-top:40px"><span class="num">&sect;</span><div>' +
    '<h2>Who the issued timetable itself names</h2><p class="sub">From the timetable documents directly, independent of the ' +
    'subject mapping above &mdash; the school&rsquo;s own printed record of who takes each session.</p></div></div>' +
    '<div class="tt-meta">' +
      m('Named teachers', named.length, 'Individuals on the issued grids') +
      m('Departmental owners', depts.length, 'Sessions owned by a school/faculty') +
      m('Attributed load', pct + '%', TT.hrs(attributedMin) + ' of ' + TT.hrs(totalMin) + ' per week') +
      m('Unattributed sessions', unattributed.length, 'No teacher named in the source') +
    '</div>' +
    (named.length ? '<h3 style="margin-top:26px">Named faculty</h3>' + table(named, 'Faculty member') : '') +
    (depts.length ? '<h3 style="margin-top:26px">Sessions owned by a department</h3>' + table(depts, 'Owning department') : '') +
    '<h3 style="margin-top:26px">Sessions with no owner named</h3>' +
    (unattrHTML
      ? '<table class="data-table"><thead><tr><th>Timetable</th><th class="num">Sessions</th>' +
        '<th class="num">Hours / week</th><th>Sessions</th></tr></thead><tbody>' + unattrHTML + '</tbody></table>'
      : '<p class="note ok"><span class="note-lbl">Fully allocated</span>Every session names a teacher or an owning department.</p>') +
    '<p class="note"><span class="note-lbl">How this is counted</span>Hours are the clock hours of each block, excluding ' +
    'any lunch column a long block crosses. A block is credited to whoever the issued timetable names in brackets beneath ' +
    'the session title; nothing here is inferred.</p>';
}

/* ===========================================================================
   INSIGHTS & CHECKS — moved here from the old public insights.html.
   =========================================================================== */
function renderInsights() {
  var out = '<div class="page-title-bar" style="border-bottom:none;padding-bottom:0"><span class="eyebrow smallcaps">Automatic checks</span>' +
    '<h1 style="font-size:22px;margin:6px 0">Insights &amp; Checks</h1>' +
    '<p style="font-size:13.5px">Every published timetable, checked against every other timetable and against the approved specifications.</p></div>';

  var cl = TT.clashes();
  out += '<h3>1. Clash detection</h3>';
  if (!cl.length) {
    out += '<p class="note ok"><span class="note-lbl">No clashes found</span>No two sessions compete for the same room or teacher.</p>';
  } else {
    var groups = {}, order = [];
    cl.forEach(function (c) {
      var key = [c.a.tt.id, c.b.tt.id].sort().join('|') + '|' + c.reason;
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(c);
    });
    out += order.map(function (key) {
      var list = groups[key], first = list[0];
      var pA = RSPH.programmes[first.a.tt.prog], pB = RSPH.programmes[first.b.tt.prog];
      var totalMin = list.reduce(function (a, c) { return a + (c.to - c.from); }, 0);
      var certain = list.some(function (c) { return c.certain; });
      var rows = list.map(function (c) {
        function side(s) {
          return '<strong style="color:var(--indigo)">' + s.title + '</strong>' + (s.code ? ' <span class="code">' + s.code + '</span>' : '') +
            '<br/><span style="font-size:11.5px;color:var(--ink-soft)">' + s.startLabel + '&ndash;' + s.endLabel +
            (s.faculty ? ' &middot; ' + s.faculty : '') + '</span>';
        }
        return '<tr><td><strong>' + RSPH.DAY_FULL[c.day] + '</strong></td><td>' + side(c.a) + '</td><td>' + side(c.b) + '</td></tr>';
      }).join('');
      return '<details class="module-block" style="margin-bottom:14px">' +
        '<summary><span class="modtitle">' +
          '<span class="pill ' + first.a.tt.prog + '">' + pA.short + ' Sem ' + first.a.tt.sem + '</span>&nbsp;&harr;&nbsp;' +
          '<span class="pill ' + first.b.tt.prog + '">' + pB.short + ' Sem ' + first.b.tt.sem + '</span>&nbsp;' +
          '<span class="pill alert">' + (first.reason === 'faculty' ? 'Same teacher' : 'Same venue') + ': ' +
          TT.plain(first.a.venue === first.b.venue ? first.a.venue : (first.a.faculty || '')) + '</span></span>' +
        '<span class="modtitle-right"><span class="mod-duration">' + list.length + ' overlapping slot' + (list.length === 1 ? '' : 's') +
          ' &middot; ' + TT.hrs(totalMin) + '/wk</span>' +
          (certain ? '<span class="pill alert">Terms overlap</span>' : '<span class="pill warn">Dates unconfirmed</span>') +
          '<span class="chev">&#9660;</span></span></summary>' +
        '<div style="padding:16px 22px 20px"><table class="data-table" style="margin-bottom:0"><thead><tr><th>Day</th><th>' +
        pA.short + '</th><th>' + pB.short + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
    }).join('');
    out += '<p class="note warn"><span class="note-lbl">Read with care</span>A venue clash only fires on an exact match of ' +
      'the printed venue text &mdash; near-matches (a hedged label vs. a plain one) are close enough that the coordinator ' +
      'should still confirm the two cohorts get different rooms when both are in term.</p>';
  }

  out += '<h3 style="margin-top:30px">2. Contact hours against the approved scheme</h3>';
  RSPH.timetables.forEach(function (tt) {
    var p = RSPH.programmes[tt.prog];
    var cov = TT.coverage(tt.prog, tt.sem);
    var contact = TT.weeklyContact(tt);
    var totalCr = cov.reduce(function (a, c) { return a + c.course.credits; }, 0);
    out += '<h4 style="font-family:\'Playfair Display\',serif;font-size:15px;color:var(--indigo);margin:20px 0 8px">' +
      '<span class="pill ' + tt.prog + '">' + p.short + '</span> Semester ' + tt.sem +
      ' <span style="font-size:12px;font-weight:400;color:var(--ink-soft)">&middot; ' + TT.hrs(contact) +
      ' of timetabled contact per week &middot; ' + totalCr + ' credits</span></h4>';
    out += '<table class="data-table"><thead><tr><th>Code</th><th>Course</th><th>Type</th>' +
      '<th class="num">Credits</th><th class="num">Hours / week</th><th>On the grid</th></tr></thead><tbody>' +
      cov.map(function (c) {
        return '<tr><td class="code">' + c.course.code + '</td><td>' + c.course.title + '</td>' +
          '<td style="font-size:12px;color:var(--ink-soft)">' + c.course.type + '</td>' +
          '<td class="num">' + c.course.credits + '</td>' +
          '<td class="num">' + (c.minutes ? TT.hrs(c.minutes) : '&mdash;') + '</td>' +
          '<td>' + (c.present ? '<span class="pill ok">Scheduled</span>' :
            (c.course.type === 'experiential' ? '<span class="pill mute">Not timetabled</span>' : '<span class="pill warn">No slot</span>')) +
          '</td></tr>';
      }).join('') + '</tbody></table>';
  });

  out += '<h3 style="margin-top:30px">3. How each week is actually spent</h3>';
  out += '<table class="data-table"><thead><tr><th>Timetable</th><th>Breakdown of the week</th><th class="num">Total</th></tr></thead><tbody>' +
    RSPH.timetables.map(function (tt) {
      var p = RSPH.programmes[tt.prog];
      var kl = TT.kindLoad(tt);
      var tot = Object.keys(kl).reduce(function (a, k) { return a + kl[k]; }, 0) || 1;
      var bar = '<div style="display:flex;height:16px;border-radius:999px;overflow:hidden;border:1px solid var(--border);margin-bottom:8px">' +
        Object.keys(kl).sort(function (a, b) { return kl[b] - kl[a]; }).map(function (k) {
          return '<div title="' + RSPH.kinds[k].label + ' — ' + TT.hrs(kl[k]) + '" style="width:' + (kl[k] / tot * 100) + '%;background:' + RSPH.kinds[k].color + '"></div>';
        }).join('') + '</div>';
      return '<tr><td style="white-space:nowrap"><span class="pill ' + tt.prog + '">' + p.short + '</span><br/>' +
        '<strong style="color:var(--indigo)">Semester ' + tt.sem + '</strong></td><td>' + bar + '</td>' +
        '<td class="num">' + TT.hrs(tot) + '</td></tr>';
    }).join('') + '</tbody></table>';

  out += '<h3 style="margin-top:30px">4. Notes on the source documents</h3>';
  var anyFlag = false;
  RSPH.timetables.forEach(function (tt) {
    if (!tt.flags || !tt.flags.length) return;
    anyFlag = true;
    var p = RSPH.programmes[tt.prog];
    out += '<p class="note alert"><span class="note-lbl">' + p.short + ' &middot; Semester ' + tt.sem + ' &mdash; ' + tt.source + '</span><ul>' +
      tt.flags.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></p>';
  });
  if (!anyFlag) out += '<p class="note ok"><span class="note-lbl">Clean</span>No ambiguities recorded.</p>';

  out += '<h3 style="margin-top:30px">5. Timetables not yet issued</h3>';
  var pend = RSPH.pending.map(function (x) {
    var p = RSPH.programmes[x.prog];
    var cr = RSPH.courses.filter(function (c) { return c.prog === x.prog && c.sem === x.sem; });
    return '<tr><td><span class="pill ' + x.prog + '">' + p.short + '</span></td>' +
      '<td><strong style="color:var(--indigo)">Semester ' + x.sem + '</strong></td>' +
      '<td class="num">' + cr.length + '</td><td class="num">' + cr.reduce(function (a, c) { return a + c.credits; }, 0) + '</td></tr>';
  }).join('');
  out += '<table class="data-table"><thead><tr><th>Programme</th><th>Semester</th><th class="num">Courses</th><th class="num">Credits</th></tr></thead><tbody>' +
    pend + '</tbody></table>' +
    '<p class="note"><span class="note-lbl">Adding one</span>Use the <strong>Timetables</strong> tab above to add it.</p>';

  document.getElementById('sec-insights').innerHTML = out;
}

/* ===========================================================================
   ACCOUNT
   =========================================================================== */
function renderAccount() {
  document.getElementById('sec-account').innerHTML =
    '<div class="admin-card" style="max-width:420px">' +
    '<h2>Change password</h2>' +
    '<label>Current password<input type="password" id="pw-old"/></label>' +
    '<label>New password (min. 8 characters)<input type="password" id="pw-new"/></label>' +
    '<p class="form-error" id="pw-error"></p>' +
    '<button class="btn primary" id="pw-save" type="button">Update password</button>' +
    '</div>';

  document.getElementById('pw-save').addEventListener('click', function () {
    var oldPassword = document.getElementById('pw-old').value;
    var newPassword = document.getElementById('pw-new').value;
    var err = document.getElementById('pw-error');
    api('POST', '/api/auth/change-password', { oldPassword: oldPassword, newPassword: newPassword })
      .then(function () { err.className = 'form-ok'; err.textContent = 'Password updated.'; })
      .catch(function (e) { err.className = 'form-error'; err.textContent = e.message; });
  });
}

/* ---------- boot ---------- */
RSPH_READY.then(function () {
  TT.mountChrome('admin.html');
  checkAuth();
}).catch(function (e) { console.error(e); });

})();
