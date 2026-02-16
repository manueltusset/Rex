import { UsageCard } from "@/components/dashboard/UsageCard";
import { WeeklyUsageCard } from "@/components/dashboard/WeeklyUsageCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useUsageStore } from "@/stores/useUsageStore";
import { formatTimeUntil } from "@/utils/formatters";

export function UsagePage() {
  const { fiveHour, sevenDay, isLoading, lastFetched, error } = useUsageStore();

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-light/70 mb-1 font-mono tracking-wide uppercase">
          Rate Limits
        </p>
        <h2 className="text-3xl font-bold text-white tracking-tight">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {fiveHour ? (
          <UsageCard
            title="Session Limit (5h)"
            utilization={fiveHour.utilization}
            resetsAt={fiveHour.resets_at}
          />
        ) : (
          <Card>
            <div className="flex items-center justify-center min-h-[120px]">
              {isLoading ? <Spinner /> : <p className="text-slate-500">No data</p>}
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
            <div className="flex items-center justify-center min-h-[120px]">
              {isLoading ? <Spinner /> : <p className="text-slate-500">No data</p>}
            </div>
          </Card>
        )}
      </div>

      {/* Detalhes */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="info" className="text-primary-light" />
          Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border-dark">
            <span className="text-slate-400">5h Window Reset</span>
            <span className="text-white font-mono">
              {fiveHour ? formatTimeUntil(fiveHour.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-dark">
            <span className="text-slate-400">7d Window Reset</span>
            <span className="text-white font-mono">
              {sevenDay ? formatTimeUntil(sevenDay.resets_at) : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-dark">
            <span className="text-slate-400">5h Utilization</span>
            <span className="text-white font-mono">
              {fiveHour ? `${Math.round(fiveHour.utilization)}%` : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-dark">
            <span className="text-slate-400">7d Utilization</span>
            <span className="text-white font-mono">
              {sevenDay ? `${Math.round(sevenDay.utilization)}%` : "--"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">Last Updated</span>
            <span className="text-white font-mono">
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
