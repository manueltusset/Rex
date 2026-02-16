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

    PlatformInfo {
        os,
        is_wsl_available,
        default_claude_dir,
    }
}
