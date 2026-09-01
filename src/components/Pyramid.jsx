import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import pyramid from "../data/pyramid.json";
import { COLORS, MOTION } from "../tokens";
import { activeAnnotations } from "../annotations";

const SPRING = MOTION.narrative;
const MALE_COLOR = COLORS.male;
const FEMALE_COLOR = COLORS.female;

// Right margin is the ANNOTATION GUTTER: labels live there on clean paper,
// never on top of the data.
const MARGIN = { top: 40, right: 240, bottom: 32, left: 44 };

// Domain computed from the WHOLE dataset, not one year: the x scale must stay
// identical across years so bars remain comparable when we morph decades later.
const maxPop = d3.max(Object.values(pyramid), (yearData) =>
  d3.max(yearData, ([m, f]) => Math.max(m, f))
);

export const Pyramid = ({ year, width, height, margins = MARGIN, showAnnotations = true }) => {
  if (width === 0 || height === 0) return null;

  const data = pyramid[year]; // 101 entries of [male, female], in thousands
  if (!data) return null;

  const boundsWidth = width - margins.left - margins.right;
  const boundsHeight = height - margins.top - margins.bottom;
  const center = boundsWidth / 2;

  // y: one band per age, age 0 at the BOTTOM (inverted range)
  const yScale = d3
    .scaleBand()
    .domain(d3.range(101))
    .range([boundsHeight, 0])
    .padding(0.06); // near-solid silhouette — the shape reads as one form

  // population → half-width in pixels, shared by both sexes (the mirror trick)
  const wScale = d3.scaleLinear().domain([0, maxPop]).range([0, center]);

  // decade ticks for the age axis: 0, 10, … 100
  const ageTicks = d3.range(0, 101, 10);

  return (
    <svg width={width} height={height} aria-hidden="true">
      <g transform={`translate(${margins.left}, ${margins.top})`}>
        {/* Age axis: label + faint gridline every 10 years */}
        {ageTicks.map((age) => (
          <g key={age}>
            <text
              x={-10}
              y={yScale(age) + yScale.bandwidth() / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill={COLORS.muted}
            >
              {age === 100 ? "100+" : age}
            </text>
            <line
              x1={0}
              x2={boundsWidth}
              y1={yScale(age) + yScale.bandwidth() / 2}
              y2={yScale(age) + yScale.bandwidth() / 2}
              stroke={COLORS.muted}
              strokeOpacity={0.15}
            />
          </g>
        ))}
        <text x={-10} y={-18} textAnchor="end" fontSize={11} fill={COLORS.muted}>
          Age
        </text>

        {/* Population scale: whisper ticks, mirrored. Every layout gets a
            magnitude scale — and 750k is the largest tick that fits the
            frozen domain (maxPop ≈ 774k; a 1M tick would draw off-chart). */}
        {[250, 500, 750].map((t) => (
          <g key={t}>
            {[center - wScale(t), center + wScale(t)].map((x) => (
              <g key={x}>
                <line x1={x} x2={x} y1={boundsHeight + 2} y2={boundsHeight + 7} stroke={COLORS.muted} strokeOpacity={0.5} />
                <text x={x} y={boundsHeight + 19} textAnchor="middle" fontSize={9.5} fill={COLORS.muted}>
                  {t >= 1000 ? `${t / 1000}M` : `${t}k`}
                </text>
              </g>
            ))}
          </g>
        ))}
        <text x={center} y={boundsHeight + 19} textAnchor="middle" fontSize={9.5} fill={COLORS.muted} opacity={0.8}>
          people per year of age
        </text>

        {/* Sex labels: tracked caps, museum-label register. The female fill
            is too light as type — labels use its darker text variant. */}
        <text x={center - 14} y={-18} textAnchor="end" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={MALE_COLOR}>
          MEN
        </text>
        <text x={center + 14} y={-18} textAnchor="start" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={COLORS.femaleLabel}>
          WOMEN
        </text>

        {/* The year: display face, tabular digits so width never jiggles */}
        <text
          x={showAnnotations ? boundsWidth + 216 : boundsWidth}
          y={10}
          textAnchor="end"
          fontSize={48}
          fontWeight={560}
          fill={COLORS.ink}
          opacity={showAnnotations ? 0.14 : 0.24}
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
        >
          {year}
        </text>

        {/* Male half: mirrored group anchored at center — bars grow leftward,
            but in local coordinates they're plain width-only bars. The zero
            line never moves; only the data end animates. */}
        <g transform={`translate(${center}, 0) scale(-1, 1)`}>
          {data.map(([m], age) => (
            <motion.rect
              key={age}
              x={0}
              y={yScale(age)}
              height={yScale.bandwidth()}
              fill={MALE_COLOR}
              stroke={MALE_COLOR}
              strokeWidth={0.75}
              initial={false}
              animate={{
                width: wScale(m),
                fillOpacity: year - age > 2024 ? 0.38 : 1,
                strokeOpacity: year - age > 2024 ? 0.9 : 0,
              }}
              transition={SPRING}
            />
          ))}
        </g>

        {/* Female half: anchored at center, growing rightward. Unborn cohorts
            fade via fillOpacity plus a hairline self-stroke — the light female
            fill would otherwise vanish into the paper at 0.38. */}
        <g transform={`translate(${center}, 0)`}>
          {data.map(([, f], age) => (
            <motion.rect
              key={age}
              x={0}
              y={yScale(age)}
              height={yScale.bandwidth()}
              fill={FEMALE_COLOR}
              stroke={FEMALE_COLOR}
              strokeWidth={0.75}
              initial={false}
              animate={{
                width: wScale(f),
                fillOpacity: year - age > 2024 ? 0.38 : 1,
                strokeOpacity: year - age > 2024 ? 0.9 : 0,
              }}
              transition={SPRING}
            />
          ))}
        </g>

        {showAnnotations && (<>
        {/* Annotations: each rides its cohort. Dot at the bar's tip, label
            beside it, paper halo for legibility when floating over bars. */}
        <AnimatePresence>
          {(() => {
            // Lay out annotations in the gutter, resolving vertical collisions
            const gutterX = boundsWidth + 18;
            const anns = activeAnnotations(year)
              .map((a) => ({
                ...a,
                tipX: center + wScale(data[a.age][1]),
                cohortY: yScale(a.age) + yScale.bandwidth() / 2,
                y: yScale(a.age) + yScale.bandwidth() / 2,
              }))
              .sort((a, b) => a.y - b.y);
            if (anns.length) anns[0].y = Math.max(anns[0].y, 72); // stay below the status block
            for (let i = 1; i < anns.length; i++) {
              if (anns[i].y - anns[i - 1].y < 52) anns[i].y = anns[i - 1].y + 52;
            }
            return anns.map((a) => {
              const markerColor = a.tone === "accent" ? COLORS.accent : COLORS.muted;
              return (
                <motion.g
                  key={a.id}
                  initial={{ opacity: 0, y: a.y }}
                  animate={{ opacity: 1, y: a.y }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                >
                  {/* leader: dot at the cohort's TRUE height, elbow to the label */}
                  <motion.circle
                    r={2}
                    fill={markerColor}
                    initial={false}
                    animate={{ cx: a.tipX + 4, cy: a.cohortY - a.y }}
                    transition={SPRING}
                  />
                  <motion.path
                    fill="none"
                    stroke={markerColor}
                    strokeWidth={1}
                    opacity={0.5}
                    initial={false}
                    animate={{
                      d: `M ${a.tipX + 6} ${a.cohortY - a.y} H ${gutterX - 26} L ${gutterX - 8} 0`,
                    }}
                    transition={SPRING}
                  />
                  {/* two-tier label on clean paper — no halo needed */}
                  {a.title(a.age).map((line, i) => (
                    <text
                      key={i}
                      x={gutterX}
                      y={-1 + i * 16}
                      fontSize={13.5}
                      fontStyle="italic"
                      fill={COLORS.ink}
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={gutterX}
                    y={-1 + a.title(a.age).length * 16}
                    fontSize={9.5}
                    fontWeight={600}
                    letterSpacing="0.12em"
                    fill={COLORS.muted}
                  >
                    {typeof a.detail === "function" ? a.detail(a.age) : a.detail}
                  </text>
                </motion.g>
              );
            });
          })()}
        </AnimatePresence>

        </>)}

        {/* Projection flag: appears once the data stops being history.
            Deliberately OUTSIDE the annotation gate — phones and the film
            must never show projected bars unlabeled. */}
        <AnimatePresence>
          {year >= 2025 && (
            <motion.text
              key="projection"
              x={showAnnotations ? boundsWidth + 216 : boundsWidth}
              y={30}
              textAnchor="end"
              fontSize={10}
              fontWeight={600}
              letterSpacing="0.14em"
              fill={COLORS.muted}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              PROJECTION · MEDIUM VARIANT
            </motion.text>
          )}
          {year >= 2026 && (
            <motion.text
              key="fade-legend"
              x={showAnnotations ? boundsWidth + 216 : boundsWidth}
              y={44}
              textAnchor="end"
              fontSize={9.5}
              fontWeight={500}
              letterSpacing="0.1em"
              fill={COLORS.muted}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              FADED BARS · NOT YET BORN IN 2024
            </motion.text>
          )}
        </AnimatePresence>
      </g>
    </svg>
  );
};
