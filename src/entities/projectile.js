import { Entity } from './entity.js';
import { PROJECTILE, GAME } from '../constants.js';

/**
 * Projectile (bullet/laser) entity
 */
export class Projectile extends Entity {
  /**
   * Create projectile
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} isPlayerBullet - True if fired by player
   */
  constructor(x, y, isPlayerBullet = true) {
    super(x, y, PROJECTILE.WIDTH, PROJECTILE.HEIGHT);
    this.isPlayerBullet = isPlayerBullet;
    this.velocityY = isPlayerBullet ? -PROJECTILE.PLAYER_SPEED : PROJECTILE.ENEMY_SPEED;
    this.color = isPlayerBullet ? PROJECTILE.PLAYER_COLOR : PROJECTILE.ENEMY_COLOR;
  }

  /**
   * Update projectile position
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.y += this.velocityY * (deltaTime / 16.67);

    // Deactivate if off screen
    if (this.y < -this.height || this.y > GAME.HEIGHT) {
      this.deactivate();
    }
  }

  /**
   * Draw projectile
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    if (this.isPlayerBullet) {
      // Player bullet - simple rectangle
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      // Enemy bullet - zigzag pattern
      ctx.fillRect(this.x, this.y, this.width, 4);
      ctx.fillRect(this.x - 2, this.y + 4, this.width, 4);
      ctx.fillRect(this.x, this.y + 8, this.width, 4);
    }
  }
}
