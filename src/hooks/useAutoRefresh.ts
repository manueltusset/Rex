import { useEffect } from "react";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useMcpStore } from "@/stores/useMcpStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function useAutoRefresh() {
  const fetchUsage = useUsageStore((s) => s.fetch);
  const fetchSessions = useSessionStore((s) => s.fetch);
  const fetchMcp = useMcpStore((s) => s.fetch);
  const refreshInterval = useSettingsStore((s) => s.refreshInterval);

  useEffect(() => {
    fetchUsage();
    fetchSessions();
    fetchMcp();

    const interval = setInterval(() => {
      fetchUsage();
      fetchSessions();
      fetchMcp();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchUsage, fetchSessions, fetchMcp]);
}
