---
title: GPIO and the Simulated Bus
minutes: 14
xp: 60
skill: systems
summary: Digital outputs and inputs, the sim and linux backends, sim:: hooks and the transaction log.
---
**GPIO** (general-purpose input/output) pins are the simplest hardware interface: a pin is
high (1) or low (0). Outputs drive LEDs, relays and enable lines; inputs read buttons, limit
switches and sensor interrupt lines.

## Outputs

```tulpa
let led = GPIO::new(17)            # output by default
led.set_high()
print("on:", led.read(), led.is_high())
led.set_low()
led.write(1)
led.toggle()
print("after toggle:", led.read())
print("pin", led.pin(), "direction", led.direction())
```

## Inputs

On real hardware an input reads the voltage on the pin. In the simulator, you play the
outside world with `sim::gpio_input(pin, level)`:

```tulpa
let button = GPIO::new(4, "in")
print("released:", button.read())
sim::gpio_input(4, 1)
print("pressed:", button.read(), button.read() == HIGH)
```

Writing to an input is an **error**, not a silent no-op:

```tulpa error
let button = GPIO::new(4, "in")
button.set_high()
```

## Two backends, one program

| Backend | Select | Talks to |
|---|---|---|
| `sim` (default) | nothing / `--sim` | an in-memory bus: deterministic, scriptable, logged |
| `linux` | `--hw` | `/dev/gpiochip0` (GPIO v2 uAPI), `/dev/i2c-N`, `/dev/spidev*`, TTYs |

The same file runs on both. `sim::backend()` tells a script which one it is on, so it can
preload fake data only when simulated:

```tulpa
if sim::backend() == "sim" { sim::gpio_input(4, 1) }
let door_closed = GPIO::new(4, "in")
print("backend:", sim::backend(), "door closed:", door_closed.read())
```

## The transaction log

The simulator records every device operation, a powerful debugging and testing tool:

```tulpa
let buzzer = GPIO::new(18)
sim::clear_log()
buzzer.blink(2, 100)          # 2 blinks, 100 ms on/off
print(sim::log())
print("buzzer pin level now:", sim::gpio_level(18))
```

Tests can assert exactly what the program did to the hardware. On a computer, `--record` and
`--replay` capture a real hardware session to a tape and replay it anywhere.

## A complete example: interlock

```tulpa
let guard = GPIO::new(5, "in")     # safety guard switch
let motor = GPIO::new(23)
when guard.read() == 0 { motor.set_low(); print("guard open: motor off") }
motor.set_high()
print("running:", motor.read())
sim::gpio_input(5, 1)              # guard closed
sim::gpio_input(5, 0)              # someone opens it
print("motor:", motor.read())
```

```quiz
? What happens when you call `set_high()` on a pin created with `GPIO::new(4, "in")`?
- nothing
+ a runtime error
- it switches the pin to output
> Writing to an input is an error.
? How does a simulated program read a pressed button?
+ the script or test drives the input with `sim::gpio_input(pin, 1)`
- it cannot; inputs only work on hardware
> sim hooks play the outside world.
```

:::exercise Status LEDs
Create outputs on pins 20 (green) and 21 (red). Write `fn show(ok)` that lights green and
turns red off when `ok` is true, and the opposite otherwise. Call `show(true)` then
`show(false)`, clearing the log first, and print `sim::log()`.

Expected: `["gpio 20 <- 1", "gpio 21 <- 0", "gpio 20 <- 0", "gpio 21 <- 1"]`

```tulpa starter
let green = GPIO::new(20)
let red = GPIO::new(21)
```
```tulpa solution
let green = GPIO::new(20)
let red = GPIO::new(21)
fn show(ok) {
    if ok { green.set_high(); red.set_low() } else { green.set_low(); red.set_high() }
}
sim::clear_log()
show(true)
show(false)
print(sim::log())
```
```expect
["gpio 20 <- 1", "gpio 21 <- 0", "gpio 20 <- 0", "gpio 21 <- 1"]
```
```hint
Order matters for the log: set green first, then red, in both branches.
:::

:::takeaways
- `GPIO::new(pin)` / `GPIO::new(pin, "in")`; `set_high set_low write read toggle blink`.
- Writing to an input is an error; `sim::gpio_input` drives inputs in simulation.
- Same code on `sim` and `linux`; `sim::log()` records every transaction.
:::
