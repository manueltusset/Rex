use crate::models::mcp::McpServerStatus;
use crate::services::mcp_checker;

#[tauri::command]
pub async fn list_mcp_servers() -> Result<Vec<McpServerStatus>, String> {
    mcp_checker::check_all_servers().await
}
