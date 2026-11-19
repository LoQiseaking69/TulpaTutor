---
title: Sensor Filtering and Fusion
minutes: 18
xp: 75
skill: robotics
summary: Moving average, exponential low-pass, median for spikes, and a complementary filter fusing gyro and accelerometer.
---
Real sensors are noisy, spiky and drift. Before a robot can act on a reading, it must
**filter** it, and often **fuse** several sensors whose strengths complement each other.

Throughout this lesson, the "noise" is generated deterministically from sines so that results
are reproducible. Watch the live plots.

## Moving average

Average the last `n` samples. Signals have it built in as `avg(n)`:

```tulpa
let raw = signal(0.0)
for i in 0..120 {
    let t = i * 0.05
    let true_v = 1.0 + 0.5 * sin(t)
    let noise = 0.3 * sin(i * 7.3) + 0.2 * sin(i * 13.1)
    raw.set(true_v + noise)
    tlm::plot("raw", raw.get(), t)
    tlm::plot("avg(8)", raw.avg(8), t)
}
print("done")
```

Smoother, but notice the **lag**: an n-sample average delays the signal by about n/2 samples.

## Exponential low-pass

One multiply per sample and no buffer: `y = y + α·(x − y)`. Small `α` is smoother but slower:

```tulpa
fn low_pass(alpha) {
    let y = nil
    let step = |x| { y = if y == nil { x } else { y + alpha * (x - y) }; y }
    step
}
let f = low_pass(0.15)
for i in 0..120 {
    let t = i * 0.05
    let x = 1.0 + 0.5 * sin(t) + 0.3 * sin(i * 7.3)
    tlm::plot("raw", x, t)
    tlm::plot("low-pass", f(x), t)
}
print("done")
```

## Median against spikes

A single wild reading (a sonar echo off a wall corner) drags averages far off. A **median**
ignores it:

```tulpa
fn median(xs) { let s = xs.sorted(); s[len(s) / 2] }
let window = [0.51, 0.50, 3.90, 0.52, 0.49]
print("mean:", round(window.sum() / len(window), 3), " median:", median(window))
```

## Fusion: the complementary filter

To estimate a tilt angle:

- the **gyro** measures angular rate. Integrating it is smooth and fast but **drifts**.
- the **accelerometer** gives an absolute angle from gravity, but it is **noisy** and
  disturbed by motion.

The complementary filter trusts the gyro in the short term and the accelerometer in the long
term: `θ = k·(θ + ω·dt) + (1 − k)·θ_accel`.

```tulpa
let dt = 0.01
let k = 0.98
let fused = 0.0
let gyro_only = 0.0
for i in 0..400 {
    let t = i * dt
    let truth = 20 * sin(t * 1.5)                       # degrees
    let rate = 30 * cos(t * 1.5) + 2.0                  # deg/s, with a +2 deg/s bias
    let accel = truth + 4 * sin(i * 5.7)                # noisy absolute angle
    gyro_only += rate * dt
    fused = k * (fused + rate * dt) + (1 - k) * accel
    tlm::plot("truth", truth, t)
    tlm::plot("gyro only", gyro_only, t)
    tlm::plot("fused", fused, t)
}
println!("after 4 s: gyro-only error {:.1} deg, fused error {:.1} deg",
    gyro_only - 20 * sin(6.0), fused - 20 * sin(6.0))
```

The gyro-only estimate drifts away by the integrated bias; the fused one stays on the truth.
This exact filter keeps countless balancing robots upright.

:::deep Beyond
Kalman filters generalise this by weighting each sensor by its estimated uncertainty, and
handle many states at once. The complementary filter is the intuition behind them.
:::

```quiz
? Why fuse gyro and accelerometer instead of using one?
+ the gyro drifts over time; the accelerometer is noisy in the short term
- two sensors are always better than one
> Each covers the other's weakness.
? Which filter best rejects a single wild spike?
- moving average
+ median
- low-pass with α = 0.9
> The median ignores outliers.
```

:::exercise Exponential moving average
Write `fn ema(xs, alpha)` that returns the filtered list, starting from the first sample
(`y0 = xs[0]`). Print `ema([10, 10, 20, 20, 20], 0.5)`.

Expected: `[10, 10.0, 15.0, 17.5, 18.75]`

```tulpa starter
fn ema(xs, alpha) {
    xs
}
print(ema([10, 10, 20, 20, 20], 0.5))
```
```tulpa solution
fn ema(xs, alpha) {
    let out = [xs[0]]
    let y = xs[0]
    for i in 1..len(xs) {
        y = y + alpha * (xs[i] - y)
        out.push(y)
    }
    out
}
print(ema([10, 10, 20, 20, 20], 0.5))
```
```expect
[10, 10.0, 15.0, 17.5, 18.75]
```
```hint
Start with `let y = xs[0]` and `out = [xs[0]]`, then for each later sample `y = y + alpha * (x - y)`.
:::

:::takeaways
- Moving average (`signal.avg(n)`) smooths with lag; exponential low-pass needs no buffer; median kills spikes.
- Complementary filter: `θ = k(θ + ω·dt) + (1−k)·θ_accel` fuses drifting gyro with noisy accel.
- Plot filters with `tlm::plot` to see lag and noise trade-offs.
:::
