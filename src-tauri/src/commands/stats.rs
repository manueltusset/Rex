use crate::models::stats::{GlobalStats, ProjectMetrics};
use crate::services::stats_reader;

#[tauri::command]
pub async fn read_project_stats() -> Result<Vec<ProjectMetrics>, String> {
    stats_reader::read_project_stats().await
}

#[tauri::command]
pub async fn read_global_stats() -> Result<GlobalStats, String> {
    stats_reader::read_global_stats().await
}
