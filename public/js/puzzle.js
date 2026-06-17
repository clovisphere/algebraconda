export const OPS = ['+', '−', '×', '÷'];

export const BIOMES = {
  garden:   { name: 'Garden',   numMax: 9,  tMin: 6,  tMax: 24, terms: 2, baseTick: 160, timer: 26, gain: 10, deco: 'garden',   eraser: false, parens: false },
  twilight: { name: 'Twilight', numMax: 12, tMin: 16, tMax: 48, terms: 3, baseTick: 134, timer: 22, gain: 16, deco: 'twilight', eraser: true,  parens: true  },
  inferno:  { name: 'Inferno',  numMax: 12, tMin: 28, tMax: 90, terms: 4, baseTick: 110, timer: 18, gain: 26, deco: 'inferno',  eraser: true,  parens: true  }
};

export const THRESH = { twilight: 100, inferno: 250 };

export function apply(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return (b !== 0 && a % b === 0) ? a / b : null;
  return null;
}

// Can we reach target from acc using the given number multiset (each at most once)?
export function reachable(acc, nums, target, biome) {
  const { tMax } = BIOMES[biome];
  const lo = -50, hi = tMax * 4;
  let budget = 30000;
  function dfs(cur, arr) {
    if (budget-- <= 0) return false;
    if (cur !== null && Math.abs(cur - target) < 1e-9) return true;
    if (!arr.length) return false;
    const tried = new Set();
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (tried.has(v)) continue;
      tried.add(v);
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      if (cur === null) {
        if (dfs(v, rest)) return true;
      } else {
        for (const op of OPS) {
          const nv = apply(cur, op, v);
          if (nv === null || nv < lo || nv > hi) continue;
          if (dfs(nv, rest)) return true;
        }
      }
    }
    return false;
  }
  return dfs(acc, nums.slice());
}

// Find a list of numbers that takes `start` to the target using any operators.
export function solveFrom(start, target, biome) {
  const { numMax, tMax, terms } = BIOMES[biome];
  const hi = tMax * 3;
  let budget = 60000;
  function dfs(cur, depth) {
    if (budget-- <= 0) return null;
    if (Math.abs(cur - target) < 1e-9) return [];
    if (depth <= 0) return null;
    for (let v = 1; v <= numMax; v++) {
      for (const op of OPS) {
        const nv = apply(cur, op, v);
        if (nv === null || nv < 0 || nv > hi) continue;
        const r = dfs(nv, depth - 1);
        if (r) return [v].concat(r);
      }
    }
    return null;
  }
  if (start === null) {
    for (let s = 1; s <= numMax; s++) {
      if (s === target) continue;
      const r = dfs(s, terms);
      if (r) return [s].concat(r);
    }
    return null;
  }
  return dfs(start, terms + 1);
}

// Generate a solvable puzzle: returns { target, numbers }.
// The target is always reachable using the returned numbers and any operators.
export function buildPuzzle(biome) {
  const { numMax, tMin, tMax, terms } = BIOMES[biome];
  let solNums = null, T = null;
  for (let tries = 0; tries < 600 && !solNums; tries++) {
    let cur = 1 + Math.floor(Math.random() * numMax);
    const nums = [cur];
    const k = 2 + Math.floor(Math.random() * (terms - 1));
    let ok = true;
    for (let i = 1; i < k; i++) {
      let placed = false;
      for (let a = 0; a < 10 && !placed; a++) {
        const op = OPS[Math.floor(Math.random() * OPS.length)];
        const v = 1 + Math.floor(Math.random() * numMax);
        const nv = apply(cur, op, v);
        if (nv !== null && nv >= 0 && nv <= tMax * 2) { cur = nv; nums.push(v); placed = true; }
      }
      if (!placed) { ok = false; break; }
    }
    if (ok && Number.isInteger(cur) && cur >= tMin && cur <= tMax && !nums.includes(cur)) {
      solNums = nums; T = cur;
    }
  }
  return solNums ? { target: T, numbers: solNums } : { target: 6, numbers: [3, 3] };
}
