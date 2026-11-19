---
title: Operator Overloading and Display
minutes: 14
xp: 60
skill: programming
summary: op_add, op_mul, op_eq, op_cmp and to_str: structs that behave like built-in values.
---
Vectors, matrices, colours and money are values with their own arithmetic. Tulpa lets a
struct define what `+`, `*`, `==` and `<` mean, and how it prints.

## to_str: how it prints

`fn to_str(self)` is used by `print`, `str()` and f-strings:

```tulpa
struct Vec2 {
    x = 0.0
    y = 0.0
    fn to_str(self) { f"<{self.x}, {self.y}>" }
}
let v = Vec2(3.0, 4.0)
print(v)
print("velocity is " + str(v))
print(f"v = {v}")
```

## Arithmetic

| Method | Operator |
|---|---|
| `op_add(self, o)` | `a + b` |
| `op_sub(self, o)` | `a - b` |
| `op_mul(self, o)` | `a * b` |
| `op_div(self, o)` | `a / b` |
| `op_mod(self, o)` | `a % b` |
| `op_eq(self, o)` | `a == b` |
| `op_cmp(self, o)` | `< <= > >=` (negative, zero or positive) |

```tulpa
struct Vec2 {
    x = 0.0
    y = 0.0
    fn op_add(self, o) { Vec2(self.x + o.x, self.y + o.y) }
    fn op_sub(self, o) { Vec2(self.x - o.x, self.y - o.y) }
    fn op_mul(self, k) { Vec2(self.x * k, self.y * k) }
    fn op_eq(self, o) { self.x == o.x and self.y == o.y }
    fn length(self) { hypot(self.x, self.y) }
    fn to_str(self) { f"<{self.x}, {self.y}>" }
}
let p = Vec2(1.0, 2.0)
let v = Vec2(0.5, -0.25)
print(p + v * 4)
print(p - p == Vec2())
print((v * 4).length())
```

## Scalars on the left

`2 * v` tries `op_rmul` (and `1 + v` tries `op_radd`) first, then falls back to
`op_mul`/`op_add`, so commutative operations just work:

```tulpa
struct Vec2 {
    x = 0.0
    y = 0.0
    fn op_mul(self, k) { Vec2(self.x * k, self.y * k) }
    fn to_str(self) { f"<{self.x}, {self.y}>" }
}
print(2 * Vec2(1.5, 2.0))
```

## Ordering

`op_cmp` returns a number: negative if `self` is smaller, zero if equal, positive if larger.
All four comparisons derive from it:

```tulpa
struct Version {
    major = 0
    minor = 0
    fn op_cmp(self, o) { if self.major != o.major { self.major - o.major } else { self.minor - o.minor } }
    fn to_str(self) { f"{self.major}.{self.minor}" }
}
let a = Version(3, 5)
let b = Version(3, 12)
print(a < b, b >= a, Version(4, 0) > b)
```

## A practical example: complex numbers for filters

```tulpa
struct Complex {
    re = 0.0
    im = 0.0
    fn op_add(self, o) { Complex(self.re + o.re, self.im + o.im) }
    fn op_mul(self, o) { Complex(self.re * o.re - self.im * o.im, self.re * o.im + self.im * o.re) }
    fn abs(self) { hypot(self.re, self.im) }
    fn to_str(self) { f"{self.re:.3f}{if self.im >= 0 { "+" } else { "-" }}{abs(self.im):.3f}i" }
}
let z = Complex(cos(PI / 4), sin(PI / 4))
print(z, z * z, (z * z).abs())
```

Multiplying unit complex numbers rotates them: that is the maths behind digital filters and
2-D rotations.

```quiz
? Which method makes `a < b` work for a struct?
- `op_lt`
+ `op_cmp`
> op_cmp drives all ordering comparisons.
? `2 * v` where only `op_mul` is defined:
+ works: Tulpa falls back to op_mul
- is an error: needs op_rmul
> op_rmul is tried first, then op_mul.
```

:::exercise Money with units of cents
Define `struct Money { cents = 0 }` with `op_add` (adds cents), `op_cmp`, and `to_str`
printing `$D.CC` (e.g. `$12.05`). Print `Money(1050) + Money(155)` and
`Money(99) < Money(100)`.

Expected: `$12.05 true`

```tulpa starter
struct Money {
    cents = 0
}
```
```tulpa solution
struct Money {
    cents = 0
    fn op_add(self, o) { Money(self.cents + o.cents) }
    fn op_cmp(self, o) { self.cents - o.cents }
    fn to_str(self) { f"${self.cents / 100}.{self.cents % 100:02}" }
}
print(Money(1050) + Money(155), Money(99) < Money(100))
```
```expect
$12.05 true
```
```hint
Dollars are `self.cents / 100` (integer division), cents are `self.cents % 100`, padded with `:02`.
:::

:::takeaways
- `to_str` controls printing; `op_add op_sub op_mul op_div op_mod op_eq op_cmp` define operators.
- `2 * v` tries `op_rmul`, then `op_mul`.
- `op_cmp` returns negative/zero/positive and powers `< <= > >=`.
:::
