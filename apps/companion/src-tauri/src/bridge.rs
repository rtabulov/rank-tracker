use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub const BRIDGE_HOST: &str = "127.0.0.1";
pub const BRIDGE_PORT: u16 = 37_654;
const RANK_TRACKER_URL: &str = "https://rank.rtabulov.dev/";
const CORS_ORIGINS: &[&str] = &[
  "https://rank.rtabulov.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanionProposal {
  pub rs: u32,
  pub captured_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CompanionHealth {
  version: String,
  phase: String,
  connected: bool,
}

#[derive(Debug, Default)]
struct BridgeInner {
  proposal: Option<CompanionProposal>,
  phase: String,
  connected: bool,
}

pub struct BridgeHost {
  inner: Arc<Mutex<BridgeInner>>,
  version: String,
  server: Mutex<Option<JoinHandle<()>>>,
}

impl BridgeHost {
  pub fn new(version: String) -> Self {
    Self {
      inner: Arc::new(Mutex::new(BridgeInner {
        phase: "consent".into(),
        ..BridgeInner::default()
      })),
      version,
      server: Mutex::new(None),
    }
  }

  pub fn set_phase(&self, phase: &str) {
    if let Ok(mut inner) = self.inner.lock() {
      inner.phase = phase.to_string();
    }
  }

  pub fn set_proposal(
    &self,
    proposal: CompanionProposal,
    auto_open: bool,
    pwa_connected: bool,
  ) -> Result<(), String> {
    {
      let mut inner = self
        .inner
        .lock()
        .map_err(|_| "bridge lock poisoned".to_string())?;
      inner.proposal = Some(proposal);
    }
    if auto_open && !pwa_connected {
      open_rank_tracker()?;
    }
    Ok(())
  }

  pub fn clear_proposal(&self) -> Result<(), String> {
    let mut inner = self
      .inner
      .lock()
      .map_err(|_| "bridge lock poisoned".to_string())?;
    inner.proposal = None;
    Ok(())
  }

  pub fn start(&self, app: AppHandle) -> Result<(), String> {
    let mut guard = self
      .server
      .lock()
      .map_err(|_| "bridge server lock poisoned".to_string())?;
    if guard.is_some() {
      return Ok(());
    }

    let inner = Arc::clone(&self.inner);
    let version = self.version.clone();
    let handle = thread::Builder::new()
      .name("companion-bridge".into())
      .spawn(move || run_server(app, inner, version))
      .map_err(|e| format!("spawn bridge server: {e}"))?;
    *guard = Some(handle);
    Ok(())
  }

  pub fn stop(&self) {
    if let Ok(mut guard) = self.server.lock() {
      *guard = None;
    }
  }
}

fn open_rank_tracker() -> Result<(), String> {
  #[cfg(windows)]
  {
    std::process::Command::new("cmd")
      .args(["/C", "start", "", RANK_TRACKER_URL])
      .spawn()
      .map_err(|e| format!("open rank tracker: {e}"))?;
    return Ok(());
  }
  #[cfg(not(windows))]
  {
    Err("open rank tracker is only supported on Windows".into())
  }
}

fn run_server(app: AppHandle, inner: Arc<Mutex<BridgeInner>>, version: String) {
  let server = match tiny_http::Server::http((BRIDGE_HOST, BRIDGE_PORT)) {
    Ok(server) => server,
    Err(err) => {
      log::error!("bridge bind failed: {err}");
      return;
    }
  };

  log::info!("companion bridge listening on http://{BRIDGE_HOST}:{BRIDGE_PORT}");

  loop {
    let request = match server.recv_timeout(Duration::from_millis(500)) {
      Ok(Some(request)) => request,
      Ok(None) => continue,
      Err(err) => {
        log::warn!("bridge recv error: {err}");
        break;
      }
    };

    let app = app.clone();
    let inner = Arc::clone(&inner);
    let version = version.clone();
    thread::spawn(move || {
      if let Err(err) = handle_request(&app, &inner, &version, request) {
        log::warn!("bridge response error: {err}");
      }
    });
  }
}

fn handle_request(
  app: &AppHandle,
  inner: &Arc<Mutex<BridgeInner>>,
  version: &str,
  request: tiny_http::Request,
) -> Result<(), std::io::Error> {
  let method = request.method().clone();
  let origin = header_value(&request, "Origin");
  let path = request.url().to_string();

  if method == tiny_http::Method::Options {
    return write_response(
      request,
      cors_response(204, origin.as_deref(), b"").with_header(
        tiny_http::Header::from_bytes(&b"Access-Control-Allow-Methods"[..], b"GET, POST, OPTIONS")
          .unwrap(),
      ).with_header(
        tiny_http::Header::from_bytes(&b"Access-Control-Allow-Headers"[..], b"Content-Type")
          .unwrap(),
      ),
    );
  }

  if !is_allowed_origin(origin.as_deref()) {
    return write_response(request, cors_response(403, origin.as_deref(), b""));
  }

  mark_pwa_connected(app, inner, origin.as_deref().unwrap_or_default());

  let response = match (method.as_str(), path.as_str()) {
    ("GET", "/health") => {
      let health = read_health(inner, version);
      json_response(200, origin.as_deref(), &health)
    }
    ("GET", "/proposal") => {
      let proposal = {
        let guard = inner.lock().ok();
        guard.and_then(|g| g.proposal.clone())
      };
      match proposal {
        Some(proposal) => json_response(200, origin.as_deref(), &proposal),
        None => cors_response(204, origin.as_deref(), b""),
      }
    }
    ("POST", "/proposal/clear") => {
      if let Ok(mut guard) = inner.lock() {
        guard.proposal = None;
      }
      let _ = app.emit("bridge-event", serde_json::json!({ "kind": "proposal_cleared" }));
      cors_response(204, origin.as_deref(), b"")
    }
    _ => cors_response(404, origin.as_deref(), b""),
  };

  write_response(request, response)
}

fn read_health(inner: &Arc<Mutex<BridgeInner>>, version: &str) -> CompanionHealth {
  let guard = inner.lock().ok();
  if let Some(guard) = guard {
    return CompanionHealth {
      version: version.to_string(),
      phase: guard.phase.clone(),
      connected: guard.connected,
    };
  }
  CompanionHealth {
    version: version.to_string(),
    phase: "error".into(),
    connected: false,
  }
}

fn mark_pwa_connected(app: &AppHandle, inner: &Arc<Mutex<BridgeInner>>, origin: &str) {
  if origin.is_empty() {
    return;
  }
  let became_connected = {
    let mut guard = match inner.lock() {
      Ok(guard) => guard,
      Err(_) => return,
    };
    if guard.connected {
      return;
    }
    guard.connected = true;
    true
  };
  if became_connected {
    let _ = app.emit(
      "bridge-event",
      serde_json::json!({ "kind": "pwa_connected", "origin": origin }),
    );
  }
}

fn is_allowed_origin(origin: Option<&str>) -> bool {
  let Some(origin) = origin else {
    return false;
  };
  CORS_ORIGINS.contains(&origin)
}

fn header_value(request: &tiny_http::Request, name: &str) -> Option<String> {
  let target = name.to_ascii_lowercase();
  request
    .headers()
    .iter()
    .find(|header| header.field.as_str().as_str().eq_ignore_ascii_case(&target))
    .map(|header| header.value.as_str().to_string())
}

fn cors_response(
  status: u16,
  origin: Option<&str>,
  body: &[u8],
) -> tiny_http::Response<std::io::Cursor<Vec<u8>>> {
  let mut response = tiny_http::Response::from_data(body.to_vec()).with_status_code(status);
  if let Some(origin) = origin {
    if is_allowed_origin(Some(origin)) {
      response = response
        .with_header(
          tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], origin.as_bytes())
            .unwrap(),
        )
        .with_header(tiny_http::Header::from_bytes(&b"Vary"[..], b"Origin").unwrap());
    }
  }
  response
}

