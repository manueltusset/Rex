import { create } from "zustand";
import { getValue, setValue, deleteValue } from "@/services/store";
import { fetchUsage, detectOAuthToken, cliRefreshToken } from "@/services/api";

interface ConnectionState {
  orgId: string;
  token: string;
  claudeDir: string;
  useWsl: boolean;
  isConnected: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  connect: (orgId: string, token: string) => Promise<void>;
  autoConnect: () => Promise<"success" | "not_found" | "expired">;
  disconnect: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setClaudeDir: (dir: string) => Promise<void>;
  setUseWsl: (val: boolean) => Promise<void>;
  loadFromStore: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  orgId: "",
  token: "",
  claudeDir: "",
  useWsl: false,
  isConnected: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  connect: async (orgId: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetchUsage(token);
      set({ orgId, token, isConnected: true, isLoading: false });
      await setValue("orgId", orgId);
      await setValue("token", token);
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },

  autoConnect: async () => {
    set({ isLoading: true, error: null });

    let token: string;
    try {
      token = await detectOAuthToken();
    } catch {
      set({ isLoading: false });
      return "not_found";
    }

    try {
      await fetchUsage(token);
      set({ token, isConnected: true, isLoading: false });
      await setValue("token", token);
      return "success";
    } catch {
      // Token expirado - tenta refresh via Claude CLI
      try {
        const { useWsl } = get();
        const refreshed = await cliRefreshToken(useWsl);
        await fetchUsage(refreshed);
        set({ token: refreshed, isConnected: true, isLoading: false });
        await setValue("token", refreshed);
        return "success";
      } catch {
        set({ isLoading: false });
        return "expired";
      }
    }
  },

  disconnect: async () => {
    set({
      orgId: "",
      token: "",
      isConnected: false,
      claudeDir: "",
      useWsl: false,
    });
    await deleteValue("orgId");
    await deleteValue("token");
    await deleteValue("claudeDir");
    await deleteValue("useWsl");
  },

  // Re-detecta token ou invoca CLI para renovar
  refreshToken: async () => {
    try {
      // Tenta re-ler (CLI pode ter renovado em outro terminal)
      const newToken = await detectOAuthToken();
      const currentToken = get().token;

      if (newToken && newToken !== currentToken) {
        await fetchUsage(newToken);
        set({ token: newToken, error: null });
        await setValue("token", newToken);
        return true;
      }

      // Mesmo token - tenta refresh via CLI
      const { useWsl } = get();
      const refreshed = await cliRefreshToken(useWsl);
      if (refreshed && refreshed !== currentToken) {
        await fetchUsage(refreshed);
        set({ token: refreshed, error: null });
        await setValue("token", refreshed);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  },

  setClaudeDir: async (dir: string) => {
    set({ claudeDir: dir });
    await setValue("claudeDir", dir);
  },

  setUseWsl: async (val: boolean) => {
    set({ useWsl: val });
    await setValue("useWsl", val);
  },

  loadFromStore: async () => {
    try {
      const orgId = (await getValue<string>("orgId")) ?? "";
      const token = (await getValue<string>("token")) ?? "";
      const claudeDir = (await getValue<string>("claudeDir")) ?? "";
      const useWsl = (await getValue<boolean>("useWsl")) ?? false;
      const isConnected = !!token;
      set({ orgId, token, claudeDir, useWsl, isConnected, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
