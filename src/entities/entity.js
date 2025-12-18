/**
 * Base Entity class for all game objects
 */
export class Entity {
  /**
   * Create a new entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Entity width
   * @param {number} height - Entity height
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.active = true;
  }

  /**
   * Get bounding box for collision detection
   * @returns {Object} Bounding box {left, right, top, bottom, x, y, width, height}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }

  /**
   * Get center position
   * @returns {Object} Center {x, y}
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  /**
   * Update entity state (override in subclass)
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Base implementation - apply velocity
    this.x += this.velocityX * (deltaTime / 16.67);
    this.y += this.velocityY * (deltaTime / 16.67);
  }

  /**
   * Draw entity (override in subclass)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    // Default: draw a rectangle
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  /**
   * Deactivate entity (for object pooling)
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Reactivate entity with new position
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  activate(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }
}
