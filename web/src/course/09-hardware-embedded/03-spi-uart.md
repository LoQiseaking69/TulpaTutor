---
title: SPI and UART
minutes: 16
xp: 70
skill: systems
summary: Full-duplex SPI transfers for ADCs, and serial UART lines for GPS, modems and motor controllers.
---
Two more workhorse interfaces: **SPI** is fast and full-duplex (ADCs, displays, flash);
**UART** is the classic serial line (GPS modules, modems, motor controllers, debug
consoles).

## SPI: transfer

Every SPI transfer sends and receives at the same time: you clock out bytes on MOSI and
read back the same number on MISO. By default the simulator loops MOSI back to MISO:

```tulpa
let spi = SPI::new(0, 0)          # /dev/spidev0.0
spi.set_mode(0)
spi.set_speed(1_000_000)
print(spi.transfer([0xDE, 0xAD]))
```

## Reading an MCP3008 ADC

The MCP3008 is a 10-bit, 8-channel ADC. You send a start bit, the channel, and a padding
byte; the reply's last 10 bits are the reading. `sim::spi_respond` plays the chip:

```tulpa
let adc = SPI::new(0, 0)
fn read_channel(ch) {
    let r = adc.transfer([0x01, (0x08 | ch) << 4, 0x00])
    ((r[1] & 0x03) << 8) | r[2]
}
sim::spi_respond(0, 0, [0x00, 0x02, 0x9A])
let raw = read_channel(0)
print("raw", raw, "->", round(raw / 1023.0 * 3.3, 3), "V")
```

## UART: lines and bytes

```tulpa
let port = UART::new("/dev/serial0", 115200)
port.send_line("AT")                 # appends \r\n
print(repr(port.read_line(100)))     # loopback by default
port.send("raw bytes")
print(repr(port.read_text()))
```

## Playing the remote device

Turn loopback off and inject what the other side would send with `sim::uart_feed`;
`sim::uart_sent` returns what your program transmitted:

```tulpa
let gps = UART::new("/dev/ttyS1", 9600)
sim::uart_loopback("/dev/ttyS1", false)
sim::uart_feed("/dev/ttyS1", "$GPGGA,123519,4807.038,N,01131.000,E\r\n")
let line = gps.read_line(1000)
let f = line.split(",")
print("time", f[1], "lat", f[2], f[3], "lon", f[4], f[5])
print("bytes waiting:", gps.available())
```

## A command/response protocol

Talking to a motor controller that answers `OK` or `ERR`:

```tulpa
let mc = UART::new("/dev/ttyUSB0", 115200)
sim::uart_loopback("/dev/ttyUSB0", false)
fn command(cmd) {
    mc.send_line(cmd)
    let reply = mc.read_line(200)
    if reply == nil { error(f"{cmd}: timeout") }
    if reply != "OK" { error(f"{cmd}: {reply}") }
}
sim::uart_feed("/dev/ttyUSB0", "OK\r\nERR overcurrent\r\n")
command("SPEED 50")
print("speed set")
try { command("SPEED 99") } catch e { print("failed ->", e) }
print("sent:", decode(sim::uart_sent("/dev/ttyUSB0")).replace("\r\n", " | "))
```

`read_line(timeout_ms)` returns `nil` on timeout, so a silent device is detected rather than
hanging the robot.

```quiz
? In SPI, how many bytes do you receive from `transfer([a, b, c])`?
+ 3, received while the 3 are sent
- 1
- it depends on the device
> SPI is full duplex.
? What does `read_line(200)` return if nothing arrives in 200 ms?
- an empty string
+ `nil`
- it raises an error
> nil signals a timeout.
```

:::exercise NMEA checksum
NMEA sentences end with `*HH`: the XOR of every character between `$` and `*`, in hex. Feed
`"$GPTXT,OK*67\r\n"`, read the line, compute the XOR of the characters of `GPTXT,OK`, and print
whether it matches the transmitted checksum, then the checksum in upper-case hex.

Expected: `true 0x67`

```tulpa starter
let gps = UART::new("/dev/ttyS0", 9600)
sim::uart_loopback("/dev/ttyS0", false)
sim::uart_feed("/dev/ttyS0", "$GPTXT,OK*67\r\n")
```
```tulpa solution
let gps = UART::new("/dev/ttyS0", 9600)
sim::uart_loopback("/dev/ttyS0", false)
sim::uart_feed("/dev/ttyS0", "$GPTXT,OK*67\r\n")
let line = gps.read_line(1000)
let body = line.split("*")[0].replace("$", "")
let sum = bytes(body).reduce(|a, b| a ^ b)
let given = int("0x" + line.split("*")[1])
print(sum == given, "0x" + format(sum, "02x").upper())
```
```expect
true 0x67
```
```hint
`line.split("*")` separates the body and the checksum; strip the `$`.
---
`bytes(body).reduce(|a, b| a ^ b)` XORs the characters; `int("0x67")` parses hex.
:::

:::takeaways
- `SPI::new(bus, cs)`: `transfer` is full duplex; `sim::spi_respond` plays the chip.
- `UART::new(port, baud)`: `send send_line read_line(timeout) read_text available`.
- `sim::uart_loopback(port, false)` + `sim::uart_feed` play the remote end; `read_line` returns nil on timeout.
:::
