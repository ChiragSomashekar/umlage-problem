import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "./tokens";
import ratio from "./data/ratio.json";

// "There is no pot" — the pension system as an emptying room.
// Ten people over 65 on the right; the crowd of working-age people who
// carry them on the left (count = the true ratio × 10, from ratio.json:
// 67 in 1950 → 24 in 2026 → 17 in 2060 → 16 in 2100). Contributions
// stream through a pension pot that does not exist. The stream never
// thins — the pension is paid regardless — so as the room empties, each
// coin grows: fewer carriers, more per carrier. Departed workers leave
// ghost outlines; by 2100 the room is mostly absence.

const STAGE_W = 800;
const STAGE_H = 720;

const HERO_BEAT = 1; // one coin, followed by the eye: into the pot, out again
const WALK_BEAT = 5; // two carriers cross the room and become carried

const BEATS = [
  { scene: "flow", year: 1950, hold: 3200, caption: "Where does your pension contribution actually go?" },
  { scene: "flow", year: 1950, hold: 4800, caption: "Nowhere. It is paid out again within weeks: there is no pot." },
  { scene: "flow", year: 1950, hold: 3200, caption: "This is the Umlage: each generation carries the one above it." },
  { scene: "flow", scrubTo: 2026, ms: 6500, caption: "Then the room began to empty." },
  { scene: "flow", year: 2026, hold: 2600, parts: { pre: "Today: ", num: "24", post: "." } },
  { scene: "flow", year: 2026, hold: 3800, caption: "The Babyboom moves into retirement." },
  { scene: "flow", scrubTo: 2060, ms: 4200, caption: "The stream cannot thin. So each carrier carries more." },
  { scene: "flow", year: 2060, hold: 2800, parts: { pre: "By 2060: ", num: "17", post: "." } },
  { scene: "flow", scrubTo: 2100, ms: 2200, caption: "Forty more years change almost nothing." },
  { scene: "flow", year: 2100, hold: 2400, parts: { pre: "By 2100: ", num: "16", post: "." } },
  { scene: "end", hold: 5200 },
];

// Scene geometry
const SCENE_W = 800;
const SCENE_H = 452;
const ROWS = 10;
const ROW_Y0 = 88;
const ROW_STEP = 34;
const POOL_X0 = 226; // rightmost worker column; more columns grow leftward
const COL_STEP = 24;
const ACCOUNT_X = 400;
const OUTLET_X = 642;
const FLOOR_Y = 406;
const MAX_WORKERS = 67; // the 1950 crowd — the film's maximum, so no spurious ghosts
const N_PARTICLES = 12; // constant: the pension is paid regardless

// deterministic jitter so nothing needs Math.random
const jit = (i, span) => ((i * 53) % span) - span / 2;

// A standing figure: head 23% of height, a hint of shoulder, no pill-roundness
const BODY_D = "M -3.5 9.5 L -3.5 -3.2 Q -3.5 -5.8 -1.4 -5.8 L 1.4 -5.8 Q 3.5 -5.8 3.5 -3.2 L 3.5 9.5 Z";

const Figure = ({ color }) => (
  <>
    <circle cx={0} cy={-10.2} r={2.6} fill={color} />
    <path d={BODY_D} fill={color} />
  </>
);

const FigureGhost = ({ color }) => (
  <>
    <circle cx={0} cy={-10.2} r={2.6} fill="none" stroke={color} strokeWidth={0.8} />
    <path d={BODY_D} fill="none" stroke={color} strokeWidth={0.8} />
  </>
);

// A walker whose ink turns clay as they cross the room
const WalkFigure = ({ delay }) => {
  const t = { duration: 1.9, times: [0, 0.75, 1], delay, ease: "easeInOut" };
  return (
    <>
      <motion.circle
        cx={0}
        cy={-10.2}
        r={2.6}
        initial={{ fill: COLORS.male }}
        animate={{ fill: [COLORS.male, COLORS.male, COLORS.female] }}
        transition={t}
      />
      <motion.path
        d={BODY_D}
        initial={{ fill: COLORS.male }}
        animate={{ fill: [COLORS.male, COLORS.male, COLORS.female] }}
        transition={t}
      />
    </>
  );
};

