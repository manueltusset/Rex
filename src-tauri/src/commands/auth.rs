use crate::services::credentials;

#[tauri::command]
pub async fn detect_oauth_token() -> Result<String, String> {
    credentials::detect_oauth_token().await
}

#[tauri::command]
pub async fn cli_refresh_token(use_wsl: Option<bool>) -> Result<String, String> {
    credentials::try_cli_refresh(use_wsl.unwrap_or(false)).await
}
