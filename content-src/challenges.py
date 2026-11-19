# Source for web/src/course/challenges.json (python keeps multi-line Tulpa readable).
import json, pathlib
C = []
def ch(id, title, difficulty, skill, xp, summary, prompt, starter, solution, expect=None, check="", hints=()):
    C.append(dict(id=id, title=title, difficulty=difficulty, skill=skill, xp=xp, summary=summary, prompt=prompt,
                  starter=starter.strip("\n"), solution=solution.strip("\n"), expect=expect, check=check.strip("\n"), hints=list(hints)))

ch("fizzbuzz-units", "FizzBuzz, Robot Edition", 1, "syntax", 40,
   "Classic FizzBuzz, but with sensor names.",
   "For `i` in `1..=15`, print `imu` if divisible by 3, `gps` if by 5, `imu+gps` if by both, otherwise the number. Print everything on **one line** separated by spaces.",
   "let out = []\n# fill out, then print it joined with spaces\n",
   """
let out = []
for i in 1..=15 {
    out.push(if i % 15 == 0 { "imu+gps" } else if i % 3 == 0 { "imu" } else if i % 5 == 0 { "gps" } else { str(i) })
}
print(out.join(" "))
""", expect="1 2 imu 4 gps imu 7 8 imu gps 11 imu 13 14 imu+gps",
   hints=["Test divisibility by 15 first.", "`if ... { } else if ... { }` works inside `push(...)`."])

ch("unit-converter", "Unit Converter", 1, "syntax", 40,
   "Parse '12 km/h' style strings into quantities.",
   "Write `fn parse_q(text)` that splits `\"<number> <unit>\"` and returns `quantity(number, unit)`. Print `parse_q(\"36 km/h\").to(\"m/s\")` and `parse_q(\"2.5 ft\").to(\"cm\")`.",
   "fn parse_q(text) {\n    nil\n}\n",
   """
fn parse_q(text) {
    let parts = text.strip().split(" ")
    quantity(parts[0].to_float(), parts[1])
}
print(parse_q("36 km/h").to("m/s"))
print(parse_q("2.5 ft").to("cm"))
""", expect="10 m/s\n76.2 cm",
   check="assert_eq!(parse_q(\" 1 km \").to(\"m\").value, 1000)",
   hints=["`split(\" \")` then `quantity(parts[0].to_float(), parts[1])`.", "Strip whitespace first so `\" 1 km \"` works."])

ch("ring-buffer", "Ring Buffer", 2, "programming", 60,
   "A fixed-size buffer with an invariant.",
   "Write `struct Ring` with `cap = 4`, `items = []`, an invariant `len(self.items) <= self.cap`, and `push(self, x)` that drops the **oldest** item when full. Also `mean(self)`. Push `1..=6` and print `items` and `mean()`.",
   "struct Ring {\n    cap = 4\n    items = []\n}\n",
   """
struct Ring {
    cap = 4
    items = []
    invariant len(self.items) <= self.cap
    fn push(self, x) {
        let next = self.items + [x]
        if len(next) > self.cap { next = next[1..len(next)] }
        self.items = next
    }
    fn mean(self) { self.items.sum() / float(len(self.items)) }
}
let r = Ring()
for i in 1..=6 { r.push(i) }
print(r.items, r.mean())
""", expect="[3, 4, 5, 6] 4.5",
   check="let q = Ring(cap: 2)\nq.push(9); q.push(8); q.push(7)\nassert_eq!(q.items, [8, 7])",
   hints=["Build the new list first, trim it, then assign: assigning keeps the invariant true at every write.", "Slices need both ends: `next[1..len(next)]`."])

ch("parse-telemetry", "Telemetry Parser", 2, "programming", 60,
   "Turn a key=value frame into typed values.",
   "Write `fn parse(frame)` for frames like `\"v=12.4;i=1.25;mode=AUTO\"` returning a dict where numbers become floats and other values stay strings. Print `parse(...)` for that frame and the power `v * i` rounded to 2 decimals.",
   "fn parse(frame) {\n    {}\n}\n",
   """
fn parse(frame) {
    let d = {}
    for kv in frame.split(";") {
        let p = kv.split("=")
        let v = p[1]
        try { v = p[1].to_float() } catch e { }
        d[p[0]] = v
    }
    d
}
let t = parse("v=12.4;i=1.25;mode=AUTO")
print(t)
print(round(t.v * t.i, 2))
""", expect='{"v": 12.4, "i": 1.25, "mode": "AUTO"}\n15.5',
   check='assert_eq!(parse("a=1;b=x").b, "x")',
   hints=["Split on `;`, then each pair on `=`.", "Try `to_float()` inside `try`, keep the string on failure."])

