import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useSettingsStore } from "@/stores/useSettingsStore";

const THRESHOLDS = [80, 90, 100] as const;

type UsageWindowKey = "fiveHour" | "sevenDay" | "sonnetWeekly" | "opusWeekly" | "extraUsage";

// Thresholds ja notificados por janela
const notified: Record<UsageWindowKey, Set<number>> = {
  fiveHour: new Set(),
  sevenDay: new Set(),
  sonnetWeekly: new Set(),
  opusWeekly: new Set(),
  extraUsage: new Set(),
};

// Controle de primeiro fetch (nao notifica na abertura do app)
const initialized = new Set<string>();

const messages: Record<number, { title: string; body: string }> = {
  80: {
    title: "Usage Warning (80%)",
    body: "You have used 80% of your quota. Consider slowing down.",
  },
  90: {
    title: "Usage Critical (90%)",
    body: "You have used 90% of your quota. Very close to the limit.",
  },
  100: {
    title: "Limit Reached (100%)",
    body: "You have reached your usage limit. Wait for the reset.",
  },
};

export async function checkAndNotify(
  window: UsageWindowKey,
  utilization: number,
  windowLabel: string,
): Promise<void> {
  const { notificationsEnabled } = useSettingsStore.getState();
  if (!notificationsEnabled) return;

  const used = Math.round(utilization);
  const set = notified[window];

  // Primeiro fetch: registrar thresholds atuais sem notificar
  if (!initialized.has(window)) {
    initialized.add(window);
    for (const t of THRESHOLDS) {
      if (used >= t) set.add(t);
    }
    return;
  }

  // Reset threshold se uso caiu abaixo
  for (const t of THRESHOLDS) {
    if (used < t && set.has(t)) {
      set.delete(t);
    }
  }

  // Disparar notificacao apenas do threshold mais alto cruzado
  let highest: (typeof THRESHOLDS)[number] | null = null;
  for (const t of THRESHOLDS) {
    if (used >= t && !set.has(t)) {
      set.add(t);
      highest = t;
    }
  }

  if (highest) {
    let permitted = await isPermissionGranted();
    if (!permitted) {
      const result = await requestPermission();
      permitted = result === "granted";
    }
    if (!permitted) return;

    const msg = messages[highest];
    sendNotification({
      title: `Rex - ${msg.title}`,
      body: `${windowLabel}: ${msg.body}`,
    });
  }
}
