use crate::models::skill::SkillInfo;
use crate::services::skills_reader;

#[tauri::command]
pub async fn list_skills() -> Result<Vec<SkillInfo>, String> {
    skills_reader::list_all_skills().await
}
