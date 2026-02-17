use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub name: String,
    pub server_type: String,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub url: Option<String>,
    pub scope: String,
    pub project_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerStatus {
    pub name: String,
    pub server_type: String,
    pub scope: String,
    pub project_path: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
    pub url: Option<String>,
    pub command: Option<String>,
}
