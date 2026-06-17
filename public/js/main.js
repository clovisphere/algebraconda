import { OPS, BIOMES, THRESH, apply, reachable, solveFrom, buildPuzzle } from './puzzle.js';
import { COLS, ROWS, createSnake, nextHead, collidesWithSelf, grow, advance, trimOrPad } from './snake.js';
import { SFX, audioInit, setMuted, isMuted } from './audio.js';
import { layout, renderHUD, renderRibbon, renderGrid, buildDecor, flash, showOverlay, hideOverlay, helpHTML, fitStage } from './ui.js';

const app = document.querySelector('#app');
let G = null, cell = 36, tickTimer = null, secTimer = null, uid = 1;
let best = +(localStorage.getItem('algc_best') || 0);

/* ---------------- board helpers ---------------- */
const rnd = n => Math.floor(Math.random() * n);

function occupied() {
  const s = new Set();
  G.snake.forEach(p => s.add(p.x + ',' + p.y));
  G.tiles.forEach(t => s.add(t.x + ',' + t.y));
  return s;
}

function emptyCell() {
  const occ = occupied();
  for (let tries = 0; tries < 400; tries++) {
    const x = rnd(COLS), y = rnd(ROWS);
    if (!occ.has(x + ',' + y)) return { x, y };
  }
  return null;
}

/* ---------------- tile management ---------------- */
function placeTile(type, value) {
  const pos = emptyCell();
  if (!pos) return null;
  const t = { id: uid++, x: pos.x, y: pos.y, type, value, fresh: true };
  G.tiles.push(t);
  return t;
}

function placeNum(v) {
  if (v === G.target) v = v > 1 ? v - 1 : v + 1;  // a lone number must never equal the target
  return placeTile('num', String(v));
}

const boardNums = () => G.tiles.filter(t => t.type === 'num').map(t => +t.value);

function ensureOps() {
  const have = new Set(G.tiles.filter(t => t.type === 'op').map(t => t.value));
  OPS.forEach(op => { if (!have.has(op)) placeTile('op', op); });
}

// Keep all four operators on the board, plus the biome-specific tools.
function ensureTools() {
  ensureOps();
  const cfg = BIOMES[G.biome];
  if (cfg.eraser && !G.tiles.some(t => t.type === 'eraser')) placeTile('eraser', '⌫');
  if (cfg.parens) {
    if (!G.tiles.some(t => t.type === 'par' && t.value === '(')) placeTile('par', '(');
    if (!G.tiles.some(t => t.type === 'par' && t.value === ')')) placeTile('par', ')');
  }
}

// Guarantee the board remains solvable for the current target.
function ensureSolvable() {
  let guard = 0;
  while (!reachable(totalValue(), boardNums(), G.target, G.biome) && guard++ < 10) {
    const need = solveFrom(totalValue(), G.target, G.biome);
    if (need && need.length) { need.forEach(v => placeNum(v)); break; }
    placeNum(1 + rnd(BIOMES[G.biome].numMax));
  }
}

function buildRound() {
  const cfg = BIOMES[G.biome];
  const { target, numbers } = buildPuzzle(G.biome);
  G.target = target;
  G.timeLeft = cfg.timer;
  G.timerMax = cfg.timer;
  G.tiles = [];
  numbers.forEach(v => placeNum(v));
  // Add a distractor number in harder biomes.
  if (G.biome !== 'garden') {
    let d, guard = 0;
    do { d = 1 + rnd(cfg.numMax); guard++; } while ((d === target || numbers.includes(d)) && guard < 12);
    placeNum(d);
  }
  ensureTools();
  ensureSolvable();
}

/* ---------------- expression state ---------------- */
// The expression lives as a stack of frames. '(' pushes a sub-frame; ')' folds it back.
function clearExpr() { G.frames = [{ tokens: [], acc: null, op: null }]; G.history = []; }
const curFrame = () => G.frames[G.frames.length - 1];

function flatTokens() {
  let out = [];
  G.frames.forEach((f, i) => { if (i > 0) out.push('('); out = out.concat(f.tokens); });
  return out;
}

const totalValue = () => G.frames.length === 1 ? G.frames[0].acc : null;
const isSolved = () => {
  const f = G.frames[0];
  return G.frames.length === 1 && f.op === null && f.acc !== null && Math.abs(f.acc - G.target) < 1e-9;
};

function snapshot() { return { frames: G.frames.map(f => ({ tokens: f.tokens.slice(), acc: f.acc, op: f.op })) }; }
function pushHistory() { G.history.push(snapshot()); if (G.history.length > 50) G.history.shift(); }

