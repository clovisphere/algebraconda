import { describe, it, expect } from 'bun:test';
import { apply, reachable, buildPuzzle, solveFrom, OPS, BIOMES } from '../public/js/puzzle.js';

describe('apply', () => {
  it('adds', () => expect(apply(3, '+', 4)).toBe(7));
  it('subtracts', () => expect(apply(10, '−', 3)).toBe(7));
  it('multiplies', () => expect(apply(3, '×', 4)).toBe(12));
  it('divides evenly', () => expect(apply(12, '÷', 4)).toBe(3));
  it('returns null for non-integer division', () => expect(apply(10, '÷', 3)).toBeNull());
  it('returns null for division by zero', () => expect(apply(5, '÷', 0)).toBeNull());
});

describe('OPS', () => {
  it('always contains all four operators', () => {
    expect(OPS).toContain('+');
    expect(OPS).toContain('−');
    expect(OPS).toContain('×');
    expect(OPS).toContain('÷');
    expect(OPS).toHaveLength(4);
  });
});

describe('reachable', () => {
  it('finds a one-step addition', () => {
    expect(reachable(null, [5, 3], 8, 'garden')).toBe(true);
  });
  it('finds a one-step multiplication', () => {
    expect(reachable(null, [3, 4], 12, 'garden')).toBe(true);
  });
  it('returns true when target already reached', () => {
    expect(reachable(10, [], 10, 'garden')).toBe(true);
  });
  it('returns false for unreachable target', () => {
    expect(reachable(null, [1], 99, 'garden')).toBe(false);
  });
  it('returns false for empty number list and wrong acc', () => {
    expect(reachable(5, [], 10, 'garden')).toBe(false);
  });
});

describe('buildPuzzle', () => {
  for (const biome of Object.keys(BIOMES)) {
    const { tMin, tMax } = BIOMES[biome];

    it(`${biome}: target is within range [${tMin}, ${tMax}]`, () => {
      const { target } = buildPuzzle(biome);
      expect(target).toBeGreaterThanOrEqual(tMin);
      expect(target).toBeLessThanOrEqual(tMax);
    });

    it(`${biome}: no number tile equals the target`, () => {
      const { target, numbers } = buildPuzzle(biome);
      expect(numbers.every(n => n !== target)).toBe(true);
    });

    it(`${biome}: puzzle is always solvable`, () => {
      const { target, numbers } = buildPuzzle(biome);
      expect(reachable(null, numbers, target, biome)).toBe(true);
    });
  }

  it('generates 10 consecutive solvable puzzles for garden', () => {
    for (let i = 0; i < 10; i++) {
      const { target, numbers } = buildPuzzle('garden');
      expect(reachable(null, numbers, target, 'garden')).toBe(true);
    }
  });
});

describe('solveFrom', () => {
  it('finds a path from null to a simple target', () => {
    const path = solveFrom(null, 6, 'garden');
    expect(path).not.toBeNull();
    expect(path.length).toBeGreaterThan(0);
  });

  it('finds a path from a partial accumulator', () => {
    const path = solveFrom(3, 6, 'garden');
    expect(path).not.toBeNull();
  });

  it('returns empty array when already at target', () => {
    const path = solveFrom(6, 6, 'garden');
    expect(path).toEqual([]);
  });
});