ch("debounced-counter", "Debounced Counter", 2, "systems", 70,
   "Count real presses, ignore bounces.",
   "A button on pin 6. Count presses that hold for at least **20 ms** using a `when ... for` rule. Simulate: press 5 ms, release 30 ms, press 40 ms, release 30 ms, press 25 ms, release. Print the count.",
   "let btn = GPIO::new(6, \"in\")\nlet presses = 0\n",
   """
let btn = GPIO::new(6, "in")
let presses = 0
when btn.read() == 1 for 20[ms] { presses += 1 }
for step in [[1, 0.005], [0, 0.03], [1, 0.04], [0, 0.03], [1, 0.025], [0, 0.03]] {
    sim::gpio_input(6, step[0])
    sleep(step[1])
}
print(presses)
""", expect="2",
   hints=["`when btn.read() == 1 for 20[ms] { presses += 1 }`.", "Drive the input with `sim::gpio_input(6, level)` and `sleep(seconds)`."])

ch("vending-machine", "Vending Machine", 2, "programming", 70,
   "A state machine with credit and guarded vending.",
   "Write `machine Vend(credit = 0)` with states `Idle` and `Ready`. `coin(c)` adds credit in both states and moves Idle→Ready once credit ≥ 100; `vend()` in Ready subtracts 100 and returns to Idle. Run: coin(50), vend(), coin(25), coin(25), vend(), and print the state and credit.",
   "machine Vend(credit = 0) {\n    state Idle { }\n    state Ready { }\n}\n",
   """
machine Vend(credit = 0) {
    state Idle {
        on coin(c) if credit + c >= 100 => Ready { credit += c }
        on coin(c) { credit += c }
    }
    state Ready {
        on coin(c) { credit += c }
        on vend => Idle { credit -= 100 }
    }
}
let v = Vend()
v.coin(50); v.vend(); v.coin(25); v.coin(25); v.vend()
print(v.state, v.credit)
""", expect="Idle 0",
   check="let w = Vend()\nw.coin(150)\nassert_eq!(w.state, \"Ready\")\nw.vend()\nassert_eq!(w.credit, 50)",
   hints=["Two `on coin(c)` transitions in Idle: a guarded one that goes to Ready, then an internal fallback.", "Guards see the parameter: `if credit + c >= 100`."])

ch("pid-hold", "Hold the Line", 2, "systems", 70,
   "Tune a PID to hold position against a disturbance.",
   "A cart's position follows `vel += (u - 0.5 * vel) * dt; pos += vel * dt` with `dt = 0.01`, and a constant push of `-0.3` is added to `u` (wind). Choose PID gains (limits ±5) so that after 1000 steps `pos` is within 0.02 of the setpoint `1.0`. Print `held`.",
   "let pid = PID::new(1.0, 0.0, 0.0)\npid.set_limits(-5, 5)\nlet pos = 0.0\nlet vel = 0.0\nlet dt = 0.01\nfor i in 0..1000 {\n    let u = pid.update(1.0, pos, dt) - 0.3\n    vel += (u - 0.5 * vel) * dt\n    pos += vel * dt\n}\nprint(if abs(pos - 1.0) < 0.02 { \"held\" } else { f\"off by {pos - 1.0:.3f}\" })\n",
   """
let pid = PID::new(4.0, 1.5, 3.0)
pid.set_limits(-5, 5)
let pos = 0.0
let vel = 0.0
let dt = 0.01
for i in 0..1000 {
    let u = pid.update(1.0, pos, dt) - 0.3
    vel += (u - 0.5 * vel) * dt
    pos += vel * dt
}
print(if abs(pos - 1.0) < 0.02 { "held" } else { f"off by {pos - 1.0:.3f}" })
""", expect="held",
   hints=["A constant disturbance needs an integral term to cancel it.", "The cart has little damping: add derivative gain to stop it oscillating."])

ch("checksum", "Packet Framer", 2, "systems", 60,
   "Frame and verify serial packets.",
   "Write `fn frame(payload)` returning `[0xAA, len(payload)] + payload + [crc]` where `crc` is the XOR of the length and every payload byte, and `fn valid(pkt)`. Print `frame([0x10, 0x20]).hex()`, then `valid` of that frame and of a corrupted copy (last payload byte changed to 0x21).",
   "fn frame(payload) {\n    []\n}\nfn valid(pkt) {\n    false\n}\n",
   """
fn crc(bytes) { bytes.reduce(|a, b| a ^ b) }
fn frame(payload) {
    let body = [len(payload)] + payload
    [0xAA] + body + [crc(body)]
}
fn valid(pkt) {
    pkt[0] == 0xAA and crc(pkt[1..len(pkt) - 1]) == pkt[len(pkt) - 1]
}
let f = frame([0x10, 0x20])
print(f.hex())
let bad = f.copy()
bad[3] = 0x21
print(valid(f), valid(bad))
""", expect="aa 02 10 20 32\ntrue false",
   check="assert valid(frame([1, 2, 3]))",
   hints=["The CRC covers the length byte too: XOR of `[len] + payload`.", "In `valid`, the body is `pkt[1..len(pkt) - 1]`."])

