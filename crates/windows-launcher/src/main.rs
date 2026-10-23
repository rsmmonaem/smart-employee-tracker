#![windows_subsystem = "windows"]

use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const APP_EXE: &[u8] = include_bytes!("../../../target/x86_64-pc-windows-gnu/release/app.exe");
const WEBVIEW2_DLL: &[u8] = include_bytes!("../../../target/x86_64-pc-windows-gnu/release/WebView2Loader.dll");

fn main() {
    // 1. Try to drop WebView2Loader.dll right next to the launcher exe in the download folder
    if let Ok(current_exe) = env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            let local_dll = parent.join("WebView2Loader.dll");
            if !local_dll.exists() {
                let _ = fs::write(&local_dll, WEBVIEW2_DLL);
            }
        }
    }

    // 2. Setup persistent application directory in %LOCALAPPDATA%\TracMatrix\Tracker
    let app_dir: PathBuf = match env::var_os("LOCALAPPDATA") {
        Some(local_appdata) => PathBuf::from(local_appdata).join("TracMatrix").join("Tracker"),
        None => match env::var_os("APPDATA") {
            Some(appdata) => PathBuf::from(appdata).join("TracMatrix").join("Tracker"),
            None => env::temp_dir().join("TracMatrix-Tracker"),
        },
    };

    let _ = fs::create_dir_all(&app_dir);

    let target_exe = app_dir.join("Smart-Employee-Tracker-Core.exe");
    let target_dll = app_dir.join("WebView2Loader.dll");

    // Write or update DLL if needed
    if !target_dll.exists() || fs::metadata(&target_dll).map(|m| m.len()).unwrap_or(0) != WEBVIEW2_DLL.len() as u64 {
        let _ = fs::write(&target_dll, WEBVIEW2_DLL);
    }

    // Write or update APP_EXE if needed
    if !target_exe.exists() || fs::metadata(&target_exe).map(|m| m.len()).unwrap_or(0) != APP_EXE.len() as u64 {
        let _ = fs::write(&target_exe, APP_EXE);
    }

    // Collect command line arguments (skip arg 0)
    let args: Vec<std::ffi::OsString> = env::args_os().skip(1).collect();

    // Launch the core application
    let mut cmd = Command::new(&target_exe);
    cmd.args(&args);
    cmd.current_dir(&app_dir);
    cmd.stdin(Stdio::null());
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    let _ = cmd.spawn();
}
