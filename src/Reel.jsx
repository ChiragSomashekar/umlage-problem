import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { MotionConfig, motion, AnimatePresence } from "motion/react";
import pyramid from "./data/pyramid.json";
import { COLORS } from "./tokens";

// ?reel: the ridge chart as an animated film for instagram. phases:
//   0. the 1950 line alone, drawn large
//   1. it shrinks into place, the other 75 stack up, year counter runs
//   2. the rust thread draws
//   3. a dot moves along the thread from age 0 to 98, with an age/count label
//   4. hold the finished chart
// same 800x720 stage as ?promo. record at 2x for 1600x1440.

const STAGE_W = 800;
const STAGE_H = 720;

const CHART_W = 800;
const CHART_H = 500; // header + captions + chart + credit have to fit in the 720 stage
const M = { top: 36, right: 44, bottom: 40, left: 64 };
const INNER_W = CHART_W - M.left - M.right;
const INNER_H = CHART_H - M.top - M.bottom;

const YEAR_STEP = 2;
const AMP = 44;
const STEP = (INNER_H - AMP) / 75;
const AMP_BIG = 115; // height of the 1950 line in the intro phase
const BIG_BASE = INNER_H * 0.55;

const CAPTIONS = [
  "This is Germany in 1950: its age distribution, as one line.",
  "Left: newborns. Right: 100-year-olds. Height: how many of them.",
  "Now add one line for every second year since.",
  "The rust line: everyone born in 1964, Germany's biggest birth year.",
  "Born 1964: 1.3 million of them. Watch how many remain.",
  "150 years of Germany. One drawing.",
];

