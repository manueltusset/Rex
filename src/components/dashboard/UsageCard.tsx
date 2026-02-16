import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { formatTimeUntil } from "@/utils/formatters";

interface UsageCardProps {
  title: string;
  utilization: number;
  resetsAt: string | null;
}

export function UsageCard({ title, utilization, resetsAt }: UsageCardProps) {
  const used = Math.round(utilization);
  const remaining = 100 - used;
  const colorClass =
    used >= 80 ? "text-rex-accent" : used >= 60 ? "text-primary-light/80" : "text-primary";
  const hoverColor =
    used >= 80 ? "hover:border-rex-accent/30" : "hover:border-primary/30";

  // Calcula tempo restante baseado na utilizacao (janela 5h)
  const remainingMinutes = Math.round((remaining / 100) * 5 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Card hoverColor={hoverColor}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col justify-between min-h-[100px]">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white font-display">
                {timeDisplay}
              </p>
              <span className="text-sm text-slate-500">left</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
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
