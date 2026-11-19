---
title: Contracts: require and ensure
minutes: 16
xp: 65
skill: programming
summary: Preconditions, postconditions, primed variables and assertions: specifications in code.
---
A comment saying "angle must be between −90 and 90" is a wish. A **contract** is a check the
runtime enforces. Tulpa's contracts come from Eric Hehner's *a Practical Theory of
Programming*: a specification is a boolean expression over the state before and after.

## require: preconditions

`require` clauses go between the parameter list and the body. They are checked as soon as
the arguments are bound:

```tulpa
fn set_joint(angle, speed)
    require -90 <= angle and angle <= 90
    require speed > 0
{
    f"joint -> {angle} deg at {speed}"
}
print(set_joint(45, 1))
```

Violate one and the error quotes the exact clause:

```tulpa error
fn set_joint(angle, speed)
    require -90 <= angle and angle <= 90
    require speed > 0
{ angle }
set_joint(120, 1)
```

## ensure: postconditions

`ensure` is checked after the body runs. `result'` is the return value:

```tulpa
fn clamp_speed(v)
    ensure -1.0 <= result' and result' <= 1.0
{
    clamp(v, -1.0, 1.0)
}
print(clamp_speed(3.2), clamp_speed(-0.4))
```

## Primes: before and after

For a parameter `x`, plain `x` in an `ensure` means its **initial** value and `x'` its
**final** value. That lets you specify how something changes:

```tulpa
fn bump(x) ensure x' == x + 1 { x = x + 1; x }
print(bump(41))
```

```tulpa error
fn bump(x) ensure x' == x + 1 { x = x + 2; x }
print(bump(41))
```

The message shows the clause and the actual `result'`, which makes the bug obvious.

## Contracts with units

Contracts work naturally with quantities:

```tulpa
fn stopping_distance(v: [m/s], decel: [m/s^2]) -> [m]
    require v >= 0
    require decel > 0
    ensure result' >= 0
{
    v ** 2 / (2 * decel)
}
print(stopping_distance(2[m/s], 4[m/s^2]))
```

## assert

`assert condition, "message"` checks anything, anywhere:

```tulpa
let total = 0
for i in 0..10 { total += i }
assert total == 45, "sum is wrong"
print("total ok:", total)
```

:::warn Use the `assert` statement
Write `assert cond` (or `assert_eq!(a, b)`). In Tulpa 3.5 `assert` is a keyword, so the
macro form `assert!(cond)` is parsed as `assert !(cond)` and checks the opposite. Avoid it.
:::

## Why contracts matter

Contracts turn assumptions into checked facts, document intent precisely, and power two of
Tulpa's best tools: **contract fuzzing** (`check`, Module 6) and **static proof**
(`tulpa prove`), which proves clauses for *all* inputs.

```quiz
? When is a `require` clause checked?
+ After arguments are bound, before the body runs
- After the body runs
- Only when proving
> `require` guards entry; `ensure` checks the exit.
? In `ensure x' == x + 1`, what does `x` (unprimed) refer to?
- the final value
+ the initial value
> Primed is after, unprimed is before.
```

:::exercise Safe servo command
Write `fn servo_pulse(angle)` that requires `0 <= angle <= 180`, ensures the result is
between 500 and 2500, and returns `500 + angle * 2000 / 180` as an int (use integer
arithmetic). Print `servo_pulse(90)`.

Expected: `1500`

```tulpa starter
fn servo_pulse(angle) {
    500 + angle * 2000 / 180
}
print(servo_pulse(90))
```
```tulpa solution
fn servo_pulse(angle)
    require 0 <= angle and angle <= 180
    ensure 500 <= result' and result' <= 2500
{
    500 + angle * 2000 / 180
}
print(servo_pulse(90))
```
```expect
1500
```
```check
let rejected = false
try { servo_pulse(200) } catch e { rejected = true }
assert rejected, "servo_pulse(200) must violate the precondition"
```
```hint
Put `require 0 <= angle and angle <= 180` between `)` and `{`.
---
Add `ensure 500 <= result' and result' <= 2500` too.
:::

:::takeaways
- `require` checks inputs; `ensure` checks the result (`result'`) and changes (`x'` vs `x`).
- Violations quote the clause. Contracts work with units.
- Use `assert cond, "msg"` and `assert_eq!`; avoid `assert!(...)` in 3.5.
:::
