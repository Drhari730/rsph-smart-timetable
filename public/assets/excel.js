/* ===========================================================================
   RSPH Smart Timetable — Excel (.xlsx) export
   ---------------------------------------------------------------------------
   Builds a real spreadsheet (ExcelJS, loaded from cdnjs on timetable.html)
   laid out like the on-screen grid: one row per day, one column per slot,
   multi-slot blocks merged, each block filled with its kind's colours, and
   the lunch column merged down the whole week. A second sheet carries the
   day-wise teaching plan and a third the weekly load, so the file is useful
   on its own when it is forwarded or printed.
   =========================================================================== */
(function (global) {
'use strict';

const argb = hex => 'FF' + String(hex || '#000000').replace('#', '').toUpperCase();
const thin = c => ({ style: 'thin', color: { argb: argb(c) } });
const GRID = '#D9CFD6', WINE = '#381A6B', CORAL = '#C0383A', INK = '#3D2B49', MUTE = '#7A6C7D', PAPER = '#FBF6F1';

function fill(hex) { return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } }; }
function boxed(cell, edge) {
  cell.border = { top: thin(GRID), bottom: thin(GRID), right: thin(GRID),
                  left: edge ? { style: 'thick', color: { argb: argb(edge) } } : thin(GRID) };
}
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function dmy(d) { return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

/* opts: { weekStart: Date (Monday) — dates the grid and shows that week's
   module in each course cell; omitted gives the plain recurring week } */
function downloadExcel(tt, opts) {
  opts = opts || {};
  if (!global.ExcelJS) { alert('The spreadsheet library did not load. Please refresh and try again.'); return Promise.resolve(); }
  const P = TT.plain;
  const p = RSPH.programmes[tt.prog];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RSPH Smart Timetable';
  wb.created = new Date();

  /* ---------------- Sheet 1: the grid ---------------- */
  const ws = wb.addWorksheet('Timetable', {
    views: [{ showGridLines: false, state: 'frozen', xSplit: 1, ySplit: 5 }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0,
                 margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } }
  });
  const nSlots = tt.slots.length, lastCol = nSlots + 1;
  ws.getColumn(1).width = 16;
  tt.slots.forEach((s, i) => { ws.getColumn(i + 2).width = s.lunch ? 9 : 26; });

  const title = (row, text, font, h) => {
    ws.mergeCells(row, 1, row, lastCol);
    const c = ws.getCell(row, 1);
    c.value = text; c.font = font; c.alignment = { vertical: 'middle', horizontal: 'left' };
    if (h) ws.getRow(row).height = h;
  };
  title(1, P(RSPH.meta.school || 'Ramaiah School of Public Health').toUpperCase(),
        { name: 'Georgia', size: 9, bold: true, color: { argb: argb(CORAL) } }, 16);
  title(2, P(p.name) + ' — Semester ' + tt.sem,
        { name: 'Georgia', size: 16, bold: true, color: { argb: argb(WINE) } }, 26);
  const weekTxt = opts.weekStart ? ' · Week of ' + dmy(opts.weekStart) + ' – ' + dmy(addDays(opts.weekStart, 6)) : '';
  title(3, 'Batch ' + tt.batch + ' · Academic Year ' + tt.ay + ' · ' + P(tt.venue) + weekTxt +
           ' · Downloaded ' + dmy(new Date()),
        { name: 'Georgia', size: 10, color: { argb: argb(MUTE) } }, 16);

  // header row
  const HR = 5;
  const hdr = ws.getRow(HR); hdr.height = 30;
  const hc = ws.getCell(HR, 1);
  hc.value = 'Day';
  [hc].concat(tt.slots.map((s, i) => ws.getCell(HR, i + 2))).forEach((c, i) => {
    if (i > 0) c.value = P(tt.slots[i - 1].label);
    c.font = { name: 'Georgia', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = fill(WINE);
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top: thin(WINE), bottom: thin(WINE), left: thin('#5A3A8A'), right: thin('#5A3A8A') };
  });

  const days = RSPH.DAYS.filter(d => (tt.days[d] || []).length);
  const lunchIdx = tt.slots.map((s, i) => s.lunch ? i : -1).filter(i => i >= 0);
  const crossesLunch = li => days.some(d => tt.days[d].some(b => b.i <= li && b.i + b.n - 1 >= li));

  days.forEach((day, r) => {
    const row = HR + 1 + r;
    const date = opts.weekStart ? addDays(opts.weekStart, RSPH.DAYS.indexOf(day)) : null;
    ws.getRow(row).height = 78;
    const dc = ws.getCell(row, 1);
    dc.value = { richText: [{ text: RSPH.DAY_FULL[day], font: { name: 'Georgia', size: 11, bold: true, color: { argb: argb(WINE) } } }]
      .concat(date ? [{ text: '\n' + dmy(date), font: { name: 'Georgia', size: 9, color: { argb: argb(MUTE) } } }] : []) };
    dc.fill = fill('#F5EFF3');
    dc.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    boxed(dc);

    // empty background for every slot first
    for (let i = 0; i < nSlots; i++) {
      const c = ws.getCell(row, i + 2);
      c.fill = fill(tt.slots[i].lunch ? RSPH.kinds.lunch.bg : '#FFFFFF');
      boxed(c);
    }

    tt.days[day].slice().sort((a, b) => a.i - b.i).forEach(b => {
      const k = RSPH.kinds[b.k] || RSPH.kinds.lecture;
      const c0 = b.i + 2, c1 = Math.min(b.i + b.n - 1, nSlots - 1) + 2;
      if (c1 > c0) ws.mergeCells(row, c0, row, c1);
      const cell = ws.getCell(row, c0);
      const crs = b.c ? TT.course(tt.prog, b.c) : null;
      const first = tt.slots[b.i], last = tt.slots[Math.min(b.i + b.n - 1, nSlots - 1)];
      const rt = [{ text: P(b.t), font: { name: 'Georgia', size: 10.5, bold: true, color: { argb: argb(k.color) } } }];
      const sub = [b.c, TT.fmtHM(TT.toMin(first.s)) + '–' + TT.fmtHM(TT.toMin(last.e))].filter(Boolean).join(' · ');
      rt.push({ text: '\n' + sub, font: { name: 'Georgia', size: 8.5, color: { argb: argb(MUTE) } } });
      const fac = b.f || (crs && crs.faculty);
      if (fac) rt.push({ text: '\n' + P(fac), font: { name: 'Georgia', size: 8.5, italic: true, color: { argb: argb(INK) } } });
      if (date && b.c && b.k !== 'field') {
        const m = TT.moduleForDate(tt, b.c, date);
        if (m) rt.push({ text: '\nModule ' + (m.moduleIndex + 1) + ': ' + P(m.module.title),
                         font: { name: 'Georgia', size: 8.5, bold: true, color: { argb: argb(CORAL) } } });
      }
      cell.value = { richText: rt };
      cell.fill = fill(k.bg);
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
      for (let cc = c0; cc <= c1; cc++) { const x = ws.getCell(row, cc); x.fill = fill(k.bg); boxed(x, cc === c0 ? k.color : null); }
    });
  });

  // lunch column: one merged band down the week, unless a block runs through it
  const firstRow = HR + 1, lastRow = HR + days.length;
  lunchIdx.forEach(li => {
    if (!days.length || crossesLunch(li)) {
      days.forEach((d, r) => {
        const c = ws.getCell(firstRow + r, li + 2);
        if (!c.isMerged) { c.value = 'LUNCH'; c.font = { name: 'Georgia', size: 8, bold: true, color: { argb: argb(RSPH.kinds.lunch.color) } };
                           c.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 }; }
      });
      return;
    }
    if (lastRow > firstRow) ws.mergeCells(firstRow, li + 2, lastRow, li + 2);
    const c = ws.getCell(firstRow, li + 2);
    c.value = 'LUNCH BREAK';
    c.font = { name: 'Georgia', size: 10, bold: true, color: { argb: argb(RSPH.kinds.lunch.color) } };
    c.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 };
    c.fill = fill(RSPH.kinds.lunch.bg);
  });

  // legend
  let lr = lastRow + 2;
  ws.getCell(lr, 1).value = 'Legend';
  ws.getCell(lr, 1).font = { name: 'Georgia', size: 10, bold: true, color: { argb: argb(WINE) } };
  const used = Object.keys(RSPH.kinds).filter(k => k !== 'lunch' && days.some(d => tt.days[d].some(b => b.k === k)));
  used.forEach((k, j) => {
    const c = ws.getCell(lr, j + 2);
    c.value = RSPH.kinds[k].label;
    c.font = { name: 'Georgia', size: 9, bold: true, color: { argb: argb(RSPH.kinds[k].color) } };
    c.fill = fill(RSPH.kinds[k].bg);
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    boxed(c, RSPH.kinds[k].color);
  });
  ws.getRow(lr).height = 22;

  if (tt.flags && tt.flags.length) {
    lr += 2;
    tt.flags.forEach(f => { title(lr++, '• ' + P(f), { name: 'Georgia', size: 9, italic: true, color: { argb: argb(MUTE) } }); });
  }
  title(lr + 1, 'Source: ' + P(tt.source) + '. Generated by the RSPH Smart Timetable.',
        { name: 'Georgia', size: 8.5, color: { argb: argb(MUTE) } });

  /* ---------------- Sheet 2: day-wise teaching plan ---------------- */
  const codes = [];
  RSPH.DAYS.forEach(d => (tt.days[d] || []).forEach(b => { if (b.c && codes.indexOf(b.c) < 0) codes.push(b.c); }));
  const planned = codes.filter(c => TT.courseModules(tt.prog, c).length);
  if (planned.length) {
    const ps = wb.addWorksheet('Teaching plan', { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [12, 30, 8, 34, 8, 9, 14, 14, 60].forEach((w, i) => { ps.getColumn(i + 1).width = w; });
    ps.mergeCells(1, 1, 1, 9);
    ps.getCell(1, 1).value = P(p.name) + ' — Semester ' + tt.sem + ' · Suggested day-wise teaching plan';
    ps.getCell(1, 1).font = { name: 'Georgia', size: 14, bold: true, color: { argb: argb(WINE) } };
    ps.mergeCells(2, 1, 2, 9);
    ps.getCell(2, 1).value = (tt.start ? 'Dates run from the term start, ' + dmy(TT.parseDate(tt.start)) :
      'Term start date not on record — dates assume teaching from 1 September') +
      '. Each module takes the hours in the Course Specification, in order, across the course’s weekly slots.';
    ps.getCell(2, 1).font = { name: 'Georgia', size: 9, italic: true, color: { argb: argb(MUTE) } };
    ps.getCell(2, 1).alignment = { wrapText: true }; ps.getRow(2).height = 28;

    const H = ['Code', 'Course', 'Credits', 'Module', 'Hours', 'Sessions', 'From', 'To', 'Objectives'];
    H.forEach((h, i) => {
      const c = ps.getCell(4, i + 1);
      c.value = h; c.fill = fill(WINE);
      c.font = { name: 'Georgia', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { vertical: 'middle', horizontal: i >= 2 && i <= 7 ? 'center' : 'left' };
    });
    ps.getRow(4).height = 22;

    let r = 5;
    planned.forEach((code, ci) => {
      const crs = TT.course(tt.prog, code) || { title: code, credits: '' };
      const mods = TT.courseModules(tt.prog, code);
      const sched = TT.moduleSchedule(tt, code);
      const tint = ci % 2 ? '#FFFFFF' : '#F7F3F8';
      const startRow = r;
      mods.forEach((m, mi) => {
        const occ = sched.filter(s => s.moduleIndex === mi);
        const vals = [code, P(crs.title) + (crs.faculty ? '\n' + P(crs.faculty) : ''), crs.credits,
          (mi + 1) + '. ' + P(m.title), m.hours, occ.length || '—',
          occ.length ? dmy(occ[0].date) : 'Not reached', occ.length ? dmy(occ[occ.length - 1].date) : '',
          (m.objectives || []).map(o => '• ' + P(o)).join('\n')];
        vals.forEach((v, i) => {
          const c = ps.getCell(r, i + 1);
          c.value = v; c.fill = fill(tint);
          c.font = { name: 'Georgia', size: 9.5, bold: i === 0 || i === 3, color: { argb: argb(i === 0 ? WINE : INK) } };
          c.alignment = { vertical: 'top', wrapText: true, horizontal: i >= 2 && i <= 7 ? 'center' : 'left' };
          c.border = { bottom: thin(GRID), left: i === 0 ? { style: 'thick', color: { argb: argb(WINE) } } : undefined };
        });
        const lines = Math.max(2, (m.objectives || []).length, Math.ceil(P(m.title).length / 32));
        ps.getRow(r).height = Math.min(160, 14 * lines + 6);
        r++;
      });
      if (r - 1 > startRow) [1, 2, 3].forEach(col => ps.mergeCells(startRow, col, r - 1, col));
    });
  }

  /* ---------------- Sheet 3: weekly load ---------------- */
  const ls = wb.addWorksheet('Weekly load', { views: [{ showGridLines: false }] });
  [12, 44, 9, 34, 10, 12].forEach((w, i) => { ls.getColumn(i + 1).width = w; });
  ls.getCell(1, 1).value = 'Weekly load, computed from the grid (lunch excluded)';
  ls.getCell(1, 1).font = { name: 'Georgia', size: 13, bold: true, color: { argb: argb(WINE) } };
  ['Code', 'Course / activity', 'Credits', 'Faculty', 'Sessions', 'Hours / week'].forEach((h, i) => {
    const c = ls.getCell(3, i + 1);
    c.value = h; c.fill = fill(WINE);
    c.font = { name: 'Georgia', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  });
  TT.courseLoad(tt).forEach((row, j) => {
    const crs = row.code ? TT.course(tt.prog, row.code) : null;
    const vals = [row.code || '—', P(row.title), crs ? crs.credits : '—', crs && crs.faculty ? P(crs.faculty) : '',
                  row.count, Math.round(row.minutes / 6) / 10];
    vals.forEach((v, i) => {
      const c = ls.getCell(4 + j, i + 1);
      c.value = v; c.fill = fill(j % 2 ? '#FFFFFF' : '#F7F3F8');
      c.font = { name: 'Georgia', size: 9.5, bold: i === 0, color: { argb: argb(i === 0 ? WINE : INK) } };
      c.alignment = { vertical: 'top', wrapText: true, horizontal: i >= 4 || i === 2 ? 'center' : 'left' };
      c.border = { bottom: thin(GRID) };
    });
  });

  const fname = 'RSPH-' + p.short + '-Sem' + tt.sem + (opts.weekStart ? '-week-' + TT.ymd(opts.weekStart) : '') + '.xlsx';
  return wb.xlsx.writeBuffer().then(buf => {
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}

global.TT_EXCEL = { downloadExcel };
})(window);
