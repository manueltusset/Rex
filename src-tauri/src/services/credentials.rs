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

/// Invoca o Claude CLI para acionar o refresh interno do token
pub async fn try_cli_refresh(use_wsl: bool) -> Result<String, String> {
    let result = if cfg!(target_os = "windows") && use_wsl {
        // Windows + WSL: claude esta dentro do WSL
        tokio::process::Command::new("wsl.exe")
            .args(["--", "claude", "auth", "status"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .output()
            .await
    } else {
        // macOS / Linux / Windows nativo: claude esta no PATH
        tokio::process::Command::new("claude")
            .args(["auth", "status"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .output()
            .await
    };

    if result.is_err() {
        return Err("Claude CLI not found. Install it or re-authenticate manually.".to_string());
    }

    // Re-le credenciais (CLI pode ter renovado o token)
    detect_oauth_token().await
}

/// Tenta detectar o OAuth token automaticamente
pub async fn detect_oauth_token() -> Result<String, String> {
    // 1. Variavel de ambiente
    if let Ok(token) = std::env::var("CLAUDE_CODE_OAUTH_TOKEN") {
        if !token.is_empty() {
            return Ok(token);
        }
    }

    // 2. Arquivo ~/.claude/.credentials.json (nativo)
    if let Some(token) = read_credentials_file().await {
        return Ok(token);
    }

    // 3. macOS Keychain
    #[cfg(target_os = "macos")]
    if let Some(token) = read_macos_keychain().await {
        return Ok(token);
    }

    // 4. Linux Keyring via secret-tool
    #[cfg(target_os = "linux")]
    if let Some(token) = read_linux_keyring().await {
        return Ok(token);
    }

    // 5. Credenciais dentro do WSL (Windows only)
    #[cfg(target_os = "windows")]
    if let Some(token) = read_wsl_credentials().await {
        return Ok(token);
    }

    Err("Could not detect OAuth token. Check if Claude Code CLI is authenticated.".to_string())
}

async fn read_credentials_file() -> Option<String> {
    let home = dirs::home_dir()?;
    let path: PathBuf = home.join(".claude").join(".credentials.json");
    parse_credentials_at(&path).await
}

/// Le credenciais de dentro do WSL via UNC path
#[cfg(target_os = "windows")]
async fn read_wsl_credentials() -> Option<String> {
    let distro = super::wsl::default_distro()?;
    let wsl_home = super::wsl::wsl_home(&distro)?;
    let linux_path = format!("{}/.claude/.credentials.json", wsl_home);
    let unc = super::wsl::linux_to_unc(&linux_path, &distro);
    parse_credentials_at(&PathBuf::from(unc)).await
}

/// Extrai o accessToken de uma string JSON de credenciais
fn try_parse_credentials(raw: &str) -> Option<String> {
    let creds: OAuthCredentials = serde_json::from_str(raw).ok()?;
    let oauth = creds.claude_ai_oauth?;
    if oauth.access_token.is_empty() {
        return None;
    }
    Some(oauth.access_token)
}

async fn parse_credentials_at(path: &PathBuf) -> Option<String> {
    let content = tokio::fs::read_to_string(path).await.ok()?;
    try_parse_credentials(&content)
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

    try_parse_credentials(&raw)
}

/// Le credenciais do Linux keyring via secret-tool (libsecret)
#[cfg(target_os = "linux")]
async fn read_linux_keyring() -> Option<String> {
    for service in &["claude.ai", "Claude Code-credentials"] {
        if let Some(token) = try_secret_tool(service).await {
            return Some(token);
        }
    }
    None
}

#[cfg(target_os = "linux")]
async fn try_secret_tool(service: &str) -> Option<String> {
    let output = tokio::process::Command::new("secret-tool")
        .args(["lookup", "service", service])
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

    // Pode ser JSON (formato padrao) ou token direto
    if let Some(token) = try_parse_credentials(&raw) {
        return Some(token);
    }

    // Token direto (sem wrapper JSON)
    if raw.starts_with("sk-ant-") {
        return Some(raw);
    }

    None
}
