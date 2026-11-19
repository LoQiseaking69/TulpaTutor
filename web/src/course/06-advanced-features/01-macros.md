---
title: Macros
minutes: 14
xp: 60
skill: programming
summary: Built-in macros, call-by-name arguments, and writing your own control structures.
---
A **macro** is called with a `!`: `println!(...)`, `repeat!(...)`. Unlike a function, a macro
receives its arguments **unevaluated** and decides when (and how often) to evaluate them.
That lets macros create new control structures.

## Built-in macros

| Macro | Does |
|---|---|
| `repeat!(n, { ... })` (or `simple_loop!`) | run a block n times |
| `every!(period, { ... })` | fixed-rate loop (Module 8) |
| `time_execution!({ ... })` | run, print the elapsed time, return the value |
| `log_message!(msg)` | timestamped message |
| `println! print! format!` | Rust-style formatting |
| `vec!(a, b, ...)` | build a list |
| `assert_eq!(a, b)` | assert equality |
| `unwrap_or_default!(expr, d)` | fallback on error or nil |
| `define_test!(name, { ... })` | register a test |

```tulpa
repeat!(3, { print("beep") })
let ids = vec!(3, 1, 4)
print(ids)
assert_eq!(len(ids), 3)
print(unwrap_or_default!(ids[10], -1))
```

`unwrap_or_default!` is only possible as a macro: a function would evaluate `ids[10]` (and
crash) before it was even called.

## Call-by-name

In a macro you define with `define_macro!`, each use of a parameter **re-evaluates** the
argument expression in the caller's scope. Watch the counter:

```tulpa
define_macro!(twice, (body) { body; body })
let count = 0
twice!({ count += 1 })
print(count)
```

The block ran twice because `body` appears twice. A function would have received a single
already-computed value.

## Writing a control structure: retry

A retry loop is a perfect macro: it must run the block several times and catch its errors:

```tulpa
define_macro!(retry, (times, body) {
    let n = 0
    while n < times {
        try { body; break } catch e {
            n += 1
            print("attempt", n, "failed:", e)
        }
    }
})

let calls = 0
retry!(5, {
    calls += 1
    if calls < 3 { error("bus busy") }
    print("read ok on call", calls)
})
```

Now `retry!(3, { uart.send("AT\r\n") })` reads like a language feature.

## Another: unless

```tulpa
define_macro!(unless, (cond, body) { if not cond { body } })
let estop = false
unless!(estop, { print("motors enabled") })
```

## When to use macros

Prefer functions: they are simpler to reason about. Reach for a macro only when you need to
control **evaluation**: skipping it (`unless!`), repeating it (`retry!`, `twice!`), or
catching its errors (`unwrap_or_default!`).

:::warn Evaluation surprises
Because arguments re-evaluate, `twice!({ x = read_sensor() })` reads the sensor twice. Bind
a value first (`let v = read_sensor()`) when you want it computed once.
:::

```quiz
? Why can't `unwrap_or_default!` be a normal function?
+ A function would evaluate the failing expression before being called
- Functions cannot return defaults
- Macros run faster
> Macros receive arguments unevaluated.
? In `define_macro!(m, (x) { x; x; x })`, how many times does `m!({ n += 1 })` increment n?
- 1
+ 3
> Each use of `x` re-evaluates the argument.
```

:::exercise Write `times!`
Define a macro `times!(n, body)` that runs `body` exactly `n` times using a `while` loop
(do not use `repeat!`). Then use it to add 5 to `total` four times and print `total`.

Expected: `20`

```tulpa starter
let total = 0
# define times! here, then use it
print(total)
```
```tulpa solution
define_macro!(times, (n, body) {
    let i = 0
    while i < n { body; i += 1 }
})
let total = 0
times!(4, { total += 5 })
print(total)
```
```expect
20
```
```check
let k = 0
times!(3, { k += 1 })
assert_eq!(k, 3)
```
```hint
`define_macro!(times, (n, body) { ... })`. Inside, loop with a counter and mention `body` once per iteration.
:::

:::takeaways
- Macros take unevaluated arguments; `define_macro!(name, (params) { body })`.
- Each use of a parameter re-evaluates the argument in the caller's scope.
- Use macros only to control evaluation (repeat, skip, catch); otherwise write functions.
:::
