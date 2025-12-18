# Game Engine Agent

## Role
Specialist worker agent for implementing the core game loop, physics, and timing systems.

## Responsibilities
- Implement fixed timestep game loop
- Handle game state management (playing, paused, game-over)
- Coordinate entity updates
- Manage frame timing and delta time

## Key Files
- `src/game.js` - Main Game class
- `src/constants.js` - Timing constants

## Implementation Guidelines

### Game Loop Pattern
```javascript
// Use fixed timestep with interpolation
const TICK_RATE = 1000 / 60; // 60 updates per second
let lastTime = 0;
let accumulator = 0;

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulator += deltaTime;

  while (accumulator >= TICK_RATE) {
    update(TICK_RATE);
    accumulator -= TICK_RATE;
  }

  render(accumulator / TICK_RATE); // interpolation alpha
  requestAnimationFrame(gameLoop);
}
```

### State Machine
```javascript
const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  LEVEL_COMPLETE: 'levelcomplete'
};
```

## Quality Checklist
- [ ] Game runs at stable 60 FPS
- [ ] Pause/resume works correctly
- [ ] State transitions are clean
- [ ] No memory leaks in game loop
- [ ] Delta time is properly calculated
