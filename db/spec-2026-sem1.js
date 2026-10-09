/* ===========================================================================
   MPH Semester 1 — Course Specifications, Batch 2026 (revised 2026)
   ---------------------------------------------------------------------------
   Source: "MPH Course Specifications 2026 Final.docx". Each course is five
   units with the hours the specification gives. Every unit is broken into
   lecture-sized topics whose hours add up to the unit's hours, so the
   timetable can say which topic is taught on which date.

   Practical / tutorial hours are folded into the units only where the
   timetable gives the course room for them:
     - Biostatistics: the spec's 30 h weekly R / jamovi lab, shared across
       the units it mirrors (5 h/week on the grid covers 45 + 30 h).
     - Healthcare Management & Leadership: the 15 tutorial hours as case
       work alongside each unit (1.75 h/week covers 15 + 15 h).
   Epidemiology's 30 practical hours are listed as each unit's exercise, but
   they don't use up its single weekly lecture slot.

   db/migrate.js applies this once (flag: site_settings.spec2026_sem1) —
   replacing the old Sem 1 module plans and updating credits, aim and
   outcomes — so later edits in the admin panel are never overwritten.
   =========================================================================== */

const T = (text, hours, priority) => ({ text, hours, priority: priority || 'must' });
const O = (text, bloom, co) => ({ text, bloom, co });

const courses = {
  PHC501A: {
    credits: 4,
    aim: 'This course aims to provide students with broad perspectives of public health principles, concepts, and functions. Specifically, the students will be trained in the concepts of prevention, disease control measures, and health determinants. They will be trained to appraise the resources required to practice and develop public health interventions and learn to apply the measures of health and assess healthcare needs in a community.',
    outcomes: [
      'Explain the need for and importance of public health',
      'Explain the core functions of public health',
      'Discuss the concepts of health, illness, and disease',
      'Discuss the concepts of prevention and control measures in public health',
      'Analyze the resources required to practice and develop interventions in the field of public health keeping ethical aspects involved in the practice',
      'Apply measures of health and assess healthcare needs in a community'
    ]
  },
  PHC502A: {
    credits: 4,
    aim: 'The aim of this course is to provide students with basic understanding of a health system with respect to its evolution, levels, functions, types and building blocks as well as introduce them to the structure and functions of the Indian health systems. The students will also appraise the role of healthcare institutions in improving community health. They will critically analyze the role of international public health organizations in guiding and improving health at the population level. The course also intends to sensitize the students to health policy and its implications on health services delivery and health outcomes. Specifically, this course will orient students to the basics of public health policy formulation, planning, review and its impact on societies. It enables students to critically analyze the existing health policies and work towards generating ideas to formulate effective policies.',
    outcomes: [
      'Explain health systems and the public health system in India',
      'Discuss healthcare institutions, national programmes and international health organizations',
      'Analyze the performance of health systems and generate ideas to strengthen public health systems',
      'Explain the development, implementation and analysis of public health policies'
    ]
  },
  PHC503A: {
    credits: 4,
    aim: 'The aim of the course is to introduce students to the principles and concepts of epidemiology, to train them in the epidemiology of major communicable and non-communicable diseases, and to enable students to apply tools, techniques, and study designs to identify and address public health problems.',
    outcomes: [
      'Explain the principles and concepts of epidemiology',
      'Describe the epidemiology of major communicable and non-communicable diseases',
      'Discuss the types of epidemiological designs',
      'Choose appropriate tools and techniques of epidemiology for identifying and addressing public health problems',
      'Design an epidemiological study for a given scenario',
      'Develop a plan for investigation and prevention of a communicable and non-communicable disease'
    ]
  },
  PHC504B: {
    credits: 2,
    aim: 'This course aims to give basic understanding of management concepts, its principles, and functions relevant to the health sector and introduce the students to leadership traits generally demonstrated by leaders in healthcare. Specifically, students will be trained to understand the concepts of planning, organizing, staffing, directing, coordinating, reporting and budgeting (POSDCORB) in managing services delivery through health programmes and projects. In addition, they will be sensitized with the concept of leadership, need for leadership in public health and role of a leader in the health sector.',
    outcomes: [
      'Discuss the dynamics of health care organizations: processes, functions, culture, climate and organizational behaviour as a whole',
      'Recognise the emerging issues and challenges of leading teams and healthcare organizations in the contemporary context',
      'Explain important management functions such as planning and organizing relevant to health organizations and programmes',
      'Apply management concepts and demonstrate leadership skills to manage health programmes',
      'Identify personal leadership styles and evaluate individual competencies and gaps'
    ]
  },
  PHC505A: {
    credits: 4,
    aim: 'The aim of the course is to enable students to apply statistical concepts and techniques in public health. They will be trained to use appropriate statistical tests in undertaking a research project in the area of public health. Specifically, students will be taught to estimate sample size, adopt the right sampling technique, construct a scale, examine its reliability and validity, understand data types and conduct analysis of numeric data using univariate, bivariate and multivariate techniques and draw inferences. Students will also learn the assumptions and limitations of common statistical tests, choose the appropriate test for analysis, and use statistical software (R / jamovi) for data management and analysis.',
    outcomes: [
      'Explain concepts of descriptive and inferential statistics, probability, random variation, and commonly used probability distributions',
      'Apply concepts and methods from biostatistics and epidemiology jointly',
      'Apply and interpret common univariate, bivariate and multivariate statistical analyses for inferences',
      'Apply the assumptions and limitations of common statistical tests and choose appropriate tests for analysis',
      'Use appropriate statistical packages for data analysis and management'
    ]
  }
};

