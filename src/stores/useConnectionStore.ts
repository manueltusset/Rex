import { create } from "zustand";
import { getValue, setValue, deleteValue } from "@/services/store";
import { fetchUsage, detectOAuthToken } from "@/services/api";

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
  autoConnect: () => Promise<boolean>;
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
    try {
      const token = await detectOAuthToken();
      await fetchUsage(token);
      set({ token, isConnected: true, isLoading: false });
      await setValue("token", token);
      return true;
    } catch {
      set({ isLoading: false });
      return false;
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

  // Re-detecta token do sistema de arquivos (Claude CLI pode ter renovado)
  refreshToken: async () => {
    try {
      const newToken = await detectOAuthToken();
      const currentToken = get().token;

      if (newToken && newToken !== currentToken) {
        await fetchUsage(newToken);
        set({ token: newToken, error: null });
        await setValue("token", newToken);
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
