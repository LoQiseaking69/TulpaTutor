---
title: Keyword Arguments and Pipes
minutes: 10
xp: 50
skill: programming
summary: Calling with names, mixing positional and keyword arguments, and the |> pipe.
---
As functions grow parameters, calls like `move(0.5, 0.2, true, 3)` become unreadable. Tulpa
gives you two tools for clarity.

## Keyword arguments

Any parameter can be passed by name, in any order, after the positional ones:

```tulpa
fn move(x, y, speed = 0.1, relative = false) {
    f"move to ({x}, {y}) at {speed} m/s, relative={relative}"
}
print(move(1, 2))
print(move(1, 2, relative: true))
print(move(speed: 0.5, y: 3, x: 0))
```

Keyword arguments skip defaults you do not care about, and document the call site.

## They work for constructors too

Structs and machines (later modules) take keyword arguments the same way. You have already
seen it in the standard library:

```tulpa
import "std/world"
let w = world.World(dt: 10[ms], seed: 42)
print(type(w))
```

## Errors you will see

Passing the same parameter twice, or an unknown name, is an error:

```tulpa error
fn move(x, y) { x + y }
print(move(1, x: 2))
```

## The pipe operator

`a |> f(b)` means `f(a, b)`. It turns nested calls inside-out into a left-to-right pipeline,
which reads like a data flow diagram:

```tulpa
let raw = [512, 1023, 300, 0, 870]
let total = raw |> filter(|r| r > 0) |> map(|r| r * 3.3 / 1023) |> sum
print(round(total, 3))
```

The same without pipes is harder to follow:

```tulpa
let raw = [512, 1023, 300, 0, 870]
print(round(sum(map(filter(raw, |r| r > 0), |r| r * 3.3 / 1023)), 3))
```

The rules: `a |> f` is `f(a)`, `a |> f(b)` is `f(a, b)`, and `a |> o.m` is `o.m(a)`.

```tulpa
fn scale(x, k) { x * k }
fn offset(x, d) { x + d }
print(10 |> scale(3) |> offset(-5))
```

```quiz
? What is `4 |> pow(2)`?
+ `pow(4, 2)`
- `pow(2, 4)`
> The piped value becomes the first argument.
? Given `fn f(a, b = 1, c = 2)`, which call sets only `c`?
- `f(1, 5)`
+ `f(1, c: 5)`
> Keyword arguments skip `b`.
```

:::exercise Telemetry pipeline
Using pipes, take `readings = [3.1, -1.0, 2.9, 3.3, -1.0, 3.0]`, drop the `-1.0` error
values, multiply each by 10, and sum them. Print the result rounded to 1 decimal.

Expected: `123.0`

```tulpa starter
let readings = [3.1, -1.0, 2.9, 3.3, -1.0, 3.0]
```
```tulpa solution
let readings = [3.1, -1.0, 2.9, 3.3, -1.0, 3.0]
let total = readings |> filter(|r| r >= 0) |> map(|r| r * 10) |> sum
print(round(total, 1))
```
```expect
123.0
```
```hint
`readings |> filter(|r| r >= 0) |> map(|r| r * 10) |> sum`.
:::

:::takeaways
- Keyword arguments `f(x, speed: 0.5)` go after positional ones, in any order.
- `a |> f(b)` is `f(a, b)`; pipelines read left to right.
:::
