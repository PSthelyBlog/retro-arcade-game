import { GAME, STARFIELD } from '../constants.js';

/**
 * Starfield class for parallax scrolling background
 * Renders 3 layers of stars with different speeds and visual properties
 * to create a sense of depth and movement
 */
export class Starfield {
  /**
   * Create a new Starfield
   * @param {number} [width=GAME.WIDTH] - Canvas width
   * @param {number} [height=GAME.HEIGHT] - Canvas height
   */
  constructor(width = GAME.WIDTH, height = GAME.HEIGHT) {
    this.width = width;
    this.height = height;
    this.baseSpeed = STARFIELD.BASE_SPEED;

    // Layer definitions from constants with star arrays
    this.layers = STARFIELD.LAYERS.map(layerConfig => ({
      count: layerConfig.count,
      size: layerConfig.size,
      color: layerConfig.color,
      speed: layerConfig.speed,
      stars: [],
    }));

    // Initialize stars for each layer
    this.initializeStars();
  }

  /**
   * Initialize star positions randomly for all layers
   * Uses count from STARFIELD constants
   */
  initializeStars() {
    for (const layer of this.layers) {
      for (let i = 0; i < layer.count; i++) {
        const star = {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
        };
        layer.stars.push(star);
      }
    }
  }

  /**
   * Update star positions based on deltaTime
   * Stars move downward (simulating vertical scrolling) at different speeds
   * Stars wrap around when they pass the bottom of the screen
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    // Convert deltaTime from milliseconds to seconds for speed calculation
    const deltaSeconds = deltaTime / 1000;

    for (const layer of this.layers) {
      for (const star of layer.stars) {
        // Move star down based on layer speed and base speed
        // Speed is in pixels per second (baseSpeed * layer.speed)
        star.y += layer.speed * this.baseSpeed * deltaSeconds;

        // Wrap around: if star goes past bottom, move it to top
        if (star.y >= this.height) {
          star.y = -layer.size;
          // Randomize x position when wrapping
          star.x = Math.random() * this.width;
        }
      }
    }
  }

  /**
   * Draw all stars to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   */
  draw(ctx) {
    // Draw each layer (far to near for proper depth ordering)
    for (const layer of this.layers) {
      ctx.fillStyle = layer.color;

      for (const star of layer.stars) {
        // Draw each star as a filled rectangle
        // Using integer coordinates for crisp pixel-perfect appearance
        ctx.fillRect(
          Math.round(star.x),
          Math.round(star.y),
          layer.size,
          layer.size
        );
      }
    }
  }
}
