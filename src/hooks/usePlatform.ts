import { getPlatform, isMacOS, isWindows, isLinux } from "@/lib/platform";

export function usePlatform() {
  const platform = getPlatform();

  return {
    platform,
    isWindows: isWindows(),
    isMac: isMacOS(),
    isLinux: isLinux(),
    isWslAvailable: platform.is_wsl_available,
    defaultClaudeDir: platform.default_claude_dir,
    wslDistros: platform.wsl_distros,
    wslDistro: platform.wsl_distro,
    wslClaudeDir: platform.wsl_claude_dir,
  };
}
