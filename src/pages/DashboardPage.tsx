import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SessionList } from "@/components/dashboard/SessionList";
import {
  useStatsData,
  StatCard,
  DailyActivityChart,
  TokensByModelChart,
  HourHeatmap,
  ModelBreakdown,
} from "@/components/dashboard/StatsOverview";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonRings } from "@/components/ui/Skeleton";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useMcpStore } from "@/stores/useMcpStore";
import { UsageLegendRow } from "@/components/ui/UsageLegendRow";
import { formatNumber, formatCurrency, formatDuration, formatDate } from "@/utils/formatters";
import { ROUTES, APP_VERSION } from "@/utils/constants";

export function DashboardPage() {
  const { fiveHour, sevenDay, sonnetWeekly, opusWeekly, extraUsage, isLoading: usageLoading, fetch: fetchUsage } = useUsageStore();
  const { fetch: fetchSessions } = useSessionStore();
  const { servers: mcpServers, fetch: fetchMcp } = useMcpStore();
  const stats = useStatsData();

  useEffect(() => {
    fetchMcp();
  }, [fetchMcp]);

  const handleRefresh = () => {
    fetchUsage(true);
    fetchSessions();
    fetchMcp();
  };

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
      {/* Header */}
      <AnimateIn>
        <header className="flex justify-between items-end mb-6">
          <div>
            <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
              System Overview
            </p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Dashboard
            </h2>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleRefresh}>
              {usageLoading ? (
                <Spinner size="sm" />
              ) : (
                <Icon name="refresh" size="sm" />
              )}
              Refresh
            </Button>
          </div>
        </header>
      </AnimateIn>

      {/* Bento Grid - Row 1: Rings + Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {/* Usage Rings -- 2 colunas, 2 linhas */}
        <AnimateIn delay={80} className="col-span-1 md:col-span-2 md:row-span-2">
          <Card variant="hero" className="h-full">
            <div className="flex flex-col items-center gap-4 h-full justify-center">
              {usageLoading && !fiveHour ? (
                <SkeletonRings />
              ) : (
                <ActivityRings
                  rings={rings}
                  size={160}
                  strokeWidth={11}
                  gap={5}
                />
              )}
              <div className="w-full space-y-1">
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

        {/* Stat cards -- sub-grid 2x2 alinhado com o hero */}
        {stats.globalStats && (
          <div className="col-span-1 md:col-span-2 md:row-span-2 grid grid-cols-2 grid-rows-2 gap-4">
            <AnimateIn delay={120} className="h-full">
              <StatCard icon="chat" label="Sessions" value={formatNumber(stats.globalStats.totalSessions)} className="h-full" />
            </AnimateIn>
            <AnimateIn delay={160} className="h-full">
              <StatCard icon="forum" label="Messages" value={formatNumber(stats.globalStats.totalMessages)} className="h-full" />
            </AnimateIn>
            <AnimateIn delay={200} className="h-full">
              <StatCard icon="payments" label="Total Cost" value={stats.totalCost > 0 ? formatCurrency(stats.totalCost) : "--"} className="h-full" />
            </AnimateIn>
            <AnimateIn delay={240} className="h-full">
              {stats.peakHour ? (
                <StatCard icon="schedule" label="Peak Hour" value={stats.peakHour} className="h-full" />
              ) : stats.longestSession?.duration ? (
                <StatCard icon="timer" label="Longest" value={formatDuration(stats.longestSession.duration)} className="h-full" />
              ) : (
                <StatCard icon="calendar_today" label="Since" value={formatDate(stats.globalStats.firstSessionDate)} className="h-full" />
              )}
            </AnimateIn>
          </div>
        )}
      </div>

      {/* Bento Grid - Row 2: Charts */}
      {(stats.activityData.length > 0 || stats.tokenData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {stats.activityData.length > 0 && (
            <AnimateIn delay={280} className="col-span-1 md:col-span-2">
              <Card className="h-full">
                <DailyActivityChart data={stats.activityData} />
              </Card>
            </AnimateIn>
          )}
          {stats.tokenData.length > 0 && stats.allModelNames.length > 0 && (
            <AnimateIn delay={320} className="col-span-1 md:col-span-2">
              <Card className="h-full">
                <TokensByModelChart
                  data={stats.tokenData}
                  modelNames={stats.allModelNames}
                  colorMap={stats.colorMap}
                />
              </Card>
            </AnimateIn>
          )}
        </div>
      )}

      {/* Bento Grid - Row 3: Heatmap + MCP */}
      {(stats.globalStats?.hourCounts || mcpServers.length > 0 || stats.modelBreakdown.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {stats.globalStats?.hourCounts && Object.keys(stats.globalStats.hourCounts).length > 0 && (
            <AnimateIn delay={360} className="col-span-1 md:col-span-2">
              <Card className="h-full">
                <HourHeatmap hourCounts={stats.globalStats.hourCounts} />
              </Card>
            </AnimateIn>
          )}
          {mcpServers.length > 0 ? (
            <AnimateIn delay={400} className="col-span-1 md:col-span-2">
              <Card variant="accent" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="hub" size="sm" className="text-muted" />
                    <h3 className="text-sm font-bold text-foreground">MCP Servers</h3>
                    <span className="text-xs text-muted-subtle">
                      {mcpServers.filter((s) => s.status === "ok").length}/{mcpServers.length}
                    </span>
                  </div>
                  <Link
                    to={ROUTES.MCP}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-1">
                  {mcpServers.map((server) => (
                    <div
                      key={`${server.scope}-${server.name}-${server.project_path ?? ""}`}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface/50"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          server.status === "ok"
                            ? "bg-primary"
                            : server.status === "error"
                              ? "bg-danger"
                              : "bg-muted-subtle"
                        }`}
                      />
                      <span className="text-xs text-foreground">{server.name}</span>
                      <span className="text-[10px] text-muted-subtle font-mono">{server.server_type}</span>
                      {server.status === "error" && server.error_message && (
                        <span className="text-[10px] text-danger truncate ml-auto">{server.error_message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </AnimateIn>
          ) : stats.modelBreakdown.length > 0 ? (
            <AnimateIn delay={400} className="col-span-1 md:col-span-2">
              <Card className="h-full">
                <ModelBreakdown models={stats.modelBreakdown} colorMap={stats.colorMap} />
              </Card>
            </AnimateIn>
          ) : null}
        </div>
      )}

      {/* Sessions -- full width */}
      <AnimateIn delay={440}>
        <SessionList />
      </AnimateIn>

      {/* Footer */}
      <AnimateIn delay={480}>
        <footer className="mt-6 flex justify-between items-center text-xs text-muted-subtle font-mono pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <p>Rex v{APP_VERSION} - Connected to Anthropic API</p>
          </div>
        </footer>
      </AnimateIn>
    </>
  );
}
