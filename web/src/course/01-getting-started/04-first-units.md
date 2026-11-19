---
title: Your First Units
minutes: 12
xp: 50
skill: syntax
summary: Quantities like 5[m] and 2[s], automatic unit arithmetic, and caught unit mistakes.
---
In 1999 a NASA probe was lost because one team used pound-force seconds and another used
newton-seconds. Tulpa makes that class of bug impossible to miss, because **units are part
of the value**.

## Writing a quantity

Put a unit in square brackets directly after a number, with no space:

```tulpa
let arm_length = 0.35[m]
let duration = 250[ms]
let angle = 90[deg]
print(arm_length, duration, angle)
```

## Arithmetic follows the physics

Adding lengths gives a length, even when the units differ. Dividing a length by a time gives
a speed. Tulpa converts and combines units for you:

```tulpa
print(2[m] + 50[cm])
let v = 120[m] / 9.5[s]
print(v)
print(v * 3[s])
```

Look at the last line: a speed multiplied by a time gives back a length.

## Mistakes are caught

Adding a length to a time has no physical meaning, so Tulpa refuses:

```tulpa error
let d = 3[m]
let t = 2[s]
print(d + t)
```

The error tells you exactly which dimensions clashed. In ordinary code, `3 + 2` would
quietly produce `5` and the bug would surface later as a robot driving into a wall.

## Converting

`.to("unit")` converts a quantity to another unit of the same dimension, and `.in("unit")`
gives you a plain number in that unit:

```tulpa
let v = 12.5[m/s]
print(v.to("km/h"))
print(v.in("mph"))
print(1[mi].to("km"))
```

## Dimensions cancel

Divide two lengths and the units cancel, leaving a plain number. That is how you get ratios:

```tulpa
let wheel = 0.2[m]
let travelled = 3[m]
print(travelled / wheel)       # how many wheel lengths
print(type(travelled / wheel))
```

:::note C is the coulomb
In Tulpa, `C` is the unit of charge. Temperatures use kelvin, `K`. You will see the full unit
table in Module 3.
:::

```quiz
? What does `1[m] + 20[cm]` evaluate to?
- An error: different units
+ `1.2 m`
- `21`
> Both are lengths, so Tulpa converts and adds them.
? What is the type of `10[m] / 2[m]`?
- `quantity`
+ `float`
- `str`
> The dimensions cancel, leaving a plain number.
```

:::exercise Lap timer
A rover drives a 400 m lap in 2 minutes. Compute its speed and print it **in km/h** using
`.to("km/h")`.

Expected output: `12 km/h`

```tulpa starter
let lap = 400[m]
let time = 2[min]
let speed = lap / time
print(speed)
```
```tulpa solution
let lap = 400[m]
let time = 2[min]
let speed = lap / time
print(speed.to("km/h"))
```
```expect
12 km/h
```
```hint
`speed.to("km/h")` converts the speed.
:::

:::takeaways
- `number[unit]` builds a quantity; arithmetic combines and converts units.
- Mismatched dimensions (`3[m] + 2[s]`) are errors.
- `.to("u")` converts, `.in("u")` gives a plain number, `a[m] / b[m]` is a plain number.
:::
