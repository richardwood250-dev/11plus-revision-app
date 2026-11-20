// Resource Bank Catalog for 1-on-1 Tutoring
// Covers GCSE, A-Level, and 11+ past papers, specimen exams, and topic worksheets

export const RESOURCE_LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'gcse', label: 'GCSE (14-16)' },
  { id: 'alevel', label: 'A-Level (16-18)' },
  { id: '11plus', label: '11+ / KS2 (9-11)' },
];

export const RESOURCE_SUBJECTS = [
  { id: 'all', label: 'All Subjects' },
  { id: 'maths', label: 'Mathematics 🔢' },
  { id: 'physics', label: 'Physics ⚡' },
  { id: 'chemistry', label: 'Chemistry 🧪' },
  { id: 'biology', label: 'Biology 🧬' },
  { id: 'english', label: 'English 📖' },
];

export const EXAM_BOARDS = [
  { id: 'all', label: 'All Boards' },
  { id: 'edexcel', label: 'Edexcel (Pearson)' },
  { id: 'aqa', label: 'AQA' },
  { id: 'ocr', label: 'OCR' },
  { id: 'gl', label: 'GL Assessment' },
];

export const RESOURCE_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'past_paper', label: 'Exam Papers 📑' },
  { id: 'topic_worksheet', label: 'Topic Worksheets 📝' },
];

