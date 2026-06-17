# Agent & Developer Guide

Algebraconda is a browser-based Snake game where players collect numbers and operators to hit a target value — the **Magic Number**.

---

## Stack

- HTML · CSS · Vanilla JavaScript (ES2020+) · ES Modules
- **Bun** — dev server and test runner only; not part of the game architecture

```bash
bun server.js   # http://localhost:3000
bun test
```

No frameworks. No build step. Runs as static files.

---

## Project Structure

```
index.html          # shell — loads CSS and the main JS module
server.js           # minimal Bun static file server
public/
  css/style.css     # all styles; biome theme tokens via CSS custom properties
  js/
    main.js         # game engine — loop, state, tiles, expression eval, input, flow
    puzzle.js       # puzzle system — Magic Number gen, solvability, arithmetic
    snake.js        # snake — movement, collision, grow/advance/trim
    ui.js           # rendering — HUD, ribbon, grid, overlays, decor
    audio.js        # Web Audio sound effects
tests/
  puzzle.test.js
  snake.test.js
```

---

## Architecture

Concerns are separated across four modules. **UI code must not contain puzzle-generation logic.**

### `puzzle.js` — Puzzle System
- Magic Number generation
- Number and operator generation
- Equation validation (`apply`)
- Solvability checks (`reachable`, `solveFrom`)

### `snake.js` — Snake
- Movement (`nextHead`, `advance`)
- Growth (`grow`)
- Collision detection (`collidesWithSelf`)
- Position tracking

### `main.js` — Game Engine
- Game loop and timing
- Tile placement and board management
- Running-total expression state (frame stack)
- Win/loss conditions and progression
- Input handling (keyboard, d-pad, swipe)

### `ui.js` — UI
- Board and grid rendering
- HUD (score, timer, hearts, speed)
- Equation ribbon
- Overlays (pause, level-up, game over, help)
- Biome decorations

---

## Gameplay Invariants

These must always hold.

**Board boundaries** — Every tile spawns fully inside the grid, never on the snake.

**Active selection** — Only the latest collected number and operator are active. Eating a new `×` replaces a pending `+`; eating `3` replaces a pending `7`.

**Operator availability** — All four operators (`+` `−` `×` `÷`) are always present on the board and respawn when eaten.

**Puzzle validity** — Every round is generated from a real arithmetic sequence, so the Magic Number is always reachable with the tiles on the board.

---

## Engineering Principles

- Prefer straightforward code. Avoid indirection and premature abstractions.
- Three similar lines beat a helper used once.
- Keep files focused and functions small.
- Prefer plain objects and arrays over classes.
- `const` over `let`; never `var`.
- Comments explain **why**, not what.

---

## Testing

Tests live in `tests/` and use `bun:test`. They validate **game invariants**, not UI or implementation details.

```bash
bun test
```

Cover: arithmetic correctness, puzzle solvability, snake movement, collision detection, boundary invariants.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>[(<scope>)][!]: <subject>
```

Types: `feat` `fix` `chore` `test` `docs` `style` `refactor` `perf` `ci` `build` `revert`

Subject: imperative mood, no period, 72 chars max including type and scope.

---

## Non-Goals

Do not add unless explicitly requested: backend services, user accounts, multiplayer, databases, analytics, or large third-party dependencies.
