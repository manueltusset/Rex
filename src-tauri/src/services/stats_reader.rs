use crate::models::stats::{DailyActivity, DailyModelTokens, GlobalStats, ModelUsageEntry, ProjectMetrics};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap, HashSet};

/// Metricas acumuladas de um projeto calculadas dos JSONL
struct ProjectJsonlStats {
    total_input_tokens: u64,
    total_output_tokens: u64,
    total_cache_read_tokens: u64,
    total_cache_creation_tokens: u64,
    sessions: HashSet<String>,
    model_usage: HashMap<String, (u64, u64)>, // (input, output) por modelo
}

/// Le metricas de todos os projetos de ~/.claude.json + suplementa com JSONL
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

    let github_map = build_github_map(&root);

    let mut result = Vec::new();

    // Coletar paths conhecidos para mapeamento slug -> path
    let known_projects: Vec<String> = root
        .get("projects")
        .and_then(|v| v.as_object())
        .map(|p| p.keys().cloned().collect())
        .unwrap_or_default();

    // Computar metricas reais dos JSONL
    let jsonl_stats = compute_project_jsonl_stats(&home, &known_projects).await;

    if let Some(projects) = root.get("projects").and_then(|v| v.as_object()) {
        for (path, data) in projects {
            let model_usage = data.get("lastModelUsage").and_then(|v| {
                serde_json::from_value::<HashMap<String, ModelUsageEntry>>(v.clone()).ok()
            });

            let mut metrics = ProjectMetrics {
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

            // Sobrescrever com dados acumulados dos JSONL quando disponiveis
            if let Some(computed) = jsonl_stats.get(path.as_str()) {
                if computed.total_input_tokens > 0 || computed.total_output_tokens > 0 {
                    metrics.last_total_input_tokens = Some(computed.total_input_tokens);
                    metrics.last_total_output_tokens = Some(computed.total_output_tokens);
                }
                if computed.total_cache_read_tokens > 0 {
                    metrics.last_total_cache_read_input_tokens = Some(computed.total_cache_read_tokens);
                }
                if computed.total_cache_creation_tokens > 0 {
                    metrics.last_total_cache_creation_input_tokens = Some(computed.total_cache_creation_tokens);
                }
            }

            result.push(metrics);
        }
    }

    Ok(result)
}

/// Computa metricas acumuladas por projeto a partir dos JSONL
async fn compute_project_jsonl_stats(
    home: &std::path::Path,
    known_projects: &[String],
) -> HashMap<String, ProjectJsonlStats> {
    let projects_dir = home.join(".claude").join("projects");
    let mut result: HashMap<String, ProjectJsonlStats> = HashMap::new();

    // Mapa slug -> path real usando projetos conhecidos do .claude.json
    let slug_map: HashMap<String, String> = known_projects
        .iter()
        .map(|p| (path_to_slug(p), p.clone()))
        .collect();

    let Ok(entries) = std::fs::read_dir(&projects_dir) else {
        return result;
    };

    for entry in entries.flatten() {
        let dir_path = entry.path();
        if !dir_path.is_dir() {
            continue;
        }

        let dir_name = dir_path.file_name().unwrap_or_default().to_string_lossy();
        if dir_name == "memory" {
            continue;
        }

        // Usar mapa de projetos conhecidos; fallback para conversao simples
        let project_path = slug_map
            .get(dir_name.as_ref())
            .cloned()
            .unwrap_or_else(|| slug_to_path(&dir_name));

        let jsonl_files = collect_jsonl_files(&dir_path);
        if jsonl_files.is_empty() {
            continue;
        }

        let stats = result.entry(project_path).or_insert_with(|| ProjectJsonlStats {
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cache_read_tokens: 0,
            total_cache_creation_tokens: 0,
            sessions: HashSet::new(),
            model_usage: HashMap::new(),
        });

        for file_path in &jsonl_files {
            let Ok(content) = tokio::fs::read_to_string(file_path).await else {
                continue;
            };

            for line in content.lines() {
                let Ok(entry) = serde_json::from_str::<Value>(line) else {
                    continue;
                };

                let entry_type = entry.get("type").and_then(|v| v.as_str()).unwrap_or("");

                if entry_type == "user" {
                    if let Some(sid) = entry.get("sessionId").and_then(|v| v.as_str()) {
                        stats.sessions.insert(sid.to_string());
                    }
                }

                if entry_type != "assistant" {
                    continue;
                }

                let msg = entry.get("message").unwrap_or(&Value::Null);
                let Some(usage) = msg.get("usage") else {
                    continue;
                };

                let inp = usage.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                let out = usage.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                let cache_read = usage.get("cache_read_input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                let cache_create = usage.get("cache_creation_input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);

                stats.total_input_tokens += inp;
                stats.total_output_tokens += out;
                stats.total_cache_read_tokens += cache_read;
                stats.total_cache_creation_tokens += cache_create;

                if let Some(model) = msg.get("model").and_then(|v| v.as_str()) {
                    let entry = stats.model_usage.entry(model.to_string()).or_insert((0, 0));
                    entry.0 += inp;
                    entry.1 += out;
                }
            }
        }
    }

    result
}

/// Converte slug de diretorio para path real (fallback)
fn slug_to_path(slug: &str) -> String {
    slug.replacen('-', "/", 1).replace('-', "/")
}

