---
title: while, loop and Loop Invariants
minutes: 14
xp: 60
skill: programming
summary: Condition loops, infinite loops with break, continue, and checked loop invariants.
---
Robots are loops: read sensors, decide, act, repeat. Tulpa has three loop forms; this lesson
covers the two that run until something happens.

## while

`while condition { body }` repeats as long as the condition is true:

```tulpa
let position = 0.0
let target = 1.0
let steps = 0
while position < target {
    position += 0.3
    steps += 1
}
print(f"reached {position:.1f} in {steps} steps")
```

## loop and break

`loop { }` runs forever until `break`. It is the natural shape for "do until":

```tulpa
let attempts = 0
loop {
    attempts += 1
    let ok = attempts == 3        # pretend the sensor answers on try 3
    if ok { break }
    print("retry", attempts)
}
print("connected after", attempts, "attempts")
```

## continue

`continue` skips to the next iteration:

```tulpa
let readings = [5, -1, 7, -1, 6]
let i = 0
let total = 0
while i < len(readings) {
    let r = readings[i]
    i += 1
    if r < 0 { continue }        # skip invalid samples
    total += r
}
print("total of valid readings:", total)
```

## Loop invariants

An **invariant** is a fact that stays true every time around the loop. Tulpa lets you state
it, and checks it before every test of the condition, including the last:

```tulpa
let n = 10
let i = 0
let total = 0
while i < n invariant total == i * (i - 1) / 2 {
    total += i
    i += 1
}
print("sum 0..9 =", total)
```

If a change breaks the invariant, you find out on the exact iteration:

```tulpa error
let i = 0
let total = 0
while i < 5 invariant total == i * (i - 1) / 2 {
    total += i * 2          # bug
    i += 1
}
```

Invariants are how you *prove* loops correct; `tulpa prove` can check them for all inputs.

## Avoiding infinite loops

Make sure something in the loop moves toward the exit. If a loop runs away here, press
**Stop**. On a real robot, a stuck control loop is dangerous: that is why Module 8 introduces
fixed-rate `every!` loops with bounded iterations.

```quiz
? What does `continue` do?
- exits the loop
+ skips to the next iteration
- restarts the program
> `break` exits; `continue` moves to the next iteration.
? When is a `while` invariant checked?
- only after the loop
+ before every evaluation of the condition, including the final one
> That is what makes it a proof tool.
```

:::exercise Motor ramp
Ramp a motor from `duty = 0` toward `1.0` in steps of `0.25`, printing each value **before**
stepping, and stop once it reaches 1.0 (print 1.0 too). Use a `while` loop.

Expected:
```
0.0
0.25
0.5
0.75
1.0
```

```tulpa starter
let duty = 0.0
```
```tulpa solution
let duty = 0.0
while duty <= 1.0 {
    print(duty)
    duty += 0.25
}
```
```expect
0.0
0.25
0.5
0.75
1.0
```
```hint
Loop while `duty <= 1.0`, print, then add 0.25.
:::

:::takeaways
- `while cond {}` repeats while true; `loop {}` until `break`; `continue` skips ahead.
- `while c invariant inv {}` checks a stated invariant on every iteration.
- Make every loop progress toward its exit.
:::
