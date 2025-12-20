import { Entity } from './entity.js';
import { PLAYER, GAME } from '../constants.js';
import { clamp } from '../utils/helpers.js';

/**
 * Player ship entity
 */
export class Player extends Entity {
  /**
   * Create player ship
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   */
  constructor(x = GAME.WIDTH / 2 - PLAYER.WIDTH / 2, y = PLAYER.START_Y) {
    super(x, y, PLAYER.WIDTH, PLAYER.HEIGHT);
    this.lives = PLAYER.LIVES;
    this.lastFireTime = 0;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.invulnerableDuration = 2000; // 2 seconds of invulnerability
    this.blinkRate = 100; // ms
    this.visible = true;

    // Power-up state
    this.shieldActive = false;
    this.fireRateMultiplier = 1.0;
    this.multiShotConfig = null;
  }

  /**
   * Move player left
   */
  moveLeft() {
    this.x = clamp(this.x - PLAYER.SPEED, 0, GAME.WIDTH - this.width);
  }

  /**
   * Move player right
   */
  moveRight() {
    this.x = clamp(this.x + PLAYER.SPEED, 0, GAME.WIDTH - this.width);
  }

  /**
   * Attempt to fire a projectile
   * @param {number} currentTime - Current game time
   * @returns {Object[]|null} Array of projectile data or null if on cooldown
   */
  shoot(currentTime) {
    const effectiveFireRate = PLAYER.FIRE_RATE * this.fireRateMultiplier;

    if (currentTime - this.lastFireTime >= effectiveFireRate) {
      this.lastFireTime = currentTime;

      const baseX = this.x + this.width / 2 - 2;
      const baseY = this.y - 10;

      // Multi-shot: fire spread pattern
      if (this.multiShotConfig) {
        const { projectileCount, spreadAngle } = this.multiShotConfig;
        const projectiles = [];
        const angleStep = (spreadAngle * Math.PI / 180);
        const startAngle = -((projectileCount - 1) / 2) * angleStep;

        for (let i = 0; i < projectileCount; i++) {
          const angle = startAngle + i * angleStep;
          projectiles.push({
            x: baseX,
            y: baseY,
            isPlayerBullet: true,
            angle: angle, // Will be used by ProjectileManager
          });
        }
        return projectiles;
      }

      // Normal single shot
      return [{
        x: baseX,
        y: baseY,
        isPlayerBullet: true,
        angle: 0,
      }];
    }
    return null;
  }

  /**
   * Handle player being hit
   * @returns {Object} {died: boolean, shieldConsumed: boolean}
   */
  hit() {
    // Shield absorbs hit
    if (this.shieldActive) {
      this.shieldActive = false;
      return { died: false, shieldConsumed: true };
    }

    if (this.invulnerable) {
      return { died: false, shieldConsumed: false };
    }

    this.lives--;
    if (this.lives > 0) {
      this.setInvulnerable();
      return { died: false, shieldConsumed: false };
    }
    return { died: true, shieldConsumed: false };
  }

  /**
   * Set player invulnerable for a duration
   */
  setInvulnerable() {
    this.invulnerable = true;
    this.invulnerableTime = 0;
  }

  /**
   * Set shield state
   * @param {boolean} active
   */
  setShield(active) {
    this.shieldActive = active;
  }

  /**
   * Set fire rate multiplier (for rapid fire power-up)
   * @param {number} multiplier - 1.0 = normal, 0.5 = faster
   */
  setFireRateMultiplier(multiplier) {
    this.fireRateMultiplier = multiplier;
  }

  /**
   * Set multi-shot configuration
   * @param {Object|null} config - {projectileCount, spreadAngle} or null
   */
  setMultiShotConfig(config) {
    this.multiShotConfig = config;
  }

  /**
   * Check if shield is active
   * @returns {boolean}
   */
  hasShield() {
    return this.shieldActive;
  }

  /**
   * Reset player to starting position
   */
  reset() {
    this.x = GAME.WIDTH / 2 - PLAYER.WIDTH / 2;
    this.y = PLAYER.START_Y;
    this.lives = PLAYER.LIVES;
    this.invulnerable = false;
    this.visible = true;
    this.lastFireTime = 0;

    // Reset power-up state
    this.shieldActive = false;
    this.fireRateMultiplier = 1.0;
    this.multiShotConfig = null;
  }

  /**
   * Update player state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (this.invulnerable) {
      this.invulnerableTime += deltaTime;

      // Blink effect
      this.visible = Math.floor(this.invulnerableTime / this.blinkRate) % 2 === 0;

      if (this.invulnerableTime >= this.invulnerableDuration) {
        this.invulnerable = false;
        this.visible = true;
      }
    }
  }

  /**
   * Draw player ship
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    if (!this.visible) return;

    // Draw shield bubble if active
    if (this.shieldActive) {
      ctx.save();
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        Math.max(this.width, this.height) / 2 + 8,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = PLAYER.COLOR;

    // Draw ship body (simple triangle-ish shape)
    ctx.beginPath();

    // Main body
    ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, this.height - 10);

    // Top cannon
    ctx.fillRect(this.x + this.width / 2 - 3, this.y, 6, 15);

    // Side wings
    ctx.fillRect(this.x, this.y + 20, 8, 10);
    ctx.fillRect(this.x + this.width - 8, this.y + 20, 8, 10);

    ctx.closePath();
  }
}
