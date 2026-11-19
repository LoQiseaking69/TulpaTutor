---
title: Welcome to Tulpa
minutes: 8
xp: 40
skill: syntax
summary: What Tulpa is, why it exists, and your first running program.
---
Tulpa is a programming language for software that touches the physical world: robots,
sensors, motors, microcontrollers. It reads like Python, it is implemented in Rust, and it
builds the rules of the physical world into the language itself: **units of measure**,
**state machines**, **contracts**, **timing constraints** and **safety monitors** are all
keywords, not libraries.

Everything you run in TulpaTutor runs on the **real Tulpa runtime** (version 3.5), compiled
to WebAssembly. No server and no fake: the interpreter, bytecode VM, units and simulated
hardware bus are the same ones `tulpa` uses on a desktop.

## Your first program

Press **Run** on the snippet below.

```tulpa
print("Hello, Tulpa!")
```

`print` writes its arguments to the output, followed by a newline. Now edit the text between
the quotes and run it again. Every snippet in this course is editable: break things, change
numbers, see what happens. You can always press **Reset** to get the original back.

## Printing several things

`print` accepts any number of arguments and separates them with a space:

```tulpa
print("The answer is", 42)
print("pi is about", 3.14159, "and that is", true)
```

Numbers, text and the values `true` and `false` all print the way you would expect. Tulpa
works out how to display each one.

## Comments

Anything after `#` or `//` on a line is a comment: the runtime ignores it. Longer comments go
between `/*` and `*/`. Comments are for the humans reading your code.

```tulpa
# This line is ignored.
print("motor ready")   // so is everything after the slashes
/* A block comment can
   span several lines. */
print("done")
```

## Why a language for physical systems?

Most languages can blink an LED. The difference is what the language *knows*. In Tulpa,
`3[m] + 2[s]` is an error, because adding a length to a time is meaningless, and a servo
that must stay between 10° and 170° can say so in its definition. Bugs that would bend
metal are caught by the language. You will meet each of these ideas in this course:

```tulpa
let distance = 120[m]
let time = 9.5[s]
print("average speed:", distance / time)
```

Notice the result: Tulpa divided metres by seconds and gave you `m/s` without being told.

:::note How lessons work
Read, run every snippet, then tweak it. Each lesson ends with a short quiz and an exercise
checked by the runtime. Passing the exercise completes the lesson and earns XP.
:::

```quiz
? What does `print("a", 1)` output?
- `a1`
+ `a 1`
- `"a", 1`
> `print` separates its arguments with a single space.
? Which line is ignored by the runtime?
- `print("# hello")`
+ `# print("hello")`
- `print("hello") # done`
> A `#` starts a comment, unless it is inside a string. In the third line only the part after `#` is ignored; the `print` still runs.
```

:::exercise Say hello
Write a program that prints exactly two lines:

1. `Hello, Tulpa!`
2. `I am learning robotics.`

```tulpa starter
# Print two lines below
print("Hello, Tulpa!")
```
```tulpa solution
print("Hello, Tulpa!")
print("I am learning robotics.")
```
```expect
Hello, Tulpa!
I am learning robotics.
```
```hint
You need a second `print(...)` call on its own line.
---
Check the punctuation: the second line ends with a full stop.
```
:::

:::takeaways
- `print(a, b, ...)` writes its arguments separated by spaces, then a newline.
- `#`, `//` and `/* */` are comments.
- Tulpa understands units: `120[m] / 9.5[s]` is a speed in `m/s`.
:::
