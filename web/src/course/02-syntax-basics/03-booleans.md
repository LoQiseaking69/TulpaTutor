---
title: Booleans, Comparison and Truthiness
minutes: 10
xp: 45
skill: syntax
summary: true/false, comparison operators, and/or/not, short-circuiting and truthy values.
---
Every decision a robot makes, whether to stop, turn or grab, comes down to a **boolean**:
`true` or `false`.

## Comparisons

| Operator | Meaning |
|---|---|
| `==` / `!=` | equal / not equal |
| `<` `<=` `>` `>=` | ordering |
| `in` / `not in` | membership |

```tulpa
let distance = 0.42
print(distance < 0.5, distance == 0.42, distance != 1)
print(3 in [1, 2, 3], "x" not in "robot")
print(5 in 0..10)
```

Comparisons work on quantities too, as long as the dimensions match:

```tulpa
print(30[cm] < 1[m])
print(90[deg] == 0.25[rev])
```

## Combining: and, or, not

`and` (or `&&`), `or` (or `||`) and `not` (or `!`) combine booleans:

```tulpa
let obstacle = true
let moving = true
let estop = false
print(obstacle and moving)
print(estop or obstacle)
print(not estop)
```

## Short-circuiting

`and` stops as soon as it finds something false, and `or` as soon as it finds something true.
The right side is only evaluated when needed, so this is safe:

```tulpa
let sensor = nil
print(sensor != nil and sensor > 5)   # sensor > 5 never runs
```

Without short-circuiting, comparing `nil > 5` would be an error.

## Truthiness

Any value can be used where a boolean is expected. These are **falsy**: `nil`, `false`, `0`,
`0.0`, `""`, `[]` and `{}`. Everything else is **truthy**:

```tulpa
print(bool(0), bool(""), bool([]), bool(nil))
print(bool(1), bool("off"), bool([0]))
```

`or` returns the first truthy value, which gives a neat default pattern:

```tulpa
let name = "" or "unnamed robot"
print(name)
```

:::warn Floats and ==
Floating-point arithmetic is approximate: `0.1 + 0.2 == 0.3` is `false` in nearly every
language. Compare floats with a tolerance: `abs(a - b) < 1e-9`.
:::

```tulpa
print(0.1 + 0.2 == 0.3)
print(abs((0.1 + 0.2) - 0.3) < 1e-9)
```

```quiz
? Which value is truthy?
- `0`
- `""`
+ `"0"`
> A non-empty string is truthy, even the string "0".
? Why is `x != nil and x > 3` safe when `x` is nil?
+ `and` stops at the first false operand
- `nil > 3` is false
- Tulpa ignores nil comparisons
> Short-circuiting means `x > 3` is never evaluated.
```

:::exercise Safe to move?
A robot may move only if: the e-stop is **not** pressed, the battery is **at least** 20, and
either the path is clear **or** it is in manual mode. Set `can_move` from the variables and
print it. With the given values it should print `true`.

```tulpa starter
let estop = false
let battery = 35
let path_clear = false
let manual = true
let can_move = false
print(can_move)
```
```tulpa solution
let estop = false
let battery = 35
let path_clear = false
let manual = true
let can_move = not estop and battery >= 20 and (path_clear or manual)
print(can_move)
```
```expect
true
```
```check
estop = true
assert_eq!(not estop and battery >= 20 and (path_clear or manual), false)
```
```hint
Combine three conditions with `and`; the last one is `(path_clear or manual)` in brackets.
:::

:::takeaways
- Comparisons: `== != < <= > >= in not in`; they work on quantities.
- `and`/`or` short-circuit; `or` returns the first truthy value.
- Falsy: `nil false 0 0.0 "" [] {}`.
- Compare floats with a tolerance.
:::