/// Converte path real para slug de diretorio (replica logica do Claude CLI)
fn path_to_slug(path: &str) -> String {
    path.chars()
        .map(|c| if c == '/' || c == ' ' || c == ',' { '-' } else { c })
        .collect()
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

/// Le stats globais de ~/.claude/stats-cache.json e suplementa com dados recentes
pub async fn read_global_stats() -> Result<GlobalStats, String> {
    let home = dirs::home_dir().ok_or("Home directory not found")?;
    let stats_path = home.join(".claude").join("stats-cache.json");

    if !stats_path.exists() {
        return Err("stats-cache.json not found".to_string());
    }

    let content = tokio::fs::read_to_string(&stats_path)
        .await
        .map_err(|e| format!("Failed to read stats-cache.json: {}", e))?;

    let mut stats: GlobalStats = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stats-cache.json: {}", e))?;

    // Suplementar com dados recentes dos JSONL
    supplement_global_stats(&mut stats, &home).await;

    Ok(stats)
}

// Acumulador por dia para dados recentes
struct DayAccumulator {
    message_count: u64,
    tool_call_count: u64,
    sessions: HashSet<String>,
    tokens_by_model: HashMap<String, u64>,
}

impl DayAccumulator {
    fn new() -> Self {
        Self {
            message_count: 0,
            tool_call_count: 0,
            sessions: HashSet::new(),
            tokens_by_model: HashMap::new(),
        }
    }
}

/// Escaneia JSONL para datas apos o cache e adiciona ao stats
async fn supplement_global_stats(stats: &mut GlobalStats, home: &std::path::Path) {
    // Determinar data de corte
    let cutoff = stats
        .last_computed_date
        .as_deref()
        .or_else(|| stats.daily_activity.last().map(|d| d.date.as_str()))
        .unwrap_or("1970-01-01");

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    if cutoff >= today.as_str() {
        return;
    }

    let projects_dir = home.join(".claude").join("projects");
    if !projects_dir.exists() {
        return;
    }

    let mut days: BTreeMap<String, DayAccumulator> = BTreeMap::new();
    let mut extra_messages: u64 = 0;
    let mut extra_sessions: HashSet<String> = HashSet::new();

    // Listar todos os JSONL recursivamente
    let jsonl_files = collect_jsonl_files(&projects_dir);

    for file_path in &jsonl_files {
        let Ok(content) = tokio::fs::read_to_string(file_path).await else {
            continue;
        };

        for line in content.lines() {
            let Ok(entry) = serde_json::from_str::<Value>(line) else {
                continue;
            };

            let Some(ts) = entry.get("timestamp").and_then(|v| v.as_str()) else {
                continue;
            };
            if ts.len() < 10 {
                continue;
            }
            let date = &ts[..10];

            // Ignorar datas ja cobertas pelo cache
            if date <= cutoff {
                continue;
            }

            let Some(entry_type) = entry.get("type").and_then(|v| v.as_str()) else {
                continue;
            };

            let day = days.entry(date.to_string()).or_insert_with(DayAccumulator::new);

            match entry_type {
                "user" => {
                    day.message_count += 1;
                    extra_messages += 1;
                    if let Some(sid) = entry.get("sessionId").and_then(|v| v.as_str()) {
                        day.sessions.insert(sid.to_string());
                        extra_sessions.insert(sid.to_string());
                    }
                }
                "assistant" => {
                    let msg = entry.get("message").unwrap_or(&Value::Null);

                    // Contar tool_use
                    if let Some(content) = msg.get("content").and_then(|v| v.as_array()) {
                        for block in content {
                            if block.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
                                day.tool_call_count += 1;
                            }
                        }
                    }

                    // Tokens por modelo
                    if let Some(model) = msg.get("model").and_then(|v| v.as_str()) {
                        if let Some(usage) = msg.get("usage") {
                            let inp = usage.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                            let out = usage.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                            if inp + out > 0 {
                                *day.tokens_by_model.entry(model.to_string()).or_insert(0) += inp + out;
                            }
                        }
                    }

                    // hour_counts
                    if ts.len() >= 13 {
                        if let Ok(hour) = ts[11..13].parse::<u32>() {
                            *stats.hour_counts.entry(hour.to_string()).or_insert(0) += 1;
                        }
                    }
                }
                _ => {}
            }
        }
    }

    // Construir e adicionar DailyActivity e DailyModelTokens
    for (date, acc) in &days {
        stats.daily_activity.push(DailyActivity {
            date: date.clone(),
            message_count: acc.message_count,
            session_count: acc.sessions.len() as u64,
            tool_call_count: acc.tool_call_count,
        });

        if !acc.tokens_by_model.is_empty() {
            stats.daily_model_tokens.push(DailyModelTokens {
                date: date.clone(),
                tokens_by_model: acc.tokens_by_model.clone(),
            });
        }
    }

    // Incrementar totais
    if extra_messages > 0 {
        *stats.total_messages.get_or_insert(0) += extra_messages;
    }
    if !extra_sessions.is_empty() {
        *stats.total_sessions.get_or_insert(0) += extra_sessions.len() as u64;
    }
}

/// Coleta todos os .jsonl recursivamente em um diretorio
fn collect_jsonl_files(dir: &std::path::Path) -> Vec<std::path::PathBuf> {
    let mut files = Vec::new();
    let Ok(entries) = std::fs::read_dir(dir) else {
        return files;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            // Ignorar diretorio memory
            if path.file_name().map_or(false, |n| n == "memory") {
                continue;
            }
            files.extend(collect_jsonl_files(&path));
        } else if path.extension().map_or(false, |e| e == "jsonl") {
            files.push(path);
        }
    }

    files
}
