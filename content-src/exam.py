# Source for web/src/course/exam.json: question pool (20 drawn per sitting) + 3 capstones.
import json, pathlib
Q = []
def q(text, options, answer, explain):
    Q.append(dict(q=text, options=options, answer=answer, explain=explain))

q("What does `print(7 / 2, -7 % 3)` print?", ["`3.5 -1`", "`3 2`", "`3 -1`", "`4 2`"], 1, "Int division is Euclidean and % is never negative.")
q("Which line is a runtime error?", ["`let d = 2[m] + 30[cm]`", "`let v = 3[m] / 2[s]`", "`let x = 2[m] + 1[s]`", "`let r = 5[m] / 2[m]`"], 2, "Adding a length to a time is a unit mismatch.")
q("What is the type of `10[m] / 4[m]`?", ["quantity", "float", "int", "an error"], 1, "Dimensions cancel, leaving a plain float.")
q("`float(3[m])` is…", ["3.0", "0.003", "an error: use `.in(\"m\")` or `.si`", "3000.0"], 2, "Tulpa refuses to guess which unit you mean.")
q("Assigning `count = 1` without `let count` first…", ["creates the variable", "is an error", "is ignored"], 1, "Undeclared assignment is an error, catching typos.")
q("In an *expression* `let s = if a { 1 } … { 2 } else { 3 }`, which keyword chains the middle branch in Tulpa 3.5?", ["`elif`", "`else if`", "`elsif`"], 1, "Expression-form if accepts `else if`; statement form accepts both.")
q("What does `[3, 1, 2].sorted()` do to the original list?", ["sorts it in place", "nothing; it returns a new sorted list", "reverses it"], 1, "`sorted()` returns a new list; `sort()` mutates.")
q("`let a = [1]; let b = a; b.push(2)`. What is `a`?", ["`[1]`", "`[1, 2]`", "an error"], 1, "Lists are shared by reference; use `.copy()`.")
q("In `ensure x' == x + 1`, `x'` means…", ["the initial value", "the final value of parameter x", "the derivative"], 1, "Primed names are final values; `result'` is the return value.")
q("What does `check(f, 300)` use to generate inputs?", ["random strings", "parameter annotations, filtered by `require`", "define_test! blocks"], 1, "It fuzzes from annotations and shrinks counterexamples.")
q("Which construct is edge-triggered?", ["`always`", "`when`", "`while`"], 1, "`when` fires on false→true transitions (else on true→false).")
q("An `always cond else { … }` envelope is violated continuously for 5 checks. How many times does the handler run?", ["5", "1", "0"], 1, "Once per violation; it re-arms when the condition holds again.")
q("A struct field write breaks an invariant and the error is caught. The field afterwards holds…", ["the invalid value", "its previous value", "nil"], 1, "Violating writes are rolled back.")
q("`type(MyStruct())` returns…", ["`\"MyStruct\"`", "`\"object\"`", "`\"struct\"`"], 1, "Use `MyStruct.name()` for the name.")
q("`struct S impl Thermometer` where the method returns `[m]` instead of `[K]`:", ["works", "is rejected when S is defined", "fails at the first call"], 1, "Return units are part of the interface contract.")
q("Which machine transition applies in every state?", ["one declared in the first state", "one declared at machine level, outside states", "one with a guard"], 1, "Machine-level `on` is global, ideal for e-stops.")
q("A machine has no transition for an event in its current state. `m.send(\"x\")` returns…", ["an error", "`false`", "`nil`"], 1, "Unmatched events are ignored and report false.")
q("Two awaited tasks each `sleep(1)`. Total time on the virtual clock?", ["1 s", "2 s", "0 s"], 1, "Tasks are cooperative and run one after another.")
q("An `every!(100[ms], …)` body occasionally takes 250 ms. What happens to the missed ticks?", ["they run back-to-back to catch up", "they are skipped", "the loop stops"], 1, "No catch-up bursts: safer for control.")
q("`when btn.read() == 1 for 25[ms] { … }`: the button reads 1 for 10 ms, 0, then 1 for 40 ms. The body runs…", ["twice", "once, 25 ms into the second press", "never"], 1, "The timer resets when the condition drops.")
q("`after trig within 300[ms] ensure resp` with no else: the response never comes. Result?", ["nothing", "the program stops with a deadline missed error", "a warning"], 1, "Deadlines are fail-stop by default.")
q("A Link publisher advertises `[m/s]`; the subscriber asks for `[km/h]`. It receives `1[m/s]` as…", ["an incompatibility error", "`3.6 km/h`", "`1 km/h`"], 1, "Same dimension: Link converts exactly.")
q("Writing to `GPIO::new(4, \"in\")` with `set_high()`…", ["switches it to an output", "is an error", "is a no-op"], 1, "Writing to an input is an error.")
q("In the simulator, how do you make an input pin read high?", ["`pin.set_high()`", "`sim::gpio_input(pin, 1)`", "`GPIO::new(pin, \"high\")`"], 1, "sim hooks play the outside world.")
q("An SPI `transfer([a, b, c])` returns…", ["one byte", "three bytes received while sending", "nothing"], 1, "SPI is full duplex.")
q("Which PID term removes steady-state error?", ["P", "I", "D"], 1, "The integral accumulates error until it is gone.")
q("Tulpa's PID stops integrating while the output is saturated. This prevents…", ["noise", "integral windup", "drift"], 1, "Anti-windup avoids large overshoot after saturation.")
q("A complementary filter fuses a gyro with an accelerometer because…", ["the gyro is noisy, the accelerometer drifts", "the gyro drifts, the accelerometer is noisy short-term", "accelerometers measure rate"], 1, "Each covers the other's weakness.")
q("A behavior-tree Selector's first child fails and its second succeeds. The Selector returns…", ["FAILURE", "SUCCESS", "RUNNING"], 1, "Selectors are fallbacks.")
q("In `std/plan`'s Mission, what must step handlers do?", ["nothing; the planner applies effects", "update the world with what really happened and return a status", "replan"], 1, "Handlers report reality; the mission replans from it.")
q("Why does the naive avoid-the-pillar rover from the capstone dither?", ["the sensor is too slow", "avoidance and goal-seeking alternate every tick with no committed mode", "the arena is too small"], 1, "A state machine commits to a manoeuvre.")
q("In Tulpa 3.5, which assertion form should you use?", ["`assert!(cond)`", "`assert cond, \"msg\"`", "`assert(cond)`"], 1, "`assert` is a keyword: `assert!(c)` parses as `assert !(c)`.")

