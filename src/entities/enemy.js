import { Entity } from './entity.js';
import { ENEMY } from '../constants.js';

/**
 * Alien enemy entity
 */
export class Enemy extends Entity {
  /**
   * Create enemy alien
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} row - Row index (for color and points)
   * @param {number} col - Column index
   */
  constructor(x, y, row, col) {
    super(x, y, ENEMY.WIDTH, ENEMY.HEIGHT);
    this.row = row;
    this.col = col;
    this.color = ENEMY.COLORS[row % ENEMY.COLORS.length];
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 500; // ms per frame
  }

  /**
   * Get points value for this enemy
   * @returns {number} Point value
   */
  getPoints() {
    // Top rows worth more
    const rowFromTop = ENEMY.ROWS - 1 - this.row;
    if (rowFromTop <= 1) return 30;
    if (rowFromTop <= 3) return 20;
    return 10;
  }

  /**
   * Attempt to fire a projectile
   * @returns {Object|null} Projectile data or null
   */
  shoot() {
    if (Math.random() < ENEMY.FIRE_CHANCE) {
      return {
        x: this.x + this.width / 2 - 2,
        y: this.y + this.height,
        isPlayerBullet: false,
      };
    }
    return null;
  }

  /**
   * Update enemy state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.animationTimer += deltaTime;
    if (this.animationTimer >= this.animationSpeed) {
      this.animationFrame = (this.animationFrame + 1) % 2;
      this.animationTimer = 0;
    }
  }

  /**
   * Draw enemy alien
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    // Simple alien shape that alternates for animation
    if (this.animationFrame === 0) {
      // Frame 1 - legs down
      // Body
      ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
      ctx.fillRect(this.x + this.width - 12, this.y + 8, 4, 4);
      // Legs down
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x + 2, this.y + this.height - 8, 6, 8);
      ctx.fillRect(this.x + this.width - 8, this.y + this.height - 8, 6, 8);
      // Antennae
      ctx.fillRect(this.x + 8, this.y, 3, 6);
      ctx.fillRect(this.x + this.width - 11, this.y, 3, 6);
    } else {
      // Frame 2 - legs up
      // Body
      ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
      ctx.fillRect(this.x + this.width - 12, this.y + 8, 4, 4);
      // Legs up/out
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y + 12, 6, 6);
      ctx.fillRect(this.x + this.width - 6, this.y + 12, 6, 6);
      // Antennae
      ctx.fillRect(this.x + 6, this.y, 3, 6);
      ctx.fillRect(this.x + this.width - 9, this.y, 3, 6);
    }
  }
}
