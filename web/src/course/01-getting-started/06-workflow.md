---
title: The REPL and Your Workflow
minutes: 10
xp: 50
skill: syntax
summary: The interactive REPL, the simulated clock, the simulated hardware bus, and how Tulpa runs code.
---
You now know enough to explore on your own. This lesson shows the tools you will use for the
rest of the course.

## The REPL

The **REPL** (Read-Eval-Print Loop) runs one line at a time and remembers everything you
defined. It is perfect for quick experiments. Snippets marked *REPL* open in the REPL tab of
**Explore → Playground**, line by line:

```tulpa repl
let wheel = 0.065[m]
let rpm = 120
wheel * 3.14159 * rpm / 1[min]
```

In the REPL, an expression on its own line shows its value, so you do not need `print`.

## Simulated time

Robots wait: for a motor to spin up, for a sensor to settle. `sleep(seconds)` pauses the
program. TulpaTutor runs snippets on Tulpa's **virtual clock** by default: sleeps complete
instantly but the clock still advances, so timing logic behaves exactly as it would on a
real robot, only faster.

```tulpa
print("t =", millis(), "ms")
sleep(2)
print("t =", millis(), "ms")
sleep(0.5)
print("t =", millis(), "ms")
```

`millis()` reads the clock. Two and a half seconds passed, in no time at all. Snippets
marked *real time* use the wall clock instead:

```tulpa realtime
print("waiting half a second for real...")
sleep(0.5)
print("done")
```

## Simulated hardware

Tulpa ships with a simulated hardware bus. The same code that toggles a real pin on a
Raspberry Pi toggles a simulated one here:

```tulpa
let led = GPIO::new(17)
led.set_high()
print("pin 17 is", led.read())
led.toggle()
print("pin 17 is", led.read())
```

Module 9 goes deep on hardware. For now, know that everything is real Tulpa code that would
run on a board.

## How Tulpa executes your code

Tulpa has several execution tiers:

1. **Interpreter**: runs everything.
2. **Bytecode VM**: functions are compiled to bytecode on first call, 4–5× faster. This is on
   by default, here too.
3. **Native code**: `tulpa build` compiles through LLVM for desktops and microcontrollers
   (RP2040, ESP32, Cortex-M, RISC-V). That needs a computer, but the programs you write here
   are the same ones it compiles.

```tulpa
fn fib(n) { if n < 2 { n } else { fib(n - 1) + fib(n - 2) } }
print(fib(20))
```

That ran on the bytecode VM, inside your browser.

:::takeaways
- The REPL evaluates line by line and shows expression values.
- `sleep(s)` and `millis()` use the virtual clock: instant, but timing-accurate.
- The simulated bus lets hardware code run anywhere.
- Tiers: interpreter, bytecode VM, native compilation.
:::

```quiz
? On the virtual clock, what does `sleep(3); print(millis())` print if the clock started at 0?
- `0`
+ `3000`
- `3`
> `millis()` counts milliseconds, and the virtual clock advances by the full sleep.
? Why is the virtual clock useful for robotics code?
- It makes the robot move faster
+ Timing logic runs deterministically and instantly in tests
- It removes the need for sleeps
> Same timing behaviour, reproducible and fast.
```

:::exercise Countdown
Write a countdown that prints `3`, `2`, `1` then `liftoff at 3000 ms`, sleeping one second
after each number. Use `millis()` for the time.

```tulpa starter
print(3)
sleep(1)
```
```tulpa solution
print(3)
sleep(1)
print(2)
sleep(1)
print(1)
sleep(1)
print("liftoff at", millis(), "ms")
```
```expect
3
2
1
liftoff at 3000 ms
```
```hint
Repeat the `print` / `sleep(1)` pattern, then print the time with `millis()`.
:::
