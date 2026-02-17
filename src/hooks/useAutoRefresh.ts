import { useEffect } from "react";
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

  useEffect(() => {
    fetchUsage();
    fetchSessions();
    fetchMcp();
    fetchAccount();
    fetchStats();

    const interval = setInterval(() => {
      fetchUsage();
      fetchSessions();
      fetchMcp();
      fetchAccount();
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchUsage, fetchSessions, fetchMcp, fetchAccount, fetchStats]);
}
