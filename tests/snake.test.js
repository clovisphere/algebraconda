import { describe, it, expect } from 'bun:test';
import { COLS, ROWS, createSnake, nextHead, collidesWithSelf, grow, advance, trimOrPad } from '../public/js/snake.js';

describe('createSnake', () => {
  it('starts at the center of the grid', () => {
    const snake = createSnake(COLS, ROWS);
    expect(snake).toHaveLength(1);
    expect(snake[0]).toEqual({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) });
  });

  it('works with custom dimensions', () => {
    const snake = createSnake(10, 8);
    expect(snake[0]).toEqual({ x: 5, y: 4 });
  });
});

describe('nextHead — movement', () => {
  it('moves right', () => {
    expect(nextHead([{ x: 5, y: 5 }], { x: 1, y: 0 }, COLS, ROWS)).toEqual({ x: 6, y: 5 });
  });
  it('moves left', () => {
    expect(nextHead([{ x: 5, y: 5 }], { x: -1, y: 0 }, COLS, ROWS)).toEqual({ x: 4, y: 5 });
  });
  it('moves up', () => {
    expect(nextHead([{ x: 5, y: 5 }], { x: 0, y: -1 }, COLS, ROWS)).toEqual({ x: 5, y: 4 });
  });
  it('moves down', () => {
    expect(nextHead([{ x: 5, y: 5 }], { x: 0, y: 1 }, COLS, ROWS)).toEqual({ x: 5, y: 6 });
  });
});

describe('nextHead — wall collisions', () => {
  it('returns null at right wall', () => {
    expect(nextHead([{ x: COLS - 1, y: 5 }], { x: 1, y: 0 }, COLS, ROWS)).toBeNull();
  });
  it('returns null at left wall', () => {
    expect(nextHead([{ x: 0, y: 5 }], { x: -1, y: 0 }, COLS, ROWS)).toBeNull();
  });
  it('returns null at top wall', () => {
    expect(nextHead([{ x: 5, y: 0 }], { x: 0, y: -1 }, COLS, ROWS)).toBeNull();
  });
  it('returns null at bottom wall', () => {
    expect(nextHead([{ x: 5, y: ROWS - 1 }], { x: 0, y: 1 }, COLS, ROWS)).toBeNull();
  });
  it('does not wrap — step just inside right wall is valid', () => {
    expect(nextHead([{ x: COLS - 2, y: 5 }], { x: 1, y: 0 }, COLS, ROWS)).toEqual({ x: COLS - 1, y: 5 });
  });
});

describe('collidesWithSelf', () => {
  it('detects overlap with a body segment', () => {
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    expect(collidesWithSelf(snake, { x: 4, y: 5 })).toBe(true);
  });

  it('does not flag the last tail segment (it vacates on the same tick)', () => {
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    expect(collidesWithSelf(snake, { x: 4, y: 5 })).toBe(false);
  });

  it('returns false for a single-cell snake', () => {
    expect(collidesWithSelf([{ x: 5, y: 5 }], { x: 5, y: 5 })).toBe(false);
  });
});

describe('grow', () => {
  it('prepends the new head without removing the tail', () => {
    const snake = [{ x: 5, y: 5 }];
    const grown = grow(snake, { x: 6, y: 5 });
    expect(grown).toHaveLength(2);
    expect(grown[0]).toEqual({ x: 6, y: 5 });
    expect(grown[1]).toEqual({ x: 5, y: 5 });
  });

  it('does not mutate the original array', () => {
    const snake = [{ x: 5, y: 5 }];
    grow(snake, { x: 6, y: 5 });
    expect(snake).toHaveLength(1);
  });
});

describe('advance', () => {
  it('prepends head and removes tail', () => {
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    const moved = advance(snake, { x: 6, y: 5 });
    expect(moved).toHaveLength(2);
    expect(moved[0]).toEqual({ x: 6, y: 5 });
    expect(moved[1]).toEqual({ x: 5, y: 5 });
  });

  it('does not mutate the original array', () => {
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    advance(snake, { x: 6, y: 5 });
    expect(snake).toHaveLength(2);
  });
});

describe('trimOrPad', () => {
  it('trims to a shorter length', () => {
    const snake = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];
    expect(trimOrPad(snake, 2)).toHaveLength(2);
  });

  it('keeps the head when trimming', () => {
    const snake = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];
    expect(trimOrPad(snake, 1)[0]).toEqual({ x: 1, y: 1 });
  });

  it('pads by duplicating the tail', () => {
    const snake = [{ x: 1, y: 1 }];
    const padded = trimOrPad(snake, 3);
    expect(padded).toHaveLength(3);
    expect(padded[1]).toEqual({ x: 1, y: 1 });
    expect(padded[2]).toEqual({ x: 1, y: 1 });
  });

  it('returns the same array unchanged if length matches', () => {
    const snake = [{ x: 1, y: 1 }, { x: 2, y: 1 }];
    expect(trimOrPad(snake, 2)).toBe(snake);
  });
});