fn json_response<T: Serialize>(
  status: u16,
  origin: Option<&str>,
  payload: &T,
) -> tiny_http::Response<std::io::Cursor<Vec<u8>>> {
  let body = serde_json::to_vec(payload).unwrap_or_default();
  let mut response = tiny_http::Response::from_data(body)
    .with_status_code(status)
    .with_header(
      tiny_http::Header::from_bytes(&b"Content-Type"[..], b"application/json").unwrap(),
    );
  if let Some(origin) = origin {
    if is_allowed_origin(Some(origin)) {
      response = response
        .with_header(
          tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], origin.as_bytes())
            .unwrap(),
        )
        .with_header(tiny_http::Header::from_bytes(&b"Vary"[..], b"Origin").unwrap());
    }
  }
  response
}

fn write_response(
  request: tiny_http::Request,
  response: tiny_http::Response<std::io::Cursor<Vec<u8>>>,
) -> Result<(), std::io::Error> {
  request.respond(response)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetProposalInput {
  pub rs: u32,
  pub captured_at: String,
  pub auto_open: bool,
  pub pwa_connected: bool,
}

#[tauri::command]
pub fn start_bridge_cmd(app: AppHandle, host: tauri::State<'_, BridgeHost>) -> Result<(), String> {
  host.start(app)
}

#[tauri::command]
pub fn set_proposal_cmd(
  host: tauri::State<'_, BridgeHost>,
  input: SetProposalInput,
) -> Result<(), String> {
  host.set_proposal(
    CompanionProposal {
      rs: input.rs,
      captured_at: input.captured_at,
    },
    input.auto_open,
    input.pwa_connected,
  )
}

#[tauri::command]
pub fn clear_proposal_cmd(host: tauri::State<'_, BridgeHost>) -> Result<(), String> {
  host.clear_proposal()
}

#[tauri::command]
pub fn sync_bridge_phase_cmd(host: tauri::State<'_, BridgeHost>, phase: String) -> Result<(), String> {
  host.set_phase(&phase);
  Ok(())
}
