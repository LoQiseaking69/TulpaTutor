---
title: "Capstone: An Autonomous Rover"
minutes: 25
xp: 120
skill: robotics
summary: Putting it all together: a navigator state machine, sensors, safety envelope and telemetry in a physics world.
---
This is the last lesson of the course. You will build a rover that drives to a goal around an
obstacle, using nearly everything you have learned: units, functions, a state machine, a
safety envelope, a fixed control loop and live telemetry.

## Why a naive controller fails

"Steer toward the goal; if something is ahead, turn away" sounds right. Run it:

```tulpa
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
let goal = [3.6, 1.0]
fn wrap(a) { atan2(sin(a), cos(a)) }
let ticks = 0
while ticks < 1500 and r.distance_to(goal[0], goal[1]) > 0.15[m] {
    let p = r.position()
    let bearing = wrap(atan2(goal[1] - p[1].in("m"), goal[0] - p[0].in("m")) - r.yaw().in("rad"))
    let front = r.range(0[rad], 2[m])
    let v = 0.8
    let turn = clamp(bearing * 1.5, -0.8, 0.8)
    if front < 0.5[m] { v = 0.25; turn = 0.8 }
    r.drive(v - turn, v + turn)
    w.step()
    ticks += 1
}
let p = r.position()
println!("gave up after {} s at ({:.2}, {:.2}), bumps {}", millis() / 1000.0, p[0].in("m"), p[1].in("m"), r.bumps)
```

It dithers at the pillar: every tick it turns away, then the goal-seeking pulls it straight
back. The fix is the lesson of Module 5: make the **modes explicit** and commit to a manoeuvre.

## The navigator machine

Three modes: **Seek** the goal; **Avoid** by turning away for a fixed time; **Bypass** by
driving straight for a while before seeking again:

```tulpa static
machine Nav {
    state Seek   { on blocked => Avoid }
    state Avoid  { on done => Bypass }
    state Bypass { on done => Seek; on blocked => Avoid }
}
```

## The complete rover

```tulpa
import "std/world"
sim::virtual_time(true)

# ---- world
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
let goal = [3.6, 1.0]

# ---- helpers
fn wrap(a) { atan2(sin(a), cos(a)) }
fn bearing_to(gx, gy) {
    let p = r.position()
    wrap(atan2(gy - p[1].in("m"), gx - p[0].in("m")) - r.yaw().in("rad"))
}

# ---- behaviour
machine Nav {
    state Seek { on blocked => Avoid }
    state Avoid { on done => Bypass }
    state Bypass { on done => Seek; on blocked => Avoid }
}
let nav = Nav()
let hold = 0
let side = 1.0

# ---- safety: never push forward into something closer than 0.2 m
let forward = 0.0
let saves = 0
always not (forward > 0 and r.range(0[rad], 2[m]) < 0.2[m]) else { forward = 0.0; saves += 1 }

# ---- control loop at 50 Hz
let reached = false
every!(20[ms], 1500, {
    if r.distance_to(goal[0], goal[1]) < 0.15[m] { reached = true; r.stop(); break }
    let front = r.range(0[rad], 2[m])
    let left = r.range(0.7[rad], 2[m])
    let right = r.range(-0.7[rad], 2[m])
    if (nav.is("Seek") or nav.is("Bypass")) and front < 0.45[m] {
        side = if left > right { 1.0 } else { -1.0 }
        hold = 20
        nav.blocked()
    }
    let turn = 0.0
    if nav.is("Seek") { forward = 0.8; turn = clamp(bearing_to(goal[0], goal[1]) * 1.5, -0.8, 0.8) }
    elif nav.is("Avoid") { forward = 0.0; turn = 0.6 * side; hold -= 1; if hold <= 0 { hold = 40; nav.done() } }
    else { forward = 0.7; hold -= 1; if hold <= 0 { nav.done() } }
    r.drive(forward - turn, forward + turn)
    w.step()
    let p = r.position()
    tlm::plot("x [m]", p[0].in("m"), millis() / 1000.0)
    tlm::plot("y [m]", p[1].in("m"), millis() / 1000.0)
})
let p = r.position()
println!("reached: {} in {:.1} s at ({:.2}, {:.2}); bumps {}; safety saves {}; modes {}",
    reached, millis() / 1000.0, p[0].in("m"), p[1].in("m"), r.bumps, saves, nav.history.len())
```

Look at the plot: `x` climbs steadily, `y` swings out around the pillar and back to 1.0.

## What each part contributed

| Part | Construct |
|---|---|
| distances, angles, speeds | units |
| bearing maths | functions, `atan2`, angle wrapping |
| committed manoeuvres | `machine` with events |
| never ram anything | `always` envelope |
| 50 Hz control | `every!` |
| testing without hardware | `std/world` on the virtual clock |
| seeing behaviour | `tlm::plot` |

On a real robot, the world is replaced by drivers (`Rangefinder`, motor PWM), and the same
navigator runs unchanged: on a Linux board with `--hw`, or compiled for a microcontroller.

```quiz
? Why did the naive controller dither in front of the pillar?
+ avoidance and goal-seeking alternated every tick with no committed mode
- the range sensor was broken
> A state machine commits to a manoeuvre.
? What role does the `always` envelope play in the capstone?
+ a last line of defence that zeroes forward drive when something is too close
- it steers around obstacles
> Behaviour lives in the machine; safety in the envelope.
```

:::exercise Your turn: parking
Using the same world (arena `4 x 2`, rover at `x: 0.3, y: 1.0`, **no pillar**), drive to the
goal `(3.0, 1.0)` and stop within `0.1 m` of it, using `r.distance_to`. Slow down as you
approach: `v = clamp(distance_in_metres, 0.15, 1.0)`. Print `parked` and whether there were
any bumps.

Expected: `parked 0`

```tulpa starter
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
```
```tulpa solution
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
let steps = 0
while r.distance_to(3.0, 1.0) > 0.1[m] and steps < 2000 {
    let v = clamp(r.distance_to(3.0, 1.0).in("m"), 0.15, 1.0)
    r.drive(v, v)
    w.step()
    steps += 1
}
r.stop()
print(if r.distance_to(3.0, 1.0) <= 0.1[m] { "parked" } else { "missed" }, r.bumps)
```
```expect
parked 0
```
```check
assert r.distance_to(3.0, 1.0) <= 0.1[m], "not parked at the goal"
```
```hint
Loop while `r.distance_to(3.0, 1.0) > 0.1[m]`; the goal is straight ahead, so equal wheel commands work.
---
Add a step limit so a mistake can't loop forever, and call `r.stop()` at the end.
:::

:::takeaways
- Make modes explicit (machine) and commit to manoeuvres; put safety in an `always` envelope.
- Fixed-rate `every!` loops + `std/world` let you develop controllers without hardware.
- The same navigator runs on real drivers on a board. Next: the Mastery Certification.
:::
