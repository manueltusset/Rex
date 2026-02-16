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

    #[allow(unused_mut)]
    let mut wsl_distros: Vec<String> = vec![];
    #[allow(unused_mut)]
    let mut wsl_distro: Option<String> = None;
    #[allow(unused_mut)]
    let mut wsl_claude_dir: Option<String> = None;

    #[cfg(target_os = "windows")]
    if is_wsl_available {
        wsl_distros = crate::services::wsl::list_distros();
        if let Some(distro) = wsl_distros.first() {
            if let Some(wsl_home) = crate::services::wsl::wsl_home(distro) {
                wsl_claude_dir = Some(format!("{}/.claude", wsl_home));
            }
            wsl_distro = Some(distro.clone());
        }
    }

    PlatformInfo {
        os,
        is_wsl_available,
        default_claude_dir,
        wsl_distros,
        wsl_distro,
        wsl_claude_dir,
    }
}