export default function Flow() {
  const [beatIdx, setBeatIdx] = useState(0);
  const [year, setYear] = useState(1950);
  const yearRef = useRef(1950);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)));

    const run = async () => {
      for (let i = 0; i < BEATS.length && !cancelled; i++) {
        setBeatIdx(i);
        const b = BEATS[i];
        if (b.scrubTo != null) {
          const from = yearRef.current;
          const steps = Math.abs(b.scrubTo - from);
          const stepMs = b.ms / steps;
          for (let s = 1; s <= steps && !cancelled; s++) {
            yearRef.current = from + s * Math.sign(b.scrubTo - from);
            setYear(yearRef.current);
            await wait(stepMs);
          }
        } else {
          if (b.year != null) {
            yearRef.current = b.year;
            setYear(b.year);
          }
          await wait(b.hold);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const beat = BEATS[beatIdx];
  const r = ratio.find((d) => d.year === year);
  const per10 = r ? Math.round(r.ratio * 10) : 67; // carriers per 10 carried
  const coinR = 2.6 + ((year - 1950) / 150) * 0.8; // fewer carriers, more per carrier
  const capKey = beat.parts ? beat.parts.pre + beat.parts.num : beat.caption;

  return (
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
      {/* header — series voice */}
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
          The Umlage Problem
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted }}>
          Germany&rsquo;s pension math, 1950&ndash;2100
        </div>
      </div>

      {/* caption + counter */}
      <div style={{ minHeight: 104, padding: "10px 24px 0" }}>
        <AnimatePresence mode="wait">
          {(beat.caption || beat.parts) && (
            <motion.p
              key={capKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 24,
                lineHeight: 1.3,
                fontStyle: "italic",
                color: COLORS.ink,
              }}
            >
              {beat.parts ? (
                <>
                  {beat.parts.pre}
                  <span style={{ fontStyle: "normal", fontWeight: 560 }}>{beat.parts.num}</span>
                  {beat.parts.post}
                </>
              ) : (
                beat.caption
              )}
            </motion.p>
          )}
        </AnimatePresence>
        {beat.scene === "flow" && r && (
          <p
            style={{
              marginTop: 8,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: COLORS.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {per10} AGED 20&ndash;64 PER 10 PEOPLE 65+{year >= 2025 ? " · PROJECTION" : ""}
          </p>
        )}
      </div>

      {/* the room */}
      <div style={{ flex: 1, position: "relative" }}>
        {beat.scene === "flow" && (
          <svg width={SCENE_W} height={SCENE_H} aria-hidden="true">
            {/* the year — the clock of the piece */}
            <text
              x={SCENE_W - 30}
              y={46}
              textAnchor="end"
              fontSize={48}
              fontWeight={560}
              fill={COLORS.ink}
              opacity={0.3}
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
            >
              {year}
            </text>
            <AnimatePresence>
              {year >= 2025 && (
                <motion.text
                  key="proj"
                  x={SCENE_W - 30}
                  y={64}
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
            </AnimatePresence>

            {/* column labels: names only — the counter line carries the number */}
            <text x={POOL_X0 + 6} y={68} textAnchor="end" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={COLORS.male}>
              AGED 20&ndash;64
            </text>
            <text x={OUTLET_X} y={68} textAnchor="middle" fontSize={10.5} fontWeight={600} letterSpacing="0.1em" fill={COLORS.femaleLabel}>
              65 AND OLDER
            </text>

            {/* the floor: emptiness must read as a room, not a broken layout */}
            <line x1={56} x2={OUTLET_X + 34} y1={FLOOR_Y} y2={FLOOR_Y} stroke={COLORS.muted} strokeOpacity={0.35} />

            {/* the pot that does not exist */}
            <rect
              x={ACCOUNT_X - 56}
              y={168}
              width={112}
              height={136}
              fill="none"
              stroke={COLORS.muted}
              strokeWidth={1}
              strokeDasharray="5 5"
              rx={3}
            />
            <text x={ACCOUNT_X} y={156} textAnchor="middle" fontSize={9.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.muted}>
              YOUR PENSION POT
            </text>
            <text
              x={ACCOUNT_X}
              y={288}
              textAnchor="middle"
              fontSize={13.5}
              fontStyle="italic"
              fill={COLORS.muted}
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              there is none
            </text>

            {/* the crowd of carriers: columns fill from the floor up; the
                departed stay behind as ghost outlines — absence accumulates */}
            {d3.range(MAX_WORKERS).map((i) => {
              const col = Math.floor(i / ROWS);
              const row = 9 - (i % ROWS); // survivors stay grounded at the floor
              const x = POOL_X0 - col * COL_STEP + jit(i, 8);
              const y = ROW_Y0 + row * ROW_STEP + jit(i + 7, 6);
              const s = 1 + ((i * 29) % 9 - 4) / 100; // ±4% scale — people, not units
              return (
                <g key={i} transform={`translate(${x}, ${y}) scale(${s})`}>
                  <motion.g
                    initial={false}
                    animate={{ opacity: i < per10 ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                  >
                    <Figure color={COLORS.male} />
                  </motion.g>
                  <motion.g
                    initial={false}
                    animate={{ opacity: i < per10 ? 0 : 0.25 }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                  >
                    <FigureGhost color={COLORS.male} />
                  </motion.g>
                </g>
              );
            })}

            {/* the ten being carried — a touch wider, a touch shorter */}
            {d3.range(ROWS).map((row) => (
              <g key={row} transform={`translate(${OUTLET_X}, ${ROW_Y0 + row * ROW_STEP}) scale(1.05, 0.92)`}>
                <Figure color={COLORS.female} />
              </g>
            ))}

            {/* contributions in flight: the stream never thins — the coins grow.
                Dimmed to a murmur while the hero coin makes its point. */}
            <motion.g animate={{ opacity: beatIdx === HERO_BEAT ? 0.25 : 1 }} transition={{ duration: 0.5 }}>
              {d3.range(N_PARTICLES).map((i) => {
                const oy = ROW_Y0 + (i % ROWS) * ROW_STEP;
                const midY = 236 + jit(i * 3 + 1, 56);
                const delay = (i * 0.53) % 2.6;
                return (
                  <motion.circle
                    key={i}
                    fill={COLORS.accent}
                    initial={{ cx: POOL_X0 + 16, cy: oy, r: 2.6 }}
                    animate={{
                      cx: [POOL_X0 + 16, ACCOUNT_X, OUTLET_X - 18],
                      cy: [oy, midY, oy],
                      opacity: [0, 1, 1, 0.9, 0],
                      r: coinR,
                    }}
                    transition={{
                      cx: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay },
                      cy: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay },
                      opacity: { duration: 2.6, repeat: Infinity, ease: "linear", delay },
                      r: { type: "spring", stiffness: 120, damping: 22 },
                    }}
                  />
                );
              })}
            </motion.g>

            {/* the hero coin: into the pot, a held breath, out to a pension */}
            {beatIdx === HERO_BEAT && (
              <motion.circle
                fill={COLORS.accent}
                initial={{ cx: POOL_X0 + 16, cy: ROW_Y0 + 4 * ROW_STEP, r: 3, opacity: 0 }}
                animate={{
                  cx: [POOL_X0 + 16, ACCOUNT_X, ACCOUNT_X, OUTLET_X - 18],
                  cy: [ROW_Y0 + 4 * ROW_STEP, 234, 234, ROW_Y0 + 4 * ROW_STEP],
                  r: [3, 4.5, 4.5, 3],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{ duration: 3.6, times: [0, 0.38, 0.55, 1], ease: "easeInOut", delay: 0.5 }}
              />
            )}

            {/* the gesture: two carriers cross the room and become carried */}
            {beatIdx === WALK_BEAT &&
              [2, 5].map((row, k) => (
                <motion.g
                  key={row}
                  initial={{ x: POOL_X0, y: ROW_Y0 + row * ROW_STEP, opacity: 0 }}
                  animate={{ x: OUTLET_X - 16, opacity: 1 }}
                  transition={{
                    x: { duration: 1.9, delay: 0.4 + k * 0.9, ease: "easeInOut" },
                    opacity: { duration: 0.4, delay: 0.4 + k * 0.9 },
                  }}
                >
                  <WalkFigure delay={0.4 + k * 0.9} />
                </motion.g>
              ))}
          </svg>
        )}

        {beat.scene === "end" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 32,
            }}
          >
            <div
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 40,
                fontWeight: 560,
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                fontVariationSettings: "'opsz' 90",
              }}
            >
              The Umlage Problem
            </div>
            <div style={{ marginTop: 14, fontSize: 15, color: COLORS.muted }}>
              Germany&rsquo;s pension math, 1950&ndash;2100
            </div>
            <div style={{ marginTop: 40, fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: COLORS.accent }}>
              SCRUB ALL 150 YEARS YOURSELF → LINK IN COMMENTS
            </div>
            <div style={{ marginTop: 40, fontSize: 12, color: COLORS.muted }}>
              Data: UN World Population Prospects 2024 &middot; Pay-as-you-go by law since 1957
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
