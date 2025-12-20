import { GAME, TOUCH_CONTROLS } from '../constants.js';

/**
 * Renders virtual touch controls overlay
 * Displays on-screen buttons for touch devices
 */
export class TouchControlsRenderer {
  /**
   * Create touch controls renderer
   */
  constructor() {
    // Cache canvas dimensions for responsive scaling
    this.canvasWidth = GAME.WIDTH;
    this.canvasHeight = GAME.HEIGHT;
  }

  /**
   * Update canvas dimensions (for responsive design)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  updateCanvasDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Draw all touch controls
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} buttonPositions - Button positions from TouchControlManager
   * @param {Object} buttonStates - Current pressed states (left, right, fire, pause)
   */
  draw(ctx, buttonPositions, buttonStates) {
    if (!buttonPositions) return;

    // Draw directional buttons
    if (buttonPositions.left) {
      this.drawLeftButton(ctx, buttonPositions.left, buttonStates?.left || false);
    }
    if (buttonPositions.right) {
      this.drawRightButton(ctx, buttonPositions.right, buttonStates?.right || false);
    }

    // Draw fire button
    if (buttonPositions.fire) {
      this.drawFireButton(ctx, buttonPositions.fire, buttonStates?.fire || false);
    }

    // Draw pause button
    if (buttonPositions.pause) {
      this.drawPauseButton(ctx, buttonPositions.pause, buttonStates?.pause || false);
    }
  }

  /**
   * Draw a generic button circle with optional icon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Button center X
   * @param {number} y - Button center Y
   * @param {number} size - Button radius/size
   * @param {boolean} isPressed - Whether button is currently pressed
   * @param {Function} drawIcon - Callback to draw icon inside button
   */
  drawButton(ctx, x, y, size, isPressed, drawIcon) {
    ctx.save();

    // Button colors
    const outlineColor = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_COLOR : TOUCH_CONTROLS.BUTTON_COLOR;
    const fillColor = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_COLOR : 'transparent';
    const opacity = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_OPACITY : TOUCH_CONTROLS.BUTTON_OPACITY;

    // Draw button circle background
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);

    // Fill if pressed, otherwise just outline
    if (isPressed) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Draw outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = opacity;

    // Draw icon using callback
    if (drawIcon) {
      drawIcon(ctx, x, y, size);
    }

    ctx.restore();
  }

  /**
   * Draw left arrow button
   * @param {Object} pos - Position object {x, y}
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawLeftButton(ctx, pos, isPressed) {
    if (!pos || pos.x === undefined || pos.y === undefined) return;

    this.drawButton(ctx, pos.x, pos.y, TOUCH_CONTROLS.BUTTON_SIZE, isPressed, (ctx, x, y, size) => {
      this.drawArrowIcon(ctx, x, y, size, 'left', isPressed);
    });
  }

  /**
   * Draw right arrow button
   * @param {Object} pos - Position object {x, y}
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawRightButton(ctx, pos, isPressed) {
    if (!pos || pos.x === undefined || pos.y === undefined) return;

    this.drawButton(ctx, pos.x, pos.y, TOUCH_CONTROLS.BUTTON_SIZE, isPressed, (ctx, x, y, size) => {
      this.drawArrowIcon(ctx, x, y, size, 'right', isPressed);
    });
  }

  /**
   * Draw fire button (larger, on right side)
   * @param {Object} pos - Position object {x, y}
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawFireButton(ctx, pos, isPressed) {
    if (!pos || pos.x === undefined || pos.y === undefined) return;

    this.drawButton(ctx, pos.x, pos.y, TOUCH_CONTROLS.FIRE.SIZE, isPressed, (ctx, x, y, size) => {
      this.drawFireIcon(ctx, x, y, size, isPressed);
    });
  }

  /**
   * Draw pause button (small, top-right)
   * @param {Object} pos - Position object {x, y}
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawPauseButton(ctx, pos, isPressed) {
    if (!pos || pos.x === undefined || pos.y === undefined) return;

    this.drawButton(ctx, pos.x, pos.y, TOUCH_CONTROLS.PAUSE.SIZE, isPressed, (ctx, x, y, size) => {
      this.drawPauseIcon(ctx, x, y, size, isPressed);
    });
  }

  /**
   * Draw arrow icon (left or right)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} size - Button size
   * @param {'left'|'right'} direction - Arrow direction
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawArrowIcon(ctx, cx, cy, size, direction, isPressed) {
    const color = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_COLOR : TOUCH_CONTROLS.BUTTON_COLOR;
    const iconSize = size * 0.3;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha || 1;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    if (direction === 'left') {
      // Draw left arrow
      ctx.moveTo(cx + iconSize, cy - iconSize);
      ctx.lineTo(cx - iconSize * 0.5, cy);
      ctx.lineTo(cx + iconSize, cy + iconSize);
    } else {
      // Draw right arrow
      ctx.moveTo(cx - iconSize, cy - iconSize);
      ctx.lineTo(cx + iconSize * 0.5, cy);
      ctx.lineTo(cx - iconSize, cy + iconSize);
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw fire icon (crosshair/bullet style)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} size - Button size
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawFireIcon(ctx, cx, cy, size, isPressed) {
    const color = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_COLOR : TOUCH_CONTROLS.BUTTON_COLOR;
    const iconSize = size * 0.25;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha || 1;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw crosshair-style fire icon
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cx, cy - iconSize);
    ctx.lineTo(cx, cy + iconSize);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(cx - iconSize, cy);
    ctx.lineTo(cx + iconSize, cy);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw pause icon (two vertical bars)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} size - Button size
   * @param {boolean} isPressed - Whether button is pressed
   */
  drawPauseIcon(ctx, cx, cy, size, isPressed) {
    const color = isPressed ? TOUCH_CONTROLS.BUTTON_ACTIVE_COLOR : TOUCH_CONTROLS.BUTTON_COLOR;
    const barWidth = size * 0.15;
    const barHeight = size * 0.35;
    const gap = barWidth * 1.5;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha || 1;
    ctx.fillStyle = color;

    // Left bar
    ctx.fillRect(cx - gap / 2 - barWidth / 2, cy - barHeight / 2, barWidth, barHeight);

    // Right bar
    ctx.fillRect(cx + gap / 2 - barWidth / 2, cy - barHeight / 2, barWidth, barHeight);

    ctx.restore();
  }

  /**
   * Draw touch control debug overlay (for development)
   * Shows button positions and hit areas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} buttonPositions - Button positions
   * @param {Object} buttonHitAreas - Button hit areas (with padding)
   */
  drawDebugOverlay(ctx, buttonPositions, buttonHitAreas) {
    if (!buttonPositions) return;

    ctx.save();
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    // Draw hit areas as rectangles
    if (buttonHitAreas) {
      for (const [key, area] of Object.entries(buttonHitAreas)) {
        ctx.strokeRect(area.x, area.y, area.width, area.height);

        // Label
        ctx.fillStyle = '#FF00FF';
        ctx.font = '12px monospace';
        ctx.fillText(key, area.x + 5, area.y + 15);
      }
    }

    ctx.restore();
  }
}
