import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pyramid } from "./components/Pyramid";
import { COLORS } from "./tokens";
import ratio from "./data/ratio.json";

// LinkedIn promo mode (open with ?promo).
// Stage is 540×675 CSS px → record on a retina screen = 1080×1350 (4:5).
// The timeline drives itself; captions carry the story (silent autoplay).

// 1:1 square (LinkedIn's other first-class format): trades a sliver of
// feed height for 25% more chart width — this composition is wide by
// nature. Retina → 1600×1600.
const STAGE_W = 800;
const STAGE_H = 720; // slightly under square so the card fits an un-fullscreened browser
// The page's own gutter width: at 800 wide the film fits the full-size
// annotation system, details and all — film and page are now identical.
const CHART_MARGINS = { top: 40, right: 240, bottom: 24, left: 40 };

// Captions must agree with the ticking readout below them — no rounded
// claims the chart itself contradicts. The film now reaches 2100: the urn
// is the strongest frame, and the card promises 1950–2100.
const BEATS = [
  {
    scene: "pyr", year: 1950, hold: 3800,
    caption: "In 1950, Germany had nearly seven people of working age for every person over 65.",
  },
  { scene: "pyr", scrubTo: 2026, ms: 7500, caption: "Then the country grew older." },
  { scene: "pyr", year: 2026, hold: 3800, caption: "Today: 2.4." },
  { scene: "pyr", scrubTo: 2060, ms: 4500, caption: "The Babyboom moves into retirement." },
  { scene: "pyr", year: 2060, hold: 2600, caption: "By 2060: 1.7." },
  { scene: "pyr", scrubTo: 2100, ms: 3200, caption: "Demographers call this shape an urn." },
  { scene: "pyr", year: 2100, hold: 2800, caption: "Demographers call this shape an urn." },
  { scene: "end", hold: 6000 },
];

export default function Promo() {
  const [beatIdx, setBeatIdx] = useState(0);
  const [year, setYear] = useState(1950);
  const yearRef = useRef(1950);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));

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

  return (
    <div
      style={{
        width: STAGE_W,
        height: STAGE_H,
        margin: "24px auto",
        background: COLORS.paper,
        outline: `1px solid ${COLORS.muted}33`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header — same optical cut and tracking as the page h1 */}
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

      {/* caption band + ticking readout, ABOVE the chart: feed viewers read
          top-down, and LinkedIn's own progress bar covers the bottom edge */}
      <div
        style={{
          minHeight: 100,
          padding: "10px 24px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <AnimatePresence mode="wait">
          {beat.caption && (
            <motion.p
              key={beat.caption}
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
              {beat.caption}
            </motion.p>
          )}
        </AnimatePresence>
        {beat.scene === "pyr" && r && (
          <p
            style={{
              marginTop: 8,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: COLORS.accent,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.ratio.toFixed(1)} AGED 20&ndash;64 PER PERSON 65+
          </p>
        )}
      </div>

      {/* chart area */}
      <div style={{ flex: 1, position: "relative" }}>
        {beat.scene === "pyr" && (
          <Pyramid
            year={year}
            width={STAGE_W}
            height={520}
            margins={CHART_MARGINS}
            showAnnotations={true}
            yearOpacity={0.3}
          />
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
            <div style={{ marginTop: 40, fontSize: 12, color: COLORS.muted }}>
              Data: UN World Population Prospects 2024
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
