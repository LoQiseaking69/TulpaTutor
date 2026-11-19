---
title: Fixed-Rate Loops with every!
minutes: 14
xp: 65
skill: systems
summary: Drift-free periodic loops, bounded tick counts, break, and building a control loop.
---
Control loops must run at a **fixed rate**: a PID at 100 Hz, telemetry at 10 Hz. A naive
`loop { work(); sleep(0.01) }` drifts, because the work itself takes time. `every!` does not.

## The basic form

```tulpa
let n = every!(100[ms], 5, {
    print("tick at", millis(), "ms")
})
print("ran", n, "ticks")
```

`every!(period, count, { body })` runs `count` ticks; `every!(period, { body })` runs until
`break`. It returns the number of ticks. The first tick runs immediately, and a counted loop
returns one period after its last tick (500 ms here), so back-to-back loops keep the cadence.

## No drift, no catch-up

`every!` schedules ticks on a fixed cadence, not "sleep after the body", so it **does not
drift**. If a body overruns its period, the missed ticks are **skipped**, not replayed in a
burst: the loop runs the next tick right away and continues on a fresh cadence from there.
That is what you want for control. Below, the slow first tick swallows the ticks due at 100
and 200 ms:

```tulpa
let n = every!(100[ms], 6, {
    if millis() % 300 == 0 { sleep(0.25) }   # an occasional slow tick
    print("tick", millis())
})
print("ticks:", n)
```

## Breaking out

```tulpa
let position = 0.0
let ticks = every!(20[ms], {
    position += 0.05
    if position >= 0.3 { break }
})
print(f"reached {position:.2f} after {ticks} ticks at {millis()} ms")
```

## A real control loop

A proportional controller holding a motor at a target speed, at 50 Hz, plotted live:

```tulpa
let speed = 0.0
let target = 80.0
let kp = 0.08
every!(20[ms], 100, {
    let u = clamp(kp * (target - speed), 0.0, 1.0)   # duty cycle
    speed += (u * 120 - speed) * 0.1                  # motor model
    tlm::plot("speed", speed, millis() / 1000.0)
    tlm::plot("target", target, millis() / 1000.0)
    if millis() == 1000 { target = 50.0 }
})
print(f"final speed {speed:.1f}")
```

Notice the steady-state error: a pure P controller settles below the target. Module 9's `PID`
adds the integral term that removes it.

## every! re-checks rules

Each tick re-evaluates `when` rules and `always` envelopes, so periodic code and reactive
rules work together:

```tulpa
let temp = 300
let alarms = 0
when temp > 330 { alarms += 1 }
every!(1[s], 10, { temp += 5 })
print("temp", temp, "alarms", alarms)
```

```quiz
? A body occasionally takes longer than the period. What does every! do?
- runs the missed ticks immediately to catch up
+ skips the missed ticks and continues on schedule
> No catch-up bursts: safer for control.
? What does `every!(10[ms], 5, { })` return?
+ the tick count, 5
- nil
> every! returns the number of ticks.
```

:::exercise Blink pattern
Using `every!` with a 250 ms period and 8 ticks, toggle `led = GPIO::new(13)` each tick and
count how many ticks left the LED on. Print the count and `millis()` after the loop.

Expected: `4 2000`

```tulpa starter
let led = GPIO::new(13)
let on_ticks = 0
```
```tulpa solution
let led = GPIO::new(13)
let on_ticks = 0
every!(250[ms], 8, {
    led.toggle()
    if led.read() == 1 { on_ticks += 1 }
})
print(on_ticks, millis())
```
```expect
4 2000
```
```hint
The first tick runs immediately (at 0 ms) and the last at 7 × 250 = 1750 ms; a counted `every!` then waits out that final period, so it returns at 2000 ms.
:::

:::takeaways
- `every!(period, n, {})` / `every!(period, {})` with `break`; returns tick count.
- Drift-free; overruns skip ticks instead of bursting.
- Ticks re-check `when` and `always`; use `tlm::plot` to watch loops live.
:::
