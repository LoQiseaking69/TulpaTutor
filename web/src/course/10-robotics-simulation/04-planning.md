---
title: Planning and Missions
minutes: 18
xp: 80
skill: robotics
summary: Goal planning with A*, task decomposition, utility decisions and missions that replan.
---
Behavior trees say *how* to do a task. **Planners** decide *what* to do: given the world and
a goal, find a sequence of actions that gets there. `std/plan` has three planners and an
orchestrator that ties them together.

## Goal planning (GOAP)

Describe actions by **preconditions** and **effects** on a world-state dict. A precondition is
a value to match or a predicate; an effect is a value or a function of the old value. The
planner runs A\* for the cheapest sequence:

```tulpa
import "std/plan"
let p = plan.Planner()
p.action("undock", {docked: true}, {docked: false})
p.action("drive_to_shelf", {docked: false, battery: |b| b >= 20}, {at: "shelf", battery: |b| b - 20}, cost: 2)
p.action("pick", {at: "shelf", holding: false}, {holding: true})
p.action("charge", {docked: true}, {battery: 100}, cost: 3)

let start = {docked: true, at: "dock", holding: false, battery: 45}
print(p.plan(start, {holding: true}))
print(p.plan({docked: true, at: "dock", holding: false, battery: 10}, {holding: true}))
let s = p.solve(start, {holding: true})
print("cost", s.cost, "nodes expanded", s.expanded)
```

With a low battery, the planner discovers it must charge first. Nobody wrote that rule; it
emerged from the action descriptions.

## Task decomposition (HTN)

Hierarchical planning breaks big tasks into methods, trying alternatives in order and
backtracking when one fails:

```tulpa
import "std/plan"
let d = plan.Domain()
d.primitive("unlock", {key: true}, {open: true})
d.primitive("break_in", {}, {open: true, alarm: true})
d.primitive("enter", {open: true}, {inside: true})
d.method("get_in", "politely", {}, ["unlock", "enter"])
d.method("get_in", "forcefully", {}, ["break_in", "enter"])
print("with key:   ", d.decompose({key: true}, ["get_in"]))
print("without key:", d.decompose({key: false}, ["get_in"]))
```

## Utility decisions

When several behaviours are all possible, score them and pick the best, with **hysteresis**
so the robot does not flip-flop:

```tulpa
import "std/plan"
let modes = [
    {name: "explore",  score: |w| 0.5},
    {name: "recharge", score: |w| (100 - w.battery) / 100.0},
    {name: "deliver",  score: |w| 0.8, active: |w| w.orders > 0 and w.battery > 20},
]
let mode = "explore"
for w in [{battery: 90, orders: 1}, {battery: 40, orders: 0}, {battery: 15, orders: 2}, {battery: 48, orders: 0}] {
    mode = plan.choose(modes, w, mode, 0.1).name
    println!("battery {:>3}, orders {} -> {}", w.battery, w.orders, mode)
}
```

## Missions: plan, execute, replan

A `Mission` owns prioritised goals. Each tick it picks the most important unsatisfied goal,
plans for it, runs the current step's **handler**, and **replans** when a step fails or a more
important goal activates. Handlers update the world with what really happened:

```tulpa
import "std/plan"
let p = plan.Planner()
p.action("drive", {at: "dock"}, {at: "shelf", battery: |b| b - 30}, cost: 2)
p.action("pick", {at: "shelf", holding: false}, {holding: true})
p.action("return", {at: "shelf"}, {at: "dock", battery: |b| b - 30}, cost: 2)
p.action("drop", {at: "dock", holding: true}, {holding: false, delivered: true})
p.action("charge", {at: "dock"}, {battery: 100}, cost: 3)

let world = {at: "dock", holding: false, battery: 70, delivered: false}
let m = plan.Mission(p)
m.goal("delivered", {delivered: true}, priority: 1)
m.goal("charged", {battery: |b| b >= 90}, priority: 10, active: |w| w.battery < 15)
m.on("drive", |w| { w.at = "shelf"; w.battery -= 30; plan.SUCCESS })
m.on("pick", |w| { w.holding = true; plan.SUCCESS })
m.on("return", |w| { w.at = "dock"; w.battery -= 30; plan.SUCCESS })
m.on("drop", |w| { w.holding = false; w.delivered = true; plan.SUCCESS })
m.on("charge", |w| { w.battery = 100; plan.SUCCESS })
m.run(world, 0, 50)
for e in m.log { print(e) }
```

Read the log: the battery sagged to 10 after returning, so the high-priority `charged` goal
**preempted** the delivery; afterwards the mission replanned the delivery from where it
stood, needing only `drop`.

```quiz
? In GOAP, where does "charge before driving when the battery is low" come from?
+ it emerges from preconditions and effects; nobody writes it explicitly
- a special rule in the planner
> Plans are searched, not scripted.
? What does `plan.choose(options, world, current, 0.1)` do with the margin?
+ keeps the current option unless another beats it by more than 0.1
- picks a random option within 0.1
> Hysteresis prevents flip-flopping.
```

:::exercise Coffee robot
Create a `Planner` with actions:
- `"grind"`: needs `{beans: true}`, gives `{ground: true}`
- `"brew"`: needs `{ground: true, water: true}`, gives `{coffee: true}`
- `"fill"`: needs `{}`, gives `{water: true}`

Print the plan from `{beans: true, water: false}` to `{coffee: true}`.

Expected: `["grind", "fill", "brew"]` (grind and fill are independent and cost the same; the
planner breaks the tie deterministically).

```tulpa starter
import "std/plan"
let p = plan.Planner()
```
```tulpa solution
import "std/plan"
let p = plan.Planner()
p.action("grind", {beans: true}, {ground: true})
p.action("brew", {ground: true, water: true}, {coffee: true})
p.action("fill", {}, {water: true})
print(p.plan({beans: true, water: false}, {coffee: true}))
```
```expect
["grind", "fill", "brew"]
```
```hint
`p.action(name, preconditions, effects)`, then `p.plan(start, goal)`.
---
Equal-cost plans are ordered deterministically by the A* tie-breaking; if yours differs, check the action names and dicts match exactly.
:::

:::takeaways
- `Planner.action(name, pre, effects, cost)`; `plan`/`solve` run A* over world-state dicts.
- `Domain` for HTN decomposition with backtracking; `choose` for utility with hysteresis.
- `Mission`: prioritised goals, handlers update the world, automatic replanning and preemption.
:::
