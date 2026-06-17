```
,---.|              |                                 |     
|---||    ,---.,---.|---.,---.,---.,---.,---.,---.,---|,---.
|   ||    |   ||---'|   ||    ,---||    |   ||   ||   |,---|
`   '`---'`---|`---'`---'`    `---^`---'`---'`   '`---'`---^
          `---'                                             
```

> A browser-based Snake game where you slither through a grid collecting numbers and operators to hit a target value.

Navigate a hungry serpent through a grid of numbers and operators, collecting the pieces needed to build an equation that matches the **Magic Number**.

Unlike traditional Snake, success isn't measured by length alone — every move is a mathematical decision.

## Gameplay

Each round presents a **Magic Number** (the target) and a board scattered with numbers and operators (`+` `−` `×` `÷`). Guide the snake to collect them and build a running equation that hits the target exactly.

The moment your equation equals the Magic Number, it auto-scores and a new round begins.

**Example** — Target: `24`

Collect `6`, then `×`, then `4` → `6 × 4 = 24` ✓

### Rules

- Collect a number, an operator, a number… to build a running total.
- Only your **latest** number and operator count — eat a better one to replace it.
- Hitting a wall, biting your own tail, or letting the clock expire each costs a life.
- Three lives per run.

### Progression

| Biome | Unlocks at | New tools |
|-------|-----------|-----------|
| 🌿 Garden | Start | `+` `−` `×` `÷` |
| 🌌 Twilight | 100 pts | Parentheses `( )` · Eraser |
| 🔥 Inferno | 250 pts | Bigger targets · blazing speed |

Speed increases with every solve and drops on a miss.

## Getting Started

```bash
bun server.js   # serve at http://localhost:3000
bun test        # run the test suite
```

Requires [Bun](https://bun.sh). No other dependencies.

## Inspiration

- Classic Snake
- *Des Chiffres et des Lettres* (the numbers round)
- Mental arithmetic puzzle games
