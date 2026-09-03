import * as d3 from "d3";
import variants from "../data/migration-variants.json";
import { COLORS } from "../tokens";

// one future year, with and without migration.
// solid bars = population without migration (eurostat NMIGR variant).
// rust segment on top = what the baseline adds: migration and its children.

const MARGIN = { top: 40, right: 240, bottom: 32, left: 44 };

export const MigrationPyramid = ({ year = 2060, width, height, margins = MARGIN, showAnnotation = true }) => {
  if (width === 0 || height === 0) return null;

  const data = variants[year]; // per age: [[bsl_m, bsl_f], [nm_m, nm_f]]
  if (!data) return null;

  const boundsWidth = width - margins.left - margins.right;
  const boundsHeight = height - margins.top - margins.bottom;
  const center = boundsWidth / 2;

  const yScale = d3
    .scaleBand()
    .domain(d3.range(101))
    .range([boundsHeight, 0])
    .padding(0.06);

  const maxPop = d3.max(data, ([bsl]) => Math.max(bsl[0], bsl[1]));
  const wScale = d3.scaleLinear().domain([0, maxPop]).range([0, center]);

  const ageTicks = d3.range(0, 101, 10);

  const totalBsl = d3.sum(data, ([b]) => b[0] + b[1]);
  const totalNm = d3.sum(data, ([, n]) => n[0] + n[1]);
  const fmtM = (v) => (v / 1000).toFixed(1) + "M";

  // one half of the chart: sexIdx 0 = male (mirrored), 1 = female
  const Half = ({ sexIdx, mirrored }) => (
    <g transform={`translate(${center}, 0) scale(${mirrored ? -1 : 1}, 1)`}>
      {data.map(([bsl, nm], age) => {
        const base = wScale(nm[sexIdx]); // without migration
        const gap = wScale(bsl[sexIdx]) - base; // added by migration
        return (
          <g key={age}>
            <rect
              x={0}
              y={yScale(age)}
              width={Math.max(base, 0)}
              height={yScale.bandwidth()}
              fill={sexIdx === 0 ? COLORS.male : COLORS.female}
            />
            <rect
              x={Math.max(base, 0)}
              y={yScale(age)}
              width={Math.max(gap, 0)}
              height={yScale.bandwidth()}
              fill={COLORS.accent}
              fillOpacity={0.55}
            />
          </g>
        );
      })}
    </g>
  );

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margins.left}, ${margins.top})`}>
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
              {age}
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

        <Half sexIdx={0} mirrored />
        <Half sexIdx={1} />

        {/* year, same as Pyramid */}
        <text
          x={showAnnotation ? boundsWidth + 216 : boundsWidth}
          y={10}
          textAnchor="end"
          fontSize={48}
          fontWeight={560}
          fill={COLORS.ink}
          opacity={0.14}
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariantNumeric: "tabular-nums" }}
        >
          {year}
        </text>

        {/* the single annotation */}
        {showAnnotation && (
        <g transform={`translate(0, ${yScale(35)})`}>
          <path
            d={`M ${center + wScale(data[35][1][1]) + 8} 0 H ${boundsWidth + 12} L ${boundsWidth + 18} 0`}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={1}
            opacity={0.6}
          />
          <text
            x={boundsWidth + 18}
            y={-1}
            fontSize={13.5}
            fontStyle="italic"
            fill={COLORS.ink}
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            The difference: migration,
          </text>
          <text
            x={boundsWidth + 18}
            y={15}
            fontSize={13.5}
            fontStyle="italic"
            fill={COLORS.ink}
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            and its children
          </text>
          <text x={boundsWidth + 18} y={31} fontSize={8.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.muted}>
            {fmtM(totalBsl)} WITH · {fmtM(totalNm)} WITHOUT
          </text>
        </g>
        )}
      </g>
    </svg>
  );
};
