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
    #[serde(rename = "refreshToken")]
    refresh_token: Option<String>,
    #[serde(rename = "expiresAt")]
    expires_at: Option<i64>,
}

#[allow(dead_code)]
pub struct FullCredentials {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>,
    pub source_path: Option<PathBuf>,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<i64>,
}

const OAUTH_CLIENT_ID: &str = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const OAUTH_TOKEN_URL: &str = "https://console.anthropic.com/v1/oauth/token";

/// Tenta detectar o OAuth token automaticamente
pub async fn detect_oauth_token(wsl_distro: Option<&str>) -> Result<String, String> {
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
    if let Some(token) = read_wsl_credentials(wsl_distro).await {
        return Ok(token);
    }

    // Suprime warning em plataformas nao-Windows
    #[cfg(not(target_os = "windows"))]
    let _ = wsl_distro;

    Err("Could not detect OAuth token. Check if Claude Code CLI is authenticated.".to_string())
}

/// Le credenciais completas (incluindo refreshToken) de todas as fontes
pub async fn read_full_credentials(wsl_distro: Option<&str>) -> Result<FullCredentials, String> {
    // 1. Arquivo nativo
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let native_path = home.join(".claude").join(".credentials.json");
    if let Some(creds) = parse_full_credentials_at(&native_path).await {
        return Ok(FullCredentials {
            source_path: Some(native_path),
            ..creds
        });
    }

    // 2. macOS Keychain
    #[cfg(target_os = "macos")]
    if let Some(creds) = read_full_macos_keychain().await {
        // Salva no arquivo nativo para poder atualizar depois
        return Ok(FullCredentials {
            source_path: Some(native_path),
            ..creds
        });
    }

    // 3. Linux Keyring
    #[cfg(target_os = "linux")]
    if let Some(creds) = read_full_linux_keyring().await {
        return Ok(FullCredentials {
            source_path: Some(native_path),
            ..creds
        });
    }

    // 4. WSL (Windows)
    #[cfg(target_os = "windows")]
    if let Some(creds) = read_full_wsl_credentials(wsl_distro).await {
        return Ok(creds);
    }

    #[cfg(not(target_os = "windows"))]
    let _ = wsl_distro;

    Err("Could not find credentials with refresh token".to_string())
}

/// Renova o access token usando o refresh token via endpoint OAuth
pub async fn refresh_oauth_token(wsl_distro: Option<&str>) -> Result<String, String> {
    let creds = read_full_credentials(wsl_distro).await?;
    let refresh_token = creds
        .refresh_token
        .ok_or("No refresh token available in credentials")?;

    // POST para endpoint OAuth
    let client = reqwest::Client::new();
    let resp = client
        .post(OAUTH_TOKEN_URL)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "grant_type=refresh_token&refresh_token={}&client_id={}",
            refresh_token, OAUTH_CLIENT_ID
        ))
        .send()
        .await
        .map_err(|e| format!("OAuth refresh request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("OAuth refresh failed ({}): {}", status, body));
    }

    let token_resp: TokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

    // Salvar novos tokens no arquivo de credenciais
    if let Some(ref path) = creds.source_path {
        save_credentials(
            path,
            &token_resp.access_token,
            token_resp.refresh_token.as_deref(),
            token_resp.expires_in,
        )
        .await
        .map_err(|e| format!("Failed to save refreshed credentials: {}", e))?;
    }

    // macOS: atualizar keychain (best-effort)
    #[cfg(target_os = "macos")]
    if let Some(ref path) = creds.source_path {
        if let Ok(content) = tokio::fs::read_to_string(path).await {
            let _ = update_macos_keychain(&content).await;
        }
    }

    // Linux: atualizar keyring (best-effort)
    #[cfg(target_os = "linux")]
    if let Some(ref path) = creds.source_path {
        if let Ok(content) = tokio::fs::read_to_string(path).await {
            let _ = update_linux_keyring(&content).await;
        }
    }

    Ok(token_resp.access_token)
}

/// Salva novos tokens no arquivo de credenciais preservando campos existentes
async fn save_credentials(
    path: &PathBuf,
    access_token: &str,
    refresh_token: Option<&str>,
    expires_in: Option<i64>,
) -> Result<(), String> {
    // Le JSON existente ou cria novo
    let mut json: serde_json::Value = if let Ok(content) = tokio::fs::read_to_string(path).await {
        serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Garante que claudeAiOauth existe
    if json.get("claudeAiOauth").is_none() {
        json["claudeAiOauth"] = serde_json::json!({});
    }

    let oauth = json
        .get_mut("claudeAiOauth")
        .unwrap();

    oauth["accessToken"] = serde_json::Value::String(access_token.to_string());

    if let Some(rt) = refresh_token {
        oauth["refreshToken"] = serde_json::Value::String(rt.to_string());
    }

    if let Some(exp) = expires_in {
        let expires_at = chrono::Utc::now().timestamp_millis() + (exp * 1000);
        oauth["expiresAt"] = serde_json::Value::Number(serde_json::Number::from(expires_at));
    }

    // Garante que o diretorio pai existe
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create credentials directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&json)
        .map_err(|e| format!("Failed to serialize credentials: {}", e))?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| format!("Failed to write credentials file: {}", e))?;

    Ok(())
}

