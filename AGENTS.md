# AGENTS.md - Retro Arcade Game

> This file provides context and instructions for AI agents working on this project.
> Following the [AGENTS.md](https://agents.md/) standard for multi-agent collaboration.

## Project Overview

**Retro Arcade Game** is a browser-based Space Invaders clone built with vanilla JavaScript and HTML5 Canvas. The project demonstrates the lead/worker pattern for AI-assisted development using goose with Claude Code.

### Current Status

| Phase | Status | Features |
|-------|--------|----------|
| **Phase 1: Quick Wins** | ✅ Complete | Name entry, starfield, endless mode |
| **Phase 2: Gameplay** | ✅ Complete | Power-ups, touch controls, music, combos, formations |
| **Phase 3** | Pending | Visual & audio polish |
| **Phase 4** | Pending | New game modes |

### Tech Stack
- **Language**: JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API (no external audio files)
- **Build**: Vite
- **Testing**: Vitest + jsdom
- **Deployment**: GitHub Pages (GitHub Actions)
- **Style**: Retro pixel-art aesthetic

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Game Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  index.html                                                  │
│     └── main.js (entry point)                               │
│            └── Game class (orchestrator)                    │
│                   ├── CanvasRenderer                        │
│                   │   ├── TouchControlsRenderer             │
│                   │   └── Starfield                         │
│                   ├── InputHandler                          │
│                   │   └── TouchControlManager               │
│                   ├── Player (with shield, power-ups)       │
│                   ├── EnemyManager                          │
│                   │   └── FormationGenerator                │
│                   ├── ProjectileManager                     │
│                   ├── PowerUpManager                        │
│                   ├── ComboManager + PopupManager           │
│                   ├── CollisionDetector                     │
│                   ├── ScoreManager + NameEntryManager       │
│                   ├── SoundManager (8-bit effects)          │
│                   └── MusicManager (chiptune tracks)        │
│                       ├── PulseOscillator                   │
│                       └── Arpeggiator                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Lead/Worker Pattern

This project is designed for the **lead/worker multi-agent pattern** — an AI development methodology where a lead agent orchestrates multiple specialized worker agents to implement features in parallel.

### Why Lead/Worker?

| Benefit | Description | Evidence from This Project |
|---------|-------------|----------------------------|
| **Parallelization** | Multiple tasks execute simultaneously | Implemented 4-5 workers in parallel per feature |
| **Specialization** | Workers focus on specific domains | Separate workers for constants, managers, renderer, tests |
| **Quality** | Lead reviews and integrates worker outputs | Lead fixes integration issues, resolves conflicts |
| **Efficiency** | 90%+ performance improvement | Complex features like power-ups completed in single sessions |

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     LEAD AGENT (Opus 4)                     │
│  Orchestrates, plans, reviews, integrates, fixes bugs       │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Worker Agent  │ │ Worker Agent  │ │ Worker Agent  │ │ Worker Agent  │
│ (Haiku)       │ │ (Haiku)       │ │ (Haiku)       │ │ (Haiku)       │
│ constants     │ │ managers      │ │ renderer      │ │ test-writer   │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
       │                 │                 │                 │
       └────────────────────────PARALLEL────────────────────┘
```

### Lead Agent Responsibilities (Opus 4)

Based on our experience implementing 8 features:

1. **Task Decomposition**: Break features into 4-8 parallelizable subtasks
2. **Worker Assignment**: Spawn workers with clear, focused prompts
3. **Context Provision**: Provide workers with necessary file paths and constants references
4. **Integration**: The lead handles Game.js integration (the coordination point)
5. **Bug Fixing**: Workers may produce code with minor issues; lead fixes them
6. **Test Running**: Run `npm test` and `npm run build` after worker outputs

### Worker Agents (Haiku 4)

| Agent | Location | Specialization | Real Examples |
|-------|----------|----------------|---------------|
| `game-engine` | `.claude/agents/game-engine.md` | Game loop, managers, state | ComboManager, PowerUpManager |
| `renderer` | `.claude/agents/renderer.md` | Canvas drawing, HUD, effects | drawComboHUD, drawFormationAnnouncement |
| `entity` | `.claude/agents/entity.md` | Player, enemies, projectiles | PowerUp class, multi-shot projectiles |
| `audio` | `.claude/agents/audio.md` | Web Audio API, sound synthesis | MusicManager, PulseOscillator, Arpeggiator |
| `test-writer` | `.claude/agents/test-writer.md` | Unit tests, integration tests | 771+ tests across all features |
| `docs-writer` | `.claude/agents/docs-writer.md` | README, API docs, comments | README updates per feature |
| `controller` | `.claude/agents/controller.md` | Gamepad/controller support | Haptic feedback, button mappings |
| `touch-controls` | `.claude/agents/touch-controls.md` | Mobile touch input | TouchControlManager, virtual D-pad |

---

## How to Use Lead/Worker Pattern

### Real-World Workflow (from implementing this project)

#### Step 1: Analyze the GitHub Issue

When receiving a feature request, the lead agent should:

```markdown
1. Read the issue requirements thoroughly
2. Read relevant source files to understand current architecture
3. Identify which worker specializations are needed
4. Break the task into 4-8 parallelizable subtasks
5. Identify dependencies (tests come AFTER implementation)
```

#### Step 2: Create a Todo List

**Example** from Issue #7 (Power-ups System):

```markdown
Todo List:
1. [in_progress] Add POWERUPS constants to constants.js
2. [pending] Create PowerUp entity class
3. [pending] Create PowerUpManager class
4. [pending] Update Player for power-up effects
5. [pending] Add collision detection for power-ups
6. [pending] Update SoundManager with power-up sounds
7. [pending] Update CanvasRenderer for power-up HUD
8. [pending] Integrate into Game.js (LEAD TASK)
9. [pending] Write unit tests (AFTER 1-8)
```

#### Step 3: Launch Workers in Parallel

**Key Insight**: Launch 3-4 workers in a SINGLE message for independent tasks:

```javascript
// From Issue #7 (Power-ups) - Workers 1-4 ran in parallel
Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the game-engine worker agent.

    TASK: Add POWERUPS constants to src/constants.js

    FILES TO READ FIRST:
    - src/constants.js (see existing patterns like PLAYER, ENEMY)

    REQUIREMENTS:
    Add export const POWERUPS = {
      TYPES: { SHIELD, RAPID_FIRE, MULTI_SHOT, BOMB, EXTRA_LIFE },
      DROP_CHANCE: { ENEMY: 0.15, MYSTERY_SHIP: 0.5 },
      DURATION: { RAPID_FIRE: 10000, MULTI_SHOT: 8000 },
      VISUAL: { size, colors, pulse speed },
      WEIGHTS: { probability for each type }
    };

    Edit the file directly.
  `
)

// Parallel with above
Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the entity worker agent.

    TASK: Create PowerUp entity class

    FILES TO READ FIRST:
    - src/entities/projectile.js (similar entity pattern)
    - src/entities/mystery-ship.js (for visual reference)

    REQUIREMENTS:
    - Create src/entities/power-up.js
    - Properties: type, x, y, speed (falls down)
    - Visual: pulsing glow, type-specific colors
    - getBounds() for collision detection

    Write the new file.
  `
)

