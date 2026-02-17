use tauri::AppHandle;

#[tauri::command]
pub async fn update_tray_tooltip(
    app: AppHandle,
    five_hour: f64,
    seven_day: f64,
    sonnet: f64,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = format!(
            "Rex - 5h: {:.0}% | 7d: {:.0}% | Sonnet: {:.0}%",
            five_hour, seven_day, sonnet
        );
        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;

        // Limpa titulo para nao mostrar texto ao lado do icone
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
