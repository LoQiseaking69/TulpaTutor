//! TulpaTutor's WebAssembly bridge to the Tulpa runtime (`tulpa::embed`).
//!
//! A plain C ABI with no generated glue: the browser worker (web/src/runtime/worker.js)
//! passes UTF-8 buffers in linear memory and reads results back through `tt_ret_ptr/len`.
//! Program output streams out through the imported `env.tt_out` as it is printed.
//!
//! Imports the host provides (module `env`): `tt_out(ptr, len)`, `tt_now_ms() -> f64`,
//! `tt_wall_ms() -> f64`, `tt_sleep_ms(ms: f64)`.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tulpa::embed::{self, Feed, RunConfig, Session};

#[link(wasm_import_module = "env")]
extern "C" {
    fn tt_out(ptr: *const u8, len: usize);
}

fn emit(s: &str) {
    unsafe { tt_out(s.as_ptr(), s.len()) }
}

thread_local! {
    static RET: RefCell<String> = const { RefCell::new(String::new()) };
    static INPUT: RefCell<VecDeque<String>> = const { RefCell::new(VecDeque::new()) };
    static REPL: RefCell<Option<Session>> = const { RefCell::new(None) };
}

fn ret(s: impl Into<String>) {
    RET.with(|r| *r.borrow_mut() = s.into());
}

unsafe fn arg(ptr: *const u8, len: usize) -> String {
    if len == 0 {
        return String::new();
    }
    String::from_utf8_lossy(std::slice::from_raw_parts(ptr, len)).into_owned()
}

fn work() -> PathBuf {
    PathBuf::from("/work")
}

fn config(virtual_time: bool) -> RunConfig {
    RunConfig {
        base_dir: work(),
        args: vec![],
        virtual_time,
        output: Rc::new(emit),
        input: Some(Rc::new(|prompt: &str| {
            if !prompt.is_empty() {
                emit(prompt);
            }
            let line = INPUT.with(|q| q.borrow_mut().pop_front());
            if let Some(l) = &line {
                emit(&format!("{l}\n"));
            }
            line
        })),
        cancel: Arc::new(AtomicBool::new(false)),
    }
}

// ------------------------------------------------------------------ memory & plumbing

#[no_mangle]
pub extern "C" fn tt_alloc(len: usize) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(len.max(1));
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}

/// # Safety
/// `ptr` must come from `tt_alloc(len)`.
#[no_mangle]
pub unsafe extern "C" fn tt_free(ptr: *mut u8, len: usize) {
    drop(Vec::from_raw_parts(ptr, 0, len.max(1)));
}

#[no_mangle]
pub extern "C" fn tt_ret_ptr() -> *const u8 {
    RET.with(|r| r.borrow().as_ptr())
}

#[no_mangle]
pub extern "C" fn tt_ret_len() -> usize {
    RET.with(|r| r.borrow().len())
}

#[no_mangle]
pub extern "C" fn tt_init() {
    std::panic::set_hook(Box::new(|info| {
        emit(&format!("\n@@panic {info}\n"));
    }));
    // tlm:: telemetry (`@@tlm {json}` lines) is always on in the browser build
}

/// # Safety
/// Buffers must be valid UTF-8 regions in linear memory.
#[no_mangle]
pub unsafe extern "C" fn tt_vfs_put(p: *const u8, pl: usize, d: *const u8, dl: usize) {
    tulpa::wfs::put(&arg(p, pl), arg(d, dl));
}

#[no_mangle]
pub extern "C" fn tt_vfs_clear_work() {
    tulpa::wfs::clear_work();
}

/// Queues one line for the program's next `input()` call.
///
/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_input_push(p: *const u8, l: usize) {
    let s = arg(p, l);
    INPUT.with(|q| q.borrow_mut().push_back(s));
}

#[no_mangle]
pub extern "C" fn tt_version() {
    ret(embed::version());
}

#[no_mangle]
pub extern "C" fn tt_modules() {
    ret(embed::modules());
}

// ------------------------------------------------------------------ running code

/// Runs a whole program. 0 = finished, 1 = error (message in ret).
///
/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_run(p: *const u8, l: usize, virtual_time: i32) -> i32 {
    let src = arg(p, l);
    match embed::run(&src, "main.rav", config(virtual_time != 0)) {
        Ok(()) => {
            ret("");
            0
        }
        Err(e) => {
            ret(e);
            1
        }
    }
}

/// Runs `define_test!` blocks; JSON `{passed, failed:[{name,error}]}` in ret.
///
/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_tests(p: *const u8, l: usize, virtual_time: i32) -> i32 {
    let src = arg(p, l);
    match embed::tests(&src, "main.rav", config(virtual_time != 0)) {
        Ok(j) => {
            ret(j);
            0
        }
        Err(e) => {
            ret(e);
            1
        }
    }
}

/// Contract fuzzing; JSON array in ret.
///
/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_verify(p: *const u8, l: usize, trials: i32) -> i32 {
    let src = arg(p, l);
    match embed::verify(&src, work(), trials.max(1) as usize, Arc::new(AtomicBool::new(false))) {
        Ok(j) => {
            ret(j);
            0
        }
        Err(e) => {
            ret(e);
            1
        }
    }
}

// ------------------------------------------------------------------ editor intelligence

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_diagnostics(p: *const u8, l: usize) {
    ret(embed::diagnostics(&arg(p, l)));
}

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_completion(p: *const u8, l: usize, line: usize, col: usize) {
    ret(embed::completion(&arg(p, l), line, col));
}

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_hover(p: *const u8, l: usize, line: usize, col: usize) {
    ret(embed::hover(&arg(p, l), line, col).unwrap_or_default());
}

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_symbols(p: *const u8, l: usize) {
    ret(embed::symbols(&arg(p, l)));
}

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_machines(p: *const u8, l: usize) {
    ret(embed::machines(&arg(p, l)));
}

/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_bytecode(p: *const u8, l: usize) -> i32 {
    match embed::bytecode(&arg(p, l)) {
        Ok(s) => {
            ret(s);
            0
        }
        Err(e) => {
            ret(e);
            1
        }
    }
}

// ------------------------------------------------------------------ REPL

#[no_mangle]
pub extern "C" fn tt_repl_reset() {
    let mut s = Session::new(Rc::new(emit), None, Arc::new(AtomicBool::new(false)));
    s.set_base_dir(work());
    REPL.with(|r| *r.borrow_mut() = Some(s));
}

/// Feeds a line. 0 = evaluated (repr or "" in ret), 1 = needs more lines, 2 = error.
///
/// # Safety
/// Valid UTF-8 buffer.
#[no_mangle]
pub unsafe extern "C" fn tt_repl_feed(p: *const u8, l: usize) -> i32 {
    let line = arg(p, l);
    if REPL.with(|r| r.borrow().is_none()) {
        tt_repl_reset();
    }
    let f = REPL.with(|r| r.borrow_mut().as_mut().unwrap().feed(&line));
    match f {
        Feed::More => {
            ret("");
            1
        }
        Feed::Value(v) => {
            ret(v.unwrap_or_default());
            0
        }
        Feed::Error(e) => {
            ret(e);
            2
        }
    }
}
