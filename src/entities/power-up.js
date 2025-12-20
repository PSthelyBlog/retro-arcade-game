import { Entity } from './entity.js';
import { POWERUPS, GAME } from '../constants.js';

/**
 * Power-up collectible entity
 * Drops from enemies and provides bonuses when collected
 */
export class PowerUp extends Entity {
  /**
   * Create power-up
   * @param {number} x - X position (center)
   * @param {number} y - Y position (center)
   * @param {string} type - Power-up type key from POWERUPS.TYPES
   */
  constructor(x, y, type) {
    const size = POWERUPS.SIZE;
    super(x - size / 2, y - size / 2, size, size);

    this.type = type;
    this.typeConfig = POWERUPS.TYPES[type];
    this.color = this.typeConfig.color;
    this.duration = this.typeConfig.duration;

    // Animation state
    this.pulsePhase = 0;
    this.rotationAngle = 0;

    // Lifetime tracking
    this.lifetime = 0;
    this.expireTime = POWERUPS.EXPIRE_TIME;
  }

  /**
   * Update power-up state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Move downward
    this.y += POWERUPS.FALL_SPEED * (deltaTime / 16.67);

    // Update animation
    this.pulsePhase += POWERUPS.PULSE_SPEED * (deltaTime / 16.67);
    this.rotationAngle += 0.05 * (deltaTime / 16.67);

    // Track lifetime
    this.lifetime += deltaTime;

    // Deactivate if expired or off screen
    if (this.lifetime >= this.expireTime || this.y > GAME.HEIGHT) {
      this.deactivate();
    }
  }

  /**
   * Check if power-up is about to expire (for blink warning)
   * @returns {boolean}
   */
  isExpiringSoon() {
    return this.lifetime >= this.expireTime - 2000; // Last 2 seconds
  }

  /**
   * Get icon symbol for this power-up type
   * @returns {string}
   */
  getIcon() {
    const icons = {
      SHIELD: '🛡️',
      RAPID_FIRE: '⚡',
      MULTI_SHOT: '↗',
      BOMB: '💣',
      EXTRA_LIFE: '❤️',
    };
    return icons[this.type] || '?';
  }

  /**
   * Draw power-up
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    if (!this.active) return;

    // Blink when expiring soon
    if (this.isExpiringSoon() && Math.floor(this.lifetime / 100) % 2 === 0) {
      return;
    }

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
    const size = (this.width / 2) * pulse;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotationAngle);

    // Outer glow
    ctx.fillStyle = this.color + '40'; // 25% opacity
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = this.color;

    // Draw shape based on type
    switch (this.type) {
      case 'SHIELD':
        this.drawShield(ctx, size);
        break;
      case 'RAPID_FIRE':
        this.drawLightning(ctx, size);
        break;
      case 'MULTI_SHOT':
        this.drawTripleArrow(ctx, size);
        break;
      case 'BOMB':
        this.drawBomb(ctx, size);
        break;
      case 'EXTRA_LIFE':
        this.drawHeart(ctx, size);
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  // Helper drawing methods
  drawShield(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.8, -size * 0.5);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.8, size * 0.3);
    ctx.lineTo(-size * 0.8, -size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  drawLightning(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size);
    ctx.lineTo(-size * 0.2, -size * 0.1);
    ctx.lineTo(size * 0.2, -size * 0.1);
    ctx.lineTo(-size * 0.3, size);
    ctx.lineTo(size * 0.2, size * 0.1);
    ctx.lineTo(-size * 0.2, size * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  drawTripleArrow(ctx, size) {
    // Center arrow
    this.drawArrow(ctx, 0, 0, size * 0.6);
    // Left arrow
    ctx.save();
    ctx.rotate(-Math.PI / 6);
    this.drawArrow(ctx, 0, 0, size * 0.5);
    ctx.restore();
    // Right arrow
    ctx.save();
    ctx.rotate(Math.PI / 6);
    this.drawArrow(ctx, 0, 0, size * 0.5);
    ctx.restore();
  }

  drawArrow(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.4, y);
    ctx.lineTo(x + size * 0.15, y);
    ctx.lineTo(x + size * 0.15, y + size * 0.6);
    ctx.lineTo(x - size * 0.15, y + size * 0.6);
    ctx.lineTo(x - size * 0.15, y);
    ctx.lineTo(x - size * 0.4, y);
    ctx.closePath();
    ctx.fill();
  }

  drawBomb(ctx, size) {
    // Circle body
    ctx.beginPath();
    ctx.arc(0, size * 0.15, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Fuse
    ctx.fillRect(-size * 0.1, -size * 0.5, size * 0.2, size * 0.4);
    // Spark
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -size * 0.6, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHeart(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.8);
    ctx.bezierCurveTo(-size, 0, -size, -size * 0.8, 0, -size * 0.4);
    ctx.bezierCurveTo(size, -size * 0.8, size, 0, 0, size * 0.8);
    ctx.fill();
  }
}
