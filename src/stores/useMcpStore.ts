import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { notifyMcpStatusChange } from "@/services/notifications";
import type { McpServerStatus } from "@/types/mcp";

interface McpState {
  servers: McpServerStatus[];
  isLoading: boolean;
  lastChecked: number | null;
  error: string | null;

  fetch: () => Promise<void>;
}

export const useMcpStore = create<McpState>((set, get) => ({
  servers: [],
  isLoading: false,
  lastChecked: null,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const servers = await invoke<McpServerStatus[]>("list_mcp_servers");
      const previous = get().servers;

      // Detectar servidores que cairam (ok -> error)
      for (const server of servers) {
        const prev = previous.find(
          (s) => s.name === server.name && s.scope === server.scope,
        );
        if (prev && prev.status === "ok" && server.status === "error") {
          notifyMcpStatusChange(server.name, server.error_message ?? undefined).catch(() => {});
        }
      }

      set({ servers, isLoading: false, lastChecked: Date.now() });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
