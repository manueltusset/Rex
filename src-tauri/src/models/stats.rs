use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelUsageEntry {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub cache_read_input_tokens: Option<u64>,
    pub cache_creation_input_tokens: Option<u64>,
    #[serde(rename = "costUSD")]
    pub cost_usd: Option<f64>,
}

// Metricas por projeto (de ~/.claude.json -> projects.*)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetrics {
    pub project_path: String,
    pub last_cost: Option<f64>,
    pub last_duration: Option<u64>,
    pub last_lines_added: Option<u64>,
    pub last_lines_removed: Option<u64>,
    pub last_total_input_tokens: Option<u64>,
    pub last_total_output_tokens: Option<u64>,
    pub last_total_cache_read_input_tokens: Option<u64>,
    pub last_total_cache_creation_input_tokens: Option<u64>,
    pub last_model_usage: Option<HashMap<String, ModelUsageEntry>>,
    pub github_repo: Option<String>,
}

// Stats globais (de ~/.claude/stats-cache.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date: String,
    pub message_count: u64,
    pub session_count: u64,
    pub tool_call_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyModelTokens {
    pub date: String,
    pub tokens_by_model: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LongestSession {
    pub session_id: Option<String>,
    pub duration: Option<u64>,
    pub message_count: Option<u64>,
    pub timestamp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalStats {
    pub version: Option<u32>,
    pub last_computed_date: Option<String>,
    pub daily_activity: Vec<DailyActivity>,
    pub daily_model_tokens: Vec<DailyModelTokens>,
    pub model_usage: HashMap<String, ModelUsageEntry>,
    pub total_sessions: Option<u64>,
    pub total_messages: Option<u64>,
    pub longest_session: Option<LongestSession>,
    pub first_session_date: Option<String>,
    pub hour_counts: HashMap<String, u64>,
    pub total_speculation_time_saved_ms: Option<u64>,
}
