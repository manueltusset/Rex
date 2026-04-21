use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    pub scope: String,
    pub project_path: Option<String>,
    pub dir_name: String,
    pub plugin_name: Option<String>,
}
