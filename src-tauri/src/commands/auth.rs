use crate::services::credentials;

#[tauri::command]
pub async fn detect_oauth_token(wsl_distro: Option<String>) -> Result<String, String> {
    credentials::detect_oauth_token(wsl_distro.as_deref()).await
}

#[tauri::command]
pub async fn refresh_oauth_token(wsl_distro: Option<String>) -> Result<String, String> {
    credentials::refresh_oauth_token(wsl_distro.as_deref()).await
}
