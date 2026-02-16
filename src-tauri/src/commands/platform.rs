use crate::models::session::PlatformInfo;

#[tauri::command]
pub fn get_platform_info() -> PlatformInfo {
    let os = std::env::consts::OS.to_string();
    let home = dirs::home_dir().unwrap_or_default();

    let is_wsl_available = if cfg!(target_os = "windows") {
        std::path::Path::new("C:\\Windows\\System32\\wsl.exe").exists()
    } else {
        false
    };

    let default_claude_dir = home.join(".claude").to_string_lossy().to_string();

    // Detectar distro e home do WSL
    #[allow(unused_mut)]
    let mut wsl_distro: Option<String> = None;
    #[allow(unused_mut)]
    let mut wsl_claude_dir: Option<String> = None;

    #[cfg(target_os = "windows")]
    if is_wsl_available {
        if let Some(distro) = crate::services::wsl::default_distro() {
            if let Some(wsl_home) = crate::services::wsl::wsl_home(&distro) {
                wsl_claude_dir = Some(format!("{}/.claude", wsl_home));
            }
            wsl_distro = Some(distro);
        }
    }

    PlatformInfo {
        os,
        is_wsl_available,
        default_claude_dir,
        wsl_distro,
        wsl_claude_dir,
    }
}
