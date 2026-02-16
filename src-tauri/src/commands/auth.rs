use crate::services::credentials;

#[tauri::command]
pub async fn detect_oauth_token(wsl_distro: Option<String>) -> Result<String, String> {
    credentials::detect_oauth_token(wsl_distro.as_deref()).await
}

#[tauri::command]
pub async fn cli_refresh_token(use_wsl: Option<bool>, wsl_distro: Option<String>) -> Result<String, String> {
    credentials::try_cli_refresh(use_wsl.unwrap_or(false), wsl_distro.as_deref()).await
}
