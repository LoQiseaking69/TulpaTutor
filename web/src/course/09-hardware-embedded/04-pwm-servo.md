---
title: PWM and Servos
minutes: 14
xp: 65
skill: systems
summary: Duty cycle and frequency, motor speed control, servo pulses and angle limits.
---
Most actuators are driven by **PWM** (pulse-width modulation): a square wave whose **duty
cycle** (fraction of time high) controls power. A motor driver turns duty into speed; a hobby
servo reads the **pulse width** as an angle.

## PWM channels

```tulpa
let pwm = PWM::new(0, 1)          # /sys/class/pwm/pwmchip0/pwm1
pwm.frequency(20[kHz])            # above hearing range for motors
pwm.duty(0.25)                    # 25 %
pwm.enable()
print(pwm.state())
```

The state is in nanoseconds: 20 kHz is a 50,000 ns period, 25 % of it high.

## Speed control

Map a speed command to duty, clamped, with a minimum below which the motor stalls:

```tulpa
let motor = PWM::new(0, 0)
motor.frequency(20[kHz])
motor.enable()
fn set_speed(fraction) {
    let f = clamp(fraction, 0.0, 1.0)
    let duty = if f < 0.05 { 0.0 } else { 0.15 + f * 0.85 }   # deadband + offset
    motor.duty(duty)
    duty
}
for s in [0.0, 0.02, 0.5, 1.0, 1.4] { print(s, "->", round(set_speed(s), 3)) }
```

## Servos

A standard servo expects a pulse every 20 ms: 1.0 ms is one end, 2.0 ms the other, 1.5 ms
centre (exact values vary). `Servo` handles the maths:

```tulpa
let s = Servo::new(0, 0)          # chip, channel; min 500 us, max 2500 us, 180 deg range
s.angle(45[deg])
print(s.angle(), s.pulse_us(), "us")
s.center()
print(s.angle(), s.pulse_us(), "us")
s.angle(1.0[rad])
print(s.angle(), s.pulse_us(), "us")
```

Angles accept any angle unit, or a plain number in degrees.

## Limits are enforced

Out-of-range angles are errors, not twitching hardware:

```tulpa error
let s = Servo::new(0, 0)
s.angle(200[deg])
```

Combine with a struct invariant for the *mechanical* limit, which is often tighter than the
servo's electrical range:

```tulpa
struct Wrist {
    servo = nil
    angle = 90[deg]
    invariant 20[deg] <= self.angle and self.angle <= 160[deg]
    fn init(self) { self.servo = Servo::new(0, 3) }
    fn move_to(self, a) { self.angle = a; self.servo.angle(a) }
}
let w = Wrist()
w.move_to(120[deg])
try { w.move_to(170[deg]) } catch e { print("blocked by invariant") }
print(w.angle, w.servo.angle())
```

The invariant rolls back `angle` **and** the servo was never commanded, because the field
write failed first.

## Sweeping smoothly

Jumping straight to a target jerks the mechanism. Step towards it at a fixed rate:

```tulpa
let s = Servo::new(0, 0)
s.angle(0[deg])
let target = 90[deg]
every!(20[ms], {
    let cur = s.angle()
    if cur >= target { break }
    s.angle(min(cur + 3[deg], target))
    tlm::plot("angle", s.angle().in("deg"), millis() / 1000.0)
})
print("reached", s.angle(), "at", millis(), "ms")
```

```quiz
? A 1 kHz PWM at duty 0.25 is high for how long each period?
+ 250 µs
- 25 ms
- 0.25 µs
> Period 1 ms × 0.25.
? What does `Servo::new(0,0).center()` command?
+ 90 degrees (1500 µs)
- 0 degrees
> Centre of the 0..180 range.
```

:::exercise Pan-tilt
Create `pan = Servo::new(0, 0)` and `tilt = Servo::new(0, 1)`. Write `fn look(p, t)` that
sets both angles. Call `look(30[deg], 120[deg])` and print both pulse widths in µs.

Expected: `833.333 1833.333`

```tulpa starter
let pan = Servo::new(0, 0)
let tilt = Servo::new(0, 1)
```
```tulpa solution
let pan = Servo::new(0, 0)
let tilt = Servo::new(0, 1)
fn look(p, t) { pan.angle(p); tilt.angle(t) }
look(30[deg], 120[deg])
print(pan.pulse_us(), tilt.pulse_us())
```
```expect
833.333 1833.333
```
```hint
500 µs + angle/180 × 2000 µs: 30° → 833.3 µs.
:::

:::takeaways
- `PWM::new(chip, ch)`: `frequency duty pulse enable disable state`; `sim::pwm` inspects it.
- `Servo::new(chip, ch)`: `angle(a) center() pulse_us()`; out-of-range angles are errors.
- Add invariants for mechanical limits; ramp with `every!` instead of jumping.
:::
