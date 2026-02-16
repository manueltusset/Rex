use crate::services::credentials;

#[tauri::command]
pub async fn detect_oauth_token() -> Result<String, String> {
    credentials::detect_oauth_token().await
}