export default function Reel({ manual = false }) {
  const [capIdx, setCapIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0); // 0 intro, 1 stack, 2 thread, 3 dot, 4 hold
  const [year, setYear] = useState(1950);
  const [dotAge, setDotAge] = useState(null);
  const [hoverAge, setHoverAge] = useState(null); // ?steps only: reading one age off the 1950 line
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
    // 1964 cohort size at every age, using all years (not just the drawn ones), for the dot's counter
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

  // hover on the teaching line: the exact count and share for one age in 1950
  const total1950 = d3.sum(pyramid[1950], ([m, f]) => m + f);
  const fmtPeople = (pop) => `${(Math.round(pop) * 1000).toLocaleString("en-US")}`;
  const onHoverMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const age = Math.round(xScale.invert(e.clientX - rect.left));
    setHoverAge(Math.max(0, Math.min(100, age)));
  };

  const lineAt = (points, ampFn, base) =>
    d3
      .line()
      .x((d) => xScale(d.age))
      .y((d) => base - ampFn(d.pop))
      .curve(d3.curveCatmullRom.alpha(0.5))(points);

  // opaque paper fill under each line so nearer years cover the ones behind
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
  // radius scales with sqrt(pop), so the dot's area tracks how many are still alive
  const dotRs = thread.map((d) => 4.2 * Math.sqrt(d.pop / maxCohort));
  // clamp the counter x so the label stays inside the frame
  const cntXs = dotXs.map((v) => Math.min(Math.max(v, 84), INNER_W - 96));

  // keyframes for the dot ride. it pauses at a few ages so the counter can be
  // read. indices are into the thread array, times are fractions of RIDE_S.
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
      [45, 49, 0.8, 0.88, 1.0], // travel to 98, the last age that is only this cohort
      // (the last bucket is 100+ and includes older cohorts, so stop at 98)
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

  const clearCounters = () => {
    intervals.current.forEach(clearInterval);
    intervals.current = [];
  };
  // year counter runs with the stacking (75 ridges x 80ms)
  const startYearCounter = () => {
    let i = 0;
    setYear(1950);
    // the lines start drawing 0.9s in (after the 1950 line has moved to the front)
    // and each one is invisible for its first frames, so the counter waits 1.1s
    // and then ticks one year per line: it names a line once you can see it
    const t0 = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setYear(1950 + i * 2);
        if (i >= 75) clearInterval(iv);
      }, 80);
      intervals.current.push(iv);
    }, 1100);
    intervals.current.push(t0);
  };
  // age counter mirrors the ride keyframes above: moves between holds, stays put during them
  const startDotRide = () => {
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
  };

  // timeline. setTimeout only, no Date.now, so a reload replays it identically
  useEffect(() => {
    if (manual) return undefined;
    let cancelled = false;
    const T = [];
    const at = (ms, fn) => T.push(setTimeout(() => !cancelled && fn(), ms));

    at(2600, () => setCapIdx(1));
    at(5400, () => {
      setCapIdx(2);
      setPhase(1);
      startYearCounter();
    });
    at(12000, () => {
      setCapIdx(3);
      setPhase(2);
    });
    at(14200, () => {
      setCapIdx(4);
      setPhase(3);
      startDotRide();
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

  // manual mode (?steps): same scenes, advanced by keyboard or buttons
  const STEPS = CAPTIONS.length;
  const applyStep = (s) => {
    clearCounters();
    setStep(s);
    setCapIdx(s);
    if (s <= 1) {
      setPhase(0);
      setYear(1950);
      setDotAge(null);
    } else if (s === 2) {
      setPhase(1);
      startYearCounter();
      setDotAge(null);
    } else if (s === 3) {
      setPhase(2);
      setYear(2100);
      setDotAge(null);
    } else if (s === 4) {
      setPhase(3);
      setYear(2100);
      startDotRide();
    } else {
      setPhase(4);
      setYear(2100);
      setDotAge(null);
    }
  };
  useEffect(() => {
    if (!manual) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); applyStep(Math.min(STEPS - 1, step + 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); applyStep(Math.max(0, step - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manual, step]);

  return (
    <MotionConfig reducedMotion="user">
      <>
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
        {/* header, same styling as the promo film */}
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

        <div style={{ flex: 1 }}>
          <svg width={CHART_W} height={CHART_H} aria-hidden="true">
            <g transform={`translate(${M.left}, ${M.top})`}>
              {/* other 75 years. rendered back to front so nearer years cover the ones
                  behind, but the draw delay runs front to back with the year counter */}
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

              {/* the 1950 line: drawn large first, then morphs to its place at the front */}
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

              {/* labels on the intro line */}
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

              {/* ?steps: hover the first line to read one age */}
              {manual && phase === 0 && (
                <g>
                  <rect
                    x={0}
                    y={0}
                    width={INNER_W}
                    height={INNER_H}
                    fill="transparent"
                    style={{ cursor: "crosshair" }}
                    onMouseMove={onHoverMove}
                    onMouseLeave={() => setHoverAge(null)}
                  />
                  {hoverAge === null ? (
                    <text
                      x={INNER_W}
                      y={INNER_H - 6}
                      textAnchor="end"
                      fontSize={9.5}
                      letterSpacing="0.1em"
                      fill={COLORS.muted}
                    >
                      HOVER THE LINE TO READ ONE AGE
                    </text>
                  ) : (
                    (() => {
                      const pt = ridges[0].points[hoverAge];
                      const px = xScale(hoverAge);
                      const py = BIG_BASE - ampBig(pt.pop);
                      const share = ((pt.pop / total1950) * 100).toFixed(1);
                      const flip = px > INNER_W - 220;
                      return (
                        <g style={{ pointerEvents: "none" }}>
                          <line x1={px} x2={px} y1={py} y2={BIG_BASE + 6} stroke={COLORS.muted} strokeOpacity={0.5} strokeDasharray="2 3" />
                          <circle cx={px} cy={py} r={3.5} fill={COLORS.accent} />
                          <text
                            x={flip ? px - 10 : px + 10}
                            y={py - 8}
                            textAnchor={flip ? "end" : "start"}
                            fontSize={12}
                            fontStyle="italic"
                            fill={COLORS.ink}
                            paintOrder="stroke"
                            stroke={COLORS.paper}
                            strokeWidth={4}
                            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            In 1950, {fmtPeople(pt.pop)} people were {hoverAge} years old
                          </text>
                          <text
                            x={flip ? px - 10 : px + 10}
                            y={py + 8}
                            textAnchor={flip ? "end" : "start"}
                            fontSize={10}
                            fill={COLORS.muted}
                            paintOrder="stroke"
                            stroke={COLORS.paper}
                            strokeWidth={4}
                          >
                            {share}% of everyone in Germany
                          </text>
                        </g>
                      );
                    })()
                  )}
                </g>
              )}

              {/* year, shown from the start so the intro line is labeled. counts up during the stack phase */}
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

              {/* dot riding the thread, with its age and count beside it */}
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

              {/* final state labels, same as the poster */}
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

              {/* three year labels, three age labels */}
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

        {/* data credit, since the film gets shared without the page */}
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
      {manual && (
        <div
          style={{
            width: STAGE_W,
            margin: "14px auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <button
            type="button"
            className="step-btn"
            onClick={() => applyStep(Math.max(0, step - 1))}
            disabled={step === 0}
            aria-label="Previous scene"
          >
            &larr; Back
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }} aria-label={`Scene ${step + 1} of ${STEPS}`}>
            {d3.range(STEPS).map((i) => (
              <button
                key={i}
                type="button"
                className={`step-dot${i < step ? " done" : i === step ? " now" : ""}`}
                onClick={() => applyStep(i)}
                aria-label={`Go to scene ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="step-btn"
            onClick={() => applyStep(Math.min(STEPS - 1, step + 1))}
            disabled={step === STEPS - 1}
            aria-label="Next scene"
          >
            Next &rarr;
          </button>
        </div>
      )}
      </>
    </MotionConfig>
  );
}

