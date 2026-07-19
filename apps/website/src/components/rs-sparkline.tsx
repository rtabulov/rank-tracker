import type { Entry } from "@/lib/types";

type RsSparklineProps = {
  entries: Entry[];
  height?: number;
  className?: string;
  showDots?: boolean;
  showArea?: boolean;
};

export function RsSparkline({
  entries,
  height = 72,
  className,
  showDots = true,
  showArea = false,
}: RsSparklineProps) {
  const width = 600;
  const pad = 12;
  const rsValues = entries.map((entry) => entry.rs);
  const min = Math.min(...rsValues);
  const max = Math.max(...rsValues);
  const span = Math.max(max - min, 1);

  const coords = entries.map((entry, index) => {
    const x = pad + (index / Math.max(entries.length - 1, 1)) * (width - pad * 2);
    const y = pad + (1 - (entry.rs - min) / span) * (height - pad * 2);
    return { x, y, id: entry.id };
  });

  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${pad},${height - pad} ${points} ${width - pad},${height - pad}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      {showArea && <polygon points={area} fill="currentColor" opacity="0.2" />}
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      {showDots &&
        coords.map((c) => <circle key={c.id} cx={c.x} cy={c.y} r="4" fill="currentColor" />)}
    </svg>
  );
}
