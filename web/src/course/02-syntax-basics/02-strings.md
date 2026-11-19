---
title: Strings and f-strings
minutes: 12
xp: 50
skill: syntax
summary: String methods, indexing, slicing and formatted strings for clean telemetry.
---
Robots talk: log messages, serial commands, telemetry. Strings carry all of it.

## Indexing and slicing

Strings are sequences of characters. Index from 0, or from the end with negative numbers.
A range `a..b` slices from `a` up to (not including) `b`; `a..=b` includes `b`:

```tulpa
let cmd = "MOVE 90"
print(cmd[0], cmd[-1])
print(cmd[0..4])
print(cmd[5..=6])
print(len(cmd))
```

## Useful methods

Methods are called with a dot:

```tulpa
let raw = "  Servo:OK  "
print(raw.strip())
print(raw.strip().lower())
print(raw.strip().split(":"))
print("a,b,c".split(",").join(" | "))
print("motor".upper(), "motor".starts_with("mo"), "motor".contains("tor"))
print("42".to_int() + 1, "3.5".to_float() * 2)
```

Parsing a serial reply is often just `strip`, `split` and `to_int`:

```tulpa
let reply = "TEMP=298;HUM=41\r\n"
let parts = reply.strip().split(";")
let temp = parts[0].split("=")[1].to_int()
print("temperature:", temp, "K")
```

## f-strings

Put `f` before a string and anything in `{}` is evaluated and inserted. A format spec after a
colon controls the display:

```tulpa
let joint = "elbow"
let angle = 87.456
print(f"{joint} at {angle:.1f} degrees")
print(f"raw = {255:#04x}, bits = {5:08b}")
print(f"[{joint:>8}] [{joint:<8}]")
print(f"speed: {12.5[m/s]:.1f}")
```

| Spec | Meaning | Example |
|---|---|---|
| `.2f` | 2 decimal places | `3.14` |
| `>8` / `<8` | right / left align in 8 chars | `   elbow` |
| `#04x` | hex with `0x`, padded | `0xff` |
| `08b` | binary, 8 digits | `00000101` |

Note how the quantity kept its unit.

## Strings are immutable

Methods return **new** strings; the original is unchanged:

```tulpa
let name = "rover"
let loud = name.upper()
print(name, loud)
```

```quiz
? What is `"ROBOT"[1..3]`?
+ `"OB"`
- `"OBO"`
- `"RO"`
> `1..3` takes indexes 1 and 2; the end is excluded.
? What does `f"{7:03}"` produce?
- `7.000`
+ `007`
- `  7`
> Width 3, padded with zeros.
```

:::exercise Parse a GPS sentence
A GPS module sends `"$FIX,51.5007,-0.1246,12"`. Split it and print:

```
lat=51.5007 lon=-0.1246 sats=12
```

```tulpa starter
let line = "$FIX,51.5007,-0.1246,12"
let parts = line.split(",")
```
```tulpa solution
let line = "$FIX,51.5007,-0.1246,12"
let parts = line.split(",")
print(f"lat={parts[1]} lon={parts[2]} sats={parts[3]}")
```
```expect
lat=51.5007 lon=-0.1246 sats=12
```
```hint
`parts[1]` is the latitude string. An f-string can insert all three.
:::

:::takeaways
- Index with `s[i]`, slice with `s[a..b]` / `s[a..=b]`; negative indexes count from the end.
- `strip split join upper lower contains starts_with to_int to_float`.
- f-strings: `f"{x:.2f}"`, `{n:#04x}`, `{s:>8}`; quantities keep their units.
:::
