import { formatTimeUntil } from "@/utils/formatters";
import type { UsageWindow } from "@/types/usage";

// Cor com threshold: amarelo >=80%, vermelho >=90%
export function legendColor(value: number, base: string): string {
  if (value >= 90) return "#ef4444";
  if (value >= 80) return "#f59e0b";
  return base;
}

// Status badge baseado no percentual de uso
export function usageStatus(used: number) {
  if (used >= 90) return { label: "CRITICAL", cls: "bg-danger/10 text-danger border-danger/20" };
  if (used >= 80) return { label: "NEAR LIMIT", cls: "bg-rex-accent/10 text-rex-accent border-rex-accent/20" };
  return { label: "NORMAL", cls: "bg-ring-bg text-muted border-border" };
}

interface UsageLegendRowProps {
  color: string;
  label: string;
  data: UsageWindow | null;
  compact?: boolean;
}

export function UsageLegendRow({ color, label, data, compact = false }: UsageLegendRowProps) {
  const used = data ? Math.round(data.utilization) : 0;
  const dotColor = data ? legendColor(used, color) : color;
  const badge = usageStatus(used);

  if (!data) {
    return (
      <div className={`flex items-center gap-3 px-3 ${compact ? "py-1.5" : "py-2"} rounded-lg bg-surface/50 opacity-50`}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className={`${compact ? "text-xs" : "text-sm"} text-muted-subtle flex-1`}>{label}</span>
        <span className={`${compact ? "text-xs" : "text-sm"} text-muted-subtle`}>--</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 ${compact ? "py-1.5" : "py-2"} rounded-lg bg-surface/50`}>
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <span className={`${compact ? "text-xs" : "text-sm"} text-muted flex-1`}>{label}</span>
      {!compact && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-foreground ${compact ? "w-10" : "w-12"} text-right`}>
        {used}%
      </span>
      <span className={`text-xs text-muted-subtle ${compact ? "w-16" : "w-20"} text-right`}>
        {data.resets_at ? formatTimeUntil(data.resets_at) : "--"}
      </span>
    </div>
  );
}
