---
title: Operators, Precedence and Bits
minutes: 14
xp: 55
skill: syntax
summary: Operator precedence, bitwise operators and masks, the daily tools of register-level code.
---
Sensors and microcontrollers expose their settings as **registers**: bytes where each bit
means something. Reading and writing them needs bitwise operators.

## Precedence

When an expression mixes operators, higher-precedence ones bind first. From low to high:

`or` · `and` · `not` · comparisons and `in` · ranges `..` · `|` · `^` · `&` · `<< >>` ·
`+ -` · `* / %` · unary `- ! ~` · `**` · calls, indexing, `.field`

```tulpa
print(2 + 3 * 4)          # * before +
print((2 + 3) * 4)
print(-2 ** 2)            # ** binds tighter than unary minus
print(1 + 2 == 3 and 2 < 1)
```

When in doubt, add brackets. They cost nothing and make intent obvious.

## Bitwise operators

| Op | Name | Use |
|---|---|---|
| `&` | AND | keep only some bits (masking) |
| `\|` | OR | set bits |
| `^` | XOR | flip bits |
| `~` | NOT | invert all bits |
| `<<` / `>>` | shift | move bits left / right |

```tulpa
let reg = 0b1010_0110
print(bin(reg & 0b0000_1111))   # low nibble
print(bin(reg | 0b0000_0001))   # set bit 0
print(bin(reg ^ 0b1111_1111))   # flip all 8 bits
print(bin(reg >> 4))            # high nibble moved down
print(1 << 3)                   # bit 3 on its own
```

## Testing, setting and clearing a bit

These three patterns appear in every driver ever written:

```tulpa
let status = 0b0000_0100
let READY = 1 << 2
print("ready?", (status & READY) != 0)
status = status | (1 << 7)        # set bit 7
status = status & ~(1 << 2)       # clear bit 2
print(bin(status))
print(status.bit(7), status.bit(2))
```

`n.bit(k)` is a built-in shortcut for testing bit `k`.

## Combining two bytes

Many sensors return 16-bit readings as two bytes, high byte first. Shift the high byte left
by 8 and OR in the low byte:

```tulpa
let hi = 0x12
let lo = 0x34
let value = (hi << 8) | lo
print(hex(value), value)
```

If the reading is **signed** (two's complement), values of 0x8000 and above are negative:

```tulpa
let raw = (0xFF << 8) | 0x38
let signed = if raw >= 0x8000 { raw - 0x10000 } else { raw }
print(raw, signed)
```

You will meet a helper that does this for you (`int_from_bytes`) in Module 3.

```quiz
? What is `0b1100 & 0b1010`?
+ `0b1000`
- `0b1110`
- `0b0110`
> AND keeps bits that are set in both.
? Which expression sets bit 3 of `r` without touching the others?
- `r & (1 << 3)`
+ `r | (1 << 3)`
- `r ^ 3`
> OR with a mask sets the masked bits.
? What does `1 + 2 * 3` evaluate to?
- `9`
+ `7`
> Multiplication binds tighter than addition.
```

:::exercise Configure a register
A gyro's config register `cfg = 0b0001_1000` holds the range in bits 3–4. Write code that:

1. extracts the range field: `(cfg >> 3) & 0b11` and prints it,
2. clears bits 3–4 and sets them to `0b01`, then prints the register with `bin()`.

Expected output:
```
3
0b1000
```

```tulpa starter
let cfg = 0b0001_1000
```
```tulpa solution
let cfg = 0b0001_1000
print((cfg >> 3) & 0b11)
cfg = (cfg & ~(0b11 << 3)) | (0b01 << 3)
print(bin(cfg))
```
```expect
3
0b1000
```
```hint
Clear the field with `cfg & ~(0b11 << 3)`.
---
Then OR in the new value shifted into place: `| (0b01 << 3)`.
:::

:::takeaways
- Precedence: `**` > unary > `* / %` > `+ -` > shifts > `&` > `^` > `|` > comparisons > `not` > `and` > `or`.
- Test `(x & mask) != 0`, set `x | mask`, clear `x & ~mask`, flip `x ^ mask`.
- Combine bytes with `(hi << 8) | lo`.
:::
