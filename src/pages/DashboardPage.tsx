import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SessionList } from "@/components/dashboard/SessionList";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useMcpStore } from "@/stores/useMcpStore";
import { formatTimeUntil } from "@/utils/formatters";
import { ROUTES, APP_VERSION } from "@/utils/constants";
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

export function DashboardPage() {
  const { fiveHour, sevenDay, sonnetWeekly, opusWeekly, extraUsage, isLoading: usageLoading, fetch: fetchUsage } = useUsageStore();
  const { fetch: fetchSessions } = useSessionStore();
  const { servers: mcpServers, fetch: fetchMcp } = useMcpStore();

  useEffect(() => {
    fetchMcp();
  }, [fetchMcp]);

  const handleRefresh = () => {
    fetchUsage();
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
      <header className="flex justify-between items-end mb-10">
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
            Refresh Data
          </Button>
        </div>
      </header>

      {/* Usage Overview */}
      <Card className="mb-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center justify-center shrink-0">
            {usageLoading && !fiveHour ? (
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

      {/* Activity Overview */}
      <StatsOverview />

      {/* MCP Status (compacto) */}
      {mcpServers.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="hub" size="sm" className="text-muted" />
              <h3 className="text-sm font-bold text-foreground">MCP Servers</h3>
              <span className="text-xs text-muted-subtle">
                {mcpServers.filter((s) => s.status === "ok").length}/{mcpServers.length} connected
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
      )}

      {/* Lista de sessoes */}
      <SessionList />

      {/* Footer */}
      <footer className="mt-8 flex justify-between items-center text-xs text-muted-subtle font-mono pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <p>Rex v{APP_VERSION} - Connected to Anthropic API</p>
        </div>
      </footer>
    </>
  );
}
