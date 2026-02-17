import { invoke } from "@tauri-apps/api/core";
import type { UsageResponse } from "@/types/usage";
import type { SessionMeta, SessionEntry, SearchMatch, PlatformInfo } from "@/types/session";

export async function fetchUsage(token: string): Promise<UsageResponse> {
  return invoke<UsageResponse>("fetch_usage", { token });
}

export async function listSessions(
  claudeDir: string,
  useWsl?: boolean,
  wslDistro?: string,
): Promise<SessionMeta[]> {
  return invoke<SessionMeta[]>("list_sessions", { claudeDir, useWsl, wslDistro });
}

export async function readSession(
  sessionPath: string,
  useWsl?: boolean,
  wslDistro?: string,
): Promise<SessionEntry[]> {
  return invoke<SessionEntry[]>("read_session", { sessionPath, useWsl, wslDistro });
}

export async function searchSessions(
  claudeDir: string,
  query: string,
  useWsl?: boolean,
  wslDistro?: string,
): Promise<SearchMatch[]> {
  return invoke<SearchMatch[]>("search_sessions", { claudeDir, query, useWsl, wslDistro });
}

export async function resumeSession(
  sessionId: string,
  projectPath: string,
  useWsl: boolean,
  wslDistro?: string,
): Promise<void> {
  return invoke<void>("resume_session", { sessionId, projectPath, useWsl, wslDistro });
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  return invoke<PlatformInfo>("get_platform_info");
}

export async function detectOAuthToken(wslDistro?: string): Promise<string> {
  return invoke<string>("detect_oauth_token", { wslDistro });
}
