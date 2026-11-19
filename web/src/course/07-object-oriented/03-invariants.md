---
title: Struct Invariants
minutes: 14
xp: 65
skill: programming
summary: Facts a struct guarantees forever, checked after every change and rolled back on failure.
---
Some facts about an object must **always** be true: a servo's angle stays within its
mechanical limits, a buffer's count never exceeds its capacity. A struct **invariant** states
the fact once, and Tulpa enforces it everywhere.

## Declaring an invariant

```tulpa
struct Joint {
    angle = 90.0
    invariant 10 <= self.angle and self.angle <= 170
    fn move_to(self, a) { self.angle = a }
}
let j = Joint()
j.move_to(150)
print(j.angle)
try { j.move_to(200) } catch e { print("rejected:", e) }
print("angle is still", j.angle)
```

Invariants are checked:

- after construction,
- after every method call,
- after every **field write**, even from outside the struct.

## Rollback

A field write that breaks an invariant is **rolled back** before the error is raised. The
object is never left in an invalid state, even if you catch the error and carry on. That is
what printed `150` above.

```tulpa
struct Tank {
    level = 0.0
    capacity = 10.0
    invariant 0 <= self.level and self.level <= self.capacity
}
let t = Tank()
t.level = 7.5
try { t.level = 12.0 } catch e { print("overflow blocked") }
print(t.level)
```

## Several invariants

Write one per fact. The error quotes the one that failed:

```tulpa error
struct Pwm {
    duty = 0.0
    freq = 1000
    invariant 0.0 <= self.duty and self.duty <= 1.0
    invariant self.freq > 0
}
let p = Pwm()
p.freq = 0
```

## Construction is checked too

```tulpa error
struct Joint {
    angle = 90.0
    invariant 10 <= self.angle and self.angle <= 170
}
let bad = Joint(angle: 5.0)
```

## Invariants + units

The famous example from the Tulpa README, with units:

```tulpa
struct Lift {
    height: [m] = 0[m]
    invariant 0[m] <= self.height and self.height <= 1.2[m]
    fn raise(self, by: [m]) { self.height = self.height + by }
}
let l = Lift()
l.raise(50[cm]); l.raise(40[cm])
print(l.height)
try { l.raise(1[m]) } catch e { print("blocked at", l.height) }
```

:::deep Invariants vs always
A struct invariant guards one object's fields. An `always` envelope watches any condition
across the program. Use invariants for the object's own consistency, envelopes for system
rules.
:::

```quiz
? A field write breaks an invariant inside a try/catch. What is the field's value afterwards?
+ its value before the write
- the invalid value
- nil
> Writes that break invariants are rolled back.
? Which is NOT a point where struct invariants are checked?
- after construction
- after a method call
+ before each method call
> They are checked after changes.
```

:::exercise Bounded counter
Define `struct Counter` with `value = 0`, `limit = 3`, an invariant that `value` stays in
`0..=limit`, and a method `inc(self)` adding 1. Call `inc` five times inside a loop, catching
errors (count how many were rejected), then print the value and the rejections.

Expected: `3 2`

```tulpa starter
struct Counter {
    value = 0
    limit = 3
}
let c = Counter()
let rejected = 0
```
```tulpa solution
struct Counter {
    value = 0
    limit = 3
    invariant 0 <= self.value and self.value <= self.limit
    fn inc(self) { self.value += 1 }
}
let c = Counter()
let rejected = 0
for i in 0..5 {
    try { c.inc() } catch e { rejected += 1 }
}
print(c.value, rejected)
```
```expect
3 2
```
```hint
`invariant 0 <= self.value and self.value <= self.limit`.
---
Wrap `c.inc()` in `try { } catch e { rejected += 1 }` inside `for i in 0..5`.
:::

:::takeaways
- `invariant expr` in a struct is checked after construction, methods and every field write.
- Violating writes are rolled back: objects never stay invalid.
- One invariant per fact; they work with units.
:::
