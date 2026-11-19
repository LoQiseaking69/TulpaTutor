---
title: Kinematics
minutes: 16
xp: 70
skill: robotics
summary: Motion equations, projectiles, and forward and inverse kinematics of a two-link arm.
---
**Kinematics** describes motion without worrying about forces: where something is, how fast
it moves, and how joint angles map to positions. Tulpa's built-in `kin::` module covers the
common cases.

## Motion with constant acceleration

```tulpa
let v0 = 0.0      # m/s
let a = 2.0       # m/s^2
let t = 3.0       # s
print("v =", kin::velocity(v0, a, t), "m/s")
print("x =", kin::position(0.0, v0, a, t), "m")
print("a =", kin::acceleration(6.0, 3.0), "m/s^2 for a 6 m/s change in 3 s")
```

These are `v = v0 + a·t` and `x = x0 + v0·t + ½a·t²`. The same maths with units, written by
hand, catches mistakes:

```tulpa
let a = 2.0[m/s^2]
let t = 3[s]
let x = 0.5 * a * t ** 2
print(x, "after", t)
print("stopping distance at 2 m/s, 4 m/s^2:", (2[m/s]) ** 2 / (2 * 4[m/s^2]))
```

## Projectiles

Launching a ball (or a ball-throwing robot) at speed `v` and angle `θ` degrees:

```tulpa
let v = 12.0
for deg in [15, 30, 45, 60, 75] {
    println!("{:>3} deg: range {:5.2} m, peak {:4.2} m, flight {:4.2} s",
        deg, kin::range(v, deg), kin::max_height(v, deg), kin::time_of_flight(v, deg))
}
```

45° gives the longest range, and complementary angles (30/60) land at the same spot.

## Forward kinematics: angles to position

A planar arm with links `l1` and `l2` and joint angles `θ1` (shoulder) and `θ2` (elbow,
relative to the first link). `kin::fk2` returns the end-effector `[x, y]`:

```tulpa
let l1 = 0.30
let l2 = 0.25
for pose in [[0, 0], [90, 0], [45, 45], [30, 90]] {
    let p = kin::fk2(l1, l2, pose[0], pose[1])
    println!("shoulder {:>3}, elbow {:>3} -> ({:.3}, {:.3})", pose[0], pose[1], p[0], p[1])
}
```

Under the hood: `x = l1·cos θ1 + l2·cos(θ1+θ2)`, `y = l1·sin θ1 + l2·sin(θ1+θ2)`.

## Inverse kinematics: position to angles

The useful direction is the reverse: "put the gripper at (0.40, 0.20), which angles?"
`kin::ik2` solves it (elbow-down by default, `elbow_up: true` for the other solution):

```tulpa
let l1 = 0.30
let l2 = 0.25
let target = [0.40, 0.20]
let down = kin::ik2(l1, l2, target[0], target[1])
let up = kin::ik2(l1, l2, target[0], target[1], true)
print("elbow down:", down.map(|a| round(a, 2)))
print("elbow up:  ", up.map(|a| round(a, 2)))
let check = kin::fk2(l1, l2, down[0], down[1])
print("fk check:  ", check.map(|v| round(v, 4)))
```

Running FK on the IK answer gets the target back: that round trip is how you test kinematics.

## Reachability

A point is reachable only if its distance from the shoulder is between `|l1 - l2|` and
`l1 + l2`. Check before asking IK:

```tulpa
fn reachable(l1, l2, x, y) {
    let d = hypot(x, y)
    abs(l1 - l2) <= d and d <= l1 + l2
}
print(reachable(0.30, 0.25, 0.40, 0.20), reachable(0.30, 0.25, 0.60, 0.10), reachable(0.30, 0.25, 0.02, 0.0))
```

```quiz
? What does forward kinematics compute?
+ the end-effector position from joint angles
- joint angles from a target position
> FK: angles to position; IK: position to angles.
? A 2-link arm has links 0.3 m and 0.2 m. Which distance is unreachable?
- 0.15 m
- 0.45 m
+ 0.6 m
> The reach is between 0.1 m and 0.5 m.
```

:::exercise Pick-and-place angles
For an arm with `l1 = 0.35`, `l2 = 0.30`, write `fn plan(x, y)` that returns `nil` if the
point is unreachable, otherwise the elbow-down angles rounded to 1 decimal. Print
`plan(0.5, 0.2)` and `plan(0.8, 0.3)`.

Expected: `[-9.4, 68.3] nil`

```tulpa starter
let l1 = 0.35
let l2 = 0.30
fn plan(x, y) {
    nil
}
print(plan(0.5, 0.2), plan(0.8, 0.3))
```
```tulpa solution
let l1 = 0.35
let l2 = 0.30
fn plan(x, y) {
    let d = hypot(x, y)
    if d > l1 + l2 or d < abs(l1 - l2) { return nil }
    kin::ik2(l1, l2, x, y).map(|a| round(a, 1))
}
print(plan(0.5, 0.2), plan(0.8, 0.3))
```
```expect
[-9.4, 68.3] nil
```
```hint
Check reachability with `hypot(x, y)` against `l1 + l2` and `abs(l1 - l2)` first.
---
Then `kin::ik2(l1, l2, x, y)` and round each angle with `.map(|a| round(a, 1))`.
:::

:::takeaways
- `kin::velocity position acceleration range max_height time_of_flight`.
- `kin::fk2(l1, l2, θ1, θ2)` → `[x, y]`; `kin::ik2(l1, l2, x, y, elbow_up)` → `[θ1, θ2]` (degrees).
- Test IK with an FK round trip; check reachability first.
:::
