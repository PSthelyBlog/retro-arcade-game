import { Enemy } from '../entities/enemy.js';
import { ENEMY, GAME } from '../constants.js';

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
   */
  createFormation() {
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

    for (let row = 0; row < ENEMY.ROWS; row++) {
      for (let col = 0; col < ENEMY.COLS; col++) {
        const x = ENEMY.START_X + col * ENEMY.HORIZONTAL_SPACING;
        const y = ENEMY.START_Y + row * ENEMY.VERTICAL_SPACING;
        this.enemies.push(new Enemy(x, y, row, col));
      }
    }

    this.totalEnemies = this.enemies.length;
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
