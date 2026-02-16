import { invoke } from "@tauri-apps/api/core";
import type { UsageResponse } from "@/types/usage";
import type { SessionMeta, SessionEntry, PlatformInfo } from "@/types/session";

export async function fetchUsage(token: string): Promise<UsageResponse> {
  return invoke<UsageResponse>("fetch_usage", { token });
}

export async function listSessions(
  claudeDir: string,
): Promise<SessionMeta[]> {
  return invoke<SessionMeta[]>("list_sessions", { claudeDir });
}

export async function readSession(
  sessionPath: string,
): Promise<SessionEntry[]> {
  return invoke<SessionEntry[]>("read_session", { sessionPath });
}

export async function resumeSession(
  sessionId: string,
  projectPath: string,
  useWsl: boolean,
): Promise<void> {
  return invoke<void>("resume_session", { sessionId, projectPath, useWsl });
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  return invoke<PlatformInfo>("get_platform_info");
}

export async function detectOAuthToken(): Promise<string> {
  return invoke<string>("detect_oauth_token");
}
