import { Entity } from './entity.js';
import { MYSTERY_SHIP, GAME } from '../constants.js';
import { randomElement } from '../utils/helpers.js';

/**
 * Mystery UFO ship that appears randomly
 */
export class MysteryShip extends Entity {
  /**
   * Create mystery ship
   * @param {boolean} fromLeft - True if entering from left side
   */
  constructor(fromLeft = true) {
    const x = fromLeft ? -MYSTERY_SHIP.WIDTH : GAME.WIDTH;
    super(x, 40, MYSTERY_SHIP.WIDTH, MYSTERY_SHIP.HEIGHT);

    this.direction = fromLeft ? 1 : -1;
    this.velocityX = MYSTERY_SHIP.SPEED * this.direction;
    this.color = MYSTERY_SHIP.COLOR;
    this.pointValue = randomElement(MYSTERY_SHIP.SCORES);
  }

  /**
   * Get points value
   * @returns {number} Random point value
   */
  getPoints() {
    return this.pointValue;
  }

  /**
   * Update mystery ship position
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.x += this.velocityX * (deltaTime / 16.67);

    // Deactivate if off screen
    if (
      (this.direction > 0 && this.x > GAME.WIDTH) ||
      (this.direction < 0 && this.x < -this.width)
    ) {
      this.deactivate();
    }
  }

  /**
   * Draw mystery ship
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    // UFO body (ellipse-ish shape)
    ctx.beginPath();

    // Main dome
    ctx.fillRect(this.x + 15, this.y, 20, 8);

    // Middle section
    ctx.fillRect(this.x + 5, this.y + 6, 40, 8);

    // Bottom lights
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(this.x + 8, this.y + 14, 4, 4);
    ctx.fillRect(this.x + 18, this.y + 14, 4, 4);
    ctx.fillRect(this.x + 28, this.y + 14, 4, 4);
    ctx.fillRect(this.x + 38, this.y + 14, 4, 4);

    ctx.closePath();
  }
}
