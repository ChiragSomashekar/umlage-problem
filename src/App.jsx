import { useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Pyramid } from "./components/Pyramid";
import { useDimensions } from "./hooks/use-dimensions";
import ratio from "./data/ratio.json";

// wide screens get the annotation gutter on the right, narrow ones drop it and rely on the captions
const WIDE = 700;
const GUTTER_MARGINS = { top: 40, right: 240, bottom: 32, left: 44 };
const COMPACT_MARGINS = { top: 40, right: 20, bottom: 28, left: 38 };

// captions per year range, same text as the promo film. the year cutoffs have
// to match the readout below: the ratio first rounds to 2 in 2025 and the last
// boomers (born 1969) are retired by 2036.
const captionFor = (year) => {
  if (year < 1958) return "In 1950, nearly seven Germans of working age stood behind every person over 65.";
  if (year < 2025) return "Then the country grew older.";
  if (year < 2036) return "Now the Babyboom generation moves into retirement.";
  if (year < 2070) return "The boom has retired. The ratio stays below two.";
  return "By century’s end, the pyramid takes the shape demographers call an urn.";
};

export default function App() {
  const [year, setYear] = useState(1950);
  const chartRef = useRef(null);
  const { width: chartW } = useDimensions(chartRef);

  const isWide = chartW >= WIDE;
  const chartH = isWide
    ? Math.min(560, Math.round(chartW * 0.57))
    : Math.round(chartW * 1.05); // phones: taller than wide

  const r = ratio.find((d) => d.year === year);
  const caption = captionFor(year);

  return (
    <MotionConfig reducedMotion="user">
    <main>
      <div className="stage">
        <header className="stage-head">
          <h1>The Umlage Problem</h1>
          <p className="subtitle">Germany&rsquo;s pension math, 1950&ndash;2100</p>
          <p className="dek">
            The Umlage is Germany&rsquo;s pay-as-you-go pension system:
            today&rsquo;s workers fund today&rsquo;s pensioners. Drag through
            150 years of it.
          </p>
        </header>

        <div className="slider-row">
          <span className="slider-year">1950</span>
          <input
            type="range"
            min={1950}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
            aria-valuetext={`${year}: ${r ? r.ratio.toFixed(1) : ""} people aged 20 to 64 per person 65 and older`}
          />
          <span className="slider-year">2100</span>
        </div>

        {/* caption sits above the chart, right under the slider where you look while scrubbing */}
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
              {r.ratio.toFixed(1)} AGED 20&ndash;64 PER PERSON 65+ &middot; {(r.total / 1000).toFixed(1)}M PEOPLE
            </p>
          )}
        </div>

        <div ref={chartRef}>
          <Pyramid
            year={year}
            width={chartW}
            height={chartH}
            margins={isWide ? GUTTER_MARGINS : COMPACT_MARGINS}
            showAnnotations={isWide}
          />
        </div>

        <p className="source">
          Data: UN World Population Prospects 2024, medium variant; years after
          2024 are projections. Ratio = residents aged 20&ndash;64 per resident
          65+, own calculation, not the pension scheme&rsquo;s contributor ratio.
        </p>
      </div>
    </main>
    </MotionConfig>
  );
}
