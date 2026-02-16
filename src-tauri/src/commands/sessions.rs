use crate::models::session::{SessionEntry, SessionMeta};
use crate::services::session_parser;

#[tauri::command]
pub async fn list_sessions(
    claude_dir: String,
    use_wsl: Option<bool>,
) -> Result<Vec<SessionMeta>, String> {
    let dir = resolve_path(&claude_dir, use_wsl.unwrap_or(false));
    session_parser::list_all_sessions(&dir).await
}

#[tauri::command]
pub async fn read_session(
    session_path: String,
    use_wsl: Option<bool>,
) -> Result<Vec<SessionEntry>, String> {
    let path = resolve_path(&session_path, use_wsl.unwrap_or(false));
    session_parser::parse_session_file(&path).await
}

/// Converte path Linux para UNC Windows quando WSL mode ativo
fn resolve_path(path: &str, use_wsl: bool) -> String {
    #[cfg(target_os = "windows")]
    if use_wsl && path.starts_with('/') {
        if let Some(distro) = crate::services::wsl::default_distro() {
            return crate::services::wsl::linux_to_unc(path, &distro);
        }
    }

    #[cfg(not(target_os = "windows"))]
    let _ = use_wsl;

    path.to_string()
}
