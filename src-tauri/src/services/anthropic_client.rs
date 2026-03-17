use crate::models::usage::UsageResponse;
use std::sync::LazyLock;

// Singleton reutiliza connection pool HTTP/2 entre chamadas
pub static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client")
});

pub async fn get_usage(token: &str) -> Result<UsageResponse, String> {
    let resp = HTTP_CLIENT
        .get("https://api.anthropic.com/api/oauth/usage")
        .header("Authorization", format!("Bearer {}", token))
        .header("anthropic-beta", "oauth-2025-04-20")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("API error ({}): {}", status, body));
    }

    resp.json::<UsageResponse>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}
