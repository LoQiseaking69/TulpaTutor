---
title: Units of Measure in Depth
minutes: 16
xp: 60
skill: syntax
summary: Dimensions, compound units, conversions, quantity fields, and units in math functions.
---
You met quantities in Module 1. Here is the full model, because it is the heart of what makes
Tulpa different.

## What a quantity stores

A quantity stores three things: its **SI value**, its **dimension** (length, time, mass and
so on), and the **unit you wrote**, for display:

```tulpa
let v = 120[m] / 9.5[s]
print(v)              # display value with unit
print(v.value)        # number in the display unit
print(v.unit)         # display unit
print(v.si)           # value in SI units
```

## Compound units

Combine units with `*`, `.`, `/` and `^n` inside the brackets:

```tulpa
let g = 9.81[m/s^2]
let torque = 2.5[N*m]
let area = 4[m^2]
let mass = 2[kg]
print(g * mass)                 # force
print((g * mass).to("N"))
print(sqrt(area))               # square root halves the exponents
```

Derived units are recognised: `kg·m/s²` is newtons, `V·A` is watts:

```tulpa
let power = 12[V] * 2.5[A]
print(power, power.to("W"))
let energy = power * 10[min]
print(energy.to("J"), energy.to("Wh"))
```

## The unit table

| Group | Units |
|---|---|
| Length | `m km cm mm um nm in ft yd mi` |
| Mass | `kg g mg t lb oz` |
| Time | `s ms us ns min h` |
| Electrical | `A mA uA V mV kV ohm kohm Mohm C mAh Ah` |
| Base | `K mol cd` |
| Angle | `rad deg rev` |
| Frequency | `Hz kHz MHz rpm` |
| Force, energy, power | `N kN J kJ Wh W mW kW` |
| Pressure | `Pa kPa bar psi` |
| Speed, acceleration | `kph mph gee` |

## Angles and math

Trigonometric functions understand angle units, so there is no more radians/degrees
confusion:

```tulpa
print(round(sin(30[deg]), 6))
print(round(cos(0.5[rev]), 6))
print(90[deg].to("rad"))
print(1200[rpm].to("rad/s"), 60[rpm].to("deg/s"))
```

## Building quantities at runtime

`quantity(value, "unit")` builds a quantity from a number, for example from a parsed config
file or a sensor:

```tulpa
let raw_mm = 423
let d = quantity(raw_mm, "mm")
print(d.to("m"))
```

## Rules that keep you safe

- `+`, `-`, `%` and comparisons need **matching dimensions**.
- Comparing with a bare `0` is always allowed: `speed > 0`.
- `float(q)` is an **error**: say what you mean with `.in("unit")` or `.si`.

```tulpa error
let d = 2[m]
print(float(d))
```

```tulpa
let d = 2[m]
print(d.in("cm"), d.si, d > 0)
```

:::deep Why forbid float(q)?
Converting `2[km]` to a float could mean 2 or 2000. Tulpa refuses to guess. `.in("m")` makes
your intent explicit, and that explicitness is exactly what prevents unit bugs.
:::

```quiz
? What is `(12[V] * 2[A]).to("W")`?
+ `24 W`
- an error
- `24 V*A` only
> Volts times amps is a power, so it converts to watts.
? Which is allowed?
- `float(3[m])`
+ `3[m].in("mm")`
- `3[m] + 3[s]`
> Use `.in(unit)` to get a plain number.
```

:::exercise Motor energy
A motor draws `1.8[A]` at `24[V]` for `90[s]`. Compute the energy and print it in
watt-hours, rounded to 3 decimals using `.in("Wh")` and `round`.

Expected: `1.08`

```tulpa starter
let current = 1.8[A]
let voltage = 24[V]
let t = 90[s]
```
```tulpa solution
let current = 1.8[A]
let voltage = 24[V]
let t = 90[s]
let energy = current * voltage * t
print(round(energy.in("Wh"), 3))
```
```expect
1.08
```
```hint
Energy = current × voltage × time. Then `round(energy.in("Wh"), 3)`.
:::

:::takeaways
- Quantities carry SI value, dimension and display unit (`.value .unit .si`).
- Compound units `[m/s^2]`, `[N*m]`; derived units convert (`V*A` → `W`).
- Trig understands angles; `quantity(v, "u")` builds at runtime; `float(q)` is forbidden.
:::
