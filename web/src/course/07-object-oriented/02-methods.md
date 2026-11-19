---
title: Methods and Static Methods
minutes: 14
xp: 60
skill: programming
summary: Behaviour inside structs: self, methods that mutate, static constructors and init.
---
Data and the operations on it belong together. A **method** is a function defined inside a
struct whose first parameter is `self`, the instance it was called on.

## Methods

```tulpa
struct Motor {
    pin: int
    speed = 0
    fn set(self, s) { self.speed = clamp(s, -100, 100) }
    fn stop(self) { self.speed = 0 }
    fn running(self) { self.speed != 0 }
}
let m = Motor(12)
m.set(150)
print(m.speed, m.running())
m.stop()
print(m.speed, m.running())
```

`m.set(150)` passes `m` as `self` automatically. Methods can read and change fields.

## Methods calling methods

```tulpa
struct Odometer {
    ticks = 0
    per_metre = 1000
    fn add(self, n) { self.ticks += n }
    fn metres(self) { self.ticks / float(self.per_metre) }
    fn report(self) { f"{self.metres():.2f} m" }
}
let o = Odometer()
o.add(1250); o.add(730)
print(o.report())
```

## Static methods

A function inside a struct **without** `self` is a static method, called on the type. They
make great named constructors:

```tulpa
struct Pose {
    x = 0.0
    y = 0.0
    theta = 0.0
    fn origin() { Pose() }
    fn at(x, y) { Pose(x, y, 0.0) }
}
print(Pose.origin(), Pose.at(2.0, 3.5))
```

## The init hook

`fn init(self)` runs right after construction, after defaults are applied. Use it to set up
hardware or derived fields:

```tulpa
struct Led {
    pin: int
    io = nil
    fn init(self) {
        self.io = GPIO::new(self.pin)
        self.io.set_low()
    }
    fn on(self) { self.io.set_high() }
    fn state(self) { self.io.read() }
}
let led = Led(17)
print("after init:", led.state())
led.on()
print("after on:", led.state())
```

## Wrapping hardware

That `Led` pattern scales: wrap each device in a struct with a small, meaningful API. The
rest of the program says `led.on()` instead of juggling pin numbers.

```quiz
? What is `self` in `fn set(self, s)`?
+ the instance the method is called on
- the struct type
- a copy of the instance
> `m.set(5)` passes `m` itself, so changes stick.
? How do you call a static method `origin()` of `Pose`?
+ `Pose.origin()`
- `Pose().origin(self)`
> Static methods are called on the type.
```

:::exercise Gripper
Write `struct Gripper` with `width = 0.08` (metres as a plain float) and methods
`open(self)` (width 0.08), `close(self)` (width 0.0) and `holding(self)` returning
`self.width < 0.01`. Create one, close it, and print `holding` and `width`.

Expected: `true 0.0`

```tulpa starter
struct Gripper {
    width = 0.08
}
let g = Gripper()
```
```tulpa solution
struct Gripper {
    width = 0.08
    fn open(self) { self.width = 0.08 }
    fn close(self) { self.width = 0.0 }
    fn holding(self) { self.width < 0.01 }
}
let g = Gripper()
g.close()
print(g.holding(), g.width)
```
```expect
true 0.0
```
```check
g.open()
assert_eq!(g.holding(), false)
```
```hint
Each method takes `self` and sets `self.width`.
:::

:::takeaways
- Methods take `self` first and can mutate fields; call as `obj.m(...)`.
- Functions without `self` are static: `Type.f()`; great as named constructors.
- `fn init(self)` runs after construction; wrap devices in structs.
:::
