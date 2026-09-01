// Editorial annotations, anchored to birth cohorts (age = year - birthYear,
// so each label rides up with its generation and retires with it).
//
// Language rule: factual, demographic register — "birth deficit"
// (Geburtenausfall) is the precise term; no poeticizing of war history.
// Tone rule: wars are quiet historical footnotes (muted); the Babyboom is
// the piece's protagonist and alone carries the accent.

// Cohort windows are fitted to the drawn bars, not to textbook dates:
// in the UN-smoothed series the WWI notch is 1916–1919 and the WWII trough
// is 1945–1948 (deepest 1946 — the 1944 cohort is still strong).
export const ANNOTATIONS = [
  {
    id: "wwi",
    birthYear: 1917,
    tone: "quiet",
    title: () => ["Birth deficit of the", "First World War"],
    detail: "BORN 1916–1919",
  },
  {
    id: "wwii",
    birthYear: 1946,
    tone: "quiet",
    title: () => ["Birth deficit of the", "Second World War"],
    detail: "BORN 1945–1948",
  },
  {
    id: "boom",
    birthYear: 1962,
    tone: "accent",
    title: () => ["The Babyboom generation"],
    // anchor age 74 = year 2036, when the youngest boomers (b. 1969) are 67
    detail: (age) =>
      age >= 74
        ? "BORN 1955–1969 · RETIRED"
        : age >= 65
          ? "BORN 1955–1969 · NOW RETIRING"
          : "BORN 1955–1969",
  },
  {
    id: "pillenknick",
    birthYear: 1972,
    tone: "quiet",
    // quotes on purpose: the vernacular name for the notch, not a causal claim
    title: () => ["The ‘Pillenknick’ —", "births fall by a third"],
    detail: "BORN 1968–1975",
  },
];

// Considered and rejected: a "birth decline of the early 2020s" annotation.
// The dip is real (age-0: 797k in 2022 → 716k by 2025) but mild, ongoing,
// and causally contested — it raises questions the piece can't answer and
// serves no part of the pension story. Candidate for a hover tooltip detail
// instead. COVID mortality: checked in the data, invisible in the shape,
// likewise omitted.

export const activeAnnotations = (year) =>
  ANNOTATIONS.map((a) => ({ ...a, age: year - a.birthYear })).filter(
    (a) => a.age >= 0 && a.age <= 100
  );
