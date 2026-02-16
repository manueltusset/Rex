use std::process::Command;

pub fn open_terminal_with_resume(
    session_id: &str,
    project_path: &str,
    use_wsl: bool,
    wsl_distro: Option<&str>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = (use_wsl, wsl_distro);
        let resume_cmd = format!("cd '{}' && claude --resume {}", project_path, session_id);
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
        let _ = (use_wsl, wsl_distro);
        let resume_cmd = format!("cd '{}' && claude --resume {}", project_path, session_id);
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
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x00000008;
        const CREATE_NEW_CONSOLE: u32 = 0x00000010;

        eprintln!(
            "[Rex] resume: use_wsl={}, wsl_distro={:?}, session={}, path={}",
            use_wsl, wsl_distro, session_id, project_path
        );

        if use_wsl {
            let distro = wsl_distro
                .map(|s| s.to_string())
                .filter(|s| !s.is_empty())
                .or_else(|| crate::services::wsl::default_distro())
                .unwrap_or_else(|| "Ubuntu".to_string());

            // Script .bat evita problemas de parsing entre wt.exe e wsl.exe
            let script_path = std::env::temp_dir().join("rex-resume.bat");
            let script_content = format!(
                "@echo off\r\nwsl.exe -d {} -- bash -ic \"cd '{}' && claude --resume {}\"\r\n",
                distro, project_path, session_id
            );

            eprintln!("[Rex] WSL script: {}", script_content.replace("\r\n", " | "));

            std::fs::write(&script_path, &script_content)
                .map_err(|e| format!("Failed to write script: {}", e))?;

            let script = script_path.to_str().unwrap_or("rex-resume.bat").to_string();

            // -w new: nova janela (nao reutiliza a do dev server)
            // DETACHED_PROCESS: desvincula do console pai
            Command::new("wt.exe")
                .args(["-w", "new", "--title", "Rex - Resume", "--", "cmd.exe", "/c", &script])
                .creation_flags(DETACHED_PROCESS)
                .spawn()
                .or_else(|_| {
                    eprintln!("[Rex] wt.exe failed, trying cmd.exe fallback");
                    // CREATE_NEW_CONSOLE: abre em janela propria
                    Command::new("cmd.exe")
                        .args(["/c", &script])
                        .creation_flags(CREATE_NEW_CONSOLE)
                        .spawn()
                })
                .map_err(|e| format!("Failed to open WSL terminal: {}", e))?;
        } else {
            let script_path = std::env::temp_dir().join("rex-resume.bat");
            let script_content = format!(
                "@echo off\r\ncd /d \"{}\"\r\nclaude --resume {}\r\n",
                project_path, session_id
            );

            std::fs::write(&script_path, &script_content)
                .map_err(|e| format!("Failed to write script: {}", e))?;

            let script = script_path.to_str().unwrap_or("rex-resume.bat").to_string();

            Command::new("wt.exe")
                .args(["-w", "new", "--title", "Rex - Resume", "--", "cmd.exe", "/c", &script])
                .creation_flags(DETACHED_PROCESS)
                .spawn()
                .or_else(|_| {
                    Command::new("cmd.exe")
                        .args(["/c", &script])
                        .creation_flags(CREATE_NEW_CONSOLE)
                        .spawn()
                })
                .map_err(|e| format!("Failed to open terminal: {}", e))?;
        }
    }

    Ok(())
}
