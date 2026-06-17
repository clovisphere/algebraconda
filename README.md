```
,---.|              |                                 |     
|---||    ,---.,---.|---.,---.,---.,---.,---.,---.,---|,---.
|   ||    |   ||---'|   ||    ,---||    |   ||   ||   |,---|
`   '`---'`---|`---'`---'`    `---^`---'`---'`   '`---'`---^
          `---'                                             
```

[![Tests](https://github.com/clovisphere/algebraconda/actions/workflows/test.yml/badge.svg)](https://github.com/clovisphere/algebraconda/actions)
[![Release](https://github.com/clovisphere/algebraconda/actions/workflows/release.yml/badge.svg)](https://github.com/clovisphere/algebraconda/actions/workflows/release.yml)
[![Docker](https://github.com/clovisphere/algebraconda/actions/workflows/docker.yml/badge.svg)](https://github.com/clovisphere/algebraconda/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.2-black?logo=bun)](https://bun.sh)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2020-yellow?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

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

## Tech stack

| | |
|---|---|
| Language | Vanilla JavaScript (ES2020+, ES Modules) |
| Rendering | HTML · CSS (no framework) |
| Runtime | [Bun](https://bun.sh) — dev server and test runner |
| Tests | `bun:test` |
| Container | Docker |

## Run locally

**With Bun** — requires [Bun](https://bun.sh):

```bash
bun server.js
```

**With Docker:**

```bash
make run   # builds the image and starts the container
make stop  # stop and remove the container
```

Open [http://localhost:3000](http://localhost:3000).

## Run tests

```bash
bun test
# or
make test
```

## TODO

- [ ] End-to-end tests (Playwright)
- [x] App versioning and release manifest
- [x] CI/CD pipeline (GitHub Actions — run tests, build and push image to Docker Hub; release triggered on merge to `main`)
- [x] Custom favicon
- [ ] PWA support
- [ ] Rethink layout for larger screens — current design is mobile-first and feels cramped on desktop

## Inspiration

This project draws inspiration from:

- Classic Snake and its simple, highly replayable gameplay loop
- [Des Chiffres et des Lettres](https://www.france.tv/france-3/des-chiffres-et-des-lettres/) (specifically the numbers round), where players combine arithmetic operations to reach a target value
- Mental arithmetic and number-puzzle games that reward pattern recognition, strategy, and quick thinking
