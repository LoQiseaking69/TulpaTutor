---
title: Bytes and Bits
minutes: 14
xp: 60
skill: syntax
summary: Byte lists, hex and binary, decoding sensor frames, and two's complement.
---
Hardware speaks in bytes. A temperature sensor returns two bytes; a motor controller expects
a framed packet with a checksum. This lesson gives you the tools.

## Bytes are lists of ints

A byte is an integer from 0 to 255. Byte buffers are plain lists:

```tulpa
let frame = [0xAA, 0x01, 0x10, 0x27]
print(frame)
print(frame.hex())
print(hex(frame[1]), bin(frame[2]))
```

## Text and bytes

```tulpa
print(bytes("OK"))           # string -> byte list
print(decode([72, 105]))     # byte list -> string
print(ord("A"), chr(66))
```

## Multi-byte integers

`int_from_bytes(list, order, signed)` combines bytes into an integer. `order` is `"big"`
(most significant first) or `"little"`. `int_to_bytes(n, length, order)` goes the other way:

```tulpa
print(int_from_bytes([0x12, 0x34], "big", false))
print(int_from_bytes([0x34, 0x12], "little", false))
print(int_from_bytes([0xFF, 0x38], "big", true))    # signed: negative
print(int_to_bytes(1000, 2, "big"))
```

## Two's complement

Signed values store negative numbers as two's complement: for 16 bits, values from 0x8000 to
0xFFFF mean −32768 to −1. A sensor axis reading `0xFF38` is −200, not 65336:

```tulpa
let raw = 0xFF38
let value = if raw >= 0x8000 { raw - 0x10000 } else { raw }
print(value)
print(int_from_bytes([0xFF, 0x38], "big", true) == value)
```

## Decoding a real sensor frame

An IMU sends six bytes: X, Y, Z acceleration, each signed 16-bit big-endian, at 16384
counts per g:

```tulpa
let frame = [0x00, 0x10, 0xFF, 0xF0, 0x40, 0x00]
let axes = []
for i in range(0, 6, 2) {
    let counts = int_from_bytes(frame[i..i + 2], "big", true)
    axes.push(round(counts / 16384.0, 4))
}
print("accel (g):", axes)
```

The Z axis reads 1 g: the sensor is lying flat.

## Checksums

Packets often end with a checksum so corruption is detected. A simple one is the sum of the
bytes modulo 256; a stronger one is XOR of all bytes:

```tulpa
let payload = [0x01, 0x10, 0x27, 0x10]
let sum8 = payload.sum() % 256
let x = payload.reduce(|a, b| a ^ b)
print(hex(sum8), hex(x))
let packet = [0xAA] + payload + [sum8]
print(packet.hex())
```

```quiz
? What is `int_from_bytes([0x01, 0x00], "little", false)`?
+ `1`
- `256`
> Little-endian: the first byte is the least significant.
? A signed 16-bit register reads 0xFFFF. What value is it?
- 65535
+ -1
- 0
> 0xFFFF − 0x10000 = −1.
```

:::exercise Decode a temperature
A sensor returns `[0x0B, 0xB8]`: a signed big-endian 16-bit reading in **hundredths of a
degree Celsius**, so `3000` means 30.00 °C. Print the temperature in °C as a float, then
convert it to kelvin as a quantity, `273.15[K] + celsius * 1[K]`, and print that.

Expected:
```
30.0
303.15 K
```

```tulpa starter
let data = [0x0B, 0xB8]
```
```tulpa solution
let data = [0x0B, 0xB8]
let counts = int_from_bytes(data, "big", true)
let c = counts / 100.0
print(c)
print(273.15[K] + c * 1[K])
```
```expect
30.0
303.15 K
```
```hint
`int_from_bytes(data, "big", true)` gives 3000.
---
Divide by `100.0` (a float) to get 30.0, then multiply by `1[K]` to make it a quantity.
:::

:::takeaways
- Byte buffers are lists of 0–255; `hex bin bytes decode ord chr`.
- `int_from_bytes(bytes, "big"|"little", signed)` and `int_to_bytes(n, len, order)`.
- Two's complement: subtract `1 << bits` when the top bit is set.
:::
