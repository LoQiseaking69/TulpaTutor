---
title: Closures and Higher-Order Functions
minutes: 14
xp: 60
skill: programming
summary: Lambdas, capturing state, functions as values, and map/filter/reduce/sorted.
---
In Tulpa, functions are **values**: you can store them in variables, pass them to other
functions and return them. This unlocks powerful, compact code.

## Three ways to write a small function

```tulpa
let double = |x| x * 2                       # closure
let triple = fn(x) => x * 3                  # expression lambda
let square_plus = |x| { let y = x + 1; y * y }   # closure with a block
print(double(4), triple(4), square_plus(4))
```

## Passing functions

A function that takes or returns functions is **higher-order**:

```tulpa
fn apply_twice(f, x) { f(f(x)) }
print(apply_twice(|v| v * 10, 2))
print(apply_twice(|s| s + "!", "go"))
```

## Capturing state

A closure **captures** the variables around it, by reference. Each call to `make_counter`
creates a new `n` that only its closure can see:

```tulpa
fn make_counter() {
    let n = 0
    let tick = || { n += 1; n }
    tick
}
let a = make_counter()
let b = make_counter()
a(); a()
print(a(), b())
```

This is a tiny, private object, and a powerful pattern. (Naming the closure `tick` before
returning it keeps the parser happy: a line that *starts* with `||` is read differently.)

## Building functions

Functions that return functions let you configure behaviour once:

```tulpa
fn make_limiter(lo, hi) {
    |x| clamp(x, lo, hi)
}
let throttle = make_limiter(-1.0, 1.0)
let servo = make_limiter(10, 170)
print(throttle(1.7), servo(200), servo(5))
```

## The sequence toolkit

| Function | Does |
|---|---|
| `map(xs, f)` | apply `f` to every item |
| `filter(xs, f)` | keep items where `f` is true |
| `reduce(xs, f)` | combine items pairwise |
| `sorted(xs, key)` | sort by a key function |
| `any(xs, f)` / `all(xs, f)` | test some / every item |

```tulpa
let sensors = [{name: "lidar", hz: 10}, {name: "imu", hz: 200}, {name: "gps", hz: 1}]
print(sensors.sorted(|s| s.hz).map(|s| s.name))
print(sensors.filter(|s| s.hz >= 10).map(|s| s.name))
print(sensors.map(|s| s.hz).reduce(|a, b| a + b))
print(sensors.any(|s| s.hz > 100))
```

:::deep Closures capture by reference
Because capture is by reference, a closure sees later changes to the variables it captured.
This is what makes `make_counter` work, and it is something to remember when creating
closures in a loop.
:::

```quiz
? After `let c = make_counter()` and calling `c()` three times, what does the third call return?
- `1`
+ `3`
- `0`
> The captured `n` persists between calls.
? What does `[3, 1, 2].sorted(|x| -x)` give?
+ `[3, 2, 1]`
- `[1, 2, 3]`
> Sorting by the negative value gives descending order.
```

:::exercise Deadband filter
Write `fn make_deadband(width)` that returns a closure: values with `abs(x) < width` become
`0.0`, others pass through. Then map `make_deadband(0.1)` over
`[0.05, -0.2, 0.09, 0.5]` and print the result.

Expected: `[0.0, -0.2, 0.0, 0.5]`

```tulpa starter
fn make_deadband(width) {
    |x| x
}
```
```tulpa solution
fn make_deadband(width) {
    |x| if abs(x) < width { 0.0 } else { x }
}
print([0.05, -0.2, 0.09, 0.5].map(make_deadband(0.1)))
```
```expect
[0.0, -0.2, 0.0, 0.5]
```
```check
let d = make_deadband(1)
assert_eq!(d(0.5), 0.0)
assert_eq!(d(2), 2)
```
```hint
The closure body can be an if expression: `|x| if abs(x) < width { 0.0 } else { x }`.
:::

:::takeaways
- `|x| expr`, `fn(x) => expr`, `|x| { ... }` are function values.
- Closures capture surrounding variables by reference: private state.
- `map filter reduce sorted any all` take functions.
:::
