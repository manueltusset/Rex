/// Decodifica output do wsl.exe (pode ser UTF-16LE ou UTF-8)
#[cfg(target_os = "windows")]
fn decode_wsl_output(bytes: &[u8]) -> String {
    // wsl.exe geralmente retorna UTF-16LE no Windows
    if bytes.len() >= 2 && bytes.len() % 2 == 0 {
        let u16_vec: Vec<u16> = bytes
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        if let Ok(s) = String::from_utf16(&u16_vec) {
            return s.replace('\u{feff}', ""); // Remove BOM
        }
    }
    // Fallback UTF-8
    String::from_utf8_lossy(bytes).replace('\u{0}', "")
}

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

    let text = decode_wsl_output(&output.stdout);

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
    // Usa bash -c para garantir expansao de $HOME
    let output = std::process::Command::new("wsl.exe")
        .args(["-d", distro, "--", "bash", "-c", "echo $HOME"])
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
