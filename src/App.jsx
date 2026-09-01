import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pyramid } from "./components/Pyramid";
import { useDimensions } from "./hooks/use-dimensions";
import ratio from "./data/ratio.json";

// Wide screens get the annotation gutter; narrow ones drop it — the era
// captions carry the story there (M5 design ladder, decided in advance).
const WIDE = 700;
const GUTTER_MARGINS = { top: 40, right: 240, bottom: 32, left: 44 };
const COMPACT_MARGINS = { top: 40, right: 20, bottom: 28, left: 38 };

// Era captions — same narrative voice as the promo film, driven by the slider.
const captionFor = (year) => {
  if (year < 1958) return "In 1950, seven German workers stood behind every pensioner.";
  if (year < 2011) return "Then the country grew older.";
  if (year < 2036) return "Today: two workers per pensioner.";
  if (year < 2070) return "And the Babyboomers are only beginning to retire.";
  return "By century's end, the pyramid is an urn.";
};

export default function App() {
  const [year, setYear] = useState(1950);
  const chartRef = useRef(null);
  const { width: chartW } = useDimensions(chartRef);

  const isWide = chartW >= WIDE;
  const chartH = isWide
    ? Math.min(560, Math.round(chartW * 0.57))
    : Math.round(chartW * 1.05); // phones: taller than wide, like the promo

  const r = ratio.find((d) => d.year === year);
  const caption = captionFor(year);

  return (
    <main>
      <div className="stage">
        <header className="stage-head">
          <h1>Das Umlage-Problem</h1>
          <p className="subtitle">Germany&apos;s pension math, 1950&ndash;2100</p>
        </header>

        <input
          type="range"
          min={1950}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="Year"
        />

        <div ref={chartRef}>
          <Pyramid
            year={year}
            width={chartW}
            height={chartH}
            margins={isWide ? GUTTER_MARGINS : COMPACT_MARGINS}
            showAnnotations={isWide}
          />
        </div>

        <div className="caption-band">
          <AnimatePresence mode="wait">
            <motion.p
              key={caption}
              className="caption"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {caption}
            </motion.p>
          </AnimatePresence>
          {r && (
            <p className="ratio-readout">
              {r.ratio.toFixed(1)} WORKERS PER PENSIONER &middot; {(r.total / 1000).toFixed(1)}M PEOPLE
            </p>
          )}
        </div>

        <p className="source">
          Data: UN World Population Prospects 2024, medium variant. Years after
          2024 are projections. Workers = ages 20&ndash;64, pensioners = 65+
          (own calculation).
        </p>
      </div>
    </main>
  );
}
