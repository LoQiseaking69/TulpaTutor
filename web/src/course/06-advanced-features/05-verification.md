---
title: Testing and Contract Fuzzing
minutes: 16
xp: 70
skill: programming
summary: define_test!, check() property testing with shrinking, and how tulpa prove goes further.
---
Writing a few examples by hand tests the cases you thought of. Bugs live in the cases you
did not. Tulpa gives you three levels of assurance.

## 1. Tests: define_test!

`define_test!(name, { ... })` registers a test. In TulpaTutor, the **Verify** tab of the
Playground runs them (on a computer: `tulpa test file.rav`):

```tulpa
fn wrap_angle(a) { a % 360 }

define_test!(wraps_negative, { assert_eq!(wrap_angle(-90), 270) })
define_test!(keeps_small, { assert_eq!(wrap_angle(45), 45) })
define_test!(wraps_large, { assert_eq!(wrap_angle(725), 5) })

print(wrap_angle(-90), wrap_angle(725))
```

## 2. Fuzzing: check()

`check(fn, trials)` generates arguments from the parameter **annotations**, keeps only those
that satisfy every `require`, calls the function, and checks every `ensure`:

```tulpa
fn safe_div(a: int, b: int) -> int
    require b != 0
    ensure result' * b + a % b == a
{
    a / b
}
let r = check(safe_div, 300)
print(r.ok, r.passed, "passed,", r.discarded, "discarded by require")
```

The `ensure` clause states the Euclidean identity; 300 random inputs confirm it.

## Finding and shrinking a bug

When something fails, `check` **shrinks** the failing input toward the smallest
counterexample, which makes the bug obvious:

```tulpa
fn scale_cmd(v: float) -> float
    require -1.0 <= v and v <= 1.0
    ensure -1.0 <= result' and result' <= 1.0
{
    v * 1.5
}
let r = check(scale_cmd, 300)
print("ok?", r.ok)
print("counterexample:", r.counterexample)
print(r.error)
```

The counterexample is a simple value just over the edge, not a random-looking float.
Generation is seeded per function, so the result is reproducible.

## Quantities are fuzzed in their units

```tulpa
fn stopping_distance(v: [m/s], a: [m/s^2]) -> [m]
    require v >= 0
    require a > 0
    ensure result' >= 0
{
    v ** 2 / (2 * a)
}
print(check(stopping_distance, 200).ok)
```

## 3. Proof: tulpa prove

On a computer, `tulpa prove file.rav` goes beyond sampling: it **proves** `ensure` clauses,
assertions, invariants, preconditions at call sites and non-zero divisors for **all**
inputs where it can, and falls back to testing the rest. `tulpa verify` runs `check` on every
contracted function in a file.

| Tool | Covers | Where |
|---|---|---|
| `define_test!` | the cases you wrote | everywhere |
| `check()` / `tulpa verify` | hundreds of generated cases, shrunk | everywhere |
| `tulpa prove` | all inputs (where provable) | computer |

:::tip Try the Verify tab
Open **Explore → Examples → Contracts + fuzzing**, then the **Verify** tab: it fuzzes every
contracted function in the file and lists counterexamples.
:::

```quiz
? Where does check() get the inputs it generates?
+ from the parameter annotations, filtered by require clauses
- from define_test! blocks
- from the function body
> Annotations say what to generate; require filters.
? Why does shrinking matter?
- it makes tests faster
+ the smallest failing input makes the cause obvious
> A minimal counterexample points straight at the bug.
```

:::exercise Fix the bug check() finds
`average(a: float, b: float) -> float` must ensure the result lies between `min(a, b)` and
`max(a, b)`. The body has a bug. Fix it so `check(average, 300).ok` prints `true`.

```tulpa starter
fn average(a: float, b: float) -> float
    ensure min(a, b) <= result' and result' <= max(a, b)
{
    a + b / 2
}
print(check(average, 300).ok)
```
```tulpa solution
fn average(a: float, b: float) -> float
    ensure min(a, b) <= result' and result' <= max(a, b)
{
    (a + b) / 2
}
print(check(average, 300).ok)
```
```expect
true
```
```hint
Precedence: `a + b / 2` divides only `b`. Add brackets.
:::

:::takeaways
- `define_test!(name, { ... })` registers tests (Verify tab / `tulpa test`).
- `check(fn, n)` fuzzes from annotations, filters by `require`, checks `ensure`, shrinks failures.
- `tulpa prove` proves contracts for all inputs on a computer.
:::
