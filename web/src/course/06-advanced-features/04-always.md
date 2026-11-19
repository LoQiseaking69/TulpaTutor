---
title: Safety Envelopes with always
minutes: 14
xp: 65
skill: programming
summary: Invariants over the whole program: fail-stop monitors and corrective handlers.
---
Some properties must hold **at all times**: the heater is never on while the fan is off; the
arm never moves while the cage door is open; speed never exceeds the limit. Tulpa states these
as **safety envelopes** with `always`.

## Fail-stop

With no `else`, a violated envelope stops the program with an error naming the clause:

```tulpa error
let heater = GPIO::new(20)
let fan = GPIO::new(21)
always not (heater.read() == 1 and fan.read() == 0)

fan.set_high()
heater.set_high()     # fine: fan is on
print("heating with fan on")
fan.set_low()         # violation!
print("never reached")
```

Fail-stop is right when continuing would be dangerous and a supervisor (or a watchdog) will
take over.

## Corrective handlers

With an `else`, the handler runs **once per violation** and re-arms when the condition holds
again. Use it to clamp, stop or switch to a safe state:

```tulpa
let speed = 0.0
let events = []
always speed <= 2.0 else {
    speed = 2.0
    events.push("clamped")
}
for s in [1.0, 1.8, 3.5, 1.2, 2.7] {
    speed = s
    print("commanded", s, "-> actual", speed)
}
print(events)
```

## Monitors run after the action

An envelope is checked at the same points as `when` rules: **after** the change that broke
it. So the handler must undo or contain the damage, as the clamp above does. On real
hardware, put the e-stop in the handler.

## Watching machines

Envelopes can watch states too, catching logic bugs in a controller:

```tulpa
let door_open = false
machine Arm {
    state Parked { on move => Moving }
    state Moving { on park => Parked }
}
let arm = Arm()
let stops = 0
always not (door_open and arm.is("Moving")) else {
    arm.park()
    stops += 1
    print("SAFETY: door opened while moving, arm parked")
}
arm.move()
door_open = true
print(arm.state, "stops:", stops)
```

## Defence in depth

Envelopes do not replace careful code: they are the last line of defence that catches what
everything else missed. Combined with contracts (proved by `tulpa prove` on a computer) and
contract fuzzing (next lesson), they give you layered safety.

```quiz
? What happens when an `always` with no `else` is violated?
+ The program stops with an error naming the clause
- A warning is printed and execution continues
- The violating assignment is ignored
> Fail-stop.
? With an `else`, how often does the handler run during one continuous violation?
+ once, then it re-arms when the condition holds again
- on every check while violated
> Once per violation.
```

:::exercise Battery guard
Write `always battery >= 10 else { ... }` whose handler sets `mode = "dock"` and prints
`docking at <battery>`. Then set `battery` to `50, 30, 9, 8, 40, 5` in a loop and finally
print `mode`.

Expected:
```
docking at 9
docking at 5
dock
```

```tulpa starter
let battery = 100
let mode = "work"
for b in [50, 30, 9, 8, 40, 5] { battery = b }
print(mode)
```
```tulpa solution
let battery = 100
let mode = "work"
always battery >= 10 else { mode = "dock"; print("docking at", battery) }
for b in [50, 30, 9, 8, 40, 5] { battery = b }
print(mode)
```
```expect
docking at 9
docking at 5
dock
```
```hint
Register the envelope before the loop. It fires at 9, stays quiet at 8 (same violation), re-arms at 40, fires again at 5.
:::

:::takeaways
- `always cond` is fail-stop; `always cond else { }` corrects once per violation.
- Checked after changes (like `when`), so handlers must contain the damage.
- Envelopes are the last line of defence alongside contracts and fuzzing.
:::