/* ---------------- eat handlers ---------------- */
// Latest operator replaces a pending one; latest number replaces the running seed.
function eatOp(op) {
  const f = curFrame();
  if (f.acc === null) return;
  if (f.op !== null) f.tokens[f.tokens.length - 1] = op;
  else f.tokens.push(op);
  f.op = op;
}

function eatNumber(n) {
  const f = curFrame();
  if (f.op !== null && f.acc !== null) {
    const nv = apply(f.acc, f.op, n);
    if (nv !== null) { f.acc = nv; f.op = null; f.tokens.push(String(n)); return; }
    // ÷ not exact — number is wasted but the running total is preserved.
    f.op = null; f.tokens.pop(); return;
  }
  f.acc = n; f.op = null; f.tokens = [String(n)];
}

function eatOpen() {
  const f = curFrame();
  if (!(f.acc === null || f.op !== null)) return;
  G.frames.push({ tokens: [], acc: null, op: null });
}

function eatClose() {
  if (G.frames.length < 2) return;
  const child = curFrame();
  if (child.acc === null || child.op !== null) return;
  G.frames.pop();
  const val = child.acc, p = curFrame();
  if (p.op !== null && p.acc !== null) { const nv = apply(p.acc, p.op, val); p.acc = nv !== null ? nv : val; p.op = null; }
  else p.acc = val;
  p.tokens.push('(', ...child.tokens, ')');
}

/* ---------------- game loop ---------------- */
function render() {
  if (!G) return;
  const ft = flatTokens();
  renderHUD(G);
  renderRibbon({ tokens: ft, total: totalValue(), solved: isSolved(), pendingOp: curFrame().op, openGroups: G.frames.length > 1 });
  renderGrid(G, cell, ft);
  G.noTrans = false;
  G.wrapGhost = null;
}

function schedule() { clearTimeout(tickTimer); if (G.running) tickTimer = setTimeout(step, G.tickMs); }

function step() {
  if (!G.running) return;
  G.dir = G.nextDir;
  const pos = nextHead(G.snake, G.dir, COLS, ROWS);
  if (collidesWithSelf(G.snake, pos)) { crash(); schedule(); return; }
  const head = G.snake[0];
  const isWrap = Math.abs(head.x - pos.x) > 1 || Math.abs(head.y - pos.y) > 1;
  G.wrapGhost = isWrap ? {
    entryFrom: { x: pos.x - G.dir.x, y: pos.y - G.dir.y }, // one cell outside entry wall
    exitFrom:  { x: head.x, y: head.y },                    // old head position
    exitTo:    { x: head.x + G.dir.x, y: head.y + G.dir.y }, // one cell past exit wall
  } : null;
  const ti = G.tiles.findIndex(t => t.x === pos.x && t.y === pos.y);
  if (ti >= 0) { eatTile(ti, pos); schedule(); return; }
  G.snake = advance(G.snake, pos);
  render();
  schedule();
}

function eatTile(ti, pos) {
  const tile = G.tiles.splice(ti, 1)[0];
  G.snake = grow(G.snake, pos);
  if (tile.type === 'eraser') {
    if (G.history.length) { G.frames = G.history.pop().frames; flash('good'); }
    SFX.erase();
    settle(); return;
  }
  pushHistory();
  if (tile.type === 'op')       { eatOp(tile.value); SFX.op(); }
  else if (tile.type === 'par') { tile.value === '(' ? eatOpen() : eatClose(); SFX.op(); }
  else                          { eatNumber(+tile.value); SFX.eat(); }
  settle();
}

function settle() {
  if (isSolved()) { submit(); return; }
  ensureTools();
  if (G.frames.length === 1) ensureSolvable();  // don't restock mid-parenthesis group
  G.snake = trimOrPad(G.snake, 1 + flatTokens().length);
  render();
}

/* ---------------- scoring / lives ---------------- */
function submit() {
  const cfg = BIOMES[G.biome];
  const len = flatTokens().length;
  G.score += cfg.gain + Math.floor(G.timeLeft / 3) + (len > 3 ? 4 : 0);
  G.solved++;
  G.longest = Math.max(G.longest, len);
  if (G.score > best) { best = G.score; localStorage.setItem('algc_best', best); }
  SFX.solve();
  flash('good');
  G.tickMs = Math.max(Math.round(cfg.baseTick * 0.6), G.tickMs - 7);  // speed up on solve
  const head = G.snake[0];
  G.snake = [{ x: head.x, y: head.y }];
  clearExpr();
  buildRound();
  checkProgress();
  render();
}

