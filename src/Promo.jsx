import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pyramid } from "./components/Pyramid";
import { COLORS } from "./tokens";
import ratio from "./data/ratio.json";

// LinkedIn promo mode (open with ?promo).
// Stage is 540×675 CSS px → record on a retina screen = 1080×1350 (4:5).
// The timeline drives itself; captions carry the story (silent autoplay).

const STAGE_W = 540;
const STAGE_H = 675;
const CHART_MARGINS = { top: 36, right: 20, bottom: 20, left: 38 };

// Captions must agree with the ticking readout below them — no rounded
// claims the chart itself contradicts. The film now reaches 2100: the urn
// is the strongest frame, and the card promises 1950–2100.
const BEATS = [
  { scene: "pyr", year: 1950, hold: 3400, caption: "In 1950, nearly seven Germans of working age stood behind every person over 65." },
  { scene: "pyr", scrubTo: 2026, ms: 9000, caption: "Then the country grew older." },
  { scene: "pyr", year: 2026, hold: 3500, caption: "Today: 2.4 people of working age per person over 65." },
  { scene: "pyr", scrubTo: 2060, ms: 4500, caption: "Now the Babyboom generation moves into retirement." },
  { scene: "pyr", year: 2060, hold: 2600, caption: "By 2060: 1.7." },
  { scene: "pyr", scrubTo: 2100, ms: 3200, caption: "The century ends in the shape demographers call an urn." },
  { scene: "pyr", year: 2100, hold: 2800, caption: "The century ends in the shape demographers call an urn." },
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
            fontSize: 26,
            fontWeight: 560,
            letterSpacing: "-0.015em",
            fontVariationSettings: "'opsz' 90",
          }}
        >
          Das Umlage-Problem
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted }}>
          Germany&rsquo;s pension math, 1950&ndash;2100
        </div>
      </div>

      {/* chart area */}
      <div style={{ flex: 1, position: "relative" }}>
        {beat.scene === "pyr" && (
          <Pyramid year={year} width={STAGE_W} height={470} margins={CHART_MARGINS} showAnnotations={false} />
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
              Das Umlage-Problem
            </div>
            <div style={{ marginTop: 14, fontSize: 15, color: COLORS.muted }}>
              Germany&rsquo;s pension math, 1950&ndash;2100
            </div>
            <div style={{ marginTop: 40, fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: COLORS.accent }}>
              FULL INTERACTIVE → IN THE COMMENTS
            </div>
            <div style={{ marginTop: 40, fontSize: 12, color: COLORS.muted }}>
              Data: UN World Population Prospects 2024
            </div>
          </motion.div>
        )}
      </div>

      {/* caption band + ticking readout — the counter counting down during
          the scrubs is what holds a silent feed viewer */}
      <div
        style={{
          minHeight: 122,
          padding: "0 26px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
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
                fontSize: 22,
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
              marginTop: 10,
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
    </div>
  );
}