ch("odometry", "Dead Reckoning", 3, "robotics", 90,
   "Integrate wheel encoders into a pose.",
   "A differential robot with wheel base `0.2` m. Given a list of `[dl, dr]` wheel travel increments (metres), integrate the pose with `ds = (dl + dr) / 2`, `dθ = (dr - dl) / 0.2`, `x += ds·cos(θ + dθ/2)`, `y += ds·sin(θ + dθ/2)`, `θ += dθ`. For 10 steps of `[0.1, 0.1]` followed by 10 steps of `[0.0, 0.0314159]`, print x, y (2 decimals) and θ in degrees (rounded to whole).",
   "let x = 0.0\nlet y = 0.0\nlet th = 0.0\n",
   """
let x = 0.0
let y = 0.0
let th = 0.0
let steps = [[0.1, 0.1]; 10] + [[0.0, 0.0314159]; 10]
for s in steps {
    let ds = (s[0] + s[1]) / 2
    let dth = (s[1] - s[0]) / 0.2
    x += ds * cos(th + dth / 2)
    y += ds * sin(th + dth / 2)
    th += dth
}
println!("{:.2} {:.2} {}", x, y, round(degrees(th)))
""", expect="1.10 0.10 90",
   hints=["`[[0.1, 0.1]; 10]` repeats a step ten times; `+` joins lists.", "`degrees(th)` converts radians."])

ch("bt-patrol", "Patrol Tree", 3, "robotics", 90,
   "A behavior tree that patrols waypoints and docks on low battery.",
   "Blackboard: `{battery: 30, wp: 0, visits: []}`. Build a `ReactiveSelector` with (1) a Sequence: Condition `low` (`battery < 20`) then Action `dock` (sets battery 100, pushes \"dock\" to visits); (2) Action `patrol` that pushes `\"wp\" + str(wp)`, advances `wp` modulo 3, drains battery by 6 and returns true. Tick it 8 times and print `visits`.",
   "import \"std/plan\"\nlet bb = {battery: 30, wp: 0, visits: []}\n",
   """
import "std/plan"
let bb = {battery: 30, wp: 0, visits: []}
let tree = plan.ReactiveSelector([
    plan.Sequence([
        plan.Condition("low", |bb| bb.battery < 20),
        plan.Action("dock", |bb| { bb.battery = 100; bb.visits.push("dock"); true }),
    ]),
    plan.Action("patrol", |bb| { bb.visits.push("wp" + str(bb.wp)); bb.wp = (bb.wp + 1) % 3; bb.battery -= 6; true }),
])
for i in 0..8 { tree.tick(bb) }
print(bb.visits)
""", expect='["wp0", "wp1", "dock", "wp2", "wp0", "wp1", "wp2", "wp0"]',
   hints=["30 → 24 → 18: on the third tick the battery is low, so the tree docks.", "A Selector tries its first child (the dock sequence) and falls back to patrol when the condition fails."])

ch("grid-planner", "Grid Path Planner", 3, "robotics", 100,
   "Breadth-first search on an occupancy grid.",
   "Write `fn shortest(grid, start, goal)` returning the number of moves (4-connected) from start to goal avoiding `#`, or `-1`. Use BFS with a queue list. Print the result for the given grid from `[0, 0]` to `[0, 4]`, and to the walled-off cell `[3, 4]`.",
   "let grid = [\"..#..\", \".##.#\", \"....#\", \"#.##.\"]\nfn shortest(grid, start, goal) {\n    -1\n}\n",
   """
let grid = ["..#..", ".##.#", "....#", "#.##."]
fn shortest(grid, start, goal) {
    let rows = len(grid)
    let cols = len(grid[0])
    let dist = {f"{start[0]},{start[1]}": 0}
    let queue = [start]
    let head = 0
    while head < len(queue) {
        let cur = queue[head]
        head += 1
        let d = dist[f"{cur[0]},{cur[1]}"]
        if cur[0] == goal[0] and cur[1] == goal[1] { return d }
        for mv in [[1, 0], [-1, 0], [0, 1], [0, -1]] {
            let r = cur[0] + mv[0]
            let c = cur[1] + mv[1]
            if r < 0 or r >= rows or c < 0 or c >= cols { continue }
            if grid[r][c] == "#" or f"{r},{c}" in dist { continue }
            dist[f"{r},{c}"] = d + 1
            queue.push([r, c])
        }
    }
    -1
}
print(shortest(grid, [0, 0], [0, 4]), shortest(grid, [0, 0], [3, 4]))
""", expect="8 -1",
   hints=["Keep a `head` index into the queue instead of removing from the front.", "Store distances in a dict keyed by `\"r,c\"`."])

