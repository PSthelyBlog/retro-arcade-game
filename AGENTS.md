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

This project is designed for the **lead/worker multi-agent pattern** — an AI development methodology where a lead agent orchestrates multiple specialized worker agents to implement features in parallel.

### Why Lead/Worker?

| Benefit | Description |
|---------|-------------|
| **Parallelization** | Multiple tasks execute simultaneously |
| **Specialization** | Workers focus on specific domains (rendering, tests, etc.) |
| **Quality** | Lead reviews and integrates worker outputs |
| **Efficiency** | 90%+ performance improvement on complex tasks |

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     LEAD AGENT (Opus 4)                     │
│  Orchestrates, plans, reviews, integrates                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Worker Agent  │ │ Worker Agent  │ │ Worker Agent  │
│ (Haiku/Sonnet)│ │ (Haiku/Sonnet)│ │ (Haiku/Sonnet)│
│ game-engine   │ │ renderer      │ │ test-writer   │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Lead Agent Responsibilities (Opus 4)

1. **Task Decomposition**: Break features into parallelizable subtasks
2. **Worker Assignment**: Delegate subtasks to appropriate specialized workers
3. **Context Provision**: Provide workers with necessary file context and instructions
4. **Integration**: Combine worker outputs into cohesive implementation
5. **Quality Assurance**: Review, test, and verify combined output

### Worker Agents (Haiku 4 / Sonnet 4)

| Agent | Location | Specialization |
|-------|----------|----------------|
| `game-engine` | `.claude/agents/game-engine.md` | Game loop, physics, state management |
| `renderer` | `.claude/agents/renderer.md` | Canvas drawing, animations, effects |
| `entity` | `.claude/agents/entity.md` | Player, enemies, projectiles |
| `audio` | `.claude/agents/audio.md` | Web Audio API, sound synthesis |
| `test-writer` | `.claude/agents/test-writer.md` | Unit tests, integration tests |
| `docs-writer` | `.claude/agents/docs-writer.md` | README, API docs, comments |
| `controller` | `.claude/agents/controller.md` | Gamepad/controller support |

---

## How to Use Lead/Worker Pattern

### Step 1: Analyze the Task

When receiving a feature request (e.g., GitHub Issue), the lead agent should:

```markdown
1. Read the issue requirements
2. Identify which worker specializations are needed
3. Break the task into parallelizable subtasks
4. Determine dependencies between subtasks
```

### Step 2: Decompose into Subtasks

**Example**: Issue #1 "Add name entry for high scores"

| Subtask | Worker Agent | Dependencies |
|---------|--------------|--------------|
| NameEntryManager class | `game-engine` | None |
| drawNameEntry() method | `renderer` | None |
| Input key detection | `game-engine` | None |
| Unit tests | `test-writer` | After implementation |
| Update documentation | `docs-writer` | After implementation |

### Step 3: Launch Workers in Parallel

Use the `Task` tool with `subagent_type="general-purpose"` to spawn workers:

```javascript
// Lead agent spawns multiple workers in a SINGLE message
// (parallel execution for independent tasks)

Task(
  subagent_type="general-purpose",
  model="haiku",  // Use cost-efficient model for focused tasks
  prompt=`
    You are the game-engine worker agent.
    Read .claude/agents/game-engine.md for your role instructions.

    TASK: Implement NameEntryManager class

    Files to read first:
    - src/constants.js (for NAME_ENTRY config)
    - src/managers/score-manager.js (for integration)

    Requirements:
    - Create src/managers/name-entry-manager.js
    - Support 3-character initials (A-Z, 0-9)
    - Handle cursor position (0, 1, 2)
    - Cycle characters with up/down
    - Confirm with Enter or Space

    Write the file when ready.
  `
)

Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the renderer worker agent.
    Read .claude/agents/renderer.md for your role instructions.

    TASK: Add drawNameEntry() method to CanvasRenderer

    Files to read first:
    - src/renderer/canvas-renderer.js (existing methods)
    - src/constants.js (COLORS, GAME dimensions)

    Requirements:
    - Display "ENTER YOUR INITIALS" title
    - Show 3 character slots with current letters
    - Blinking cursor on active slot
    - Retro pixel font styling

    Edit the file when ready.
  `
)
```

### Step 4: Sequential Tasks (with Dependencies)

For tasks that depend on others, launch them after the parallel tasks complete:

```javascript
// After implementation workers complete, launch test-writer
Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the test-writer worker agent.
    Read .claude/agents/test-writer.md for your role instructions.

    TASK: Write unit tests for name entry feature

    Files to read first:
    - src/managers/name-entry-manager.js (the implementation)
    - tests/setup.js (test helpers)

    Requirements:
    - Test character cycling
    - Test cursor movement
    - Test confirmation
    - Test boundary conditions

    Create tests/managers/name-entry-manager.test.js
  `
)
```

