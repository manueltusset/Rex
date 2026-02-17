use crate::models::mcp::{McpServerConfig, McpServerStatus};
use serde_json::Value;
use std::path::Path;

/// Le ~/.claude.json e extrai todos os MCP servers configurados
pub async fn read_mcp_configs() -> Result<Vec<McpServerConfig>, String> {
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

    let mut configs = Vec::new();

    // MCP servers no nivel user (top-level mcpServers)
    if let Some(servers) = root.get("mcpServers").and_then(|v| v.as_object()) {
        for (name, config) in servers {
            if let Some(cfg) = parse_server_config(name, config, "user", None) {
                configs.push(cfg);
            }
        }
    }

    // MCP servers por projeto
    if let Some(projects) = root.get("projects").and_then(|v| v.as_object()) {
        for (project_path, project_data) in projects {
            if let Some(servers) = project_data.get("mcpServers").and_then(|v| v.as_object()) {
                for (name, config) in servers {
                    if let Some(cfg) =
                        parse_server_config(name, config, "local", Some(project_path.clone()))
                    {
                        configs.push(cfg);
                    }
                }
            }

            // Verificar .mcp.json do projeto
            let mcp_json_path = Path::new(project_path).join(".mcp.json");
            if mcp_json_path.exists() {
                if let Ok(mcp_content) = tokio::fs::read_to_string(&mcp_json_path).await {
                    if let Ok(mcp_root) = serde_json::from_str::<Value>(&mcp_content) {
                        if let Some(servers) =
                            mcp_root.get("mcpServers").and_then(|v| v.as_object())
                        {
                            for (name, config) in servers {
                                if let Some(cfg) = parse_server_config(
                                    name,
                                    config,
                                    "project",
                                    Some(project_path.clone()),
                                ) {
                                    configs.push(cfg);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(configs)
}

fn parse_server_config(
    name: &str,
    config: &Value,
    scope: &str,
    project_path: Option<String>,
) -> Option<McpServerConfig> {
    let server_type = config
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("stdio")
        .to_string();

    let command = config.get("command").and_then(|v| v.as_str()).map(String::from);
    let args = config.get("args").and_then(|v| {
        v.as_array().map(|arr| {
            arr.iter()
                .filter_map(|a| a.as_str().map(String::from))
                .collect()
        })
    });
    let url = config.get("url").and_then(|v| v.as_str()).map(String::from);

    Some(McpServerConfig {
        name: name.to_string(),
        server_type,
        command,
        args,
        url,
        scope: scope.to_string(),
        project_path,
    })
}

/// Verifica o status de um servidor MCP
pub async fn check_server_health(config: &McpServerConfig) -> McpServerStatus {
    let (status, error_message) = match config.server_type.as_str() {
        "http" | "sse" => check_remote_server(config).await,
        "stdio" => check_stdio_server(config).await,
        _ => ("unknown".to_string(), Some("Unknown server type".to_string())),
    };

    McpServerStatus {
        name: config.name.clone(),
        server_type: config.server_type.clone(),
        scope: config.scope.clone(),
        project_path: config.project_path.clone(),
        status,
        error_message,
        url: config.url.clone(),
        command: config.command.clone(),
    }
}

async fn check_remote_server(config: &McpServerConfig) -> (String, Option<String>) {
    let Some(url) = &config.url else {
        return ("error".to_string(), Some("No URL configured".to_string()));
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => return ("error".to_string(), Some(format!("HTTP client error: {}", e))),
    };

    match client.head(url).send().await {
        Ok(resp) => {
            let status_code = resp.status().as_u16();
            // Aceitar qualquer resposta (inclusive 401/405) como sinal de que o servidor esta ativo
            if status_code < 500 {
                ("ok".to_string(), None)
            } else {
                (
                    "error".to_string(),
                    Some(format!("Server returned {}", status_code)),
                )
            }
        }
        Err(e) => {
            if e.is_timeout() {
                ("error".to_string(), Some("Connection timeout".to_string()))
            } else if e.is_connect() {
                (
                    "error".to_string(),
                    Some("Connection refused".to_string()),
                )
            } else {
                ("error".to_string(), Some(format!("Request failed: {}", e)))
            }
        }
    }
}

async fn check_stdio_server(config: &McpServerConfig) -> (String, Option<String>) {
    let Some(command) = &config.command else {
        return ("error".to_string(), Some("No command configured".to_string()));
    };

    // Verificar se o binario existe no PATH
    let check_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    match tokio::process::Command::new(check_cmd)
        .arg(command)
        .output()
        .await
    {
        Ok(output) => {
            if output.status.success() {
                ("ok".to_string(), None)
            } else {
                (
                    "error".to_string(),
                    Some(format!("Command '{}' not found in PATH", command)),
                )
            }
        }
        Err(e) => (
            "error".to_string(),
            Some(format!("Failed to check command: {}", e)),
        ),
    }
}

/// Verifica status de todos os servidores
pub async fn check_all_servers() -> Result<Vec<McpServerStatus>, String> {
    let configs = read_mcp_configs().await?;

    let mut statuses = Vec::with_capacity(configs.len());
    for config in &configs {
        statuses.push(check_server_health(config).await);
    }

    Ok(statuses)
}
