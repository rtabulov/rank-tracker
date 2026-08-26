use serde::Serialize;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, Manager, State};

const INTERFACE_PREF_FILE: &str = "capture-interface.txt";
const CAPTURE_EVENT: &str = "capture-event";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureInterfaceDto {
  pub id: String,
  pub name: String,
  pub is_loopback: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeylogStatus {
  pub path: String,
  pub present: bool,
  pub non_empty: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum CaptureEvent {
  HttpJson {
    host: String,
    method: String,
    path: String,
    body: serde_json::Value,
  },
  DiscoveryTraffic,
  Started {
    interface_id: String,
  },
  Stopped,
}

pub struct CaptureHost {
  child: Mutex<Option<Child>>,
}

impl CaptureHost {
  pub fn new() -> Self {
    Self {
      child: Mutex::new(None),
    }
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

fn interface_pref_path() -> Result<PathBuf, String> {
  Ok(companion_data_dir()?.join(INTERFACE_PREF_FILE))
}

pub fn load_saved_interface_id() -> Option<String> {
  let path = interface_pref_path().ok()?;
  let text = fs::read_to_string(path).ok()?;
  let trimmed = text.trim();
  if trimmed.is_empty() {
    None
  } else {
    Some(trimmed.to_string())
  }
}

pub fn save_interface_id(id: &str) -> Result<(), String> {
  let dir = companion_data_dir()?;
  fs::create_dir_all(&dir).map_err(|e| format!("create companion data dir: {e}"))?;
  fs::write(interface_pref_path()?, id.as_bytes()).map_err(|e| format!("save interface: {e}"))
}

fn ssl_keylog_path() -> Result<PathBuf, String> {
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

pub fn resolve_tshark_bin(app: &AppHandle) -> Result<PathBuf, String> {
  let resource = app
    .path()
    .resource_dir()
    .map_err(|e| format!("resource_dir: {e}"))?;
  let bundled = resource.join("tshark").join("tshark.exe");
  if bundled.exists() {
    return Ok(bundled);
  }

  let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
    .join("resources")
    .join("tshark")
    .join("tshark.exe");
  if manifest.exists() {
    return Ok(manifest);
  }

  let system = PathBuf::from(r"C:\Program Files\Wireshark\tshark.exe");
  if system.exists() {
    return Ok(system);
  }

  Err(
    "tshark.exe not found — stage apps/companion/src-tauri/resources/tshark or install Wireshark"
      .into(),
  )
}

fn parse_tshark_interfaces(stdout: &str) -> Vec<CaptureInterfaceDto> {
  let mut out = Vec::new();
  for line in stdout.lines() {
    let line = line.trim();
    if line.is_empty() {
      continue;
    }
    let rest = line
      .split_once(". ")
      .map(|(_, r)| r.trim())
      .unwrap_or(line);
    let (id, name) = if let Some((id, name_part)) = rest.split_once(" (") {
      let name = name_part.trim_end_matches(')').to_string();
      (id.trim().to_string(), name)
    } else {
      (rest.to_string(), rest.to_string())
    };
    let lower = format!("{id} {name}").to_ascii_lowercase();
    let is_loopback = lower.contains("loopback") || lower.contains("npf_loopback");
    out.push(CaptureInterfaceDto {
      id,
      name,
      is_loopback,
    });
  }
  out
}

pub fn list_interfaces(tshark: &Path) -> Result<Vec<CaptureInterfaceDto>, String> {
  let output = command_no_window(tshark)
    .arg("-D")
    .output()
    .map_err(|e| format!("tshark -D: {e}"))?;
  if !output.status.success() {
    return Err(format!(
      "tshark -D failed: {}",
      String::from_utf8_lossy(&output.stderr)
    ));
  }
  Ok(parse_tshark_interfaces(&String::from_utf8_lossy(
    &output.stdout,
  )))
}

fn auto_pick(interfaces: &[CaptureInterfaceDto], saved: Option<&str>) -> Option<String> {
  if let Some(id) = saved {
    if interfaces.iter().any(|i| i.id == id && !i.is_loopback) {
      return Some(id.to_string());
    }
  }
  interfaces
    .iter()
    .find(|i| !i.is_loopback)
    .map(|i| i.id.clone())
}

fn command_no_window(bin: &Path) -> Command {
  let mut cmd = Command::new(bin);
  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    cmd.creation_flags(CREATE_NO_WINDOW);
  }
  cmd
}

fn decode_http_file_data(raw: &str) -> Option<Vec<u8>> {
  let trimmed = raw.trim();
  if trimmed.is_empty() {
    return None;
  }
  if trimmed.contains(':') {
    let bytes: Result<Vec<u8>, _> = trimmed
      .split(':')
      .filter(|p| !p.is_empty())
      .map(|p| u8::from_str_radix(p, 16))
      .collect();
    return bytes.ok();
  }
  if trimmed.starts_with('{') || trimmed.starts_with('[') {
    return Some(trimmed.as_bytes().to_vec());
  }
  if trimmed.len() % 2 == 0 && trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
    let mut bytes = Vec::with_capacity(trimmed.len() / 2);
    let mut chars = trimmed.chars();
    while let (Some(a), Some(b)) = (chars.next(), chars.next()) {
      let byte = u8::from_str_radix(&format!("{a}{b}"), 16).ok()?;
      bytes.push(byte);
    }
    return Some(bytes);
  }
  Some(trimmed.as_bytes().to_vec())
}

fn emit(app: &AppHandle, event: CaptureEvent) {
  let _ = app.emit(CAPTURE_EVENT, event);
}

fn stop_child(host: &CaptureHost) {
  if let Ok(mut guard) = host.child.lock() {
    if let Some(mut child) = guard.take() {
      let _ = child.kill();
      let _ = child.wait();
    }
  }
}

pub fn stop_capture(app: &AppHandle, host: &CaptureHost) {
  stop_child(host);
  emit(app, CaptureEvent::Stopped);
}

pub fn start_capture(
  app: AppHandle,
  host: &CaptureHost,
  interface_id: Option<String>,
) -> Result<String, String> {
  stop_child(host);

  let tshark = resolve_tshark_bin(&app)?;
  let interfaces = list_interfaces(&tshark)?;
  let saved = load_saved_interface_id();
  let chosen = interface_id
    .or_else(|| auto_pick(&interfaces, saved.as_deref()))
    .ok_or_else(|| "No capture interface available — open the adapter picker".to_string())?;

  if !interfaces.iter().any(|i| i.id == chosen) {
    return Err(format!("Unknown interface id: {chosen}"));
  }

  save_interface_id(&chosen)?;
  let keylog = ssl_keylog_path()?;
  if let Some(parent) = keylog.parent() {
    let _ = fs::create_dir_all(parent);
  }

  let keylog_arg = format!("tls.keylog_file:{}", keylog.to_string_lossy());
  let mut child = command_no_window(&tshark)
    .args([
      "-i",
      &chosen,
      "-l",
      "-o",
      &keylog_arg,
      "-Y",
      r#"http.host contains "es-dis""#,
      "-T",
      "fields",
      "-E",
      "separator=\t",
      "-E",
      "quote=n",
      "-e",
      "http.host",
      "-e",
      "http.request.method",
      "-e",
      "http.request.uri",
      "-e",
      "http.file_data",
    ])
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| format!("spawn tshark: {e}"))?;

  let stdout = child
    .stdout
    .take()
    .ok_or_else(|| "tshark stdout missing".to_string())?;

  {
    let mut guard = host.child.lock().map_err(|_| "capture lock poisoned")?;
    *guard = Some(child);
  }

  emit(
    &app,
    CaptureEvent::Started {
      interface_id: chosen.clone(),
    },
  );

  let app_reader = app.clone();
  thread::spawn(move || {
    let reader = BufReader::new(stdout);
    for line in reader.lines().flatten() {
      let parts: Vec<&str> = line.split('\t').collect();
      if parts.len() < 3 {
        continue;
      }
      let host = parts[0].trim();
      let method = parts[1].trim();
      let path = parts[2].trim();
      if host.is_empty() {
        continue;
      }
      if host.to_ascii_lowercase().contains("es-dis") {
        emit(&app_reader, CaptureEvent::DiscoveryTraffic);
      }
      let body_raw = parts.get(3).copied().unwrap_or("").trim();
      if body_raw.is_empty() {
        continue;
      }
      let Some(bytes) = decode_http_file_data(body_raw) else {
        continue;
      };
      let Ok(text) = String::from_utf8(bytes) else {
        continue;
      };
      let Ok(body) = serde_json::from_str::<serde_json::Value>(&text) else {
        continue;
      };
      emit(
        &app_reader,
        CaptureEvent::HttpJson {
          host: host.to_string(),
          method: method.to_string(),
          path: path.to_string(),
          body,
        },
      );
    }
  });

  Ok(chosen)
}

#[tauri::command]
pub fn list_capture_interfaces(app: AppHandle) -> Result<Vec<CaptureInterfaceDto>, String> {
  let tshark = resolve_tshark_bin(&app)?;
  list_interfaces(&tshark)
}

#[tauri::command]
pub fn start_capture_cmd(
  app: AppHandle,
  host: State<'_, CaptureHost>,
  interface_id: Option<String>,
) -> Result<String, String> {
  start_capture(app, &host, interface_id)
}

#[tauri::command]
pub fn stop_capture_cmd(app: AppHandle, host: State<'_, CaptureHost>) -> Result<(), String> {
  stop_capture(&app, &host);
  Ok(())
}

#[tauri::command]
pub fn save_capture_interface(interface_id: String) -> Result<(), String> {
  save_interface_id(&interface_id)
}

#[tauri::command]
pub fn probe_keylog_status() -> Result<KeylogStatus, String> {
  let path = ssl_keylog_path()?;
  let present = path.exists();
  let non_empty = match fs::metadata(&path) {
    Ok(meta) => meta.len() > 0,
    Err(_) => false,
  };
  Ok(KeylogStatus {
    path: path.to_string_lossy().into_owned(),
    present,
    non_empty,
  })
}
