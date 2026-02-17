use crate::models::session::{SearchMatch, SessionEntry, SessionMeta};
use crate::services::session_parser;

#[tauri::command]
pub async fn list_sessions(
    claude_dir: String,
    use_wsl: Option<bool>,
    wsl_distro: Option<String>,
) -> Result<Vec<SessionMeta>, String> {
    let dir = resolve_path(&claude_dir, use_wsl.unwrap_or(false), wsl_distro.as_deref());
    session_parser::list_all_sessions(&dir).await
}

#[tauri::command]
pub async fn read_session(
    session_path: String,
    use_wsl: Option<bool>,
    wsl_distro: Option<String>,
) -> Result<Vec<SessionEntry>, String> {
    let path = resolve_path(&session_path, use_wsl.unwrap_or(false), wsl_distro.as_deref());
    session_parser::parse_session_file(&path).await
}

#[tauri::command]
pub async fn search_sessions(
    claude_dir: String,
    query: String,
    use_wsl: Option<bool>,
    wsl_distro: Option<String>,
) -> Result<Vec<SearchMatch>, String> {
    if query.len() < 2 {
        return Ok(Vec::new());
    }
    let dir = resolve_path(&claude_dir, use_wsl.unwrap_or(false), wsl_distro.as_deref());
    session_parser::search_in_sessions(&dir, &query).await
}

/// Converte path Linux para UNC Windows quando WSL mode ativo
fn resolve_path(path: &str, use_wsl: bool, wsl_distro: Option<&str>) -> String {
    #[cfg(target_os = "windows")]
    if use_wsl && path.starts_with('/') {
        let distro = wsl_distro
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty())
            .or_else(|| crate::services::wsl::default_distro());
        if let Some(d) = distro {
            return crate::services::wsl::linux_to_unc(path, &d);
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = use_wsl;
        let _ = wsl_distro;
    }

    path.to_string()
}
