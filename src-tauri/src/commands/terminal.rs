use crate::services::terminal_launcher;

#[tauri::command]
pub async fn resume_session(
    session_id: String,
    project_path: String,
    use_wsl: bool,
) -> Result<(), String> {
    terminal_launcher::open_terminal_with_resume(&session_id, &project_path, use_wsl)
}
