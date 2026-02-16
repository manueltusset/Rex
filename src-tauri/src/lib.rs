mod commands;
mod models;
mod services;

use commands::auth::detect_oauth_token;
use commands::platform::get_platform_info;
use commands::sessions::{list_sessions, read_session};
use commands::terminal::resume_session;
use commands::tray::{update_tray_icon, update_tray_tooltip};
use commands::usage::fetch_usage;

use tauri::Manager;
use tauri::tray::TrayIconBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            // --- System Tray ---
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Rex - Claude Code Dashboard")
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_tray_popup(tray.app_handle());
                    }
                })
                .build(app)?;

            // --- Janela principal ---
            let mut builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::default(),
            )
            .title("Rex")
            .inner_size(1280.0, 800.0)
            .min_inner_size(900.0, 600.0)
            .resizable(true)
            .background_color(tauri::window::Color(13, 15, 18, 255));

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
            update_tray_tooltip,
            update_tray_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn toggle_tray_popup(app: &tauri::AppHandle) {
    use tauri_plugin_positioner::{Position, WindowExt};

    if let Some(popup) = app.get_webview_window("tray-popup") {
        if popup.is_visible().unwrap_or(false) {
            let _ = popup.hide();
        } else {
            let _ = popup.move_window(Position::TrayCenter);
            let _ = popup.show();
            let _ = popup.set_focus();
        }
        return;
    }

    // Criar popup pela primeira vez
    let popup = tauri::WebviewWindowBuilder::new(
        app,
        "tray-popup",
        tauri::WebviewUrl::App("/tray".into()),
    )
    .title("")
    .inner_size(360.0, 460.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    .background_color(tauri::window::Color(0, 0, 0, 255))
    .build();

    if let Ok(popup) = popup {
        #[cfg(target_os = "macos")]
        set_macos_popup_rounded(&popup);

        let _ = popup.move_window(Position::TrayCenter);
        let _ = popup.show();
        let _ = popup.set_focus();

        // Esconder ao perder foco
        let popup_clone = popup.clone();
        popup.on_window_event(move |event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = popup_clone.hide();
            }
        });
    }
}

#[cfg(target_os = "macos")]
fn set_macos_popup_rounded(popup: &tauri::WebviewWindow) {
    use objc2_app_kit::NSColor;
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};

    let Ok(handle) = popup.window_handle() else {
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

        // Fundo preto para contraste com bordas arredondadas do conteudo
        let bg = NSColor::colorWithSRGBRed_green_blue_alpha(0.0, 0.0, 0.0, 1.0);
        ns_window.setBackgroundColor(Some(&bg));

        // Bordas arredondadas via CALayer no contentView
        if let Some(content_view) = ns_window.contentView() {
            content_view.setWantsLayer(true);
            if let Some(layer) = content_view.layer() {
                layer.setCornerRadius(12.0);
                layer.setMasksToBounds(true);
            }
        }
    }
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

        let bg_color = NSColor::colorWithSRGBRed_green_blue_alpha(
            13.0 / 255.0,
            15.0 / 255.0,
            18.0 / 255.0,
            1.0,
        );
        ns_window.setBackgroundColor(Some(&bg_color));
    }
}
