---
title: Tulpa Link: Robotics Middleware
minutes: 18
xp: 75
skill: systems
summary: Nodes, unit-typed topics, records, services, parameters and simulated networks.
---
A robot is a distributed system: drive controller, arm, sensors, base station. **Tulpa
Link** (`std/link`) connects them. It is Tulpa's own middleware, not a ROS 2 clone: no
broker, no IDL files, no code generation, and **units are part of every topic's type**.

## Nodes and topics

```tulpa
import "std/link"

let rover = link.node("rover")
let speed = rover.advertise("/rover/speed", "[m/s]")

let base = link.node("base")
let seen = base.subscribe("/rover/speed", "[km/h]")

link.spin_for(300[ms])          # let the nodes discover each other
speed.publish(0.4[m/s])
link.spin_for(10[ms])
print(seen.latest, "from", seen.from)
```

The publisher speaks metres per second, the subscriber asked for km/h, and Link converted
exactly. Values travel in SI.

## Types are enforced

Publishing the wrong dimension is an error at `publish`:

```tulpa error
import "std/link"
let n = link.node("rover")
let speed = n.advertise("/rover/speed", "[m/s]")
speed.publish(3[m])
```

Schemas can be types (`"int" "float" "bool" "str"`), units, lists (`["[m]"]`) or records:

```tulpa
import "std/link"
let arm = link.node("arm")
let base = link.node("base")
let pose = arm.advertise("/arm/pose", {x: "[m]", ok: "bool"})
let sub = base.subscribe("/arm/pose", {x: "[cm]", ok: "bool"}, |v, meta| print("  received", v))
link.spin_for(300[ms])
pose.publish({x: 0.25[m], ok: true})
link.spin_for(10[ms])
print("count:", sub.count)
```

The third argument is an optional handler called with each value.

## Services and parameters

Request/response calls and typed, remotely settable parameters:

```tulpa
import "std/link"
let arm = link.node("arm")
let base = link.node("base")
arm.serve("/arm/home", |req| { print("  arm: homing"); "ok" })
arm.param("speed_limit", 1.5[m/s])
link.spin_for(300[ms])

print("home ->", base.call("/arm/home", nil, timeout: 2[s]))
base.set_param("arm", "speed_limit", 1[m/s])
print("limit ->", base.get_param("arm", "speed_limit"))
try { base.set_param("arm", "speed_limit", 1[m]) } catch e { print("rejected wrong unit") }
```

## A simulated network

By default every node shares a deterministic in-process network on the virtual clock. Shape
it with latency, jitter and loss to test how your system behaves on a bad Wi-Fi link:

```tulpa
import "std/link"
link.network(latency: 20[ms], jitter: 5[ms], loss: 0.3, seed: 7)
let a = link.node("sensor")
let b = link.node("logger")
let t = a.advertise("/temp", "float")
let s = b.subscribe("/temp", "float")
link.spin_for(300[ms])
for i in 0..20 { t.publish(20.0 + i); link.spin_for(50[ms]) }
print("published 20, received", s.count, "with 30% loss")
```

Set `TULPA_LINK=udp` on a computer and the same program talks over real UDP sockets, with
nodes discovering each other on the LAN.

## QoS in one table

| Option | Effect |
|---|---|
| default (best effort) | late/duplicate messages dropped: sensor streams |
| `reliable: true` | every message, in order, with resends |
| `latched: true` | late joiners get the last value: maps, config |
| `deadline: 100[ms]` | a deadline event if the stream goes quiet |

Every subscription also exposes `.signal`, so `when` rules and `always` envelopes can watch
data from another machine, for example stopping the rover if the base's speed limit is
violated.

```quiz
? A publisher advertises `[m/s]`, a subscriber `[km/h]`. Publishing `1[m/s]` gives the subscriber:
- an incompatibility error
+ `3.6 km/h`
> Same dimension, different units: Link converts.
? What is needed to run the same Link program over a real network?
+ set TULPA_LINK=udp (no code changes)
- rewrite it with sockets
> The transport is a configuration choice.
```

:::exercise Battery telemetry
Create nodes `robot` and `ground`. The robot advertises `/battery` with schema `"[V]"`; the
ground subscribes in `"[mV]"`. After discovery (`spin_for(300[ms])`), publish `11.7[V]`, spin
10 ms, and print the ground's latest value.

Expected: `11700 mV`

```tulpa starter
import "std/link"
```
```tulpa solution
import "std/link"
let robot = link.node("robot")
let ground = link.node("ground")
let bat = robot.advertise("/battery", "[V]")
let seen = ground.subscribe("/battery", "[mV]")
link.spin_for(300[ms])
bat.publish(11.7[V])
link.spin_for(10[ms])
print(seen.latest)
```
```expect
11700 mV
```
```hint
`robot.advertise("/battery", "[V]")` and `ground.subscribe("/battery", "[mV]")`, then `seen.latest`.
:::

:::takeaways
- `link.node`, `advertise(topic, schema)`, `subscribe(topic, schema, handler)`, `spin_for`.
- Schemas: types, units, lists, records; wrong types fail at publish; units convert.
- `serve`/`call`, `param`/`get_param`/`set_param`; `link.network(...)` shapes the sim network.
:::
