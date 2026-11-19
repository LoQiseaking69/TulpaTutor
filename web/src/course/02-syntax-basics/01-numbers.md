---
title: Numbers and Arithmetic
minutes: 12
xp: 50
skill: syntax
summary: Integer vs float division, Euclidean remainder, powers, overflow, and math functions.
---
Arithmetic in Tulpa looks familiar, but a few rules are deliberately different from other
languages. They exist because control code must never be silently wrong.

## The operators

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+ - *` | add, subtract, multiply | `6 * 7` | `42` |
| `/` | divide | `7 / 2` | `3` (int ÷ int) |
| `%` | remainder | `7 % 3` | `1` |
| `**` | power | `2 ** 10` | `1024` |

```tulpa
print(6 * 7, 2 ** 10, 7 % 3)
print(7 / 2)        # both ints: integer division
print(7.0 / 2)      # a float operand gives a float
```

## Integer division is Euclidean

When both operands are integers, `/` gives a whole number and `%` the remainder, chosen so
the remainder is **never negative**. That makes them safe for wrapping indexes and angles:

```tulpa
print(-7 / 2, -7 % 2)
print(-1 % 360)     # wrap an angle into 0..359
let i = -1
let ring = [10, 20, 30]
print(ring[i % len(ring)])   # always a valid index
```

The identity `a == b * (a / b) + a % b` always holds.

## Powers are right-associative

`2 ** 3 ** 2` means `2 ** (3 ** 2)`, which is 2⁹:

```tulpa
print(2 ** 3 ** 2)
print((2 ** 3) ** 2)
print(9 ** 0.5)     # fractional powers give floats
```

## Overflow is an error

Integers are 64-bit. Many languages silently **wrap around** when a result is too large, so
a position counter can jump from huge-positive to huge-negative. Tulpa stops instead:

```tulpa error
let big = 9_223_372_036_854_775_807
print(big + 1)
```

## Math functions

The usual math library is built in as global functions, with constants `PI`, `TAU` and `E`:

```tulpa
print(sqrt(16), abs(-3), round(2.567, 2))
print(floor(2.7), ceil(2.1))
print(min(3, 9, 1), max(3, 9, 1))
print(clamp(150, 0, 100))      # keep a value inside a range
print(lerp(0, 10, 0.25))       # linear interpolation
print(f"{PI:.4f}")
```

`clamp` is a favourite in control code: motor commands must stay inside safe limits.

:::deep Why Euclidean?
In C, `-7 % 2` is `-1`. Index a ring buffer with that and you read memory before the
array. Tulpa's Euclidean `%` always lands in `0..n-1` for a positive `n`.
:::

```quiz
? What is `9 / 4` in Tulpa?
+ `2`
- `2.25`
- `3`
> Both operands are ints, so integer division.
? What is `-3 % 5`?
- `-3`
+ `2`
- `3`
> Euclidean remainder is never negative: −3 = 5 × (−1) + 2.
? What happens when an integer calculation exceeds 64 bits?
- It wraps to a negative number
- It becomes a float
+ It is a runtime error
> Overflow never silently wraps in Tulpa.
```

:::exercise Wheel ticks
A wheel encoder gives `ticks = 1234`. There are `360` ticks per revolution. Print:

1. the number of **full** revolutions,
2. the leftover ticks,
3. the revolutions as a float rounded to 2 decimals,

each on its own line.

```tulpa starter
let ticks = 1234
let per_rev = 360
```
```tulpa solution
let ticks = 1234
let per_rev = 360
print(ticks / per_rev)
print(ticks % per_rev)
print(round(ticks / float(per_rev), 2))
```
```expect
3
154
3.43
```
```hint
`ticks / per_rev` is integer division because both are ints.
---
For the float, convert one side with `float(...)` and use `round(x, 2)`.
:::

:::takeaways
- `int / int` is Euclidean integer division; `%` is never negative.
- `**` is right-associative; overflow is an error.
- Built-ins: `sqrt abs round floor ceil min max clamp lerp`, constants `PI TAU E`.
:::