function loseLife() {
  G.lives--;
  flash('bad');
  G.tickMs = Math.min(BIOMES[G.biome].baseTick, G.tickMs + 14);  // slow down on miss
  if (G.lives <= 0) gameOver();
}

function crash() {
  loseLife();
  if (G.lives <= 0) return;
  SFX.error();
  G.snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
  G.dir = { x: 1, y: 0 }; G.nextDir = { x: 1, y: 0 };
  clearExpr(); G.noTrans = true;
  ensureTools(); ensureSolvable();
  render();
}

function onTimeout() {
  loseLife();
  if (G.lives <= 0) return;
  flash('bad');
  const head = G.snake[0];
  G.snake = [{ x: head.x, y: head.y }];
  clearExpr();
  buildRound();
  render();
}

/* ---------------- second timer ---------------- */
function startSecTimer() {
  clearInterval(secTimer);
  secTimer = setInterval(() => {
    if (!G.running) return;
    G.timeLeft -= 0.1;
    if (G.timeLeft <= 0) { onTimeout(); return; }
    // Lightweight dial update — full render() runs on every tick anyway.
    const frac = Math.max(0, G.timeLeft / G.timerMax);
    document.querySelector('#dial').style.background = `conic-gradient(var(--accent) 0% ${frac * 100}%, var(--dial-empty) ${frac * 100}% 100%)`;
    const sec = Math.max(0, Math.ceil(G.timeLeft));
    document.querySelector('#timeTxt').textContent = '0:' + (sec < 10 ? '0' : '') + sec;
  }, 100);
}

/* ---------------- progression ---------------- */
function checkProgress() {
  if (G.biome === 'garden'   && G.score >= THRESH.twilight) levelUp('twilight');
  if (G.biome === 'twilight' && G.score >= THRESH.inferno)  levelUp('inferno');
}

function applyBiome(b) {
  G.biome = b;
  app.dataset.biome = b;
  const cfg = BIOMES[b];
  G.baseTick = cfg.baseTick; G.tickMs = cfg.baseTick;
  document.querySelector('#biomeName').textContent = cfg.name;
  buildDecor(cfg.deco);
  G.snake = createSnake(COLS, ROWS);
  G.dir = { x: 1, y: 0 }; G.nextDir = { x: 1, y: 0 };
  clearExpr(); G.noTrans = true;
  buildRound();
}

function levelUp(to) {
  pause();
  const titleColor = to === 'inferno' ? 'var(--accent)' : 'var(--target)';
  const abilityHTML = to === 'twilight'
    ? `<div class="ov-ability">
        <div class="ov-kicker">New this world</div>
        <div style="display:flex;gap:8px;justify-content:center;align-items:center;margin-top:10px;">
          <div class="chip p" style="width:42px;height:42px;font-size:22px;">(</div>
          <div class="chip p" style="width:42px;height:42px;font-size:22px;">)</div>
          <div class="box eraser" style="width:42px;height:42px;"><div class="er"></div></div>
        </div>
        <div class="t">Parentheses &amp; the Eraser</div>
        <div class="d">Group your math with <b style="color:var(--target)">( )</b>, and undo a slip with the <b style="color:var(--target)">eraser</b>.</div>
      </div>`
    : `<div class="ov-ability">
        <div class="ov-kicker">Brace yourself</div>
        <div class="t">Huge targets · blazing speed</div>
        <div class="d">Short clock, long snake, four-number solves — lean on <b style="color:var(--target)">( )</b> to land them. <b style="color:var(--target)">Few escape.</b></div>
      </div>`;

  showOverlay(`
    <div class="ov-kicker">${G.biome === 'garden' ? 'Garden' : 'Twilight'} cleared · ${G.score} pts</div>
    <div class="ov-title" style="color:${titleColor}">${to === 'inferno' ? 'INFERNO' : 'Twilight'}</div>
    <div class="ov-sub">${to === 'inferno' ? 'Level 3 · the final descent' : 'A starlit world where the math gets layered'}</div>
    ${abilityHTML}
    <button class="btn btn-play" id="ovGo">${to === 'inferno' ? 'Enter the Inferno' : 'Drift onward'}</button>
  `, to);
  document.querySelector('#ovGo').onclick = () => { hideOverlay(); applyBiome(to); resume(); SFX.level(); };
  SFX.level();
}

