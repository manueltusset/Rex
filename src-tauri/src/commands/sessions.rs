use crate::models::session::{SessionEntry, SessionMeta};
use crate::services::session_parser;

#[tauri::command]
pub async fn list_sessions(claude_dir: String) -> Result<Vec<SessionMeta>, String> {
    session_parser::list_all_sessions(&claude_dir).await
}

#[tauri::command]
pub async fn read_session(session_path: String) -> Result<Vec<SessionEntry>, String> {
    session_parser::parse_session_file(&session_path).await
}
