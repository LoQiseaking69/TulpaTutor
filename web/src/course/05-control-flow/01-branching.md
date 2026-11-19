---
title: Branching with if
minutes: 10
xp: 50
skill: programming
summary: if, elif, else, nested decisions, guard clauses and decision tables.
---
Control flow decides **which** code runs. The simplest tool is `if`.

## if, elif, else

```tulpa
let distance = 0.35
if distance < 0.2 {
    print("STOP")
} elif distance < 0.5 {
    print("slow down")
} else {
    print("clear")
}
```

Conditions are tested top to bottom; the first true one runs and the rest are skipped. The
braces are required, even for one statement, which avoids a whole class of bugs.

## Combining conditions

```tulpa
let battery = 18
let docked = false
if battery < 20 and not docked {
    print("return to dock")
}
if battery < 5 or docked { print("power save") } else { print("normal mode") }
```

## Nested decisions and guard clauses

Deep nesting is hard to read. Prefer **guard clauses**: handle the special cases first and
return early:

```tulpa
fn command(estop, battery, target) {
    if estop { return "halt: e-stop" }
    if battery < 10 { return "halt: battery" }
    if target == nil { return "idle: no target" }
    f"drive to {target}"
}
print(command(false, 80, "dock"))
print(command(true, 80, "dock"))
print(command(false, 5, nil))
```

## if as a value

Remember that `if` is an expression (use `else if` to chain in this form):

```tulpa
let temp = 345
let fan = if temp > 340 { 1.0 } else if temp > 320 { 0.5 } else { 0.0 }
print("fan duty", fan)
```

## Decision tables

When many conditions map to outcomes, a table of rules is clearer than a long chain. Each
rule is a test and a result; the first match wins:

```tulpa
let rules = [
    [|s| s.estop, "halt"],
    [|s| s.battery < 15, "dock"],
    [|s| s.obstacle, "avoid"],
    [|s| true, "patrol"],
]
fn decide(state) {
    for r in rules { if r[0](state) { return r[1] } }
}
print(decide({estop: false, battery: 50, obstacle: true}))
print(decide({estop: false, battery: 10, obstacle: true}))
```

```quiz
? In an if/elif chain, how many branches can run?
+ at most one
- every branch whose condition is true
> The first true condition wins; the rest are skipped.
? Why are guard clauses recommended?
- They run faster
+ They reduce nesting and make special cases obvious
> Early returns keep the main path flat.
```

:::exercise Thermostat
Write `fn thermostat(t)` returning `"heat"` below 290, `"cool"` above 300, else `"hold"`
(t is a plain number of kelvin). Print the results for 285, 295 and 305 on one line.

Expected: `heat hold cool`

```tulpa starter
fn thermostat(t) {
    "hold"
}
print(thermostat(285), thermostat(295), thermostat(305))
```
```tulpa solution
fn thermostat(t) {
    if t < 290 { "heat" } elif t > 300 { "cool" } else { "hold" }
}
print(thermostat(285), thermostat(295), thermostat(305))
```
```expect
heat hold cool
```
```check
assert_eq!(thermostat(290), "hold")
assert_eq!(thermostat(300), "hold")
```
```hint
Two tests: `t < 290` and `t > 300`, with `"hold"` in the else.
:::

:::takeaways
- `if / elif / else` with mandatory braces; first true branch wins.
- Guard clauses with early `return` keep code flat.
- Decision tables (lists of `[test, result]`) scale better than long chains.
:::
