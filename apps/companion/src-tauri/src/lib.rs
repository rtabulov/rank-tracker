mod bridge;
mod capture;

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{
  include_image,
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
  AppHandle, Manager, WindowEvent,
};

const TRAY_ID: &str = "main";
const TRAY_ICON: tauri::image::Image<'_> = include_image!("./icons/32x32.png");
const SSLKEYLOGFILE_ENV: &str = "SSLKEYLOGFILE";
const NPCAP_DOWNLOAD_URL: &str = "https://npcap.com/#download";
const NPCAP_REBOOT_MARKER: &str = "npcap-reboot-required";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NpcapProbeFacts {
  present: bool,
  reboot_required: bool,
}

#[tauri::command]
fn quit(app: AppHandle, host: tauri::State<'_, capture::CaptureHost>) {
  capture::stop_capture(&app, &host);
  if let Some(bridge) = app.try_state::<bridge::BridgeHost>() {
    bridge.stop();
  }
  app.exit(0);
}

#[tauri::command]
fn open_npcap_download() -> Result<(), String> {
  open_url_impl(NPCAP_DOWNLOAD_URL)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
  open_url_impl(&url)
}

#[tauri::command]
fn copy_text_to_clipboard(text: String) -> Result<(), String> {
  #[cfg(windows)]
  {
    use std::io::Write;
    use std::process::{Command, Stdio};
    let mut child = Command::new("cmd")
      .args(["/C", "clip"])
      .stdin(Stdio::piped())
      .spawn()
      .map_err(|e| format!("clip: {e}"))?;
    if let Some(mut stdin) = child.stdin.take() {
      stdin
        .write_all(text.as_bytes())
        .map_err(|e| format!("clip stdin: {e}"))?;
    }
    let status = child.wait().map_err(|e| format!("clip wait: {e}"))?;
    if !status.success() {
      return Err(format!("clip exited with {status}"));
    }
    return Ok(());
  }
  #[cfg(not(windows))]
  {
    let _ = text;
    Err("copy_text_to_clipboard is only supported on Windows".into())
  }
}

#[tauri::command]
fn detect_npcap() -> NpcapProbeFacts {
  let present = npcap_dll_present();
  if !present {
    let _ = clear_npcap_reboot_marker_file();
    return NpcapProbeFacts {
      present: false,
      reboot_required: false,
    };
  }

  if npcap_driver_ready() {
    let _ = clear_npcap_reboot_marker_file();
    return NpcapProbeFacts {
      present: true,
      reboot_required: false,
    };
  }

  // DLLs on disk but driver/service not usable — Npcap exit 3010 / reboot-pending.
  let _ = write_npcap_reboot_marker();
  NpcapProbeFacts {
    present: true,
    reboot_required: true,
  }
}

#[tauri::command]
fn clear_npcap_reboot_marker() -> Result<(), String> {
  clear_npcap_reboot_marker_file()
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
      Path::new(r"C:\Windows\System32\Npcap\npcap.dll"),
      Path::new(r"C:\Windows\System32\wpcap.dll"),
    ];
    return candidates.iter().any(|p| p.exists());
  }
  #[cfg(not(windows))]
  {
    false
  }
}

fn npcap_driver_ready() -> bool {
  #[cfg(windows)]
  {
    if npcap_service_running() {
      return true;
    }
    // Fresh installs sometimes need an explicit start before reboot-required is clear.
    let _ = Command::new("sc").args(["start", "npcap"]).status();
    return npcap_service_running();
  }
  #[cfg(not(windows))]
  {
    false
  }
}

fn npcap_service_running() -> bool {
  #[cfg(windows)]
  {
    let output = Command::new("sc").args(["query", "npcap"]).output();
    match output {
      Ok(out) => {
        let text = String::from_utf8_lossy(&out.stdout).to_ascii_uppercase();
        text.contains("RUNNING")
      }
      Err(_) => false,
    }
  }
  #[cfg(not(windows))]
  {
    false
  }
}

fn companion_data_dir() -> Result<PathBuf, String> {
  let base = std::env::var("LOCALAPPDATA")
    .or_else(|_| {
      std::env::var("USERPROFILE").map(|p| {
        PathBuf::from(p)
          .join("AppData")
          .join("Local")
          .to_string_lossy()
          .into_owned()
      })
    })
    .map_err(|_| "LOCALAPPDATA/USERPROFILE not set".to_string())?;
  Ok(PathBuf::from(base).join("RankTrackerCompanion"))
}

fn npcap_reboot_marker_path() -> Result<PathBuf, String> {
  Ok(companion_data_dir()?.join(NPCAP_REBOOT_MARKER))
}

fn write_npcap_reboot_marker() -> Result<(), String> {
  let dir = companion_data_dir()?;
  fs::create_dir_all(&dir).map_err(|e| format!("create companion data dir: {e}"))?;
  fs::write(npcap_reboot_marker_path()?, b"1").map_err(|e| format!("write reboot marker: {e}"))
}

fn clear_npcap_reboot_marker_file() -> Result<(), String> {
  let path = npcap_reboot_marker_path()?;
  if path.exists() {
    fs::remove_file(&path).map_err(|e| format!("remove reboot marker: {e}"))?;
  }
  Ok(())
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
    .manage(capture::CaptureHost::new())
    .manage(bridge::BridgeHost::new("0.1.0".into()))
    .invoke_handler(tauri::generate_handler![
      quit,
      open_npcap_download,
      open_url,
      copy_text_to_clipboard,
      detect_npcap,
      clear_npcap_reboot_marker,
      apply_ssl_keylog,
      capture::list_capture_interfaces,
      capture::start_capture_cmd,
      capture::stop_capture_cmd,
      capture::save_capture_interface,
      capture::probe_keylog_status,
      bridge::start_bridge_cmd,
      bridge::set_proposal_cmd,
      bridge::clear_proposal_cmd,
      bridge::sync_bridge_phase_cmd,
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

      // MSI custom action should have set SSLKEYLOGFILE; repair if missing (e.g. older install).
      if std::env::var(SSLKEYLOGFILE_ENV).unwrap_or_default().is_empty() {
        match apply_ssl_keylog() {
          Ok(path) => log::info!("SSLKEYLOGFILE repaired at {path}"),
          Err(err) => log::warn!("SSLKEYLOGFILE repair skipped: {err}"),
        }
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
            if let Some(host) = app.try_state::<capture::CaptureHost>() {
              capture::stop_capture(app, &host);
            }
            if let Some(bridge) = app.try_state::<bridge::BridgeHost>() {
              bridge.stop();
            }
            app.exit(0);
          }
        })
        .build(app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
