/* ===========================================================================
   Seed data — the original hand-entered RSPH dataset.
   Loaded into Postgres once, on first boot (see migrate.js). After that, the
   database is the source of truth and the admin panel edits it directly;
   this file is never read again unless the tables are dropped and recreated.
   =========================================================================== */

const meta = {
  school: 'Ramaiah School of Public Health',
  university: 'M. S. Ramaiah University of Applied Sciences',
  version: '2.0',
  notesSite: 'RSPH MPH Course Notes portal',
  notesBase: '../RSPH_MPH_Website/courses/'
};

const programmes = {
  mph: {
    key: 'mph', short: 'MPH', name: 'Master of Public Health', progCode: '097',
    duration: '2 years, full-time', totalCredits: 80, creditSplit: '20 + 20 + 21 + 19',
    totalMarks: 2500, orientation: 'Population &amp; community health', accent: '#381A6B'
  },
  mha: {
    key: 'mha', short: 'MHA', name: 'Master in Hospital Administration', progCode: '098',
    duration: '2 years, full-time', totalCredits: 82, creditSplit: '20 + 20 + 22 + 20',
    totalMarks: 2200, orientation: 'Hospital &amp; healthcare administration', accent: '#9E2A57'
  }
};

const kinds = {
  lecture:   { label: 'Taught course',            color: '#381A6B', bg: '#EFEAF6', teaching: true  },
  elective:  { label: 'Elective',                 color: '#7A2E8F', bg: '#F3E9F7', teaching: true  },
  field:     { label: 'Posting / field',          color: '#0F6E5C', bg: '#E4F2EE', teaching: true  },
  project:   { label: 'Project / dissertation',   color: '#B3541E', bg: '#FBEDE2', teaching: true  },
  academic:  { label: 'Academic activity',        color: '#C0383A', bg: '#FBEAE7', teaching: true  },
  mentoring: { label: 'Mentoring',                color: '#8A6D1F', bg: '#F7F0DC', teaching: false },
  selfstudy: { label: 'Self-directed / library',  color: '#5A6472', bg: '#EEF1F4', teaching: false },
  remedial:  { label: 'Remedial / support',       color: '#4A7A96', bg: '#E7F0F5', teaching: false },
  optional:  { label: 'Optional / if planned',    color: '#7A6C7D', bg: '#F1EDF1', teaching: false },
  lunch:     { label: 'Lunch break',              color: '#9A8F9C', bg: '#F5F0EC', teaching: false }
};

