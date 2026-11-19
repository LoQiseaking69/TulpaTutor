---
title: Lists
minutes: 14
xp: 55
skill: syntax
summary: Building, indexing, mutating and transforming lists of readings, waypoints and commands.
---
A **list** is an ordered collection: sensor samples, waypoints, joint angles. It is the data
structure you will use most.

## Creating and indexing

```tulpa
let samples = [0.41, 0.39, 0.44, 0.40]
print(samples[0], samples[-1], len(samples))
let zeros = [0; 6]            # six zeros: handy for buffers
print(zeros)
let mixed = [1, "two", 3.0, [4]]
print(mixed)
```

`[value; n]` repeats a value `n` times, which is a quick way to allocate a buffer.

## Changing a list

Lists are **mutable**. These methods change the list in place:

```tulpa
let path = ["A", "B"]
path.push("C")            # add to the end
path.insert(0, "start")   # add at an index
print(path)
let last = path.pop()     # remove and return the last item
print(last, path)
path.remove("start")      # remove the first matching value
print(path)
path[0] = "Alpha"
print(path)
```

## Sorting and searching

`sort()` and `reverse()` change the list. `sorted()` returns a **new** sorted list and leaves
the original alone:

```tulpa
let readings = [12, 3, 8, 5]
let ordered = readings.sorted()
print(readings, ordered)
readings.sort()
print(readings)
print(readings.contains(8), readings.index(8), readings.count(3))
print(readings.sum(), readings.min(), readings.max())
```

## Transforming: map, filter, reduce

These take a small function (written `|x| expression`, a closure; Module 4 covers them in
depth) and apply it across the list:

```tulpa
let raw = [512, 1023, 0, 768]
let volts = raw.map(|r| round(r / 1023.0 * 3.3, 2))
print(volts)
let high = volts.filter(|v| v > 2.0)
print(high)
let total = raw.reduce(|a, b| a + b)
print(total)
print(raw.any(|r| r == 0), raw.all(|r| r >= 0))
```

## Lists are shared, not copied

Assigning a list to another name does **not** copy it: both names refer to the same list.
Use `.copy()` when you need an independent one:

```tulpa
let a = [1, 2, 3]
let b = a
let c = a.copy()
b.push(4)
print(a, b, c)
```

:::warn Shared lists
This is the most common surprise for beginners. If a function changes a list you passed in,
the caller sees the change. That is often what you want, but know when you need `.copy()`.
:::

## A moving average

A classic sensor filter: average the last `n` samples.

```tulpa
let window = []
for reading in [10, 12, 11, 30, 12, 11] {
    window.push(reading)
    if len(window) > 3 { window = window[1..len(window)] }   # keep the newest 3
    print(reading, "->", round(window.sum() / float(len(window)), 1))
}
```

Notice how the spike of `30` is softened. Slicing `window[1..len(window)]` drops the oldest sample (open-ended slices like `xs[1..]` are not supported, so give both ends).

```quiz
? After `let xs = [1, 2]` and `let ys = xs` and `ys.push(3)`, what is `xs`?
- `[1, 2]`
+ `[1, 2, 3]`
> `ys` and `xs` are the same list.
? Which method returns a new list and leaves the original unchanged?
- `sort()`
+ `sorted()`
- `reverse()`
> `sorted()` builds a new list.
```

:::exercise Clean the samples
A distance sensor returned `[0.52, -1.0, 0.48, 9.99, 0.50, -1.0]`. `-1.0` means "no echo"
and `9.99` means "out of range". Build `valid` containing only values between 0 and 5,
then print `valid` and its average rounded to 2 decimals.

Expected output:
```
[0.52, 0.48, 0.5]
0.5
```

```tulpa starter
let samples = [0.52, -1.0, 0.48, 9.99, 0.50, -1.0]
```
```tulpa solution
let samples = [0.52, -1.0, 0.48, 9.99, 0.50, -1.0]
let valid = samples.filter(|s| s >= 0 and s <= 5)
print(valid)
print(round(valid.sum() / len(valid), 2))
```
```expect
[0.52, 0.48, 0.5]
0.5
```
```hint
`samples.filter(|s| s >= 0 and s <= 5)` keeps the good readings.
---
The average is `valid.sum() / len(valid)`; round it with `round(x, 2)`.
:::

:::takeaways
- `[a, b]`, `[v; n]`; index with `xs[i]`, negative from the end.
- Mutating: `push insert pop remove sort reverse`; non-mutating: `sorted copy map filter`.
- Assignment shares a list; `.copy()` duplicates it.
:::