// Parallel with above
Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the game-engine worker agent.

    TASK: Create PowerUpManager class

    FILES TO READ FIRST:
    - src/managers/projectile-manager.js (similar manager pattern)
    - src/constants.js (for POWERUPS config after it's added)

    REQUIREMENTS:
    - Create src/managers/power-up-manager.js
    - spawnPowerUp(x, y) - random type based on weights
    - update(deltaTime) - move falling power-ups
    - checkCollision(playerBounds) - return collected power-up
    - activatePowerUp(type, player) - apply effect

    Write the new file.
  `
)
```

#### Step 4: Lead Handles Integration

**Critical Insight**: The Game.js integration should be done by the lead, NOT a worker:

```javascript
// Lead handles Game.js because:
// 1. Requires understanding outputs from ALL workers
// 2. Needs to coordinate timing (when to call what)
// 3. May require bug fixes from worker outputs
// 4. Integration is the coordination point

// Lead makes edits like:
// - Import new classes
// - Initialize in constructor
// - Call update() in game loop
// - Call draw() in render method
// - Handle state transitions
```

#### Step 5: Sequential Tasks (Tests)

After parallel workers complete:

```javascript
// Tests MUST come after implementation
Task(
  subagent_type="general-purpose",
  model="haiku",
  prompt=`
    You are the test-writer worker agent.

    TASK: Write unit tests for power-up system

    FILES TO READ FIRST:
    - src/entities/power-up.js (the implementation)
    - src/managers/power-up-manager.js (the manager)
    - tests/setup.js (test helpers and mocks)
    - tests/entities/player.test.js (testing patterns)

    REQUIREMENTS:
    - Create tests/power-ups.test.js
    - Test PowerUp entity (position, bounds, visual state)
    - Test PowerUpManager (spawning, collection, activation)
    - Test Player power-up effects (shield, rapid fire, multi-shot)
    - Mock AudioContext with createPeriodicWave, createOscillator

    Create the test file.
  `
)
```

#### Step 6: Verify and Fix

After workers complete:

```bash
npm test        # Run tests - lead fixes any failures
npm run build   # Verify build - lead fixes any errors
```

---

## Lessons Learned (from implementing 8 features)

### What Works Well

| Practice | Why It Works |
|----------|--------------|
| **4-5 parallel workers max** | More than this causes context issues |
| **Haiku for all workers** | Fast, cheap, good enough for focused tasks |
| **Lead does Game.js integration** | Workers can't see each other's outputs |
| **Tests after implementation** | Workers need to read finished code |
| **Specific file paths in prompts** | Workers don't guess; they read what you specify |

### Common Pitfalls and Fixes

| Pitfall | Example | Fix |
|---------|---------|-----|
| **Case mismatch** | Worker returns `LEFT` but renderer expects `left` | Lead reviews and fixes consistency |
| **Missing mock methods** | Tests fail with "createPeriodicWave is not a function" | Lead adds mock methods to test setup |
| **Duplicate exports** | Worker adds constants that already exist | Lead checks for conflicts before spawning |
| **Canvas scaling** | Touch coordinates don't account for CSS scaling | Lead researches and applies proper formula |

### Integration Patterns That Work

**Pattern 1**: Manager Creation
```javascript
// Worker creates: src/managers/combo-manager.js
// Lead adds to Game.js:
import { ComboManager } from './managers/combo-manager.js';
this.comboManager = new ComboManager();
// In update: this.comboManager.update(deltaTime);
// In collision: this.comboManager.registerKill();
```

**Pattern 2**: Renderer Extension
```javascript
// Worker adds: drawComboHUD(ctx, combo, multiplier)
// Lead calls in renderGame():
if (this.comboManager.isActive()) {
  this.renderer.drawComboHUD(ctx, combo, multiplier);
}
```

**Pattern 3**: Sound Effect Addition
```javascript
// Worker adds: playComboMilestone(milestone)
// Lead calls when combo reaches milestone:
this.soundManager.playComboMilestone(combo);
```

---

## Worker Agent Prompt Template

Refined template based on successful implementations:

```markdown
You are the {agent-name} worker agent.

TASK: {One-line description}

FILES TO READ FIRST:
- {file1.js} (to understand existing pattern)
- {file2.js} (for constants/config reference)

REQUIREMENTS:
- {Specific requirement 1}
- {Specific requirement 2}
- {Specific requirement 3}

OUTPUT:
- {Create/Edit} {specific file path}

IMPORTANT:
- Use constants from src/constants.js, don't hardcode values
- Follow existing code patterns in similar files
- Include inline comments for non-obvious logic
- Export the class/function at the bottom of the file
```

---

## Code Conventions

### File Naming
- Use `kebab-case.js` for file names
- Use `PascalCase` for class names
- Use `camelCase` for functions and variables

### Module Structure
```javascript
// Each module should follow this structure:
// 1. Imports
// 2. Local constants (if any)
// 3. Class definition
// 4. Export

import { GAME, PLAYER } from '../constants.js';

export class MyManager {
  constructor() {
    this.items = [];
  }

  update(deltaTime) {
    // ...
  }

  reset() {
    this.items = [];
  }
}
```

### Game Constants
All magic numbers in `src/constants.js`:
```javascript
// EXISTING (don't duplicate):
export const GAME = { WIDTH: 800, HEIGHT: 600, FPS: 60 };
export const PLAYER = { SPEED: 5, LIVES: 3, WIDTH: 40, HEIGHT: 30 };
export const ENEMY = { ROWS: 5, COLS: 11, DROP_DISTANCE: 8 };

// ADDED in Phase 1-2:
export const POWERUPS = { TYPES, DROP_CHANCE, DURATION, WEIGHTS };
export const COMBO = { TIMEOUT, MULTIPLIERS, MILESTONES };
export const FORMATIONS = { TYPES, ENTRANCE, COLORS };
export const MUSIC = { BPM, TRACKS, NOTES };
export const TOUCH_CONTROLS = { BUTTON_SIZE, POSITIONS, OPACITY };
```

---

## Directory Structure

```
retro-arcade-game/
├── AGENTS.md                    # This file (AI agent instructions)
├── README.md                    # Project documentation
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Build configuration
├── index.html                   # Entry HTML with CRT styling
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deployment
├── .claude/
│   └── agents/                  # Worker agent definitions
│       ├── game-engine.md
│       ├── renderer.md
│       ├── entity.md
│       ├── audio.md
│       ├── test-writer.md
│       ├── docs-writer.md
│       ├── controller.md
│       └── touch-controls.md
├── src/
│   ├── main.js                  # Application entry
│   ├── game.js                  # Main Game class (600+ LOC)
│   ├── constants.js             # All game constants (400+ LOC)
│   ├── renderer/
│   │   ├── canvas-renderer.js   # Main renderer (900+ LOC)
│   │   ├── starfield.js         # Parallax background
│   │   └── touch-controls-renderer.js
│   ├── entities/
│   │   ├── player.js            # Player with shields, power-ups
│   │   ├── enemy.js             # Alien enemy
│   │   ├── projectile.js        # Bullets with spread angles
│   │   ├── bunker.js            # Defensive bunkers
│   │   ├── mystery-ship.js      # Bonus UFO
│   │   └── power-up.js          # Collectible power-ups
│   ├── managers/
│   │   ├── input-handler.js     # Keyboard + gamepad + touch
│   │   ├── touch-control-manager.js
│   │   ├── enemy-manager.js     # Enemy formations + difficulty
│   │   ├── formation-generator.js  # 6 formation patterns
│   │   ├── projectile-manager.js
│   │   ├── power-up-manager.js
│   │   ├── combo-manager.js     # Kill combos + multipliers
│   │   ├── popup-manager.js     # Floating text popups
│   │   ├── collision-detector.js
│   │   ├── score-manager.js     # High scores + leaderboards
│   │   └── name-entry-manager.js
│   ├── audio/
│   │   ├── sound-manager.js     # 8-bit sound effects
│   │   ├── music-manager.js     # Chiptune background music
│   │   ├── pulse-oscillator.js  # NES 2A03-style synthesis
│   │   └── arpeggiator.js       # Chord arpeggiation
│   └── utils/
│       └── helpers.js           # Utility functions
└── tests/
    ├── setup.js                 # Test setup + mocks
    ├── game.test.js
    ├── endless-mode.test.js
    ├── power-ups.test.js
    ├── combo-system.test.js
    ├── formations.test.js
    ├── music-manager.test.js
    ├── touch-controls.test.js
    ├── entities/
    │   ├── player.test.js
    │   └── enemy.test.js
    ├── managers/
    │   ├── collision-detector.test.js
    │   ├── score-manager.test.js
    │   ├── name-entry-manager.test.js
    │   └── input-handler.test.js
    └── renderer/
        └── starfield.test.js
```

---

## Development Workflow

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (hot reload)
npm test             # Run tests in watch mode
npm run test:run     # Run tests once (CI)
npm run build        # Build for production
npm run build:gh-pages  # Build with GitHub Pages base path
npm run deploy       # Deploy to GitHub Pages
```

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Branch naming: `feature/`, `fix/`, `refactor/`
- PR per feature, closes GitHub issue

---

## Testing Requirements

### Test File Naming
- Feature tests: `tests/{feature}.test.js` (e.g., `power-ups.test.js`)
- Entity tests: `tests/entities/{entity}.test.js`
- Manager tests: `tests/managers/{manager}.test.js`

### Mock Setup
The test setup must include:
```javascript
// tests/setup.js mock essentials:
const mockAudioContext = {
  createOscillator: () => mockOscillator,
  createGain: () => mockGain,
  createPeriodicWave: () => ({}),  // IMPORTANT: Added for enhanced music
  currentTime: 0,
  destination: {}
};

const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  setPeriodicWave: vi.fn(),  // IMPORTANT: Added for pulse oscillator
  frequency: { setValueAtTime: vi.fn() },
  type: 'square'
};
```

### Test Counts by Feature
| Feature | Tests | File |
|---------|-------|------|
| Core game | 40+ | game.test.js |
| Endless mode | 51 | endless-mode.test.js |
| Power-ups | 102 | power-ups.test.js |
| Combo system | 124 | combo-system.test.js |
| Formations | 137 | formations.test.js |
| Music | 69 | music-manager.test.js |
| Touch controls | 112 | touch-controls.test.js |
| **Total** | **771+** | |

---

## Game Features

### Controls
| Input | Keyboard | Gamepad | Touch |
|-------|----------|---------|-------|
| Move | ←→ / AD | D-Pad / Left Stick | Left/Right buttons |
| Fire | Space | A / RB / RT | Fire button |
| Pause | P / Esc | Start | Pause button |
| Mute | M | Y | - |
| Mode Select | ↑↓ | D-Pad Up/Down | - |
| Name Entry | ↑↓ + Enter | D-Pad + A | - |

### Scoring & Combos
| Enemy | Points | With Combo |
|-------|--------|------------|
| Bottom row | 10 | 10 × multiplier |
| Middle row | 20 | 20 × multiplier |
| Top row | 30 | 30 × multiplier |
| Mystery ship | 50-300 | × multiplier |

| Combo | Multiplier |
|-------|------------|
| 2 kills | ×1.5 |
| 3 kills | ×2.0 |
| 4 kills | ×2.5 |
| 5+ kills | ×3.0 (max) |

### Power-ups
| Type | Color | Effect | Duration |
|------|-------|--------|----------|
| Shield | Cyan | Absorbs 1 hit | Until hit |
| Rapid Fire | Orange | 50% faster fire | 10 sec |
| Multi-Shot | Magenta | 3-way spread | 8 sec |
| Bomb | Yellow | Clear all enemies | Instant |
| Extra Life | Green | +1 life | Instant |

### Formations
| Pattern | Levels | Description |
|---------|--------|-------------|
| Classic | 1-2 | Standard grid |
| V-Shape | 3-4 | Inverted V |
| Diamond | 5-6 | Rhombus shape |
| Spiral | 7-8 | Galaxy spiral |
| Cross | 9-10 | Plus sign |
| Random | 11+ | Chaotic scatter |

---

## Troubleshooting

### Tests Failing with Mock Errors
```javascript
// Problem: "createPeriodicWave is not a function"
// Solution: Add to test setup mock:
createPeriodicWave: () => ({})
```

### Touch Controls Not Working
```javascript
// Problem: Touch coordinates don't match button positions
// Solution: Scale coordinates by canvas CSS ratio:
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const x = (touch.clientX - rect.left) * scaleX;
const y = (touch.clientY - rect.top) * scaleY;
```

### Music Not Playing
```javascript
// Problem: AudioContext not started
// Solution: Start after user interaction:
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true });
```

### GitHub Pages Deployment Shows Old Version
```bash
# Problem: Browser caching old bundle
# Solution: Hard refresh or wait for CDN propagation
Ctrl+Shift+R  # Hard refresh
# Or wait 1-5 minutes for GitHub CDN to update
```

---

## Quick Reference for AI Agents

### When Starting a New Feature

1. **Read this AGENTS.md** for conventions
2. **Read the GitHub Issue** for requirements
3. **Read relevant source files** before writing code
4. **Create a todo list** with 4-8 subtasks
5. **Launch parallel workers** (3-4 max at once)
6. **Lead handles Game.js integration**
7. **Launch test-writer worker** after implementation
8. **Run `npm test` and `npm run build`** to verify

### Model Selection

| Agent | Model | Reason |
|-------|-------|--------|
| Lead | Opus 4 | Complex orchestration, bug fixing |
| All workers | Haiku 4 | Fast, cheap, focused tasks |

### Worker Output Expectations

Workers should:
- Read files specified in prompt FIRST
- Follow existing code patterns
- Use constants from constants.js
- Write complete, working code
- Not modify files outside their scope

---

*This AGENTS.md reflects lessons learned from implementing Phase 1 and Phase 2.*
*Scaffolded using goose with Claude Code's lead/worker pattern.*
*Last updated: December 2024*
