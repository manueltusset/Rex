import { UsageCard } from "@/components/dashboard/UsageCard";
import { SessionList } from "@/components/dashboard/SessionList";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";

export function DashboardPage() {
  const { fiveHour, sevenDay, sonnetWeekly, isLoading: usageLoading, fetch: fetchUsage } = useUsageStore();
  const { fetch: fetchSessions } = useSessionStore();

  const handleRefresh = () => {
    fetchUsage();
    fetchSessions();
  };

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

      {/* Cards de uso - 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {fiveHour ? (
          <UsageCard
            title="Session Limit (5h)"
            utilization={fiveHour.utilization}
            resetsAt={fiveHour.resets_at}
            accentColor="text-usage-session"
            hoverBorder="hover:border-usage-session/30"
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[100px]">
              {usageLoading ? <Spinner /> : <p className="text-muted-subtle">No session data</p>}
            </div>
          </Card>
        )}

        {sevenDay ? (
          <UsageCard
            title="Weekly Usage (7d)"
            utilization={sevenDay.utilization}
            resetsAt={sevenDay.resets_at}
            accentColor="text-usage-weekly"
            hoverBorder="hover:border-usage-weekly/30"
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[100px]">
              {usageLoading ? <Spinner /> : <p className="text-muted-subtle">No weekly data</p>}
            </div>
          </Card>
        )}

        {sonnetWeekly ? (
          <UsageCard
            title="Sonnet Limit (7d)"
            utilization={sonnetWeekly.utilization}
            resetsAt={sonnetWeekly.resets_at}
            accentColor="text-usage-sonnet"
            hoverBorder="hover:border-usage-sonnet/30"
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[100px]">
              {usageLoading ? <Spinner /> : <p className="text-muted-subtle">No sonnet data</p>}
            </div>
          </Card>
        )}
      </div>

      {/* Lista de sessoes */}
      <SessionList />

      {/* Footer */}
      <footer className="mt-8 flex justify-between items-center text-xs text-muted-subtle font-mono pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <p>Rex v0.1.0 - Connected to Anthropic API</p>
        </div>
      </footer>
    </>
  );
}
