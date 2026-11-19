---
title: Values and Types
minutes: 10
xp: 40
skill: syntax
summary: Integers, floats, strings, booleans and nil, and how to ask a value what it is.
---
Every piece of data in a Tulpa program is a **value**, and every value has a **type**. You
will use five basic types constantly:

| Type | Examples | Used for |
|---|---|---|
| `int` | `42`, `-7`, `1_000_000`, `0xFF` | counts, pin numbers, register values |
| `float` | `3.14`, `0.5`, `1e-3` | measurements, ratios |
| `str` | `"text"`, `'text'` | names, messages |
| `bool` | `true`, `false` | on/off, yes/no |
| `nil` | `nil` | "no value" |

## Asking a value its type

The built-in `type()` function returns a value's type name as a string:

```tulpa
print(type(42))
print(type(3.14))
print(type("servo"))
print(type(true))
print(type(nil))
```

Try adding `print(type(2[m]))`. Quantities with units are their own type, `quantity`.

## Integer literals

Underscores make big numbers readable and are ignored by the runtime. Prefixes give you hex
and binary, which you will use when talking to hardware registers:

```tulpa
print(1_000_000)
print(0xFF)        # hexadecimal
print(0b1010)      # binary
print(0x6B == 107)
```

## Floats

A number with a decimal point or an exponent is a `float`. `1e-3` means 1 × 10⁻³:

```tulpa
print(0.5 + 0.25)
print(1e-3)
print(2.0 * 3)     # int and float mix to give a float
```

## Strings

Strings can use double or single quotes. Escapes such as `\n` (newline) and `\t` (tab) work
inside both. `+` joins a string with anything:

```tulpa
print("line one\nline two")
print('single quotes work too')
print("sensor " + 7)
print("tab\tseparated")
```

## nil: the absence of a value

`nil` means "nothing here". A function that has nothing to return gives `nil`, and a lookup
that finds nothing often does too. Printing it shows `nil`:

```tulpa
let reading = nil
print(reading)
print(reading == nil)
```

:::deep Under the hood
Tulpa is **dynamically typed**: variables do not have fixed types, values do. Later you will
see optional **type annotations** (`fn drive(speed: [m/s])`) which are checked at runtime.
You get Python's flexibility, plus checks where you ask for them.
:::

```quiz
? What does `type(0x10)` return?
- `"hex"`
+ `"int"`
- `"str"`
> `0x10` is just another way to write the integer 16.
? What is the type of `2.0 * 3`?
- `int`
+ `float`
- an error
> Mixing an int and a float gives a float.
```

:::exercise Type detective
Print the type of each of these values, one per line, in this order: `100`, `9.81`,
`"imu"`, `false`.

```tulpa starter
print(type(100))
```
```tulpa solution
print(type(100))
print(type(9.81))
print(type("imu"))
print(type(false))
```
```expect
int
float
str
bool
```
```hint
Use `print(type(...))` four times.
:::

:::takeaways
- Basic types: `int`, `float`, `str`, `bool`, `nil`; `type(v)` names them.
- `0xFF` is hex, `0b1010` is binary, `1_000` is a readable 1000.
- `str + anything` concatenates.
:::