/* ---------------- game flow ---------------- */
function startGame() {
  audioInit();
  uid = 1;
  G = {
    biome: 'garden', score: 0, lives: 3, target: 10, timeLeft: 26, timerMax: 26,
    frames: [{ tokens: [], acc: null, op: null }], history: [], snake: [],
    dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, tiles: [],
    tickMs: 160, baseTick: 160, running: false, solved: 0, longest: 0, noTrans: true, wrapGhost: null
  };
  applyBiome('garden');
  app.dataset.screen = 'game';
  hideOverlay();
  (function waitForLayout() {
    if (!document.querySelector('#board').clientWidth) { requestAnimationFrame(waitForLayout); return; }
    cell = layout(COLS, ROWS);
    render();
    G.running = true;
    schedule();
    startSecTimer();
  })();
}

function pause() { if (G) G.running = false; clearTimeout(tickTimer); }
function resume() { if (G) { G.running = true; schedule(); } }

function gameOver() {
  pause();
  SFX.over();
  if (G.score > best) { best = G.score; localStorage.setItem('algc_best', best); }
  showOverlay(`
    <div class="ov-kicker">${G.score > 0 && G.score >= best ? 'New best!' : 'Run complete'}</div>
    <div class="ov-title">Game Over</div>
    <div class="ov-sub">You reached <b style="color:var(--target)">${BIOMES[G.biome].name}</b></div>
    <div class="ov-stats">
      <div class="s"><div class="v">${G.score}</div><div class="l">score</div></div>
      <div class="s"><div class="v">${G.solved}</div><div class="l">solved</div></div>
      <div class="s"><div class="v">${best}</div><div class="l">best</div></div>
    </div>
    <button class="btn btn-play" id="ovAgain">Play again</button>
    <button class="btn btn-ghost" id="ovHome">Home</button>
  `, 'over');
  document.querySelector('#ovAgain').onclick = () => startGame();
  document.querySelector('#ovHome').onclick = () => {
    hideOverlay();
    app.dataset.screen = 'menu';
    document.querySelector('#bestMenu').textContent = best;
  };
}

/* ---------------- input ---------------- */
function setDir(x, y) {
  if (!G || !G.running) return;
  if (G.snake.length > 1 && x === -G.dir.x && y === -G.dir.y) return;
  G.nextDir = { x, y };
}

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

document.addEventListener('keydown', e => {
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  if (map[e.key]) { e.preventDefault(); const [x, y] = DIRS[map[e.key]]; setDir(x, y); }
}, { passive: false });

document.querySelectorAll('.dpad button[data-dir]').forEach(b => {
  b.addEventListener('click', () => { const [x, y] = DIRS[b.dataset.dir]; setDir(x, y); });
});

let tsx = 0, tsy = 0;
document.querySelector('#board').addEventListener('touchstart', e => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
document.querySelector('#board').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
  if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
  Math.abs(dx) > Math.abs(dy) ? setDir(dx > 0 ? 1 : -1, 0) : setDir(0, dy > 0 ? 1 : -1);
}, { passive: true });

/* ---------------- buttons ---------------- */
document.querySelector('#playBtn').onclick = startGame;

document.querySelector('#pauseBtn').onclick = () => {
  if (!G || !G.running) return;
  pause();
  showOverlay(helpHTML('Paused'), 'over');
  document.querySelector('#ovResume').onclick = () => { hideOverlay(); resume(); };
  document.querySelector('#ovQuit').onclick = () => { hideOverlay(); app.dataset.screen = 'menu'; document.querySelector('#bestMenu').textContent = best; };
};

document.querySelector('#helpBtn').onclick = () => {
  showOverlay(helpHTML('How to play'), 'over');
  const c = document.querySelector('#ovClose');
  if (c) c.onclick = hideOverlay;
};

const muteBtn = document.querySelector('#muteBtn');
muteBtn.onclick = () => {
  setMuted(!isMuted());
  muteBtn.textContent = isMuted() ? '♪̸' : '♪';
  muteBtn.style.opacity = isMuted() ? '.5' : '1';
};

window.addEventListener('resize', () => {
  fitStage();
  if (app.dataset.screen === 'game' && G) { cell = layout(COLS, ROWS); render(); }
});

/* ---------------- init ---------------- */
fitStage();
document.querySelector('#bestMenu').textContent = best;
muteBtn.textContent = isMuted() ? '♪̸' : '♪';
muteBtn.style.opacity = isMuted() ? '.5' : '1';
