/* ===========================================================================
   RSPH Smart Timetable — Word (.docx) export
   ---------------------------------------------------------------------------
   A course-wise teaching schedule for a chosen date range, built with the
   `docx` library (loaded from unpkg on timetable.html). One section per
   course: its credits, faculty and plan start, then every session in the
   range with its date, time, unit and topic, then the objectives and
   teaching methods of each unit taught in that period.
   =========================================================================== */
(function (global) {
'use strict';

const WINE = '381A6B', CORAL = 'C0383A', MUTE = '7A6C7D', INK = '3D2B49', GRID = 'D9CFD6';
const FONT = 'Georgia';

function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function dmy(d) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
const hex = c => String(c || '').replace('#', '').toUpperCase();

/* Every session of one course between from and to (inclusive), in order. */
function courseSessions(tt, code, from, to) {
  const out = [];
  for (let d = new Date(from.getTime()); d <= to; d = addDays(d, 1)) {
    const day = RSPH.DAYS[(d.getDay() + 6) % 7];
    TT.dayBlocks(tt, day, d).filter(b => b.c === code).sort((a, b) => a.i - b.i).forEach(b => {
      if (!TT.dateInTerm(tt, d)) return;
      const first = tt.slots[b.i], last = tt.slots[Math.min(b.i + b.n - 1, tt.slots.length - 1)];
      const m = b.k !== 'field' ? TT.moduleForDate(tt, code, d, b) : null;
      out.push({ date: new Date(d.getTime()), day, b,
        time: TT.fmtHM(TT.toMin(first.s)) + '–' + TT.fmtHM(TT.toMin(last.e)), m });
    });
  }
  return out;
}

function downloadWord(tt, opts) {
  const D = global.docx;
  if (!D) { alert('The Word library did not load. Please refresh and try again.'); return Promise.resolve(); }
  const P = TT.plain;
  const p = RSPH.programmes[tt.prog];
  const from = opts.from, to = opts.to;

  // the courses to include: the ones picked, else every course on the grid
  let codes = (opts.codes && opts.codes.length) ? opts.codes.slice() : [];
  if (!codes.length) RSPH.DAYS.forEach(d => (tt.days[d] || []).forEach(b => { if (b.c && codes.indexOf(b.c) < 0) codes.push(b.c); }));

  const run = (text, o) => new D.TextRun(Object.assign({ text: String(text == null ? '' : text), font: FONT, size: 20, color: INK }, o || {}));
  const para = (children, o) => new D.Paragraph(Object.assign({ children: [].concat(children), spacing: { after: 80 } }, o || {}));

  const cell = (text, o) => {
    o = o || {};
    const lines = String(text == null ? '' : text).split('\n');
    return new D.TableCell({
      children: lines.map((l, i) => para(run(l, Object.assign({ size: 18 }, o.run || {}, i > 0 && o.subRun ? o.subRun : {})), { spacing: { after: 0 } })),
      shading: o.fill ? { fill: o.fill, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      verticalAlign: D.VerticalAlign.TOP,
      width: o.width ? { size: o.width, type: D.WidthType.PERCENTAGE } : undefined,
      borders: o.borders
    });
  };
  const border = c => ({ style: D.BorderStyle.SINGLE, size: 4, color: c || GRID });
  const allBorders = { top: border(), bottom: border(), left: border(), right: border() };

  /* ---------- week-by-week grid pages, laid out like the website ---------- */
  const gtt = (opts.codes && opts.codes.length) ? TT.filterTT(tt, opts.codes) : tt;
  const toMin = s => { const a = s.split(':'); return a[0] * 60 + +a[1]; };
  const PAGE_W = 16838 - 1440;               // A4 landscape minus margins (DXA)
  const DAY_W = 1350, LUNCH_W = 380;
  const teachMin = gtt.slots.reduce((a, s) => a + (s.lunch ? 0 : toMin(s.e) - toMin(s.s)), 0);
  const restW = PAGE_W - DAY_W - LUNCH_W * gtt.slots.filter(s => s.lunch).length;
  const slotW = gtt.slots.map(s => s.lunch ? LUNCH_W : Math.floor((toMin(s.e) - toMin(s.s)) / teachMin * restW));
  slotW[slotW.length - 1] += PAGE_W - DAY_W - slotW.reduce((a, b) => a + b, 0);
  const colW = [DAY_W].concat(slotW);
  const dx = w => ({ size: w, type: D.WidthType.DXA });
  const thin = c => ({ style: D.BorderStyle.SINGLE, size: 4, color: c || 'D9CFD6' });
  const gridBorders = { top: thin(), bottom: thin(), left: thin(), right: thin() };
  const gp = (runs, o) => new D.Paragraph(Object.assign({ children: [].concat(runs), spacing: { after: 0, line: 230 } }, o || {}));
  const usedKinds = [];

  function blockCell(b, date, w) {
    const k = RSPH.kinds[b.k] || RSPH.kinds.lecture;
    if (usedKinds.indexOf(b.k) < 0) usedKinds.push(b.k);
    const crs = b.c ? TT.course(gtt.prog, b.c) : null;
    const m = date && b.c && b.k !== 'field' && b.k !== 'exam' && TT.dateInTerm(gtt, date) ? TT.moduleForDate(gtt, b.c, date, b) : null;
    const fac = b.f || (crs && crs.faculty);
    const kids = [];
    if (b.c) kids.push(gp(run(b.c, { size: 13, bold: true, color: CORAL })));
    kids.push(gp(run(P(b.t), { size: 15, bold: true, color: hex(k.color) })));
    if (m) {
      kids.push(gp(run('□ ' + P(TT.modLabel(m)), { size: 13, bold: true, color: WINE }), { spacing: { before: 30, after: 0, line: 220 } }));
      const tp = P(TT.topicText(m, '; '));
      if (tp) kids.push(gp(run('▸ ' + tp, { size: 12.5, italics: true, color: INK }), { spacing: { after: 0, line: 220 } }));
    }
    if (fac) kids.push(gp(run(P(fac), { size: 12, color: MUTE }), { spacing: { before: 30, after: 0, line: 220 } }));
    return new D.TableCell({ children: kids, width: dx(w), columnSpan: b.n > 1 ? b.n : undefined,
      shading: { fill: hex(k.bg), type: D.ShadingType.CLEAR, color: 'auto' },
      margins: { top: 50, bottom: 50, left: 80, right: 60 }, verticalAlign: D.VerticalAlign.TOP,
      borders: Object.assign({}, gridBorders, { left: { style: D.BorderStyle.SINGLE, size: 18, color: hex(k.color) } }) });
  }

  function weekTable(ws) {
    const head = new D.TableRow({ tableHeader: true, children: [
      new D.TableCell({ children: [gp(run('Day', { bold: true, size: 15, color: 'FFFFFF' }))], width: dx(DAY_W),
        shading: { fill: WINE, type: D.ShadingType.CLEAR, color: 'auto' }, margins: { top: 60, bottom: 60, left: 80, right: 40 }, borders: gridBorders })
    ].concat(gtt.slots.map((s, i) => new D.TableCell({
      children: [gp(run(P(s.label), { bold: true, size: s.lunch ? 11 : 14, color: 'FFFFFF' }), { alignment: D.AlignmentType.CENTER })],
      width: dx(slotW[i]), shading: { fill: WINE, type: D.ShadingType.CLEAR, color: 'auto' },
      margins: { top: 60, bottom: 60, left: 30, right: 30 }, verticalAlign: D.VerticalAlign.CENTER, borders: gridBorders }))) });
    const rows = [head];
    RSPH.DAYS.forEach((day, di) => {
      const date = addDays(ws, di);
      if (date < from || date > to) return;
      const blocks = TT.dayBlocks(gtt, day, date).slice().sort((a, b) => a.i - b.i);
      if (!blocks.length && !(gtt.days[day] || []).length) return;
      const inTerm = TT.dateInTerm(gtt, date);
      const cells = [new D.TableCell({ children: [
          gp(run(RSPH.DAY_FULL[day], { bold: true, size: 16, color: WINE })),
          gp(run(date.getDate() + ' ' + TT.MONTH_NAMES[date.getMonth()].slice(0, 3), { size: 13, color: MUTE })),
          inTerm ? gp(run('')) : gp(run('Not in term', { size: 11, italics: true, color: MUTE }))],
        width: dx(DAY_W), shading: { fill: 'F5EFF3', type: D.ShadingType.CLEAR, color: 'auto' },
        margins: { top: 60, bottom: 60, left: 80, right: 40 }, borders: gridBorders })];
      let col = 0;
      const list = inTerm ? blocks : [];
      while (col < gtt.slots.length) {
        const b = list.find(x => x.i === col);
        if (b) {
          const w = slotW.slice(col, col + b.n).reduce((a, c) => a + c, 0);
          cells.push(blockCell(b, date, w)); col += b.n;
        } else {
          const lunch = gtt.slots[col].lunch;
          cells.push(new D.TableCell({ children: [gp(run(lunch && di === 0 ? '' : ''))], width: dx(slotW[col]),
            shading: lunch ? { fill: 'EDE6E1', type: D.ShadingType.CLEAR, color: 'auto' } : undefined, borders: gridBorders }));
          col++;
        }
      }
      rows.push(new D.TableRow({ cantSplit: true, children: cells }));
    });
    return new D.Table({ rows, width: dx(PAGE_W), columnWidths: colW, layout: D.TableLayoutType.FIXED });
  }

  const gridKids = [];
  let gw = TT.mondayOfWeek(from), gn = 0;
  while (gw <= to && gn < 60) {
    const a = gw < from ? from : gw, e = addDays(gw, 6) > to ? to : addDays(gw, 6);
    gridKids.push(new D.Paragraph({ pageBreakBefore: gn > 0, spacing: { after: 20 },
      children: [run((RSPH.meta.school ? P(RSPH.meta.school) : 'Ramaiah School of Public Health').toUpperCase(), { bold: true, size: 14, color: CORAL })] }));
    gridKids.push(para(run(P(p.name) + ' — Semester ' + tt.sem, { bold: true, size: 30, color: WINE }), { spacing: { after: 20 } }));
    gridKids.push(para(run('Batch ' + tt.batch + ' · Academic Year ' + tt.ay + ' · ' + P(tt.venue) + ' · Downloaded ' + dmy(new Date()), { size: 15, color: MUTE }), { spacing: { after: 60 } }));
    gridKids.push(para(run('Week of ' + dmy(a) + ' – ' + dmy(e), { bold: true, size: 22, color: WINE }), { spacing: { after: 80 } }));
    gridKids.push(weekTable(gw));
    gw = addDays(gw, 7); gn++;
  }
  // legend under the first week's heading, once the kinds in use are known
  const legend = new D.Paragraph({ spacing: { after: 80 }, children: usedKinds.filter(k => RSPH.kinds[k]).map(k =>
    run('  ' + RSPH.kinds[k].label + '  ', { size: 14, bold: true, color: hex(RSPH.kinds[k].color),
      shading: { type: D.ShadingType.CLEAR, fill: hex(RSPH.kinds[k].bg), color: 'auto' } })).reduce((a, r) => a.concat([r, run('   ')]), []) });
  gridKids.splice(3, 0, legend);

  const children = [
    para(run((RSPH.meta.school ? P(RSPH.meta.school) : 'Ramaiah School of Public Health').toUpperCase(),
      { bold: true, size: 16, color: CORAL }), { pageBreakBefore: true }),
    para(run(P(p.name) + ' — Semester ' + tt.sem, { bold: true, size: 34, color: WINE }), { spacing: { after: 60 } }),
    para(run('Course-wise teaching schedule · ' + dmy(from) + ' to ' + dmy(to), { size: 24, color: WINE })),
    para(run('Batch ' + tt.batch + ' · Academic Year ' + tt.ay + ' · ' + P(tt.venue) +
             ' · Downloaded ' + dmy(new Date()), { size: 18, color: MUTE }), { spacing: { after: 240 } })
  ];

  codes.forEach((code, ci) => {
    const c = TT.course(tt.prog, code) || { title: code };
    const rows = courseSessions(tt, code, from, to);
    const k = RSPH.kinds.lecture;
    const planStart = TT.planStartOf(tt, code);

    children.push(new D.Paragraph({
      children: [run(code + '  ', { bold: true, size: 26, color: CORAL }), run(P(c.title), { bold: true, size: 28, color: WINE })],
      spacing: { before: ci ? 360 : 120, after: 60 },
      pageBreakBefore: ci > 0 && !!opts.pagePerCourse,
      border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: WINE, space: 4 } },
      keepNext: true
    }));
    children.push(para(run([
      c.credits != null ? c.credits + ' credits' : null,
      c.faculty ? 'Faculty: ' + P(c.faculty) : null,
      'Plan starts ' + dmy(planStart),
      (function () { const sc = TT.moduleSchedule(tt, code);
        return sc.endBy ? 'Finishes by ' + dmy(sc.endBy) + (sc.scale < 1 ? ' (units compressed to ' + Math.round(sc.scale * 100) + '% of specified hours)' : '') : null; })(),
      rows.length + ' session' + (rows.length === 1 ? '' : 's') + ' in this period'
    ].filter(Boolean).join(' · '), { size: 18, color: MUTE }), { spacing: { after: 120 } }));

    if (!rows.length) {
      children.push(para(run('No sessions of this course fall in the selected dates.', { italics: true, color: MUTE })));
      return;
    }

    const head = ['Date', 'Day', 'Time', 'Unit', 'Topic for the session'];
    const widths = [12, 9, 13, 24, 42];
    const tableRows = [new D.TableRow({ tableHeader: true, children: head.map((h, i) =>
      cell(h, { fill: WINE, width: widths[i], run: { bold: true, color: 'FFFFFF' }, borders: allBorders })) })];
    rows.forEach((r, j) => {
      const kk = RSPH.kinds[r.b.k] || k;
      const before = !r.m && r.date < planStart;
      const unit = r.m ? P(TT.modLabel(r.m)) : r.b.k === 'field' ? P(r.b.t) : '—';
      const topic = r.m ? P(TT.topicText(r.m, '; ')) :
        r.b.k === 'field' ? 'Field posting / visit' :
        before ? 'Before the teaching plan starts (' + dmy(planStart) + ')' : 'Revision / catch-up (all units covered)';
      const fill = j % 2 ? 'FFFFFF' : 'F7F3F8';
      tableRows.push(new D.TableRow({ cantSplit: true, children: [
        cell(dmy(r.date), { fill, width: widths[0], run: { bold: true, color: WINE }, borders: allBorders }),
        cell(RSPH.DAY_FULL[r.day], { fill, width: widths[1], borders: allBorders }),
        cell(r.time + (r.b.f && r.b.f !== c.faculty ? '\n' + P(r.b.f) : ''), { fill, width: widths[2], borders: allBorders, subRun: { size: 16, color: MUTE } }),
        cell(unit, { fill: hex(kk.bg), width: widths[3], run: { bold: true, color: hex(kk.color) },
                     borders: Object.assign({}, allBorders, { left: { style: D.BorderStyle.SINGLE, size: 18, color: hex(kk.color) } }) }),
        cell(topic, { fill, width: widths[4], borders: allBorders, run: r.m ? {} : { italics: true, color: MUTE } })
      ] }));
    });
    children.push(new D.Table({ rows: tableRows, width: { size: 100, type: D.WidthType.PERCENTAGE } }));

    // what each unit taught in this period is for
    const seen = [];
    rows.forEach(r => { if (r.m && seen.indexOf(r.m.moduleIndex) < 0) seen.push(r.m.moduleIndex); });
    const mods = TT.courseModules(tt.prog, code);
    if (seen.length) {
      children.push(para(run('Units taught in this period', { bold: true, size: 22, color: WINE }), { spacing: { before: 200, after: 80 }, keepNext: true }));
      seen.forEach(mi => {
        const m = mods[mi];
        children.push(para([run(P(m.title), { bold: true, color: CORAL }), run('  (' + m.hours + ' h)', { size: 18, color: MUTE })],
                           { spacing: { before: 80, after: 40 }, keepNext: true }));
        (m.objectives || []).forEach(o => children.push(new D.Paragraph({
          children: [run(P(o.text || o), { size: 18 }), o.co ? run('  ' + o.co, { size: 16, bold: true, color: WINE }) : run('')],
          bullet: { level: 0 }, spacing: { after: 20 } })));
        if (m.guide && m.guide.methods) children.push(para([run('Teaching methods: ', { bold: true, size: 18 }), run(P(m.guide.methods), { size: 18 })],
                                                           { spacing: { before: 40, after: 60 } }));
      });
    }
  });

  children.push(para(run('Units, topics and hours follow the approved Course Specifications; topics are laid in order across each course’s weekly timetable slots. ' +
                         'Generated by the RSPH Smart Timetable.', { size: 16, italics: true, color: MUTE }), { spacing: { before: 300 } }));

  const doc = new D.Document({
    creator: 'RSPH Smart Timetable',
    title: P(p.name) + ' Semester ' + tt.sem + ' teaching schedule',
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [{
      properties: { page: { size: { orientation: D.PageOrientation.LANDSCAPE },
                            margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT,
        children: [run(P(p.short) + ' Sem ' + tt.sem + ' · page ', { size: 16, color: MUTE }),
                   new D.TextRun({ children: [D.PageNumber.CURRENT], font: FONT, size: 16, color: MUTE })] })] }) },
      children: gridKids.concat(children)
    }]
  });

  const tag = (opts.codes && opts.codes.length ? '-' + opts.codes.join('-') : '') + '-' + TT.ymd(from) + '-to-' + TT.ymd(to);
  return D.Packer.toBlob(doc).then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'RSPH-' + p.short + '-Sem' + tt.sem + tag + '.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}

global.TT_WORD = { downloadWord };
})(window);
