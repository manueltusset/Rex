use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionMeta {
    pub id: String,
    pub project_path: String,
    pub project_display: String,
    pub summary: String,
    pub last_timestamp: String,
    pub message_count: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionEntry {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub message: serde_json::Value,
    #[serde(default)]
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlatformInfo {
    pub os: String,
    pub is_wsl_available: bool,
    pub default_claude_dir: String,
}
