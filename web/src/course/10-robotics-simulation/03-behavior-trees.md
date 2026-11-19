---
title: Behavior Trees
minutes: 16
xp: 75
skill: robotics
summary: Actions, conditions, sequences, selectors, decorators and reactive trees with std/plan.
---
State machines are great for modes. For **tasks with fallbacks and retries** ("try to grasp;
if it fails, re-approach; if the e-stop is pressed, abort"), robotics uses **behavior trees**.
`std/plan` implements them in plain, deterministic Tulpa.

## The building blocks

Every node returns `SUCCESS`, `FAILURE` or `RUNNING` when ticked:

| Node | Behaviour |
|---|---|
| `Action(name, f)` | runs `f(bb)`; `true`/`nil` = success, `false` = failure, or a status |
| `Condition(name, f)` | a check: success if `f(bb)` is true |
| `Sequence([...])` | runs children in order; fails at the first failure |
| `Selector([...])` | tries children in order; succeeds at the first success (fallback) |
| `Parallel([...], need)` | succeeds when `need` children succeed |
| `Retry(c, n)`, `Repeat(c, n)`, `Invert`, `Succeed`, `Timeout(c, d)`, `Cooldown(c, d)` | decorators |

The **blackboard** `bb` is a dict shared by all nodes.

## A sequence with a fallback

```tulpa
import "std/plan"
let bb = {door_open: false, have_key: true}
let enter = plan.Sequence([
    plan.Selector([
        plan.Condition("door open?", |bb| bb.door_open),
        plan.Action("unlock", |bb| { if bb.have_key { bb.door_open = true }; bb.have_key }),
        plan.Action("knock", |bb| { print("  knock knock"); false }),
    ], "get door open"),
    plan.Action("walk in", |bb| { print("  walking in"); true }),
], "enter room")
print(enter.tick(bb))
print(enter.render())
```

`render()` draws the tree with each node's last status: the best debugging tool for trees.

## Retries and RUNNING

Actions that take time return `RUNNING`; the tree is ticked again later. `Retry` re-runs a
failing child:

```tulpa
import "std/plan"
let bb = {attempts: 0, progress: 0}
let tree = plan.Sequence([
    plan.Retry(plan.Action("grasp", |bb| { bb.attempts += 1; bb.attempts >= 3 }), 5),
    plan.Action("lift", |bb| {
        bb.progress += 25
        if bb.progress >= 100 { plan.SUCCESS } else { plan.RUNNING }
    }),
], "pick")
let ticks = 0
loop {
    ticks += 1
    let s = tree.tick(bb)
    if s != plan.RUNNING { print("finished:", s, "after", ticks, "ticks"); break }
}
print("grasp attempts:", bb.attempts, "lift progress:", bb.progress)
```

## Reactive trees: guards that stay live

A plain `Sequence` remembers which child was running and resumes there. A
`ReactiveSequence` starts from the first child **every tick**, so a safety condition is
re-checked continuously and can abort a long action:

```tulpa
import "std/plan"
let bb = {estop: false, moved: 0}
let tree = plan.ReactiveSequence([
    plan.Condition("estop clear", |bb| not bb.estop),
    plan.Action("move", |bb| { bb.moved += 1; plan.RUNNING }),
], "guarded move")
for i in 0..5 {
    if i == 3 { bb.estop = true }
    println!("tick {}: {} (moved {})", i, tree.tick(bb), bb.moved)
}
```

## Running a tree

`plan.run_tree(tree, bb, period, max_ticks)` ticks until done, at a period on the clock:

```tulpa
import "std/plan"
let bb = {n: 0}
let count = plan.Repeat(plan.Action("count", |bb| { bb.n += 1; true }), 4)
print(plan.run_tree(count, bb, 10[ms], 100), bb.n, millis(), "ms")
```

:::tip Trees vs machines
Use a **machine** for the robot's top-level modes (Idle, Working, Fault) and **trees** for the
step-by-step tasks inside a mode. They compose well: a state's `enter` can reset a tree, and a
tick loop can drive it.
:::

```quiz
? A Selector's first child fails and its second succeeds. What does the Selector return?
+ SUCCESS
- FAILURE
> Selectors are fallbacks: first success wins.
? Why use ReactiveSequence for a safety guard?
+ it re-checks its first children every tick, so a guard can interrupt a running action
- it is faster
> Plain sequences resume the running child without re-checking earlier ones.
```

:::exercise Charging behavior
Build a `Selector` named "power" with two children:
1. a `Condition` "battery ok" that is true when `bb.battery >= 20`,
2. a `Sequence` of actions "dock" (sets `bb.docked = true`) and "charge" (sets
   `bb.battery = 100`), both returning true.

Tick it with `{battery: 12, docked: false}` and print the status, then `bb.battery` and
`bb.docked`.

Expected: `success 100 true`

```tulpa starter
import "std/plan"
let bb = {battery: 12, docked: false}
```
```tulpa solution
import "std/plan"
let bb = {battery: 12, docked: false}
let power = plan.Selector([
    plan.Condition("battery ok", |bb| bb.battery >= 20),
    plan.Sequence([
        plan.Action("dock", |bb| { bb.docked = true; true }),
        plan.Action("charge", |bb| { bb.battery = 100; true }),
    ]),
], "power")
print(power.tick(bb), bb.battery, bb.docked)
```
```expect
success 100 true
```
```hint
`plan.Selector([plan.Condition(...), plan.Sequence([plan.Action(...), plan.Action(...)])], "power")`.
:::

:::takeaways
- Nodes return SUCCESS/FAILURE/RUNNING; the blackboard dict is shared state.
- Sequence = all in order, Selector = first success; decorators add retry/timeout/repeat.
- ReactiveSequence keeps guards live; `render()` shows statuses; `run_tree` ticks on the clock.
:::
