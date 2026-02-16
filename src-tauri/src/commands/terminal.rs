use crate::services::terminal_launcher;

#[tauri::command]
pub async fn resume_session(
    session_id: String,
    project_path: String,
    use_wsl: bool,
    wsl_distro: Option<String>,
) -> Result<(), String> {
    terminal_launcher::open_terminal_with_resume(&session_id, &project_path, use_wsl, wsl_distro.as_deref())
}