const courses = [
  { prog:'mph', sem:1, code:'PHC501A', title:'Principles and Practice of Public Health', credits:3, type:'core', notes:'phc501a.html' },
  { prog:'mph', sem:1, code:'PHC502A', title:'Public Health Systems &amp; Health Policy', credits:4, type:'core', notes:'phc502a.html' },
  { prog:'mph', sem:1, code:'PHC503A', title:'Epidemiology', credits:3, type:'core', notes:'phc503a.html' },
  { prog:'mph', sem:1, code:'PHC504B', title:'Healthcare Management and Leadership', credits:4, type:'core', notes:'phc504b.html' },
  { prog:'mph', sem:1, code:'PHC505A', title:'Biostatistics', credits:4, type:'core', notes:'phc505a.html' },
  { prog:'mph', sem:1, code:'PHO501A', title:'Open / Generic Elective &ndash; 1 (O/GEC-1)', credits:2, type:'ogec' },

  { prog:'mph', sem:2, code:'PHC506A', title:'Public Health Priorities in India &mdash; I (Communicable Diseases)', credits:4, type:'core', notes:'phc506a.html' },
  { prog:'mph', sem:2, code:'PHC507A', title:'Public Health Priorities in India &mdash; II (NCDs &amp; Nutrition)', credits:4, type:'core', notes:'phc507a.html' },
  { prog:'mph', sem:2, code:'PHC508A', title:'Research Methodology in Public Health', credits:4, type:'core', notes:'phc508a.html' },
  { prog:'mph', sem:2, code:'PHC509A', title:'Health Behaviour and Health Promotion', credits:3, type:'core', notes:'phc509a.html' },
  { prog:'mph', sem:2, code:'PHC510A', title:'Ethics in Public Health', credits:2, type:'core', notes:'phc510a.html' },
  { prog:'mph', sem:2, code:'PHE5XXA', title:'Major Discipline Elective &ndash; 1 (MDEC-1)', credits:3, type:'elective', notes:'phe501a.html' },

  { prog:'mph', sem:3, code:'PHC601A', title:'Global Health', credits:2, type:'core', notes:'phc601a.html' },
  { prog:'mph', sem:3, code:'PHC602A', title:'Technology in Public Health', credits:3, type:'core', notes:'phc602a.html' },
  { prog:'mph', sem:3, code:'PHC603A', title:'Programme Planning and Evaluation', credits:3, type:'core', notes:'phc603a.html' },
  { prog:'mph', sem:3, code:'PHC604A', title:'Demography and Population Sciences', credits:2, type:'core', notes:'phc604a.html' },
  { prog:'mph', sem:3, code:'PHE6XXA', title:'Major Discipline Elective &ndash; 2 (MDEC-2)', credits:3, type:'elective', notes:'phe601a.html' },
  { prog:'mph', sem:3, code:'PHP605A', title:'Project Work', credits:5, type:'experiential' },
  { prog:'mph', sem:3, code:'PHP606A', title:'Dissertation &mdash; Part 1', credits:3, type:'experiential' },

  { prog:'mph', sem:4, code:'PHE6XXB', title:'Major Discipline Elective &ndash; 3 (MDEC-3)', credits:3, type:'elective', notes:'phe602a.html' },
  { prog:'mph', sem:4, code:'PHOXXXA', title:'Open / Generic Elective &ndash; 2 (O/GEC-2)', credits:3, type:'ogec' },
  { prog:'mph', sem:4, code:'PHP607A', title:'Dissertation &mdash; Part 2', credits:7, type:'experiential' },
  { prog:'mph', sem:4, code:'PHI608A', title:'Internship', credits:6, type:'experiential' },

  { prog:'mha', sem:1, code:'HAC501C', title:'Organizational Behavior &amp; Fundamentals of Management in Healthcare', credits:3, type:'core' },
  { prog:'mha', sem:1, code:'HAC502C', title:'Accounting and Financial Management in Healthcare', credits:3, type:'core' },
  { prog:'mha', sem:1, code:'HAC503C', title:'Human Resource Management in Healthcare', credits:2, type:'core' },
  { prog:'mha', sem:1, code:'HAC504C', title:'Epidemiology and Public Health Administration', credits:3, type:'core' },
  { prog:'mha', sem:1, code:'HAC505C', title:'Management of Clinical and Non-Clinical Services', credits:3, type:'core' },
  { prog:'mha', sem:1, code:'HAOXXXA', title:'Open / Generic Elective &ndash; 1 (O/GEC-1)', credits:2, type:'ogec' },
  { prog:'mha', sem:1, code:'HAL507C', title:'Hospital / Practical Training &ndash; 1', credits:4, type:'experiential' },

  { prog:'mha', sem:2, code:'HAC508C', title:'Hospital Planning and Designing', credits:4, type:'core' },
  { prog:'mha', sem:2, code:'HAC509C', title:'Quality Management in Healthcare', credits:3, type:'core' },
  { prog:'mha', sem:2, code:'HAC510C', title:'Healthcare Management and Leadership', credits:3, type:'core' },
  { prog:'mha', sem:2, code:'HAC511C', title:'Biostatistics and Research Methodology', credits:4, type:'core' },
  { prog:'mha', sem:2, code:'HAE5XXA', title:'Major Discipline Elective &ndash; 1 (MDEC-1)', credits:2, type:'elective' },
  { prog:'mha', sem:2, code:'HAL513C', title:'Hospital / Practical Training &ndash; 2', credits:4, type:'experiential' },

  { prog:'mha', sem:3, code:'HAC601C', title:'Legal Aspects and Ethics in Healthcare', credits:3, type:'core' },
  { prog:'mha', sem:3, code:'HAC602C', title:'Healthcare Analytics and Operational Research', credits:3, type:'core' },
  { prog:'mha', sem:3, code:'HAC603C', title:'Marketing and Strategy Management in Healthcare', credits:4, type:'core' },
  { prog:'mha', sem:3, code:'HAE6XXA', title:'Major Discipline Elective &ndash; 2 (MDEC-2)', credits:2, type:'elective' },
  { prog:'mha', sem:3, code:'HAP605C', title:'Project Work', credits:6, type:'experiential' },
  { prog:'mha', sem:3, code:'HAL606C', title:'Hospital / Practical Training &ndash; 3', credits:4, type:'experiential' },

  { prog:'mha', sem:4, code:'HAOXXXB', title:'Open / Generic Elective &ndash; 2 (O/GEC-2)', credits:2, type:'ogec' },
  { prog:'mha', sem:4, code:'HAI608C', title:'Internship', credits:8, type:'experiential' },
  { prog:'mha', sem:4, code:'HAP609C', title:'Dissertation', credits:10, type:'experiential' }
];

