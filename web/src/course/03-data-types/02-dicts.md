---
title: Dicts
minutes: 12
xp: 50
skill: syntax
summary: Key-value maps for configuration, sensor records and lightweight objects.
---
A **dict** maps keys to values. It is perfect for configuration, a sensor reading with
several fields, or a lookup table.

## Creating and reading

Keys can be bare words or strings. Read a value with `d.key` or `d["key"]`:

```tulpa
let cfg = {port: "/dev/ttyUSB0", baud: 115200, "retries": 3}
print(cfg.port)
print(cfg["baud"])
print(cfg.retries, len(cfg))
```

Use the bracket form when the key is in a variable or is not a valid name:

```tulpa
let limits = {"shoulder": 170, "elbow": 150}
let joint = "elbow"
print(limits[joint])
```

## Changing

```tulpa
let robot = {name: "R2", speed: 0}
robot.speed = 0.5         # update
robot["mode"] = "auto"    # add a new key
print(robot)
robot.remove("mode")
print(robot, "mode" in robot)
robot.update({speed: 1.0, battery: 87})
print(robot)
```

## Safe lookups

Reading a missing key is an error. `get(key, default)` returns a default instead, and `in`
tests for a key:

```tulpa
let offsets = {x: 0.02, y: -0.01}
print(offsets.get("z", 0.0))
print("x" in offsets, offsets.has("z"))
```

```tulpa error
let offsets = {x: 0.02}
print(offsets.z)
```

## Iterating

`for k, v in d` walks the items in insertion order. `keys()`, `values()` and `items()` give
lists:

```tulpa
let temps = {cpu: 331, motor_l: 318, motor_r: 345}
for name, t in temps {
    print(f"{name:<8} {t} K")
}
print(temps.keys())
print(temps.values().max())
```

## Counting with a dict

A very common pattern: count occurrences.

```tulpa
let events = ["bump", "ok", "bump", "stall", "ok", "bump"]
let counts = {}
for e in events {
    counts[e] = counts.get(e, 0) + 1
}
print(counts)
```

## Dicts as lightweight objects

If a dict holds a function under a key, `obj.key(args)` calls it:

```tulpa
let counter = {n: 0, bump: |by| by * 2}
print(counter.bump(21))
```

You will build proper objects with `struct` in Module 7.

```quiz
? What does `{a: 1}.get("b", 5)` return?
- an error
- `nil`
+ `5`
> `get` returns the default when the key is missing.
? How do you read a key whose name is stored in variable `k`?
- `d.k`
+ `d[k]`
> `d.k` looks up the literal key "k".
```

:::exercise Battery report
Given `cells = {c1: 3.71, c2: 3.62, c3: 3.80}`, print the name of the **lowest** cell and its
voltage, like `weakest: c2 3.62`.

```tulpa starter
let cells = {c1: 3.71, c2: 3.62, c3: 3.80}
```
```tulpa solution
let cells = {c1: 3.71, c2: 3.62, c3: 3.80}
let weakest = nil
for name, v in cells {
    if weakest == nil or v < cells[weakest] { weakest = name }
}
print("weakest:", weakest, cells[weakest])
```
```expect
weakest: c2 3.62
```
```hint
Loop with `for name, v in cells` and remember the name with the lowest `v` so far.
:::

:::takeaways
- `{key: value}`; read with `d.key` or `d[k]`; missing keys are errors.
- `get(k, default)`, `in`, `remove`, `update`, `keys values items`.
- `for k, v in d` iterates in insertion order.
:::
