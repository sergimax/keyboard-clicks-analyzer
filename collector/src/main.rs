//! Low-level keyboard hook: emits NDJSON for key-down and OS auto-repeat.
//! Fields: sc, ext, t, rep (0=first down, 1=auto-repeat), mods (bitmask of other held modifiers).
//! No text/layout/window data.

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

// Virtual-key codes used to normalize a few physical keys that Windows reports inconsistently.
const VK_LWIN: u32 = 0x5B;
const VK_RWIN: u32 = 0x5C;
const VK_APPS: u32 = 0x5D; // Menu
const VK_RSHIFT: u32 = 0xA1;

// Modifier bit masks — keep in sync with src/shared/modifiers.ts
const MOD_LCTRL: u8 = 1 << 0;
const MOD_RCTRL: u8 = 1 << 1;
const MOD_LSHIFT: u8 = 1 << 2;
const MOD_RSHIFT: u8 = 1 << 3;
const MOD_LALT: u8 = 1 << 4;
const MOD_RALT: u8 = 1 << 5;
const MOD_LWIN: u8 = 1 << 6;
const MOD_RWIN: u8 = 1 << 7;

fn key_id(sc: u32, extended: bool) -> u32 {
    sc | if extended { 0xE000 } else { 0 }
}

fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Prefer stable physical ids for keys Windows tags inconsistently (RShift extended bit, Win/Menu).
fn physical_sc_ext(vk: u32, scan_code: u32, extended: bool) -> (u32, bool) {
    match vk {
        VK_RSHIFT => (0x36, true),
        VK_LWIN => (0x5B, true),
        VK_RWIN => (0x5C, true),
        VK_APPS => (0x5D, true),
        _ => (scan_code, extended),
    }
}

/// Bits for modifiers currently in `held` (excluding the key being pressed).
fn modifier_mask(held: &HashSet<u32>, exclude: u32) -> u8 {
    let mut mask = 0u8;
    let check = |id: u32, bit: u8, m: &mut u8| {
        if id != exclude && held.contains(&id) {
            *m |= bit;
        }
    };
    check(key_id(0x1D, false), MOD_LCTRL, &mut mask); // 29
    check(key_id(0x1D, true), MOD_RCTRL, &mut mask);
    check(key_id(0x2A, false), MOD_LSHIFT, &mut mask); // 42
    check(key_id(0x36, true), MOD_RSHIFT, &mut mask); // 54
    check(key_id(0x38, false), MOD_LALT, &mut mask); // 56
    check(key_id(0x38, true), MOD_RALT, &mut mask);
    check(key_id(0x5B, true), MOD_LWIN, &mut mask);
    check(key_id(0x5C, true), MOD_RWIN, &mut mask);
    mask
}

unsafe extern "system" fn keyboard_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let info = &*(lparam.0 as *const KBDLLHOOKSTRUCT);
        let flags = info.flags;
        let is_up = flags.contains(LLKHF_UP);
        let (sc, extended) =
            physical_sc_ext(info.vkCode, info.scanCode, flags.contains(LLKHF_EXTENDED));
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
                let (first_down, mods) = if let Ok(mut guard) = HELD.lock() {
                    let held = guard.get_or_insert_with(HashSet::new);
                    let mods = modifier_mask(held, id);
                    let first_down = held.insert(id);
                    (first_down, mods)
                } else {
                    (false, 0u8)
                };

                let line = format!(
                    "{{\"sc\":{},\"ext\":{},\"t\":{},\"rep\":{},\"mods\":{}}}\n",
                    sc,
                    if extended { 1 } else { 0 },
                    unix_ms(),
                    if first_down { 0 } else { 1 },
                    mods
                );
                let _ = io::stdout().write_all(line.as_bytes());
                let _ = io::stdout().flush();
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
