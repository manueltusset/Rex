use serde::Deserialize;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
struct OAuthCredentials {
    #[serde(rename = "claudeAiOauth")]
    claude_ai_oauth: Option<OAuthData>,
}

#[derive(Debug, Deserialize)]
struct OAuthData {
    #[serde(rename = "accessToken")]
    access_token: String,
}

/// Tenta detectar o OAuth token automaticamente
pub async fn detect_oauth_token() -> Result<String, String> {
    // 1. Variavel de ambiente
    if let Ok(token) = std::env::var("CLAUDE_CODE_OAUTH_TOKEN") {
        if !token.is_empty() {
            return Ok(token);
        }
    }

    // 2. Arquivo ~/.claude/.credentials.json
    if let Some(token) = read_credentials_file().await {
        return Ok(token);
    }

    // 3. macOS Keychain
    #[cfg(target_os = "macos")]
    if let Some(token) = read_macos_keychain().await {
        return Ok(token);
    }

    Err("Could not detect OAuth token. Check if Claude Code CLI is authenticated.".to_string())
}

async fn read_credentials_file() -> Option<String> {
    let home = dirs::home_dir()?;
    let path: PathBuf = home.join(".claude").join(".credentials.json");

    let content = tokio::fs::read_to_string(&path).await.ok()?;
    let creds: OAuthCredentials = serde_json::from_str(&content).ok()?;
    let oauth = creds.claude_ai_oauth?;

    if oauth.access_token.is_empty() {
        return None;
    }

    Some(oauth.access_token)
}

#[cfg(target_os = "macos")]
async fn read_macos_keychain() -> Option<String> {
    let output = tokio::process::Command::new("security")
        .args(["find-generic-password", "-s", "Claude Code-credentials", "-w"])
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let raw = String::from_utf8(output.stdout).ok()?.trim().to_string();
    if raw.is_empty() {
        return None;
    }

    // O Keychain retorna o JSON completo das credenciais
    let creds: OAuthCredentials = serde_json::from_str(&raw).ok()?;
    let oauth = creds.claude_ai_oauth?;

    if oauth.access_token.is_empty() {
        return None;
    }

    Some(oauth.access_token)
}
