import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import pyramid from "../data/pyramid.json";
import { COLORS, MOTION } from "../tokens";
import { activeAnnotations } from "../annotations";

const SPRING = MOTION.narrative;
const MALE_COLOR = COLORS.male;
const FEMALE_COLOR = COLORS.female;

// right margin is the annotation gutter, labels go there instead of on the bars
const MARGIN = { top: 40, right: 240, bottom: 32, left: 44 };

// max over all years, not just the current one, so the x scale stays fixed when scrubbing
const maxPop = d3.max(Object.values(pyramid), (yearData) =>
  d3.max(yearData, ([m, f]) => Math.max(m, f))
);

export const Pyramid = ({
  year,
  width,
  height,
  margins = MARGIN,
  showAnnotations = true,
  yearOpacity = null, // promo overrides this: the year is the only clock there, so darker
}) => {
  if (width === 0 || height === 0) return null;

  const data = pyramid[year]; // 101 entries of [male, female], in thousands
  if (!data) return null;

  const boundsWidth = width - margins.left - margins.right;
  const boundsHeight = height - margins.top - margins.bottom;
  const center = boundsWidth / 2;

  // narrow gutter: smaller annotation text and shorter detail lines. year and
  // flags anchor to the gutter's right edge so they don't overlap bars.
  const dense = margins.right < 220;
  const rightEdge = showAnnotations ? boundsWidth + margins.right - 24 : boundsWidth;

  // one band per age, age 0 at the bottom
  const yScale = d3
    .scaleBand()
    .domain(d3.range(101))
    .range([boundsHeight, 0])
    .padding(0.06); // small padding so the bars read as one silhouette

  // population to half-width in px, same scale for both sexes
  const wScale = d3.scaleLinear().domain([0, maxPop]).range([0, center]);

  const ageTicks = d3.range(0, 101, 10);

  return (
    <svg width={width} height={height} aria-hidden="true">
      <g transform={`translate(${margins.left}, ${margins.top})`}>
        {/* age axis, label + faint gridline every 10 years */}
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

        {/* population ticks, mirrored. 750k is the largest tick that fits
            (maxPop is about 774k, a 1M tick would be off-chart) */}
        {(dense ? [500, 750] : [250, 500, 750]).map((t) => (
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

        {/* sex labels. the female fill is too light for text, so use femaleLabel */}
        <text x={center - 14} y={-18} textAnchor="end" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={MALE_COLOR}>
          MEN
        </text>
        <text x={center + 14} y={-18} textAnchor="start" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={COLORS.femaleLabel}>
          WOMEN
        </text>

        {/* year, tabular digits so the width doesn't jump */}
        <text
          x={rightEdge}
          y={10}
          textAnchor="end"
          fontSize={48}
          fontWeight={560}
          fill={COLORS.ink}
          opacity={yearOpacity ?? (showAnnotations ? 0.14 : 0.24)}
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
        >
          {year}
        </text>

        {/* male half: group is flipped with scale(-1, 1), so the bars are plain x=0 rects that grow leftward */}
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

        {/* female half. cohorts not yet born in 2024 get fillOpacity 0.38 plus a
            thin stroke, otherwise the light fill disappears into the paper */}
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
        {/* annotations follow their cohort. dot at the bar tip, leader line to the label in the gutter */}
        <AnimatePresence>
          {(() => {
            // lay out in the gutter, push overlapping labels down
            const gutterX = boundsWidth + (dense ? 12 : 18);
            const titleSize = dense ? 12 : 13.5;
            const lineStep = dense ? 14.5 : 16;
            const minGap = dense ? 46 : 52;
            const anns = activeAnnotations(year)
              .map((a) => ({
                ...a,
                tipX: center + wScale(data[a.age][1]),
                cohortY: yScale(a.age) + yScale.bandwidth() / 2,
                y: yScale(a.age) + yScale.bandwidth() / 2,
              }))
              .sort((a, b) => a.y - b.y);
            if (anns.length) anns[0].y = Math.max(anns[0].y, 72); // stay below the year and projection text
            for (let i = 1; i < anns.length; i++) {
              if (anns[i].y - anns[i - 1].y < minGap) anns[i].y = anns[i - 1].y + minGap;
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
                  {/* leader: dot at the cohort's actual height, elbow to the label (which may be pushed down) */}
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
                  {/* title lines, then the detail line */}
                  {a.title(a.age).map((line, i) => (
                    <text
                      key={i}
                      x={gutterX}
                      y={-1 + i * lineStep}
                      fontSize={titleSize}
                      fontStyle="italic"
                      fill={COLORS.ink}
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={gutterX}
                    y={-1 + a.title(a.age).length * lineStep}
                    fontSize={dense ? 8.5 : 9.5}
                    fontWeight={600}
                    letterSpacing="0.12em"
                    fill={COLORS.muted}
                  >
                    {(() => {
                      const d = typeof a.detail === "function" ? a.detail(a.age) : a.detail;
                      // the narrow gutter keeps only the cohort years
                      return dense ? d.split(" · ")[0] : d;
                    })()}
                  </text>
                </motion.g>
              );
            });
          })()}
        </AnimatePresence>

        </>)}

        {/* projection flag. outside the showAnnotations gate on purpose, phones need it too */}
        <AnimatePresence>
          {year >= 2025 && (
            <motion.text
              key="projection"
              x={rightEdge}
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
              x={rightEdge}
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
