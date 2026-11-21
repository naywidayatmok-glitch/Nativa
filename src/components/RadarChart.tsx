import { NATIVA_PATTERNS } from "../data/nativaQuestions.ts";

interface RadarChartProps {
  scores: number[];
  compareScores?: number[];
  primaryLabel?: string;
  compareLabel?: string;
  className?: string;
}

export function RadarChart({
  scores,
  compareScores,
  primaryLabel = "Terbaru",
  compareLabel = "Awal",
  className = "",
}: RadarChartProps) {
  const vals = NATIVA_PATTERNS.map((_, i) =>
    Math.max(0, Math.min(100, Number(scores[i] || 0)))
  );
  const compVals = compareScores
    ? NATIVA_PATTERNS.map((_, i) =>
        Math.max(0, Math.min(100, Number(compareScores[i] || 0)))
      )
    : null;

  const cx = 250;
  const cy = 220;
  const R = 140;
  const angles = NATIVA_PATTERNS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);

  const point = (r: number, angle: number): [number, number] => [
    cx + r * Math.cos(angle),
    cy + r * Math.sin(angle),
  ];

  const polygonPoints = (scaleVals: number[]) =>
    scaleVals
      .map((v, i) => {
        const [x, y] = point((R * v) / 100, angles[i]);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox="0 0 500 440"
        className="block w-full h-auto max-h-[340px] mx-auto overflow-visible"
        role="img"
        aria-label="Grafik radar lima pola NATIVA"
      >
        {/* Concentric pentagon grid */}
        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={polygonPoints(NATIVA_PATTERNS.map(() => lvl))}
            fill="none"
            stroke={lvl === 100 ? "#C4D4CA" : "#DFE8E2"}
            strokeWidth={lvl === 100 ? 1.25 : 1}
          />
        ))}

        {/* Scale ring markers along top axis */}
        {[40, 80].map((lvl) => {
          const [x, y] = point((R * lvl) / 100, angles[0]);
          return (
            <text
              key={lvl}
              x={x + 6}
              y={y + 3}
              fontSize="9.5"
              fill="#83948A"
              fontFamily="JetBrains Mono, monospace"
            >
              {lvl}
            </text>
          );
        })}

        {/* Axis lines */}
        {angles.map((angle, idx) => {
          const [x, y] = point(R, angle);
          return (
            <line
              key={NATIVA_PATTERNS[idx]}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#D2DDD6"
              strokeWidth="1"
            />
          );
        })}

        {/* Optional baseline comparison polygon */}
        {compVals && (
          <>
            <polygon
              points={polygonPoints(compVals)}
              fill="#2368A9"
              fillOpacity="0.10"
              stroke="#2368A9"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {compVals.map((v, i) => {
              const [x, y] = point((R * v) / 100, angles[i]);
              return (
                <circle
                  key={`comp-${NATIVA_PATTERNS[i]}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#2368A9"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              );
            })}
          </>
        )}

        {/* Primary polygon */}
        <polygon
          points={polygonPoints(vals)}
          fill="#1E713B"
          fillOpacity="0.18"
          stroke="#1E713B"
          strokeWidth="2.75"
          strokeLinejoin="round"
        />

        {/* Primary data dots */}
        {vals.map((v, i) => {
          const [x, y] = point((R * v) / 100, angles[i]);
          return (
            <circle
              key={`dot-${NATIVA_PATTERNS[i]}`}
              cx={x}
              cy={y}
              r="5"
              fill="#1E713B"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          );
        })}

        {/* Axis labels & scores */}
        {NATIVA_PATTERNS.map((pattern, i) => {
          const [x, y] = point(R + 36, angles[i]);
          const anchor = x < cx - 14 ? "end" : x > cx + 14 ? "start" : "middle";
          const yOffset = i === 0 ? -8 : 0;
          return (
            <g key={pattern}>
              <text
                x={x}
                y={y + yOffset}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="13.5"
                fontWeight="700"
                fill="#173D2E"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {pattern}
              </text>
              <text
                x={x}
                y={y + yOffset + 17}
                textAnchor={anchor}
                fontSize="11.5"
                fontWeight="500"
                fill="#5A6E63"
                fontFamily="JetBrains Mono, monospace"
              >
                {compVals
                  ? `${compVals[i].toFixed(1)} → ${vals[i].toFixed(1)}`
                  : vals[i].toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {compVals && (
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-[#54675D]">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-[#2368A9]" />
            {compareLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-[#1E713B]" />
            {primaryLabel}
          </span>
        </div>
      )}
    </div>
  );
}
