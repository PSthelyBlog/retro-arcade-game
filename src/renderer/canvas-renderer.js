import { GAME, UI } from '../constants.js';
import { padNumber } from '../utils/helpers.js';

/**
 * Canvas rendering system
 */
export class CanvasRenderer {
  /**
   * Create renderer
   * @param {string} canvasId - Canvas element ID
   */
  constructor(canvasId = 'gameCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = GAME.WIDTH;
    this.canvas.height = GAME.HEIGHT;

    // Pixel-perfect rendering for retro look
    this.ctx.imageSmoothingEnabled = false;

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTime = 0;
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.fillStyle = GAME.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Apply screen shake effect
   * @param {number} intensity - Shake intensity in pixels
   * @param {number} duration - Duration in ms
   */
  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  /**
   * Update screen shake
   * @param {number} deltaTime
   */
  updateShake(deltaTime) {
    if (this.shakeDuration > 0) {
      this.shakeTime += deltaTime;
      if (this.shakeTime >= this.shakeDuration) {
        this.shakeDuration = 0;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        const progress = this.shakeTime / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);
        const offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        const offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        this.ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
      }
    }
  }

  /**
   * Draw HUD (score, lives, level)
   * @param {number} score - Current score
   * @param {number} highScore - High score
   * @param {number} lives - Player lives
   * @param {number} level - Current level
   * @param {Object} [controllerStatus] - Controller connection status
   */
  drawHUD(score, highScore, lives, level, controllerStatus = null) {
    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `${UI.FONT_SIZE}px ${UI.FONT_FAMILY}`;

    // Score
    this.ctx.fillText(`SCORE: ${padNumber(score, 6)}`, UI.SCORE_X, UI.SCORE_Y);

    // High Score
    this.ctx.fillText(`HI: ${padNumber(highScore, 6)}`, UI.SCORE_X + 250, UI.SCORE_Y);

    // Level
    this.ctx.fillText(`LVL ${level}`, UI.LEVEL_X + 100, UI.LEVEL_Y);

    // Lives
    this.ctx.fillText(`LIVES: `, UI.LIVES_X, UI.LIVES_Y);

    // Draw life icons
    for (let i = 0; i < lives; i++) {
      this.drawLifeIcon(UI.LIVES_X + 100 + i * 30, UI.LIVES_Y - 15);
    }

    // Controller indicator (bottom right)
    if (controllerStatus && controllerStatus.connected) {
      this.drawControllerIcon(GAME.WIDTH - 40, GAME.HEIGHT - 25);
    }
  }

  /**
   * Draw controller connected icon
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawControllerIcon(x, y) {
    this.ctx.fillStyle = '#00FF00';

    // Controller body
    this.ctx.fillRect(x, y, 30, 16);

    // Bumpers
    this.ctx.fillRect(x + 2, y - 3, 8, 4);
    this.ctx.fillRect(x + 20, y - 3, 8, 4);

    // D-pad
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x + 5, y + 5, 6, 6);

    // Buttons
    this.ctx.fillRect(x + 20, y + 5, 6, 6);

    // Sticks
    this.ctx.fillStyle = '#00AA00';
    this.ctx.fillRect(x + 10, y + 10, 4, 4);
    this.ctx.fillRect(x + 16, y + 10, 4, 4);
  }

  /**
   * Draw small player ship icon for lives
   * @param {number} x
   * @param {number} y
   */
  drawLifeIcon(x, y) {
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(x + 5, y + 5, 10, 10);
    this.ctx.fillRect(x + 8, y, 4, 8);
    this.ctx.fillRect(x, y + 10, 5, 5);
    this.ctx.fillRect(x + 15, y + 10, 5, 5);
  }

  /**
   * Draw game over screen
   * @param {number} finalScore
   * @param {number} highScore
   * @param {boolean} [hasController=false] - Whether controller is connected
   */
  drawGameOver(finalScore, highScore, hasController = false) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = `40px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `20px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(`FINAL SCORE: ${padNumber(finalScore, 6)}`, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 10);

    if (finalScore >= highScore && finalScore > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('NEW HIGH SCORE!', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50);
    }

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    const restartText = hasController ? 'PRESS R OR SELECT TO RESTART' : 'PRESS R TO RESTART';
    this.ctx.fillText(restartText, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 100);

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw pause screen
   * @param {boolean} [hasController=false] - Whether controller is connected
   */
  drawPause(hasController = false) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = `40px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', GAME.WIDTH / 2, GAME.HEIGHT / 2);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    const resumeText = hasController ? 'PRESS P OR START TO RESUME' : 'PRESS P TO RESUME';
    this.ctx.fillText(resumeText, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50);

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw level complete screen
   * @param {number} level
   */
  drawLevelComplete(level) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `40px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${level} COMPLETE!`, GAME.WIDTH / 2, GAME.HEIGHT / 2);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('GET READY...', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50);

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw start screen
   * @param {Object} [controllerStatus] - Controller connection status
   */
  drawStartScreen(controllerStatus = null) {
    this.ctx.fillStyle = GAME.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Title
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `36px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RETRO ARCADE', GAME.WIDTH / 2, 150);

    this.ctx.fillStyle = '#FF6600';
    this.ctx.fillText('SPACE INVADERS', GAME.WIDTH / 2, 200);

    // Instructions - Keyboard
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `12px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('KEYBOARD', GAME.WIDTH / 2, 260);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;

    const keyboardInstructions = [
      '← →  or  A D  :  MOVE',
      'SPACE  :  FIRE',
      'P  :  PAUSE    M  :  MUTE',
    ];

    let y = 285;
    for (const line of keyboardInstructions) {
      this.ctx.fillText(line, GAME.WIDTH / 2, y);
      y += 28;
    }

    // Instructions - Controller
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `12px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('CONTROLLER', GAME.WIDTH / 2, y + 10);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;

    const controllerInstructions = [
      'D-PAD / STICK  :  MOVE',
      'A / RB / RT  :  FIRE',
      'START  :  PAUSE',
    ];

    y += 35;
    for (const line of controllerInstructions) {
      this.ctx.fillText(line, GAME.WIDTH / 2, y);
      y += 28;
    }

    // Controller status indicator
    if (controllerStatus) {
      if (controllerStatus.connected) {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText(`🎮 ${controllerStatus.name} CONNECTED`, GAME.WIDTH / 2, y + 25);
      } else {
        this.ctx.fillStyle = '#666666';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText('🎮 NO CONTROLLER DETECTED', GAME.WIDTH / 2, y + 25);
      }
    }

    // Blinking start text
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.font = `20px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('PRESS SPACE OR A TO START', GAME.WIDTH / 2, 540);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw explosion effect
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} frame - Animation frame (0-5)
   */
  drawExplosion(x, y, frame) {
    const colors = ['#FFFFFF', '#FFFF00', '#FF6600', '#FF0000'];
    const radius = 5 + frame * 4;

    this.ctx.fillStyle = colors[Math.min(frame, colors.length - 1)];

    // Draw expanding particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + frame * 0.2;
      const distance = radius;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      const size = Math.max(2, 6 - frame);
      this.ctx.fillRect(px - size / 2, py - size / 2, size, size);
    }
  }

  /**
   * Get canvas context for direct drawing
   * @returns {CanvasRenderingContext2D}
   */
  getContext() {
    return this.ctx;
  }
}
