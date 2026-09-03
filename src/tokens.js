// design tokens shared by every view. change colors here, not in the components.

export const COLORS = {
  paper: "#f7f3ec",     // background
  ink: "#21201c",       // text
  muted: "#6f675c",     // secondary text, axis labels. 5.0:1 on paper, AA at small sizes
  grid: "#8b8378",      // gridlines, used at low opacity

  male: "#4a6a5a",      // green
  female: "#c08552",    // ochre
  femaleLabel: "#8f5c2c", // darker female for text, 5.1:1 on paper (the fill is too light as type)
  accent: "#b5432e",    // rust, only for the boomer annotation and callouts
};

export const TYPE = {
  display: "'Fraunces', Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
};

export const MOTION = {
  narrative: { type: "spring", stiffness: 120, damping: 22, mass: 1 },
  snappy: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
};
