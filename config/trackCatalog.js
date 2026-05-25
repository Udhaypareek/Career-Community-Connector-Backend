const TRACK_CATALOG = [
  {
    key: "gate",
    title: "GATE",
    description: "Preparation for GATE exam topics and peer support.",
  },
  {
    key: "dsa",
    title: "DSA",
    description: "Data Structures and Algorithms practice and discussions.",
  },
  {
    key: "machine-learning",
    title: "Machine Learning",
    description: "ML concepts, projects, and interview prep.",
  },
  {
    key: "data-science",
    title: "Data Science",
    description: "Data analysis, modeling, and real-world case studies.",
  },
  {
    key: "artificial-intelligence",
    title: "Artificial Intelligence",
    description: "AI foundations, tools, and applied learning.",
  },
  {
    key: "system-design",
    title: "System Design",
    description: "Scalable systems, architecture, and design interviews.",
  },
  {
    key: "cyber-security",
    title: "Cyber Security",
    description: "Security fundamentals, tooling, and best practices.",
  }
];

const TRACK_KEYS = new Set(TRACK_CATALOG.map((track) => track.key));
const TRACK_TITLES = TRACK_CATALOG.reduce((acc, track) => {
  acc[track.key] = track.title;
  return acc;
}, {});

module.exports = { TRACK_CATALOG, TRACK_KEYS, TRACK_TITLES };