### Step 5: Integration & Review

After workers complete:

1. **Verify outputs**: Check that each file was created/modified correctly
2. **Run tests**: `npm test` to ensure no regressions
3. **Run build**: `npm run build` to check for errors
4. **Manual review**: Scan code for consistency and integration issues
5. **Final adjustments**: Make any necessary integration fixes

---

## Worker Agent Prompt Template

When spawning a worker, use this template:

```markdown
You are the {agent-name} worker agent.
Read .claude/agents/{agent-name}.md for your role instructions.
Read AGENTS.md for project conventions.

TASK: {One-line description}

CONTEXT:
- {Why this task is needed}
- {How it fits into the larger feature}

FILES TO READ:
- {file1.js} (reason)
- {file2.js} (reason)

REQUIREMENTS:
- {Requirement 1}
- {Requirement 2}
- {Requirement 3}

OUTPUT:
- {What file(s) to create/modify}

QUALITY CHECKLIST:
- [ ] Follows project code conventions
- [ ] Uses constants from constants.js
- [ ] Handles edge cases
- [ ] Includes inline comments for complex logic
```

---

## Example: Implementing a Feature

### GitHub Issue: "Add Endless Mode"

**Lead Agent Analysis:**

```
Feature: Endless Mode - continuous waves with increasing difficulty
Subtasks:
1. Add GameState.ENDLESS and game mode selection (game-engine)
2. Create endless wave generation logic (game-engine)
3. Add endless mode UI on start screen (renderer)
4. Update high score to track endless mode separately (game-engine)
5. Write tests (test-writer) - AFTER 1-4
6. Update README (docs-writer) - AFTER 1-4
```

**Parallel Worker Launches:**

```javascript
// Workers 1, 2, 3, 4 can run in parallel (no dependencies)
Task(subagent_type="general-purpose", model="haiku", prompt="[game-engine] Add ENDLESS state...")
Task(subagent_type="general-purpose", model="haiku", prompt="[game-engine] Wave generation...")
Task(subagent_type="general-purpose", model="haiku", prompt="[renderer] Endless mode UI...")
Task(subagent_type="general-purpose", model="haiku", prompt="[game-engine] Endless high scores...")
```

**Sequential Workers (after parallel complete):**

```javascript
// Workers 5, 6 depend on 1-4 completing
Task(subagent_type="general-purpose", model="haiku", prompt="[test-writer] Tests for endless mode...")
Task(subagent_type="general-purpose", model="haiku", prompt="[docs-writer] Update README...")
```

---

## Model Selection Guide

| Model | Use For | Cost |
|-------|---------|------|
| **Opus 4** | Lead agent, complex architectural decisions | High |
| **Sonnet 4** | Workers doing complex implementation | Medium |
| **Haiku 4** | Workers doing focused, well-scoped tasks | Low |

**Rule of thumb**: Use Haiku for workers when the task is clearly defined with specific file inputs/outputs. Use Sonnet for workers when the task requires more reasoning.

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
