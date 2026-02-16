import { useEffect } from "react";
import { useUsageStore } from "@/stores/useUsageStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function useAutoRefresh() {
  const fetchUsage = useUsageStore((s) => s.fetch);
  const fetchSessions = useSessionStore((s) => s.fetch);
  const refreshInterval = useSettingsStore((s) => s.refreshInterval);

  useEffect(() => {
    fetchUsage();
    fetchSessions();

    const interval = setInterval(() => {
      fetchUsage();
      fetchSessions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchUsage, fetchSessions]);
}
