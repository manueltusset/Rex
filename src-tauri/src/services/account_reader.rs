use crate::models::account::AccountInfo;
use serde_json::Value;

/// Le ~/.claude.json e extrai oauthAccount
pub async fn read_account_info() -> Result<AccountInfo, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    let config_path = home.join(".claude.json");

    if !config_path.exists() {
        return Err("~/.claude.json not found".to_string());
    }

    let content = tokio::fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read .claude.json: {}", e))?;

    let root: Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse .claude.json: {}", e))?;

    let oauth = root
        .get("oauthAccount")
        .ok_or("oauthAccount not found in .claude.json")?;

    serde_json::from_value::<AccountInfo>(oauth.clone())
        .map_err(|e| format!("Failed to parse oauthAccount: {}", e))
}
