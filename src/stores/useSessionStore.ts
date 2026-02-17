import { create } from "zustand";
import { listSessions, resumeSession, searchSessions } from "@/services/api";
import { useConnectionStore } from "./useConnectionStore";
import type { SessionMeta, SearchMatch } from "@/types/session";

interface SessionState {
  sessions: SessionMeta[];
  isLoading: boolean;
  error: string | null;

  searchResults: SearchMatch[];
  isSearching: boolean;

  fetch: () => Promise<void>;
  resume: (sessionId: string, projectPath: string) => Promise<void>;
  searchInContent: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  isLoading: false,
  error: null,

  searchResults: [],
  isSearching: false,

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
    await resumeSession(sessionId, projectPath, useWsl, wslDistro || undefined);
  },

  searchInContent: async (query: string) => {
    const { claudeDir, useWsl, wslDistro, isConnected } = useConnectionStore.getState();
    if (!isConnected || !claudeDir || query.length < 2) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    set({ isSearching: true });
    try {
      const results = await searchSessions(claudeDir, query, useWsl, wslDistro || undefined);
      set({ searchResults: results, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], isSearching: false });
  },
}));
