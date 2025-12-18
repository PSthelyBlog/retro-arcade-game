import { Projectile } from '../entities/projectile.js';

/**
 * Manages all projectiles (player and enemy)
 */
export class ProjectileManager {
  constructor() {
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.maxPlayerProjectiles = 3; // Limit simultaneous player shots
  }

  /**
   * Add player projectile
   * @param {Object} data - {x, y, isPlayerBullet}
   * @returns {boolean} True if projectile was added
   */
  addPlayerProjectile(data) {
    // Limit player projectiles on screen
    const active = this.playerProjectiles.filter((p) => p.active);
    if (active.length >= this.maxPlayerProjectiles) {
      return false;
    }

    this.playerProjectiles.push(
      new Projectile(data.x, data.y, true)
    );
    return true;
  }

  /**
   * Add enemy projectile
   * @param {Object} data - {x, y, isPlayerBullet}
   */
  addEnemyProjectile(data) {
    this.enemyProjectiles.push(
      new Projectile(data.x, data.y, false)
    );
  }

  /**
   * Get active player projectiles
   * @returns {Projectile[]}
   */
  getActivePlayerProjectiles() {
    return this.playerProjectiles.filter((p) => p.active);
  }

  /**
   * Get active enemy projectiles
   * @returns {Projectile[]}
   */
  getActiveEnemyProjectiles() {
    return this.enemyProjectiles.filter((p) => p.active);
  }

  /**
   * Update all projectiles
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // Update player projectiles
    for (const projectile of this.playerProjectiles) {
      if (projectile.active) {
        projectile.update(deltaTime);
      }
    }

    // Update enemy projectiles
    for (const projectile of this.enemyProjectiles) {
      if (projectile.active) {
        projectile.update(deltaTime);
      }
    }

    // Clean up inactive projectiles periodically
    this.cleanup();
  }

  /**
   * Remove inactive projectiles from arrays
   */
  cleanup() {
    // Only cleanup if arrays are getting large
    if (this.playerProjectiles.length > 20) {
      this.playerProjectiles = this.playerProjectiles.filter((p) => p.active);
    }
    if (this.enemyProjectiles.length > 50) {
      this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.active);
    }
  }

  /**
   * Clear all projectiles
   */
  clear() {
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
  }

  /**
   * Draw all projectiles
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const projectile of this.getActivePlayerProjectiles()) {
      projectile.draw(ctx);
    }
    for (const projectile of this.getActiveEnemyProjectiles()) {
      projectile.draw(ctx);
    }
  }
}
