---
title: Interfaces
minutes: 16
xp: 70
skill: programming
summary: Contracts between components: interface, impl, extension, conformance checks and unit return types.
---
A navigation stack should not care whether distance comes from a lidar, a sonar or a
simulator. An **interface** names the methods a component must provide, so any conforming
struct can be swapped in.

## Declaring and implementing

```tulpa
interface Rangefinder {
    fn distance(self) -> [m]
}
struct Sonar impl Rangefinder {
    echo_us = 1166.0
    fn distance(self) -> [m] { self.echo_us * 1[us] * 343[m/s] / 2 }
}
struct FakeLidar impl Rangefinder {
    d: [m] = 1.5[m]
    fn distance(self) -> [m] { self.d }
}
fn too_close(r: Rangefinder) { r.distance() < 0.25[m] }
print(Sonar().distance(), too_close(Sonar()))
print(too_close(FakeLidar(0.1[m])))
```

`fn too_close(r: Rangefinder)` accepts **any** struct that implements the interface.

:::note A true story from writing this lesson
The first draft of `Sonar.distance` multiplied the echo time as a bare number
(`self.echo_us * 1e-6 * 343[m/s]`), which is a speed, not a distance. The `-> [m]` return
annotation rejected it immediately. Writing `self.echo_us * 1[us]` makes it a time, and the
result a length.
:::

## Conformance is checked at definition

`struct S impl I` is verified when `S` is defined. A missing method, a different number of
parameters, or a mismatched return unit is an error, before any code runs:

```tulpa error
interface Thermometer { fn temperature(self) -> [K] }
struct Broken impl Thermometer {
    fn temp(self) { 300 }
}
```

```tulpa error
interface Thermometer { fn temperature(self) -> [K] }
struct WrongUnit impl Thermometer {
    fn temperature(self) -> [m] { 1[m] }
}
```

The unit in `-> [K]` is part of the contract: a thermometer that returns metres is rejected.

## Extending interfaces

An interface can extend another and inherit its methods:

```tulpa
interface Driver {
    fn probe(self) -> bool
}
interface Thermometer: Driver {
    fn temperature(self) -> [K]
}
struct Tmp102 impl Thermometer {
    raw = 0x190
    fn probe(self) -> bool { true }
    fn temperature(self) -> [K] { 273.15[K] + 0.0625[K] * float(self.raw >> 4) }
}
let t = Tmp102()
print(t.probe(), t.temperature())
print(implements(t, "Driver"), implements(t, "Thermometer"))
```

`implements(x, "Name")` tests conformance at runtime. A struct can implement several:
`struct S impl A, B`.

## The standard driver interfaces

`std/driver` defines interfaces every Tulpa driver uses: `Driver`, `Imu`, `Thermometer`,
`Rangefinder`, `Adc`, `PwmController`. Implement them and your device works with any code
written against them. Module 9 does exactly that.

```tulpa
from "std/driver" import Rangefinder
struct Fixed impl Rangefinder {
    fn probe(self) -> bool { true }
    fn init(self) { }
    fn distance(self) -> [m] { 0.8[m] }
}
print(Fixed().distance())
```

```quiz
? When is `struct S impl I` checked for missing methods?
+ when the struct is defined
- the first time a method is called
- never
> Conformance errors appear before the program runs any further.
? An interface method declares `-> [K]`. Your implementation returns `[deg]`. Result?
- accepted: both are numbers
+ rejected: the return unit is part of the contract
> Units are part of the interface.
```

:::exercise Two batteries, one interface
Define `interface Battery { fn percent(self) -> float }`. Implement it with `struct LiPo`
(`volts = 3.9`; percent is `(volts - 3.3) / (4.2 - 3.3) * 100`) and `struct Fixed`
(`p = 50.0`). Write `fn status(b: Battery)` returning `"low"` if percent < 20 else `"ok"`.
Print `round(LiPo().percent(), 1)`, `status(LiPo(3.4))` and `status(Fixed())`.

Expected: `66.7 low ok`

```tulpa starter
interface Battery { fn percent(self) -> float }
```
```tulpa solution
interface Battery { fn percent(self) -> float }
struct LiPo impl Battery {
    volts = 3.9
    fn percent(self) -> float { (self.volts - 3.3) / (4.2 - 3.3) * 100 }
}
struct Fixed impl Battery {
    p = 50.0
    fn percent(self) -> float { self.p }
}
fn status(b: Battery) { if b.percent() < 20 { "low" } else { "ok" } }
print(round(LiPo().percent(), 1), status(LiPo(3.4)), status(Fixed()))
```
```expect
66.7 low ok
```
```check
assert implements(LiPo(), "Battery")
assert implements(Fixed(), "Battery")
```
```hint
Both structs need `impl Battery` and a `fn percent(self) -> float`.
:::

:::takeaways
- `interface I { fn m(self) -> T }`; `struct S impl I` is checked at definition.
- Interfaces extend (`interface B: A`); `implements(x, "I")` at runtime.
- Return units are part of the contract; `std/driver` defines the standard driver interfaces.
:::
