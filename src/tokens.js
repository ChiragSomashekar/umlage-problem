// Design tokens — the piece's laws, not vibes.
// Tweak here; everything obeys. (Hot reload = live taste loop.)

export const COLORS = {
  paper: "#f7f3ec",     // warm paper ground
  ink: "#21201c",       // near-black text
  muted: "#6f675c",     // secondary text, axis labels — 5.0:1 on paper (AA at small sizes)
  grid: "#8b8378",      // gridlines (used at low opacity)

  male: "#4a6a5a",      // quiet evergreen — context, not protagonist
  female: "#c08552",    // quiet ochre-clay — sibling weight to male
  femaleLabel: "#8f5c2c", // text variant of female — sibling weight to the green as type (5.1:1)
  accent: "#b5432e",    // rust — reserved for the story (boomers, callouts)
};

export const TYPE = {
  display: "'Fraunces', Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
};

export const MOTION = {
  narrative: { type: "spring", stiffness: 120, damping: 22, mass: 1 },
  snappy: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
};
