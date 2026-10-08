use std::env;
use std::process::Command;

fn main() {
    let target = env::var("TARGET").unwrap_or_default();
    if target.contains("windows") {
        let rc_content = "1 ICON \"../../apps/desktop-agent/src-tauri/icons/icon.ico\"\n";
        let out_dir = env::var("OUT_DIR").unwrap();
        let rc_path = format!("{}/icon.rc", out_dir);
        let res_path = format!("{}/icon.o", out_dir);

        let _ = std::fs::write(&rc_path, rc_content);

        let status = Command::new("x86_64-w64-mingw32-windres")
            .args(&["-i", &rc_path, "-o", &res_path])
            .status();

        if let Ok(s) = status {
            if s.success() {
                println!("cargo:rustc-link-arg={}", res_path);
            }
        }
    }
}
