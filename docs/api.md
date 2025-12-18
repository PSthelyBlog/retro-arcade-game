# API Documentation

This document provides detailed API documentation for the Retro Arcade Game codebase.

## Table of Contents

- [Game Class](#game-class)
- [Entities](#entities)
- [Managers](#managers)
- [Renderer](#renderer)
- [Audio](#audio)
- [Utilities](#utilities)

---

## Game Class

**Location**: `src/game.js`

The main orchestrator class that ties all systems together.

### Constructor

```javascript
const game = new Game();
```

Creates a new game instance. Initializes all managers and sets initial state to `MENU`.

### Methods

#### `start()`

Initialize input handling and start the game loop.

```javascript
game.start();
```

#### `startNewGame()`

Begin a new game from level 1.

```javascript
game.startNewGame();
```

#### `startNextLevel()`

Advance to the next level after completing current level.

#### `gameOver()`

Transition to game over state.

#### `levelComplete()`

Transition to level complete state.

---

## Entities

### Entity (Base Class)

**Location**: `src/entities/entity.js`

Base class for all game objects.

#### Constructor

```javascript
new Entity(x, y, width, height)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| x | number | X position |
| y | number | Y position |
| width | number | Width in pixels |
| height | number | Height in pixels |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| x | number | X position |
| y | number | Y position |
| width | number | Entity width |
| height | number | Entity height |
| velocityX | number | Horizontal velocity |
| velocityY | number | Vertical velocity |
| active | boolean | Whether entity is active |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getBounds()` | Object | Get bounding box `{x, y, width, height, left, right, top, bottom}` |
| `getCenter()` | Object | Get center point `{x, y}` |
| `update(deltaTime)` | void | Update entity state |
| `draw(ctx)` | void | Draw entity to canvas |
| `deactivate()` | void | Set active to false |
| `activate(x, y)` | void | Reactivate at position |

---

### Player

**Location**: `src/entities/player.js`

Extends `Entity`. Represents the player's ship.

#### Constructor

```javascript
new Player(x?, y?)
```

Default position: center bottom of screen.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| lives | number | Current lives |
| invulnerable | boolean | Damage immunity state |
| visible | boolean | Visibility (for blinking) |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `moveLeft()` | - | void | Move ship left |
| `moveRight()` | - | void | Move ship right |
| `shoot(currentTime)` | number | Object\|null | Fire projectile, returns data or null if on cooldown |
| `hit()` | - | boolean | Take damage, returns true if dead |
| `setInvulnerable()` | - | void | Enable invulnerability |
| `reset()` | - | void | Reset to starting state |

---

### Enemy

**Location**: `src/entities/enemy.js`

Extends `Entity`. Represents an alien enemy.

#### Constructor

```javascript
new Enemy(x, y, row, col)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| row | number | Row index (0 = bottom) |
| col | number | Column index |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getPoints()` | number | Get point value for destruction |
| `shoot()` | Object\|null | Attempt to fire, returns projectile data or null |

---

### Projectile

**Location**: `src/entities/projectile.js`

Extends `Entity`. Represents a bullet.

#### Constructor

```javascript
new Projectile(x, y, isPlayerBullet)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| isPlayerBullet | boolean | true = player shot, false = enemy shot |

---

### Bunker

**Location**: `src/entities/bunker.js`

Extends `Entity`. Destructible defensive barrier.

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `hitTest(px, py, radius)` | number, number, number | boolean | Test and apply damage at point |
| `damageArea(col, row, radius)` | number, number, number | void | Destroy pixels in area |
| `isDestroyed()` | - | boolean | Check if fully destroyed |
| `reset()` | - | void | Restore to full health |

---

### MysteryShip

**Location**: `src/entities/mystery-ship.js`

Extends `Entity`. UFO bonus enemy.

#### Constructor

```javascript
new MysteryShip(fromLeft)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| fromLeft | boolean | true = enter from left side |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getPoints()` | number | Random point value (50-300) |

---

## Managers

### InputHandler

**Location**: `src/managers/input-handler.js`

Handles keyboard input.

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | void | Begin listening for input |
| `stop()` | void | Stop listening |
| `isHeld(keyCodes)` | boolean | Check if any key is held |
| `isJustPressed(keyCodes)` | boolean | Check for new press this frame |
| `clearJustPressed()` | void | Clear pressed state (call at frame end) |
| `isLeftHeld()` | boolean | Left movement key held |
| `isRightHeld()` | boolean | Right movement key held |
| `isFireJustPressed()` | boolean | Fire key just pressed |
| `isPauseJustPressed()` | boolean | Pause key just pressed |

---

### EnemyManager

**Location**: `src/managers/enemy-manager.js`

Manages enemy formation and movement.

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createFormation()` | void | Initialize enemy grid |
| `getActiveEnemies()` | Enemy[] | Get all active enemies |
| `getEnemyCount()` | number | Count of active enemies |
| `isEmpty()` | boolean | True if all enemies destroyed |
| `update(deltaTime)` | Object[] | Update and return enemy shots |
| `removeEnemy(enemy)` | number | Remove enemy, return points |
| `hasReachedBottom()` | boolean | True if enemies near player |
| `draw(ctx)` | void | Draw all enemies |

---

### ProjectileManager

**Location**: `src/managers/projectile-manager.js`

Manages all projectiles.

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addPlayerProjectile(data)` | Object | boolean | Add player bullet |
| `addEnemyProjectile(data)` | Object | void | Add enemy bullet |
| `getActivePlayerProjectiles()` | - | Projectile[] | Get player bullets |
| `getActiveEnemyProjectiles()` | - | Projectile[] | Get enemy bullets |
| `update(deltaTime)` | number | void | Update all projectiles |
| `clear()` | - | void | Remove all projectiles |
| `draw(ctx)` | CanvasRenderingContext2D | void | Draw all projectiles |

---

### CollisionDetector

**Location**: `src/managers/collision-detector.js`

Static utility class for collision detection.

#### Static Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `checkCollision(a, b)` | Entity, Entity | boolean | AABB collision test |
| `checkPlayerProjectilesVsEnemies(projectiles, enemies)` | Projectile[], Enemy[] | Object[] | Find all hits |
| `checkPlayerProjectilesVsMysteryShip(projectiles, ship)` | Projectile[], MysteryShip | Object\|null | Check UFO hit |
| `checkEnemyProjectilesVsPlayer(projectiles, player)` | Projectile[], Player | Projectile\|null | Find hit |
| `checkProjectilesVsBunkers(projectiles, bunkers)` | Projectile[], Bunker[] | Object[] | Find bunker hits |
| `checkEnemiesVsPlayer(enemies, player)` | Enemy[], Player | boolean | Game over check |

---

### ScoreManager

**Location**: `src/managers/score-manager.js`

Manages scoring and high score persistence.

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addPoints(points)` | number | boolean | Add score, return true if extra life |
| `getScore()` | - | number | Current score |
| `getHighScore()` | - | number | Saved high score |
| `reset()` | - | void | Reset for new game |
| `formatScore(num, digits)` | number, number | string | Format with leading zeros |

---

## Renderer

### CanvasRenderer

**Location**: `src/renderer/canvas-renderer.js`

Handles all canvas drawing operations.

#### Constructor

```javascript
new CanvasRenderer(canvasId)
```

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `clear()` | - | Clear canvas |
| `shake(intensity, duration)` | number, number | Start screen shake |
| `updateShake(deltaTime)` | number | Update shake effect |
| `drawHUD(score, highScore, lives, level)` | number, number, number, number | Draw UI |
| `drawGameOver(score, highScore)` | number, number | Draw game over screen |
| `drawPause()` | - | Draw pause overlay |
| `drawLevelComplete(level)` | number | Draw level complete |
| `drawStartScreen()` | - | Draw title screen |
| `drawExplosion(x, y, frame)` | number, number, number | Draw explosion effect |
| `getContext()` | - | Get 2D context |

---

## Audio

### SoundManager

**Location**: `src/audio/sound-manager.js`

8-bit sound synthesis using Web Audio API.

#### Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize audio context (call after user interaction) |
| `resume()` | Resume suspended context |
| `toggleMute()` | Toggle mute state |
| `setMuted(muted)` | Set mute state |
| `playShoot()` | Player fire sound |
| `playEnemyShoot()` | Enemy fire sound |
| `playExplosion()` | Enemy destroyed sound |
| `playPlayerHit()` | Player damaged sound |
| `playMysteryShip()` | UFO sound |
| `playPowerUp()` | Extra life sound |
| `playGameOver()` | Game over jingle |
| `playLevelComplete()` | Victory fanfare |

---

## Utilities

### Vector2

**Location**: `src/utils/vector.js`

2D vector math utility.

```javascript
const v = new Vector2(10, 20);
v.add(new Vector2(5, 5));     // {x: 15, y: 25}
v.multiply(2);                 // {x: 30, y: 50}
v.normalize();                 // Unit vector
v.magnitude();                 // Length
v.distanceTo(other);          // Distance
```

### Helpers

**Location**: `src/utils/helpers.js`

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `clamp(value, min, max)` | number, number, number | number | Constrain value to range |
| `lerp(a, b, t)` | number, number, number | number | Linear interpolation |
| `randomInt(min, max)` | number, number | number | Random integer [min, max) |
| `randomElement(array)` | Array | any | Random array element |
| `rectsOverlap(a, b)` | Object, Object | boolean | AABB collision |
| `padNumber(num, digits)` | number, number | string | Zero-padded number |
| `debounce(func, wait)` | Function, number | Function | Debounced function |

---

## Constants

**Location**: `src/constants.js`

All configurable game values:

- `GAME` - Screen dimensions, FPS
- `PLAYER` - Speed, lives, dimensions
- `ENEMY` - Formation, speed, firing
- `PROJECTILE` - Speed, dimensions
- `BUNKER` - Size, count
- `MYSTERY_SHIP` - Timing, scores
- `SCORE` - Points, extra life threshold
- `UI` - Font, colors, positions
- `GameState` - State enum
- `Keys` - Key bindings
