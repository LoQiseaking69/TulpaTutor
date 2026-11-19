---
title: Task Pipelines and Coordination
minutes: 14
xp: 60
skill: systems
summary: Producer/consumer patterns, shared state, task lists and deterministic ordering.
---
Tasks become powerful when they cooperate through shared data. This lesson builds the
patterns robotics software uses daily.

## Fan-out, fan-in

Start one task per item, then collect. The result order always matches the spawn order:

```tulpa
fn calibrate(axis) {
    let offset = {x: 0.02, y: -0.01, z: 0.98}[axis]
    print("  calibrated", axis)
    [axis, offset]
}
let jobs = ["x", "y", "z"].map(|a| spawn calibrate(a))
let offsets = {}
for pair in await jobs { offsets[pair[0]] = pair[1] }
print(offsets)
```

## Producer and consumer

A shared list works as a queue between tasks. Because tasks run one after another, there are
no data races:

```tulpa
let queue = []
fn producer(n) {
    for i in 0..n { queue.push(i * i) }
    print("  produced", n, "items")
}
fn consumer() {
    let total = 0
    while len(queue) > 0 { total += queue.pop() }
    total
}
await spawn producer(5)
print("consumed total:", await spawn consumer())
```

## Ordered effects

Deterministic order means logs and actuator commands come out in a predictable sequence,
which you can test:

```tulpa
let log = []
fn step(name, ms) { sleep(ms / 1000.0); log.push(f"{name}@{millis()}") }
await [spawn step("arm", 200), spawn step("gripper", 100), spawn step("base", 50)]
print(log)
```

Each task's sleep advances the shared clock in turn, so timestamps accumulate.

## Deferred cleanup with tasks

Schedule teardown at start-up so it cannot be forgotten:

```tulpa
let motor = GPIO::new(23)
motor.set_high()
spawn fn() { motor.set_low(); print("  [cleanup] motor off:", motor.read()) }
print("working, motor:", motor.read())
```

The cleanup runs at program end even though nothing awaited it.

## When tasks are not the answer

Tasks are for *structuring* work. For things that must happen **on time**, such as a 100 Hz
control loop or a debounce window, use `every!` and timing rules, covered next. They are built
on the clock rather than on task order.

```quiz
? In what order are results returned by `await [spawn a(), spawn b()]`?
+ the spawn order: [a's result, b's result]
- whichever finishes first
> Order always matches the list.
? Why are there no data races between Tulpa tasks?
+ they run cooperatively, one at a time
- Tulpa locks every variable
> Cooperative scheduling means no simultaneous access.
```

:::exercise Sum of squares pipeline
Using a shared list `buf`, write `fn fill(n)` pushing the squares of `1..=n` into it, and
`fn drain()` popping everything and returning the sum. Await `fill(4)` then `drain()` and
print the sum.

Expected: `30`

```tulpa starter
let buf = []
```
```tulpa solution
let buf = []
fn fill(n) { for i in 1..=n { buf.push(i * i) } }
fn drain() {
    let s = 0
    while len(buf) > 0 { s += buf.pop() }
    s
}
await spawn fill(4)
print(await spawn drain())
```
```expect
30
```
```hint
1 + 4 + 9 + 16 = 30. `while len(buf) > 0 { s += buf.pop() }`.
:::

:::takeaways
- Fan-out with `map(|x| spawn f(x))`, fan-in with `await` (order preserved).
- Shared lists are safe queues under cooperative scheduling.
- Use tasks to structure work; use `every!` and timing rules for things that must be on time.
:::
