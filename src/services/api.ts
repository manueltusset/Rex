import { invoke } from "@tauri-apps/api/core";
import type { UsageResponse } from "@/types/usage";
import type { SessionMeta, SessionEntry, PlatformInfo } from "@/types/session";

export async function fetchUsage(token: string): Promise<UsageResponse> {
  return invoke<UsageResponse>("fetch_usage", { token });
}

export async function listSessions(
  claudeDir: string,
  useWsl?: boolean,
): Promise<SessionMeta[]> {
  return invoke<SessionMeta[]>("list_sessions", { claudeDir, useWsl });
}

export async function readSession(
  sessionPath: string,
  useWsl?: boolean,
): Promise<SessionEntry[]> {
  return invoke<SessionEntry[]>("read_session", { sessionPath, useWsl });
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

export async function cliRefreshToken(useWsl?: boolean): Promise<string> {
  return invoke<string>("cli_refresh_token", { useWsl });
}
