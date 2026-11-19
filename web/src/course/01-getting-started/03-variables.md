---
title: Variables and Constants
minutes: 10
xp: 45
skill: syntax
summary: let, const, assignment, compound operators, and why Tulpa rejects typos.
---
A **variable** is a name for a value. You declare one with `let`, and from then on you can
read it and change it.

```tulpa
let speed = 10
print(speed)
speed = 12          # assign a new value
print(speed)
speed += 3          # shorthand for speed = speed + 3
print(speed)
```

The compound operators `+=`, `-=`, `*=`, `/=` and `%=` update a variable in place.

## Declaring is required

Assigning to a name you never declared is an **error**. That sounds strict, but it catches
one of the most common bugs: a typo silently creating a new variable.

```tulpa error
let motor_speed = 50
motr_speed = 80     # typo!
print(motor_speed)
```

Run it and read the message. In a language without this check, the program would happily
keep `motor_speed` at 50 while you wonder why the robot is slow.

## Constants

`const` declares a name that must never change. Use it for limits and configuration:

```tulpa error
const MAX_RPM = 3000
print(MAX_RPM)
MAX_RPM = 4000      # not allowed
```

By convention constants are written in `UPPER_CASE`.

## Destructuring

`let` can unpack a list into several names at once:

```tulpa
let x, y = [3, 4]
print(x, y)
let left, right = [0.8, -0.8]
print("wheels:", left, right)
```

## Variables hold any type

A variable is just a label. The same name can later hold a different type, though that is
usually a sign you should pick clearer names:

```tulpa
let value = 5
print(type(value))
value = "five"
print(type(value))
```

:::tip Naming
Use descriptive `snake_case` names: `left_wheel_speed` beats `lws`. Your future self, and
anyone reviewing the code that drives a 20 kg arm, will thank you.
:::

```quiz
? What happens when you run `count = 1` without ever writing `let count`?
- Tulpa creates `count` automatically
+ It is a runtime error
- It is silently ignored
> Assigning to an undeclared name is an error. This catches typos.
? After `let n = 10` then `n *= 3` then `n -= 5`, what is `n`?
- 15
+ 25
- 35
> 10 × 3 = 30, then 30 − 5 = 25.
```

:::exercise Battery tracker
A robot starts with `battery = 100`. Write code that:

1. subtracts 15 (driving),
2. subtracts 30 (lifting),
3. adds 20 (charging),

using compound operators, then prints `battery: ` followed by the value, like
`battery: 75`.

```tulpa starter
let battery = 100
# update the battery here

print("battery:", battery)
```
```tulpa solution
let battery = 100
battery -= 15
battery -= 30
battery += 20
print("battery:", battery)
```
```expect
battery: 75
```
```check
assert_eq!(battery, 75)
```
```hint
`battery -= 15` subtracts 15 from `battery`.
:::

:::takeaways
- `let` declares, `=` reassigns, `+= -= *= /= %=` update in place.
- Assigning an undeclared name is an error, which catches typos.
- `const` names can never be reassigned.
- `let a, b = [1, 2]` destructures a list.
:::
