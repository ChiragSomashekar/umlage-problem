import { useMemo } from "react";
import * as d3 from "d3";
import { MotionConfig, motion } from "motion/react";
import pyramid from "./data/pyramid.json";
import { COLORS } from "./tokens";

// ridgeline: one line per year, 1950 at the front (bottom) to 2100 at the back.
// x = age 0..100, height = people alive at that age. a cohort moves one age
// to the right per year, so it shows up as a diagonal across the stack.
// the rust line follows the 1964 cohort, the largest birth year.

const W = 940;
const H = 760;
const M = { top: 84, right: 44, bottom: 60, left: 84 };
const INNER_W = W - M.left - M.right;
const INNER_H = H - M.top - M.bottom;

const YEAR_STEP = 2; // every second year, 76 ridges
// data are 1 january stocks, so age 0 in 1965 = born in 1964, the record birth
// year (1.36M). this diagonal has the largest age-0 value (1,324k in 1965) and
// the largest single-age value in the whole dataset (1,492k at age 32 in 1997,
// after immigration).
const BOOM_DIAG = 1965;
const AMP = 58; // max height of one ridge in px
const STEP = (INNER_H - AMP) / ((2100 - 1950) / YEAR_STEP);

export default function Ridge() {
  const { ridges, thread, xScale } = useMemo(() => {
    const years = d3.range(1950, 2101, YEAR_STEP);

    const maxPop = d3.max(Object.values(pyramid), (yearData) =>
      d3.max(yearData, ([m, f]) => m + f)
    );

    const x = d3.scaleLinear().domain([0, 100]).range([0, INNER_W]);
    const amp = d3.scaleLinear().domain([0, maxPop]).range([0, AMP]);

    // i = 0 is 1950, drawn at the bottom
    const baseline = (i) => INNER_H - i * STEP;

    const ridges = years.map((year, i) => ({
      year,
      i,
      points: pyramid[year].map(([m, f], age) => ({
        age,
        pop: m + f,
        yBase: baseline(i),
      })),
    }));

    // one point per ridge where the 1964 cohort is alive
    const thread = ridges
      .map(({ year, points }) => {
        const age = year - BOOM_DIAG;
        return age >= 0 && age <= 100 ? points[age] : null;
      })
      .filter(Boolean);

    return { ridges, thread, xScale: x, ampScale: amp };
  }, []);

  const amp = useMemo(() => {
    const maxPop = d3.max(Object.values(pyramid), (yearData) =>
      d3.max(yearData, ([m, f]) => m + f)
    );
    return d3.scaleLinear().domain([0, maxPop]).range([0, AMP]);
  }, []);

  // catmull-rom goes through the actual points, curveBasis would smooth the war notches and boom peaks away
  const area = d3
    .area()
    .x((d) => xScale(d.age))
    .y0((d) => d.yBase)
    .y1((d) => d.yBase - amp(d.pop))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const line = d3
    .line()
    .x((d) => xScale(d.age))
    .y((d) => d.yBase - amp(d.pop))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const threadLine = d3
    .line()
    .x((d) => xScale(d.age))
    .y((d) => d.yBase - amp(d.pop))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const lastDelay = ridges.length * 0.016;

  return (
    <MotionConfig reducedMotion="user">
      <main>
        <div className="stage ridge">
          <header className="stage-head">
            <h1>One Hundred Fifty Years of&nbsp;Germany</h1>
            <p className="subtitle">
              Every line is one year of Germany. 1950&ndash;2100.
            </p>
            <p className="dek">
              Left: newborns. Right: 100-year-olds. Height: how many people at
              that age. Years stack toward 2100 at the back, so the same
              people drift right as they grow older. The rust line follows
              everyone born in 1964, Germany&rsquo;s biggest birth year.
            </p>
          </header>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto", display: "block" }}
            role="img"
            aria-label="Ridgeline of Germany's age structure, 1950 to 2100"
          >
            <g transform={`translate(${M.left}, ${M.top})`}>
              {/* paint back to front so nearer years cover the ones behind */}
              {[...ridges].reverse().map(({ year, i, points }) => {
                const projected = year >= 2025;
                const delay = i * 0.016;
                return (
                  <g key={year}>
                    <motion.path
                      d={area(points)}
                      fill={COLORS.paper}
                      initial={{ fillOpacity: 0 }}
                      animate={{ fillOpacity: 1 }}
                      transition={{ duration: 0.4, delay: delay + 0.3 }}
                    />
                    <motion.path
                      d={line(points)}
                      fill="none"
                      stroke={projected ? COLORS.muted : COLORS.ink}
                      strokeWidth={projected ? 0.9 : 1.2}
                      strokeOpacity={projected ? 0.7 : 0.95}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.7, delay, ease: "easeOut" }}
                    />
                  </g>
                );
              })}

              {/* the 1964 thread. wider paper stroke underneath so it stays readable
                  where it crosses ink ridges, and survives video compression */}
              <motion.path
                d={threadLine(thread)}
                fill="none"
                stroke={COLORS.paper}
                strokeWidth={4.5}
                strokeOpacity={0.85}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 1.6, delay: lastDelay + 0.4, ease: "easeInOut" },
                  opacity: { duration: 0.3, delay: lastDelay + 0.4 },
                }}
              />
              <motion.path
                d={threadLine(thread)}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth={2.25}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 1.6, delay: lastDelay + 0.4, ease: "easeInOut" },
                  opacity: { duration: 0.3, delay: lastDelay + 0.4 },
                }}
              />
              <motion.circle
                cx={xScale(thread[0].age)}
                cy={thread[0].yBase - amp(thread[0].pop)}
                r={2.8}
                fill={COLORS.accent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: lastDelay + 0.4 }}
              />
              {/* "born 1964" goes on the year axis at the height where the thread
                  starts, so it doesn't sit on top of the ridges */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: lastDelay + 0.6 }}
              >
                <text
                  x={-14}
                  y={thread[0].yBase - amp(thread[0].pop) + 4}
                  textAnchor="end"
                  fontSize={12.5}
                  fontStyle="italic"
                  fill={COLORS.accent}
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  born 1964
                </text>
                <line
                  x1={-8}
                  x2={-2}
                  y1={thread[0].yBase - amp(thread[0].pop)}
                  y2={thread[0].yBase - amp(thread[0].pop)}
                  stroke={COLORS.accent}
                  strokeOpacity={0.8}
                />
              </motion.g>
              <motion.text
                x={xScale(thread[thread.length - 1].age) - 8}
                y={thread[thread.length - 1].yBase - amp(thread[thread.length - 1].pop) - 16}
                textAnchor="end"
                fontSize={9.5}
                fontWeight={600}
                letterSpacing="0.12em"
                fill={COLORS.accent}
                paintOrder="stroke"
                stroke={COLORS.paper}
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: lastDelay + 2.05 }}
              >
                THE SAME PEOPLE, NEARING 100
              </motion.text>

              {/* dot on the thread's peak. no label here, it would collide with the
                  ridges; the number is in the caption */}
              {(() => {
                const s = thread.find((d) => d.age === 31);
                return (
                  <motion.circle
                    cx={xScale(s.age)}
                    cy={s.yBase - amp(s.pop)}
                    r={2.8}
                    fill={COLORS.accent}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: lastDelay + 1.5 }}
                  />
                );
              })()}

              {/* label the WWI notch once on the front ridge, the WWII notch stays unlabeled */}
              <motion.text
                x={xScale(32)}
                y={INNER_H - 8}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={600}
                letterSpacing="0.12em"
                fill={COLORS.muted}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: lastDelay + 2.3 }}
              >
                THE MISSING BIRTHS OF 1917&ndash;18
              </motion.text>

              {/* label above the back (2100) ridge */}
              <motion.text
                x={6}
                y={22}
                fontSize={8.5}
                fontWeight={600}
                letterSpacing="0.12em"
                fill={COLORS.muted}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: lastDelay + 2.7 }}
              >
                FEWER THAN HALF THE NEWBORNS OF 1964
              </motion.text>

              {/* year labels every 50 years. those are all even, so each one lands on a drawn ridge */}
              {d3.range(1950, 2101, 50).map((year) => {
                const i = (year - 1950) / YEAR_STEP;
                const y = INNER_H - i * STEP;
                return (
                  <motion.g
                    key={year}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.016 + 0.5 }}
                  >
                    <text
                      x={-14}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={10.5}
                      fontWeight={600}
                      letterSpacing="0.1em"
                      fill={COLORS.muted}
                    >
                      {year}
                    </text>
                    <line x1={-8} x2={-2} y1={y} y2={y} stroke={COLORS.muted} strokeOpacity={0.6} />
                    {/* short stub along the baseline so the label reads as belonging
                        to this ridge, not to a crest passing nearby */}
                    <line x1={0} x2={18} y1={y} y2={y} stroke={COLORS.muted} strokeOpacity={0.5} />
                  </motion.g>
                );
              })}

              {/* 2025 label in ink: where data turns into projection. sits between
                  the drawn 2024 and 2026 ridges */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: ((2025 - 1950) / YEAR_STEP) * 0.016 + 0.5 }}
              >
                <text
                  x={-14}
                  y={INNER_H - ((2025 - 1950) / YEAR_STEP) * STEP + 3}
                  textAnchor="end"
                  fontSize={10.5}
                  fontWeight={600}
                  letterSpacing="0.1em"
                  fill={COLORS.ink}
                >
                  2025
                </text>
                <line
                  x1={-8}
                  x2={-2}
                  y1={INNER_H - ((2025 - 1950) / YEAR_STEP) * STEP}
                  y2={INNER_H - ((2025 - 1950) / YEAR_STEP) * STEP}
                  stroke={COLORS.ink}
                  strokeOpacity={0.7}
                />
              </motion.g>

              {d3.range(0, 101, 20).map((age) => (
                <text
                  key={age}
                  x={xScale(age)}
                  y={INNER_H + 26}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill={COLORS.muted}
                >
                  {age === 100 ? "100+" : age}
                </text>
              ))}
              <text x={xScale(50)} y={INNER_H + 44} textAnchor="middle" fontSize={9.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.muted}>
                AGE
              </text>
              <text x={-14} y={-16} textAnchor="end" fontSize={9.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.muted}>
                YEAR
              </text>
              <text x={INNER_W} y={-16} textAnchor="end" fontSize={9.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.muted}>
                LIGHTER LINES · PROJECTION FROM 2025
              </text>

              {/* scale key: measure the front ridge's peak instead of a separate legend */}
              {(() => {
                const peak = ridges[0].points[10]; // 1950, age 10: 1,360k, the pre-war birth peak
                const px = xScale(10);
                const topY = INNER_H - amp(peak.pop);
                return (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                  >
                    <line x1={px} x2={px} y1={INNER_H - 1} y2={topY + 1} stroke={COLORS.ink} strokeWidth={0.8} strokeOpacity={0.5} />
                    <line x1={px - 4} x2={px + 4} y1={topY} y2={topY} stroke={COLORS.ink} strokeWidth={0.8} strokeOpacity={0.5} />
                    <line x1={px - 4} x2={px + 4} y1={INNER_H} y2={INNER_H} stroke={COLORS.ink} strokeWidth={0.8} strokeOpacity={0.5} />
                    <text
                      x={px + 10}
                      y={INNER_H - 24}
                      fontSize={12.5}
                      fontStyle="italic"
                      fill={COLORS.ink}
                      paintOrder="stroke"
                      stroke={COLORS.paper}
                      strokeWidth={2.5}
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      1.4 million people aged 10
                    </text>
                  </motion.g>
                );
              })()}
            </g>
          </svg>

          <p className="source">
            Data: UN World Population Prospects 2024, medium variant. One line
            every two years; height is the number of people alive at that
            single year of age. The final point pools everyone aged 100 and
            older, which is why each line ends with a small rise.
          </p>
        </div>
      </main>
    </MotionConfig>
  );
}
