import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SkillInfo } from "@/types/skill";

interface SkillsState {
  skills: SkillInfo[];
  isLoading: boolean;
  lastChecked: number | null;
  error: string | null;

  fetch: () => Promise<void>;
}

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  isLoading: false,
  lastChecked: null,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const skills = await invoke<SkillInfo[]>("list_skills");
      set({ skills, isLoading: false, lastChecked: Date.now() });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