const electives = {
  mph: [
    { code:'PHE501A', title:'Qualitative Research Methods' },
    { code:'PHE502A', title:'Environment and Health' },
    { code:'PHE503A', title:'Health Economics' },
    { code:'PHE601A', title:'Implementation Science (Health Programme Design, Planning &amp; Implementation)' },
    { code:'PHE602A', title:'Evidence Synthesis (Systematic Review &amp; Meta-analysis)' },
    { code:'PHE603A', title:'Population Microbiology' }
  ],
  mha: [
    { code:'HAE512A', title:'Project Management' },
    { code:'HAE514A', title:'Patient Safety' },
    { code:'HAE517A', title:'Advanced Bio-statistics in Health Sciences' },
    { code:'HAE518A', title:'Healthcare Costing and Health Financing' },
    { code:'HAE604A', title:'Entrepreneurship in Healthcare' },
    { code:'HAE605A', title:'Technology in Healthcare' },
    { code:'HAE606A', title:'NABH / NMC Training' },
    { code:'HAE607A', title:'Health Informatics' },
    { code:'HAE608A', title:'Health Programme Design, Planning, Implementation' },
    { code:'HAE610A', title:'Evidenced-based Healthcare' }
  ]
};

const SLOTS_MPH = [
  { s:'09:00', e:'10:45', label:'9:00 &ndash; 10:45 am' },
  { s:'10:45', e:'12:00', label:'10:45 &ndash; 12:00 pm' },
  { s:'12:00', e:'13:15', label:'12:00 &ndash; 1:15 pm' },
  { s:'13:15', e:'14:00', label:'1:15 &ndash; 2:00 pm', lunch:true },
  { s:'14:00', e:'15:30', label:'2:00 &ndash; 3:30 pm' },
  { s:'15:30', e:'16:30', label:'3:30 &ndash; 4:30 pm' },
  { s:'16:30', e:'17:30', label:'4:30 &ndash; 5:30 pm' }
];

const SLOTS_MHA = [
  { s:'09:00', e:'10:00', label:'9:00 &ndash; 10:00 am' },
  { s:'10:00', e:'11:00', label:'10:00 &ndash; 11:00 am' },
  { s:'11:00', e:'12:00', label:'11:00 am &ndash; 12 noon' },
  { s:'12:00', e:'13:00', label:'12 noon &ndash; 1:00 pm' },
  { s:'13:00', e:'14:00', label:'1:00 &ndash; 2:00 pm', lunch:true },
  { s:'14:00', e:'15:00', label:'2:00 &ndash; 3:00 pm' },
  { s:'15:00', e:'16:00', label:'3:00 &ndash; 4:00 pm' },
  { s:'16:00', e:'17:00', label:'4:00 &ndash; 5:00 pm' }
];

