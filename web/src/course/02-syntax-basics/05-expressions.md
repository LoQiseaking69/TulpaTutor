---
title: Everything Is an Expression
minutes: 10
xp: 50
skill: syntax
summary: Blocks produce values, if is an expression, statements and semicolons.
---
Tulpa is **expression-oriented**: most constructs produce a value. Once this clicks, your
code gets shorter and clearer.

## Statements end at newlines

A statement ends at the end of the line. Use `;` to put several on one line:

```tulpa
let a = 1; let b = 2; print(a + b)
```

One subtle rule: a line that **starts** with `(` or `[` begins a new statement. It never
continues the line above. That avoids a classic ambiguity:

```tulpa
let x = 5
[1, 2, 3].each(|n| print(n))
```

## if produces a value

`if` / `else` is an expression: the branch that runs gives the value of the whole thing. No
special ternary operator needed. Chain conditions with `else if`:

```tulpa
let temperature = 352
let state = if temperature > 350 { "hot" } else if temperature < 280 { "cold" } else { "ok" }
print(state)
```

:::warn elif vs else if
As a **statement**, `if` accepts both `elif` and `else if`. As an **expression** (on the
right of `let`, inside a call), Tulpa 3.5 only accepts `else if`. Writing `else if`
everywhere is the safe habit.
:::

```tulpa
let mode = 2
if mode == 1 { print("manual") } elif mode == 2 { print("auto") } else { print("off") }
```

## Blocks produce their last expression

A block `{ ... }` evaluates its statements in order, and its value is the last expression.
This is how `if` branches give values, and how functions return values without `return`:

```tulpa
let w = 4
let h = 3
let area = if w > 0 and h > 0 {
    let a = w * h
    a
} else { 0 }
print(area)
```

The temporary name `a` exists only inside that branch, which keeps helpers tidy. (A `{` on
its own starts a **dict** literal, not a block; blocks belong to `if`, loops, functions and
the like.)

## Scope

A name declared inside a block is not visible outside it. Inner blocks can read and change
outer variables:

```tulpa
let total = 0
for i in 0..3 {
    let step = 5
    total += step
}
print(total)
```

Trying to use `step` after the loop would be an `undefined variable` error.

```tulpa error
if true {
    let inner = 1
}
print(inner)
```

## Expressions in practice

Choosing a motor command in one expression:

```tulpa
let distance = 0.3[m]
let command = if distance < 0.2[m] { 0.0 } else if distance < 0.5[m] { 0.4 } else { 1.0 }
print("throttle:", command)
```

```quiz
? What does `let v = if true { let a = 2; a * 10 } else { 0 }` set `v` to?
- `2`
+ `20`
- `nil`
> The branch's value is its last expression.
? Which is true about `if` in Tulpa?
+ It can be used on the right side of `let`
- It needs a separate ternary operator for values
- It always returns nil
> `if` is an expression.
```

:::exercise Speed zones
Set `zone` using a single `if` expression: `"crawl"` if `speed` is below 0.2 m/s,
`"cruise"` below 1 m/s, otherwise `"fast"`. Print it. With `speed = 0.6[m/s]` it prints
`cruise`.

```tulpa starter
let speed = 0.6[m/s]
let zone = "?"
print(zone)
```
```tulpa solution
let speed = 0.6[m/s]
let zone = if speed < 0.2[m/s] { "crawl" } else if speed < 1[m/s] { "cruise" } else { "fast" }
print(zone)
```
```expect
cruise
```
```hint
`let zone = if ... { "crawl" } else if ... { "cruise" } else { "fast" }`; compare with quantities like `0.2[m/s]`.
:::

:::takeaways
- Newlines or `;` end statements; a line starting with `(` or `[` is a new statement.
- `if` is an expression (chain with `else if`); a block's value is its last expression.
- Names declared in a block are local to it.
:::
