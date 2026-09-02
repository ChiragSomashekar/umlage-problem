import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { MotionConfig, motion, AnimatePresence } from "motion/react";
import pyramid from "./data/pyramid.json";
import { COLORS } from "./tokens";

// ?reel — the ridge as a film (Instagram 9:16). The poster at ?ridge is
// untouched; this stage teaches the chart while it builds:
//   1. one line alone (learn to read it)
//   2. the line takes its place, 75 more stack, the year counter runs
//   3. the rust thread draws
//   4. a dot LIVES the thread: born 1964 → age 100, counter aging with it
//   5. hold the finished poster
// Same stage as the pyramid film (?promo): the series shares one frame.
// Record at 2x → 1600×1440.

const STAGE_W = 800;
const STAGE_H = 720;

const CHART_W = 800;
const CHART_H = 500; // header + captions + chart + credit must sum under the 720 stage
const M = { top: 36, right: 44, bottom: 40, left: 64 };
const INNER_W = CHART_W - M.left - M.right;
const INNER_H = CHART_H - M.top - M.bottom;

const YEAR_STEP = 2;
const AMP = 44;
const STEP = (INNER_H - AMP) / 75;
const AMP_BIG = 115; // the lone teaching line, drawn large
const BIG_BASE = INNER_H * 0.55;

const CAPTIONS = [
  "This is Germany in 1950.",
  "Left: newborns. Right: 100-year-olds. Height: how many of them.",
  "Now add one line for every second year since.",
  "The rust line: everyone born in 1964, Germany's biggest birth year.",
  "Born 1964: 1.3 million of them. Watch how many remain.",
  "150 years of Germany. One drawing.",
];

