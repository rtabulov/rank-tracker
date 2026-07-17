import type { Entry } from "@/lib/types";

type RsSparklineProps = {
  entries: Entry[];
  height?: number;
  className?: string;
};

export function RsSparkline({ entries, height = 72, className }: RsSparklineProps) {
  const width = 600;
  const pad = 12;
  const rsValues = entries.map((entry) => entry.rs);
  const min = Math.min(...rsValues);
  const max = Math.max(...rsValues);
  const span = Math.max(max - min, 1);

  const points = entries
    .map((entry, index) => {
      const x = pad + (index / Math.max(entries.length - 1, 1)) * (width - pad * 2);
      const y = pad + (1 - (entry.rs - min) / span) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      {entries.map((entry, index) => {
        const x = pad + (index / Math.max(entries.length - 1, 1)) * (width - pad * 2);
        const y = pad + (1 - (entry.rs - min) / span) * (height - pad * 2);
        return <circle key={entry.id} cx={x} cy={y} r="4" fill="currentColor" />;
      })}
    </svg>
  );
}
