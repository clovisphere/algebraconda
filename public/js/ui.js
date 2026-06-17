import { OPS } from './puzzle.js';

const $ = s => document.querySelector(s);
const isNum = t => /^\d+$/.test(t);
const isOp = t => OPS.includes(t);

// Resize the board to fill available space; returns the computed cell size in px.
export function layout(COLS, ROWS) {
  const wrap = $('.board-wrap'), b = $('#board');
  const cs = getComputedStyle(wrap);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const availW = wrap.clientWidth - padX, availH = wrap.clientHeight - padY;
  if (availW <= 0 || availH <= 0) return 36;
  const cell = Math.max(16, Math.floor(Math.min(availW / COLS, availH / ROWS)));
  b.style.width = (cell * COLS) + 'px';
  b.style.height = (cell * ROWS) + 'px';
  $('#app').style.setProperty('--cell', cell + 'px');
  return cell;
}

export function renderHUD(G) {
  $('#score').textContent = G.score;
  $('#target').textContent = G.target;

  let hh = '';
  for (let i = 0; i < Math.max(3, G.lives); i++) {
    const on = i < G.lives;
    hh += `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-9.6-9C1 9.2 2.3 6 5.4 6c1.9 0 3.1 1 3.6 2 .5-1 1.7-2 3.6-2 3.1 0 4.4 3.2 2.9 6-2.1 4.1-9.5 9-9.5 9z" fill="${on ? 'var(--heart)' : 'var(--heart-empty)'}"/></svg>`;
  }
  $('#hearts').innerHTML = hh;

  const frac = Math.max(0, G.timeLeft / G.timerMax);
  $('#dial').style.background = `conic-gradient(var(--accent) 0% ${frac * 100}%, var(--dial-empty) ${frac * 100}% 100%)`;
  const sec = Math.max(0, Math.ceil(G.timeLeft));
  $('#timeTxt').textContent = '0:' + (sec < 10 ? '0' : '') + sec;

  const lvl = Math.round((G.baseTick - G.tickMs) / (G.baseTick - G.baseTick * 0.6) * 5);
  const segs = $('#segs').children;
  for (let i = 0; i < segs.length; i++) segs[i].classList.toggle('on', i < Math.max(1, lvl));
  $('#mult').textContent = '×' + (G.baseTick / G.tickMs).toFixed(1);
}

// tokens: the flat display token array
// total: current running value (null if inside open parens)
// solved: whether total === target
// pendingOp: the current frame's pending operator
// openGroups: whether frames.length > 1
export function renderRibbon({ tokens, total, solved, pendingOp, openGroups }) {
  const r = $('#ribbon');
  if (!tokens.length) { r.innerHTML = '<span class="eq-empty">eat a number to begin…</span>'; return; }
  let html = '';
  tokens.forEach((t, i) => {
    const cls = isNum(t) ? 'n' : (t === '(' || t === ')') ? 'p' : 'o';
    const fade = i === tokens.length - 1 && pendingOp !== null && isOp(t);
    html += `<span class="chip ${cls}"${fade ? ' style="opacity:.5"' : ''}>${t}</span>`;
  });
  const valTxt = openGroups ? '…' : (total === null ? '?' : total);
  html += `<span class="eq-sign">=</span><span class="eq-target" style="${solved ? '' : 'background:var(--muted)'}">${valTxt}</span>`;
  r.innerHTML = html;
}

let pool = [];

