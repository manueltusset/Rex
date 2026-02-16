import { create } from "zustand";
import { getValue, setValue } from "@/services/store";

interface SettingsState {
  refreshInterval: number;
  loadSettings: () => Promise<void>;
  setRefreshInterval: (ms: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  refreshInterval: 60000,

  loadSettings: async () => {
    try {
      const interval = await getValue<number>("refreshInterval");
      if (interval) set({ refreshInterval: interval });
    } catch {
      // Fallback para default
    }
  },

  setRefreshInterval: async (ms: number) => {
    set({ refreshInterval: ms });
    await setValue("refreshInterval", ms);
  },
}));
