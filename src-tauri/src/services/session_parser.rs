use crate::models::session::{SessionEntry, SessionMeta};
use std::path::Path;

/// Decodifica o nome da pasta do projeto para o path original
fn decode_project_path(encoded: &str) -> String {
    encoded.replace("-", "/")
}

/// Extrai resumo da ultima mensagem do assistente
fn extract_summary(entries: &[SessionEntry]) -> String {
    for entry in entries.iter().rev() {
        if entry.entry_type == "assistant" {
            if let Some(content) = entry.message.get("content") {
                if let Some(arr) = content.as_array() {
                    for item in arr {
                        if let Some(text) = item.get("text").and_then(|t| t.as_str()) {
                            let trimmed = text.chars().take(100).collect::<String>();
                            return if text.len() > 100 {
                                format!("{}...", trimmed)
                            } else {
                                trimmed
                            };
                        }
                    }
                } else if let Some(text) = content.as_str() {
                    let trimmed = text.chars().take(100).collect::<String>();
                    return if text.len() > 100 {
                        format!("{}...", trimmed)
                    } else {
                        trimmed
                    };
                }
            }
        }
    }
    String::from("No summary available")
}

/// Lista todas as sessoes encontradas no diretorio .claude
pub async fn list_all_sessions(claude_dir: &str) -> Result<Vec<SessionMeta>, String> {
    let projects_dir = Path::new(claude_dir).join("projects");
    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let mut sessions = Vec::new();
    let mut project_entries =
        tokio::fs::read_dir(&projects_dir)
            .await
            .map_err(|e| format!("Failed to read projects dir: {}", e))?;

    while let Some(project_entry) = project_entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let project_path = project_entry.path();
        if !project_path.is_dir() {
            continue;
        }

        let project_name = project_entry
            .file_name()
            .to_string_lossy()
            .to_string();
        let decoded_path = decode_project_path(&project_name);

        let mut session_entries =
            tokio::fs::read_dir(&project_path)
                .await
                .map_err(|e| format!("Failed to read session dir: {}", e))?;

        while let Some(session_entry) = session_entries
            .next_entry()
            .await
            .map_err(|e| format!("Failed to read session entry: {}", e))?
        {
            let session_path = session_entry.path();
            let filename = session_entry.file_name().to_string_lossy().to_string();

            if !filename.ends_with(".jsonl") {
                continue;
            }

            let session_id = filename.trim_end_matches(".jsonl").to_string();

            match parse_session_file(session_path.to_str().unwrap_or("")).await {
                Ok(entries) => {
                    let last_timestamp = entries
                        .last()
                        .map(|e| e.timestamp.clone())
                        .unwrap_or_default();
                    let summary = extract_summary(&entries);
                    let message_count = entries.len() as u32;

                    // Versao simplificada do display
                    let project_display = if decoded_path.starts_with('/') {
                        decoded_path
                            .split('/')
                            .rev()
                            .take(2)
                            .collect::<Vec<_>>()
                            .into_iter()
                            .rev()
                            .collect::<Vec<_>>()
                            .join("/")
                    } else {
                        decoded_path.clone()
                    };

                    sessions.push(SessionMeta {
                        id: session_id,
                        project_path: decoded_path.clone(),
                        project_display,
                        summary,
                        last_timestamp,
                        message_count,
                    });
                }
                Err(_) => continue,
            }
        }
    }

    // Ordena por timestamp mais recente
    sessions.sort_by(|a, b| b.last_timestamp.cmp(&a.last_timestamp));
    Ok(sessions)
}

/// Parse de um arquivo .jsonl de sessao
pub async fn parse_session_file(path: &str) -> Result<Vec<SessionEntry>, String> {
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let entries: Vec<SessionEntry> = content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .filter_map(|line| serde_json::from_str(line).ok())
        .collect();

    Ok(entries)
}
