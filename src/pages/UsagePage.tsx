import { ActivityRings } from "@/components/ui/ActivityRings";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useUsageStore } from "@/stores/useUsageStore";
import { formatTimeUntil } from "@/utils/formatters";
import type { UsageWindow } from "@/types/usage";

function legendColor(value: number, base: string): string {
  if (value >= 90) return "#ef4444";
  if (value >= 80) return "#f59e0b";
  return base;
}

function statusBadge(used: number) {
  if (used >= 90) return { label: "CRITICAL", cls: "bg-danger/10 text-danger border-danger/20" };
  if (used >= 80) return { label: "NEAR LIMIT", cls: "bg-rex-accent/10 text-rex-accent border-rex-accent/20" };
  return { label: "NORMAL", cls: "bg-ring-bg text-muted border-border" };
}

function UsageLegendRow({
  color,
  label,
  data,
}: {
  color: string;
  label: string;
  data: UsageWindow | null;
}) {
  const used = data ? Math.round(data.utilization) : 0;
  const dotColor = data ? legendColor(used, color) : color;
  const badge = statusBadge(used);

  if (!data) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface/50 opacity-50">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-muted-subtle flex-1">{label}</span>
        <span className="text-sm text-muted-subtle">--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface/50">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <span className="text-sm text-muted flex-1">{label}</span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.cls}`}>
        {badge.label}
      </span>
      <span className="text-sm font-bold text-foreground w-12 text-right">
        {used}%
      </span>
      <span className="text-xs text-muted-subtle w-20 text-right">
        {data.resets_at ? formatTimeUntil(data.resets_at) : "--"}
      </span>
    </div>
  );
}

export function UsagePage() {
  const { fiveHour, sevenDay, sonnetWeekly, opusWeekly, extraUsage, isLoading, lastFetched, error } = useUsageStore();

  // Rings dinamicos
  const rings = [
    { value: fiveHour?.utilization ?? 0, color: "#10b981" },
    { value: sevenDay?.utilization ?? 0, color: "#a78bfa" },
  ];
  if (sonnetWeekly) rings.push({ value: sonnetWeekly.utilization, color: "#60a5fa" });
  if (opusWeekly) rings.push({ value: opusWeekly.utilization, color: "#fb923c" });
  if (extraUsage?.is_enabled && extraUsage.utilization != null) {
    rings.push({ value: extraUsage.utilization, color: "#f472b6" });
  }

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-light/70 mb-1 font-mono tracking-wide uppercase">
          Rate Limits
        </p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Usage & Limits
        </h2>
      </header>

      {error && (
        <Card className="mb-6 border-danger/30">
          <div className="flex items-center gap-3 text-danger">
            <Icon name="error" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Usage Overview */}
      <Card className="mb-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center justify-center shrink-0">
            {isLoading && !fiveHour ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ActivityRings
                rings={rings}
                size={180}
                strokeWidth={12}
                gap={5}
              />
            )}
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <UsageLegendRow color="#10b981" label="Session (5h)" data={fiveHour} />
            <UsageLegendRow color="#a78bfa" label="Weekly (7d)" data={sevenDay} />
            <UsageLegendRow color="#60a5fa" label="Sonnet (7d)" data={sonnetWeekly} />
            {opusWeekly && (
              <UsageLegendRow color="#fb923c" label="Opus (7d)" data={opusWeekly} />
            )}
            {extraUsage?.is_enabled && extraUsage.utilization != null && (
              <UsageLegendRow
                color="#f472b6"
                label="Extra Usage"
                data={{ utilization: extraUsage.utilization, resets_at: null }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Detalhes */}
      <Card>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon name="info" className="text-primary-light" />
          Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">5h Window Reset</span>
            <span className="text-foreground font-mono">
              {fiveHour ? formatTimeUntil(fiveHour.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">7d Window Reset</span>
            <span className="text-foreground font-mono">
              {sevenDay ? formatTimeUntil(sevenDay.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">Sonnet 7d Reset</span>
            <span className="text-foreground font-mono">
              {sonnetWeekly ? formatTimeUntil(sonnetWeekly.resets_at) : "--"}
            </span>
          </div>
          {opusWeekly && (
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Opus 7d Reset</span>
              <span className="text-foreground font-mono">
                {formatTimeUntil(opusWeekly.resets_at)}
              </span>
            </div>
          )}
          {extraUsage?.is_enabled && (
            <>
              {extraUsage.monthly_limit != null && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Monthly Limit</span>
                  <span className="text-foreground font-mono">
                    ${(extraUsage.monthly_limit / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {extraUsage.used_credits != null && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Used Credits</span>
                  <span className="text-foreground font-mono">
                    ${(extraUsage.used_credits / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between py-2">
            <span className="text-muted">Last Updated</span>
            <span className="text-foreground font-mono">
              {lastFetched
                ? new Date(lastFetched).toLocaleTimeString()
                : "--"}
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}