const units = {
  /* ------------------------------------------------------------------ */
  PHC501A: [
    { title: 'Unit 1: Foundations of public health', hours: 8,
      objectives: [
        O('Define health and public health and explain the scope and unique features of public health', 'Understand', 'CO-1'),
        O('Trace the history and development of public health globally and in India', 'Understand', 'CO-1'),
        O('Map the Ten Essential Public Health Services (2020) onto the core functions of public health', 'Apply', 'CO-2'),
        O('Explain how the National Health Policy 2017 and Ayushman Bharat shape public health practice in India today', 'Understand', 'CO-1')
      ],
      topics: [
        T('Definitions of health and public health; scope and unique features of public health', 2),
        T('History and development of public health globally', 1.5),
        T('Development of public health in India: Bhore Committee to the National Health Mission', 1.5),
        T('Ten Essential Public Health Services (2020 revision) and the core functions', 1.5),
        T('National Health Policy 2017 and Ayushman Bharat: the current Indian context', 1.5)
      ],
      guide: {
        methods: 'Interactive lecture; group discussion on "what makes it public health?"; short video on the 10 EPHS',
        notesFocus: 'Set the population lens early: public health acts on groups and systems, not individual patients. Use the 10 EPHS (2020 wheel, with equity at its centre) as the organising frame for the whole course, then ground it in India through NHP 2017 and Ayushman Bharat.',
        pptOutline: ['What is health? What is public health?', 'Scope and unique features of public health', 'Milestones: global and Indian history', 'The 10 Essential Public Health Services (2020)', 'Core functions: assessment, policy development, assurance', 'NHP 2017 goals and Ayushman Bharat pillars'],
        videoIdea: 'CDC / de Beaumont Foundation explainer on the revised 10 Essential Public Health Services (2020).',
        readingIdea: 'National Health Policy 2017 (MoHFW), sections 1 to 3; Oxford Textbook of Public Health, chapter 1.',
        exercise: 'In groups, take one current Indian health story from the news and classify each action in it against the 10 EPHS.'
      } },
    { title: 'Unit 2: Health, disease and determinants', hours: 8,
      objectives: [
        O('Discuss the concepts of health, illness and disease and the spectrum of health', 'Understand', 'CO-3'),
        O('Explain the iceberg phenomenon and the natural history of disease with levels of intervention', 'Understand', 'CO-3'),
        O('Analyse the social, commercial and ecological determinants of a given health problem', 'Analyse', 'CO-3'),
        O('Explain One Health and planetary health and their relevance to India', 'Understand', 'CO-3')
      ],
      topics: [
        T('Concepts of health, illness and disease; dimensions of health', 1.5),
        T('Spectrum of health and the iceberg phenomenon of disease', 1.5),
        T('Natural history of disease and levels of intervention', 1.5),
        T('Social determinants of health: the WHO CSDH framework', 1.5),
        T('Commercial and ecological determinants of health', 1),
        T('One Health and planetary health', 1, 'desirable')
      ],
      guide: {
        methods: 'Lecture with case examples (TB, diabetes); determinants-mapping group work; guest lecture on One Health',
        notesFocus: 'Move from the individual (illness vs disease) to the population (iceberg, natural history) to the causes of the causes (determinants). Use one disease such as TB throughout so students see every concept applied to the same problem.',
        pptOutline: ['Health, illness, disease: three different things', 'Spectrum of health and the iceberg', 'Natural history of disease and the Leavell & Clark levels', 'CSDH framework: structural and intermediary determinants', 'Commercial and ecological determinants', 'One Health and planetary health'],
        videoIdea: 'WHO Commission on Social Determinants of Health: "Closing the gap in a generation" summary video.',
        readingIdea: 'Marmot M. Social determinants of health inequalities. Lancet 2005; Kickbusch on commercial determinants (Lancet Global Health 2016).',
        exercise: 'Draw a determinants map (structural to proximal) for TB or childhood stunting in a Bengaluru ward.'
      } },
    { title: 'Unit 3: Measuring population health', hours: 10,
      objectives: [
        O('Select and calculate appropriate health indicators for a community', 'Apply', 'CO-6'),
        O('Explain health needs assessment and health impact assessment and their steps', 'Understand', 'CO-6'),
        O('Interpret summary measures (DALY, QALY, HALE) and Global Burden of Disease estimates for India', 'Apply', 'CO-6'),
        O('Identify the right Indian data source (NFHS, SRS, HMIS, Census) for a given indicator', 'Apply', 'CO-6')
      ],
      topics: [
        T('Health indicators: mortality, morbidity, disability, service and composite indicators', 2),
        T('Health needs assessment and health impact assessment', 2),
        T('Economic dimensions of health impact', 1, 'desirable'),
        T('Summary measures of population health: DALY, QALY, HALE', 2),
        T('Global Burden of Disease and the India State-Level Disease Burden Initiative', 1.5),
        T('Indian data sources: NFHS, SRS, HMIS and Census', 1.5)
      ],
      guide: {
        methods: 'Numeracy session (indicator calculations); data-portal demonstration on a computer; group exercise on a needs assessment',
        notesFocus: 'Keep it hands-on: every indicator should be calculated at least once from real numbers. Show the GBD Compare tool and the NFHS-5 fact sheet live so students know where Indian numbers come from.',
        pptOutline: ['Why measure? Indicators and their properties', 'Mortality, morbidity and service indicators', 'Needs assessment vs impact assessment', 'DALY, QALY, HALE: what each adds', 'GBD and India State-Level Disease Burden', 'Indian data sources and their limits'],
        videoIdea: 'IHME "GBD Compare" walkthrough, filtered to India.',
        readingIdea: 'India State-Level Disease Burden Initiative, Lancet 2017; NFHS-5 Karnataka fact sheet.',
        exercise: 'From the NFHS-5 Karnataka fact sheet, compute and compare five indicators for two districts and suggest a priority.'
      } },
    { title: 'Unit 4: Health inequalities and equity', hours: 9,
      objectives: [
        O('Distinguish health inequality, inequity, equity and equality with examples', 'Understand', 'CO-5'),
        O('Measure inequality using PROGRESS-Plus stratifiers and the concentration index', 'Apply', 'CO-6'),
        O('Evaluate strategies and UHC mechanisms that reduce inequalities and give financial protection', 'Evaluate', 'CO-5')
      ],
      topics: [
        T('Health inequalities, inequity, equity and equality', 2),
        T('Strategies to reduce health inequalities', 2),
        T('Measuring inequality: PROGRESS-Plus equity stratifiers', 1.5),
        T('Concentration curve and concentration index', 1.5),
        T('Universal Health Coverage and financial protection: catastrophic and impoverishing expenditure', 2)
      ],
      guide: {
        methods: 'Lecture; spreadsheet exercise on the concentration index; group discussion on UHC in India',
        notesFocus: 'Separate "difference" from "unfair difference" before any measurement. Then show how stratifying a single indicator by PROGRESS-Plus reveals gradients, and close with UHC as the policy answer and out-of-pocket spending as its test.',
        pptOutline: ['Inequality vs inequity', 'Equity and equality', 'PROGRESS-Plus stratifiers', 'Concentration curve and index', 'Strategies to reduce inequalities', 'UHC cube and financial protection'],
        videoIdea: 'WHO "What is Universal Health Coverage?" explainer.',
        readingIdea: 'O\'Donnell et al., Analyzing Health Equity Using Household Survey Data (World Bank), chapter on the concentration index.',
        exercise: 'Using NFHS wealth-quintile data, plot a concentration curve for full immunisation and interpret it.'
      } },
    { title: 'Unit 5: Prevention, control and public health resources', hours: 10,
      objectives: [
        O('Apply the levels and modes of prevention to communicable diseases, NCDs and public health hazards', 'Apply', 'CO-4'),
        O('Contrast the population and high-risk strategies of prevention (Rose)', 'Analyse', 'CO-4'),
        O('Analyse the infrastructure, human, financial and information resources needed for a public health intervention', 'Analyse', 'CO-5'),
        O('Use the Indian Public Health Standards 2022 to assess a health facility', 'Apply', 'CO-5')
      ],
      topics: [
        T('Levels and modes of prevention, including primordial prevention', 2),
        T('Prevention of communicable diseases, NCDs and public health hazards', 2),
        T('Population versus high-risk strategy: Rose\'s prevention paradox', 1.5),
        T('Public health resources: infrastructure and human resources', 1.5),
        T('Public health resources: financial and information resources', 1.5),
        T('Indian Public Health Standards (2022 revision)', 1.5)
      ],
      guide: {
        methods: 'Case study presentations; field visit to a PHC / Ayushman Arogya Mandir with an IPHS checklist; brainstorming on innovations',
        notesFocus: 'Link prevention back to the natural history from Unit 2. Rose\'s paradox is the key idea to land. Then turn to resources: a prevention plan is only as good as the people, money, facilities and data behind it, which IPHS 2022 makes concrete.',
        pptOutline: ['Levels of prevention revisited', 'Modes of intervention', 'Rose: sick individuals and sick populations', 'Prevention across CDs, NCDs and hazards', 'Public health resources: four types', 'IPHS 2022: what a facility must have'],
        videoIdea: 'Short lecture on Geoffrey Rose\'s prevention paradox (e.g. BMJ / LSHTM teaching video).',
        readingIdea: 'Rose G. Sick individuals and sick populations. Int J Epidemiol 1985; IPHS 2022 guidelines for PHC.',
        exercise: 'During the field visit, assess a PHC against the IPHS 2022 checklist and present the gaps.'
      } }
  ],

  /* ------------------------------------------------------------------ */
  PHC502A: [
    { title: 'Unit 1: Health systems frameworks', hours: 8,
      objectives: [
        O('Define a health system and describe its goals, functions, types and levels', 'Understand', 'CO-1'),
        O('Apply the WHO building blocks and the van Olmen framework to describe a health system', 'Apply', 'CO-1'),
        O('Explain the WHO Primary Health Care operational framework (Astana 2018)', 'Understand', 'CO-1'),
        O('Assess health system performance in terms of equity, efficiency and resilience', 'Evaluate', 'CO-3')
      ],
      topics: [
        T('Health system definitions, goals, functions and types', 1.5),
        T('WHO building blocks and the van Olmen framework', 2),
        T('Levels of the health system', 1),
        T('WHO Primary Health Care operational framework (Astana 2018)', 1.5),
        T('Health system performance: equity, efficiency and resilience', 2)
      ],
      guide: {
        methods: 'Lecture; framework-mapping group work; video on the Astana declaration',
        notesFocus: 'Give students two lenses (building blocks and van Olmen) and make them use both on the same system. Close with performance so the rest of the course has criteria to judge against.',
        pptOutline: ['What is a health system?', 'WHO six building blocks', 'van Olmen: adding people, values and context', 'Levels of care', 'Astana 2018 PHC framework', 'Equity, efficiency, resilience'],
        videoIdea: 'WHO: "Primary health care: from Alma-Ata to Astana".',
        readingIdea: 'WHO (2007) Everybody\'s Business; van Olmen et al. (2012) Health systems frameworks in their political context.',
        exercise: 'Map Karnataka\'s health system onto the six building blocks and name one weakness in each.'
      } },
    { title: 'Unit 2: The Indian health system', hours: 10,
      objectives: [
        O('Describe the tiers of the public health system and the roles of the Centre, States and AYUSH', 'Understand', 'CO-1'),
        O('Discuss the place of the private, NGO, CSR and informal sectors in Indian health care', 'Understand', 'CO-2'),
        O('Explain comprehensive primary health care through Ayushman Arogya Mandir', 'Understand', 'CO-1'),
        O('Explain how the Clinical Establishments Act and the National Medical Commission regulate care', 'Understand', 'CO-2')
      ],
      topics: [
        T('Public health system tiers: Sub-centre, PHC, CHC, district and tertiary care', 2.5),
        T('AYUSH and the roles of the Centre and the States', 1.5),
        T('Private for-profit and not-for-profit sector, CSR, NGOs and informal providers', 2),
        T('Ayushman Arogya Mandir (formerly HWC) and comprehensive primary health care', 2),
        T('Regulation: Clinical Establishments Act and the National Medical Commission', 2)
      ],
      guide: {
        methods: 'Lecture; field visit to a PHC / Ayushman Arogya Mandir; group discussion on private-sector regulation',
        notesFocus: 'Walk the referral chain from the village to the medical college, with population norms at each tier. Then widen to the private sector, which delivers most outpatient care in India, and how it is (and isn\'t) regulated.',
        pptOutline: ['Constitutional basis: Centre, State, Concurrent', 'Tiers and population norms', 'AYUSH', 'Private, NGO, CSR and informal providers', 'Ayushman Arogya Mandir: 12 service packages', 'Regulation: CEA and NMC'],
        videoIdea: 'MoHFW video on Ayushman Arogya Mandir and comprehensive primary health care.',
        readingIdea: 'Rural Health Statistics (latest edition), MoHFW; NITI Aayog report on the private health sector.',
        exercise: 'Trace a pregnant woman\'s path through the public system in her village\'s block and note every handover.'
      } },
    { title: 'Unit 3: National health programmes and schemes', hours: 9,
      objectives: [
        O('Describe the NHM framework and RMNCH+A strategy', 'Understand', 'CO-2'),
        O('Discuss the national communicable disease, NCD and nutrition programmes and IDSP / IHIP', 'Understand', 'CO-2'),
        O('Explain Ayushman Bharat PM-JAY and the Ayushman Bharat Digital Mission', 'Understand', 'CO-2')
      ],
      topics: [
        T('National Health Mission framework and RMNCH+A', 2),
        T('Communicable disease programmes and surveillance: IDSP and IHIP', 2),
        T('NCD and nutrition programmes: NP-NCD (formerly NPCDCS) and POSHAN Abhiyaan', 2),
        T('Ayushman Bharat PM-JAY', 1.5),
        T('Ayushman Bharat Digital Mission (ABDM)', 1.5)
      ],
      guide: {
        methods: 'Student seminars (one programme each); guest lecture by a programme officer; case discussion',
        notesFocus: 'Use the programme names and structures as they stand today (NP-NCD, IHIP, Ayushman Arogya Mandir). For each programme cover: objective, strategy, key indicator, and one implementation challenge.',
        pptOutline: ['NHM architecture', 'RMNCH+A', 'CD programmes and IDSP / IHIP', 'NP-NCD and nutrition', 'PM-JAY: design and coverage', 'ABDM: ABHA and registries'],
        videoIdea: 'National Health Authority explainer on ABDM and the ABHA health ID.',
        readingIdea: 'NHM Framework for Implementation; latest PM-JAY annual report.',
        exercise: 'Each student presents one national programme in a one-page brief: aim, strategy, indicator, gap.'
      } },
    { title: 'Unit 4: Global actors and comparative health systems', hours: 8,
      objectives: [
        O('Discuss the roles of international health organisations and financing actors', 'Understand', 'CO-2'),
        O('Compare country health systems using one framework (financing, provision, coverage)', 'Analyse', 'CO-3'),
        O('Generate ideas from other countries to strengthen India\'s health system', 'Create', 'CO-3')
      ],
      topics: [
        T('International organisations and their roles: WHO, UNICEF, World Bank, UNFPA', 2.5),
        T('Comparing country health systems with one framework: financing, provision, coverage', 3),
        T('Global health financing actors: Global Fund, Gavi, philanthropic foundations', 2.5)
      ],
      guide: {
        methods: 'Lecture; comparative case study (UK, Thailand, USA, India); group presentations',
        notesFocus: 'Insist on one comparison framework so countries are compared like-for-like. Thailand is the strongest case for India because it reached UHC at a similar income level.',
        pptOutline: ['Who\'s who in global health', 'WHO, UNICEF, World Bank, UNFPA', 'Comparison framework', 'UK, Thailand, USA, India side by side', 'Global Fund, Gavi and foundations', 'Lessons for India'],
        videoIdea: 'The Commonwealth Fund "Mirror, Mirror" health system comparison overview.',
        readingIdea: 'Tangcharoensathien et al., Health systems development in Thailand (Lancet 2018).',
        exercise: 'Groups compare India with one other country on financing, provision and coverage and propose one transferable lesson.'
      } },
    { title: 'Unit 5: Health policy and policy analysis', hours: 10,
      objectives: [
        O('Explain the policy process from agenda setting to implementation and reform', 'Understand', 'CO-4'),
        O('Analyse a health policy using the Walt and Gilson policy triangle and Kingdon\'s multiple streams', 'Analyse', 'CO-4'),
        O('Write a policy brief on a current public health issue', 'Create', 'CO-4')
      ],
      topics: [
        T('The policy process and agenda setting', 2),
        T('Policy implementation and health sector reforms', 1.5),
        T('Evidence-based policy and health policy and systems research (HPSR)', 1.5),
        T('Walt and Gilson policy triangle', 1.5),
        T('Kingdon\'s multiple streams framework', 1.5),
        T('Writing a policy brief (graded assignment)', 2)
      ],
      guide: {
        methods: 'Lecture; policy-analysis case discussion; policy-brief writing workshop with peer review',
        notesFocus: 'Use one Indian policy (e.g. NHP 2017 or the tobacco control law) through every framework so the frameworks feel like tools, not theory. The graded policy brief is the course\'s capstone.',
        pptOutline: ['What is policy?', 'Stages of the policy process', 'Agenda setting and Kingdon\'s streams', 'Walt and Gilson triangle', 'Evidence-informed policy and HPSR', 'Anatomy of a policy brief'],
        videoIdea: 'Alliance for Health Policy and Systems Research: introduction to HPSR.',
        readingIdea: 'Walt G, Gilson L. Reforming the health sector in developing countries: the central role of policy analysis. Health Policy Plan 1994.',
        exercise: 'Write a two-page policy brief on a current Karnataka health issue (graded assignment).'
      } }
  ],

  /* ------------------------------------------------------------------ */
  PHC503A: [
    { title: 'Unit 1: Foundations and measures', hours: 6,
      objectives: [
        O('Explain the scope of epidemiology and its data sources', 'Understand', 'CO-1'),
        O('Calculate measures of disease frequency and association', 'Apply', 'CO-4'),
        O('Calculate and interpret attributable risk and population attributable fraction', 'Apply', 'CO-4'),
        O('Compare populations using direct and indirect standardisation', 'Apply', 'CO-4')
      ],
      topics: [
        T('Scope of epidemiology and data sources', 1),
        T('Measures of frequency: prevalence, incidence and incidence density', 1.5),
        T('Measures of association: risk ratio, odds ratio, risk difference', 1.5),
        T('Attributable risk and population attributable fraction', 1),
        T('Direct and indirect standardisation', 1)
      ],
      guide: {
        methods: 'Lecture with worked numerical problems; spreadsheet practical',
        notesFocus: 'Numbers first: every measure is calculated from a 2x2 table or a person-time example in class.',
        pptOutline: ['What is epidemiology?', 'Data sources', 'Prevalence, incidence, incidence density', 'RR, OR, RD', 'AR and PAF', 'Standardisation'],
        videoIdea: 'CDC "Principles of Epidemiology" lesson 3 (measures of risk).',
        readingIdea: 'Gordis Epidemiology, chapters 3 and 4.',
        exercise: 'Practical: calculate rates and do direct and indirect standardisation in a spreadsheet.'
      } },
    { title: 'Unit 2: Study designs', hours: 8,
      objectives: [
        O('Describe ecological, cross-sectional, case-control, cohort and intervention designs', 'Understand', 'CO-3'),
        O('Choose an appropriate study design for a given research question', 'Evaluate', 'CO-5'),
        O('Appraise a study against the STROBE or CONSORT checklist', 'Evaluate', 'CO-3')
      ],
      topics: [
        T('Overview of study designs; ecological and cross-sectional studies', 1.5),
        T('Case-control studies, including nested case-control', 1.5),
        T('Cohort studies', 1.5),
        T('Intervention designs: randomised controlled trials and quasi-experimental studies', 2),
        T('Reporting guidelines: STROBE and CONSORT', 1.5)
      ],
      guide: {
        methods: 'Lecture; journal club on published Indian studies; design-a-study group exercise',
        notesFocus: 'Teach designs as answers to questions: start each with "what question does this design answer best?" and end with its main weakness.',
        pptOutline: ['The hierarchy of designs', 'Ecological and cross-sectional', 'Case-control and nested case-control', 'Cohort', 'RCTs and quasi-experimental designs', 'STROBE and CONSORT'],
        videoIdea: 'Students 4 Best Evidence: "Study designs" explainer.',
        readingIdea: 'Grimes DA, Schulz KF. An overview of clinical research: the lay of the land. Lancet 2002.',
        exercise: 'Practical: critical appraisal of a published cohort and a case-control study using STROBE.'
      } },
    { title: 'Unit 3: Error, bias and causation', hours: 7,
      objectives: [
        O('Distinguish random error from systematic error and explain validity and reliability', 'Understand', 'CO-1'),
        O('Identify selection bias, information bias and confounding in a study', 'Analyse', 'CO-4'),
        O('Draw a directed acyclic graph to choose confounders for adjustment', 'Apply', 'CO-5'),
        O('Judge causality using the Bradford Hill criteria and counterfactual thinking', 'Evaluate', 'CO-1')
      ],
      topics: [
        T('Random error and precision; validity and reliability', 1.5),
        T('Bias: selection bias and information bias', 1.5),
        T('Confounding and effect modification', 1.5),
        T('Directed acyclic graphs (DAGs) for confounder selection', 1, 'desirable'),
        T('Bradford Hill criteria and counterfactual thinking', 1.5)
      ],
      guide: {
        methods: 'Lecture; DAG-drawing workshop (dagitty.net); case discussion on a famous causal debate',
        notesFocus: 'Separate the three explanations for an association (chance, bias, confounding) before talking about causation. DAGs make confounding concrete.',
        pptOutline: ['Chance, bias, confounding', 'Validity and reliability', 'Selection and information bias', 'Confounding vs effect modification', 'DAGs', 'Bradford Hill and counterfactuals'],
        videoIdea: 'Short DAG tutorial using dagitty.net.',
        readingIdea: 'Hill AB. The environment and disease: association or causation? 1965.',
        exercise: 'Practical: analyse a survey dataset for measures of association, then stratify to check for confounding.'
      } },
    { title: 'Unit 4: Screening', hours: 4,
      objectives: [
        O('Explain the principles of screening and the Wilson-Jungner criteria', 'Understand', 'CO-4'),
        O('Calculate sensitivity, specificity and predictive values and interpret a ROC curve', 'Apply', 'CO-4')
      ],
      topics: [
        T('Principles of screening and the Wilson-Jungner criteria', 1.5),
        T('Sensitivity, specificity and predictive values', 1.5),
        T('ROC curve', 1)
      ],
      guide: {
        methods: 'Lecture with numerical problems; case discussion on a national screening programme',
        notesFocus: 'Use India\'s population-based NCD screening (NP-NCD) as the running example so the criteria and the 2x2 table feel real.',
        pptOutline: ['What screening is (and isn\'t)', 'Wilson-Jungner criteria', 'The 2x2 table', 'Predictive values and prevalence', 'ROC curves'],
        videoIdea: 'Khan Academy: sensitivity, specificity and predictive values.',
        readingIdea: 'Wilson JMG, Jungner G. Principles and practice of screening for disease. WHO 1968 (summary).',
        exercise: 'Given test results at two prevalences, show how PPV changes and discuss what it means for NP-NCD.'
      } },
    { title: 'Unit 5: Applied and field epidemiology', hours: 5,
      objectives: [
        O('Describe the epidemiology of major communicable and non-communicable diseases', 'Understand', 'CO-2'),
        O('Plan the steps of an outbreak investigation', 'Create', 'CO-6'),
        O('Explain surveillance through IDSP and IHIP', 'Understand', 'CO-6')
      ],
      topics: [
        T('Chronic, infectious, nutritional, environmental and psychiatric epidemiology: an overview', 2),
        T('Steps of an outbreak investigation', 1.5),
        T('Surveillance systems: IDSP and IHIP', 1.5)
      ],
      guide: {
        methods: 'Lecture; outbreak simulation with a line list; guest lecture from the district surveillance unit',
        notesFocus: 'End the course in the field: an outbreak investigation ties together measures, designs and bias. Show IHIP\'s live reporting forms.',
        pptOutline: ['Branches of epidemiology', 'Outbreak investigation: ten steps', 'Epidemic curves', 'IDSP structure', 'IHIP digital surveillance'],
        videoIdea: 'CDC "Outbreak investigation" case study video.',
        readingIdea: 'IDSP operational guidelines; CDC Principles of Epidemiology, lesson 6.',
        exercise: 'Practical: outbreak investigation exercise with a line list, epi curve and hypothesis.'
      } }
  ],

  /* ------------------------------------------------------------------ */
  PHC504B: [
    { title: 'Unit 1: Organisation and organisational behaviour', hours: 9,
      objectives: [
        O('Describe organisation structure, behaviour, culture and teams in health care', 'Understand', 'CO-1'),
        O('Explain change management in a health organisation', 'Understand', 'CO-2'),
        O('Apply the basics of health workforce management: recruitment and performance appraisal', 'Apply', 'CO-4')
      ],
      topics: [
        T('Organisation: structure and design', 1.5),
        T('Organisational behaviour and culture', 1.5),
        T('Teams and change management', 1.5),
        T('Health workforce management: recruitment and performance appraisal', 1.5),
        T('Tutorial: map the organogram of a district health office', 1.5),
        T('Tutorial: performance appraisal role-play', 1.5)
      ],
      guide: {
        methods: 'Lecture; organogram tutorial; role-play',
        notesFocus: 'Ground every concept in a real public organisation students can visit, such as the District Health Office.',
        pptOutline: ['What is an organisation?', 'Structures: functional, divisional, matrix', 'Culture and climate', 'Teams', 'Change management (Kotter)', 'Recruitment and appraisal'],
        videoIdea: 'Kotter\'s 8 steps of change in three minutes.',
        readingIdea: 'Robbins SP. Organizational Behavior, chapters on structure and culture.',
        exercise: 'Draw the organogram of the District Health Office and mark reporting lines and spans of control.'
      } },
    { title: 'Unit 2: Management functions', hours: 7,
      objectives: [
        O('Explain planning, organising, staffing, directing and controlling (POSDCORB) in health programmes', 'Understand', 'CO-3'),
        O('Use quality improvement tools (PDSA, fishbone, Pareto) on a service problem', 'Apply', 'CO-4'),
        O('Prepare a simple budget for a health programme activity', 'Apply', 'CO-4')
      ],
      topics: [
        T('Planning and organising in health programmes', 1),
        T('Staffing, directing and controlling', 0.5),
        T('Quality improvement tools: PDSA, fishbone and Pareto', 1),
        T('Basics of budgeting and financial management in health programmes', 0.5),
        T('Tutorial: fishbone and Pareto analysis of a service-delivery problem', 2),
        T('Tutorial: draft a simple programme budget', 2)
      ],
      guide: {
        methods: 'Short lectures; QI tools workshop; budgeting tutorial',
        notesFocus: 'Keep theory short and spend the time on doing: one real service problem taken through fishbone, Pareto and a PDSA cycle.',
        pptOutline: ['POSDCORB', 'Planning and organising', 'Staffing, directing, controlling', 'PDSA, fishbone, Pareto', 'Budget basics'],
        videoIdea: 'IHI Open School: the PDSA cycle.',
        readingIdea: 'NHM Programme Implementation Plan (PIP) guidelines, budget section.',
        exercise: 'Run a fishbone and Pareto analysis on long OPD waiting times and plan one PDSA cycle.'
      } },
    { title: 'Unit 3: Leadership and motivation', hours: 6,
      objectives: [
        O('Explain leadership concepts and theories and motivation theories', 'Understand', 'CO-2'),
        O('Compare transformational and servant leadership and the public health leadership competencies', 'Analyse', 'CO-2'),
        O('Identify one\'s own leadership style and competency gaps', 'Evaluate', 'CO-5')
      ],
      topics: [
        T('Leadership concepts and theories', 1),
        T('Motivation theories', 1),
        T('Transformational and servant leadership; public health leadership competencies', 1),
        T('Tutorial: leadership self-assessment and competency gap analysis', 3)
      ],
      guide: {
        methods: 'Lecture; self-assessment tutorial; reflective writing',
        notesFocus: 'Make it personal: students leave with a leadership self-assessment and a short development plan.',
        pptOutline: ['Leader vs manager', 'Trait, behavioural and contingency theories', 'Maslow, Herzberg, McGregor', 'Transformational and servant leadership', 'Public health leadership competencies'],
        videoIdea: 'Simon Sinek: "How great leaders inspire action" (TED).',
        readingIdea: 'Northouse PG. Leadership: Theory and Practice, chapters on transformational and servant leadership.',
        exercise: 'Complete a validated leadership-style questionnaire and write a one-page development plan.'
      } },
    { title: 'Unit 4: Leadership models and conflict', hours: 4,
      objectives: [
        O('Describe self-leadership, situational leadership and Maxwell\'s five levels', 'Understand', 'CO-2'),
        O('Apply conflict-management strategies and recognise sources of power', 'Apply', 'CO-4')
      ],
      topics: [
        T('Self-leadership, situational leadership and Maxwell\'s five levels', 1),
        T('Conflict management and sources of power', 1),
        T('Tutorial: conflict-resolution case role-play', 2)
      ],
      guide: {
        methods: 'Lecture; role-play using the Thomas-Kilmann modes',
        notesFocus: 'Use a realistic PHC conflict (e.g. between the medical officer and staff) for the role-play.',
        pptOutline: ['Self-leadership', 'Situational leadership (Hersey-Blanchard)', 'Maxwell\'s five levels', 'Thomas-Kilmann conflict modes', 'French and Raven sources of power'],
        videoIdea: 'Thomas-Kilmann conflict modes explained.',
        readingIdea: 'Maxwell JC. The 5 Levels of Leadership (summary).',
        exercise: 'Role-play a staff conflict at a PHC using two different conflict modes and compare the outcomes.'
      } },
    { title: 'Unit 5: Leadership challenges and change', hours: 4,
      objectives: [
        O('Discuss leadership challenges, communication and leading change in public health', 'Understand', 'CO-2'),
        O('Draw lessons on crisis leadership from COVID-19 and NHM case studies', 'Analyse', 'CO-4')
      ],
      topics: [
        T('Leadership challenges, communication and leading change', 0.5),
        T('Crisis leadership: lessons from COVID-19', 0.5),
        T('Tutorial: NHM leadership case studies', 3)
      ],
      guide: {
        methods: 'Case study presentations; guest lecture from a programme manager',
        notesFocus: 'Close with real stories: how district leaders managed COVID-19 and NHM roll-outs.',
        pptOutline: ['Common leadership challenges', 'Communication in a crisis', 'Leading change', 'COVID-19 lessons', 'NHM case studies'],
        videoIdea: 'WHO talk on leadership during COVID-19.',
        readingIdea: 'Case studies of Kerala\'s and Bhilwara\'s COVID-19 response.',
        exercise: 'Groups present one NHM or COVID-19 leadership case and the lesson they take from it.'
      } }
  ],

  /* ------------------------------------------------------------------ */
  PHC505A: [
    { title: 'Unit 1: Introduction and data', hours: 13,
      objectives: [
        O('Explain the scope of statistics in public health and classify data types and scales', 'Understand', 'CO-1'),
        O('Present data in appropriate tables and graphs', 'Apply', 'CO-3'),
        O('Import, clean and recode a dataset in R / jamovi', 'Apply', 'CO-5')
      ],
      topics: [
        T('Scope of statistics in public health', 1),
        T('Data types and measurement scales', 1.5),
        T('Tabulation and graphical presentation of data', 2),
        T('Data preparation: coding, entry and cleaning principles', 1.5),
        T('Data management in R / jamovi: import, cleaning and recoding', 2),
        T('Lab: set up R / jamovi; import, clean and recode a survey dataset', 3),
        T('Lab: tables and graphs in R / jamovi', 2)
      ],
      guide: {
        methods: 'Lecture; computer lab in R / jamovi',
        notesFocus: 'Get every student running R / jamovi in week one; the lab mirrors each lecture topic from here on.',
        pptOutline: ['Why statistics in public health', 'Data types and scales', 'Tables', 'Graphs: which one when', 'Data preparation', 'R / jamovi basics'],
        videoIdea: 'jamovi getting-started tutorial.',
        readingIdea: 'Kirkwood and Sterne, Essential Medical Statistics, chapters 1 to 3.',
        exercise: 'Import an NFHS-style extract, clean it, recode two variables and produce a frequency table and bar chart.'
      } },
    { title: 'Unit 2: Descriptive statistics and probability', hours: 13,
      objectives: [
        O('Calculate and interpret measures of central tendency and dispersion', 'Apply', 'CO-1'),
        O('Apply the basic rules of probability', 'Apply', 'CO-1'),
        O('Describe the normal, binomial and Poisson distributions and when each applies', 'Understand', 'CO-1')
      ],
      topics: [
        T('Measures of central tendency', 1.5),
        T('Measures of dispersion', 1.5),
        T('Probability: rules and conditional probability', 2),
        T('The normal distribution and z-scores', 1.5),
        T('Binomial and Poisson distributions', 1.5),
        T('Lab: descriptive statistics by group', 2.5),
        T('Lab: probability distributions and normality checks', 2.5)
      ],
      guide: {
        methods: 'Lecture with numerical problems; computer lab',
        notesFocus: 'Link each summary measure to the data type it suits, and show skewness visually before introducing the normal curve.',
        pptOutline: ['Mean, median, mode', 'Range, IQR, SD, CV', 'Probability rules', 'The normal curve and z-scores', 'Binomial and Poisson'],
        videoIdea: 'StatQuest: the normal distribution, clearly explained.',
        readingIdea: 'Kirkwood and Sterne, chapters 4 and 5.',
        exercise: 'Summarise BMI by sex and age group and check normality with a histogram and Q-Q plot.'
      } },
    { title: 'Unit 3: Sampling and sample size', hours: 12,
      objectives: [
        O('Describe probability and non-probability sampling methods', 'Understand', 'CO-2'),
        O('Calculate sample size for a proportion, a mean and a two-group comparison, including design effect', 'Apply', 'CO-2'),
        O('Use OpenEpi and G*Power for sample size calculation', 'Apply', 'CO-5')
      ],
      topics: [
        T('Probability sampling methods', 1.5),
        T('Non-probability sampling methods', 1),
        T('Sample size for a proportion and for a mean', 1.5),
        T('Sample size for comparing two groups; design effect', 1.5),
        T('Sample size tools: OpenEpi and G*Power', 1.5),
        T('Lab: draw simple random, stratified and cluster samples', 2),
        T('Lab: sample size calculations in OpenEpi and G*Power', 3)
      ],
      guide: {
        methods: 'Lecture; computer lab; group work on a sampling plan',
        notesFocus: 'Tie sampling to the students\' own dissertation ideas: each one leaves with a defended sample size.',
        pptOutline: ['Population, sample, frame', 'Probability sampling', 'Non-probability sampling', 'Sample size: proportion and mean', 'Two groups and design effect', 'OpenEpi and G*Power'],
        videoIdea: 'OpenEpi sample size walkthrough.',
        readingIdea: 'Lwanga SK, Lemeshow S. Sample size determination in health studies (WHO).',
        exercise: 'Calculate the sample size for a cluster survey of anaemia prevalence with a design effect of 2.'
      } },
    { title: 'Unit 4: Inferential statistics', hours: 20,
      objectives: [
        O('Explain hypothesis testing, p-values, confidence intervals, errors and power', 'Understand', 'CO-1'),
        O('Apply and interpret t-tests, ANOVA, chi-square, Fisher\'s exact and McNemar tests', 'Apply', 'CO-3'),
        O('Apply non-parametric tests when assumptions fail', 'Apply', 'CO-4'),
        O('Choose the appropriate test for a given question and data type', 'Evaluate', 'CO-4')
      ],
      topics: [
        T('Hypothesis testing, p-values and confidence intervals', 2),
        T('Type I and II errors, power and multiple comparisons', 1.5),
        T('t-tests: one-sample, independent and paired', 2),
        T('One-way ANOVA', 1.5),
        T('Chi-square, Fisher\'s exact and McNemar tests', 2),
        T('Non-parametric tests: Mann-Whitney, Wilcoxon, Kruskal-Wallis', 2),
        T('Choosing the right test', 1),
        T('Lab: t-tests and ANOVA', 3),
        T('Lab: chi-square and non-parametric tests', 3),
        T('Lab: choose-the-test exercise', 2)
      ],
      guide: {
        methods: 'Lecture; computer lab; test-selection flowchart exercise',
        notesFocus: 'Report estimates with confidence intervals, not just p-values. Teach a single flowchart for choosing tests and use it every session.',
        pptOutline: ['Logic of hypothesis testing', 'p-values and CIs', 'Errors and power', 't-tests and ANOVA', 'Chi-square family', 'Non-parametric tests', 'Choosing the test'],
        videoIdea: 'StatQuest: p-values, clearly explained.',
        readingIdea: 'Kirkwood and Sterne, chapters 6 to 9 and 17.',
        exercise: 'Given ten research questions with datasets, choose and run the right test and report it in one sentence.'
      } },
    { title: 'Unit 5: Correlation and regression', hours: 17,
      objectives: [
        O('Calculate and interpret correlation coefficients', 'Apply', 'CO-3'),
        O('Fit and interpret linear and logistic regression, including adjusted estimates and diagnostics', 'Apply', 'CO-3'),
        O('Describe Poisson regression and survival analysis (Kaplan-Meier, Cox)', 'Understand', 'CO-2')
      ],
      topics: [
        T('Correlation: Pearson and Spearman', 1.5),
        T('Simple and multiple linear regression', 2),
        T('Logistic regression', 2),
        T('Model diagnostics and interpreting adjusted estimates', 2),
        T('Introduction to Poisson regression', 1, 'desirable'),
        T('Introduction to survival analysis: Kaplan-Meier and Cox regression', 1.5, 'desirable'),
        T('Lab: linear and logistic regression', 3),
        T('Lab: practical examination with data analysis stations', 4)
      ],
      guide: {
        methods: 'Lecture; computer lab; practical examination',
        notesFocus: 'Link regression back to confounding from Epidemiology: an adjusted estimate is a confounder-controlled comparison.',
        pptOutline: ['Correlation', 'Linear regression', 'Multiple regression and adjustment', 'Logistic regression and odds ratios', 'Diagnostics', 'Poisson and survival: a preview'],
        videoIdea: 'StatQuest: logistic regression.',
        readingIdea: 'Kirkwood and Sterne, chapters 10, 11, 19 and 26.',
        exercise: 'Fit a logistic model for hypertension with age, sex and BMI, and interpret the adjusted odds ratios.'
      } }
  ]
};

// flatten to course_modules rows
const modules = [];
Object.keys(units).forEach(code => {
  units[code].forEach((u, i) => {
    modules.push({ prog: 'mph', code, seq: i + 1, title: u.title, hours: u.hours,
                   objectives: u.objectives, topics: u.topics, guide: u.guide });
  });
});

module.exports = { courses, modules };
