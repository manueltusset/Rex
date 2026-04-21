use crate::models::skill::SkillInfo;
use serde_json::Value;
use std::path::Path;

/// Scans skills directories and returns all installed skills
pub async fn list_all_skills() -> Result<Vec<SkillInfo>, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    let mut skills = Vec::new();

    // User-level skills: ~/.claude/skills/*/SKILL.md
    let user_skills_dir = home.join(".claude").join("skills");
    if user_skills_dir.exists() {
        scan_skills_dir(&user_skills_dir, "user", None, None, &mut skills).await;
    }

    // Plugin skills: read ~/.claude/plugins/installed_plugins.json
    let plugins_json = home.join(".claude").join("plugins").join("installed_plugins.json");
    if plugins_json.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&plugins_json).await {
            if let Ok(root) = serde_json::from_str::<Value>(&content) {
                if let Some(plugins) = root.get("plugins").and_then(|v| v.as_object()) {
                    for (plugin_key, installs) in plugins {
                        // plugin_key is like "superpowers@claude-plugins-official"
                        let plugin_name = plugin_key.split('@').next().unwrap_or(plugin_key);
                        if let Some(installs_arr) = installs.as_array() {
                            for install in installs_arr {
                                let scope = install
                                    .get("scope")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("plugin");
                                let install_path = install
                                    .get("installPath")
                                    .and_then(|v| v.as_str());
                                if let Some(path) = install_path {
                                    let skills_dir = Path::new(path).join("skills");
                                    if skills_dir.exists() {
                                        scan_skills_dir(
                                            &skills_dir,
                                            scope,
                                            None,
                                            Some(plugin_name.to_string()),
                                            &mut skills,
                                        )
                                        .await;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Project-level skills: read ~/.claude.json projects keys
    let config_path = home.join(".claude.json");
    if config_path.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&config_path).await {
            if let Ok(root) = serde_json::from_str::<Value>(&content) {
                if let Some(projects) = root.get("projects").and_then(|v| v.as_object()) {
                    for project_path in projects.keys() {
                        let project_skills_dir =
                            Path::new(project_path).join(".claude").join("skills");
                        if project_skills_dir.exists() {
                            scan_skills_dir(
                                &project_skills_dir,
                                "project",
                                Some(project_path.clone()),
                                None,
                                &mut skills,
                            )
                            .await;
                        }
                    }
                }
            }
        }
    }

    Ok(skills)
}

async fn scan_skills_dir(
    dir: &Path,
    scope: &str,
    project_path: Option<String>,
    plugin_name: Option<String>,
    skills: &mut Vec<SkillInfo>,
) {
    let Ok(mut entries) = tokio::fs::read_dir(dir).await else {
        return;
    };

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let skill_md = path.join("SKILL.md");
        if !skill_md.exists() {
            continue;
        }

        let dir_name = entry
            .file_name()
            .to_string_lossy()
            .to_string();

        if let Ok(content) = tokio::fs::read_to_string(&skill_md).await {
            let (name, description) = parse_frontmatter(&content, &dir_name);
            skills.push(SkillInfo {
                name,
                description,
                scope: scope.to_string(),
                project_path: project_path.clone(),
                dir_name,
                plugin_name: plugin_name.clone(),
            });
        }
    }
}

/// Parses YAML frontmatter from SKILL.md content.
/// Expects `---` delimited block with `name:` and `description:` fields.
fn parse_frontmatter(content: &str, fallback_name: &str) -> (String, String) {
    let mut name = fallback_name.to_string();
    let mut description = String::new();

    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return (name, description);
    }

    // Find the closing ---
    let after_open = &trimmed[3..];
    let Some(end_idx) = after_open.find("\n---") else {
        return (name, description);
    };

    let frontmatter = &after_open[..end_idx];

    for line in frontmatter.lines() {
        let line = line.trim();
        if let Some(value) = line.strip_prefix("name:") {
            let v = value.trim().trim_matches('"').trim_matches('\'');
            if !v.is_empty() {
                name = v.to_string();
            }
        } else if let Some(value) = line.strip_prefix("description:") {
            let v = value.trim().trim_matches('"').trim_matches('\'');
            if !v.is_empty() {
                description = v.to_string();
            }
        }
    }

    (name, description)
}
