---
title: Modules and the Standard Library
minutes: 14
xp: 60
skill: programming
summary: import, from-import, aliases, private names, built-in modules and the std/ library.
---
As programs grow, you split them into **modules**: one file per concern. Tulpa also ships a
standard library of modules under `std/`.

## Importing a module

`import "path"` runs a file once and binds its name (the file stem) to a module. `.rav` is
optional, and `as` gives an alias:

```tulpa
import "std/driver"
print(driver.u16_be(0x12, 0x34))
import "std/driver" as d
print(d.hi8(0x1234), d.lo8(0x1234))
```

## Importing names

`from "path" import a, b` brings specific names straight into scope:

```tulpa
from "std/driver" import bits, with_bits, twos
let reg = 0b1011_0000
print(bits(reg, 4, 4))            # extract a 4-bit field at bit 4
print(bin(with_bits(reg, 0, 4, 0b0101)))
print(twos(0xF0, 8))              # sign-extend an 8-bit value
```

## How paths resolve

- Relative paths (`"lib/drive"`) resolve next to the importing file.
- Paths not found there are searched on the library path, so `"std/plan"` works anywhere.
- Each module runs **once** and is cached.
- Names starting with `_` stay **private** to their module.

In your own projects you would write `import "lib/drive.rav"` for a file beside your program:

```tulpa static
# lib/drive.rav
const TRACK_WIDTH = 0.16[m]
fn wheels(v, w) { [v - w * TRACK_WIDTH / 2, v + w * TRACK_WIDTH / 2] }
fn _internal() { }        # private

# main.rav
import "lib/drive"
print(drive.wheels(0.5[m/s], 1[rad/s]))
```

## The standard library

| Module | What it gives you |
|---|---|
| `std/driver` | driver interfaces and bit/byte helpers |
| `std/drivers/*` | MPU-6050, PCA9685, MCP3008 drivers |
| `std/plan` | behavior trees, planning, missions |
| `std/link` | Tulpa Link robotics middleware |
| `std/world` | 2-D physics world for mobile robots |
| `std/emu` | emulated chips for driver-in-the-loop tests |
| `std/verify` | exhaustive exploration of event orders |
| `std/frame`, `std/lipm`, `std/rl` | frames, legged balance, reinforcement learning |

## Built-in modules

Some modules are built into the runtime and use `::` instead of import: `math::`, `time::`,
`kin::` (kinematics), `sim::` (simulator hooks), `tlm::` (telemetry), plus devices like
`GPIO::new`:

```tulpa
print(math::sqrt(2.0))
print(kin::velocity(0.0, 2.0, 3.0))      # v = v0 + a*t
let xy = kin::fk2(1.0, 1.0, 30, 60)      # 2-link arm forward kinematics
print(xy.map(|v| round(v, 3)))
```

:::tip Live plots
`tlm::plot(name, value, t)` streams values that TulpaTutor draws as a live chart under the
output. Try it:
:::

```tulpa
for i in 0..50 {
    tlm::plot("sine", sin(i * 0.2), i * 0.1)
}
print("plotted 50 points")
```

```quiz
? What does `from "std/driver" import bits` do?
+ binds `bits` directly in your scope
- binds a module called `driver`
> `from ... import` brings named items in.
? A module defines `_helper`. Can importers use it?
- Yes
+ No, names starting with `_` are private
> The underscore marks private names.
```

:::exercise Use the library
Import `u16_be` and `twos` from `std/driver`. Combine the bytes `0xFF` and `0x9C` into a
16-bit value with `u16_be`, sign-extend it with `twos(value, 16)`, and print both numbers.

Expected: `65436 -100`

```tulpa starter
# import here
```
```tulpa solution
from "std/driver" import u16_be, twos
let v = u16_be(0xFF, 0x9C)
print(v, twos(v, 16))
```
```expect
65436 -100
```
```hint
`from "std/driver" import u16_be, twos`.
:::

:::takeaways
- `import "p"`, `import "p" as a`, `from "p" import x, y`; `.rav` optional; cached; `_` is private.
- `std/` holds drivers, planning, middleware, physics and verification modules.
- Built-ins use `::`: `math:: kin:: sim:: tlm::`.
:::
