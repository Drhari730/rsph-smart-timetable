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
  switchSection('courses');
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
  ['courses', 'electives', 'timetables', 'account'].forEach(function (s) {
    document.getElementById('sec-' + s).style.display = (s === name) ? 'block' : 'none';
  });
  if (name === 'courses') loadCourses();
  if (name === 'electives') loadElectives();
  if (name === 'timetables') loadTimetables();
  if (name === 'account') renderAccount();
}

var TYPE_OPTS = ['core', 'elective', 'ogec', 'experiential'];

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
        '<th class="num">Credits</th><th>Notes link</th><th></th></tr></thead><tbody>' +
        list.map(function (c) {
          return '<tr><td class="code">' + c.code + '</td><td>' + c.title + '</td>' +
            '<td>' + c.type + '</td><td class="num">' + c.credits + '</td>' +
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
      title: document.getElementById('cf-title').value.trim()
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
