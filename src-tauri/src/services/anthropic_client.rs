use crate::models::usage::UsageResponse;

pub async fn get_usage(token: &str) -> Result<UsageResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
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
