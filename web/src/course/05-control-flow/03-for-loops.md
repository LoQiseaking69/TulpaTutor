---
title: for Loops
minutes: 12
xp: 55
skill: programming
summary: Iterating ranges, lists, dicts and strings; enumerate, zip and nested loops.
---
`for` walks through a sequence, one item at a time. It is the loop you will write most.

## Over ranges

```tulpa
for i in 0..3 { print("tick", i) }
for angle in range(0, 181, 90) { print("servo", angle) }
```

## Over lists and strings

```tulpa
let waypoints = ["dock", "shelf A", "shelf B"]
for w in waypoints { print("visit", w) }
for ch in "OK" { print(ord(ch)) }
```

## With an index: enumerate

```tulpa
let joints = [45, 90, -10]
for i, a in enumerate(joints) {
    print(f"joint {i}: {a} deg")
}
```

## Over dicts

`for k, v in dict` gives each key and value:

```tulpa
let pins = {led: 17, buzzer: 18, button: 4}
for name, pin in pins {
    print(f"{name:<7} -> GPIO {pin}")
}
```

## In step: zip

`zip` pairs up items from two lists, which is perfect for setpoints and measurements:

```tulpa
let targets = [90, 45, 0]
let actual = [88, 47, 1]
for pair in zip(targets, actual) {
    print("error:", pair[0] - pair[1])
}
```

Destructuring works in the loop header too:

```tulpa
for t, a in zip([90, 45, 0], [88, 47, 1]) {
    print(f"target {t}, actual {a}")
}
```

## Nested loops: a grid scan

```tulpa
let grid = [[0, 0, 1], [0, 1, 0], [0, 0, 0]]
let obstacles = []
for r in 0..3 {
    for c in 0..3 {
        if grid[r][c] == 1 { obstacles.push([r, c]) }
    }
}
print("obstacles at", obstacles)
```

`break` and `continue` affect the innermost loop.

## Collecting results

A loop that builds a list is often clearer as `map`/`filter`, but loops win when you need
several outputs at once:

```tulpa
let samples = [3.0, 2.5, 4.1, 3.9, 2.2]
let lo = samples[0]
let hi = samples[0]
for s in samples {
    if s < lo { lo = s }
    if s > hi { hi = s }
}
print("range:", lo, "to", hi)
```

```quiz
? What does `for i, v in enumerate(["a", "b"])` give on the second iteration?
+ `i = 1, v = "b"`
- `i = 2, v = "b"`
- `i = "b", v = 1`
> enumerate counts from 0.
? Inside nested loops, which loop does `break` exit?
+ the innermost one
- all of them
> Only the loop it is directly in.
```

:::exercise Tracking error
Given `targets = [100, 200, 300]` and `measured = [98, 205, 300]`, use `zip` to compute the
absolute errors and print the list, then print the largest.

Expected:
```
[2, 5, 0]
5
```

```tulpa starter
let targets = [100, 200, 300]
let measured = [98, 205, 300]
```
```tulpa solution
let targets = [100, 200, 300]
let measured = [98, 205, 300]
let errors = []
for t, m in zip(targets, measured) {
    errors.push(abs(t - m))
}
print(errors)
print(errors.max())
```
```expect
[2, 5, 0]
5
```
```hint
`for t, m in zip(targets, measured)` and push `abs(t - m)`.
:::

:::takeaways
- `for x in seq` over ranges, lists, strings; `for k, v in dict`.
- `enumerate` adds an index; `zip` pairs lists; headers destructure.
- `break`/`continue` act on the innermost loop.
:::
