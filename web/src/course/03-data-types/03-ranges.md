---
title: Ranges and Slicing
minutes: 10
xp: 45
skill: syntax
summary: Exclusive and inclusive ranges, steps, membership tests and slicing sequences.
---
A **range** is a sequence of integers described by its ends. Ranges drive loops, slice lists
and express limits.

## Exclusive and inclusive

`a..b` goes from `a` up to but **not including** `b`. `a..=b` includes `b`:

```tulpa
print(list(0..5))
print(list(1..=5))
print(len(0..10))
print(type(0..3))
```

A range is lazy: it does not build a list until you ask (`list(...)`), so `0..1_000_000`
costs nothing.

## Steps

`range(start, stop, step)` counts by any step, including backwards:

```tulpa
print(list(range(0, 20, 5)))
print(list(range(10, 0, -3)))
```

## Membership

`in` tests whether a number lies in a range. That reads beautifully for limits:

```tulpa
let pwm = 1500
print(pwm in 1000..=2000)
let channel = 9
if channel not in 0..8 { print("invalid ADC channel", channel) }
```

## Slicing lists and strings

Ranges slice sequences. Slices are **copies**:

```tulpa
let scan = [2.1, 2.0, 1.4, 0.9, 1.3, 2.2, 2.4]
let front = scan[2..5]
print(front)
print(scan[0..=1], scan[5..len(scan)])
print("TULPA"[0..=2])
```

## Ranges in loops

Their main job. You will see loops properly in Module 5:

```tulpa
for angle in range(0, 181, 45) {
    print("servo ->", angle, "deg")
}
```

## Ranges in pattern matching

Ranges also work as patterns, a preview of `match`:

```tulpa
let rssi = -67
let quality = match rssi {
    -50..=0 => "excellent",
    -70..=-51 => "good",
    _ => "weak",
}
print(quality)
```

```quiz
? What is `list(2..5)`?
+ `[2, 3, 4]`
- `[2, 3, 4, 5]`
- `[3, 4, 5]`
> `..` excludes the end.
? Which test is true for `x = 10`?
- `x in 0..10`
+ `x in 0..=10`
> Only the inclusive range contains 10.
```

:::exercise Sweep plan
Print every servo angle from 30 to 150 **inclusive** in steps of 30 as a list, then print
whether 165 is inside the safe range 10 to 170 inclusive.

Expected:
```
[30, 60, 90, 120, 150]
true
```

```tulpa starter
# build the sweep here
```
```tulpa solution
print(list(range(30, 151, 30)))
print(165 in 10..=170)
```
```expect
[30, 60, 90, 120, 150]
true
```
```hint
`range(30, 151, 30)`: the stop is exclusive, so use 151 to include 150.
:::

:::takeaways
- `a..b` excludes `b`, `a..=b` includes it; `range(start, stop, step)` for steps.
- `x in a..=b` tests limits; ranges slice lists and strings; ranges work as `match` patterns.
:::
