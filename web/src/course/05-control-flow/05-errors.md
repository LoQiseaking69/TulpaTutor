---
title: Handling Errors
minutes: 12
xp: 55
skill: programming
summary: try/catch, raising errors, retries, and failing safely on the hardware edge.
---
Sensors disconnect, buses glitch, files go missing. Robust code expects failure and decides
what to do about it.

## try and catch

`try { } catch err { }` runs the first block; if it raises an error, the catch block runs
with the message as a string:

```tulpa
try {
    let x = 10 / 0
    print("never printed")
} catch err {
    print("recovered:", err)
}
print("program continues")
```

The variable name is optional: `catch { ... }`.

## Raising errors

`error("message")` raises your own error. Use it when a function cannot do its job:

```tulpa
fn parse_speed(text) {
    let v = text.to_float()
    if v < 0 { error(f"negative speed: {text}") }
    v
}
try { parse_speed("-3") } catch e { print("rejected:", e) }
print(parse_speed("1.5"))
```

## Retrying

Transient failures (a bus collision, a busy sensor) often succeed on retry:

```tulpa
let calls = 0
fn flaky_read() {
    calls += 1
    if calls < 3 { error("bus busy") }
    42
}
let value = nil
for attempt in 1..=5 {
    try {
        value = flaky_read()
        break
    } catch e {
        print(f"attempt {attempt} failed: {e}")
    }
}
print("value:", value)
```

## Defaults on failure

`unwrap_or_default!(expr, default)` gives a fallback if the expression errors or is nil:

```tulpa
let cfg = {rate: 50}
print(unwrap_or_default!(cfg.rate, 10))
print(unwrap_or_default!(cfg.timeout, 1000))
```

## Errors from devices

Device mistakes are errors, not silent no-ops. Writing to a pin configured as input:

```tulpa
let button = GPIO::new(4, "in")
try { button.set_high() } catch e { print("caught:", e) }
```

## Fail safe, not silent

When you catch an error in control code, do something **safe**: stop motors, raise an
alarm, enter a fault state. Catching and ignoring is how robots fail dangerously.

```tulpa
let motor = GPIO::new(23)
motor.set_high()
try {
    error("encoder lost")
} catch e {
    motor.set_low()
    print("FAULT:", e, "- motor stopped, pin =", motor.read())
}
```

```quiz
? What does `catch err` receive?
+ the error message as a string
- an error object with a stack
- nothing
> The catch variable is the message string.
? Best response when a motor encoder fails mid-move?
- catch and continue
+ catch, stop the motor and report a fault
> Fail safe, never silent.
```

:::exercise Robust parse
Write `fn safe_int(text, fallback)` that returns `text.to_int()`, or `fallback` if that
raises an error. Print `safe_int("42", 0)` and `safe_int("4x2", -1)`.

Expected: `42 -1`

```tulpa starter
fn safe_int(text, fallback) {
    text.to_int()
}
print(safe_int("42", 0), safe_int("4x2", -1))
```
```tulpa solution
fn safe_int(text, fallback) {
    let v = fallback
    try { v = text.to_int() } catch e { v = fallback }
    v
}
print(safe_int("42", 0), safe_int("4x2", -1))
```
```expect
42 -1
```
```hint
Declare `let v = fallback`, then `try { v = text.to_int() } catch e { }` and return `v`.
:::

:::takeaways
- `try {} catch e {}` catches errors (message string); `error(msg)` raises.
- Retry transient failures in a bounded loop; `unwrap_or_default!` gives fallbacks.
- In control code, catch to reach a safe state.
:::
