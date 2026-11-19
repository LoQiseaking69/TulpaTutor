---
title: Drivers and Firmware Targets
minutes: 18
xp: 80
skill: systems
summary: The Driver SDK, emulated chips with fault injection, and how the same code reaches a microcontroller.
---
A **driver** turns a chip's register map into a typed, tested API. Tulpa's Driver SDK lets you
write drivers in Tulpa itself, test them against **emulated chips**, and compile the same
source for microcontrollers.

## The standard interfaces

`std/driver` defines the seams: `Driver` (`probe`, `init`), `Imu`, `Thermometer`,
`Rangefinder`, `Adc`, `PwmController`, plus bit helpers that compile natively:

```tulpa
from "std/driver" import bits, with_bits, bit, twos, u16_be, i16_be, lo8, hi8
print(bits(0b1101_0000, 4, 4), bin(with_bits(0, 4, 2, 0b11)), bit(0b100, 2))
print(twos(0xFF80, 16), u16_be(0x12, 0x34), i16_be(0xFF, 0xFE), hex(lo8(0xABCD)), hex(hi8(0xABCD)))
```

## Driver-in-the-loop with an emulated chip

`std/emu` provides register-level models of real parts. The **real** reference driver talks to
the emulated chip over the simulated bus, exactly as it would to silicon:

```tulpa
import "std/emu"
from "std/drivers/mpu6050" import Mpu6050

let chip = emu.Mpu6050(0x68)                 # the emulated part
let imu = Mpu6050(I2C::new(1, 0x68))         # the real driver
print("probe:", imu.probe())
imu.init()
chip.set(ax: 0.5[m/s^2], az: 9.81[m/s^2], gz: 0.1[rad/s])
imu.update()
print(f"ax {imu.accel_x():.3f}  az {imu.accel_z():.3f}  gz {imu.gyro_z().to("deg/s"):.2f}")
print("implements Imu:", implements(imu, "Imu"))
```

## Fault injection

Emulated chips can fail on demand, so you can test that your code notices:

```tulpa
import "std/emu"
from "std/drivers/mpu6050" import Mpu6050
let chip = emu.Mpu6050(0x68)
let imu = Mpu6050(I2C::new(1, 0x68))
print("healthy:", imu.probe())
chip.fault("offline")
print("after fault:", imu.probe())
chip.heal()
print("healed:", imu.probe())
```

A robot that checks `probe()` periodically can halt safely when its IMU drops off the bus.

## Writing your own driver

A complete driver for a fictional rangefinder at 0x29 with a 16-bit millimetre register:

```tulpa
from "std/driver" import Rangefinder, u16_be

const ID_REG = 0x00
const RANGE_REG = 0x10

struct Vl99 impl Rangefinder {
    bus: I2C
    fn probe(self) -> bool { self.bus.read_reg(ID_REG) == 0xEA }
    fn init(self) { self.bus.write_reg(0x01, 0x01) }            # start continuous mode
    fn distance(self) -> [m] {
        let b = self.bus.read_regs(RANGE_REG, 2)
        u16_be(b[0], b[1]) * 1[mm]
    }
}

# test it on the simulated bus
sim::i2c_set(0x29, ID_REG, [0xEA])
sim::i2c_set(0x29, RANGE_REG, [0x01, 0xF4])
let r = Vl99(I2C::new(1, 0x29))
assert r.probe(), "wrong chip"
r.init()
print(r.distance().to("cm"), "start bit written:", sim::i2c_get(0x29, 0x01, 1))
```

## From here to a microcontroller

On a computer with the Tulpa toolchain, the same source reaches hardware:

```sh
tulpa new rover --board rp2040        # scaffold a firmware project
tulpa prove src/main.rav              # prove contracts and invariants
tulpa build src/main.rav --target rp2040
tulpa deploy                          # prove, check, build and flash
```

- Statically compilable code (numbers, quantities, structs with invariants, machines,
  devices, `every!`, contracts) compiles **natively** through LLVM for RP2040, ESP32,
  Cortex-M and RISC-V.
- Programs using dicts, closures, tasks or `when` rules run on the **Tulpa VM for firmware**,
  the whole language on the microcontroller.
- Units are checked at build time; `require`, `ensure` and `always` call `tulpa_violation`,
  which you can override to trigger an emergency stop.

```quiz
? What does driver-in-the-loop testing mean here?
+ the real driver runs against an emulated chip on the simulated bus
- the driver is replaced by a mock function
> Real code, emulated silicon.
? A program uses closures and `when` rules. How does it run on an RP2040?
+ on the Tulpa VM for firmware
- it cannot run on a microcontroller
> Non-static features fall back to the firmware VM.
```

:::exercise Write an Adc driver
Implement `struct Ads impl Adc` (from `std/driver`) for an ADC at address `0x48` where channel
`n`'s 12-bit reading is in register `0x10 + n` (two bytes, big-endian) and full scale is
3.3 V. Methods: `probe` (true), `init` (nothing), `read_raw(self, channel: int) -> int` and
`read_volts(self, channel: int) -> [V]`. Preload channel 2 with `[0x08, 0x00]` and print
`read_raw(2)` and `read_volts(2)` rounded via f-string to 3 decimals.

Expected: `2048 1.650 V`

```tulpa starter
from "std/driver" import Adc, u16_be
```
```tulpa solution
from "std/driver" import Adc, u16_be
struct Ads impl Adc {
    bus: I2C
    fn probe(self) -> bool { true }
    fn init(self) { }
    fn read_raw(self, channel: int) -> int {
        let b = self.bus.read_regs(0x10 + channel, 2)
        u16_be(b[0], b[1])
    }
    fn read_volts(self, channel: int) -> [V] { self.read_raw(channel) / 4096.0 * 3.3[V] }
}
sim::i2c_set(0x48, 0x12, [0x08, 0x00])
let adc = Ads(I2C::new(1, 0x48))
print(adc.read_raw(2), f"{adc.read_volts(2):.3f}")
```
```expect
2048 1.650 V
```
```check
assert implements(adc, "Adc")
```
```hint
`0x0800` is 2048; 2048 / 4096 × 3.3 V = 1.65 V.
---
The `Adc` interface requires `probe`, `init`, `read_raw(self, channel: int) -> int` and `read_volts(self, channel: int) -> [V]`. Parameter types are part of the interface, so an untyped `channel` is rejected.
:::

:::takeaways
- `std/driver`: standard interfaces + bit helpers; `std/drivers/*`: reference drivers.
- `std/emu` chips run real drivers in simulation, with `fault()`/`heal()` injection.
- On a computer: `tulpa new/prove/build/deploy` take the same code to RP2040/ESP32/Cortex-M/RISC-V.
:::
