---
title: Recursion
minutes: 12
xp: 55
skill: programming
summary: Functions that call themselves, base cases, tree walking and depth limits.
---
A **recursive** function calls itself on a smaller version of the problem. Some problems,
such as trees, nested data and search, are far clearer this way.

## The shape of recursion

Every recursive function needs a **base case** that stops, and a **recursive case** that
moves toward it:

```tulpa
fn factorial(n) {
    if n <= 1 { 1 }            # base case
    else { n * factorial(n - 1) }  # recursive case
}
print(factorial(5), factorial(20))
```

Trace `factorial(3)`: it is `3 * factorial(2)` = `3 * 2 * factorial(1)` = `3 * 2 * 1`.

## Walking nested data

Recursion shines on nested structures. A robot's kinematic chain is a tree of links:

```tulpa
let arm = {name: "base", children: [
    {name: "shoulder", children: [
        {name: "elbow", children: [{name: "wrist", children: []}]},
    ]},
    {name: "camera", children: []},
]}
fn show(node, depth = 0) {
    print("  " * depth + node.name)
    for child in node.children { show(child, depth + 1) }
}
show(arm)
```

```tulpa
fn count_links(node) {
    1 + node.children.map(count_links).sum()
}
let arm = {name: "base", children: [{name: "a", children: [{name: "b", children: []}]}]}
print(count_links(arm))
```

## Search: flood fill on a grid

Finding which cells a robot can reach from a start cell, with `#` as walls:

```tulpa
let grid = ["....#", ".##.#", "...#.", "#...."]
let seen = {}
fn fill(r, c) {
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) { return 0 }
    if grid[r][c] == "#" or f"{r},{c}" in seen { return 0 }
    seen[f"{r},{c}"] = true
    1 + fill(r + 1, c) + fill(r - 1, c) + fill(r, c + 1) + fill(r, c - 1)
}
print("reachable cells:", fill(0, 0))
```

## Depth limits

Each call uses stack space. Tulpa stops runaway recursion with an error instead of
crashing. In the browser the limit is 400 nested calls (2500 on desktop):

```tulpa error
fn forever(n) { forever(n + 1) }
forever(0)
```

For long linear processes, a loop is the better tool. Recursion is for branching structure.

```quiz
? What happens if a recursive function has no base case?
- It returns nil
+ It hits the maximum recursion depth error
- It loops forever silently
> Tulpa reports the depth limit instead of crashing.
? Which problem is most naturally recursive?
- summing a list of 1000 numbers
+ walking a tree of joints
> Recursion fits branching, nested structure.
```

:::exercise Sum of digits
Write a recursive `fn digit_sum(n)` that returns the sum of the decimal digits of a
non-negative int (`digit_sum(1234)` is 10). Use `n % 10` and `n / 10`. Print `digit_sum(98765)`.

Expected: `35`

```tulpa starter
fn digit_sum(n) {
    0
}
print(digit_sum(98765))
```
```tulpa solution
fn digit_sum(n) {
    if n < 10 { n } else { n % 10 + digit_sum(n / 10) }
}
print(digit_sum(98765))
```
```expect
35
```
```check
assert_eq!(digit_sum(0), 0)
assert_eq!(digit_sum(1234), 10)
```
```hint
Base case: a single digit (`n < 10`) is its own sum.
---
Otherwise the last digit is `n % 10`; the rest is `n / 10`.
:::

:::takeaways
- Recursion = base case + recursive case moving toward it.
- Ideal for trees, nested data and search.
- Depth is limited (400 in the browser); use loops for long linear work.
:::
