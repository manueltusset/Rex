use tauri::AppHandle;

#[tauri::command]
pub async fn update_tray_tooltip(
    app: AppHandle,
    five_hour: f64,
    seven_day: f64,
    sonnet: f64,
    opus: f64,
    extra: f64,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let mut parts = vec![
            format!("5h: {:.0}%", five_hour),
            format!("7d: {:.0}%", seven_day),
        ];
        if sonnet > 0.0 {
            parts.push(format!("Sonnet: {:.0}%", sonnet));
        }
        if opus > 0.0 {
            parts.push(format!("Opus: {:.0}%", opus));
        }
        if extra > 0.0 {
            parts.push(format!("Extra: {:.0}%", extra));
        }
        let tooltip = format!("Rex - {}", parts.join(" | "));
        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;

        #[cfg(not(target_os = "windows"))]
        {
            tray.set_title(Some(""))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn update_tray_icon(
    app: AppHandle,
    rgba: Vec<u8>,
    width: u32,
    height: u32,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let icon = tauri::image::Image::new_owned(rgba, width, height);
        tray.set_icon(Some(icon))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Limpa titulo e tooltip ao desconectar, restaura icone original
#[tauri::command]
pub async fn clear_tray_display(app: AppHandle) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_tooltip(Some("Rex - Claude Code Dashboard"))
            .map_err(|e| e.to_string())?;

        #[cfg(not(target_os = "windows"))]
        {
            tray.set_title(Some(""))
                .map_err(|e| e.to_string())?;
        }

        // Restaurar icone original
        if let Some(icon) = app.default_window_icon() {
            tray.set_icon(Some(icon.clone()))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}
