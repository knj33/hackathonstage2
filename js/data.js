// ── CU Academic Advisor — embedded ECE dataset ──────────────────────
// Placeholder data modeled on the Caucasus University ECE program.
// Real CSV exports will be swapped in later; keep these exact schemas.

const CU_DATA = {

  currentWeek: 10,

  gradeScale: [
    { letter: "A",  points: 4.0 },
    { letter: "A-", points: 3.7 },
    { letter: "B+", points: 3.3 },
    { letter: "B",  points: 3.0 },
    { letter: "B-", points: 2.7 },
    { letter: "C+", points: 2.3 },
    { letter: "C",  points: 2.0 },
    { letter: "C-", points: 1.7 },
    { letter: "D",  points: 1.0 },
    { letter: "F",  points: 0.0 }
  ],

  categoryLabels: {
    programming: "Programming",
    math: "Math",
    circuits: "Circuits",
    signals: "Signals",
    systems: "Systems",
    general: "General"
  },

  // ── 4.1 courses ───────────────────────────────────────────────────
  courses: [
    // Semester 1
    { code: "MATH-1101", name: "Calculus 1", credits: 6, semester: 1,
      prerequisites: [], professorId: "prof-01", category: "math" },
    { code: "CSCI-1101", name: "CompSci Basics 1", credits: 6, semester: 1,
      prerequisites: [], professorId: "prof-03", category: "programming" },
    { code: "PHYS-1101", name: "Physics 1: Mechanics", credits: 6, semester: 1,
      prerequisites: [], professorId: "prof-04", category: "general" },
    { code: "ENGL-1101", name: "Academic English 1", credits: 5, semester: 1,
      prerequisites: [], professorId: "prof-08", category: "general" },

    // Semester 2
    { code: "MATH-1201", name: "Calculus 2", credits: 6, semester: 2,
      prerequisites: ["MATH-1101"], professorId: "prof-01", category: "math" },
    { code: "CSCI-1201", name: "CompSci Basics 2", credits: 6, semester: 2,
      prerequisites: ["CSCI-1101"], professorId: "prof-02", category: "programming" },
    { code: "PHYS-1201", name: "Physics 2: Electricity & Magnetism", credits: 6, semester: 2,
      prerequisites: ["PHYS-1101", "MATH-1101"], professorId: "prof-04", category: "circuits" },
    { code: "EENG-1201", name: "Digital Logic", credits: 5, semester: 2,
      prerequisites: [], professorId: "prof-07", category: "systems" },

    // Semester 3
    { code: "MATH-2101", name: "Linear Algebra", credits: 5, semester: 3,
      prerequisites: ["MATH-1101"], professorId: "prof-06", category: "math" },
    { code: "EENG-2101", name: "Circuit Analysis 1", credits: 6, semester: 3,
      prerequisites: ["PHYS-1201", "MATH-1201"], professorId: "prof-05", category: "circuits" },
    { code: "CSCI-2101", name: "Data Structures & Algorithms", credits: 6, semester: 3,
      prerequisites: ["CSCI-1201"], professorId: "prof-02", category: "programming" },
    { code: "EENG-2102", name: "Microcontrollers", credits: 6, semester: 3,
      prerequisites: ["EENG-1201", "CSCI-1101"], professorId: "prof-07", category: "systems" },

    // Semester 4
    { code: "EENG-2201", name: "Circuit Analysis 2", credits: 6, semester: 4,
      prerequisites: ["EENG-2101"], professorId: "prof-05", category: "circuits" },
    { code: "EENG-2202", name: "Signals & Systems", credits: 6, semester: 4,
      prerequisites: ["MATH-1201", "MATH-2101"], professorId: "prof-06", category: "signals" },
    { code: "EENG-2203", name: "Electronics 1", credits: 6, semester: 4,
      prerequisites: ["EENG-2101"], professorId: "prof-09", category: "circuits" },
    { code: "MATH-2201", name: "Probability & Statistics", credits: 5, semester: 4,
      prerequisites: ["MATH-1201"], professorId: "prof-01", category: "math" }
  ],

  // ── 4.2 professors ────────────────────────────────────────────────
  professors: [
    { id: "prof-01", name: "Giorgi Beridze", title: "Professor of Mathematics",
      courses: ["MATH-1101", "MATH-1201", "MATH-2201"],
      office: "Room B-214, Building B", consultationHours: "Mon & Wed 14:00–16:00",
      email: "g.beridze@cu.edu.ge" },
    { id: "prof-02", name: "Nino Kapanadze", title: "Associate Professor of Computer Science",
      courses: ["CSCI-1201", "CSCI-2101"],
      office: "Room C-310, Building C", consultationHours: "Tue 12:00–14:00, Thu 15:00–16:00",
      email: "n.kapanadze@cu.edu.ge" },
    { id: "prof-03", name: "Levan Tsiklauri", title: "Assistant Professor of Computer Science",
      courses: ["CSCI-1101"],
      office: "Room C-305, Building C", consultationHours: "Mon 11:00–13:00",
      email: "l.tsiklauri@cu.edu.ge" },
    { id: "prof-04", name: "Tamar Gelashvili", title: "Professor of Physics",
      courses: ["PHYS-1101", "PHYS-1201"],
      office: "Room A-118, Building A", consultationHours: "Wed & Fri 13:00–15:00",
      email: "t.gelashvili@cu.edu.ge" },
    { id: "prof-05", name: "Irakli Maisuradze", title: "Associate Professor of Electrical Engineering",
      courses: ["EENG-2101", "EENG-2201"],
      office: "Room D-402, Engineering Lab Wing", consultationHours: "Tue & Thu 10:00–12:00",
      email: "i.maisuradze@cu.edu.ge" },
    { id: "prof-06", name: "Ana Lomidze", title: "Associate Professor of Applied Mathematics",
      courses: ["MATH-2101", "EENG-2202"],
      office: "Room B-220, Building B", consultationHours: "Mon 15:00–17:00",
      email: "a.lomidze@cu.edu.ge" },
    { id: "prof-07", name: "Davit Janelidze", title: "Assistant Professor of Embedded Systems",
      courses: ["EENG-1201", "EENG-2102"],
      office: "Room D-408, Engineering Lab Wing", consultationHours: "Wed 10:00–12:00, Fri 14:00–15:00",
      email: "d.janelidze@cu.edu.ge" },
    { id: "prof-08", name: "Ketevan Abashidze", title: "Senior Lecturer in English",
      courses: ["ENGL-1101"],
      office: "Room A-205, Building A", consultationHours: "Tue 13:00–15:00",
      email: "k.abashidze@cu.edu.ge" },
    { id: "prof-09", name: "Zurab Machavariani", title: "Professor of Electronics",
      courses: ["EENG-2203"],
      office: "Room D-415, Engineering Lab Wing", consultationHours: "Thu 13:00–15:00",
      email: "z.machavariani@cu.edu.ge" }
  ],

  // ── 4.3 syllabi (keyed by course code) ────────────────────────────
  syllabi: {
    "MATH-1101": {
      components: [
        { name: "Quizzes", weightPercent: 15, description: "Weekly short quizzes on the previous lecture" },
        { name: "Homework", weightPercent: 15, description: "Problem sets due every two weeks" },
        { name: "Midterm", weightPercent: 30, description: "Limits, derivatives and applications" },
        { name: "Final", weightPercent: 40, description: "Comprehensive exam incl. integration" }
      ],
      topics: ["Limits & continuity", "Derivatives", "Applications of differentiation", "Definite & indefinite integrals", "Fundamental Theorem of Calculus"],
      textbook: "James Stewart — Calculus: Early Transcendentals (9th ed.)",
      passingThreshold: 51
    },
    "CSCI-1101": {
      components: [
        { name: "Labs", weightPercent: 20, description: "Weekly programming exercises in C, submitted through the course portal and checked in the lab session" },
        { name: "Quizzes", weightPercent: 10, description: "Short in-class quizzes on syntax and tracing code by hand" },
        { name: "Midterm", weightPercent: 30, description: "Written + practical exam covering variables, conditionals, loops and functions" },
        { name: "Final", weightPercent: 40, description: "Comprehensive practical exam: arrays, strings, memory basics and a small program built from scratch" }
      ],
      topics: ["Introduction to C & compilation", "Variables and types", "Conditionals", "Loops", "Functions", "Arrays and strings", "Memory basics", "Intro to debugging"],
      textbook: "K.N. King — C Programming: A Modern Approach (2nd ed.)",
      passingThreshold: 51
    },
    "PHYS-1101": {
      components: [
        { name: "Labs", weightPercent: 20, description: "Mechanics experiments with lab reports" },
        { name: "Quizzes", weightPercent: 10, description: "Weekly concept checks" },
        { name: "Midterm", weightPercent: 30, description: "Kinematics and Newton's laws" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. energy, momentum, rotation" }
      ],
      topics: ["Kinematics", "Newton's laws", "Work & energy", "Momentum", "Rotational motion", "Oscillations"],
      textbook: "Halliday, Resnick & Walker — Fundamentals of Physics (11th ed.)",
      passingThreshold: 51
    },
    "ENGL-1101": {
      components: [
        { name: "Participation", weightPercent: 10, description: "In-class activities and discussion" },
        { name: "Essays", weightPercent: 30, description: "Three academic essays across the term" },
        { name: "Presentation", weightPercent: 20, description: "Individual technical presentation" },
        { name: "Final", weightPercent: 40, description: "Academic reading & writing exam" }
      ],
      topics: ["Academic writing structure", "Paraphrasing & citation", "Technical vocabulary", "Presentation skills"],
      textbook: "Oxford EAP: Upper-Intermediate (B2)",
      passingThreshold: 51
    },
    "MATH-1201": {
      components: [
        { name: "Quizzes", weightPercent: 15, description: "Weekly quizzes" },
        { name: "Homework", weightPercent: 15, description: "Biweekly problem sets" },
        { name: "Midterm", weightPercent: 30, description: "Integration techniques and applications" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. sequences & series" }
      ],
      topics: ["Integration techniques", "Improper integrals", "Applications of integration", "Sequences & series", "Convergence tests", "Power series & Taylor series"],
      textbook: "James Stewart — Calculus: Early Transcendentals (9th ed.)",
      passingThreshold: 51
    },
    "CSCI-1201": {
      components: [
        { name: "Labs", weightPercent: 25, description: "Weekly programming assignments" },
        { name: "Project", weightPercent: 15, description: "Small multi-file C project" },
        { name: "Midterm", weightPercent: 25, description: "Pointers, structs, dynamic memory" },
        { name: "Final", weightPercent: 35, description: "Comprehensive practical exam" }
      ],
      topics: ["Pointers", "Structs", "Dynamic memory allocation", "File I/O", "Linked lists", "Recursion", "Modular program design"],
      textbook: "K.N. King — C Programming: A Modern Approach (2nd ed.)",
      passingThreshold: 51
    },
    "PHYS-1201": {
      components: [
        { name: "Labs", weightPercent: 20, description: "E&M experiments with reports" },
        { name: "Quizzes", weightPercent: 10, description: "Weekly concept checks" },
        { name: "Midterm", weightPercent: 30, description: "Electrostatics and DC circuits" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. magnetism & induction" }
      ],
      topics: ["Electric fields", "Gauss's law", "Potential", "Capacitance", "DC circuits", "Magnetic fields", "Electromagnetic induction"],
      textbook: "Halliday, Resnick & Walker — Fundamentals of Physics (11th ed.)",
      passingThreshold: 51
    },
    "EENG-1201": {
      components: [
        { name: "Labs", weightPercent: 25, description: "Logic design labs (breadboard + simulator)" },
        { name: "Quizzes", weightPercent: 10, description: "Weekly quizzes on gates and Boolean algebra" },
        { name: "Midterm", weightPercent: 25, description: "Boolean algebra, K-maps, combinational circuits" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. sequential logic and FSMs" }
      ],
      topics: ["Number systems", "Logic gates", "Boolean algebra", "Karnaugh maps", "Combinational design", "Flip-flops", "Counters & registers", "Finite state machines"],
      textbook: "M. Morris Mano — Digital Design (6th ed.)",
      passingThreshold: 51
    },
    "MATH-2101": {
      components: [
        { name: "Quizzes", weightPercent: 15, description: "Weekly quizzes" },
        { name: "Homework", weightPercent: 15, description: "Problem sets" },
        { name: "Midterm", weightPercent: 30, description: "Matrices, systems, determinants" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. eigenvalues" }
      ],
      topics: ["Systems of linear equations", "Matrix algebra", "Determinants", "Vector spaces", "Eigenvalues & eigenvectors", "Orthogonality"],
      textbook: "Gilbert Strang — Introduction to Linear Algebra (5th ed.)",
      passingThreshold: 51
    },
    "EENG-2101": {
      components: [
        { name: "Labs", weightPercent: 20, description: "Measurement labs: multimeter, oscilloscope, DC circuits" },
        { name: "Homework", weightPercent: 10, description: "Circuit problem sets" },
        { name: "Midterm", weightPercent: 30, description: "Nodal/mesh analysis, Thevenin & Norton" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. first-order transients" }
      ],
      topics: ["Ohm's & Kirchhoff's laws", "Nodal and mesh analysis", "Thevenin & Norton equivalents", "Superposition", "Capacitors & inductors", "First-order RC/RL transients"],
      textbook: "Alexander & Sadiku — Fundamentals of Electric Circuits (7th ed.)",
      passingThreshold: 51
    },
    "CSCI-2101": {
      components: [
        { name: "Labs", weightPercent: 20, description: "Implementation labs (lists, trees, hash tables)" },
        { name: "Project", weightPercent: 15, description: "Algorithmic mini-project with complexity report" },
        { name: "Midterm", weightPercent: 25, description: "Lists, stacks, queues, complexity analysis" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. trees, graphs, sorting" }
      ],
      topics: ["Complexity & Big-O", "Stacks & queues", "Linked lists", "Trees & BSTs", "Hash tables", "Sorting algorithms", "Graphs & traversal"],
      textbook: "Cormen et al. — Introduction to Algorithms (4th ed.)",
      passingThreshold: 51
    },
    "EENG-2102": {
      components: [
        { name: "Labs", weightPercent: 30, description: "Hands-on labs with AVR/ARM boards: GPIO, timers, interrupts, UART" },
        { name: "Project", weightPercent: 20, description: "Team embedded project (sensor + actuator + report)" },
        { name: "Midterm", weightPercent: 20, description: "Architecture, memory map, GPIO, polling vs interrupts" },
        { name: "Final", weightPercent: 30, description: "Comprehensive written + code-reading exam" }
      ],
      topics: ["Microcontroller architecture", "GPIO", "Timers & counters", "Interrupts", "ADC/DAC", "UART/SPI/I2C", "Embedded C patterns"],
      textbook: "Course notes + datasheets (ATmega328P / STM32F0 reference manuals)",
      passingThreshold: 51
    },
    "EENG-2201": {
      components: [
        { name: "Labs", weightPercent: 20, description: "AC measurement and filter labs" },
        { name: "Homework", weightPercent: 10, description: "Phasor and AC power problem sets" },
        { name: "Midterm", weightPercent: 30, description: "Phasors, impedance, AC power" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. resonance and two-ports" }
      ],
      topics: ["Sinusoids & phasors", "Impedance", "AC power analysis", "Three-phase basics", "Frequency response", "Resonance", "Two-port networks"],
      textbook: "Alexander & Sadiku — Fundamentals of Electric Circuits (7th ed.)",
      passingThreshold: 51
    },
    "EENG-2202": {
      components: [
        { name: "Homework", weightPercent: 15, description: "Analytical problem sets" },
        { name: "MATLAB labs", weightPercent: 15, description: "Signal computation and plotting in MATLAB/Octave" },
        { name: "Midterm", weightPercent: 30, description: "LTI systems, convolution, Fourier series" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. Fourier & Laplace transforms" }
      ],
      topics: ["Signals classification", "LTI systems", "Convolution", "Fourier series", "Fourier transform", "Frequency response & filtering", "Laplace transform", "Sampling"],
      textbook: "Oppenheim & Willsky — Signals and Systems (2nd ed.)",
      passingThreshold: 51
    },
    "EENG-2203": {
      components: [
        { name: "Labs", weightPercent: 25, description: "Diode and transistor circuit labs" },
        { name: "Quizzes", weightPercent: 10, description: "Weekly device-physics checks" },
        { name: "Midterm", weightPercent: 25, description: "Diodes and BJT biasing" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. MOSFETs and small-signal amplifiers" }
      ],
      topics: ["Semiconductor basics", "Diodes & rectifiers", "BJT operation & biasing", "MOSFETs", "Small-signal amplifiers", "Op-amp circuits"],
      textbook: "Sedra & Smith — Microelectronic Circuits (8th ed.)",
      passingThreshold: 51
    },
    "MATH-2201": {
      components: [
        { name: "Quizzes", weightPercent: 15, description: "Weekly quizzes" },
        { name: "Homework", weightPercent: 15, description: "Problem sets incl. data exercises" },
        { name: "Midterm", weightPercent: 30, description: "Probability, random variables, distributions" },
        { name: "Final", weightPercent: 40, description: "Comprehensive incl. estimation and hypothesis testing" }
      ],
      topics: ["Probability axioms", "Conditional probability & Bayes", "Random variables", "Common distributions", "Expectation & variance", "Estimation", "Hypothesis testing"],
      textbook: "Sheldon Ross — A First Course in Probability (10th ed.)",
      passingThreshold: 51
    }
  },

  // ── 4.4 weeklyMaterials (current week = 10) ───────────────────────
  weeklyMaterials: [
    {
      week: 10, courseCode: "CSCI-1101", topic: "Arrays, Strings & Memory Basics",
      materials: [
        { type: "video", title: "CS50x — Arrays (Week 2 lecture)", source: "Harvard CS50",
          url: "https://cs50.harvard.edu/x/", free: true },
        { type: "video", title: "C Programming Full Course for Beginners", source: "freeCodeCamp (YouTube)",
          url: "https://www.youtube.com/watch?v=KJgsSFOSQv0", free: true },
        { type: "reading", title: "Arrays in C", source: "GeeksforGeeks",
          url: "https://www.geeksforgeeks.org/c-arrays/", free: true },
        { type: "practice", title: "C practice problems", source: "HackerRank",
          url: "https://www.hackerrank.com/domains/c", free: true },
        { type: "paid-course", title: "C Programming with Linux (Specialization)", source: "Coursera / Dartmouth",
          url: "https://www.coursera.org/specializations/c-programming", free: false }
      ]
    },
    {
      week: 10, courseCode: "EENG-1201", topic: "Karnaugh Maps & Combinational Design",
      materials: [
        { type: "video", title: "Digital Electronics course (K-maps chapter)", source: "Neso Academy",
          url: "https://www.nesoacademy.org/ee/03-digital-electronics", free: true },
        { type: "reading", title: "Introduction to Karnaugh Mapping", source: "All About Circuits",
          url: "https://www.allaboutcircuits.com/textbook/digital/chpt-8/introduction-to-karnaugh-mapping/", free: true },
        { type: "practice", title: "Introduction of K-Map (with exercises)", source: "GeeksforGeeks",
          url: "https://www.geeksforgeeks.org/introduction-of-k-map-karnaugh-map/", free: true },
        { type: "paid-course", title: "Digital Systems: From Logic Gates to Processors", source: "Coursera / UAB",
          url: "https://www.coursera.org/learn/digital-systems", free: false }
      ]
    },
    {
      week: 10, courseCode: "EENG-2202", topic: "Fourier Series & Frequency Response",
      materials: [
        { type: "video", title: "But what is a Fourier series?", source: "3Blue1Brown (YouTube)",
          url: "https://www.youtube.com/watch?v=r6sGWTCMz2k", free: true },
        { type: "video", title: "Signals and Systems (full course, Oppenheim)", source: "MIT OpenCourseWare",
          url: "https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/", free: true },
        { type: "reading", title: "The Scientist and Engineer's Guide to DSP", source: "dspguide.com",
          url: "https://www.dspguide.com/", free: true },
        { type: "paid-course", title: "Digital Signal Processing 1", source: "Coursera / EPFL",
          url: "https://www.coursera.org/learn/dsp1", free: false }
      ]
    },
    {
      week: 10, courseCode: "MATH-1201", topic: "Sequences & Series: Convergence Tests",
      materials: [
        { type: "video", title: "Calculus 2 — Series unit", source: "Khan Academy",
          url: "https://www.khanacademy.org/math/calculus-2", free: true },
        { type: "reading", title: "Paul's Online Notes — Calculus II: Series", source: "Lamar University",
          url: "https://tutorial.math.lamar.edu/Classes/CalcII/CalcII.aspx", free: true },
        { type: "paid-course", title: "Introduction to Calculus", source: "Coursera / University of Sydney",
          url: "https://www.coursera.org/learn/introduction-to-calculus", free: false }
      ]
    }
  ],

  // ── 4.5 eceFields (for the strength analyzer) ─────────────────────
  eceFields: [
    {
      id: "embedded", name: "Embedded Systems",
      description: "Designing the small computers inside devices — firmware, microcontrollers and hardware-software integration.",
      weights: { programming: 0.8, math: 0.4, circuits: 0.6, signals: 0.5, systems: 1.0 },
      careers: ["Embedded engineer", "Firmware developer", "IoT engineer"],
      recommendedCourses: ["EENG-2102", "EENG-1201", "CSCI-2101"]
    },
    {
      id: "dsp", name: "Signal Processing",
      description: "Analyzing and transforming signals — audio, images, sensor data — with math-heavy tools like Fourier analysis and filtering.",
      weights: { programming: 0.5, math: 0.9, circuits: 0.3, signals: 1.0, systems: 0.4 },
      careers: ["DSP engineer", "Audio/image processing engineer", "Radar systems engineer"],
      recommendedCourses: ["EENG-2202", "MATH-2101", "MATH-2201"]
    },
    {
      id: "software", name: "Software Engineering",
      description: "Building larger software systems — from clean code and data structures to full applications and services.",
      weights: { programming: 1.0, math: 0.6, circuits: 0.1, signals: 0.2, systems: 0.5 },
      careers: ["Software engineer", "Backend developer", "DevOps engineer"],
      recommendedCourses: ["CSCI-2101", "CSCI-1201", "MATH-2101"]
    },
    {
      id: "ml", name: "Machine Learning / AI",
      description: "Teaching computers to learn from data — combining strong math (linear algebra, probability) with solid programming.",
      weights: { programming: 0.9, math: 1.0, circuits: 0.1, signals: 0.5, systems: 0.3 },
      careers: ["ML engineer", "Data scientist", "AI researcher"],
      recommendedCourses: ["MATH-2101", "MATH-2201", "CSCI-2101"]
    },
    {
      id: "power", name: "Power & Electronics",
      description: "Analog circuits, power conversion and electronic devices — from amplifiers to power grids.",
      weights: { programming: 0.2, math: 0.6, circuits: 1.0, signals: 0.4, systems: 0.4 },
      careers: ["Electronics engineer", "Power systems engineer", "Hardware design engineer"],
      recommendedCourses: ["EENG-2203", "EENG-2201", "PHYS-1201"]
    },
    {
      id: "telecom", name: "Telecommunications",
      description: "Moving information across the world — wireless systems, networks, modulation and communication theory.",
      weights: { programming: 0.4, math: 0.8, circuits: 0.5, signals: 0.9, systems: 0.5 },
      careers: ["Telecom engineer", "RF engineer", "Network engineer"],
      recommendedCourses: ["EENG-2202", "MATH-2201", "EENG-2201"]
    },
    {
      id: "robotics", name: "Robotics",
      description: "Machines that sense, decide and act — blending control systems, embedded hardware and programming.",
      weights: { programming: 0.8, math: 0.7, circuits: 0.6, signals: 0.6, systems: 0.9 },
      careers: ["Robotics engineer", "Control systems engineer", "Automation engineer"],
      recommendedCourses: ["EENG-2102", "EENG-2202", "MATH-2101"]
    }
  ]
};

// ── shared helpers ───────────────────────────────────────────────────
const CU = {
  courseByCode(code) {
    return CU_DATA.courses.find(c => c.code === code) || null;
  },
  professorById(id) {
    return CU_DATA.professors.find(p => p.id === id) || null;
  },
  gradePoints(letter) {
    const g = CU_DATA.gradeScale.find(g => g.letter === letter);
    return g ? g.points : null;
  },
  courseLabel(code) {
    const c = CU.courseByCode(code);
    return c ? c.name + " (" + c.code + ")" : code;
  }
};
