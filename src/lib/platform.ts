import { invoke } from "@tauri-apps/api/core";
import type { PlatformInfo } from "@/types/session";

let cachedPlatform: PlatformInfo = {
  os: "unknown",
  is_wsl_available: false,
  default_claude_dir: "~/.claude",
  wsl_distro: null,
  wsl_claude_dir: null,
};

export async function initPlatform(): Promise<void> {
  try {
    cachedPlatform = await invoke<PlatformInfo>("get_platform_info");
  } catch {
    // Fallback para dev no browser
  }
}

export function isMacOS(): boolean {
  return cachedPlatform.os === "macos";
}

export function isWindows(): boolean {
  return cachedPlatform.os === "windows";
}

export function isLinux(): boolean {
  return cachedPlatform.os === "linux";
}

export function getPlatform(): PlatformInfo {
  return cachedPlatform;
}
