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
   * @returns {Object|null} Projectile data or null if on cooldown
   */
  shoot(currentTime) {
    if (currentTime - this.lastFireTime >= PLAYER.FIRE_RATE) {
      this.lastFireTime = currentTime;
      return {
        x: this.x + this.width / 2 - 2,
        y: this.y - 10,
        isPlayerBullet: true,
      };
    }
    return null;
  }

  /**
   * Handle player being hit
   * @returns {boolean} True if player died (no lives left)
   */
  hit() {
    if (this.invulnerable) return false;

    this.lives--;
    if (this.lives > 0) {
      this.setInvulnerable();
      return false;
    }
    return true;
  }

  /**
   * Set player invulnerable for a duration
   */
  setInvulnerable() {
    this.invulnerable = true;
    this.invulnerableTime = 0;
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
