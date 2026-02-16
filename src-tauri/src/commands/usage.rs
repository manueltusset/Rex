use crate::models::usage::UsageResponse;
use crate::services::anthropic_client;

#[tauri::command]
pub async fn fetch_usage(token: String) -> Result<UsageResponse, String> {
    anthropic_client::get_usage(&token).await
}
