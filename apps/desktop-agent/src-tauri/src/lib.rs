use xcap::Monitor;
use active_win_pos_rs::get_active_window;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct ActiveWindowData {
    title: String,
    app_name: String,
}

#[tauri::command]
async fn capture_screen() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    
    // For now, grab the primary monitor (or just the first one)
    let monitor = monitors.into_iter().next().ok_or("No monitors found")?;
    
    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    
    // Convert RGBA to RGB8 because JPEG does not support alpha channel
    let rgb_image = image::DynamicImage::ImageRgba8(image).to_rgb8();
    
    let mut buffer = Vec::new();
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, 75);
    rgb_image.write_with_encoder(encoder).map_err(|e| e.to_string())?;
    
    // Return Base64 encoded string so the frontend can preview it and send it to Supabase
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![capture_screen, get_focused_window])
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
