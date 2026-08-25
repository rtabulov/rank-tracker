use tauri::{
  include_image,
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
  AppHandle, WindowEvent,
};

const TRAY_ID: &str = "main";
const TRAY_ICON: tauri::image::Image<'_> = include_image!("./icons/32x32.png");

#[tauri::command]
fn quit(app: AppHandle) {
  app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![quit])
    .on_window_event(|window, event| {
      // Tray apps must stay alive when the hidden shell window is closed.
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Create the tray from Rust with an explicit icon. JS-side
      // defaultWindowIcon() often returns null on Windows, which yields an
      // invisible tray entry with no error.
      let status = MenuItem::with_id(app, "status", "Rank Tracker Companion", false, None::<&str>)?;
      let menu = Menu::with_items(app, &[&status])?;

      let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(TRAY_ICON)
        .tooltip("Rank Tracker Companion")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
          if event.id().as_ref() == "QUIT" {
            app.exit(0);
          }
        })
        .build(app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
