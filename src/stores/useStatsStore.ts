import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ProjectMetrics, GlobalStats } from "@/types/stats";

interface StatsState {
  projectMetrics: ProjectMetrics[];
  globalStats: GlobalStats | null;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  projectMetrics: [],
  globalStats: null,
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const [metrics, stats] = await Promise.all([
        invoke<ProjectMetrics[]>("read_project_stats"),
        invoke<GlobalStats>("read_global_stats").catch(() => null),
      ]);
      set({ projectMetrics: metrics, globalStats: stats, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
