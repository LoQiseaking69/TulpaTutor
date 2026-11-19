#!/usr/bin/env bash
# Builds web/public/tulpa/tulpa.wasm and the stdlib bundle from the pinned TulpaLang (TULPA_REF).
#
#   scripts/build-wasm.sh                 # fetch TulpaLang at TULPA_REF into .build/tulpa
#   TULPA_SRC=../TulpaLang scripts/build-wasm.sh   # use a local checkout instead (copied)
#
# Needs Rust with the wasm32-unknown-unknown target (`rustup target add wasm32-unknown-unknown`).
# Set TULPA_BUILD_STD=1 to build std from rust-src instead (offline toolchains without the target).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
REF=$(tr -d ' \n' < TULPA_REF)
DEST=.build/tulpa

if [ -n "${TULPA_SRC:-}" ]; then
  rm -rf "$DEST" && mkdir -p "$DEST"
  (cd "$TULPA_SRC" && tar --exclude=.git --exclude=target --exclude=node_modules -cf - Cargo.toml Cargo.lock src stdlib runtime examples docs) | tar -xf - -C "$DEST"
elif [ ! -f "$DEST/.ref" ] || [ "$(cat "$DEST/.ref")" != "$REF" ]; then
  rm -rf "$DEST" && mkdir -p "$DEST"
  git -C "$DEST" init -q
  git -C "$DEST" remote add origin https://github.com/LoQiseaking69/TulpaLang
  git -C "$DEST" fetch -q --depth 1 origin "$REF"
  git -C "$DEST" checkout -q FETCH_HEAD
  echo "$REF" > "$DEST/.ref"
fi

python3 scripts/patch_tulpa_wasm.py "$DEST"

export RUSTFLAGS="-C link-arg=-zstack-size=16777216 -C target-feature=+bulk-memory,+mutable-globals,+sign-ext,+nontrapping-fptoint"
EXTRA=()
if [ "${TULPA_BUILD_STD:-0}" = 1 ]; then
  export RUSTC_BOOTSTRAP=1
  EXTRA=(-Zbuild-std=std,panic_abort -Zbuild-std-features=)
fi
(cd runtime && cargo build --release --target wasm32-unknown-unknown "${EXTRA[@]}")

OUT=web/public/tulpa
mkdir -p "$OUT"
cp runtime/target/wasm32-unknown-unknown/release/tulpa_web.wasm "$OUT/tulpa.wasm"
python3 scripts/bundle_stdlib.py "$DEST/stdlib" "$OUT/stdlib.json"
grep -m1 '^version' "$DEST/Cargo.toml" | sed 's/.*"\(.*\)"/\1/' > "$OUT/VERSION"
echo "tulpa.wasm: $(du -h "$OUT/tulpa.wasm" | cut -f1)  (Tulpa $(cat "$OUT/VERSION"), $REF)"
