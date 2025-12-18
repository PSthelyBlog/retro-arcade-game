# AGENTS.md - Retro Arcade Game

> This file provides context and instructions for AI agents working on this project.
> Following the [AGENTS.md](https://agents.md/) standard for multi-agent collaboration.

## Project Overview

**Retro Arcade Game** is a browser-based Space Invaders clone built with vanilla JavaScript and HTML5 Canvas. The project demonstrates the lead/worker pattern for AI-assisted development using goose with Claude Code.

### Tech Stack
- **Language**: JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API
- **Build**: Vite
- **Testing**: Vitest
- **Linting**: ESLint
- **Style**: Retro pixel-art aesthetic

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Game Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  index.html                                                  │
│     └── main.js (entry point)                               │
│            └── Game class (orchestrator)                    │
│                   ├── Renderer (canvas drawing)             │
│                   ├── InputHandler (keyboard events)        │
│                   ├── Player (ship entity)                  │
│                   ├── EnemyManager (alien formations)       │
│                   ├── ProjectileManager (bullets)           │
│                   ├── CollisionDetector                     │
│                   ├── ScoreManager                          │
│                   └── SoundManager (8-bit audio)            │
└─────────────────────────────────────────────────────────────┘
```

## Lead/Worker Pattern

This project is scaffolded using the **lead/worker multi-agent pattern**:

### Lead Agent (Opus 4)
- **Role**: Orchestrates scaffolding, makes architectural decisions
- **Responsibilities**:
  - Project structure design
  - Code review coordination
  - Integration decisions
  - Final quality assurance

### Worker Agents (Haiku 4 / Sonnet 4)
- **game-engine-agent**: Implements game loop, physics, collision detection
- **renderer-agent**: Canvas rendering, sprite drawing, animations
- **entity-agent**: Player, enemies, projectiles, power-ups
- **audio-agent**: Sound effects, background music (Web Audio API)
- **test-agent**: Unit tests, integration tests, coverage
- **docs-agent**: README, API docs, inline comments

## Code Conventions

### File Naming
- Use `kebab-case.js` for file names
- Use `PascalCase` for class names
- Use `camelCase` for functions and variables

### Module Structure
```javascript
// Each module should follow this structure:
// 1. Imports
// 2. Constants
// 3. Class/function definitions
// 4. Exports

import { CONSTANTS } from './constants.js';

const LOCAL_CONSTANT = 42;

export class MyClass {
  constructor() { /* ... */ }
}
```

### Game Constants
All magic numbers should be defined in `src/constants.js`:
```javascript
export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  FPS: 60,
  TICK_RATE: 1000 / 60
};

export const PLAYER = {
  SPEED: 5,
  LIVES: 3,
  WIDTH: 40,
  HEIGHT: 30
};

export const ENEMY = {
  ROWS: 5,
  COLS: 11,
  SPEED: 1,
  DROP_DISTANCE: 20
};
```

## Directory Structure

```
retro-arcade-game/
├── AGENTS.md                    # This file (AI agent instructions)
├── README.md                    # Project documentation
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Build configuration
├── vitest.config.js             # Test configuration
├── index.html                   # Entry HTML
├── .claude/
│   └── agents/                  # Subagent definitions
│       ├── game-engine.md
│       ├── renderer.md
│       ├── entity.md
│       ├── audio.md
│       ├── test-writer.md
│       └── docs-writer.md
├── src/
│   ├── main.js                  # Application entry
│   ├── game.js                  # Main Game class
│   ├── constants.js             # Game constants
│   ├── renderer/
│   │   ├── canvas-renderer.js   # Canvas drawing
│   │   └── sprite-sheet.js      # Sprite management
│   ├── entities/
│   │   ├── entity.js            # Base entity class
│   │   ├── player.js            # Player ship
│   │   ├── enemy.js             # Alien enemy
│   │   ├── projectile.js        # Bullet/laser
│   │   └── bunker.js            # Defensive bunker
│   ├── managers/
│   │   ├── input-handler.js     # Keyboard input
│   │   ├── enemy-manager.js     # Enemy formation
│   │   ├── projectile-manager.js
│   │   ├── collision-detector.js
│   │   └── score-manager.js
│   ├── audio/
│   │   └── sound-manager.js     # Web Audio API
│   └── utils/
│       ├── vector.js            # 2D vector math
│       └── helpers.js           # Utility functions
├── tests/
│   ├── setup.js                 # Test setup
│   ├── game.test.js
│   ├── entities/
│   │   ├── player.test.js
│   │   └── enemy.test.js
│   └── managers/
│       └── collision-detector.test.js
├── assets/
│   ├── sprites/                 # Pixel art sprites
│   └── sounds/                  # 8-bit sound effects
└── docs/
    └── api.md                   # API documentation
```

## Development Workflow

### Commands
```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Lint code
npm run lint
```

### Git Conventions
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Branch naming: `feature/`, `fix/`, `refactor/`

## Testing Requirements

### Unit Tests
- Each entity class must have corresponding tests
- Collision detection must have edge case tests
- Minimum 80% code coverage

### Test Structure
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/entities/player.js';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player(400, 550);
  });

  it('should initialize at correct position', () => {
    expect(player.x).toBe(400);
    expect(player.y).toBe(550);
  });

  it('should move left when moveLeft is called', () => {
    const initialX = player.x;
    player.moveLeft();
    expect(player.x).toBeLessThan(initialX);
  });
});
```

## Game Mechanics

### Player Controls
- **Left/Right Arrow** or **A/D**: Move ship
- **Space**: Fire projectile
- **P**: Pause game
- **R**: Restart (when game over)

### Scoring
| Enemy Type | Points |
|------------|--------|
| Bottom row | 10     |
| Middle row | 20     |
| Top row    | 30     |
| Mystery ship | 50-300 (random) |

### Difficulty Progression
- Enemies speed up as their count decreases
- Enemy fire rate increases per level
- Mystery ship appears randomly every 20-30 seconds

## Common Tasks

### Adding a New Entity
1. Create class in `src/entities/` extending `Entity`
2. Implement `update()` and `draw()` methods
3. Register with appropriate manager
4. Add tests in `tests/entities/`

### Adding a New Sound
1. Add audio file to `assets/sounds/`
2. Register in `SoundManager.loadSounds()`
3. Call via `soundManager.play('soundName')`

### Modifying Game Balance
1. Update constants in `src/constants.js`
2. Run tests to verify no regressions
3. Playtest for feel

## Agent-Specific Instructions

### For game-engine-agent
- Focus on game loop timing and physics
- Ensure 60 FPS performance
- Handle pause/resume state cleanly

### For renderer-agent
- Use requestAnimationFrame for smooth rendering
- Implement dirty rectangle optimization if needed
- Support retina/HiDPI displays

### For entity-agent
- Keep entities lightweight (no rendering logic)
- Use composition over inheritance where sensible
- Implement proper bounding boxes for collision

### For test-agent
- Mock canvas context in tests
- Test edge cases (screen boundaries, collision corners)
- Include performance benchmarks

## Troubleshooting

### Canvas Not Rendering
- Check if canvas element exists in DOM
- Verify context is obtained: `canvas.getContext('2d')`
- Ensure game loop is started

### Collisions Not Detecting
- Verify bounding box calculations
- Check coordinate systems (screen vs game space)
- Log collision rectangles for visual debugging

### Audio Not Playing
- User interaction required before Web Audio
- Check audio context state
- Verify audio files are loaded

---

*This AGENTS.md follows the standard at https://agents.md/ for AI agent collaboration.*
*Scaffolded using goose with Claude Code's lead/worker pattern.*
