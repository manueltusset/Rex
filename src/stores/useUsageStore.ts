import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { fetchUsage } from "@/services/api";
import { checkAndNotify } from "@/services/notifications";
import { renderTrayIcon } from "@/services/trayIcon";
import { isMacOS } from "@/lib/platform";
import { setValue, deleteValue } from "@/services/store";
import { useConnectionStore } from "./useConnectionStore";
import type { UsageWindow } from "@/types/usage";

interface UsageState {
  fiveHour: UsageWindow | null;
  sevenDay: UsageWindow | null;
  sonnetWeekly: UsageWindow | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;

  fetch: () => Promise<void>;
}

function isAuthError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("401") || msg.includes("token_expired") || msg.includes("authentication_error");
}

export const useUsageStore = create<UsageState>((set) => ({
  fiveHour: null,
  sevenDay: null,
  sonnetWeekly: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetch: async () => {
    const { token, isConnected } = useConnectionStore.getState();
    if (!isConnected || !token) return;

    set({ isLoading: true, error: null });
    try {
      const data = await fetchUsage(token);
      handleSuccess(set, data);
    } catch (e) {
      if (isAuthError(e)) {
        // Tentar re-detectar token (Claude CLI pode ter renovado)
        const refreshed = await useConnectionStore.getState().refreshToken();
        if (refreshed) {
          try {
            const newToken = useConnectionStore.getState().token;
            const data = await fetchUsage(newToken);
            handleSuccess(set, data);
            return;
          } catch {
            // Refresh falhou, desconectar
          }
        }
        // Token nao renovado ou retry falhou - preserva config
        useConnectionStore.setState({ token: "", isConnected: false });
        await deleteValue("token");
        invoke("clear_tray_display").catch(() => {});
        set({ isLoading: false, error: "Token expired. Run 'claude' in your terminal to refresh." });
        return;
      }

      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));

function handleSuccess(
  set: (state: Partial<UsageState>) => void,
  data: { five_hour: UsageWindow; seven_day: UsageWindow; seven_day_sonnet: UsageWindow | null },
) {
  set({
    fiveHour: data.five_hour,
    sevenDay: data.seven_day,
    sonnetWeekly: data.seven_day_sonnet ?? null,
    isLoading: false,
    lastFetched: Date.now(),
  });

  // Persistir cache para o popup
  setValue("usageCache", {
    fiveHour: data.five_hour,
    sevenDay: data.seven_day,
    sonnetWeekly: data.seven_day_sonnet ?? null,
    cachedAt: Date.now(),
  }).catch(() => {});

  // Verificar thresholds e disparar notificacoes
  checkAndNotify("fiveHour", data.five_hour.utilization, "5h Session").catch(() => {});
  checkAndNotify("sevenDay", data.seven_day.utilization, "7d Rolling").catch(() => {});
  if (data.seven_day_sonnet) {
    checkAndNotify("sonnetWeekly", data.seven_day_sonnet.utilization, "Sonnet 7d").catch(() => {});
  }

  // Atualizar tray tooltip + title + icone
  const sonnetUtil = data.seven_day_sonnet?.utilization ?? 0;
  invoke("update_tray_tooltip", {
    fiveHour: data.five_hour.utilization,
    sevenDay: data.seven_day.utilization,
    sonnet: sonnetUtil,
  }).catch(() => {});

  // Icone dinamico apenas no macOS (Windows/Linux usa icone padrao)
  if (isMacOS()) {
    renderTrayIcon(
      data.five_hour.utilization,
      data.seven_day.utilization,
      sonnetUtil,
    ).catch(() => {});
  }
}
