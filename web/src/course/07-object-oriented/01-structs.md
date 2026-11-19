---
title: Structs
minutes: 14
xp: 60
skill: programming
summary: Defining structs, fields with defaults and types, construction and reflection.
---
A **struct** groups related data under one name: a joint has an angle and limits, a waypoint
has coordinates and a speed. Structs replace loose dicts with a defined, checked shape.

## Defining and constructing

```tulpa
struct Waypoint {
    x: [m]
    y: [m]
    speed: [m/s] = 0.3[m/s]
    label = ""
}
let a = Waypoint(1[m], 2[m])
let b = Waypoint(x: 0[m], y: 5[m], label: "dock")
print(a.x, a.y, a.speed)
print(b.label, b.speed)
```

Construct positionally (in field order), by keyword, or both. Fields with defaults can be
left out. Defaults may refer to earlier fields.

## Fields are checked

Field annotations use the same types as function parameters, checked at construction and on
every write:

```tulpa error
struct Joint {
    name: str
    angle: [deg] = 0[deg]
}
let j = Joint("elbow")
j.angle = 0.5[m]      # a length is not an angle
```

## Reading and writing fields

```tulpa
struct Battery {
    capacity: [mAh]
    level = 1.0
}
let bat = Battery(2200[mAh])
bat.level = 0.42
print(f"{bat.level * 100:.0f}% of {bat.capacity}")
print("remaining:", bat.capacity * bat.level)
```

## Printing

By default a struct prints with its type and fields, which is great for debugging:

```tulpa
struct Pose { x = 0.0; y = 0.0; theta = 0.0 }
let p = Pose(1.5, 2.0, 0.78)
print(p)
```

You will customise this with `to_str` in a later lesson.

## Reflection

`Type.fields()` lists the fields and `Type.name()` the struct's name. `type(value)` of any
struct instance is `"object"`:

```tulpa
struct Pose { x = 0.0; y = 0.0; theta = 0.0 }
print(Pose.fields(), Pose.name(), type(Pose()))
```

## Structs vs dicts

| Use a dict when | Use a struct when |
|---|---|
| keys vary at runtime (config, JSON) | the shape is fixed and known |
| it is quick throwaway data | you want typed fields, defaults, methods, invariants |

```quiz
? Given `struct P { x = 0; y = 0 }`, which call sets only y?
- `P(5)`
+ `P(y: 5)`
> Keyword construction targets a specific field.
? What does `type(P())` return?
- `"P"`
+ `"object"`
> Use `P.name()` for the struct's name.
```

:::exercise Define a sensor reading
Define `struct Reading` with fields `sensor: str`, `value: float`, and `unit: str = "m"`.
Create `Reading("lidar", 2.35)` and print it as `lidar: 2.35 m` using an f-string.

```tulpa starter
# define Reading
```
```tulpa solution
struct Reading {
    sensor: str
    value: float
    unit: str = "m"
}
let r = Reading("lidar", 2.35)
print(f"{r.sensor}: {r.value} {r.unit}")
```
```expect
lidar: 2.35 m
```
```check
let bad = false
try { Reading(3, 1.0) } catch e { bad = true }
assert bad, "sensor must be annotated as str"
```
```hint
`struct Reading { sensor: str; value: float; unit: str = "m" }` (fields on separate lines or separated by `;`).
:::

:::takeaways
- `struct S { field: type = default }`; construct by position or keyword.
- Field annotations are checked on construction and every write.
- `S.fields()`, `S.name()`; `type(instance)` is `"object"`.
:::
