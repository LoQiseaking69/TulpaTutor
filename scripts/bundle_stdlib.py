#!/usr/bin/env python3
"""Packs TulpaLang's stdlib/ into one JSON map {"/std/<path>.rav": source} for the browser."""
import json
import pathlib
import sys

lib = pathlib.Path(sys.argv[1])
out = {"/std/" + p.relative_to(lib).as_posix(): p.read_text() for p in sorted(lib.rglob("*.rav"))}
pathlib.Path(sys.argv[2]).write_text(json.dumps(out))
print(f"stdlib: {len(out)} files")
