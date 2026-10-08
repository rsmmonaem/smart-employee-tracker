use xcap::Monitor;
use active_win_pos_rs::get_active_window;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct ActiveWindowData {
    title: String,
    app_name: String,
}

#[derive(Serialize, Deserialize)]
pub struct CapturedScreen {
    pub screen_index: usize,
    pub screen_name: String,
    pub is_primary: bool,
    pub base64_image: String,
}

#[tauri::command]
async fn capture_all_screens() -> Result<Vec<CapturedScreen>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let mut screens = Vec::new();

    for (idx, monitor) in monitors.into_iter().enumerate() {
        let is_primary = monitor.is_primary().unwrap_or(idx == 0);
        let name = monitor.name().unwrap_or_default();
        let display_name = if name.trim().is_empty() {
            format!("Screen {}", idx + 1)
        } else {
            name
        };

        if let Ok(image) = monitor.capture_image() {
            let rgb_image = image::DynamicImage::ImageRgba8(image).to_rgb8();
            let mut buffer = Vec::new();
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, 75);
            if rgb_image.write_with_encoder(encoder).is_ok() {
                let base64_image = BASE64.encode(&buffer);
                screens.push(CapturedScreen {
                    screen_index: idx + 1,
                    screen_name: display_name,
                    is_primary,
                    base64_image,
                });
            }
        }
    }

    if screens.is_empty() {
        return Err("No monitor could be captured".to_string());
    }

    Ok(screens)
}

#[tauri::command]
async fn capture_screen() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    
    // Grab the primary monitor (or first one)
    let monitor = monitors.into_iter().next().ok_or("No monitors found")?;
    
    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    
    // Convert RGBA to RGB8 because JPEG does not support alpha channel
    let rgb_image = image::DynamicImage::ImageRgba8(image).to_rgb8();
    
    let mut buffer = Vec::new();
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, 75);
    rgb_image.write_with_encoder(encoder).map_err(|e| e.to_string())?;
    
    let base64_image = BASE64.encode(&buffer);
    Ok(base64_image)
}

#[tauri::command]
async fn get_focused_window() -> Result<ActiveWindowData, String> {
    match get_active_window() {
        Ok(active_window) => {
            Ok(ActiveWindowData {
                title: active_window.title.clone(),
                app_name: active_window.app_name.clone(),
            })
        },
        Err(e) => {
            // When there's no active window or permissions are denied
            Err(format!("Could not get active window: {:?}", e))
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct NativeHttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: std::collections::HashMap<String, String>,
    pub body_text: Option<String>,
    pub body_base64: Option<String>,
}

#[tauri::command]
async fn native_request(
    url: String,
    method: String,
    headers: std::collections::HashMap<String, String>,
    body: Option<Vec<u8>>,
) -> Result<NativeHttpResponse, String> {
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| e.to_string())?;

    let req_method = match method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "PATCH" => reqwest::Method::PATCH,
        "DELETE" => reqwest::Method::DELETE,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => reqwest::Method::GET,
    };

    let mut builder = client.request(req_method, &url);

    for (k, v) in headers {
        let lk = k.to_lowercase();
        if lk == "host" || lk == "content-length" {
            continue;
        }
        if let (Ok(hk), Ok(hv)) = (
            reqwest::header::HeaderName::from_bytes(k.as_bytes()),
            reqwest::header::HeaderValue::from_str(&v),
        ) {
            builder = builder.header(hk, hv);
        }
    }

    if let Some(b) = body {
        builder = builder.body(b);
    }

    let resp = builder.send().await.map_err(|e| format!("Network error: {}", e))?;

    let status = resp.status().as_u16();
    let status_text = resp.status().canonical_reason().unwrap_or("").to_string();

    let mut res_headers = std::collections::HashMap::new();
    for (name, val) in resp.headers() {
        if let Ok(v_str) = val.to_str() {
            res_headers.insert(name.as_str().to_string(), v_str.to_string());
        }
    }

    let bytes = resp.bytes().await.map_err(|e| format!("Failed to read body: {}", e))?;
    let (body_text, body_base64) = match String::from_utf8(bytes.to_vec()) {
        Ok(s) => (Some(s), None),
        Err(_) => (None, Some(BASE64.encode(&bytes))),
    };

    Ok(NativeHttpResponse {
        status,
        status_text,
        headers: res_headers,
        body_text,
        body_base64,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
        capture_all_screens,
        capture_screen,
        get_focused_window,
        native_request
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

