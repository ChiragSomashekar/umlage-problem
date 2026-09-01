// Design tokens — the piece's laws, not vibes.
// Tweak here; everything obeys. (Hot reload = live taste loop.)

export const COLORS = {
  paper: "#f7f3ec",     // warm paper ground
  ink: "#21201c",       // near-black text
  muted: "#8b8378",     // secondary text, axis labels
  grid: "#8b8378",      // gridlines (used at low opacity)

  male: "#4a6a5a",      // quiet evergreen — context, not protagonist
  female: "#c08552",    // quiet ochre-clay — sibling weight to male
  accent: "#b5432e",    // rust — reserved for the story (boomers, callouts)
};

export const TYPE = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
};

export const MOTION = {
  narrative: { type: "spring", stiffness: 120, damping: 22, mass: 1 },
  snappy: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
};
