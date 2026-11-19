---
title: Composition: Building a Robot Model
minutes: 18
xp: 75
skill: programming
summary: Combining structs, interfaces, machines and envelopes into one coherent robot.
---
Real systems are built by **composing** small parts: a robot *has* motors, *has* sensors, and
*has* a controller. Tulpa favours composition over inheritance: structs hold other structs,
interfaces define the seams, and machines coordinate behaviour.

## Parts

```tulpa static
interface Rangefinder { fn distance(self) -> [m] }

struct Wheel {
    speed = 0.0
    invariant -1.0 <= self.speed and self.speed <= 1.0
    fn set(self, s) { self.speed = clamp(s, -1.0, 1.0) }
}
```

## Assembling the robot

A `Rover` holds two wheels and any rangefinder, and offers a high-level API:

```tulpa
interface Rangefinder { fn distance(self) -> [m] }
struct ScriptedRange impl Rangefinder {
    readings = [2.0, 1.2, 0.6, 0.3, 0.2, 0.9, 1.8]
    i = 0
    fn distance(self) -> [m] {
        let d = self.readings[min(self.i, len(self.readings) - 1)]
        self.i += 1
        d * 1[m]
    }
}
struct Wheel {
    speed = 0.0
    invariant -1.0 <= self.speed and self.speed <= 1.0
    fn set(self, s) { self.speed = clamp(s, -1.0, 1.0) }
}
struct Rover {
    sensor: Rangefinder
    left = nil
    right = nil
    fn init(self) { self.left = Wheel(); self.right = Wheel() }
    fn drive(self, v, turn = 0.0) { self.left.set(v - turn); self.right.set(v + turn) }
    fn stop(self) { self.drive(0.0) }
    fn wheels(self) { f"L={self.left.speed:+.1f} R={self.right.speed:+.1f}" }
}
let r = Rover(ScriptedRange())
r.drive(0.8)
print(r.wheels())
r.drive(0.5, turn: 0.6)
print(r.wheels())
```

Notice the clamp in `Wheel.set` keeping the invariant intact even when `v + turn` exceeds 1.

## Adding behaviour with a machine

The controller is a machine; each tick reads the sensor and sends events:

```tulpa
interface Rangefinder { fn distance(self) -> [m] }
struct ScriptedRange impl Rangefinder {
    readings = [2.0, 1.2, 0.6, 0.3, 0.2, 0.9, 1.8]
    i = 0
    fn distance(self) -> [m] { let d = self.readings[min(self.i, len(self.readings) - 1)]; self.i += 1; d * 1[m] }
}
struct Wheel { speed = 0.0; fn set(self, s) { self.speed = clamp(s, -1.0, 1.0) } }
struct Rover {
    sensor: Rangefinder
    left = nil
    right = nil
    fn init(self) { self.left = Wheel(); self.right = Wheel() }
    fn drive(self, v, turn = 0.0) { self.left.set(v - turn); self.right.set(v + turn) }
}
let rover = Rover(ScriptedRange())
machine Brain {
    state Cruise {
        enter { rover.drive(0.8) }
        on near => Turning
    }
    state Turning {
        enter { rover.drive(0.0, turn: 0.7) }
        on clear => Cruise
    }
}
let brain = Brain()
for tick in 0..7 {
    let d = rover.sensor.distance()
    if d < 0.5[m] { brain.near() } elif d > 1.0[m] { brain.clear() }
    print(f"t{tick} d={d} {brain.state:<8} L={rover.left.speed:+.1f} R={rover.right.speed:+.1f}")
}
```

## Adding safety

Finally, an envelope as the last line of defence: never drive forward when something is
closer than 0.25 m, regardless of what the controller wants:

```tulpa
let distance = 1.0
let forward = 0.0
let interventions = 0
always not (distance < 0.25 and forward > 0) else {
    forward = 0.0
    interventions += 1
}
for step in [[1.0, 0.8], [0.4, 0.8], [0.2, 0.8], [0.6, 0.5]] {
    distance = step[0]
    forward = step[1]
    print(f"d={distance} -> forward={forward}")
}
print("interventions:", interventions)
```

## The shape of a Tulpa robot

| Layer | Tulpa construct |
|---|---|
| Hardware seams | `interface` (`Rangefinder`, `Imu`, …) |
| Parts with rules | `struct` + `invariant` |
| Behaviour | `machine` |
| Glue | `when` rules / control loop |
| Last line of defence | `always` |

```quiz
? Why does `Rover` take `sensor: Rangefinder` rather than a specific sonar struct?
+ any conforming sensor (real or simulated) can be plugged in
- interfaces are faster
> Interfaces define seams for swapping implementations.
? Which construct should own the robot's modes (cruise, turning)?
- a struct field holding a string
+ a machine
> Machines make modes explicit and checkable.
```

:::exercise Differential drive mixer
Write `struct Drive` holding `left = 0.0` and `right = 0.0`, with an invariant that both stay
within -1..1, and a method `mix(self, v, w)` that sets `left = clamp(v - w, -1, 1)` and
`right = clamp(v + w, -1, 1)`. Call `mix(0.9, 0.3)` and print both, then `mix(0.2, -0.5)`
and print both.

Expected:
```
0.6 1.0
0.7 -0.3
```

```tulpa starter
struct Drive {
    left = 0.0
    right = 0.0
}
let d = Drive()
```
```tulpa solution
struct Drive {
    left = 0.0
    right = 0.0
    invariant -1 <= self.left and self.left <= 1 and -1 <= self.right and self.right <= 1
    fn mix(self, v, w) {
        self.left = clamp(v - w, -1, 1)
        self.right = clamp(v + w, -1, 1)
    }
}
let d = Drive()
d.mix(0.9, 0.3)
print(round(d.left, 2), round(d.right, 2))
d.mix(0.2, -0.5)
print(round(d.left, 2), round(d.right, 2))
```
```expect
0.6 1.0
0.7 -0.3
```
```hint
Floating point: `0.9 - 0.3` prints as `0.6000000000000001`. Round to 2 decimals when printing.
:::

:::takeaways
- Compose: structs hold structs; interfaces are the seams; machines own modes.
- Rules or a control loop connect sensors to machines; `always` guards everything.
- Clamp at the boundary so invariants hold under any command.
:::
