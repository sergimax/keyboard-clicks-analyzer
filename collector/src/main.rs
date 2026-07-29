//! Low-level keyboard hook: emits one NDJSON line per physical key-down.
//! Fields: sc (scan code), ext (extended key), t (unix ms). No text/layout/window data.

use std::collections::HashSet;
use std::io::{self, Write};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use windows::Win32::Foundation::{HINSTANCE, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW, TranslateMessage,
    UnhookWindowsHookEx, KBDLLHOOKSTRUCT, MSG, WH_KEYBOARD_LL, WM_KEYDOWN, WM_SYSKEYDOWN,
    LLKHF_EXTENDED, LLKHF_UP,
};

static HELD: Mutex<Option<HashSet<u32>>> = Mutex::new(None);

fn key_id(sc: u32, extended: bool) -> u32 {
    // Pack scan code + extended bit so left/right variants stay distinct.
    sc | if extended { 0xE000 } else { 0 }
}

fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

unsafe extern "system" fn keyboard_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let info = &*(lparam.0 as *const KBDLLHOOKSTRUCT);
        let flags = info.flags;
        let is_up = flags.contains(LLKHF_UP);
        let extended = flags.contains(LLKHF_EXTENDED);
        let sc = info.scanCode;
        let id = key_id(sc, extended);

        if is_up {
            if let Ok(mut guard) = HELD.lock() {
                if let Some(held) = guard.as_mut() {
                    held.remove(&id);
                }
            }
        } else {
            let msg = wparam.0 as u32;
            if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
                let first_down = if let Ok(mut guard) = HELD.lock() {
                    let held = guard.get_or_insert_with(HashSet::new);
                    held.insert(id)
                } else {
                    false
                };

                if first_down {
                    let line = format!(
                        "{{\"sc\":{},\"ext\":{},\"t\":{}}}\n",
                        sc,
                        if extended { 1 } else { 0 },
                        unix_ms()
                    );
                    let _ = io::stdout().write_all(line.as_bytes());
                    let _ = io::stdout().flush();
                }
            }
        }
    }

    unsafe { CallNextHookEx(None, code, wparam, lparam) }
}

fn main() {
    let _ = io::stdout().flush();

    unsafe {
        let module = GetModuleHandleW(None).expect("GetModuleHandleW failed");
        let hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(keyboard_proc),
            Some(HINSTANCE(module.0)),
            0,
        )
        .expect("SetWindowsHookExW failed");

        {
            let mut guard = HELD.lock().expect("held lock");
            *guard = Some(HashSet::new());
        }

        eprintln!("collector: listening (Ctrl+C in parent to stop)");

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).into() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        let _ = UnhookWindowsHookEx(hook);
    }
}
