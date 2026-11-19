---
title: Formatting Output
minutes: 10
xp: 50
skill: syntax
summary: println!, format specs, tables, hex dumps and timestamped logs.
---
Good output is how you debug a robot you cannot see inside. Tulpa gives you two formatting
styles: f-strings, which you know, and Rust-style formatting macros.

## println! and format!

`println!` takes a format string with `{}` placeholders filled in order. `format!` returns
the string instead of printing it:

```tulpa
println!("{} joints, {} sensors", 6, 3)
let msg = format!("{:.2} V", 3.14159)
print(msg)
println!("{0} then {1} then {0}", "a", "b")
```

## Format specs

The same mini-language works in `println!`, `format!` and f-strings:

| Spec | Effect |
|---|---|
| `{:.3}` | 3 decimals |
| `{:>6}` / `{:<6}` / `{:^6}` | right / left / centre in 6 chars |
| `{:08.3}` | width 8, zero padded, 3 decimals |
| `{:#x}` / `{:#b}` | hex / binary with prefix |
| `{:?}` | debug representation (strings get quotes) |

```tulpa
println!("[{:>6}] [{:<6}] [{:^6}]", "ok", "ok", "ok")
println!("{:08.3}", 3.14159)
println!("{:#x} {:#b}", 255, 5)
println!("{:?} vs {}", "text", "text")
```

## Aligned tables

Fixed widths turn telemetry into a readable table:

```tulpa
let joints = [["shoulder", 45.0], ["elbow", 112.5], ["wrist", -8.25]]
println!("{:<10}{:>8}", "joint", "deg")
for j in joints {
    println!("{:<10}{:>8.1}", j[0], j[1])
}
```

## Hex dumps

When debugging a bus, you want bytes in hex:

```tulpa
let frame = [0x02, 0x10, 0xFF, 0x7E]
print(frame.map(|b| format(b, "02x")).join(" "))
print(frame.hex())
```

## Timestamped logs

`log_message!` prefixes a message with the time, handy for event logs:

```tulpa
log_message!("motor armed")
```

:::tip print vs println!
Use `print` for quick output, f-strings for most formatted text, and `println!` when you
want positional placeholders or a format string you can reuse.
:::

```quiz
? What does `format!("{:>4}", 7)` produce?
+ `"   7"`
- `"7   "`
- `"0007"`
> `>` right-aligns in a field of width 4.
? Which spec prints 255 as `0xff`?
- `{:x}`
+ `{:#x}`
- `{:08b}`
> `#` adds the `0x` prefix.
```

:::exercise Sensor report
Print a two-row table with `println!` so the output is exactly:

```
sensor      value
imu          9.81
lidar        2.35
```

The name is left-aligned in 10 characters and the value right-aligned in 7 with 2
decimals.

```tulpa starter
let rows = [["imu", 9.8066], ["lidar", 2.351]]
println!("{:<10}{:>7}", "sensor", "value")
```
```tulpa solution
let rows = [["imu", 9.8066], ["lidar", 2.351]]
println!("{:<10}{:>7}", "sensor", "value")
for r in rows {
    println!("{:<10}{:>7.2}", r[0], r[1])
}
```
```expect
sensor      value
imu          9.81
lidar        2.35
```
```hint
Loop over `rows` and use the spec `{:>7.2}` for the value.
:::

:::takeaways
- `println!` / `format!` use `{}` placeholders; `{0}` reuses arguments.
- Specs: `.3` decimals, `>8 <8 ^8` alignment, `08.3` zero padding, `#x` hex, `?` debug.
- `log_message!` adds timestamps.
:::
