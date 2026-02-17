use tauri::AppHandle;

#[tauri::command]
pub async fn update_tray_tooltip(
    app: AppHandle,
    five_hour: f64,
    seven_day: f64,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = format!("Rex - 5h: {:.0}% | 7d: {:.0}%", five_hour, seven_day);
        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;

        // Limpa titulo de texto
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

#[tauri::command]
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}
