---
title: Reading Errors
minutes: 10
xp: 45
skill: syntax
summary: Syntax errors, runtime errors, line numbers and call traces, and how to fix them.
---
Errors are not failures: they are the runtime telling you precisely what went wrong. Good
programmers read them carefully. There are two kinds.

## Syntax errors

A **syntax error** means the code is not valid Tulpa, so nothing runs at all. The message
shows the line and column, the offending line, and a caret `^` pointing at the problem:

```tulpa error
print("missing paren"
```

Fix it by adding the closing `)` and run again.

## Runtime errors

A **runtime error** happens while the program is running. Everything before the bad line
has already run, so you will see that output first:

```tulpa error
print("step 1")
print("step 2")
let x = 10 / 0
print("step 3")
```

Notice that `step 3` never prints. The message names the line that failed.

## Call traces

When an error happens inside a function, Tulpa shows the chain of calls that led there, the
**trace**. Read it from the top: the first line is where it broke, the lines below show who
called it.

```tulpa error
fn wheel_speed(rpm) {
    rpm / 0
}
fn drive() {
    wheel_speed(120)
}
drive()
```

You have not learned functions yet; just notice the `at wheel_speed()` and `at drive()`
lines and how they point you to the cause.

## Typical messages

| Message contains | Usually means |
|---|---|
| `expected ')', found ...` | a syntax typo: missing bracket, comma or quote |
| `undefined variable 'x'` | misspelled name, or used before `let` |
| `assignment to undeclared variable` | assigning a name that was never declared with `let` |
| `unit mismatch: cannot apply '+' to length [m] and time [s]` | mixed units |
| `division by zero` | a divisor became 0 |

```tulpa error
let distance = 5[m]
print(distanse)
```

Tulpa's editor diagnostics also spot many of these before you press Run: watch for the
underline in the editor.

:::tip Debugging habit
Fix the **first** error first. One mistake often causes several messages; the later ones
frequently disappear once the first is fixed.
:::

```quiz
? A program prints "A", then hits a runtime error on line 3, which would have printed "C". What do you see?
- Nothing at all
+ "A", then the error message
- "A", "C", then the error
> Runtime errors stop the program where they happen; earlier output stays.
? Which kind of error prevents any of the program from running?
+ A syntax error
- A runtime error
- A unit error
> The whole file must parse before anything runs.
```

:::exercise Fix the program
This program has two bugs: a syntax error and a misspelled variable. Fix both so it prints
`range: 4.5 m`.

```tulpa starter
let rang = 4.5[m]
print("range:", range
```
```tulpa solution
let range = 4.5[m]
print("range:", range)
```
```expect
range: 4.5 m
```
```hint
The `print` call is missing its closing bracket.
---
The variable is declared as `rang` but used as `range`. Make them match.
:::

:::takeaways
- Syntax errors stop everything; runtime errors stop at the failing line.
- Messages give line and column; traces show the chain of calls.
- Fix the first error first.
:::
