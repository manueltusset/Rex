use std::process::Command;

pub fn open_terminal_with_resume(
    session_id: &str,
    project_path: &str,
    use_wsl: bool,
) -> Result<(), String> {
    let resume_cmd = format!("cd '{}' && claude --resume {}", project_path, session_id);

    #[cfg(target_os = "macos")]
    {
        let _ = use_wsl;
        // Cria um .command temporario que o macOS abre no Terminal.app
        // Nao requer permissao de Automacao
        let script_path = std::env::temp_dir().join("rex-resume.command");
        let script_content = format!(
            "#!/bin/bash\nclear\n{}\nexit\n",
            resume_cmd
        );

        std::fs::write(&script_path, &script_content)
            .map_err(|e| format!("Failed to write script: {}", e))?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755))
                .map_err(|e| format!("Failed to set permissions: {}", e))?;
        }

        Command::new("open")
            .arg(script_path.to_str().unwrap_or("/tmp/rex-resume.command"))
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let _ = use_wsl;
        let terminals = [
            ("x-terminal-emulator", vec!["-e", "bash", "-c"]),
            ("gnome-terminal", vec!["--", "bash", "-c"]),
            ("konsole", vec!["-e", "bash", "-c"]),
            ("xfce4-terminal", vec!["-e", "bash", "-c"]),
            ("xterm", vec!["-e", "bash", "-c"]),
        ];

        let mut launched = false;
        for (term, args) in &terminals {
            if Command::new("which")
                .arg(term)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
            {
                let mut cmd = Command::new(term);
                for arg in args {
                    cmd.arg(arg);
                }
                cmd.arg(&resume_cmd);
                cmd.spawn()
                    .map_err(|e| format!("Failed to open {}: {}", term, e))?;
                launched = true;
                break;
            }
        }

        if !launched {
            return Err("No terminal emulator found".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        if use_wsl {
            let distro = crate::services::wsl::default_distro()
                .unwrap_or_else(|| "Ubuntu".to_string());
            let wsl_cmd = format!(
                "cd '{}' && claude --resume {}",
                project_path, session_id
            );
            Command::new("wt.exe")
                .args(["-p", &distro, "--", "bash", "-c", &wsl_cmd])
                .spawn()
                .or_else(|_| {
                    Command::new("wsl.exe")
                        .args(["-d", &distro, "bash", "-c", &wsl_cmd])
                        .spawn()
                })
                .map_err(|e| format!("Failed to open WSL terminal: {}", e))?;
        } else {
            let win_cmd = format!(
                "cd /d \"{}\" && claude --resume {}",
                project_path, session_id
            );
            Command::new("cmd")
                .args(["/c", "start", "cmd", "/k", &win_cmd])
                .spawn()
                .map_err(|e| format!("Failed to open terminal: {}", e))?;
        }
    }

    Ok(())
}
