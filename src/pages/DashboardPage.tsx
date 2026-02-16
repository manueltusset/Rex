import { UsageCard } from "@/components/dashboard/UsageCard";
import { WeeklyUsageCard } from "@/components/dashboard/WeeklyUsageCard";
import { SessionList } from "@/components/dashboard/SessionList";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";

export function DashboardPage() {
  const { fiveHour, sevenDay, isLoading: usageLoading, fetch: fetchUsage } = useUsageStore();
  const { sessions, fetch: fetchSessions } = useSessionStore();

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
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {fiveHour ? (
          <UsageCard
            title="Session Limit (5h)"
            utilization={fiveHour.utilization}
            resetsAt={fiveHour.resets_at}
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[100px]">
              {usageLoading ? <Spinner /> : <p className="text-slate-500">No session data</p>}
            </div>
          </Card>
        )}

        {sevenDay ? (
          <WeeklyUsageCard
            utilization={sevenDay.utilization}
            resetsAt={sevenDay.resets_at}
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[100px]">
              {usageLoading ? <Spinner /> : <p className="text-slate-500">No weekly data</p>}
            </div>
          </Card>
        )}

        {/* Terceiro card: sessoes ativas */}
        <Card>
          <div className="flex justify-between items-start">
            <div className="flex flex-col justify-between min-h-[100px]">
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">
                  Active Sessions
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white font-display">
                    {sessions.length}
                  </p>
                  <span className="text-sm text-slate-500">local</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                  {sessions.length > 0 ? "ACTIVE" : "IDLE"}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#1A1D24] border border-border-subtle flex items-center justify-center">
              <Icon name="terminal" className="text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de sessoes */}
      <SessionList />

      {/* Footer */}
      <footer className="mt-8 flex justify-between items-center text-xs text-slate-600 font-mono pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <p>Rex v0.1.0 - Connected to Anthropic API</p>
        </div>
      </footer>
    </>
  );
}
