# Desktop Agent Event Pipeline — TimeGuard

The desktop agent is a **Tauri 2 app** (Rust backend + Vite/React UI) that
runs on **Windows, macOS, and Linux**.  This document describes exactly how
tracking events are captured, queued, and delivered.

---

## 1. Threading Model

```
main thread    → Tauri event loop + tray icon
background 1   → active_window::poll()     every 5 s
background 2   → idle::monitor()           every 1 s
background 3   → screenshot::capture()     every N s (from agent/config)
background 4   → event_queue::flush()      every 30 s
```

All background tasks are tokio tasks spawned from `main.rs` on startup.
They communicate with the main thread via Tauri events and with each other
via an `Arc<Mutex<EventQueue>>`.

---

## 2. Active Window Polling (`tracker/active_window.rs`)

Poll every 5 seconds.  Compare to previous result — only emit an event when
the app/title changes.  Each event records the *previous* window's duration:

```rust
ActivityEvent {
    app_name: "Visual Studio Code",
    window_title: "main.rs — smart-employee-tracker",
    domain: None,          // Some("github.com") if foreground is a browser
    started_at: prev_ts,
    ended_at: now,
}
```

**Platform implementations**:

| Platform | Method |
|---|---|
| macOS | `active-win-pos-rs` crate (wraps NSWorkspace) |
| Windows | `active-win-pos-rs` crate (wraps GetForegroundWindow) |
| Linux X11 | `active-win-pos-rs` or direct xcb query |
| Linux Wayland | `ydotool` + compositor extension; falls back to X11 socket if XWayland |

**Browser domain extraction**: if `app_name` matches a known browser list
(Chrome, Firefox, Edge, Safari, Brave), parse `window_title` for a domain
using a regex — most browsers include the site name in the title.

---

## 3. Idle Detection (`tracker/idle.rs`)

Check last-input timestamp every 1 s (platform-specific API).
Default idle threshold: 5 minutes (300 s), configurable from `GET /agent/config`.

State machine:
```
ACTIVE ──(no input for threshold)──► IDLE   (emit idle_start event)
IDLE   ──(any input detected)──────► ACTIVE (emit idle_end event)
```

Platform APIs:
- **macOS**: `IOHIDGetLastActivity` via CoreGraphics
- **Windows**: `GetLastInputInfo`
- **Linux**: X11 `XScreenSaverQueryInfo` or `/proc/...` polling

---

## 4. Screenshot Capture (`tracker/screenshot.rs`)

Interval from `GET /agent/config` → `screenshot_interval_sec`.

Flow:
1. Capture full primary screen PNG using `screenshots` crate.
2. Optionally blur if employee has opted in (future feature).
3. Fetch presigned upload URL from `GET /agent/screenshot-upload-url`.
4. PUT the PNG directly to Supabase Storage (no API server relay).
5. POST `{ type: "screenshot", storage_path, taken_at }` to agent/events
   (or include in the next batch flush).

---

## 5. Event Queue (`tracker/event_queue.rs`)

**Offline-safety contract**: no event is ever lost due to network failure.

Implementation:
- Local SQLite database at `$APP_DATA_DIR/timeguard/queue.db`
- Table: `events (id INTEGER PK, payload TEXT, created_at TEXT, retries INTEGER)`
- All tracker modules write to SQLite synchronously before returning.
- Flush loop (every 30 s):
  1. SELECT up to 100 unprocessed rows.
  2. POST to `/agent/events` with full batch.
  3. On HTTP 200: DELETE those rows from SQLite.
  4. On failure: increment `retries`; back-off = `min(2^retries, 3600)` s.

---

## 6. Clock-in / Clock-out State Machine (`clock.rs`)

```
CLOCKED_OUT
    │  clock_in()
    ▼
CLOCKED_IN ──── break_start() ──► ON_BREAK
    │                                 │ break_end()
    │  clock_out()                    ▼
    ▼                          CLOCKED_IN (resumes)
CLOCKED_OUT
```

State is persisted to SQLite so it survives app restart.
Events (`clock_in`, `clock_out`, `break_start`, `break_end`) are enqueued
for batch upload like any other event.

---

## 7. Stealth Mode

When `tracking_mode = STEALTH` (returned by `GET /agent/config`):
- No tray icon is shown.
- Agent clocks in automatically on OS login.
- Startup registration:
  - **Windows**: HKCU\Software\Microsoft\Windows\CurrentVersion\Run
  - **macOS**: LaunchAgent plist in `~/Library/LaunchAgents/`
  - **Linux**: `~/.config/autostart/*.desktop` or systemd user service

Stealth mode **requires** that `users.consent_at` is set and non-null before
the agent will operate.  If the API returns `consent_required`, the agent
shows a one-time consent dialog even in stealth mode.

---

## 8. Tauri Commands (exposed to frontend via `commands.rs`)

```rust
#[tauri::command] fn get_status()   → ClockStatus
#[tauri::command] fn clock_in()     → Result<()>
#[tauri::command] fn clock_out()    → Result<()>
#[tauri::command] fn break_start()  → Result<()>
#[tauri::command] fn break_end()    → Result<()>
#[tauri::command] fn save_settings(device_token: String, api_url: String) → Result<()>
#[tauri::command] fn get_settings() → AgentSettings
```

---

## 9. Agent Config Consumption

On startup and every 5 minutes, the agent calls `GET /agent/config`:

```json
{
  "tracking_mode": "VISIBLE",
  "screenshot_interval_sec": 300,
  "idle_threshold_sec": 300
}
```

If `tracking_mode` changed, the agent adapts immediately (show/hide tray,
start/stop auto-clock).  Screenshot interval and idle threshold update the
polling loop timers without restart.

---

## 10. Build Targets

```bash
# Development
cd apps/desktop-agent
npm run tauri dev

# Production builds (run on each target OS or use CI)
npm run tauri build
```

Output artifacts:
| OS | Format | Location |
|---|---|---|
| Windows | .exe (NSIS installer) | `src-tauri/target/release/bundle/nsis/` |
| macOS | .dmg | `src-tauri/target/release/bundle/dmg/` |
| Linux | .AppImage + .deb | `src-tauri/target/release/bundle/appimage/` |

Code signing:
- **Windows**: EV code-signing certificate (required for SmartScreen)
- **macOS**: Developer ID Application cert + `notarytool` notarization
- Configure both in `tauri.conf.json` under `bundle.windows` and `bundle.macOS`
