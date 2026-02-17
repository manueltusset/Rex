import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AccountInfo } from "@/types/account";

interface AccountState {
  account: AccountInfo | null;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const account = await invoke<AccountInfo>("read_account_info");
      set({ account, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
