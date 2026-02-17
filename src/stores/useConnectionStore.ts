import { create } from "zustand";
import { getValue, setValue, deleteValue } from "@/services/store";
import { fetchUsage, detectOAuthToken } from "@/services/api";

interface ConnectionState {
  orgId: string;
  token: string;
  claudeDir: string;
  useWsl: boolean;
  wslDistro: string;
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
  setWslDistro: (distro: string) => Promise<void>;
  loadFromStore: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  orgId: "",
  token: "",
  claudeDir: "",
  useWsl: false,
  wslDistro: "",
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

    const { wslDistro } = get();
    const distro = wslDistro || undefined;

    let token: string;
    try {
      token = await detectOAuthToken(distro);
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
      set({ isLoading: false });
      return "expired";
    }
  },

  disconnect: async () => {
    set({ orgId: "", token: "", isConnected: false });
    await deleteValue("orgId");
    await deleteValue("token");
  },

  // Re-detecta token (usuario pode ter rodado claude no terminal)
  refreshToken: async () => {
    try {
      const { wslDistro } = get();
      const distro = wslDistro || undefined;

      const newToken = await detectOAuthToken(distro);
      const currentToken = get().token;

      if (newToken && newToken !== currentToken) {
        await fetchUsage(newToken);
        set({ token: newToken, isConnected: true, error: null });
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

  setWslDistro: async (distro: string) => {
    set({ wslDistro: distro });
    await setValue("wslDistro", distro);
  },

  loadFromStore: async () => {
    try {
      const orgId = (await getValue<string>("orgId")) ?? "";
      const token = (await getValue<string>("token")) ?? "";
      const claudeDir = (await getValue<string>("claudeDir")) ?? "";
      const useWsl = (await getValue<boolean>("useWsl")) ?? false;
      const wslDistro = (await getValue<string>("wslDistro")) ?? "";
      const isConnected = !!token;
      set({ orgId, token, claudeDir, useWsl, wslDistro, isConnected, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