export const RESOURCE_BANK = [
  // --- GCSE EXAM PAPERS ---
  {
    id: 'gcse-edexcel-maths-paper1-higher',
    title: 'Edexcel GCSE (9-1) Maths Higher - Paper 1 (Non-Calculator)',
    level: 'gcse',
    subject: 'maths',
    examBoard: 'edexcel',
    tier: 'Higher',
    type: 'past_paper',
    year: 2024,
    series: 'Specimen Paper',
    pageCount: 3,
    pdfUrl: '/assets/resources/gcse-edexcel-maths-paper1-higher.pdf',
    topics: ['Surds & Indices', 'Algebraic Fractions', 'Quadratic Graphs', 'Circle Theorems', 'Trigonometry', 'Probability'],
    description: 'Authentic 9-1 Edexcel format covering surds, algebraic fractions, quadratic sketch & turning points, circle theorem proof, and exact trig values.',
    markSchemeNotes: 
      `### Edexcel GCSE Maths Higher - Paper 1 Mark Scheme\n\n` +
      `**Q1 (Surds & Indices) [3 Marks]**\n` +
      `- (a) sqrt(50) + sqrt(18) = 5*sqrt(2) + 3*sqrt(2) = **8*sqrt(2)** [M1 for simplifying either surd, A1 for final answer]\n` +
      `- (b) 64^(2/3) = (cube_root(64))^2 = 4^2 = **16** [B1]\n\n` +
      `**Q2 (Algebraic Fractions) [3 Marks]**\n` +
      `- 3/(x + 2) + 2/(x - 1) = [3(x - 1) + 2(x + 2)] / [(x + 2)(x - 1)]\n` +
      `- Numerator: 3x - 3 + 2x + 4 = 5x + 1\n` +
      `- Answer: **(5x + 1) / ((x + 2)(x - 1))** [M1 common denominator, M1 expand numerator, A1 final fraction]\n\n` +
      `**Q3 (Quadratic Equations & Sketch) [4 Marks]**\n` +
      `- 2x^2 + 5x - 12 = 0 => (2x - 3)(x + 4) = 0\n` +
      `- Roots: **x = 1.5, x = -4** [M1 factorising, A1 roots]\n` +
      `- Line of symmetry: x = -1.25. y-intercept = (0, -12). Turning point: (-1.25, -15.125) [M1, A1]\n\n` +
      `**Q4 (Circle Theorems) [4 Marks]**\n` +
      `- Angle at centre is twice angle at circumference: 2 * 38° = 76° [M1, A1]\n` +
      `- Opposite angles in a cyclic quadrilateral sum to 180°: 180° - 38° = 142° [M1, A1 with reasons stated]\n\n` +
      `**Q5 (Exact Trigonometry) [4 Marks]**\n` +
      `- sin(60°) = sqrt(3)/2, cos(30°) = sqrt(3)/2. Area = 0.5 * 8 * 10 * sin(60°) = 40 * (sqrt(3)/2) = **20*sqrt(3) cm²** [M1, A1]\n\n` +
      `**Q6 (Conditional Probability) [4 Marks]**\n` +
      `- P(Red then Blue) without replacement = (5/12) * (7/11) = **35/132** [M1 tree branches, A1 probability]`,
  },
  {
    id: 'gcse-aqa-maths-paper2-calc',
    title: 'AQA GCSE Mathematics (8300) - Paper 2 (Calculator)',
    level: 'gcse',
    subject: 'maths',
    examBoard: 'aqa',
    tier: 'Higher',
    type: 'past_paper',
    year: 2023,
    series: 'June Series',
    pageCount: 3,
    pdfUrl: '/assets/resources/gcse-edexcel-maths-paper1-higher.pdf', // fallback to sample
    topics: ['Compound Interest', 'Standard Form', 'Cosine Rule', 'Histograms', 'Iteration'],
    description: 'Calculator paper assessing financial maths, reverse percentages, non-right-angled trigonometry, and numerical iteration formulas.',
    markSchemeNotes:
      `### AQA GCSE Maths Paper 2 - Key Mark Scheme Notes\n\n` +
      `**Compound Interest**: A = P(1 + r/100)^n. Check multiplier method.\n` +
      `**Cosine Rule**: a² = b² + c² - 2bc*cos(A). Watch for degree mode on calculator.\n` +
      `**Histograms**: Frequency Density = Frequency / Class Width. Total area under histogram = total frequency.`,
  },
  {
    id: 'gcse-aqa-physics-paper1',
    title: 'AQA GCSE Physics (8463) - Paper 1: Energy & Electricity',
    level: 'gcse',
    subject: 'physics',
    examBoard: 'aqa',
    tier: 'Higher',
    type: 'past_paper',
    year: 2024,
    series: 'Specimen Paper',
    pageCount: 2,
    pdfUrl: '/assets/resources/gcse-aqa-physics-paper1.pdf',
    topics: ['Energy Stores', 'Specific Heat Capacity', 'Ohm\'s Law', 'National Grid', 'Circuit Electricity'],
    description: 'Comprehensive GCSE Physics paper testing calculations for kinetic energy, potential energy, resistance in series/parallel, and domestic electricity.',
    markSchemeNotes:
      `### AQA GCSE Physics Paper 1 Mark Scheme\n\n` +
      `**Q1 (Kinetic Energy & Efficiency)**:\n` +
      `- E_k = 0.5 * m * v² = 0.5 * 1200 * 20² = 240,000 J (240 kJ) [2 Marks]\n` +
      `- Efficiency = (Useful Energy Output / Total Energy Input) * 100% [1 Mark]\n\n` +
      `**Q2 (Circuit Calculations - Ohm's Law)**:\n` +
      `- V = I * R => R = V / I = 12V / 0.4A = **30 Ohms** [2 Marks]\n` +
      `- In series, total resistance R_total = R1 + R2 = 30 + 15 = 45 Ohms [1 Mark]\n` +
      `- Power = I² * R or V * I = 0.4² * 30 = **4.8 W** [2 Marks]`,
  },

  // --- GCSE TOPIC WORKSHEETS ---
  {
    id: 'gcse-maths-quadratics-worksheet',
    title: 'GCSE Maths: Quadratics, Factoring & The Formula',
    level: 'gcse',
    subject: 'maths',
    examBoard: 'edexcel',
    tier: 'Higher',
    type: 'topic_worksheet',
    year: 2024,
    pageCount: 2,
    pdfUrl: '/assets/resources/gcse-maths-quadratics-worksheet.pdf',
    topics: ['Factorising Quadratics', 'Completing the Square', 'Quadratic Formula', 'Parabola Turning Points'],
    description: 'Intensive drill sheet from grade 5 to grade 9. Covers factorising monic & non-monic quadratics, completing the square for turning points, and discriminant analysis.',
    markSchemeNotes:
      `### GCSE Quadratics Worksheet Answers\n\n` +
      `**Part A: Factorising**\n` +
      `1. x² + 7x + 12 = **(x + 3)(x + 4)**\n` +
      `2. x² - 9x + 20 = **(x - 4)(x - 5)**\n` +
      `3. 2x² + 7x + 3 = **(2x + 1)(x + 3)**\n` +
      `4. 4x² - 25 = **(2x + 5)(2x - 5)** (Difference of Two Squares)\n\n` +
      `**Part B: Completing the Square**\n` +
      `- x² + 6x - 7 = (x + 3)² - 9 - 7 = **(x + 3)² - 16**\n` +
      `- Vertex / Minimum turning point = **(-3, -16)**\n\n` +
      `**Part C: Quadratic Formula**\n` +
      `- 3x² + 8x - 2 = 0 => a=3, b=8, c=-2\n` +
      `- x = (-8 ± sqrt(64 - 4*3*(-2))) / 6 = (-8 ± sqrt(88)) / 6\n` +
      `- x ≈ **0.23** or **-2.90** (2 decimal places)`,
  },
  {
    id: 'gcse-maths-circle-theorems',
    title: 'GCSE Maths: Circle Theorems & Proofs Masterclass',
    level: 'gcse',
    subject: 'maths',
    examBoard: 'edexcel',
    tier: 'Higher',
    type: 'topic_worksheet',
    year: 2024,
    pageCount: 2,
    pdfUrl: '/assets/resources/gcse-maths-quadratics-worksheet.pdf', // fallback
    topics: ['Circle Theorems', 'Angle Subtended by Diameter', 'Alternate Segment Theorem', 'Cyclic Quadrilaterals'],
    description: 'Visual geometry problems requiring formal reason-giving: tangent-radius perpendicularity, alternate segment theorem, and intersecting chords theorem.',
    markSchemeNotes:
      `### Circle Theorems Key Reasons Checklist\n` +
      `- "Angle at centre is twice angle at circumference"\n` +
      `- "Angle in a semicircle is a right angle (90°)"\n` +
      `- "Angles in the same segment are equal"\n` +
      `- "Opposite angles in a cyclic quadrilateral sum to 180°"\n` +
      `- "The tangent to a circle is perpendicular (90°) to the radius at the point of contact"\n` +
      `- "Alternate segment theorem"`,
  },

  // --- A-LEVEL EXAM PAPERS ---
  {
    id: 'alevel-edexcel-pure-maths-paper1',
    title: 'Edexcel A-Level Mathematics - Paper 1: Pure Maths (9MA0/01)',
    level: 'alevel',
    subject: 'maths',
    examBoard: 'edexcel',
    tier: 'Higher',
    type: 'past_paper',
    year: 2024,
    series: 'Specimen Paper',
    pageCount: 3,
    pdfUrl: '/assets/resources/alevel-edexcel-pure-maths-paper1.pdf',
    topics: ['Differentiation', 'Integration by Parts', 'Parametric Equations', 'Vectors', 'Proof by Contradiction'],
    description: 'Full A-Level Pure Mathematics paper with differentiation from first principles, integration by parts, parametric tangents, 3D vectors, and differential equations.',
    markSchemeNotes:
      `### Edexcel A-Level Pure Maths Paper 1 Mark Scheme\n\n` +
      `**Q1 (Binomial Expansion & Approximations) [4 Marks]**\n` +
      `- (1 - 3x)^(-2) for |3x| < 1 => |x| < 1/3\n` +
      `- Expansion: 1 + (-2)(-3x) + [(-2)(-3)/2!](-3x)² = **1 + 6x + 27x² + 108x³** [M1, A1]\n\n` +
      `**Q2 (Integration by Parts) [5 Marks]**\n` +
      `- Evaluate: integral of x * e^(2x) dx\n` +
      `- Let u = x => du/dx = 1; dv/dx = e^(2x) => v = 0.5 * e^(2x)\n` +
      `- uv - integral(v * du) = 0.5 * x * e^(2x) - integral(0.5 * e^(2x) dx)\n` +
      `- Answer: **0.5 * x * e^(2x) - 0.25 * e^(2x) + C** = 0.25 * e^(2x) * (2x - 1) + C [M1, A1]\n\n` +
      `**Q3 (Parametric Equations) [6 Marks]**\n` +
      `- x = 2t + 1, y = t² - 4\n` +
      `- dx/dt = 2, dy/dt = 2t => dy/dx = (2t)/2 = **t** [M1]\n` +
      `- At t = 3, coordinate = (7, 5), gradient m = 3 [A1]\n` +
      `- Equation of tangent: y - 5 = 3(x - 7) => **y = 3x - 16** [M1, A1]\n\n` +
      `**Q4 (Proof by Contradiction) [4 Marks]**\n` +
      `- Prove: "If n² is even, then n is even."\n` +
      `- Assume opposite: n is odd => n = 2k + 1 for integer k.\n` +
      `- n² = (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, which is odd.\n` +
      `- Contradiction to premise that n² is even. Hence n must be even. Q.E.D. [Full reasoning: 4 Marks]`,
  },
  {
    id: 'alevel-ocr-maths-paper2-pure-stats',
    title: 'OCR A-Level Maths A - Paper 2: Pure & Statistics (H240/02)',
    level: 'alevel',
    subject: 'maths',
    examBoard: 'ocr',
    type: 'past_paper',
    year: 2023,
    pageCount: 3,
    pdfUrl: '/assets/resources/alevel-edexcel-pure-maths-paper1.pdf', // fallback
    topics: ['Hypothesis Testing', 'Normal Distribution', 'Binomial Distribution', 'Implicit Differentiation'],
    description: 'Covers implicit differentiation, partial fractions, Large Data Set interpretation, binomial hypothesis testing, and continuous normal distribution.',
    markSchemeNotes:
      `### OCR Pure & Stats Notes\n\n` +
      `**Hypothesis Testing Steps**:\n` +
      `1. State H0 and H1 with parameter defined (e.g. p = 0.4 vs p > 0.4).\n` +
      `2. Identify distribution under H0: X ~ B(n, p).\n` +
      `3. Calculate test probability P(X >= x) or identify critical region.\n` +
      `4. Compare with significance level (e.g. 5%).\n` +
      `5. Conclude in the context of the question with non-deterministic language.`,
  },

  // --- A-LEVEL TOPIC WORKSHEETS ---
  {
    id: 'alevel-maths-integration-worksheet',
    title: 'A-Level Maths: Advanced Integration Techniques',
    level: 'alevel',
    subject: 'maths',
    examBoard: 'edexcel',
    type: 'topic_worksheet',
    year: 2024,
    pageCount: 2,
    pdfUrl: '/assets/resources/alevel-maths-integration-worksheet.pdf',
    topics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions', 'Differential Equations'],
    description: 'Targeted practice sheet featuring reverse chain rule, trigonometric substitutions (sec²x, sin/cos), partial fractions, and differential equations with initial boundary conditions.',
    markSchemeNotes:
      `### A-Level Advanced Integration Answers\n\n` +
      `**1. Substitution**: integral of x * sqrt(x² + 5) dx\n` +
      `- Let u = x² + 5 => du = 2x dx => x dx = du/2\n` +
      `- integral = 0.5 * integral(u^(1/2) du) = 0.5 * (2/3) * u^(3/2) + C = **(1/3)(x² + 5)^(3/2) + C**\n\n` +
      `**2. Partial Fractions**: (5x + 3) / ((x + 1)(x - 1)) = A/(x + 1) + B/(x - 1)\n` +
      `- 5x + 3 = A(x - 1) + B(x + 1)\n` +
      `- x = 1 => 8 = 2B => B = 4\n` +
      `- x = -1 => -2 = -2A => A = 1\n` +
      `- integral = ln|x + 1| + 4*ln|x - 1| + C\n\n` +
      `**3. Differential Equation**: dy/dx = 2xy\n` +
      `- Separate variables: (1/y) dy = 2x dx\n` +
      `- ln|y| = x² + C => **y = A * e^(x²)** where A = e^C`,
  },
  {
    id: 'alevel-maths-mechanics-worksheet',
    title: 'A-Level Maths: Mechanics - Connected Particles & Pulleys',
    level: 'alevel',
    subject: 'maths',
    examBoard: 'edexcel',
    type: 'topic_worksheet',
    year: 2024,
    pageCount: 2,
    pdfUrl: '/assets/resources/alevel-maths-integration-worksheet.pdf', // fallback
    topics: ['Connected Particles', 'Smooth Pulleys', 'Inclined Planes', 'Newton\'s 2nd Law (F = ma)'],
    description: 'Multi-body mechanics problem set: solving simultaneous equations of motion, resolving forces on rough inclined planes, and pulley string break kinematics.',
    markSchemeNotes:
      `### Mechanics Connected Particles Checklist\n` +
      `- Apply Newton's Second Law F = ma separately to each particle!\n` +
      `- For Particle A (mass m1 hanging): m1*g - T = m1*a\n` +
      `- For Particle B (mass m2 on surface): T - F_friction = m2*a\n` +
      `- Friction F_max = mu * R, where R is the normal reaction force.`,
  },

  // --- 11+ / KS2 PAPERS & WORKSHEETS ---
  {
    id: '11plus-practice-paper-1',
    title: '11+ Revision Ninja - Practice Paper 1 (Mixed Maths & Word Problems)',
    level: '11plus',
    subject: 'maths',
    examBoard: 'gl',
    type: 'past_paper',
    year: 2024,
    pageCount: 3,
    pdfUrl: '/assets/sample-11plus-paper.pdf',
    topics: ['Fractions', 'Decimals', 'Time & Schedules', 'Ratios', 'Percentages', 'Geometry', 'Cube Surface Area'],
    description: 'Complete 3-page 11+ practice paper covering 10 classic grammar school and independent school entrance exam questions.',
    markSchemeNotes:
      `### 11+ Practice Paper 1 Mark Scheme\n\n` +
      `**Q1**: 3.45 * 12 + 14.8 = 41.4 + 14.8 = **56.2** [2 Marks]\n` +
      `**Q2**: 09:42 to 11:18 = 18 mins to 10:00 + 1 hr 18 mins = **96 minutes** [2 Marks]\n` +
      `**Q3**: 48 / 84 = divide by 12 = **4 / 7** [2 Marks]\n` +
      `**Q4**: 4x - 7 = 29 => 4x = 36 => **x = 9** [3 Marks]\n` +
      `**Q5**: Total 30 pupils, ratio 2:3. Sum of parts = 5. Each part = 6.\n` +
      `- Girls = 3 * 6 = **18 girls**. Boys = 12.\n` +
      `**Q6**: 20% of £45 = £9. Sale price = 45 - 9 = **£36.00** [2 Marks]\n` +
      `**Q7**: Perimeter = 2*(L + W) = 36 => L + W = 18. L = 2W => 3W = 18 => W = 6, L = 12.\n` +
      `- Area = 12 * 6 = **72 m²** [3 Marks]\n` +
      `**Q8**: Sequence: 3, 7, 15, 31, 63, **127** (Rule: Multiply by 2 and add 1, or add 4, 8, 16, 32, 64) [2 Marks]\n` +
      `**Q9**: 5 * 18 = 90. 6 * 19 = 114. Sixth student = 114 - 90 = **24 marks** [3 Marks]\n` +
      `**Q10**: 6 equal faces = 150 cm² => One face = 25 cm².\n` +
      `- Edge length = sqrt(25) = 5 cm.\n` +
      `- Volume = 5³ = **125 cm³** [3 Marks]`,
  },
];

