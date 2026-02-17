interface Ring {
  value: number;
  color: string;
}

interface ActivityRingsProps {
  rings: Ring[];
  size: number;
  strokeWidth: number;
  gap: number;
  showCenter?: boolean;
  centerText?: string;
  trackOpacity?: number;
}

// Cor com threshold: amarelo >=80%, vermelho >=90%
function effectiveColor(value: number, baseColor: string): string {
  if (value >= 90) return "#ef4444";
  if (value >= 80) return "#f59e0b";
  return baseColor;
}

export function ActivityRings({
  rings,
  size,
  strokeWidth,
  gap,
  showCenter = false,
  centerText,
  trackOpacity = 0.2,
}: ActivityRingsProps) {
  const center = size / 2;

  // Raios calculados de fora para dentro
  const radii = rings.map((_, i) => {
    let r = (size - strokeWidth) / 2;
    for (let j = 0; j < i; j++) {
      r -= strokeWidth + gap;
    }
    return r;
  });

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ring, i) => {
          const r = radii[i];
          const circumference = 2 * Math.PI * r;
          const offset = circumference - (Math.min(ring.value, 100) / 100) * circumference;
          const color = effectiveColor(ring.value, ring.color);

          return (
            <g key={i}>
              {/* Track */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="transparent"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                opacity={trackOpacity}
              />
              {/* Arco de progresso */}
              {ring.value > 0 && (
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}
      </svg>

      {showCenter && centerText && (
        <span className="absolute text-lg font-bold text-foreground">
          {centerText}
        </span>
      )}
    </div>
  );
}
