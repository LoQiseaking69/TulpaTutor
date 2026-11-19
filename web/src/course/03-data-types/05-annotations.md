---
title: Types and Annotations
minutes: 12
xp: 55
skill: syntax
summary: Optional type annotations, unit-typed parameters, nullable types, and conversions.
---
Tulpa is dynamically typed, but you can **annotate** parameters, return values and struct
fields. Annotations are checked at runtime, and they double as documentation.

## Annotating a function

```tulpa
fn drive(speed: [m/s], duration: [s] = 2[s]) -> [m] {
    speed * duration
}
print(drive(0.5[m/s]))
print(drive(0.5[m/s], 10[s]))
```

`[m/s]` means "a quantity with the dimension of speed". Any speed unit is accepted:

```tulpa
fn drive(speed: [m/s], duration: [s]) -> [m] { speed * duration }
print(drive(18[km/h], 1[min]))
```

## When an annotation fails

Pass the wrong thing and you get a clear type error, at the call:

```tulpa error
fn drive(speed: [m/s], duration: [s]) -> [m] { speed * duration }
print(drive(5[m], 2[s]))
```

## Available annotations

| Annotation | Accepts |
|---|---|
| `any` | anything |
| `int float str bool list dict range nil` | that type |
| `num` | int or float |
| `fn` | a function |
| `quantity` | any quantity |
| `[unit]` | a quantity of that dimension |
| struct, machine or device names (`GPIO`) | an instance |
| `T?` | `T` or `nil` |

```tulpa
fn label(id: int, name: str? = nil) {
    if name == nil { f"device {id}" } else { f"{name} ({id})" }
}
print(label(3))
print(label(4, "lidar"))
```

## Conversions

The conversion functions turn values from one type to another:

```tulpa
print(int("42") + 1, float("2.5") * 2, str(3.5) + "!")
print(int(3.99), round(3.99))
print(int("0x1F"), int("101", 2))
print(bool(1), list("abc"))
```

`int(3.99)` truncates toward zero; `round` rounds.

## Checking at runtime

Inside generic code, `type(v)` lets you branch on what you were given:

```tulpa
fn describe(v) {
    let t = type(v)
    if t == "quantity" { f"a quantity in {v.unit}" } else { f"a {t}" }
}
print(describe(3[V]))
print(describe([1, 2]))
```

```quiz
? Which call passes `fn f(t: [s])`?
- `f(5)`
- `f(5[m])`
+ `f(5[ms])`
> Any time unit matches `[s]`.
? What does `str?` mean as an annotation?
+ a string or nil
- an optional parameter that defaults to ""
> `?` allows nil.
```

:::exercise Typed helper
Write `fn kinetic(m: [kg], v: [m/s]) -> [J]` returning `0.5 * m * v ** 2`. Then print
`kinetic(2[kg], 3[m/s])`.

Expected: `9 J`

```tulpa starter
fn kinetic(m, v) {
    0
}
print(kinetic(2[kg], 3[m/s]))
```
```tulpa solution
fn kinetic(m: [kg], v: [m/s]) -> [J] {
    0.5 * m * v ** 2
}
print(kinetic(2[kg], 3[m/s]))
```
```expect
9 J
```
```check
let ok = false
try { kinetic(2[m], 3[m/s]) } catch e { ok = true }
assert ok
```
```hint
Annotate the parameters `m: [kg]` and `v: [m/s]`, and the return type `-> [J]`.
---
The checker also passes a length as `m`, which must be rejected: that is what the annotation is for.
:::

:::takeaways
- Annotations (`x: [m/s]`, `-> [J]`, `name: str?`) are checked at runtime.
- `num any fn quantity [unit] T?` and struct/device names.
- `int float str bool list` convert; `int()` truncates, `round()` rounds.
:::
