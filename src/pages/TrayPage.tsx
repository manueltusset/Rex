import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUsageStore } from "@/stores/useUsageStore";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { Spinner } from "@/components/ui/Spinner";
import { formatTimeUntil } from "@/utils/formatters";
import { getValue } from "@/services/store";
import type { UsageWindow } from "@/types/usage";

const appWindow = getCurrentWindow();

interface UsageCache {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
  sonnetWeekly: UsageWindow | null;
  cachedAt: number;
}

interface TrayCardProps {
  label: string;
  data: UsageWindow | null;
  colorClass: string;
}

function TrayCard({ label, data, colorClass }: TrayCardProps) {
  const used = data ? Math.round(data.utilization) : 0;

  // Cor do circulo: cor fixa do card, mas muda para amarelo/vermelho em thresholds altos
  const effectiveColor =
    used >= 90 ? "text-danger" : used >= 80 ? "text-rex-accent" : colorClass;

  if (!data) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border opacity-50">
        <p className="text-[10px] text-muted-subtle uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-muted-subtle mt-1">No data</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border hover:border-border-subtle transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-subtle uppercase tracking-wider font-medium mb-1.5">
            {label}
          </p>
          <p className="text-2xl font-bold font-display leading-none">{used}%</p>
          <p className="text-[11px] text-muted-subtle mt-1.5">
            {data.resets_at ? `Resets ${formatTimeUntil(data.resets_at)}` : "--"}
          </p>
        </div>
        <CircularProgress
          value={used}
          size={56}
          strokeWidth={2.5}
          colorClass={effectiveColor}
        />
      </div>
    </div>
  );
}

export function TrayPage() {
  const { fiveHour, sevenDay, sonnetWeekly, fetch, isLoading } = useUsageStore();
  const loadFromStore = useConnectionStore((s) => s.loadFromStore);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [ready, setReady] = useState(false);

  useTheme();

  // Carrega cache do store compartilhado
  const loadCache = async () => {
    try {
      const cache = await getValue<UsageCache>("usageCache");
      if (cache) {
        useUsageStore.setState({
          fiveHour: cache.fiveHour,
          sevenDay: cache.sevenDay,
          sonnetWeekly: cache.sonnetWeekly ?? null,
          lastFetched: cache.cachedAt,
        });
      }
    } catch {
      // Cache nao disponivel
    }
  };

  // Init: carrega store, cache e faz fetch
  useEffect(() => {
    Promise.all([loadFromStore(), loadSettings()]).then(async () => {
      await loadCache();
      setReady(true);
      fetch();
    });
  }, []);

  // Refresh ao reabrir popup (show/hide reutiliza a mesma janela)
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

  return (
    <div className="h-screen p-1.5 select-none">
    <div className="p-4 bg-bg text-foreground h-full overflow-hidden flex flex-col rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Cards */}
      <div className="flex-1 space-y-2.5">
        <TrayCard label="Session (5h)" data={fiveHour} colorClass="text-usage-session" />
        <TrayCard label="Weekly (7d)" data={sevenDay} colorClass="text-usage-weekly" />
        <TrayCard label="Sonnet (7d)" data={sonnetWeekly} colorClass="text-usage-sonnet" />
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-2.5 border-t border-border-subtle text-center">
        <p className="text-[10px] text-muted-subtle font-mono">
          Rex Companion
        </p>
      </div>
    </div>
    </div>
  );
}
