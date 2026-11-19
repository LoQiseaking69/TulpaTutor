---
title: Your First State Machine
minutes: 16
xp: 70
skill: programming
summary: machine, states, events, transitions, enter/exit actions and the machine inspector.
---
Most robot behaviour is **modal**: a door is open or closed, a robot is idle, driving or
faulted. Tracking modes with flags (`is_open`, `is_locked`, ...) quickly gets messy and
allows impossible combinations. A **state machine** makes the modes explicit, and Tulpa has
them built in.

## Defining a machine

```tulpa
machine Light {
    state Off {
        on press => On
    }
    state On {
        on press => Off
    }
}
let l = Light()
print(l.state)
l.press()
print(l.state)
l.press()
print(l.state)
```

The first state is the initial state. `on press => On` means: in this state, the event
`press` moves to `On`. Sending an event is a method call: `l.press()`, or `l.send("press")`.

## Events that do not apply

If the current state has no transition for an event, nothing happens and `send` returns
`false`:

```tulpa
machine Door {
    state Closed { on open => Open }
    state Open { on close => Closed }
}
let d = Door()
print(d.send("close"))     # already closed: no transition
print(d.send("open"), d.state)
```

## enter and exit actions

`enter { }` runs when a state is entered, `exit { }` when it is left. A transition can have
its own action block, which runs between exit and enter:

```tulpa
machine Door {
    state Closed {
        enter { print("  [closed]") }
        on open => Open { print("  creak...") }
    }
    state Open {
        enter { print("  [open]") }
        exit { print("  leaving Open") }
        on close => Closed
    }
}
let d = Door()
print("open:")
d.open()
print("close:")
d.close()
```

## Inspecting a machine

```tulpa
machine Door {
    state Closed { on open => Open }
    state Open { on close => Closed }
}
let d = Door()
d.open(); d.close(); d.open()
print(d.state, d.is("Open"), d.can("open"), d.events())
print(d.history)
```

Run this in **Explore → Playground** and open the **Machines** tab to see the diagram drawn
from your code. `Door.mermaid()` prints the same diagram as Mermaid source.

## Driving hardware from states

States are where actions belong. Here the motor pin follows the machine:

```tulpa
let motor = GPIO::new(23)
machine Conveyor {
    state Stopped {
        enter { motor.set_low() }
        on start => Running
    }
    state Running {
        enter { motor.set_high() }
        on stop => Stopped
        on jam => Stopped { print("JAM detected") }
    }
}
let c = Conveyor()
c.start(); print(c.state, "motor =", motor.read())
c.jam();   print(c.state, "motor =", motor.read())
```

A transition to a state that does not exist is a **syntax error**, caught before the
program runs. Module 6 adds guards, event arguments, global transitions and parameters.

```quiz
? Which state does a new machine start in?
+ the first state defined
- a state named Init
- none until an event is sent
> The first `state` is initial.
? What does `m.send("x")` return when no transition matches?
- an error
+ `false`
> Unhandled events are ignored and `send` returns false.
```

:::exercise Traffic light
Define `machine Traffic` with states `Red`, `Green`, `Yellow` (initial `Red`) and an event
`next` that cycles Red → Green → Yellow → Red. Create one, call `next()` four times, and print
its `history`.

Expected: `["Red", "Green", "Yellow", "Red", "Green"]`

```tulpa starter
machine Traffic {
    state Red { on next => Green }
    state Green { }
    state Yellow { }
}
let t = Traffic()
```
```tulpa solution
machine Traffic {
    state Red { on next => Green }
    state Green { on next => Yellow }
    state Yellow { on next => Red }
}
let t = Traffic()
t.next(); t.next(); t.next(); t.next()
print(t.history)
```
```expect
["Red", "Green", "Yellow", "Red", "Green"]
```
```hint
Give each state an `on next => ...` transition.
---
Call `t.next()` four times, then `print(t.history)`.
:::

:::takeaways
- `machine M { state A { on ev => B } ... }`; first state is initial.
- Events are methods (`m.ev()`) or `m.send("ev")`; unmatched events return false.
- `enter`/`exit`/transition actions; `state history is can events mermaid()`.
:::
