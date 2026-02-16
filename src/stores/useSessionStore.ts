import { create } from "zustand";
import { listSessions, resumeSession } from "@/services/api";
import { useConnectionStore } from "./useConnectionStore";
import type { SessionMeta } from "@/types/session";

interface SessionState {
  sessions: SessionMeta[];
  isLoading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  resume: (sessionId: string, projectPath: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const { claudeDir, useWsl, wslDistro, isConnected } = useConnectionStore.getState();
    if (!isConnected || !claudeDir) return;

    set({ isLoading: true, error: null });
    try {
      const sessions = await listSessions(claudeDir, useWsl, wslDistro || undefined);
      set({ sessions, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  resume: async (sessionId: string, projectPath: string) => {
    const { useWsl, wslDistro } = useConnectionStore.getState();
    console.log("[Rex] resume:", { sessionId, projectPath, useWsl, wslDistro });
    await resumeSession(sessionId, projectPath, useWsl, wslDistro || undefined);
  },
}));
