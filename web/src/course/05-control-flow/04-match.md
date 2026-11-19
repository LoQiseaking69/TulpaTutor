---
title: Pattern Matching with match
minutes: 14
xp: 60
skill: programming
summary: Literal, alternative, range, list and guard patterns for parsing and dispatch.
---
`match` compares a value against a list of **patterns** and runs the first that fits. It
replaces long `if` chains and makes intent obvious, especially when parsing messages.

## Literal and alternative patterns

```tulpa
fn describe(code) {
    match code {
        0 => "ok",
        1 | 2 => "warning",
        3 => "fault",
        _ => "unknown",
    }
}
print(describe(0), describe(2), describe(9))
```

`_` matches anything; put it last as the catch-all. `|` combines alternatives.

## Range patterns

```tulpa
fn battery_state(pct) {
    match pct {
        0..=10 => "critical",
        11..=30 => "low",
        31..=100 => "ok",
        _ => "invalid",
    }
}
print(battery_state(8), battery_state(55), battery_state(120))
```

## Binding and guards

A name pattern binds the value. A guard `if ...` adds a condition:

```tulpa
fn classify(reading) {
    match reading {
        n if n < 0 => "sensor error",
        n if n > 400 => f"out of range ({n})",
        n => f"distance {n} cm",
    }
}
print(classify(-1), classify(500), classify(42))
```

## List patterns

Destructure lists by shape, with `..rest` for the remainder:

```tulpa
fn parse(cmd) {
    match cmd.split(" ") {
        ["STOP"] => "halt",
        ["MOVE", x, y] => f"move to {x},{y}",
        ["SAY", ..words] => "say: " + words.join(" "),
        [] => "empty",
        _ => "unknown command",
    }
}
print(parse("STOP"))
print(parse("MOVE 3 4"))
print(parse("SAY hello there robot"))
print(parse("JUMP"))
```

This is a compact, readable command parser for a serial console.

## Strings

```tulpa
let mode = "auto"
let led = match mode { "manual" => "blue", "auto" => "green", "fault" => "red", _ => "off" }
print(led)
```

## No match is an error

If no arm matches, `match` raises an error. That is a feature: unhandled cases do not slip by
silently. Add `_` when "anything else" is truly fine:

```tulpa error
let state = "docking"
print(match state { "idle" => 0, "driving" => 1 })
```

```quiz
? What does `match 15 { 0..=9 => "a", 10..=19 => "b", _ => "c" }` return?
- `"a"`
+ `"b"`
- `"c"`
> 15 falls in 10..=19.
? What happens if no arm matches?
- returns nil
+ runtime error
> Unhandled cases are errors, not silent.
```

:::exercise Command router
Write `fn route(msg)` that matches `msg.split(":")`:
- `["led", "on"]` → `"LED ON"`
- `["led", "off"]` → `"LED OFF"`
- `["servo", a]` → `"SERVO " + a`
- anything else → `"ERR"`

Print `route("led:on")`, `route("servo:90")`, `route("fan:on")`.

```tulpa starter
fn route(msg) {
    "ERR"
}
print(route("led:on"))
print(route("servo:90"))
print(route("fan:on"))
```
```tulpa solution
fn route(msg) {
    match msg.split(":") {
        ["led", "on"] => "LED ON",
        ["led", "off"] => "LED OFF",
        ["servo", a] => "SERVO " + a,
        _ => "ERR",
    }
}
print(route("led:on"))
print(route("servo:90"))
print(route("fan:on"))
```
```expect
LED ON
SERVO 90
ERR
```
```check
assert_eq!(route("led:off"), "LED OFF")
```
```hint
List patterns: `["servo", a] => "SERVO " + a`.
:::

:::takeaways
- Patterns: literals, `a | b`, ranges `1..=9`, bindings, guards `n if ...`, lists `[a, ..rest]`, `_`.
- First matching arm wins; no match is an error.
- `match` on `split` results makes clean command parsers.
:::
