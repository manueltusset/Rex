import { create } from "zustand";
import { fetchUsage } from "@/services/api";
import { useConnectionStore } from "./useConnectionStore";
import type { UsageWindow } from "@/types/usage";

interface UsageState {
  fiveHour: UsageWindow | null;
  sevenDay: UsageWindow | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;

  fetch: () => Promise<void>;
}

export const useUsageStore = create<UsageState>((set) => ({
  fiveHour: null,
  sevenDay: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetch: async () => {
    const { token, isConnected } = useConnectionStore.getState();
    if (!isConnected || !token) return;

    set({ isLoading: true, error: null });
    try {
      const data = await fetchUsage(token);
      set({
        fiveHour: data.five_hour,
        sevenDay: data.seven_day,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