export default function Reel() {
  const [capIdx, setCapIdx] = useState(0);
  const [phase, setPhase] = useState(0); // 0 intro, 1 stack, 2 thread, 3 dot, 4 hold
  const [year, setYear] = useState(1950);
  const [dotAge, setDotAge] = useState(null);
  const intervals = useRef([]);

  const { ridges, thread, xScale, amp, ampBig, cohort } = useMemo(() => {
    const years = d3.range(1950, 2101, YEAR_STEP);
    const maxPop = d3.max(Object.values(pyramid), (yd) => d3.max(yd, ([m, f]) => m + f));
    const x = d3.scaleLinear().domain([0, 100]).range([0, INNER_W]);
    const a = d3.scaleLinear().domain([0, maxPop]).range([0, AMP]);
    const aBig = d3.scaleLinear().domain([0, maxPop]).range([0, AMP_BIG]);
    const baseline = (i) => INNER_H - i * STEP;
    const ridges = years.map((yr, i) => ({
      year: yr,
      i,
      points: pyramid[yr].map(([m, f], age) => ({ age, pop: m + f, yBase: baseline(i) })),
    }));
    const thread = ridges
      .map(({ year: yr, points }) => {
        const age = yr - 1964;
        return age >= 0 && age <= 100 ? points[age] : null;
      })
      .filter(Boolean);
    // the 1964 cohort's true size at every single age (all years exist in
    // the data, not just the drawn ones) — the dot's counter reads this
    const cohort = d3.range(101).map((age) => {
      const [m, f] = pyramid[1964 + age][age];
      return m + f;
    });
    return { ridges, thread, xScale: x, amp: a, ampBig: aBig, cohort };
  }, []);

  const maxCohort = Math.max(...cohort);
  const fmtAlive = (pop) =>
    pop >= 1000
      ? `${(pop / 1000).toFixed(2)} million`
      : `${(Math.round(pop) * 1000).toLocaleString("en-US")}`;

  const lineAt = (points, ampFn, base) =>
    d3
      .line()
      .x((d) => xScale(d.age))
      .y((d) => base - ampFn(d.pop))
      .curve(d3.curveCatmullRom.alpha(0.5))(points);

  // opaque paper fills under each line: nearer years occlude the ones
  // behind — the painter's trick that keeps the poster calm
  const areaAt = (points, ampFn, base) =>
    d3
      .area()
      .x((d) => xScale(d.age))
      .y0(() => base)
      .y1((d) => base - ampFn(d.pop))
      .curve(d3.curveCatmullRom.alpha(0.5))(points);

  const bigD = lineAt(ridges[0].points, ampBig, BIG_BASE);
  const smallD = lineAt(ridges[0].points, amp, INNER_H);
  const bigAreaD = areaAt(ridges[0].points, ampBig, BIG_BASE);
  const smallAreaD = areaAt(ridges[0].points, amp, INNER_H);
  const ridgeD = (r) => lineAt(r.points, amp, r.points[0].yBase);
  const ridgeAreaD = (r) => areaAt(r.points, amp, r.points[0].yBase);

  const threadD = d3
    .line()
    .x((d) => xScale(d.age))
    .y((d) => d.yBase - amp(d.pop))
    .curve(d3.curveCatmullRom.alpha(0.5))(thread);

  const dotXs = thread.map((d) => xScale(d.age));
  const dotYs = thread.map((d) => d.yBase - amp(d.pop));
  // dot area tracks survivors: fattest at the immigration-reinforced peak,
  // a fading point by 100
  const dotRs = thread.map((d) => 4.2 * Math.sqrt(d.pop / maxCohort));
  // the counter floats with the dot but never leaves the frame
  const cntXs = dotXs.map((v) => Math.min(Math.max(v, 84), INNER_W - 96));

  // The ride pauses at the ages that matter: motion for time, stillness
  // for facts. Milestones (thread indices): birth, the immigration peak,
  // today, the collapse, the end. Times are fractions of RIDE_S seconds.
  const RIDE_S = 8;
  const rideKf = (arr) => {
    const vals = [];
    const times = [];
    const push = (v, t) => {
      vals.push(v);
      times.push(t);
    };
    push(arr[0], 0);
    push(arr[0], 0.1); // hold age 0
    const segs = [
      [0, 16, 0.1, 0.25, 0.35], // travel to 32, hold to 0.35
      [16, 31, 0.35, 0.5, 0.6], // travel to 62, hold
      [31, 45, 0.6, 0.72, 0.8], // travel to 90, hold
      [45, 49, 0.8, 0.88, 1.0], // travel to 98 — the last PURE cohort age
      // (the 100+ bucket pools older cohorts too, so the ride stops at 98)
    ];
    for (const [a, b, t0, t1, tHold] of segs) {
      for (let k = a + 1; k <= b; k++) push(arr[k], t0 + ((t1 - t0) * (k - a)) / (b - a));
      push(arr[b], tHold);
    }
    return { vals, times };
  };
  const rideX = rideKf(dotXs);
  const rideY = rideKf(dotYs);
  const rideR = rideKf(dotRs);
  const rideCx = rideKf(cntXs);

  // The timeline. Timers only — no Date.now, replayable by reload.
  useEffect(() => {
    let cancelled = false;
    const T = [];
    const at = (ms, fn) => T.push(setTimeout(() => !cancelled && fn(), ms));

    at(2600, () => setCapIdx(1));
    at(5400, () => {
      setCapIdx(2);
      setPhase(1);
      // year counter runs with the stacking (75 ridges × 80ms)
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setYear(1950 + i * 2);
        if (i >= 75) clearInterval(iv);
      }, 80);
      intervals.current.push(iv);
    });
    at(12000, () => {
      setCapIdx(3);
      setPhase(2);
    });
    at(14200, () => {
      setCapIdx(4);
      setPhase(3);
      // the counter follows the ride's pauses: fast between milestones,
      // still during them, so the numbers that matter can be read
      const ageAt = (t) => {
        if (t < 0.1) return 0;
        if (t < 0.25) return (32 * (t - 0.1)) / 0.15;
        if (t < 0.35) return 32;
        if (t < 0.5) return 32 + (30 * (t - 0.35)) / 0.15;
        if (t < 0.6) return 62;
        if (t < 0.72) return 62 + (28 * (t - 0.6)) / 0.12;
        if (t < 0.8) return 90;
        if (t < 0.88) return 90 + (8 * (t - 0.8)) / 0.08;
        return 98;
      };
      let n = 0;
      setDotAge(0);
      const iv = setInterval(() => {
        n++;
        const t = (n * 40) / 8000;
        setDotAge(Math.round(ageAt(Math.min(t, 1))));
        if (t >= 1) clearInterval(iv);
      }, 40);
      intervals.current.push(iv);
    });
    at(23000, () => {
      setCapIdx(5);
      setPhase(4);
      setDotAge(null);
    });

    return () => {
      cancelled = true;
      T.forEach(clearTimeout);
      intervals.current.forEach(clearInterval);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          margin: "24px auto",
          background: COLORS.paper,
          outline: `1px solid ${COLORS.muted}33`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header — same optical cut as the pyramid film */}
        <div style={{ padding: "22px 24px 0" }}>
          <div
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 28,
              fontWeight: 560,
              letterSpacing: "-0.015em",
              fontVariationSettings: "'opsz' 90",
            }}
          >
            One Hundred Fifty Years of&nbsp;Germany
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted }}>
            Every line is one year &middot; 1950&ndash;2100
          </div>
        </div>

        {/* caption band */}
        <div style={{ minHeight: 76, padding: "10px 24px 0" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={CAPTIONS[capIdx]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 22,
                lineHeight: 1.3,
                fontStyle: "italic",
                color: COLORS.ink,
              }}
            >
              {CAPTIONS[capIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* the drawing */}
        <div style={{ flex: 1 }}>
          <svg width={CHART_W} height={CHART_H} aria-hidden="true">
            <g transform={`translate(${M.left}, ${M.top})`}>
              {/* the other 75 years: rendered back-to-front so nearer years
                  occlude the ones behind (paper fill under each line), while
                  the DRAW delay still runs front-to-back with the counter */}
              {phase >= 1 &&
                [...ridges.slice(1)].reverse().map((r) => {
                  const projected = r.year >= 2025;
                  const k = (r.year - 1952) / YEAR_STEP;
                  return (
                    <g key={r.year}>
                      <motion.path
                        d={ridgeAreaD(r)}
                        fill={COLORS.paper}
                        initial={{ fillOpacity: 0 }}
                        animate={{ fillOpacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.15 + k * 0.08 }}
                      />
                      <motion.path
                        d={ridgeD(r)}
                        fill="none"
                        stroke={projected ? COLORS.muted : COLORS.ink}
                        strokeWidth={projected ? 0.8 : 1.1}
                        strokeOpacity={projected ? 0.65 : 0.9}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.9 + k * 0.08, ease: "easeOut" }}
                      />
                    </g>
                  );
                })}

              {/* the 1950 line: drawn large alone, then it takes its place at
                  the very front — its paper fill covers everything behind */}
              <motion.path
                fill={COLORS.paper}
                initial={{ d: bigAreaD, fillOpacity: 0 }}
                animate={{ d: phase === 0 ? bigAreaD : smallAreaD, fillOpacity: phase === 0 ? 0 : 1 }}
                transition={{
                  d: { duration: 0.9, ease: "easeInOut" },
                  fillOpacity: { duration: 0.4, delay: 0.5 },
                }}
              />
              <motion.path
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={phase === 0 ? 1.6 : 1.2}
                strokeOpacity={0.95}
                initial={{ pathLength: 0, d: bigD }}
                animate={{ pathLength: 1, d: phase === 0 ? bigD : smallD }}
                transition={{
                  pathLength: { duration: 1.6, ease: "easeOut" },
                  d: { duration: 0.9, ease: "easeInOut" },
                }}
              />

              {/* teaching marks on the lone line */}
              <AnimatePresence>
                {phase === 0 && capIdx === 1 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <text
                      x={xScale(15)}
                      y={BIG_BASE - ampBig(1360) - 12}
                      textAnchor="middle"
                      fontSize={10}
                      fontStyle="italic"
                      fill={COLORS.ink}
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      many babies born in the late 1930s
                    </text>
                    <text
                      x={xScale(32)}
                      y={BIG_BASE - ampBig(547) + 20}
                      textAnchor="middle"
                      fontSize={10}
                      fontStyle="italic"
                      fill={COLORS.muted}
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      few babies born in 1917 (war)
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              {/* the year — on screen from frame one, so the lone line is
                  never an unlabeled squiggle; it becomes the running clock
                  once the stacking starts */}
              <text
                x={INNER_W}
                y={2}
                textAnchor="end"
                fontSize={42}
                fontWeight={560}
                fill={COLORS.ink}
                opacity={0.32}
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
              >
                {year}
              </text>

              {/* the thread */}
              {phase >= 2 && (
                <>
                  <motion.path
                    d={threadD}
                    fill="none"
                    stroke={COLORS.paper}
                    strokeWidth={4}
                    strokeOpacity={0.85}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  />
                  <motion.path
                    d={threadD}
                    fill="none"
                    stroke={COLORS.accent}
                    strokeWidth={2}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  />
                </>
              )}

              {/* the dot that lives a life, its age beside it */}
              {phase === 3 && (
                <>
                  <motion.circle
                    fill={COLORS.accent}
                    initial={{ cx: dotXs[0], cy: dotYs[0], r: dotRs[0] }}
                    animate={{ cx: rideX.vals, cy: rideY.vals, r: rideR.vals }}
                    transition={{
                      cx: { duration: RIDE_S, times: rideX.times, ease: "linear" },
                      cy: { duration: RIDE_S, times: rideY.times, ease: "linear" },
                      r: { duration: RIDE_S, times: rideR.times, ease: "linear" },
                    }}
                  />
                  <motion.text
                    textAnchor="middle"
                    fontSize={12}
                    fontStyle="italic"
                    fill={COLORS.accent}
                    paintOrder="stroke"
                    stroke={COLORS.paper}
                    strokeWidth={3}
                    style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
                    initial={{ x: cntXs[0], y: dotYs[0] - 14 }}
                    animate={{ x: rideCx.vals, y: rideY.vals.map((v) => v - 14) }}
                    transition={{
                      x: { duration: RIDE_S, times: rideCx.times, ease: "linear" },
                      y: { duration: RIDE_S, times: rideY.times, ease: "linear" },
                    }}
                  >
                    {dotAge != null ? `age ${dotAge} · ${fmtAlive(cohort[dotAge])}` : ""}
                  </motion.text>
                </>
              )}

              {/* rest state: the axis entry and the farewell, like the poster */}
              {phase >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <circle cx={dotXs[49]} cy={dotYs[49]} r={2.8} fill={COLORS.accent} />
                  <text
                    x={-8}
                    y={dotYs[0] - 2}
                    textAnchor="end"
                    fontSize={10.5}
                    fontStyle="italic"
                    fill={COLORS.accent}
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    born
                  </text>
                  <text
                    x={-8}
                    y={dotYs[0] + 10}
                    textAnchor="end"
                    fontSize={10.5}
                    fontStyle="italic"
                    fill={COLORS.accent}
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    1964
                  </text>
                  <text
                    x={dotXs[49] - 6}
                    y={dotYs[49] - 12}
                    textAnchor="end"
                    fontSize={8.5}
                    fontWeight={600}
                    letterSpacing="0.1em"
                    fill={COLORS.accent}
                    paintOrder="stroke"
                    stroke={COLORS.paper}
                    strokeWidth={3}
                  >
                    THE SAME PEOPLE, NEARING 100
                  </text>
                </motion.g>
              )}

              {/* minimal furniture: three year marks, three age marks */}
              {phase >= 1 &&
                [1950, 2025, 2100].map((yr) => {
                  const i = (yr - 1950) / YEAR_STEP;
                  const y = INNER_H - i * STEP;
                  return (
                    <motion.g key={yr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                      <text
                        x={-8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize={9.5}
                        fontWeight={600}
                        letterSpacing="0.08em"
                        fill={yr === 2025 ? COLORS.ink : COLORS.muted}
                      >
                        {yr}
                      </text>
                    </motion.g>
                  );
                })}
              {[0, 50, 100].map((age) => (
                <text
                  key={age}
                  x={xScale(age)}
                  y={INNER_H + 22}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill={COLORS.muted}
                >
                  {age === 100 ? "100+" : age === 0 ? "age 0" : age}
                </text>
              ))}
            </g>
          </svg>
        </div>

        {/* the credit: a film travels without its context */}
        <div style={{ minHeight: 34, padding: "0 24px 16px" }}>
          <AnimatePresence>
            {phase >= 4 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                style={{ fontSize: 10.5, color: COLORS.muted }}
              >
                Data: UN World Population Prospects 2024, medium variant.
                Years after 2024 are projections.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
