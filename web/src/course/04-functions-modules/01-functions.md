---
title: Defining Functions
minutes: 14
xp: 55
skill: programming
summary: fn, parameters, defaults, implicit returns, early return and hoisting.
---
A **function** packages a piece of logic under a name so you can reuse it, test it, and
reason about it in isolation. Robot software is built from small, well-named functions.

## The basics

```tulpa
fn wheel_circumference(diameter) {
    PI * diameter
}
print(wheel_circumference(0.065[m]))
print(wheel_circumference(0.1[m]))
```

`fn name(params) { body }` defines a function. The **last expression** of the body is the
return value, so there is no need for `return` in the common case. (`def` is accepted as an
alias for `fn`.)

## Default parameters

A parameter can have a default, used when the caller leaves it out. Defaults may refer to
earlier parameters:

```tulpa
fn area(w, h = w) { w * h }
print(area(3))       # square
print(area(3, 4))
```

## Early return

`return` exits immediately. It is handy for guard clauses at the top of a function:

```tulpa
fn safe_divide(a, b) {
    if b == 0 { return nil }
    a / b
}
print(safe_divide(10, 2), safe_divide(1, 0))
```

## Functions without a result

A function whose last statement is not an expression returns `nil`. That is fine for
functions that act rather than compute:

```tulpa
fn report(name, value) {
    print(f"[{name}] {value}")
}
let r = report("imu", 9.81)
print(r)
```

## Hoisting

Functions are **hoisted**: you can call a function above where it is defined. This lets you
put the main logic at the top and helpers below:

```tulpa
print(describe(3[m]))

fn describe(d) {
    f"obstacle at {d}, {classify(d)}"
}
fn classify(d) {
    if d < 1[m] { "close" } else { "far" }
}
```

## Designing good functions

A good function does **one thing**, has a name that says what, and is short enough to read at
a glance. Compare:

```tulpa
fn ticks_to_distance(ticks, ticks_per_rev, wheel_diameter) {
    ticks / float(ticks_per_rev) * PI * wheel_diameter
}
let left = ticks_to_distance(720, 360, 0.065[m])
let right = ticks_to_distance(700, 360, 0.065[m])
print(f"left {left:.3f}, right {right:.3f}")
```

Both wheels share one tested implementation: change the formula once, both are fixed.

```quiz
? What does `fn f(x) { x * 2; x + 1 }` return for `f(5)`?
- `10`
+ `6`
- `nil`
> The value is the last expression.
? Can you call a function before its `fn` definition in the file?
+ Yes, functions are hoisted
- No, it is an undefined variable error
> Hoisting makes order irrelevant for functions.
```

:::exercise Odometry helper
Write `fn distance(ticks, ticks_per_rev = 360, diameter = 0.065[m])` that returns the
distance travelled. Then print `distance(1080)` and `distance(500, 500, 0.1[m])` with
`.to("cm")`, rounded by f-string to 1 decimal:

```
61.3 cm
31.4 cm
```

```tulpa starter
fn distance(ticks) {
    0
}
```
```tulpa solution
fn distance(ticks, ticks_per_rev = 360, diameter = 0.065[m]) {
    ticks / float(ticks_per_rev) * PI * diameter
}
print(f"{distance(1080).to("cm"):.1f}")
print(f"{distance(500, 500, 0.1[m]).to("cm"):.1f}")
```
```expect
61.3 cm
31.4 cm
```
```hint
Revolutions are `ticks / float(ticks_per_rev)`; distance per revolution is `PI * diameter`.
---
`f"{x.to("cm"):.1f}"` formats a quantity with one decimal.
:::

:::takeaways
- `fn name(a, b = default) { ... }`; the last expression is returned.
- `return` exits early; functions without a final expression return `nil`.
- Functions are hoisted.
:::
