/** PROTOTYPE — minimal SVG line for layout density, not a chart library. */

import type { PrototypeEntry } from "./mock-data";

export function RsLine({
  entries,
  height = 160,
  className,
}: {
  entries: PrototypeEntry[];
  height?: number;
  className?: string;
}) {
  const width = 600;
  const pad = 12;
  const rsValues = entries.map((e) => e.rs);
  const min = Math.min(...rsValues);
  const max = Math.max(...rsValues);
  const span = Math.max(max - min, 1);

  const points = entries
    .map((entry, i) => {
      const x = pad + (i / Math.max(entries.length - 1, 1)) * (width - pad * 2);
      const y = pad + (1 - (entry.rs - min) / span) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="RS line chart for this Season"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      {entries.map((entry, i) => {
        const x = pad + (i / Math.max(entries.length - 1, 1)) * (width - pad * 2);
        const y = pad + (1 - (entry.rs - min) / span) * (height - pad * 2);
        return <circle key={entry.id} cx={x} cy={y} r="4" fill="currentColor" />;
      })}
    </svg>
  );
}
