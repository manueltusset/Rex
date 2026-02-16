import { create } from "zustand";
import { getValue, setValue } from "@/services/store";
import type { Theme } from "@/hooks/useTheme";

interface SettingsState {
  refreshInterval: number;
  notificationsEnabled: boolean;
  theme: Theme;
  loadSettings: () => Promise<void>;
  setRefreshInterval: (ms: number) => Promise<void>;
  setNotificationsEnabled: (val: boolean) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  refreshInterval: 60000,
  notificationsEnabled: true,
  theme: "dark",

  loadSettings: async () => {
    try {
      const interval = await getValue<number>("refreshInterval");
      const notif = await getValue<boolean>("notificationsEnabled");
      const theme = await getValue<Theme>("theme");
      if (interval) set({ refreshInterval: interval });
      if (notif !== undefined && notif !== null) set({ notificationsEnabled: notif });
      if (theme) set({ theme });
    } catch {
      // Fallback para default
    }
  },

  setRefreshInterval: async (ms: number) => {
    set({ refreshInterval: ms });
    await setValue("refreshInterval", ms);
  },

  setNotificationsEnabled: async (val: boolean) => {
    set({ notificationsEnabled: val });
    await setValue("notificationsEnabled", val);
  },

  setTheme: async (theme: Theme) => {
    set({ theme });
    await setValue("theme", theme);
  },
}));
