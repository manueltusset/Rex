use crate::models::stats::{GlobalStats, ModelUsageEntry, ProjectMetrics};
use serde_json::Value;
use std::collections::HashMap;

/// Le metricas de todos os projetos de ~/.claude.json -> projects
pub async fn read_project_stats() -> Result<Vec<ProjectMetrics>, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    let config_path = home.join(".claude.json");

    if !config_path.exists() {
        return Ok(vec![]);
    }

    let content = tokio::fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read .claude.json: {}", e))?;

    let root: Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse .claude.json: {}", e))?;

    // Mapear githubRepoPaths: { "owner/repo": ["/path/to/project"] } -> { "/path/to/project": "owner/repo" }
    let github_map = build_github_map(&root);

    let mut result = Vec::new();

    if let Some(projects) = root.get("projects").and_then(|v| v.as_object()) {
        for (path, data) in projects {
            let model_usage = data.get("lastModelUsage").and_then(|v| {
                serde_json::from_value::<HashMap<String, ModelUsageEntry>>(v.clone()).ok()
            });

            let metrics = ProjectMetrics {
                project_path: path.clone(),
                last_cost: data.get("lastCost").and_then(|v| v.as_f64()),
                last_duration: data.get("lastDuration").and_then(|v| v.as_u64()),
                last_lines_added: data.get("lastLinesAdded").and_then(|v| v.as_u64()),
                last_lines_removed: data.get("lastLinesRemoved").and_then(|v| v.as_u64()),
                last_total_input_tokens: data.get("lastTotalInputTokens").and_then(|v| v.as_u64()),
                last_total_output_tokens: data.get("lastTotalOutputTokens").and_then(|v| v.as_u64()),
                last_total_cache_read_input_tokens: data
                    .get("lastTotalCacheReadInputTokens")
                    .and_then(|v| v.as_u64()),
                last_total_cache_creation_input_tokens: data
                    .get("lastTotalCacheCreationInputTokens")
                    .and_then(|v| v.as_u64()),
                last_model_usage: model_usage,
                github_repo: github_map.get(path.as_str()).cloned(),
            };

            result.push(metrics);
        }
    }

    Ok(result)
}

/// Constroi mapa invertido: project_path -> "owner/repo"
fn build_github_map(root: &Value) -> HashMap<String, String> {
    let mut map = HashMap::new();

    if let Some(repos) = root.get("githubRepoPaths").and_then(|v| v.as_object()) {
        for (repo_name, paths) in repos {
            if let Some(arr) = paths.as_array() {
                for path_val in arr {
                    if let Some(path) = path_val.as_str() {
                        map.insert(path.to_string(), repo_name.clone());
                    }
                }
            }
        }
    }

    map
}

/// Le stats globais de ~/.claude/stats-cache.json
pub async fn read_global_stats() -> Result<GlobalStats, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    let stats_path = home.join(".claude").join("stats-cache.json");

    if !stats_path.exists() {
        return Err("stats-cache.json not found".to_string());
    }

    let content = tokio::fs::read_to_string(&stats_path)
        .await
        .map_err(|e| format!("Failed to read stats-cache.json: {}", e))?;

    serde_json::from_str::<GlobalStats>(&content)
        .map_err(|e| format!("Failed to parse stats-cache.json: {}", e))
}
