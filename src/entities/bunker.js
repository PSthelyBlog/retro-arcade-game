import { Entity } from './entity.js';
import { BUNKER } from '../constants.js';

/**
 * Defensive bunker with destructible pixels
 */
export class Bunker extends Entity {
  /**
   * Create bunker
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  constructor(x, y) {
    super(x, y, BUNKER.WIDTH, BUNKER.HEIGHT);
    this.pixelSize = BUNKER.PIXEL_SIZE;
    this.color = BUNKER.COLOR;

    // Create pixel grid
    this.cols = Math.ceil(this.width / this.pixelSize);
    this.rows = Math.ceil(this.height / this.pixelSize);
    this.pixels = this.createBunkerShape();
  }

  /**
   * Create the bunker shape (arch pattern)
   * @returns {boolean[][]} 2D array of pixel states
   */
  createBunkerShape() {
    const pixels = [];
    const midCol = Math.floor(this.cols / 2);
    const archTop = Math.floor(this.rows * 0.6);
    const archWidth = Math.floor(this.cols * 0.3);

    for (let row = 0; row < this.rows; row++) {
      pixels[row] = [];
      for (let col = 0; col < this.cols; col++) {
        // Top rounded corners
        if (row === 0 && (col === 0 || col === this.cols - 1)) {
          pixels[row][col] = false;
        }
        // Arch cutout at bottom
        else if (
          row >= archTop &&
          col >= midCol - archWidth &&
          col <= midCol + archWidth
        ) {
          pixels[row][col] = false;
        } else {
          pixels[row][col] = true;
        }
      }
    }
    return pixels;
  }

  /**
   * Check if a point hits the bunker and damage it
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @param {number} radius - Damage radius in pixels
   * @returns {boolean} True if bunker was hit
   */
  hitTest(px, py, radius = 1) {
    // Check if point is within bunker bounds
    if (
      px < this.x ||
      px > this.x + this.width ||
      py < this.y ||
      py > this.y + this.height
    ) {
      return false;
    }

    // Find pixel coordinates
    const col = Math.floor((px - this.x) / this.pixelSize);
    const row = Math.floor((py - this.y) / this.pixelSize);

    // Check if pixel exists and destroy it
    if (
      row >= 0 &&
      row < this.rows &&
      col >= 0 &&
      col < this.cols &&
      this.pixels[row][col]
    ) {
      // Destroy pixels in radius
      this.damageArea(col, row, radius);
      return true;
    }

    return false;
  }

  /**
   * Damage pixels in an area
   * @param {number} centerCol - Center column
   * @param {number} centerRow - Center row
   * @param {number} radius - Damage radius
   */
  damageArea(centerCol, centerRow, radius) {
    for (let r = -radius; r <= radius; r++) {
      for (let c = -radius; c <= radius; c++) {
        const row = centerRow + r;
        const col = centerCol + c;
        if (
          row >= 0 &&
          row < this.rows &&
          col >= 0 &&
          col < this.cols
        ) {
          // Random chance to destroy nearby pixels
          if (Math.abs(r) + Math.abs(c) <= radius && Math.random() > 0.3) {
            this.pixels[row][col] = false;
          }
        }
      }
    }
  }

  /**
   * Check if bunker is completely destroyed
   * @returns {boolean} True if no pixels remain
   */
  isDestroyed() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.pixels[row][col]) return false;
      }
    }
    return true;
  }

  /**
   * Reset bunker to full health
   */
  reset() {
    this.pixels = this.createBunkerShape();
  }

  /**
   * Draw bunker
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.pixels[row][col]) {
          ctx.fillRect(
            this.x + col * this.pixelSize,
            this.y + row * this.pixelSize,
            this.pixelSize,
            this.pixelSize
          );
        }
      }
    }
  }
}
