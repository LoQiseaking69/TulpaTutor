// Rotating learning tips (one per day), each linking to where the idea is taught.
export const TIPS = [
  { text: "Use functions to organize your code and make it reusable.", href: "#/lesson/04-functions-modules/01-functions" },
  { text: "Put units on every physical value: 0.5[m/s] catches mistakes that 0.5 never will.", href: "#/lesson/01-getting-started/04-first-units" },
  { text: "Fix the first error message first; later ones often disappear with it.", href: "#/lesson/01-getting-started/05-reading-errors" },
  { text: "When a value has modes (idle, driving, fault), reach for a machine instead of flags.", href: "#/lesson/05-control-flow/06-state-machines" },
  { text: "A require clause turns a comment like 'must be positive' into a checked fact.", href: "#/lesson/04-functions-modules/04-contracts" },
  { text: "Run timing code on the virtual clock: it's instant, deterministic and still accurate.", href: "#/lesson/08-concurrency-async/03-time" },
  { text: "Clamp every actuator command to its safe range before it reaches the hardware.", href: "#/lesson/02-syntax-basics/01-numbers" },
  { text: "Write an always monitor for the one thing your robot must never do.", href: "#/lesson/06-advanced-features/04-always" },
  { text: "Pattern matching on split() makes serial command parsers short and readable.", href: "#/lesson/05-control-flow/04-match" },
  { text: "Let check() fuzz your contracts: it finds and shrinks the input that breaks them.", href: "#/lesson/06-advanced-features/05-verification" },
  { text: "Debounce buttons with `when ... for 25[ms]` instead of hand-written timers.", href: "#/lesson/08-concurrency-async/05-timing-rules" },
  { text: "Review a little every day: spaced practice beats cramming.", href: "#/practice" },
];