/**
 * Filter resource bank items based on user selection
 */
export function queryResourceBank({
  level = 'all',
  subject = 'all',
  examBoard = 'all',
  type = 'all',
  topic = 'All Topics',
  searchQuery = '',
}) {
  return RESOURCE_BANK.filter(item => {
    // Level match
    if (level !== 'all' && item.level !== level) {
      return false;
    }
    // Subject match
    if (subject !== 'all' && item.subject !== subject) {
      return false;
    }
    // Exam board match
    if (examBoard !== 'all' && item.examBoard && item.examBoard !== examBoard) {
      return false;
    }
    // Type match
    if (type !== 'all' && item.type !== type) {
      return false;
    }
    // Topic match
    if (topic && topic !== 'All Topics') {
      const matchTopic = item.topics && item.topics.some(t => 
        t.toLowerCase().includes(topic.toLowerCase())
      );
      if (!matchTopic) return false;
    }
    // Search query match
    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = item.description ? item.description.toLowerCase().includes(query) : false;
      const inTopics = item.topics ? item.topics.some(t => t.toLowerCase().includes(query)) : false;
      const inBoard = item.examBoard ? item.examBoard.toLowerCase().includes(query) : false;
      if (!inTitle && !inDesc && !inTopics && !inBoard) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Returns available unique topics for the selected level and subject
 */
export function getAvailableTopics({ level = 'all', subject = 'all' }) {
  const set = new Set();
  RESOURCE_BANK.forEach(item => {
    if (level !== 'all' && item.level !== level) return;
    if (subject !== 'all' && item.subject !== subject) return;
    if (Array.isArray(item.topics)) {
      item.topics.forEach(t => set.add(t.trim()));
    }
  });
  return ['All Topics', ...Array.from(set).sort()];
}