ch("safe-arm", "Safe Arm Controller", 3, "programming", 100,
   "Contracts, invariants and an envelope working together.",
   "Write `struct Arm` with `angle = 0` and invariant `-90 <= angle <= 90`, and `fn step_toward(arm, target)` that requires the target within ±90 and moves at most 15 degrees per call. Add `always arm.angle != 77` as a fail-safe (it should never trigger). Starting at 0, call `step_toward(arm, 60)` until it arrives and print the visited angles.",
   "struct Arm {\n    angle = 0\n}\nlet arm = Arm()\n",
   """
struct Arm {
    angle = 0
    invariant -90 <= self.angle and self.angle <= 90
}
let arm = Arm()
fn step_toward(arm, target)
    require -90 <= target and target <= 90
{
    let delta = clamp(target - arm.angle, -15, 15)
    arm.angle = arm.angle + delta
}
always arm.angle != 77
let seen = []
while arm.angle != 60 {
    step_toward(arm, 60)
    seen.push(arm.angle)
}
print(seen)
""", expect="[15, 30, 45, 60]",
   check='let bad = false\ntry { step_toward(arm, 120) } catch e { bad = true }\nassert bad, "targets beyond 90 must violate the precondition"',
   hints=["`clamp(target - arm.angle, -15, 15)` limits each step.", "Put `require -90 <= target and target <= 90` between the parameters and the body."])

ch("link-relay", "Link Relay", 3, "systems", 90,
   "A node that converts and republishes data.",
   "Create nodes `sensor`, `relay` and `ui`. The sensor publishes `/raw` as `\"[mm]\"`; the relay subscribes to `/raw` with a handler that republishes on `/filtered` (`\"[m]\"`) the **average of the last 3 values**; the ui subscribes to `/filtered` in `\"[cm]\"`. Publish 100, 200, 600 mm (spinning 10 ms after each) and print what the ui sees last.",
   "import \"std/link\"\n",
   """
import "std/link"
let sensor = link.node("sensor")
let relay = link.node("relay")
let ui = link.node("ui")
let raw = sensor.advertise("/raw", "[mm]")
let out = relay.advertise("/filtered", "[m]")
let recent = []
relay.subscribe("/raw", "[mm]", |v, meta| {
    recent.push(v)
    if len(recent) > 3 { recent = recent[1..len(recent)] }
    out.publish(recent.reduce(|a, b| a + b) / len(recent))
})
let seen = ui.subscribe("/filtered", "[cm]")
link.spin_for(300[ms])
for v in [100, 200, 600] { raw.publish(v * 1[mm]); link.spin_for(10[ms]) }
print(seen.latest)
""", expect="30 cm",
   hints=["The relay's subscribe handler `|v, meta| { ... }` can call `out.publish(...)`.", "Quantities add with units: the average of 100, 200, 600 mm is 300 mm = 30 cm."])

ch("rover-explore", "Corridor Run", 3, "robotics", 120,
   "Drive the length of a corridor without touching the walls.",
   "In `w.arena(5, 1)` with the rover at `x: 0.3, y: 0.5`, drive to `x ≥ 4.3` m. Keep centred by steering on the difference of the side ranges at ±60°. Print `made it` and the bump count.",
   "import \"std/world\"\nsim::virtual_time(true)\nlet w = world.World(dt: 20[ms], seed: 2)\nw.arena(5, 1)\nlet r = w.rover(x: 0.3, y: 0.5, heading: 0.1[rad], max_speed: 0.6[m/s])\n",
   """
import "std/world"
sim::virtual_time(true)
let w = world.World(dt: 20[ms], seed: 2)
w.arena(5, 1)
let r = w.rover(x: 0.3, y: 0.5, heading: 0.1[rad], max_speed: 0.6[m/s])
let n = 0
while r.position()[0] < 4.3[m] and n < 3000 {
    let l = r.range(60[deg], 2[m]).in("m")
    let rt = r.range(-60[deg], 2[m]).in("m")
    let turn = clamp((l - rt) * 1.5, -0.5, 0.5)
    r.drive(0.7 - turn, 0.7 + turn)
    w.step()
    n += 1
}
print(if r.position()[0] >= 4.3[m] { "made it" } else { "stuck" }, r.bumps)
""", expect="made it 0",
   hints=["If the left wall is farther than the right, steer left: `turn = (left - right) * k`.", "Keep the gain modest and clamp the turn so it doesn't oscillate."])
pathlib.Path(__file__).resolve().parent.parent.joinpath("web/src/course/challenges.json").write_text(json.dumps({"challenges": C}, indent=1))
print(len(C), "challenges")
