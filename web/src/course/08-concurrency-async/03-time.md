---
title: Time and the Virtual Clock
minutes: 12
xp: 55
skill: systems
summary: sleep, millis, micros, now, the virtual clock and sim::advance for fast deterministic tests.
---
Timing is half of robotics: debounce windows, control periods, timeouts, deadlines. Tulpa
treats time as a first-class, testable thing.

## Reading and waiting

| Function | Gives |
|---|---|
| `sleep(s)` / `sleep_ms(ms)` | pause |
| `millis()` / `micros()` | program clock in ms / µs |
| `now()` | wall-clock seconds since 1970 |

`sleep` also accepts a time quantity: `sleep(250[ms])`.

```tulpa
print(millis())
sleep(250[ms])
sleep_ms(750)
print(millis(), "ms =", micros(), "us")
```

## The virtual clock

With the **virtual clock**, sleeping is instant but the clock still advances by exactly the
requested time. Lesson snippets use it by default (on a computer: `--virtual-time`, or
`sim::virtual_time(true)` from a script):

```tulpa
let t0 = millis()
sleep(3600)                 # an hour
print("an hour passed in an instant:", (millis() - t0) / 1000, "s")
```

Runs are **reproducible**: `millis()` starts at 0 and only moves when the program waits.

## Real time

Snippets marked *real time* use the wall clock. Feel the difference:

```tulpa realtime
let t0 = millis()
sleep(0.3)
print("waited about", millis() - t0, "ms of real time")
```

## sim::advance

`sim::advance(duration)` moves the virtual clock forward without a sleep, which is useful in
tests to jump past a timeout:

```tulpa
sim::virtual_time(true)
let start = millis()
sim::advance(5[s])
print("jumped", millis() - start, "ms")
```

## Measuring code

`time_execution!({ ... })` runs a block and prints how long it took (real CPU time), handy
for profiling:

```tulpa
let n = time_execution!({
    let s = 0
    for i in 0..20000 { s += i }
    s
})
print(n)
```

:::deep Why virtual time matters
A test of a 30-second watchdog would take 30 seconds on a wall clock, and would be flaky on a
loaded CI machine. On the virtual clock it runs in microseconds and gives the same answer
every time. Tulpa's record/replay even replays hardware tapes on the virtual clock, so a
10-minute field session replays in milliseconds.
:::

```quiz
? On the virtual clock, what does `sleep(10); print(millis())` print if the clock was at 500?
- `500`
+ `10500`
- `10`
> The clock advances by the full sleep, instantly.
? Which call jumps the virtual clock forward without sleeping?
+ `sim::advance(2[s])`
- `sleep(0)`
- `millis(2000)`
> sim::advance moves time directly.
```

:::exercise Timeout check
Write `fn wait_until(deadline_ms)` that sleeps in 100 ms steps while `millis() < deadline_ms`
and returns how many steps it took. Print `wait_until(1000)` then `millis()`.

Expected: `10 1000`

```tulpa starter
fn wait_until(deadline_ms) {
    0
}
```
```tulpa solution
fn wait_until(deadline_ms) {
    let steps = 0
    while millis() < deadline_ms {
        sleep_ms(100)
        steps += 1
    }
    steps
}
print(wait_until(1000), millis())
```
```expect
10 1000
```
```hint
Loop `while millis() < deadline_ms { sleep_ms(100); steps += 1 }`.
:::

:::takeaways
- `sleep sleep_ms millis micros now`; sleeps take seconds or time quantities.
- The virtual clock makes sleeps instant and runs reproducible; `sim::advance(d)` jumps it.
- `time_execution!` measures real CPU time.
:::
