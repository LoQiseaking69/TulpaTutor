---
title: Reactive Rules with when
minutes: 14
xp: 65
skill: programming
summary: Edge-triggered rules that react to signals, variables, devices and machines.
---
Control code is full of "whenever X becomes true, do Y". Polling for it by hand is
error-prone: you forget a check, or you fire the action on every loop instead of once.
Tulpa's `when` rule handles it declaratively.

## A first rule

```tulpa
let temp = signal(300)
let fan = GPIO::new(5)
when temp.get() > 320 {
    fan.set_high()
    print("fan ON at", temp.get())
} else {
    fan.set_low()
    print("fan OFF at", temp.get())
}
for t in [305, 322, 330, 318, 301, 325] { temp.set(t) }
```

Read the output carefully: the fan switches on **once** when the temperature crosses 320, and
off once when it drops back. Setting 330 while already hot does nothing.

## Edge-triggered

That is what **edge-triggered** means: the body runs when the condition goes from false to
true (a rising edge). The optional `else` runs when it goes back to false (a falling edge).
This is exactly the behaviour you want for alarms, relays and notifications.

## When are rules checked?

A rule is re-evaluated:

- when it is registered,
- after every signal change, **variable assignment**, device call and state-machine
  transition,
- on every `every!` tick.

So rules can watch plain variables too:

```tulpa
let battery = 80
when battery < 20 { print("LOW BATTERY: returning to dock") }
for b in [60, 40, 25, 19, 15, 12] { battery = b }
print("final", battery)
```

The warning prints once, at 19, not again at 15 and 12.

## Rules and machines together

Rules are the glue between sensors and state machines:

```tulpa
let distance = signal(2.0)
machine Drive {
    state Cruise { on obstacle => Stopped { print("  braking") } }
    state Stopped { on clear => Cruise { print("  resuming") } }
}
let d = Drive()
when distance.get() < 0.5 { d.obstacle() } else { d.clear() }
for x in [1.5, 0.8, 0.4, 0.3, 0.9, 2.0] {
    distance.set(x)
    print(x, "->", d.state)
}
```

The machine stays a clean description of modes; the rule says what moves it.

## Runaway rules

If rules keep triggering each other for 100 rounds, Tulpa stops with an error instead of
looping forever. Keep rule bodies small, and avoid rules that undo each other's conditions.

:::tip Hysteresis
Using one threshold for on and off makes a relay chatter around it. Use two: turn on above
322, off below 318, with two rules or a guard.
:::

```quiz
? A rule `when x > 10 { ... }` is registered while x = 5. x is then set to 12, 15, 9, 11. How many times does the body run?
- 1
+ 2
- 4
> Rising edges at 12 and at 11 (after dropping to 9).
? Which of these does NOT cause rules to be re-checked?
- assigning a variable
- a signal set
+ reading a variable
> Rules re-check after changes, not reads.
```

:::exercise Overspeed alarm
Write a `when` rule on the variable `speed` that prints `ALARM <speed>` when speed rises above
2, and `normal` when it falls back. Then set `speed` to `1, 2.5, 3, 1.5, 2.2` in a loop.

Expected:
```
ALARM 2.5
normal
ALARM 2.2
```

```tulpa starter
let speed = 0
# rule here
for s in [1, 2.5, 3, 1.5, 2.2] { speed = s }
```
```tulpa solution
let speed = 0
when speed > 2 { print("ALARM", speed) } else { print("normal") }
for s in [1, 2.5, 3, 1.5, 2.2] { speed = s }
```
```expect
ALARM 2.5
normal
ALARM 2.2
```
```hint
`when speed > 2 { print("ALARM", speed) } else { print("normal") }`, before the loop.
:::

:::takeaways
- `when cond { } else { }` is edge-triggered: body on rising edge, else on falling edge.
- Re-checked after signal sets, assignments, device calls, transitions and `every!` ticks.
- Rules connect sensors to machines; use two thresholds for hysteresis.
:::
