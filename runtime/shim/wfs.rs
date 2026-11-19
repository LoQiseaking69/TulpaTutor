//! File shim (added by TulpaTutor's wasm patch). The browser has no file system, so on wasm32
//! imports and `read_file` go through an in-memory store that the host fills: the standard
//! library under `/std/` and the learner's files under `/work/`. Elsewhere it is `std::fs`.

use std::io;
use std::path::{Path, PathBuf};

#[cfg(not(target_arch = "wasm32"))]
pub fn exists(p: &Path) -> bool {
    p.exists()
}
#[cfg(not(target_arch = "wasm32"))]
pub fn is_file(p: &Path) -> bool {
    p.is_file()
}
#[cfg(not(target_arch = "wasm32"))]
pub fn canonicalize<P: AsRef<Path>>(p: P) -> io::Result<PathBuf> {
    std::fs::canonicalize(p)
}
#[cfg(not(target_arch = "wasm32"))]
pub fn read_to_string<P: AsRef<Path>>(p: P) -> io::Result<String> {
    std::fs::read_to_string(p)
}

#[cfg(target_arch = "wasm32")]
mod store {
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::path::{Component, Path, PathBuf};

    thread_local! {
        static FILES: RefCell<HashMap<PathBuf, String>> = RefCell::new(HashMap::new());
    }

    /// Lexically normalises `a/./b/../c` and makes relative paths absolute under `/work`.
    pub fn norm(p: &Path) -> PathBuf {
        let mut out = PathBuf::from("/");
        let p = if p.is_absolute() { p.to_path_buf() } else { Path::new("/work").join(p) };
        for c in p.components() {
            match c {
                Component::ParentDir => {
                    out.pop();
                }
                Component::Normal(s) => out.push(s),
                _ => {}
            }
        }
        out
    }

    pub fn put(path: &str, data: String) {
        FILES.with(|f| f.borrow_mut().insert(norm(Path::new(path)), data));
    }
    pub fn get(p: &Path) -> Option<String> {
        FILES.with(|f| f.borrow().get(&norm(p)).cloned())
    }
    pub fn clear_work() {
        FILES.with(|f| f.borrow_mut().retain(|k, _| k.starts_with("/std")));
    }
}

#[cfg(target_arch = "wasm32")]
pub use store::{clear_work, put};

#[cfg(target_arch = "wasm32")]
pub fn exists(p: &Path) -> bool {
    store::get(p).is_some()
}
#[cfg(target_arch = "wasm32")]
pub fn is_file(p: &Path) -> bool {
    store::get(p).is_some()
}
#[cfg(target_arch = "wasm32")]
pub fn canonicalize<P: AsRef<Path>>(p: P) -> io::Result<PathBuf> {
    let n = store::norm(p.as_ref());
    if store::get(&n).is_some() {
        Ok(n)
    } else {
        Err(io::Error::new(io::ErrorKind::NotFound, "no such file"))
    }
}
#[cfg(target_arch = "wasm32")]
pub fn read_to_string<P: AsRef<Path>>(p: P) -> io::Result<String> {
    store::get(p.as_ref()).ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "no such file"))
}