const timetables = [
  {
    id: 'mph-1', prog: 'mph', sem: 1,
    batch: '2026', ay: '2026-27',
    faculty: 'Faculty of Life and Allied Health Sciences',
    venue: 'Classroom 1 / available classroom',
    start: null, end: null,
    source: 'Timetables MPH.docx &middot; School of Public Health',
    flags: [
      'Start Date and End Date are blank in the source document.',
      'The Saturday afternoon block is spelt &ldquo;Brainstroming&rdquo; in the source; shown here corrected.'
    ],
    slots: SLOTS_MPH,
    days: {
      Mon: [
        { i:0, n:3, t:'Postings / Field Visit', k:'field' },
        { i:4, n:1, t:'Principles and Practice of Public Health', c:'PHC501A', k:'lecture' },
        { i:5, n:1, t:'Healthcare Management and Leadership', c:'PHC504B', k:'lecture' },
        { i:6, n:1, t:'Epidemiology', c:'PHC503A', k:'lecture' }
      ],
      Tue: [
        { i:0, n:3, t:'Postings / Field Visit', k:'field' },
        { i:4, n:1, t:'Public Health Systems and Health Policy', c:'PHC502A', k:'lecture' },
        { i:5, n:2, t:'Biostatistics', c:'PHC505A', k:'lecture' }
      ],
      Wed: [
        { i:0, n:3, t:'Postings / Field Visit', k:'field' },
        { i:4, n:1, t:'Epidemiology', c:'PHC503A', k:'lecture' },
        { i:5, n:1, t:'Remedial Classes', k:'remedial' },
        { i:6, n:1, t:'Biostatistics', c:'PHC505A', k:'lecture' }
      ],
      Thu: [
        { i:0, n:1, t:'Biostatistics', c:'PHC505A', k:'lecture' },
        { i:1, n:1, t:'Journal Club', k:'academic' },
        { i:2, n:1, t:'Guest Lecture', k:'academic' },
        { i:4, n:1, t:'Seminar / Article Discussion', k:'academic' },
        { i:5, n:1, t:'Journal Club', k:'academic' },
        { i:6, n:1, t:'Public Health Systems and Health Policy', c:'PHC502A', k:'lecture' }
      ],
      Fri: [
        { i:0, n:1, t:'Healthcare Management and Leadership', c:'PHC504B', k:'lecture' },
        { i:1, n:1, t:'Biostatistics', c:'PHC505A', k:'lecture' },
        { i:2, n:1, t:'Mentor&ndash;Mentee Meeting', k:'mentoring' },
        { i:4, n:1, t:'Seminar / Article Discussion', k:'academic' },
        { i:5, n:1, t:'Public Health Lecture Series', k:'academic' },
        { i:6, n:1, t:'Principles and Practice of Public Health', c:'PHC501A', k:'lecture' }
      ],
      Sat: [
        { i:0, n:1, t:'Epidemiology', c:'PHC503A', k:'lecture' },
        { i:1, n:1, t:'Public Health Systems and Health Policy', c:'PHC502A', k:'lecture' },
        { i:2, n:1, t:'O/GEC-1', c:'PHO501A', k:'elective' },
        { i:4, n:3, t:'Brainstorming Session', k:'academic' }
      ],
      Sun: [
        { i:0, n:4, t:'Health Camp <em>(if planned by hospital)</em>', k:'optional' }
      ]
    }
  },
  {
    id: 'mph-3', prog: 'mph', sem: 3,
    batch: '2025', ay: '2026',
    faculty: 'School of Public Health',
    venue: 'Classroom 1 / available classroom',
    start: '2026-09-23', end: null,
    source: 'Timetables MPH.docx &middot; School of Public Health',
    flags: [
      'In the source table the &ldquo;Start Date&rdquo; label cell has been typed over with <strong>23rd Sep 2026</strong>, while the value cell still holds a stale <strong>15th September 2025</strong>. 23 Sep 2026 is used here as the start date &mdash; please confirm.',
      'End Date is blank in the source document.',
      'Wednesday morning reads only &ldquo;MDEC&rdquo;; mapped to MDEC-2 (PHE6XXA), the Semester-3 elective in the approved scheme.',
      'Thursday and Friday mornings read &ldquo;Demography&rdquo; / &ldquo;Global Health&rdquo; above &ldquo;Postings/Field Visit&rdquo; &mdash; read here as a field visit attached to that course.'
    ],
    slots: SLOTS_MPH,
    days: {
      Mon: [
        { i:0, n:1, t:'Technology in Public Health', c:'PHC602A', k:'lecture' },
        { i:1, n:1, t:'Journal Club', k:'academic' },
        { i:2, n:1, t:'Group Activity', k:'academic' },
        { i:4, n:1, t:'Journal Club', k:'academic' },
        { i:5, n:1, t:'Seminar / Article Discussion', k:'academic' },
        { i:6, n:1, t:'Demography and Population Sciences', c:'PHC604A', k:'lecture' }
      ],
      Tue: [
        { i:0, n:1, t:'Programme Planning and Evaluation', c:'PHC603A', k:'lecture' },
        { i:1, n:2, t:'Group Activity / Hands-on / Tutorial', k:'academic' },
        { i:4, n:1, t:'Seminar / Article Discussion', k:'academic' },
        { i:5, n:2, t:'Global Health', c:'PHC601A', k:'lecture' }
      ],
      Wed: [
        { i:0, n:1, t:'MDEC-2', c:'PHE6XXA', k:'elective' },
        { i:1, n:1, t:'Seminar / Article Discussion', k:'academic' },
        { i:2, n:1, t:'Journal Club', k:'academic' },
        { i:4, n:3, t:'Dissertation / Mentor&ndash;Mentee Meeting', c:'PHP606A', k:'project' }
      ],
      Thu: [
        { i:0, n:3, t:'Demography &mdash; Postings / Field Visit', c:'PHC604A', k:'field' },
        { i:4, n:1, t:'Project Work', c:'PHP605A', k:'project' },
        { i:5, n:1, t:'Remedial Classes', k:'remedial' },
        { i:6, n:1, t:'Technology in Public Health', c:'PHC602A', k:'lecture' }
      ],
      Fri: [
        { i:0, n:3, t:'Global Health &mdash; Postings / Field Visit', c:'PHC601A', k:'field' },
        { i:4, n:1, t:'Programme Planning and Evaluation', c:'PHC603A', k:'lecture' },
        { i:5, n:1, t:'Public Health Lecture Series', k:'academic' },
        { i:6, n:1, t:'Demography and Population Sciences', c:'PHC604A', k:'lecture' }
      ],
      Sat: [
        { i:0, n:3, t:'Postings / Field Visit', k:'field' },
        { i:4, n:3, t:'Brainstorming Session', k:'academic' }
      ],
      Sun: [
        { i:0, n:3, t:'Health Camp <em>(if planned by hospital)</em>', k:'optional' }
      ]
    }
  },
  {
    id: 'mha-3', prog: 'mha', sem: 3,
    batch: '2025-2027', ay: '2026-2027',
    faculty: 'School of Public Health',
    venue: 'Classroom 1',
    start: '2026-09-02', end: '2027-01-25',
    source: 'Semester Time Table: M.H.A &middot; signed by the Dean, School of Public Health, 3 Sep 2026',
    flags: [
      'Thursday afternoon reads &ldquo;Hospital Training (MH-RMCH)&rdquo; where every other day reads &ldquo;RMH-RMCH&rdquo; &mdash; treated here as the same posting.'
    ],
    slots: SLOTS_MHA,
    days: {
      Mon: [
        { i:0, n:4, t:'Legal Aspects and Ethics in Healthcare', c:'HAC601C', f:'Dr. Deepthi', k:'lecture' },
        { i:5, n:3, t:'Hospital Training (RMH&ndash;RMCH)', c:'HAL606C', k:'field', v:'RMH / RMCH' }
      ],
      Tue: [
        { i:0, n:3, t:'Healthcare Analytics and Operational Research', c:'HAC602C', f:'Dr. V. V. Subba Rao Adhikari', k:'lecture' },
        { i:3, n:1, t:'SDL', k:'selfstudy' },
        { i:5, n:3, t:'Hospital Training (RMH&ndash;RMCH)', c:'HAL606C', k:'field', v:'RMH / RMCH' }
      ],
      Wed: [
        { i:0, n:2, t:'Marketing and Strategic Management in Healthcare', c:'HAC603C', f:'Dr. Mrinalini', k:'lecture' },
        { i:2, n:2, t:'MDEC-2', c:'HAE6XXA', f:'Faculty of School of Public Health', k:'elective' },
        { i:5, n:3, t:'Hospital Training (RMH&ndash;RMCH)', c:'HAL606C', k:'field', v:'RMH / RMCH' }
      ],
      Thu: [
        { i:0, n:4, t:'Group Project', c:'HAP605C', f:'Faculty of School of Public Health and Community Medicine', k:'project' },
        { i:5, n:3, t:'Hospital Training (RMH&ndash;RMCH)', c:'HAL606C', k:'field', v:'RMH / RMCH' }
      ],
      Fri: [
        { i:0, n:2, t:'Marketing and Strategic Management in Healthcare', c:'HAC603C', f:'Dr. Mrinalini', k:'lecture' },
        { i:2, n:2, t:'SDL / Journal Club', f:'Faculty of School of Public Health', k:'academic' },
        { i:5, n:3, t:'Hospital Training (RMH&ndash;RMCH)', c:'HAL606C', k:'field', v:'RMH / RMCH' }
      ],
      Sat: [
        { i:0, n:2, t:'Group Project', c:'HAP605C', f:'Faculty of School of Public Health and Community Medicine', k:'project' },
        { i:2, n:2, t:'Library', k:'selfstudy', v:'Library' },
        { i:5, n:1, t:'Mentor&ndash;Mentee Meeting', k:'mentoring' },
        { i:6, n:2, t:'SDL / Journal Club', f:'Faculty of School of Public Health', k:'academic' }
      ]
    }
  }
];

module.exports = { meta, programmes, kinds, courses, electives, timetables };
