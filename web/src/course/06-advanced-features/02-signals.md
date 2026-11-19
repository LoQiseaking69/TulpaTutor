---
title: Signals
minutes: 14
xp: 60
skill: programming
summary: Reactive values with history, derived values, statistics and subscriptions.
---
A sensor value is not just a number: it changes over time, and you care about its recent
history, trend and extremes. Tulpa's **signal** is a reactive value built for that.

## Creating and updating

```tulpa
let temp = signal(293[K])
print(temp.get())
temp.set(295[K])
temp.value = 297[K]      # same as set
print(temp.get(), "previous:", temp.prev())
```

## Built-in history and statistics

A signal keeps its last 256 samples (or a capacity you choose with `signal(v, n)`):

```tulpa
let dist = signal(1.0)
for d in [0.9, 0.8, 1.6, 0.7, 0.6] { dist.set(d) }
print(dist.history())
print("avg of last 3:", round(dist.avg(3), 3))
print("min/max:", dist.min(), dist.max())
```

`avg(n)` is a ready-made moving-average filter, which smooths that spike of 1.6.

## Rate of change

`rate()` is the change per second between the last two samples, using the clock:

```tulpa
let position = signal(0.0[m])
sleep(0.5)
position.set(0.2[m])
print("velocity:", position.rate())
```

Units carry through: metres per second, computed for you.

## Derived signals

`derive(fn)` makes a value computed from other signals whenever it is read:

```tulpa
let voltage = signal(12.0[V])
let current = signal(1.5[A])
let power = derive(|| voltage.get() * current.get())
print(power.get().to("W"))
current.set(2.0[A])
print(power.get().to("W"))
```

## Subscriptions

`subscribe(fn)` calls `fn(new, old)` on every change, which is useful for logging and wiring
side effects:

```tulpa
let mode = signal("idle")
mode.subscribe(|new, old| print(f"mode: {old} -> {new}"))
mode.set("driving")
mode.set("docking")
```

## Why signals?

Signals are what `when` rules and `always` monitors watch (next two lessons), what Tulpa Link
topics expose (Module 8), and they put filtering and history where the data lives instead of
in scattered helper variables.

```quiz
? What does `s.prev()` return?
+ the value before the most recent set
- the first value ever stored
- the average
> prev is the previous sample.
? When is a `derive` value computed?
- once, when created
+ whenever it is read
> Derived values are computed on read, so they are always current.
```

:::exercise Smooth the sonar
Create `sonar = signal(0.50)` (the first reading), then set it, in order, to
`0.52, 2.90, 0.49, 0.51`. Print the latest raw value, then the average of the last 5 samples
rounded to 2 decimals, then the minimum. (A signal's history includes its initial value.)

Expected:
```
0.51
0.98
0.49
```

```tulpa starter
let sonar = signal(0.50)
```
```tulpa solution
let sonar = signal(0.50)
for v in [0.52, 2.90, 0.49, 0.51] { sonar.set(v) }
print(sonar.get())
print(round(sonar.avg(5), 2))
print(sonar.min())
```
```expect
0.51
0.98
0.49
```
```hint
Loop over the values and call `sonar.set(v)`. Then `sonar.get()`, `sonar.avg(5)`, `sonar.min()`.
---
The spike of 2.90 pulls the average up to 0.98: a moving average softens spikes but does not remove them. (A median filter would.)
:::

:::takeaways
- `signal(v)`: `get set value prev history avg(n) min max rate subscribe`.
- `derive(|| ...)` computes from other signals on read.
- Signals feed `when` rules, `always` monitors and Link topics.
:::
