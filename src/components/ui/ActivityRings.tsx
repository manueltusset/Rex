import { useState, useEffect } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {rings.map((ring, i) => {
          const r = radii[i];
          const circumference = 2 * Math.PI * r;
          const targetOffset = circumference - (Math.min(ring.value, 100) / 100) * circumference;
          const displayOffset = mounted ? targetOffset : circumference;
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
                  strokeDashoffset={displayOffset}
                  strokeLinecap="round"
                  filter={ring.value > 50 ? "url(#ring-glow)" : undefined}
                  style={{
                    transition: `stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 150}ms`,
                  }}
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
