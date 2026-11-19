---
title: Advanced State Machines
minutes: 16
xp: 70
skill: programming
summary: Parameters, guards, event arguments, global and internal transitions, restart.
---
Module 5 introduced machines. Real controllers need more: per-instance data, conditions,
events carrying values, and emergency transitions that apply everywhere.

## Parameters: per-instance variables

Machine parameters become variables each instance owns, set by keyword at construction:

```tulpa
machine Pump(rate = 1, max_rate = 5) {
    state Off { on start => On }
    state On { on stop => Off }
}
let a = Pump()
let b = Pump(rate: 3, max_rate: 10)
print(a.rate, b.rate, b.max_rate)
```

## Guards

`on event if condition => Target` only fires when the guard holds. Otherwise the event is
ignored (and `send` returns `false`):

```tulpa
machine Door(locked = false) {
    state Closed {
        on open if not locked => Open
        on lock => Closed { locked = true }
    }
    state Open { on close => Closed }
}
let d = Door()
d.lock()
print("open while locked:", d.open(), d.state)
```

## Event arguments

Events can carry values that bind to declared parameters, available to guards and actions:

```tulpa
machine Keypad(attempts = 0) {
    state Locked {
        on code(c) if c == 4321 => Unlocked { print("  welcome") }
        on code(c) { attempts += 1; print("  wrong code", c) }
    }
    state Unlocked { on lock => Locked }
}
let k = Keypad()
k.code(1111)
k.code(4321)
print(k.state, "after", k.attempts, "wrong attempt(s)")
```

Transitions are tried **in order**: the guarded one first, then the fallback. The second
`on code(c)` has no target: it is an **internal transition** that runs its action without
leaving the state (no exit/enter).

## Global transitions

An `on` at machine level applies in every state. That is the natural place for an
emergency stop:

```tulpa
machine Robot {
    on estop => Halted { print("  E-STOP from", "any state") }
    state Idle { on go => Working }
    state Working { on done => Idle }
    state Halted { on reset => Idle }
}
let r = Robot()
r.go()
r.estop()
print(r.state)
r.reset()
print(r.history)
```

State transitions are tried first, then globals.

## Introspection and restart

```tulpa
machine M {
    state A { on next => B }
    state B { on next => C }
    state C { }
}
let m = M()
m.next(); m.next()
print(m.state, m.history, m.can("next"), m.events())
m.restart()
print(m.state, m.history)
print(M.mermaid())
```

`events()` lists what the current state accepts, `can(e)` asks about one event, `restart()`
returns to the initial state, and `mermaid()` exports a diagram. In the Playground's
**Machines** tab you see it drawn.

```quiz
? Which transition fires for `k.code(4321)` in the Keypad above?
+ the guarded one, because it is listed first and its guard holds
- the internal one, because it has no target
> First matching transition in order wins.
? What does an `on` written at machine level (outside any state) do?
- it runs once at startup
+ it applies in every state
> Global transitions, perfect for e-stops.
```

:::exercise Elevator
Write `machine Lift(floor = 0)` with states `Idle` and `Moving`:
- In `Idle`: `on call(f) if f != floor => Moving { floor = f }`
- In `Moving`: `on arrive => Idle`
- Global: `on fault => Idle`

Then: `call(0)` (ignored), `call(3)`, print state and floor, `arrive()`, print state.

Expected:
```
Moving 3
Idle
```

```tulpa starter
machine Lift(floor = 0) {
    state Idle { }
    state Moving { }
}
let l = Lift()
```
```tulpa solution
machine Lift(floor = 0) {
    on fault => Idle
    state Idle { on call(f) if f != floor => Moving { floor = f } }
    state Moving { on arrive => Idle }
}
let l = Lift()
l.call(0)
l.call(3)
print(l.state, l.floor)
l.arrive()
print(l.state)
```
```expect
Moving 3
Idle
```
```check
l.call(5)
l.fault()
assert_eq!(l.state, "Idle")
assert_eq!(l.floor, 5)
```
```hint
Event arguments: `on call(f) if f != floor => Moving { floor = f }`.
---
The global `on fault => Idle` goes directly inside `machine Lift(...) { }`, outside the states.
:::

:::takeaways
- `machine M(p = 1)` parameters are per-instance; set them by keyword.
- Guards `on e if c => S`, event args `on e(x)`, internal transitions (no target).
- Machine-level `on` is global (e-stops); `restart events can mermaid()`.
:::
