// annotations anchored to birth cohorts. age = year - birthYear, so each
// label moves up the pyramid with its generation and drops off after 100.
//
// wording: "birth deficit" (Geburtenausfall) is the demographic term, keep it.
// wars use the muted tone, only the babyboom gets the accent color.

// cohort windows match the drawn bars, not textbook dates: in the UN-smoothed
// series the WWI notch is 1916–1919 and the WWII trough is 1945–1948
// (deepest in 1946, the 1944 cohort is still large).
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
    // age 74 = year 2036, when the youngest boomers (born 1969) are 67
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
    // german nickname goes in the detail line, in quotes: it's a name for the notch, not an explanation
    title: () => ["Births fall by a third"],
    detail: "BORN 1968–1975 · ‘PILLENKNICK’",
  },
];

// no annotation for the early-2020s birth dip. it's real (age 0: 797k in 2022,
// 716k by 2025) but small, still ongoing, and the causes are contested.
// covid mortality also checked: not visible in the shape, so left out too.

export const activeAnnotations = (year) =>
  ANNOTATIONS.map((a) => ({ ...a, age: year - a.birthYear })).filter(
    (a) => a.age >= 0 && a.age <= 100
  );
