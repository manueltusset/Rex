import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { formatTimeUntil } from "@/utils/formatters";

interface UsageCardProps {
  title: string;
  utilization: number;
  resetsAt: string | null;
  accentColor: string;
  hoverBorder: string;
}

export function UsageCard({
  title,
  utilization,
  resetsAt,
  accentColor,
  hoverBorder,
}: UsageCardProps) {
  const used = Math.round(utilization);

  // Cor do circulo: usa cor fixa do card, mas muda para amarelo/vermelho em thresholds altos
  const circleColor =
    used >= 90 ? "text-danger" : used >= 80 ? "text-rex-accent" : accentColor;

  // Hover border segue a mesma logica
  const effectiveHover =
    used >= 90 ? "hover:border-danger/30" : used >= 80 ? "hover:border-rex-accent/30" : hoverBorder;

  const statusVariant =
    used >= 90 ? "danger" : used >= 80 ? "accent" : used >= 50 ? "muted" : "muted";
  const statusLabel =
    used >= 90 ? "CRITICAL" : used >= 80 ? "NEAR LIMIT" : used >= 50 ? "MODERATE" : "NORMAL";

  return (
    <Card hoverColor={effectiveHover}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col justify-between min-h-[100px]">
          <div>
            <h3 className="text-muted text-sm font-medium mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground font-display">
                {used}%
              </p>
              <span className="text-sm text-muted-subtle">used</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                statusVariant === "danger"
                  ? "bg-danger/10 text-danger border-danger/20"
                  : statusVariant === "accent"
                    ? "bg-rex-accent/10 text-rex-accent border-rex-accent/20"
                    : "bg-ring-bg text-muted border-border"
              }`}
            >
              {statusLabel}
            </span>
            <p className="text-xs text-muted-subtle">
              Resets in {formatTimeUntil(resetsAt)}
            </p>
          </div>
        </div>
        <CircularProgress value={used} colorClass={circleColor} />
      </div>
    </Card>
  );
}