export function renderGrid(G, cell, tokens) {
  const grid = $('#grid');
  const ents = [];

  G.tiles.forEach(t => {
    let inner;
    if (t.type === 'num')    inner = `<div class="box num">${t.value}</div>`;
    else if (t.type === 'op')  inner = `<div class="box op">${t.value}</div>`;
    else if (t.type === 'par') inner = `<div class="box par">${t.value}</div>`;
    else                       inner = `<div class="box eraser"><div class="er"></div></div>`;
    ents.push({ k: 't' + t.id, x: t.x, y: t.y, html: inner, fresh: t.fresh });
    t.fresh = false;
  });

  // Body segments spell the running expression, most-recent token nearest the head.
  const bodyTokens = tokens.slice().reverse();
  let headHTML = null;
  G.snake.forEach((p, i) => {
    const inner = i === 0
      ? `<div class="box head"><span class="eye l"></span><span class="eye r"></span></div>`
      : `<div class="box seg">${bodyTokens[i - 1] !== undefined ? bodyTokens[i - 1] : ''}</div>`;
    if (i === 0) headHTML = inner;
    const wrapFrom = (i === 0 && G.wrapGhost) ? G.wrapGhost.entryFrom : null;
    ents.push({ k: 's' + i, x: p.x, y: p.y, html: inner, wrapFrom });
  });

  // Exit ghost: a temporary head element that slides off the exit wall and fades out,
  // giving the illusion the snake is traversing rather than teleporting.
  if (G.wrapGhost && headHTML) {
    const { exitFrom, exitTo } = G.wrapGhost;
    const ghost = document.createElement('div');
    ghost.className = 'ent notrans';
    ghost.innerHTML = headHTML;
    ghost.style.transform = `translate(${exitFrom.x * cell}px,${exitFrom.y * cell}px)`;
    grid.appendChild(ghost);
    ghost.offsetWidth; // force reflow
    ghost.classList.remove('notrans');
    ghost.style.transform = `translate(${exitTo.x * cell}px,${exitTo.y * cell}px)`;
    ghost.style.opacity = '0';
    setTimeout(() => ghost.remove(), 120);
  }

  while (pool.length < ents.length) { const e = document.createElement('div'); e.className = 'ent'; grid.appendChild(e); pool.push(e); }
  while (pool.length > ents.length) { pool.pop().remove(); }

  ents.forEach((e, idx) => {
    const el = pool[idx];
    if (e.wrapFrom) {
      el.classList.add('notrans');
      el.style.transform = `translate(${e.wrapFrom.x * cell}px,${e.wrapFrom.y * cell}px)`;
      el.offsetWidth; // force reflow so browser registers the snap before animating
      el.classList.remove('notrans');
    }
    el.style.transform = `translate(${e.x * cell}px,${e.y * cell}px)`;
    el.classList.toggle('notrans', !!G.noTrans);
    if (el._html !== e.html) { el.innerHTML = e.html; el._html = e.html; }
    e.fresh ? el.classList.add('fresh') : el.classList.remove('fresh');
  });
}

export function buildDecor(kind) {
  const d = $('#decor');
  const tree = (pos, flip) => `<div style="position:absolute;${pos};opacity:.5;pointer-events:none;transform:${flip ? 'scaleX(-1)' : 'scale(1)'};">
      <div style="position:relative;width:74px;height:86px;">
        <div style="position:absolute;left:32px;bottom:0;width:10px;height:32px;background:linear-gradient(90deg,#9d6736,#bd824e);border-radius:5px;"></div>
        <div style="position:absolute;left:4px;top:22px;width:40px;height:40px;border-radius:50%;background:linear-gradient(150deg,#7cc79a,#4f9e6e);"></div>
        <div style="position:absolute;right:4px;top:18px;width:44px;height:44px;border-radius:50%;background:linear-gradient(150deg,#8fd2a6,#5fae7e);"></div>
        <div style="position:absolute;left:18px;top:0;width:40px;height:40px;border-radius:50%;background:linear-gradient(150deg,#a9e1bc,#6cba89);"></div>
      </div></div>`;
  const flower = (c, pos) => `<div style="position:absolute;${pos};opacity:.85;pointer-events:none;">
      <div style="position:relative;width:18px;height:18px;">
        <div style="position:absolute;left:5px;top:0;width:7px;height:7px;border-radius:50%;background:${c};"></div>
        <div style="position:absolute;left:0;top:5px;width:7px;height:7px;border-radius:50%;background:${c};"></div>
        <div style="position:absolute;right:0;top:5px;width:7px;height:7px;border-radius:50%;background:${c};"></div>
        <div style="position:absolute;left:3px;bottom:0;width:7px;height:7px;border-radius:50%;background:${c};"></div>
        <div style="position:absolute;right:3px;bottom:0;width:7px;height:7px;border-radius:50%;background:${c};"></div>
        <div style="position:absolute;left:5px;top:5px;width:7px;height:7px;border-radius:50%;background:#ffd34d;"></div>
      </div></div>`;
  const flame = (pos, t) => `<div style="position:absolute;${pos};pointer-events:none;transform:${t};">
      <div style="position:relative;width:26px;height:34px;">
        <div style="position:absolute;left:2px;bottom:0;width:22px;height:22px;background:linear-gradient(135deg,#ffce4d,#ff5630);border-radius:0 50% 50% 50%;transform:rotate(-135deg);box-shadow:0 0 14px rgba(255,86,48,.7);"></div>
        <div style="position:absolute;left:7px;bottom:3px;width:12px;height:12px;background:linear-gradient(135deg,#fff0b0,#ff8a2f);border-radius:0 50% 50% 50%;transform:rotate(-135deg);"></div>
      </div></div>`;

  if (kind === 'garden') {
    d.innerHTML =
      tree('left:-12px;bottom:-10px', false) +
      tree('right:-12px;bottom:-12px', true) +
      flower('#ff9ec4', 'left:24%;bottom:8px') +
      flower('#c9a0e8', 'left:62%;bottom:6px') +
      flower('#ff9472', 'left:44%;bottom:12px');
  } else if (kind === 'twilight') {
    let html = `<div style="position:absolute;top:8px;right:12px;width:34px;height:34px;border-radius:50%;background:#fdf3c4;box-shadow:inset -11px 3px 0 0 var(--board-bg),0 0 20px rgba(253,243,196,.45);"></div>`;
    html += `<div style="position:absolute;bottom:12px;left:10px;width:34px;height:30px;">
        <div style="position:absolute;left:4px;top:4px;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c8b4f7,#7a5bd0);box-shadow:0 0 14px rgba(150,110,230,.5);"></div>
        <div style="position:absolute;left:-4px;top:10px;width:40px;height:10px;border-radius:50%;border:2px solid rgba(205,190,255,.7);transform:rotate(-18deg);"></div></div>`;
    [['12%', '30%', 6], ['78%', '58%', 5], ['30%', '74%', 5], ['60%', '22%', 4], ['86%', '82%', 6]].forEach(([l, t, s]) => {
      html += `<div class="deco-star" style="left:${l};top:${t};width:${s}px;height:${s}px;"></div>`;
    });
    d.innerHTML = html;
  } else {
    let html = flame('left:6px;bottom:-8px', 'scale(1)') +
               flame('right:4px;bottom:-10px', 'scaleX(-1) scale(1.15)') +
               flame('left:46%;bottom:-12px', 'scale(.8)');
    for (let i = 0; i < 4; i++) {
      html += `<div style="position:absolute;left:${10 + i * 24}%;bottom:30px;width:6px;height:6px;border-radius:50%;background:#ff9a5a;box-shadow:0 0 10px #ff5630;animation:ember ${2.4 + i * 0.4}s ease-in ${i * 0.5}s infinite;"></div>`;
    }
    d.innerHTML = html;
  }
}

