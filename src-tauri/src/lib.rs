mod commands;
mod models;
mod services;

use commands::auth::detect_oauth_token;
use commands::platform::get_platform_info;
use commands::sessions::{list_sessions, read_session};
use commands::terminal::resume_session;
use commands::usage::fetch_usage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let mut builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::default(),
            )
            .title("Rex")
            .inner_size(1280.0, 800.0)
            .min_inner_size(900.0, 600.0)
            .resizable(true)
            .background_color(tauri::window::Color(13, 15, 18, 255)); // #0D0F12

            #[cfg(target_os = "macos")]
            {
                builder = builder
                    .accept_first_mouse(true)
                    .decorations(true)
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true);
            }

            #[cfg(target_os = "linux")]
            {
                builder = builder.decorations(false);
            }

            #[cfg(target_os = "windows")]
            {
                builder = builder.decorations(false);
            }

            let webview_window = builder.build()?;

            // macOS: setar backgroundColor nativo do NSWindow
            #[cfg(target_os = "macos")]
            set_macos_window_bg(&webview_window);

            #[cfg(not(target_os = "macos"))]
            let _ = webview_window;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_oauth_token,
            fetch_usage,
            list_sessions,
            read_session,
            resume_session,
            get_platform_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "macos")]
fn set_macos_window_bg(webview_window: &tauri::WebviewWindow) {
    use objc2_app_kit::NSColor;
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};

    let Ok(handle) = webview_window.window_handle() else {
        return;
    };

    let RawWindowHandle::AppKit(appkit) = handle.as_raw() else {
        return;
    };

    unsafe {
        let ns_view = appkit.ns_view.as_ptr() as *const objc2_app_kit::NSView;
        let ns_view = &*ns_view;
        let Some(ns_window) = ns_view.window() else {
            return;
        };

        // #0D0F12
        let bg_color = NSColor::colorWithSRGBRed_green_blue_alpha(
            13.0 / 255.0,
            15.0 / 255.0,
            18.0 / 255.0,
            1.0,
        );
        ns_window.setBackgroundColor(Some(&bg_color));
    }
}
