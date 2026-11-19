#!/usr/bin/env python3
"""Prepare a TulpaLang checkout for wasm32-unknown-unknown.

Usage: patch_tulpa_wasm.py <tulpalang-dir>

The patch is behaviour-neutral on native targets: `crate::wtime` and `crate::wfs` re-export
`std::time` / `std::fs` there. On wasm32 they route time and file access to the browser host
(see runtime/shim/). Idempotent: running it twice changes nothing.
"""
import pathlib
import re
import shutil
import sys

root = pathlib.Path(sys.argv[1]).resolve()
src = root / "src"
shim = pathlib.Path(__file__).resolve().parent.parent / "runtime" / "shim"

shutil.copy(shim / "wtime.rs", src / "wtime.rs")
shutil.copy(shim / "wfs.rs", src / "wfs.rs")

lib = (src / "lib.rs").read_text()
if "pub mod wtime;" not in lib:
    lib = lib.replace("pub mod vm;", "pub mod vm;\npub mod wfs;\npub mod wtime;")
    (src / "lib.rs").write_text(lib)

TIME = [
    (r"std::time::Instant", "crate::wtime::Instant"),
    (r"std::time::SystemTime", "crate::wtime::SystemTime"),
    (r"std::time::UNIX_EPOCH", "crate::wtime::UNIX_EPOCH"),
    (r"std::thread::sleep", "crate::wtime::sleep"),
    (r"^use std::time::Instant;", "use crate::wtime::Instant;"),
]
# File access used by the interpreter (imports, read_file, json::load). Other fs users
# (bundles, native builds, LSP) never run in the browser and are left alone.
FS_FILES = {"ext.rs", "builtins.rs", "stdx.rs", "stdx_path.rs", "dyncode.rs"}
FS = [
    (r"std::fs::read_to_string", "crate::wfs::read_to_string"),
    (r"std::fs::canonicalize", "crate::wfs::canonicalize"),
    (r"\bfull\.exists\(\)", "crate::wfs::exists(&full)"),
    (r"\bp\.is_file\(\)", "crate::wfs::is_file(&p)"),
]

changed = []
for f in sorted(src.rglob("*.rs")):
    if f.name in ("main.rs", "wtime.rs", "wfs.rs"):
        continue
    t = f.read_text()
    o = t
    for a, b in TIME:
        t = re.sub(a, b, t, flags=re.M)
    if f.name in FS_FILES and f.parent == src:
        for a, b in FS:
            t = re.sub(a, b, t)
    if t != o:
        f.write_text(t)
        changed.append(f.relative_to(root).as_posix())

# The standard library lives at /std in the browser store.
p = src / "stdx_path.rs"
t = p.read_text()
marker = 'out.push(Path::new(env!("CARGO_MANIFEST_DIR")).join("stdlib"));'
if "/std\")" not in t:
    t = t.replace(marker, marker + '\n    #[cfg(target_arch = "wasm32")]\n    out.insert(0, PathBuf::from("/std"));')
    p.write_text(t)
    changed.append("src/stdx_path.rs")

# Browser hosts always collect telemetry (env vars do not exist on wasm32).
p = src / "stdx.rs"
t = p.read_text()
old = 'std::env::var_os("TULPA_TELEMETRY").is_some_and(|v| v != "0")'
if old in t and "target_arch = \"wasm32\"" not in t.split(old)[0][-80:]:
    t = t.replace(old, 'cfg!(target_arch = "wasm32") || ' + old)
    p.write_text(t)
    changed.append("src/stdx.rs")

# Browser engines give a worker about 1 MB of native stack, which the interpreter tier
# exhausts at ~500 nested Tulpa calls. Cap recursion below that so learners see Tulpa's own
# "maximum recursion depth" error instead of an engine crash.
p = src / "interp.rs"
t = p.read_text()
old = "const MAX_DEPTH: usize = 2500;"
if old in t:
    t = t.replace(old, '#[cfg(not(target_arch = "wasm32"))]\n' + old + '\n#[cfg(target_arch = "wasm32")]\nconst MAX_DEPTH: usize = 400;')
    p.write_text(t)
    changed.append("src/interp.rs")

print("patched:", ", ".join(sorted(set(changed))) or "nothing (already patched)")