CAP = []
def cap(title, prompt, starter, solution, expect=None, check="", hints=()):
    CAP.append(dict(title=title, prompt=prompt, starter=starter.strip("\n"), solution=solution.strip("\n"), expect=expect, check=check.strip("\n"), hints=list(hints)))

cap("Conveyor controller",
    "Write `machine Conveyor` with states `Stopped` (initial), `Running`, `Jammed`. Events: `start` (Stopped→Running), `stop` (Running→Stopped), global `jam` (→Jammed), `clear` (Jammed→Stopped). A motor `GPIO::new(23)` must be high exactly in `Running` (use `enter` actions). Run: start, jam, clear, start and print the state, the motor level and the history.",
    "let motor = GPIO::new(23)\nmachine Conveyor {\n    state Stopped { }\n}\nlet c = Conveyor()\n",
    """
let motor = GPIO::new(23)
machine Conveyor {
    on jam => Jammed
    state Stopped { enter { motor.set_low() }; on start => Running }
    state Running { enter { motor.set_high() }; on stop => Stopped }
    state Jammed { enter { motor.set_low() }; on clear => Stopped }
}
let c = Conveyor()
c.start(); c.jam(); c.clear(); c.start()
print(c.state, motor.read(), c.history)
""", expect='Running 1 ["Stopped", "Running", "Jammed", "Stopped", "Running"]',
    check="c.jam()\nassert_eq!(motor.read(), 0)",
    hints=["Put `on jam => Jammed` at machine level.", "Each state's `enter` sets the motor."])

cap("Unit-safe stopping distance",
    "Write `fn stop_dist(v: [m/s], a: [m/s^2]) -> [m]` returning `v^2 / (2a)` with `require v >= 0` and `require a > 0`, and `ensure result' >= 0`. Print `stop_dist(36[km/h], 5[m/s^2])` and `check(stop_dist, 200).ok`.",
    "fn stop_dist(v, a) {\n    0\n}\n",
    """
fn stop_dist(v: [m/s], a: [m/s^2]) -> [m]
    require v >= 0
    require a > 0
    ensure result' >= 0
{
    v ** 2 / (2 * a)
}
print(stop_dist(36[km/h], 5[m/s^2]))
print(check(stop_dist, 200).ok)
""", expect="10 m\ntrue",
    check='let bad = false\ntry { stop_dist(1[m], 1[m/s^2]) } catch e { bad = true }\nassert bad, "v must be annotated as a speed"',
    hints=["36 km/h is 10 m/s; 10² / (2·5) = 10 m.", "Annotate both parameters and the return type."])

cap("Guarded overheat response",
    "A `temp = signal(300)` and a `fan = GPIO::new(5)`. Add a rule that turns the fan on when temp has been above 330 for **1 s** and off when it drops (else branch), and an envelope `always temp.get() < 360` with a handler that appends \"SHUTDOWN\" to `log`. Simulate: set 335 and sleep 0.5 s, set 320, set 340 and sleep 1.5 s, set 365, set 310 and sleep 0.1. Print `fan.read()` and `log`.",
    "let temp = signal(300)\nlet fan = GPIO::new(5)\nlet log = []\n",
    """
let temp = signal(300)
let fan = GPIO::new(5)
let log = []
when temp.get() > 330 for 1[s] { fan.set_high(); log.push("fan on") } else { fan.set_low(); log.push("fan off") }
always temp.get() < 360 else { log.push("SHUTDOWN") }
temp.set(335); sleep(0.5)
temp.set(320)
temp.set(340); sleep(1.5)
temp.set(365)
temp.set(310); sleep(0.1)
print(fan.read(), log)
""", expect='0 ["fan on", "SHUTDOWN", "fan off"]',
    hints=["`when temp.get() > 330 for 1[s] { … } else { … }`.", "The first 0.5 s spike is too short to turn the fan on."])

pathlib.Path(__file__).resolve().parent.parent.joinpath("web/src/course/exam.json").write_text(json.dumps({"questions": Q, "capstones": CAP}, indent=1))
print(len(Q), "questions,", len(CAP), "capstones")