export function flash(kind) {
  const f = $('#flash');
  f.className = 'flash ' + kind;
  setTimeout(() => { f.className = 'flash'; }, 520);
}

export function showOverlay(html, scrimBiome) {
  const ov = $('#overlay'), card = $('#ovCard');
  card.innerHTML = html;
  ov.querySelector('.scrim').style.background =
    scrimBiome === 'twilight' ? 'radial-gradient(120% 90% at 50% 8%, rgba(58,47,99,.94), rgba(27,22,64,.985))' :
    scrimBiome === 'inferno'  ? 'radial-gradient(120% 80% at 50% 110%, rgba(74,20,8,.94), rgba(22,10,11,.985))' :
    'color-mix(in srgb, var(--screen) 93%, transparent)';
  ov.classList.add('show');
}

export function hideOverlay() { $('#overlay').classList.remove('show'); }

export function helpHTML(title) {
  const paused = title === 'Paused';
  return `<div class="ov-kicker">${paused ? 'paused' : 'how to play'}</div>
    <div class="ov-title" style="font-size:40px">${title}</div>
    <div class="ov-sub" style="text-align:left;max-width:300px;">
      Eat a number, an operator, a number… to build a running total up to the <b style="color:var(--target)">MAKE</b> number — hit it and it auto-scores.<br><br>
      🔁 Only your <b>latest</b> number &amp; operator count — wrong bite? Just eat the right one next.<br>
      🌀 Hitting a wall wraps you to the opposite side — no penalty. Your own tail or the clock running out costs a life.<br>
      🌍 Climb Garden → Twilight → Inferno, where the <b>eraser</b> and <b>( )</b> unlock.
    </div>
    ${paused
      ? `<button class="btn btn-play" id="ovResume">Resume</button><button class="btn btn-ghost" id="ovQuit">Quit to menu</button>`
      : `<button class="btn btn-play" id="ovClose">Got it</button>`}`;
}

export function fitStage() {
  const wide = window.innerWidth >= 900;
  $('#app').classList.toggle('wide', wide);
  const W = wide ? 1160 : 412, H = wide ? 720 : 824;
  const s = Math.min((window.innerWidth - 32) / W, (window.innerHeight - 32) / H, wide ? 1.35 : 1.18);
  $('#app').style.transform = 'scale(' + s + ')';
}
