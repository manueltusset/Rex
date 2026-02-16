/// Detecta a distro WSL padrao
#[cfg(target_os = "windows")]
pub fn default_distro() -> Option<String> {
    let output = std::process::Command::new("wsl.exe")
        .args(["--list", "--quiet"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    // Output pode ser UTF-16LE no Windows
    let raw = String::from_utf8_lossy(&output.stdout);
    let text = raw
        .replace('\u{0}', "")
        .replace('\r', "");

    text.lines()
        .map(|l| l.trim())
        .find(|l| !l.is_empty())
        .map(|s| s.to_string())
}

/// Converte path Linux para UNC Windows acessivel via WSL
/// Ex: /home/user/.claude -> \\wsl.localhost\Ubuntu\home\user\.claude
#[cfg(target_os = "windows")]
pub fn linux_to_unc(linux_path: &str, distro: &str) -> String {
    let win_path = linux_path.replace('/', "\\");
    format!("\\\\wsl.localhost\\{}{}", distro, win_path)
}

/// Detecta o home do usuario dentro do WSL
#[cfg(target_os = "windows")]
pub fn wsl_home(distro: &str) -> Option<String> {
    let output = std::process::Command::new("wsl.exe")
        .args(["-d", distro, "--", "echo", "$HOME"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let home = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    if home.is_empty() { None } else { Some(home) }
}