// --- Funcoes internas de leitura ---

async fn read_credentials_file() -> Option<String> {
    let home = dirs::home_dir()?;
    let path: PathBuf = home.join(".claude").join(".credentials.json");
    parse_credentials_at(&path).await
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

/// Extrai credenciais completas de uma string JSON
fn try_parse_full_credentials(raw: &str) -> Option<FullCredentials> {
    let creds: OAuthCredentials = serde_json::from_str(raw).ok()?;
    let oauth = creds.claude_ai_oauth?;
    if oauth.access_token.is_empty() {
        return None;
    }
    Some(FullCredentials {
        access_token: oauth.access_token,
        refresh_token: oauth.refresh_token,
        expires_at: oauth.expires_at,
        source_path: None,
    })
}

async fn parse_credentials_at(path: &PathBuf) -> Option<String> {
    let content = tokio::fs::read_to_string(path).await.ok()?;
    try_parse_credentials(&content)
}

async fn parse_full_credentials_at(path: &PathBuf) -> Option<FullCredentials> {
    let content = tokio::fs::read_to_string(path).await.ok()?;
    try_parse_full_credentials(&content)
}

/// Le credenciais de dentro do WSL via UNC path
#[cfg(target_os = "windows")]
async fn read_wsl_credentials(wsl_distro: Option<&str>) -> Option<String> {
    let (_, path) = resolve_wsl_path(wsl_distro)?;
    parse_credentials_at(&path).await
}

#[cfg(target_os = "windows")]
async fn read_full_wsl_credentials(wsl_distro: Option<&str>) -> Option<FullCredentials> {
    let (_, path) = resolve_wsl_path(wsl_distro)?;
    let mut creds = parse_full_credentials_at(&path).await?;
    creds.source_path = Some(path);
    Some(creds)
}

#[cfg(target_os = "windows")]
fn resolve_wsl_path(wsl_distro: Option<&str>) -> Option<(String, PathBuf)> {
    let distro = wsl_distro
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
        .or_else(|| super::wsl::default_distro())?;
    let wsl_home = super::wsl::wsl_home(&distro)?;
    let linux_path = format!("{}/.claude/.credentials.json", wsl_home);
    let unc = super::wsl::linux_to_unc(&linux_path, &distro);
    Some((distro, PathBuf::from(unc)))
}

#[cfg(target_os = "macos")]
async fn read_macos_keychain() -> Option<String> {
    let raw = read_macos_keychain_raw().await?;
    try_parse_credentials(&raw)
}

#[cfg(target_os = "macos")]
async fn read_full_macos_keychain() -> Option<FullCredentials> {
    let raw = read_macos_keychain_raw().await?;
    try_parse_full_credentials(&raw)
}

#[cfg(target_os = "macos")]
async fn read_macos_keychain_raw() -> Option<String> {
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

    // Keychain pode retornar hex-encoded quando o valor contem dados binarios
    if raw.starts_with('{') {
        Some(raw)
    } else if let Some(decoded) = try_hex_decode(&raw) {
        Some(decoded)
    } else {
        Some(raw)
    }
}

/// Tenta decodificar uma string hexadecimal para UTF-8
fn try_hex_decode(hex: &str) -> Option<String> {
    let bytes: Vec<u8> = (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16))
        .collect::<Result<Vec<_>, _>>()
        .ok()?;
    let text = String::from_utf8(bytes).ok()?;
    if text.contains("claudeAiOauth") {
        Some(text)
    } else {
        None
    }
}

/// Atualiza credenciais no macOS Keychain (best-effort)
#[cfg(target_os = "macos")]
async fn update_macos_keychain(json: &str) -> Result<(), String> {
    let output = tokio::process::Command::new("security")
        .args([
            "add-generic-password",
            "-U",
            "-s",
            "Claude Code-credentials",
            "-a",
            "Claude Code",
            "-w",
            json,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to update keychain".to_string());
    }
    Ok(())
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
async fn read_full_linux_keyring() -> Option<FullCredentials> {
    for service in &["claude.ai", "Claude Code-credentials"] {
        if let Some(creds) = try_secret_tool_full(service).await {
            return Some(creds);
        }
    }
    None
}

#[cfg(target_os = "linux")]
async fn try_secret_tool(service: &str) -> Option<String> {
    let raw = try_secret_tool_raw(service).await?;

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

#[cfg(target_os = "linux")]
async fn try_secret_tool_full(service: &str) -> Option<FullCredentials> {
    let raw = try_secret_tool_raw(service).await?;
    try_parse_full_credentials(&raw)
}

#[cfg(target_os = "linux")]
async fn try_secret_tool_raw(service: &str) -> Option<String> {
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

    Some(raw)
}

/// Atualiza credenciais no Linux keyring (best-effort)
#[cfg(target_os = "linux")]
async fn update_linux_keyring(json: &str) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;

    let mut child = tokio::process::Command::new("secret-tool")
        .args([
            "store",
            "--label=Claude Code",
            "service",
            "Claude Code-credentials",
        ])
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(json.as_bytes()).await.map_err(|e| e.to_string())?;
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("Failed to update keyring".to_string());
    }
    Ok(())
}
