import { useEffect, useCallback, useRef } from "react";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useMcpStore } from "@/stores/useMcpStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { useStatsStore } from "@/stores/useStatsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function useAutoRefresh() {
  const fetchUsage = useUsageStore((s) => s.fetch);
  const fetchSessions = useSessionStore((s) => s.fetch);
  const fetchMcp = useMcpStore((s) => s.fetch);
  const fetchAccount = useAccountStore((s) => s.fetch);
  const fetchStats = useStatsStore((s) => s.fetch);
  const refreshInterval = useSettingsStore((s) => s.refreshInterval);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(() => {
    fetchUsage();
    fetchSessions();
    fetchMcp();
    fetchAccount();
    fetchStats();
  }, [fetchUsage, fetchSessions, fetchMcp, fetchAccount, fetchStats]);

  useEffect(() => {
    fetchAll();

    intervalRef.current = setInterval(fetchAll, refreshInterval);

    // Pausa polling quando a janela esta oculta, retoma ao restaurar
    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        fetchAll();
        intervalRef.current = setInterval(fetchAll, refreshInterval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshInterval, fetchAll]);
}
