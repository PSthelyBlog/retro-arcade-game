import { Enemy } from '../entities/enemy.js';
import { ENEMY, GAME, FORMATIONS } from '../constants.js';
import { FormationGenerator } from './formation-generator.js';

/**
 * Manages enemy formation and movement
 */
export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.direction = 1; // 1 = right, -1 = left
    this.speed = ENEMY.BASE_SPEED;
    this.dropNext = false;
    this.totalEnemies = ENEMY.ROWS * ENEMY.COLS;

    // Endless mode properties
    this.wave = 1;
    this.gameMode = 'classic'; // 'classic' or 'endless'
    this.difficultyMultiplier = 1.0;

    // Formation properties
    this.currentFormationType = 'classic';
    this.entranceActive = false;
    this.entranceStartTime = 0;
    this.entrancePositions = [];
    this.entranceProgress = 0;
  }

  /**
   * Set current wave number
   * @param {number} wave - Wave number
   */
  setWave(wave) {
    this.wave = Math.max(1, wave);
  }

  /**
   * Set game mode
   * @param {string} mode - Game mode ('classic' or 'endless')
   */
  setGameMode(mode) {
    this.gameMode = mode === 'endless' ? 'endless' : 'classic';
  }

  /**
   * Create initial enemy formation
   * @param {number} level - Current level (used for formation type)
   * @param {boolean} withEntrance - Whether to play entrance animation
   */
  createFormation(level = 1, withEntrance = true) {
    this.enemies = [];
    this.direction = 1;
    this.dropNext = false;

    // Calculate difficulty multiplier for endless mode
    if (this.gameMode === 'endless') {
      const speedMultiplier = Math.min(1 + (this.wave - 1) * 0.05, 3.0);
      this.difficultyMultiplier = speedMultiplier;
      this.speed = ENEMY.BASE_SPEED * speedMultiplier;
    } else {
      this.difficultyMultiplier = 1.0;
      this.speed = ENEMY.BASE_SPEED;
    }

    // Get formation type based on level
    this.currentFormationType = FormationGenerator.getFormationType(level);

    // Calculate extra rows for endless mode scaling
    let extraRows = 0;
    if (this.gameMode === 'endless') {
      const wavesForExtraRow = 5;
      extraRows = Math.min(
        Math.floor((this.wave - 1) / wavesForExtraRow),
        FORMATIONS.ENDLESS_SCALING.MAX_EXTRA_ROWS
      );
    }

    // Generate formation positions
    this.entrancePositions = FormationGenerator.generate(this.currentFormationType, extraRows);

    // Create enemies at starting positions (off-screen if entrance animation)
    for (const pos of this.entrancePositions) {
      const startY = withEntrance ? FORMATIONS.ENTRANCE.START_Y : pos.y;
      const enemy = new Enemy(pos.x, startY, pos.row, pos.col);
      enemy.targetX = pos.x;
      enemy.targetY = pos.y;
      enemy.entranceDelay = pos.delay;
      enemy.entranceComplete = !withEntrance;
      this.enemies.push(enemy);
    }

    // Start entrance animation if enabled
    if (withEntrance) {
      this.entranceActive = true;
      this.entranceStartTime = Date.now();
      this.entranceProgress = 0;
    } else {
      this.entranceActive = false;
      this.entranceProgress = 1;
    }

    this.totalEnemies = this.enemies.length;
  }

  /**
   * Get current formation type
   * @returns {string} Formation type
   */
  getFormationType() {
    return this.currentFormationType;
  }

  /**
   * Get formation display name
   * @returns {string} Display name
   */
  getFormationDisplayName() {
    return FormationGenerator.getDisplayName(this.currentFormationType);
  }

  /**
   * Get formation color
   * @returns {string} Hex color
   */
  getFormationColor() {
    return FormationGenerator.getColor(this.currentFormationType);
  }

  /**
   * Check if entrance animation is playing
   * @returns {boolean}
   */
  isEntranceActive() {
    return this.entranceActive;
  }

  /**
   * Get entrance animation progress (0-1)
   * @returns {number}
   */
  getEntranceProgress() {
    return this.entranceProgress;
  }

  /**
   * Update entrance animation
   * @param {number} deltaTime - Time since last update
   */
  updateEntrance(deltaTime) {
    if (!this.entranceActive) return;

    const elapsed = Date.now() - this.entranceStartTime;
    this.entranceProgress = Math.min(elapsed / FORMATIONS.ENTRANCE.DURATION, 1);

    let allComplete = true;

    for (const enemy of this.enemies) {
      if (enemy.entranceComplete) continue;

      // Check if this enemy should start moving (based on delay)
      if (elapsed < enemy.entranceDelay) {
        allComplete = false;
        continue;
      }

      // Calculate individual enemy progress
      const enemyElapsed = elapsed - enemy.entranceDelay;
      const enemyDuration = FORMATIONS.ENTRANCE.DURATION - enemy.entranceDelay;
      const progress = Math.min(enemyElapsed / enemyDuration, 1);

      // Easing: easeOutQuad with overshoot
      const eased = this.easeOutQuad(progress);
      const overshoot = progress < 0.8 ? 0 : Math.sin((progress - 0.8) * Math.PI * 2.5) * FORMATIONS.ENTRANCE.OVERSHOOT * (1 - progress);

      // Interpolate position
      const startY = FORMATIONS.ENTRANCE.START_Y;
      enemy.y = startY + (enemy.targetY - startY) * eased + overshoot;
      enemy.x = enemy.targetX;

      if (progress >= 1) {
        enemy.y = enemy.targetY;
        enemy.entranceComplete = true;
      } else {
        allComplete = false;
      }
    }

    if (allComplete) {
      this.entranceActive = false;
      this.entranceProgress = 1;
    }
  }

  /**
   * Easing function: easeOutQuad
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased value
   */
  easeOutQuad(t) {
    return t * (2 - t);
  }

  /**
   * Get active enemies
   * @returns {Enemy[]}
   */
  getActiveEnemies() {
    return this.enemies.filter((e) => e.active);
  }

  /**
   * Get enemy count
   * @returns {number}
   */
  getEnemyCount() {
    return this.getActiveEnemies().length;
  }

  /**
   * Check if all enemies are destroyed
   * @returns {boolean}
   */
  isEmpty() {
    return this.getEnemyCount() === 0;
  }

  /**
   * Get formation bounds
   * @returns {Object} {left, right, top, bottom}
   */
  getFormationBounds() {
    const active = this.getActiveEnemies();
    if (active.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (const enemy of active) {
      left = Math.min(left, enemy.x);
      right = Math.max(right, enemy.x + enemy.width);
      top = Math.min(top, enemy.y);
      bottom = Math.max(bottom, enemy.y + enemy.height);
    }

    return { left, right, top, bottom };
  }

  /**
   * Get bottom-most enemies in each column (for shooting)
   * @returns {Enemy[]}
   */
  getShootingEnemies() {
    const active = this.getActiveEnemies();
    const columnMap = new Map();

    for (const enemy of active) {
      if (!columnMap.has(enemy.col) || enemy.row > columnMap.get(enemy.col).row) {
        columnMap.set(enemy.col, enemy);
      }
    }

    return Array.from(columnMap.values());
  }

  /**
   * Update enemy formation
   * @param {number} deltaTime - Time since last update
   * @returns {Object[]} Projectile data from enemy shots
   */
  update(deltaTime) {
    const projectiles = [];

    // Update entrance animation if active
    if (this.entranceActive) {
      this.updateEntrance(deltaTime);
      return projectiles; // Don't process normal movement during entrance
    }

    const active = this.getActiveEnemies();

    if (active.length === 0) return projectiles;

    // Calculate speed based on remaining enemies
    const remainingRatio = active.length / this.totalEnemies;
    let baseSpeed = ENEMY.BASE_SPEED + (1 - remainingRatio) * 3;

    // Apply difficulty multiplier in endless mode
    if (this.gameMode === 'endless') {
      baseSpeed *= this.difficultyMultiplier;
    }

    this.speed = baseSpeed;

    // Check if we need to drop and reverse
    const bounds = this.getFormationBounds();
    const hitRight = bounds.right >= GAME.WIDTH - 10 && this.direction > 0;
    const hitLeft = bounds.left <= 10 && this.direction < 0;

    if (hitRight || hitLeft) {
      this.dropNext = true;
      this.direction *= -1;
    }

    // Move enemies
    for (const enemy of active) {
      if (this.dropNext) {
        enemy.y += ENEMY.DROP_DISTANCE;
      } else {
        enemy.x += this.speed * this.direction * (deltaTime / 16.67);
      }

      enemy.update(deltaTime);

      // Check for enemy shots from bottom row
      let shot = enemy.shoot();
      if (shot && this.gameMode === 'endless') {
        // Scale fire chance in endless mode
        const fireMultiplier = Math.min(1 + (this.wave - 1) * 0.03, 2.5);
        // Apply fire multiplier by increasing the probability of actual fire
        if (Math.random() < fireMultiplier - 1) {
          // Additional shot beyond base probability
          shot = enemy.shoot();
        }
      }
      if (shot) {
        projectiles.push(shot);
      }
    }

    this.dropNext = false;

    return projectiles;
  }

  /**
   * Remove enemy at index
   * @param {Enemy} enemy - Enemy to remove
   * @returns {number} Points earned
   */
  removeEnemy(enemy) {
    enemy.deactivate();
    return enemy.getPoints();
  }

  /**
   * Check if enemies have reached the bottom
   * @returns {boolean}
   */
  hasReachedBottom() {
    const bounds = this.getFormationBounds();
    return bounds.bottom >= GAME.HEIGHT - 100; // Near player
  }

  /**
   * Get current difficulty multiplier
   * @returns {number} Current difficulty multiplier
   */
  getDifficultyMultiplier() {
    return this.difficultyMultiplier;
  }

  /**
   * Draw all enemies
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const enemy of this.getActiveEnemies()) {
      enemy.draw(ctx);
    }
  }
}
