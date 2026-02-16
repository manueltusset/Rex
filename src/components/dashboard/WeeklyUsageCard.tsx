import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { formatTimeUntil } from "@/utils/formatters";

interface WeeklyUsageCardProps {
  utilization: number;
  resetsAt: string | null;
}

export function WeeklyUsageCard({ utilization, resetsAt }: WeeklyUsageCardProps) {
  const used = Math.round(utilization);
  const colorClass =
    used >= 80 ? "text-rex-accent" : used >= 60 ? "text-primary-light/80" : "text-primary";
  const hoverColor =
    used >= 80 ? "hover:border-rex-accent/30" : "hover:border-primary/30";

  const statusVariant =
    used >= 80 ? "accent" : used >= 50 ? "muted" : "muted";
  const statusLabel =
    used >= 80 ? "NEAR LIMIT" : used >= 50 ? "MODERATE" : "NORMAL";

  return (
    <Card hoverColor={hoverColor}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col justify-between min-h-[100px]">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">
              Weekly Usage (7d)
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white font-display">
                {used}%
              </p>
              <span className="text-sm text-slate-500">consumed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                statusVariant === "accent"
                  ? "bg-rex-accent/10 text-rex-accent border-rex-accent/20"
                  : "bg-slate-800 text-slate-400 border-slate-700/50"
              }`}
            >
              {statusLabel}
            </span>
            <p className="text-xs text-slate-500">
              Resets in {formatTimeUntil(resetsAt)}
            </p>
          </div>
        </div>
        <CircularProgress value={used} colorClass={colorClass} />
      </div>
    </Card>
  );
}
