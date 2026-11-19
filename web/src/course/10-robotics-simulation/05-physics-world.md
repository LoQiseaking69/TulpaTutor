---
title: Physics Simulation with std/world
minutes: 16
xp: 75
skill: robotics
summary: A 2-D world with walls and obstacles, a differential-drive rover, range and IMU sensors, collisions and battery.
---
Before code drives a real robot into a real wall, it should drive a simulated one into a
simulated wall. `std/world` is a deterministic 2-D physics world for mobile robots that runs
right here, on the virtual clock.

## Building a world

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)     # physics step and noise seed
w.arena(4, 2)                                # 4 m x 2 m walled box
w.disc(2.0, 1.0, 0.3)                        # a pillar: x, y, radius (m)
w.wall(1.0, 0.0, 1.0, 0.6)                   # a wall segment
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
print("start:", r.position(), "heading", r.yaw())
print("range ahead:", r.range(0[rad], 4[m]))
```

## Driving

`drive(left, right)` takes wheel commands in −1..1 (a differential drive: equal is straight,
opposite spins on the spot). `w.step()` advances physics by one `dt` **and** the virtual
clock:

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
for i in 0..100 { r.drive(1.0, 1.0); w.step() }
print("after 2 s straight:", r.position(), "speed", r.speed())
for i in 0..50 { r.drive(-0.5, 0.5); w.step() }
print("after spinning:", r.yaw().to("deg"))
```

## Sensors

| Method | Gives |
|---|---|
| `range(angle, limit, sigma)` | distance to the nearest obstacle along a ray (relative angle) |
| `imu(sigma)` | `{ax, ay, az, gz}` like a real IMU |
| `position()`, `yaw()`, `speed()`, `yaw_rate()` | ground truth for evaluation |
| `odo_l`, `odo_r` | wheel odometry |
| `battery` | 0..1, drains with effort |
| `collided`, `bumps` | contact state and collision count |

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
for deg in [-60, -30, 0, 30, 60] {
    println!("ray {:>3} deg: {:.2} m", deg, r.range(deg * 1[deg], 4[m]).in("m"))
}
print("noisy:", r.range(0[rad], 4[m], 0.02[m]))
```

## Collisions

Drive into the pillar and the physics stops you, counting the bump:

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
for i in 0..250 { r.drive(1.0, 1.0); w.step() }
print("x:", round(r.position()[0].in("m"), 2), "collided:", r.collided, "bumps:", r.bumps)
```

## Reactive stop

Your first controller: drive until the range sensor says 0.3 m, then stop. Plotted live:

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
let ticks = 0
while ticks < 500 {
    let d = r.range(0[rad], 4[m])
    let v = clamp((d.in("m") - 0.3) * 2, 0.0, 1.0)      # slow down as we approach
    r.drive(v, v)
    w.step()
    tlm::plot("range", d.in("m"), millis() / 1000.0)
    tlm::plot("command", v, millis() / 1000.0)
    if v == 0.0 { break }
    ticks += 1
}
print(f"stopped {r.range(0[rad], 4[m]).in("m"):.2f} m from the pillar after {millis() / 1000.0} s, bumps {r.bumps}")
```

A proportional slow-down gives a smooth, collision-free stop.

:::note Driver in the loop
`std/world` combines with `std/emu`: an emulated IMU fed by `r.imu()` and an emulated PWM chip
whose pulses drive `r.drive(...)`, so your *real drivers* run in the loop. See
`examples/sim_rover` in the TulpaLang repository.
:::

```quiz
? What does `r.drive(0.5, -0.5)` do?
- drives straight at half speed
+ spins on the spot
> Opposite wheel commands rotate the rover.
? What advances the virtual clock in a std/world simulation?
+ each `w.step()`
- `r.drive()`
> The world step moves physics and time together.
```

:::exercise Wall follower distance
In a `4 x 2` arena with a rover at `x: 0.5, y: 1.0`, drive straight (full speed) until the
forward range is below `0.5 m`, then stop. Print whether the rover collided and the forward
range rounded to 1 decimal.

Expected: `false 0.5`

```tulpa starter
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
```
```tulpa solution
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
let r = w.rover(x: 0.5, y: 1.0, max_speed: 0.6[m/s])
while r.range(0[rad], 4[m]) >= 0.5[m] {
    r.drive(1.0, 1.0)
    w.step()
}
r.stop()
print(r.collided, round(r.range(0[rad], 4[m]).in("m"), 1))
```
```expect
false 0.5
```
```hint
`while r.range(0[rad], 4[m]) >= 0.5[m] { r.drive(1.0, 1.0); w.step() }` then `r.stop()`.
:::

:::takeaways
- `World(dt, seed)`, `arena wall disc rover step`; deterministic on the virtual clock.
- Rover: `drive(l, r) stop range imu position yaw speed battery collided bumps`.
- Test controllers in simulation first; plot sensors and commands with `tlm::plot`.
:::
