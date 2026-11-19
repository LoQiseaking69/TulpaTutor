---
title: Timing Rules: Debounce and Deadlines
minutes: 16
xp: 70
skill: systems
summary: when ... for durations, after ... within ... ensure deadlines, and testing them with sim inputs.
---
Two timing requirements appear in almost every embedded system: "only react if the condition
**holds** for a while" (debounce) and "this must **respond** within a time limit" (deadline).
Tulpa has a construct for each.

## Debounce: when ... for

`when cond for D { }` fires once the condition has held **continuously** for `D`. If it drops
earlier, the timer resets:

```tulpa
let button = GPIO::new(4, "in")
when button.read() == 1 for 25[ms] { print("press accepted at", millis(), "ms") }

sim::gpio_input(4, 1); sleep(0.010)    # 10 ms bounce: ignored
sim::gpio_input(4, 0); sleep(0.050)
sim::gpio_input(4, 1); sleep(0.050)    # a real press
print("done at", millis())
```

`sim::gpio_input(pin, level)` drives a simulated input pin, the way a finger would.

## Sustained conditions

The same construct handles "too hot for too long", with `else` for recovery:

```tulpa
let temp = signal(300)
when temp.get() > 350 for 2[s] { print("OVERHEAT alarm at", millis()) } else { print("cleared at", millis()) }
temp.set(360); sleep(1)       # brief spike: no alarm
temp.set(300); sleep(1)
temp.set(365); sleep(3)       # sustained: alarm after 2 s
temp.set(320); sleep(0.1)
```

## Deadlines: after ... within ... ensure

`after trigger within D ensure response else { handler }` arms on each rising edge of
`trigger`. If `response` becomes true in time, all is well; if `D` passes first, the handler
runs:

```tulpa
let motor = GPIO::new(23)
let at_limit = signal(false)
after motor.read() == 1 within 300[ms] ensure at_limit.get() else {
    motor.set_low()
    print("limit switch not reached in time: motor stopped at", millis(), "ms")
}
motor.set_high()
sleep(0.5)
print("motor =", motor.read())
```

And when the response arrives in time:

```tulpa
let motor = GPIO::new(23)
let at_limit = signal(false)
after motor.read() == 1 within 300[ms] ensure at_limit.get() else { motor.set_low(); print("timeout") }
motor.set_high()
sleep(0.2)
at_limit.set(true)
sleep(0.5)
print("motor still running:", motor.read())
```

With no `else`, a missed deadline stops the program with a `deadline missed` error:

```tulpa error
let req = signal(false)
let ack = signal(false)
after req.get() within 100[ms] ensure ack.get()
req.set(true)
sleep(0.2)
```

## How it works

When a timing rule exists, sleeps are sliced and rules re-checked every 2 ms (1 ms steps on
the virtual clock). `sim::gpio_input`, `sim::i2c_set` and `sim::uart_feed` count as external
events, so rules see them immediately. On the virtual clock all of this is deterministic: the
debounce above fires at exactly the same millisecond every run.

```quiz
? A button reads 1 for 15 ms, 0 for 5 ms, then 1 for 30 ms. With `when ... for 25[ms]`, when does it fire?
- after the first 15 ms
+ 25 ms into the second press
- never
> The timer resets when the condition drops.
? What happens if an `after ... within` deadline passes with no `else`?
+ the program stops with a deadline missed error
- nothing
> Fail-stop by default.
```

:::exercise Long press
A button on pin 7. Write a rule that prints `long press` when it is held for **1 s**. Then
simulate: press for 0.4 s, release for 0.2 s, press for 1.5 s. Print `millis()` at the end.

Expected:
```
long press
2100
```

```tulpa starter
let btn = GPIO::new(7, "in")
```
```tulpa solution
let btn = GPIO::new(7, "in")
when btn.read() == 1 for 1[s] { print("long press") }
sim::gpio_input(7, 1); sleep(0.4)
sim::gpio_input(7, 0); sleep(0.2)
sim::gpio_input(7, 1); sleep(1.5)
print(millis())
```
```expect
long press
2100
```
```hint
`when btn.read() == 1 for 1[s] { print("long press") }`, then drive the pin with `sim::gpio_input(7, level)` and `sleep`.
:::

:::takeaways
- `when cond for D {} else {}` fires after the condition holds for D (debounce, sustained alarms).
- `after trig within D ensure resp else {}` enforces response deadlines; no else = fail-stop.
- `sim::gpio_input` etc. drive simulated inputs; virtual time makes timing tests deterministic.
:::
