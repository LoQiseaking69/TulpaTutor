// Example programs for Explore → Examples. Each is run by scripts/check-course.mjs.
export const EXAMPLES = [
  {
    id: "units-tour", title: "Units tour", icon: "sparkle", tags: ["units", "basics"],
    desc: "Quantities, conversions and dimension checks in one screen.",
    code: `# Units are part of every value
let wheel = 65[mm]
let rpm = 180[rpm]
let speed = (wheel / 2) * rpm.to("rad/s") / 1[rad]
print(f"wheel speed: {speed.to("m/s"):.2f} = {speed.to("km/h"):.2f}")

let battery = 2200[mAh]
let current = 850[mA]
print(f"runtime: {(battery / current).to("min"):.0f}")

let power = 12[V] * 1.5[A]
print("power:", power.to("W"), "energy per hour:", (power * 1[h]).to("Wh"))

try { print(wheel + rpm) } catch e { print("caught:", e) }
`,
  },
  {
    id: "door-machine", title: "Smart door controller", icon: "graph", tags: ["machines", "guards"],
    desc: "A guarded state machine with a global e-stop. Open the Machines tab to see it drawn.",
    code: `machine Door(locked = false) {
    on estop => Closed { print("E-STOP") }
    state Closed {
        enter { print("closed") }
        on open if not locked => Open
        on lock => Locked { locked = true }
    }
    state Open {
        exit { print("leaving Open") }
        on close => Closed
    }
    state Locked {
        on unlock(code) if code == 1234 => Closed { locked = false }
    }
}

let d = Door()
d.open()
d.estop()
d.lock()
print("open while locked?", d.open())
print("wrong code?", d.unlock(1111))
print("right code?", d.unlock(1234))
print(d.history)
print(Door.mermaid())
`,
  },
  {
    id: "thermal-safety", title: "Thermal safety loop", icon: "shield", tags: ["signals", "when", "always"],
    desc: "Reactive rules drive a fan; a safety envelope clamps the heater.",
    code: `let temp = signal(295[K])
let fan = GPIO::new(5)
let heater = signal(0.0)
let log = []

when temp.get() > 320[K] { fan.set_high(); log.push("fan on") } else { fan.set_low(); log.push("fan off") }
always not (temp.get() > 340[K] and heater.get() > 0) else { heater.set(0.0); log.push("heater cut") }

heater.set(1.0)
for t in [300, 318, 325, 342, 335, 310] {
    temp.set(t * 1[K])
    tlm::plot("temp", t, millis() / 1000.0)
    sleep(0.5)
}
print(log)
print("fan:", fan.read(), "heater:", heater.get())
`,
  },
  {
    id: "pid-motor", title: "PID speed control", icon: "wave", tags: ["PID", "plot"],
    desc: "A PID controller drives a simulated motor to its setpoint, plotted live.",
    code: `let pid = PID::new(0.08, 0.6, 0.0)
pid.set_limits(-12, 12)
let speed = 0.0
let setpoint = 100.0
let dt = 0.01
for i in 0..300 {
    let volts = pid.update(setpoint, speed, dt)
    speed += (volts * 25 - speed) * dt * 4    # first-order motor model
    tlm::plot("speed", speed, i * dt)
    tlm::plot("setpoint", setpoint, i * dt)
    if i == 150 { setpoint = 60.0 }
}
print(f"final speed {speed:.1f} (setpoint {setpoint})")
`,
  },
  {
    id: "behavior-tree", title: "Pick-and-place behavior tree", icon: "robot", tags: ["std/plan", "autonomy"],
    desc: "A reactive behavior tree with a retry, ticked until it finishes.",
    code: `import "std/plan"

let bb = {estop: false, tries: 0, holding: false}
let grasp = plan.ReactiveSequence([
    plan.Condition("estop clear", |bb| not bb.estop),
    plan.Retry(plan.Sequence([
        plan.Action("reach", |bb| true),
        plan.Action("close gripper", |bb| { bb.tries += 1; bb.tries >= 3 }),
    ], "grasp"), 5),
    plan.Action("lift", |bb| { bb.holding = true; true }),
], "pick")

let status = plan.run_tree(grasp, bb, 0, 20)
print("status:", status, "after", bb.tries, "grasp attempts")
print(grasp.render())
`,
  },
  {
    id: "goap", title: "Goal planning (GOAP)", icon: "map", tags: ["std/plan", "planning"],
    desc: "A* planner finds the cheapest action sequence to reach a goal.",
    code: `import "std/plan"

let p = plan.Planner()
p.action("undock", {docked: true}, {docked: false})
p.action("drive_to_shelf", {docked: false, battery: |b| b >= 20}, {at: "shelf", battery: |b| b - 20}, cost: 2)
p.action("pick", {at: "shelf", holding: false}, {holding: true})
p.action("drive_to_dock", {docked: false}, {at: "dock"}, cost: 2)
p.action("charge", {at: "dock"}, {battery: 100}, cost: 3)

print(p.plan({docked: true, at: "dock", holding: false, battery: 45}, {holding: true}))
print(p.plan({docked: true, at: "dock", holding: false, battery: 10}, {holding: true}))
`,
  },
  {
    id: "rover-world", title: "Autonomous rover", icon: "robot", tags: ["std/world", "machines", "always"],
    desc: "A navigator state machine drives a rover around a pillar to its goal, with a safety envelope.",
    code: `import "std/world"
sim::virtual_time(true)

let w = world.World(dt: 20[ms], seed: 1)
w.arena(4, 2)
w.disc(2.0, 1.0, 0.3)
let r = w.rover(x: 0.3, y: 1.0, max_speed: 0.6[m/s])
let goal = [3.6, 1.0]

fn wrap(a) { atan2(sin(a), cos(a)) }
fn bearing_to(gx, gy) {
    let p = r.position()
    wrap(atan2(gy - p[1].in("m"), gx - p[0].in("m")) - r.yaw().in("rad"))
}

machine Nav {
    state Seek { on blocked => Avoid }
    state Avoid { on done => Bypass }
    state Bypass { on done => Seek; on blocked => Avoid }
}
let nav = Nav()
let hold = 0
let side = 1.0

let forward = 0.0
let saves = 0
always not (forward > 0 and r.range(0[rad], 2[m]) < 0.2[m]) else { forward = 0.0; saves += 1 }

let reached = false
every!(20[ms], 1500, {
    if r.distance_to(goal[0], goal[1]) < 0.15[m] { reached = true; r.stop(); break }
    let front = r.range(0[rad], 2[m])
    let left = r.range(0.7[rad], 2[m])
    let right = r.range(-0.7[rad], 2[m])
    if (nav.is("Seek") or nav.is("Bypass")) and front < 0.45[m] {
        side = if left > right { 1.0 } else { -1.0 }
        hold = 20
        nav.blocked()
    }
    let turn = 0.0
    if nav.is("Seek") { forward = 0.8; turn = clamp(bearing_to(goal[0], goal[1]) * 1.5, -0.8, 0.8) }
    elif nav.is("Avoid") { forward = 0.0; turn = 0.6 * side; hold -= 1; if hold <= 0 { hold = 40; nav.done() } }
    else { forward = 0.7; hold -= 1; if hold <= 0 { nav.done() } }
    r.drive(forward - turn, forward + turn)
    w.step()
    tlm::plot("x [m]", r.position()[0].in("m"), millis() / 1000.0)
    tlm::plot("y [m]", r.position()[1].in("m"), millis() / 1000.0)
})
println!("reached: {} in {:.1} s, bumps {}, safety saves {}", reached, millis() / 1000.0, r.bumps, saves)
`,
  },
  {
    id: "link-pubsub", title: "Tulpa Link pub/sub", icon: "bolt", tags: ["std/link", "middleware"],
    desc: "Two nodes on a simulated network with unit-typed topics.",
    code: `import "std/link"
link.network(latency: 2[ms], jitter: 1[ms], seed: 7)

let rover = link.node("rover")
let speed = rover.advertise("/rover/speed", "[m/s]")
let base = link.node("base")
let seen = base.subscribe("/rover/speed", "[km/h]")

link.spin_for(300[ms])
for v in [0.2, 0.4, 0.6] {
    speed.publish(v * 1[m/s])
    link.spin_for(10[ms])
    print("base sees", seen.latest)
}
`,
  },
  {
    id: "contracts-verify", title: "Contracts + fuzzing", icon: "shield", tags: ["contracts", "verify"],
    desc: "One correct and one buggy function. Open the Verify tab to fuzz them.",
    code: `fn clamp_cmd(v: float) -> float
    ensure -1.0 <= result' and result' <= 1.0
{
    clamp(v, -1.0, 1.0)
}

fn scale_cmd(v: float) -> float
    require -1.0 <= v and v <= 1.0
    ensure -1.0 <= result' and result' <= 1.0
{
    v * 1.5      # bug: can exceed 1.0
}

print(clamp_cmd(3.0), scale_cmd(0.5))
print(check(clamp_cmd, 200).ok)
print(check(scale_cmd, 200).counterexample)
`,
  },
  {
    id: "i2c-sensor", title: "I2C sensor on the sim bus", icon: "chip", tags: ["I2C", "drivers"],
    desc: "Preload registers, then read them the way a real driver would.",
    code: `let imu = I2C::new(1, 0x68)
sim::i2c_set(0x68, 0x75, [0x68])                 # WHO_AM_I
sim::i2c_set(0x68, 0x3B, [0x00, 0x10, 0xFF, 0xF0, 0x40, 0x00])

print("WHO_AM_I:", hex(imu.read_reg(0x75)))
imu.write_reg(0x6B, 0x00)                        # wake up
let raw = imu.read_regs(0x3B, 6)
let g = []
for i in range(0, 6, 2) { g.push(round(int_from_bytes(raw[i..i + 2], "big", true) / 16384.0, 3)) }
print("accel (g):", g)
print("bus log:", len(sim::log()), "transactions")
`,
  },
];
