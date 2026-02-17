import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUsageStore } from "@/stores/useUsageStore";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { Spinner } from "@/components/ui/Spinner";
import { formatTimeUntil } from "@/utils/formatters";
import { getValue } from "@/services/store";
import type { UsageWindow, ExtraUsage } from "@/types/usage";

const appWindow = getCurrentWindow();

interface UsageCache {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
  sonnetWeekly: UsageWindow | null;
  opusWeekly: UsageWindow | null;
  extraUsage: ExtraUsage | null;
  cachedAt: number;
}

// Cor com threshold: amarelo >=80%, vermelho >=90%
function legendColor(value: number, base: string): string {
  if (value >= 90) return "#ef4444";
  if (value >= 80) return "#f59e0b";
  return base;
}

function LegendRow({
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

  if (!data) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/50 opacity-50">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-muted-subtle flex-1">{label}</span>
        <span className="text-xs text-muted-subtle">--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/50">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-xs text-muted flex-1">{label}</span>
      <span className="text-xs font-bold text-foreground w-10 text-right">
        {used}%
      </span>
      <span className="text-[10px] text-muted-subtle w-20 text-right">
        {data.resets_at ? formatTimeUntil(data.resets_at) : "--"}
      </span>
    </div>
  );
}

export function TrayPage() {
  const { fiveHour, sevenDay, sonnetWeekly, opusWeekly, extraUsage, fetch, isLoading } = useUsageStore();
  const loadFromStore = useConnectionStore((s) => s.loadFromStore);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [ready, setReady] = useState(false);

  useTheme();

  const loadCache = async () => {
    try {
      const cache = await getValue<UsageCache>("usageCache");
      if (cache) {
        useUsageStore.setState({
          fiveHour: cache.fiveHour,
          sevenDay: cache.sevenDay,
          sonnetWeekly: cache.sonnetWeekly ?? null,
          opusWeekly: cache.opusWeekly ?? null,
          extraUsage: cache.extraUsage ?? null,
          lastFetched: cache.cachedAt,
        });
      }
    } catch {
      // Cache nao disponivel
    }
  };

  useEffect(() => {
    Promise.all([loadFromStore(), loadSettings()]).then(async () => {
      await loadCache();
      setReady(true);
      fetch();
    });
  }, []);

  useEffect(() => {
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        loadCache();
        fetch();
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [fetch]);

  const handleExit = async () => {
    await invoke("exit_app");
  };

  const handleOpenDashboard = async () => {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const main = await WebviewWindow.getByLabel("main");
    if (main) {
      await main.show();
      await main.setFocus();
    }
    await appWindow.hide();
  };

  if (!ready || (isLoading && !fiveHour)) {
    return (
      <div className="h-screen p-1.5">
        <div className="flex items-center justify-center h-full bg-bg rounded-2xl">
          <Spinner />
        </div>
      </div>
    );
  }

  // Rings dinamicos (sempre session + weekly, demais se disponiveis)
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
    <div className="h-screen p-1.5 select-none">
    <div className="p-4 bg-bg text-foreground h-full overflow-hidden flex flex-col rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <img src="/rex-logo.png" alt="Rex" className="w-7 h-7" />
          <span className="text-base font-bold font-display">Rex</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={handleExit}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-subtle hover:text-danger hover:bg-danger/5 transition-all cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Activity Rings */}
      <div className="flex items-center justify-center py-4">
        <ActivityRings
          rings={rings}
          size={130}
          strokeWidth={10}
          gap={4}
        />
      </div>

      {/* Legenda */}
      <div className="flex-1 space-y-1.5">
        <LegendRow color="#10b981" label="Session (5h)" data={fiveHour} />
        <LegendRow color="#a78bfa" label="Weekly (7d)" data={sevenDay} />
        <LegendRow color="#60a5fa" label="Sonnet (7d)" data={sonnetWeekly} />
        {opusWeekly && (
          <LegendRow color="#fb923c" label="Opus (7d)" data={opusWeekly} />
        )}
        {extraUsage?.is_enabled && extraUsage.utilization != null && (
          <LegendRow
            color="#f472b6"
            label="Extra Usage"
            data={{ utilization: extraUsage.utilization, resets_at: null }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-border-subtle text-center">
        <p className="text-[10px] text-muted-subtle font-mono">
          Rex Companion
        </p>
      </div>
    </div>
    </div>
  );
}
