---
title: PID Control
minutes: 18
xp: 75
skill: systems
summary: Proportional, integral and derivative terms, limits and anti-windup, and tuning with live plots.
---
To hold a motor at a speed or an arm at an angle despite load and friction, you need
**feedback control**. The PID controller is the workhorse of industry: it computes an output
from the **error** between setpoint and measurement.

`u = Kp·e + Ki·∫e dt + Kd·de/dt`

| Term | Reacts to | Effect |
|---|---|---|
| P | the current error | pushes toward the target; alone, leaves a steady-state error |
| I | the accumulated error | removes steady-state error; too much causes overshoot |
| D | the error's rate of change | damps oscillation; amplifies noise |

## Tulpa's PID

```tulpa
let pid = PID::new(2.0, 0.5, 0.1)        # Kp, Ki, Kd
pid.set_limits(-12, 12)                  # actuator limits (volts)
let u = pid.update(100.0, 90.0, 0.01)    # setpoint, measured, dt in seconds
print("output", u, "integral", pid.integral())
```

## A simulated plant

To tune, you need something to control. This first-order motor model reaches 25 rpm per volt
with a time constant of 0.25 s:

```tulpa
fn simulate(kp, ki, kd, label) {
    let pid = PID::new(kp, ki, kd)
    pid.set_limits(-12, 12)
    let speed = 0.0
    let dt = 0.01
    for i in 0..250 {
        let v = pid.update(100.0, speed, dt)
        speed += (v * 25 - speed) * dt * 4
        tlm::plot(label, speed, i * dt)
    }
    speed
}
print(f"P only:  {simulate(0.08, 0.0, 0.0, "P"):.1f}")
print(f"PI:      {simulate(0.08, 0.6, 0.0, "PI"):.1f}")
print(f"PI hot:  {simulate(0.05, 6.0, 0.0, "PI aggressive"):.1f}")
```

Look at the plot: P alone settles short of 100 (steady-state error); PI reaches it cleanly;
the PI with a large integral gain overshoots to about 123 before settling. All three end
near 100 eventually, which is why you judge a controller by its *plot*, not its final value.

## Anti-windup

When the output is saturated at its limit, a naive integral keeps growing and later causes a
huge overshoot ("windup"). Tulpa's PID **stops integrating while saturated**:

```tulpa
let pid = PID::new(1.0, 5.0, 0.0)
pid.set_limits(-1, 1)
for i in 0..100 { pid.update(1000.0, 0.0, 0.01) }   # hopelessly saturated
print("integral stayed bounded:", pid.integral())
```

## Practical tuning recipe

1. Set `Ki = Kd = 0`. Raise `Kp` until the response is quick but starts to oscillate, then halve it.
2. Raise `Ki` until the steady-state error disappears fast enough without big overshoot.
3. Add a little `Kd` only if you need damping and the measurement is not noisy.
4. Always set output limits to what the actuator can really do.

## Units and dt

Pass `dt` in seconds as measured by your loop. With `every!`, the period is fixed, so `dt` is
constant: a 100 Hz loop uses `dt = 0.01`.

```tulpa
let pid = PID::new(0.08, 0.6, 0.0)
pid.set_limits(0, 12)
let rpm = 0.0
every!(10[ms], 300, {
    let v = pid.update(60.0, rpm, 0.01)
    rpm += (v * 25 - rpm) * 0.04
})
print(f"rpm after 3 s: {rpm:.1f}")
pid.reset()
print("after reset, integral =", pid.integral())
```

```quiz
? Which term removes steady-state error?
- P
+ I
- D
> The integral accumulates error until it is gone.
? What is integral windup?
+ the integral growing while the output is saturated, causing overshoot later
- the derivative amplifying noise
> Tulpa's PID pauses integration while saturated.
```

:::exercise Tune it
Using the motor model `speed += (v * 25 - speed) * 0.04` at `dt = 0.01` for 300 steps, choose
gains so that the final speed is within 1 of the setpoint `80` **and** the peak speed never
exceeds `88`. Print `ok` when both hold.

```tulpa starter
let pid = PID::new(0.5, 0.0, 0.0)
pid.set_limits(-12, 12)
let speed = 0.0
let peak = 0.0
for i in 0..300 {
    let v = pid.update(80.0, speed, 0.01)
    speed += (v * 25 - speed) * 0.04
    peak = max(peak, speed)
}
print(if abs(speed - 80) < 1 and peak <= 88 { "ok" } else { f"final {speed:.1f}, peak {peak:.1f}" })
```
```tulpa solution
let pid = PID::new(0.08, 0.6, 0.0)
pid.set_limits(-12, 12)
let speed = 0.0
let peak = 0.0
for i in 0..300 {
    let v = pid.update(80.0, speed, 0.01)
    speed += (v * 25 - speed) * 0.04
    peak = max(peak, speed)
}
print(if abs(speed - 80) < 1 and peak <= 88 { "ok" } else { f"final {speed:.1f}, peak {peak:.1f}" })
```
```expect
ok
```
```hint
Kp = 0.5 alone overshoots wildly and still leaves an error. Try a much smaller Kp (around 0.1) and add Ki.
---
The lesson's PI gains (0.08, 0.6) work well for this plant.
:::

:::takeaways
- `PID::new(kp, ki, kd)`, `update(setpoint, measured, dt)`, `set_limits`, `reset`, `integral`.
- P reacts, I removes steady-state error, D damps; limits and anti-windup matter.
- Tune on a simulated plant with `tlm::plot` before touching hardware.
:::
