---
title: Tasks: spawn and await
minutes: 14
xp: 60
skill: systems
summary: Deferred calls as tasks, awaiting one or many, and what cooperative means.
---
A robot does many things "at once": read sensors, plan, log, talk to a base station. Tulpa
expresses this with **tasks**.

## spawn creates a task

`spawn f(args)` does not call `f` yet. It creates a **task**, a deferred call, and returns
immediately:

```tulpa
fn read_sensor(name) {
    print("  reading", name)
    name + ": ok"
}
let t = spawn read_sensor("imu")
print("spawned a", type(t))
print("result:", await t)
```

Notice the order: "spawned" prints **before** "reading". The task runs when you `await` it.

## Awaiting many

`await` on a list runs all the tasks and returns their results **in order**:

```tulpa
fn read_sensor(name) { print("  reading", name); name + ": ok" }
let results = await [spawn read_sensor("gps"), spawn read_sensor("lidar"), spawn read_sensor("imu")]
print(results)
```

## Fire and forget

A task that is never awaited still runs: at `join_all()`, or at the end of the program. A
`spawn fn() { ... }` is a handy way to schedule cleanup or a final report:

```tulpa
spawn fn() { print("  [report] shutting down cleanly") }
print("main work...")
join_all()
print("after join_all")
```

## Cooperative, not parallel

Tulpa tasks run **cooperatively** on one thread, in a **deterministic** order. Two tasks
that each sleep for one second take two seconds in total:

```tulpa
fn slow(n) {
    sleep(1)
    print("  task", n, "done at", millis(), "ms")
    n
}
let r = await [spawn slow(1), spawn slow(2)]
print(r, "total", millis(), "ms")
```

That determinism is a feature: the same program produces the same interleaving every run,
which makes concurrent robot logic testable. For periodic work that must keep pace, use
`every!` (lesson 4) and timing rules (lesson 5).

## Errors in tasks

An error raised inside a task surfaces where it is awaited. The reliable way to handle it is
**inside the task**, returning a value the caller can check:

```tulpa
fn flaky() { error("sensor timeout") }
fn guarded(f) {
    try { {ok: true, value: f()} } catch e { {ok: false, error: e} }
}
let r = await spawn guarded(flaky)
print(r.ok, r.error)
```

:::warn Known issue in Tulpa 3.5
Catching a task's error around `await` (`try { await spawn flaky() } catch e { }`) does catch
it, but the runtime re-raises the same error when the program ends, so the program still
exits with an error:
:::

```tulpa error
fn flaky() { error("sensor timeout") }
try { await spawn flaky() } catch e { print("caught:", e) }
print("end of program")
```

```quiz
? What does `let t = spawn f()` do?
- calls f immediately on another thread
+ creates a deferred task; f runs when awaited, at join_all, or at program end
> spawn creates a task without running it.
? Two awaited tasks each `sleep(1)`. How long do they take together?
- about 1 s
+ about 2 s
> Tasks are cooperative and sequential.
```

:::exercise Parallel-looking reads
Write `fn read(name, value)` that returns `name + "=" + str(value)`. Spawn three reads for
`("t", 21)`, `("h", 40)`, `("p", 1013)`, await them together and print the results joined
with commas.

Expected: `t=21,h=40,p=1013`

```tulpa starter
fn read(name, value) {
    ""
}
```
```tulpa solution
fn read(name, value) {
    name + "=" + str(value)
}
let rs = await [spawn read("t", 21), spawn read("h", 40), spawn read("p", 1013)]
print(rs.join(","))
```
```expect
t=21,h=40,p=1013
```
```hint
`await [spawn read(...), spawn read(...), spawn read(...)]` gives a list; `.join(",")` combines it.
:::

:::takeaways
- `spawn f(x)` makes a task; `await t` / `await [t1, t2]` runs and collects results in order.
- Unawaited tasks run at `join_all()` or program end.
- Tasks are cooperative and deterministic; handle task errors inside the task (3.5 re-raises caught ones at exit).
:::
