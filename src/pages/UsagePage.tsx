import { ActivityRings } from "@/components/ui/ActivityRings";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SkeletonRings } from "@/components/ui/Skeleton";
import { UsageLegendRow } from "@/components/ui/UsageLegendRow";
import { useUsageStore } from "@/stores/useUsageStore";
import { formatTimeUntil } from "@/utils/formatters";

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
      <AnimateIn>
        <header className="mb-8">
          <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
            Rate Limits
          </p>
          <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
            Usage & Limits
          </h2>
        </header>
      </AnimateIn>

      {error && (
        <Card className="mb-6 border-danger/30">
          <div className="flex items-center gap-3 text-danger">
            <Icon name="error" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Usage Overview */}
      <AnimateIn delay={80}>
        <Card className="mb-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center justify-center shrink-0">
              {isLoading && !fiveHour ? (
                <SkeletonRings />
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
      </AnimateIn>

      {/* Detalhes */}
      <AnimateIn delay={160}>
      <Card>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon name="info" className="text-primary-light" />
          Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-muted">5h Window Reset</span>
            <span className="text-foreground font-mono">
              {fiveHour ? formatTimeUntil(fiveHour.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-muted">7d Window Reset</span>
            <span className="text-foreground font-mono">
              {sevenDay ? formatTimeUntil(sevenDay.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-muted">Sonnet 7d Reset</span>
            <span className="text-foreground font-mono">
              {sonnetWeekly ? formatTimeUntil(sonnetWeekly.resets_at) : "--"}
            </span>
          </div>
          {opusWeekly && (
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-muted">Opus 7d Reset</span>
              <span className="text-foreground font-mono">
                {formatTimeUntil(opusWeekly.resets_at)}
              </span>
            </div>
          )}
          {extraUsage?.is_enabled && (
            <>
              {extraUsage.monthly_limit != null && (
                <div className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-muted">Monthly Limit</span>
                  <span className="text-foreground font-mono">
                    ${(extraUsage.monthly_limit / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {extraUsage.used_credits != null && (
                <div className="flex justify-between py-2 border-b border-border-subtle">
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
      </AnimateIn>
    </>
  );
}
