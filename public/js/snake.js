export const COLS = 11;
export const ROWS = 11;

export function createSnake(cols = COLS, rows = ROWS) {
  return [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
}

// Returns the new head position, or null if it would leave the grid.
export function nextHead(snake, dir, cols = COLS, rows = ROWS) {
  const nx = snake[0].x + dir.x, ny = snake[0].y + dir.y;
  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return null;
  return { x: nx, y: ny };
}

// Checks all segments except the last tail cell (which will vacate on the same tick).
export function collidesWithSelf(snake, pos) {
  for (let i = 0; i < snake.length - 1; i++) {
    if (snake[i].x === pos.x && snake[i].y === pos.y) return true;
  }
  return false;
}

// Prepend head without removing tail — snake grows by one.
export function grow(snake, head) {
  return [head, ...snake];
}

// Prepend head and remove tail — snake moves without growing.
export function advance(snake, head) {
  return [head, ...snake.slice(0, -1)];
}

// Trim or duplicate-tail-pad the snake to reach the target length.
export function trimOrPad(snake, length) {
  if (snake.length === length) return snake;
  if (snake.length > length) return snake.slice(0, length);
  const tail = snake[snake.length - 1];
  return [...snake, ...Array.from({ length: length - snake.length }, () => ({ ...tail }))];
}
