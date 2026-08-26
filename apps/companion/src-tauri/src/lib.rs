use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{
  include_image,
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
  AppHandle, WindowEvent,
};

const TRAY_ID: &str = "main";
const TRAY_ICON: tauri::image::Image<'_> = include_image!("./icons/32x32.png");
const SSLKEYLOGFILE_ENV: &str = "SSLKEYLOGFILE";
const NPCAP_DOWNLOAD_URL: &str = "https://npcap.com/#download";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NpcapProbeFacts {
  present: bool,
  reboot_required: bool,
}

#[tauri::command]
fn quit(app: AppHandle) {
  app.exit(0);
}

#[tauri::command]
fn open_npcap_download() -> Result<(), String> {
  open_url_impl(NPCAP_DOWNLOAD_URL)
}

#[tauri::command]
fn detect_npcap() -> NpcapProbeFacts {
  NpcapProbeFacts {
    present: npcap_dll_present(),
    // Installer exit 3010 is tracked by the elevated MSI path, not a cold probe.
    reboot_required: false,
  }
}

#[tauri::command]
fn apply_ssl_keylog() -> Result<String, String> {
  let plan_path = ssl_keylog_file_path()?;
  let dir = plan_path
    .parent()
    .ok_or_else(|| "ssl key log path missing parent".to_string())?;
  fs::create_dir_all(dir).map_err(|e| format!("create key-log dir: {e}"))?;
  tighten_keylog_acl(dir)?;
  set_user_env(SSLKEYLOGFILE_ENV, &plan_path)?;
  Ok(plan_path.to_string_lossy().into_owned())
}

fn open_url_impl(url: &str) -> Result<(), String> {
  #[cfg(windows)]
  {
    Command::new("cmd")
      .args(["/C", "start", "", url])
      .spawn()
      .map_err(|e| format!("open url: {e}"))?;
    return Ok(());
  }
  #[cfg(not(windows))]
  {
    let _ = url;
    Err("open_url is only supported on Windows".into())
  }
}

fn npcap_dll_present() -> bool {
  #[cfg(windows)]
  {
    let candidates = [
      Path::new(r"C:\Windows\System32\Npcap\wpcap.dll"),
      Path::new(r"C:\Windows\System32\Npcap\Npcap.dll"),
      Path::new(r"C:\Windows\System32\wpcap.dll"),
    ];
    return candidates.iter().any(|p| p.exists());
  }
  #[cfg(not(windows))]
  {
    false
  }
}

fn ssl_keylog_file_path() -> Result<PathBuf, String> {
  let profile = std::env::var("USERPROFILE")
    .or_else(|_| std::env::var("HOME"))
    .map_err(|_| "USERPROFILE/HOME not set".to_string())?;
  Ok(
    PathBuf::from(profile)
      .join("AppData")
      .join("Local")
      .join("RankTrackerCompanion")
      .join("tls")
      .join("sslkeys.log"),
  )
}

fn set_user_env(name: &str, value: &Path) -> Result<(), String> {
  #[cfg(windows)]
  {
    let status = Command::new("setx")
      .args([name, &value.to_string_lossy()])
      .status()
      .map_err(|e| format!("setx {name}: {e}"))?;
    if !status.success() {
      return Err(format!("setx {name} exited with {status}"));
    }
    return Ok(());
  }
  #[cfg(not(windows))]
  {
    let _ = (name, value);
    Err("apply_ssl_keylog is only supported on Windows".into())
  }
}

fn tighten_keylog_acl(dir: &Path) -> Result<(), String> {
  #[cfg(windows)]
  {
    let user = std::env::var("USERNAME").unwrap_or_else(|_| "Users".into());
    let grant = format!("{user}:(OI)(CI)F");
    let status = Command::new("icacls")
      .args([
        dir.to_string_lossy().as_ref(),
        "/inheritance:r",
        "/grant:r",
        &grant,
      ])
      .status()
      .map_err(|e| format!("icacls: {e}"))?;
    if !status.success() {
      // Non-fatal for local/dev if ACL tools are restricted; env + dir still apply.
      log::warn!("icacls exited with {status}; key-log dir created without tightened ACL");
    }
    return Ok(());
  }
  #[cfg(not(windows))]
  {
    let _ = dir;
    Ok(())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      quit,
      open_npcap_download,
      detect_npcap,
      apply_ssl_keylog
    ])
    .on_window_event(|window, event| {
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
