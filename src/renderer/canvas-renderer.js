import { GAME, UI, NAME_ENTRY, POWERUPS } from '../constants.js';
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
   * @param {number} [comboCount=0] - Current combo count
   * @param {number} [multiplier=1.0] - Score multiplier
   */
  drawHUD(score, highScore, lives, level, controllerStatus = null, comboCount = 0, multiplier = 1.0) {
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

    // Draw combo HUD if active
    if (comboCount >= 2) {
      this.drawComboHUD(comboCount, multiplier, true);
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
   * @param {string} [nextFormationType] - Optional next formation type to display
   */
  drawLevelComplete(level, nextFormationType = null) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `40px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${level} COMPLETE!`, GAME.WIDTH / 2, GAME.HEIGHT / 2);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('GET READY...', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50);

    // Show next formation if provided
    if (nextFormationType) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = `14px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(`NEXT: ${nextFormationType}`, GAME.WIDTH / 2, GAME.HEIGHT - 40);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw start screen
   * Note: Does not clear canvas - starfield is drawn behind in game.js
   * @param {Object} [controllerStatus] - Controller connection status
   */
  drawStartScreen(controllerStatus = null) {
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
   * Draw name entry screen (classic arcade style)
   * @param {number} score - Final score achieved
   * @param {number} rank - Rank on leaderboard (1-based)
   * @param {string[]} initials - Current initials array (3 chars)
   * @param {number} cursorPos - Current cursor position (0-2)
   * @param {boolean} confirmed - Whether entry is confirmed
   * @param {boolean} [hasController=false] - Whether controller is connected
   */
  drawNameEntry(score, rank, initials, cursorPos, confirmed, hasController = false) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.textAlign = 'center';

    // "NEW HIGH SCORE" header
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `32px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('NEW HIGH SCORE!', GAME.WIDTH / 2, 100);

    // Rank display
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `20px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(`RANK #${rank}`, GAME.WIDTH / 2, 150);

    // Score display
    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `28px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(`${padNumber(score, 6)}`, GAME.WIDTH / 2, 200);

    // "ENTER YOUR INITIALS" instruction
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('ENTER YOUR INITIALS', GAME.WIDTH / 2, 270);

    // Draw the 3-character entry boxes
    const boxWidth = 60;
    const boxHeight = 70;
    const boxSpacing = 20;
    const totalWidth = boxWidth * 3 + boxSpacing * 2;
    const startX = (GAME.WIDTH - totalWidth) / 2;
    const boxY = 300;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (boxWidth + boxSpacing);

      // Box background
      this.ctx.fillStyle = '#111111';
      this.ctx.fillRect(x, boxY, boxWidth, boxHeight);

      // Box border
      const isCurrentPos = i === cursorPos && !confirmed;
      this.ctx.strokeStyle = isCurrentPos ? '#FFD700' : '#444444';
      this.ctx.lineWidth = isCurrentPos ? 3 : 2;
      this.ctx.strokeRect(x, boxY, boxWidth, boxHeight);

      // Character
      this.ctx.fillStyle = confirmed ? '#00FF00' : (isCurrentPos ? '#FFFFFF' : '#888888');
      this.ctx.font = `36px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(initials[i], x + boxWidth / 2, boxY + 50);

      // Blinking cursor under current position
      if (isCurrentPos && !confirmed) {
        const blink = Math.floor(Date.now() / NAME_ENTRY.BLINK_RATE) % 2 === 0;
        if (blink) {
          this.ctx.fillStyle = '#FFD700';
          this.ctx.fillRect(x + 10, boxY + boxHeight - 8, boxWidth - 20, 4);
        }
      }
    }

    // Up/Down arrows for current position
    if (!confirmed) {
      const currentX = startX + cursorPos * (boxWidth + boxSpacing) + boxWidth / 2;

      // Up arrow
      this.ctx.fillStyle = '#FFD700';
      this.drawArrow(currentX, boxY - 15, 'up');

      // Down arrow
      this.drawArrow(currentX, boxY + boxHeight + 15, 'down');
    }

    // Instructions
    this.ctx.fillStyle = '#888888';
    this.ctx.font = `12px ${UI.FONT_FAMILY}`;

    if (confirmed) {
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = `16px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('SAVED!', GAME.WIDTH / 2, 450);
    } else {
      if (hasController) {
        this.ctx.fillText('D-PAD UP/DOWN: CHANGE LETTER', GAME.WIDTH / 2, 430);
        this.ctx.fillText('D-PAD LEFT/RIGHT: MOVE  |  A: CONFIRM', GAME.WIDTH / 2, 455);
      } else {
        this.ctx.fillText('UP/DOWN OR W/S: CHANGE LETTER', GAME.WIDTH / 2, 430);
        this.ctx.fillText('LEFT/RIGHT: MOVE  |  ENTER OR SPACE: CONFIRM', GAME.WIDTH / 2, 455);
      }

      // Tip for direct keyboard input
      this.ctx.fillStyle = '#555555';
      this.ctx.fillText('(OR TYPE LETTERS DIRECTLY)', GAME.WIDTH / 2, 480);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw an arrow (up or down)
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {'up'|'down'} direction
   */
  drawArrow(x, y, direction) {
    this.ctx.beginPath();
    if (direction === 'up') {
      this.ctx.moveTo(x, y - 8);
      this.ctx.lineTo(x - 10, y + 5);
      this.ctx.lineTo(x + 10, y + 5);
    } else {
      this.ctx.moveTo(x, y + 8);
      this.ctx.lineTo(x - 10, y - 5);
      this.ctx.lineTo(x + 10, y - 5);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw high score table
   * @param {Array<{initials: string, score: number, level: number}>} scores
   * @param {number} [highlightRank=0] - Rank to highlight (1-based), 0 = none
   */
  drawHighScoreTable(scores, highlightRank = 0) {
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `24px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('HIGH SCORES', GAME.WIDTH / 2, 80);

    // Column headers
    this.ctx.fillStyle = '#888888';
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('RANK', 150, 120);
    this.ctx.fillText('NAME', 300, 120);
    this.ctx.fillText('SCORE', 480, 120);
    this.ctx.fillText('LVL', 620, 120);

    // Divider line
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(100, 135);
    this.ctx.lineTo(700, 135);
    this.ctx.stroke();

    // Score entries
    const startY = 165;
    const rowHeight = 35;

    for (let i = 0; i < Math.min(scores.length, 10); i++) {
      const entry = scores[i];
      const y = startY + i * rowHeight;
      const rank = i + 1;
      const isHighlighted = rank === highlightRank;

      // Background highlight for new entry
      if (isHighlighted) {
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
          this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
          this.ctx.fillRect(100, y - 20, 600, rowHeight);
        }
      }

      // Rank
      this.ctx.fillStyle = isHighlighted ? '#FFD700' : this.getRankColor(rank);
      this.ctx.font = `16px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(`${rank}.`, 150, y);

      // Initials
      this.ctx.fillStyle = isHighlighted ? '#FFD700' : UI.TEXT_COLOR;
      this.ctx.fillText(entry.initials, 300, y);

      // Score
      this.ctx.fillText(padNumber(entry.score, 6), 480, y);

      // Level
      this.ctx.fillStyle = isHighlighted ? '#FFD700' : '#888888';
      this.ctx.fillText(String(entry.level), 620, y);
    }

    // Fill empty slots
    for (let i = scores.length; i < 10; i++) {
      const y = startY + i * rowHeight;
      this.ctx.fillStyle = '#444444';
      this.ctx.font = `16px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(`${i + 1}.`, 150, y);
      this.ctx.fillText('---', 300, y);
      this.ctx.fillText('------', 480, y);
      this.ctx.fillText('-', 620, y);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Get color for rank display
   * @param {number} rank
   * @returns {string} Color code
   */
  getRankColor(rank) {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return UI.TEXT_COLOR;
    }
  }

  /**
   * Draw start screen with high scores integrated
   * @param {Object} [controllerStatus] - Controller connection status
   * @param {Array} [highScores=[]] - High scores to display
   */
  drawStartScreenWithScores(controllerStatus = null, highScores = []) {
    // Note: Canvas clearing and starfield are handled by Game.render()

    // Title
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `36px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RETRO ARCADE', GAME.WIDTH / 2, 80);

    this.ctx.fillStyle = '#FF6600';
    this.ctx.fillText('SPACE INVADERS', GAME.WIDTH / 2, 120);

    // High scores (compact view)
    if (highScores.length > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = `14px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('HIGH SCORES', GAME.WIDTH / 2, 165);

      this.ctx.font = `12px ${UI.FONT_FAMILY}`;
      const displayScores = highScores.slice(0, 5);
      let y = 190;
      for (let i = 0; i < displayScores.length; i++) {
        const entry = displayScores[i];
        this.ctx.fillStyle = this.getRankColor(i + 1);
        this.ctx.fillText(
          `${i + 1}. ${entry.initials}  ${padNumber(entry.score, 6)}`,
          GAME.WIDTH / 2,
          y
        );
        y += 22;
      }
    }

    // Instructions - Keyboard
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `12px ${UI.FONT_FAMILY}`;
    const instructionY = highScores.length > 0 ? 320 : 200;
    this.ctx.fillText('KEYBOARD', GAME.WIDTH / 2, instructionY);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;

    const keyboardInstructions = [
      '← →  or  A D  :  MOVE',
      'SPACE  :  FIRE',
      'P  :  PAUSE    M  :  MUTE',
    ];

    let y = instructionY + 25;
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
        this.ctx.fillText(`🎮 ${controllerStatus.name} CONNECTED`, GAME.WIDTH / 2, y + 15);
      } else {
        this.ctx.fillStyle = '#666666';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText('🎮 NO CONTROLLER DETECTED', GAME.WIDTH / 2, y + 15);
      }
    }

    // Blinking start text
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.font = `20px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('PRESS SPACE OR A TO START', GAME.WIDTH / 2, 570);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw mode selection screen (Classic vs Endless)
   * @param {Object} [controllerStatus] - Controller connection status
   * @param {number} [selectedMode=0] - Selected mode (0 = CLASSIC, 1 = ENDLESS)
   */
  drawModeSelectScreen(controllerStatus = null, selectedMode = 0) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.textAlign = 'center';

    // Title
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `36px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('SELECT GAME MODE', GAME.WIDTH / 2, 100);

    // Mode options
    const modes = [
      { name: 'CLASSIC', description: '10 LEVELS' },
      { name: 'ENDLESS', description: 'INFINITE WAVES' }
    ];

    const optionY = [250, 350];
    const optionWidth = 300;
    const optionHeight = 70;

    for (let i = 0; i < modes.length; i++) {
      const x = (GAME.WIDTH - optionWidth) / 2;
      const y = optionY[i] - optionHeight / 2;
      const isSelected = i === selectedMode;

      // Option background
      this.ctx.fillStyle = isSelected ? '#003300' : '#111111';
      this.ctx.fillRect(x, y, optionWidth, optionHeight);

      // Option border - blinking if selected
      let borderColor = '#444444';
      if (isSelected) {
        const blink = Math.floor(Date.now() / 300) % 2 === 0;
        borderColor = blink ? '#00FF00' : '#00AA00';
      }
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.strokeRect(x, y, optionWidth, optionHeight);

      // Selection indicator (arrow on left)
      if (isSelected) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `20px ${UI.FONT_FAMILY}`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('>', x - 40, optionY[i] + 10);
        this.ctx.textAlign = 'center';
      }

      // Mode name
      this.ctx.fillStyle = isSelected ? '#00FF00' : '#FFFFFF';
      this.ctx.font = `24px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(modes[i].name, GAME.WIDTH / 2, optionY[i] + 5);

      // Mode description
      this.ctx.fillStyle = isSelected ? '#00FF00' : '#888888';
      this.ctx.font = `14px ${UI.FONT_FAMILY}`;
      this.ctx.fillText(modes[i].description, GAME.WIDTH / 2, optionY[i] + 35);
    }

    // Instructions
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';

    if (controllerStatus && controllerStatus.connected) {
      this.ctx.fillText('D-PAD UP/DOWN TO SELECT', GAME.WIDTH / 2, 480);
      this.ctx.fillText('PRESS A OR START TO CONFIRM', GAME.WIDTH / 2, 510);
    } else {
      this.ctx.fillText('UP/DOWN ARROW KEYS TO SELECT', GAME.WIDTH / 2, 480);
      this.ctx.fillText('PRESS ENTER OR SPACE TO CONFIRM', GAME.WIDTH / 2, 510);
    }

    // Controller status indicator
    if (controllerStatus) {
      if (controllerStatus.connected) {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText(`CONTROLLER: ${controllerStatus.name}`, GAME.WIDTH / 2, 555);
      } else {
        this.ctx.fillStyle = '#666666';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText('NO CONTROLLER DETECTED', GAME.WIDTH / 2, 555);
      }
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw HUD for endless mode (shows wave instead of level)
   * @param {number} score - Current score
   * @param {number} highScore - High score
   * @param {number} lives - Player lives
   * @param {number} wave - Current wave
   * @param {Object} [controllerStatus] - Controller connection status
   * @param {number} [comboCount=0] - Current combo count
   * @param {number} [multiplier=1.0] - Score multiplier
   */
  drawHUDEndless(score, highScore, lives, wave, controllerStatus = null, comboCount = 0, multiplier = 1.0) {
    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `${UI.FONT_SIZE}px ${UI.FONT_FAMILY}`;

    // Score
    this.ctx.fillText(`SCORE: ${padNumber(score, 6)}`, UI.SCORE_X, UI.SCORE_Y);

    // High Score
    this.ctx.fillText(`HI: ${padNumber(highScore, 6)}`, UI.SCORE_X + 250, UI.SCORE_Y);

    // Wave
    const waveText = `WAVE ${wave}`;
    this.ctx.fillText(waveText, UI.LEVEL_X + 100, UI.LEVEL_Y);

    // Danger indicator for high waves (>= 15)
    if (wave >= 15) {
      const blink = Math.floor(Date.now() / 200) % 2 === 0;
      if (blink) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText('DANGER', UI.LEVEL_X + 100, UI.LEVEL_Y + 35);
      }
    }

    // Lives
    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.fillText(`LIVES: `, UI.LIVES_X, UI.LIVES_Y);

    // Draw life icons
    for (let i = 0; i < lives; i++) {
      this.drawLifeIcon(UI.LIVES_X + 100 + i * 30, UI.LIVES_Y - 15);
    }

    // Draw combo HUD if active
    if (comboCount >= 2) {
      this.drawComboHUD(comboCount, multiplier, true);
    }

    // Controller indicator (bottom right)
    if (controllerStatus && controllerStatus.connected) {
      this.drawControllerIcon(GAME.WIDTH - 40, GAME.HEIGHT - 25);
    }
  }

  /**
   * Draw wave complete screen (endless mode)
   * @param {number} wave - Completed wave number
   * @param {number} [speedMultiplier=1.0] - Current speed multiplier
   */
  drawWaveComplete(wave, speedMultiplier = 1.0) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.ctx.textAlign = 'center';

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `40px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(`WAVE ${wave} COMPLETE!`, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40);

    // Difficulty multiplier info
    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `24px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(`SPEED: ${speedMultiplier.toFixed(1)}X`, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 30);

    // Prompt to continue
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('GET READY...', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 80);

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw start screen with high scores - updated to support game mode
   * @param {Object} [controllerStatus] - Controller connection status
   * @param {Array} [highScores=[]] - High scores to display
   * @param {string} [gameMode='classic'] - Game mode ('classic' or 'endless')
   */
  drawStartScreenWithScores(controllerStatus = null, highScores = [], gameMode = 'classic') {
    // Note: Canvas clearing and starfield are handled by Game.render()

    // Title
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `36px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RETRO ARCADE', GAME.WIDTH / 2, 80);

    this.ctx.fillStyle = '#FF6600';
    this.ctx.fillText('SPACE INVADERS', GAME.WIDTH / 2, 120);

    // Mode indicator
    const modeText = gameMode === 'endless' ? 'ENDLESS MODE' : 'CLASSIC MODE';
    const modeColor = gameMode === 'endless' ? '#FF6600' : '#00FF00';
    this.ctx.fillStyle = modeColor;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.fillText(modeText, GAME.WIDTH / 2, 150);

    // High scores (compact view)
    if (highScores.length > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = `14px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('HIGH SCORES', GAME.WIDTH / 2, 190);

      this.ctx.font = `12px ${UI.FONT_FAMILY}`;
      const displayScores = highScores.slice(0, 5);
      let y = 215;
      for (let i = 0; i < displayScores.length; i++) {
        const entry = displayScores[i];
        this.ctx.fillStyle = this.getRankColor(i + 1);
        this.ctx.fillText(
          `${i + 1}. ${entry.initials}  ${padNumber(entry.score, 6)}`,
          GAME.WIDTH / 2,
          y
        );
        y += 22;
      }
    }

    // Instructions - Keyboard
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `12px ${UI.FONT_FAMILY}`;
    const instructionY = highScores.length > 0 ? 340 : 220;
    this.ctx.fillText('KEYBOARD', GAME.WIDTH / 2, instructionY);

    this.ctx.fillStyle = UI.TEXT_COLOR;
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;

    const keyboardInstructions = [
      '← →  or  A D  :  MOVE',
      'SPACE  :  FIRE',
      'P  :  PAUSE    M  :  MUTE',
    ];

    let y = instructionY + 25;
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
        this.ctx.fillText(`CONTROLLER: ${controllerStatus.name}`, GAME.WIDTH / 2, y + 15);
      } else {
        this.ctx.fillStyle = '#666666';
        this.ctx.font = `12px ${UI.FONT_FAMILY}`;
        this.ctx.fillText('NO CONTROLLER DETECTED', GAME.WIDTH / 2, y + 15);
      }
    }

    // Blinking start text
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.font = `20px ${UI.FONT_FAMILY}`;
      this.ctx.fillText('PRESS SPACE OR A TO START', GAME.WIDTH / 2, 570);
    }

    this.ctx.textAlign = 'left';
  }

  /**
   * Draw active power-up effects in HUD
   * @param {Object[]} activeEffects - Array of {type, remainingTime, color}
   */
  drawPowerUpHUD(activeEffects) {
    if (!activeEffects || activeEffects.length === 0) return;

    const startX = 20;
    const startY = GAME.HEIGHT - 60;
    const iconSize = 40;
    const spacing = 50;

    for (let i = 0; i < activeEffects.length; i++) {
      const effect = activeEffects[i];
      const x = startX + i * spacing;
      const y = startY;

      // Background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(x - 2, y - 2, iconSize + 4, iconSize + 20);

      // Icon background with effect color
      this.ctx.fillStyle = effect.color + '40'; // 25% opacity
      this.ctx.fillRect(x, y, iconSize, iconSize);

      // Draw power-up icon
      this.drawPowerUpIcon(x + iconSize / 2, y + iconSize / 2, effect.type, effect.color);

      // Timer bar or ∞ for permanent effects
      if (effect.remainingTime === Infinity) {
        this.ctx.fillStyle = effect.color;
        this.ctx.font = `14px ${UI.FONT_FAMILY}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('∞', x + iconSize / 2, y + iconSize + 14);
        this.ctx.textAlign = 'left';
      } else {
        // Timer bar
        const maxTime = POWERUPS.TYPES[effect.type]?.duration || 10000;
        const ratio = Math.min(effect.remainingTime / maxTime, 1);
        const barWidth = iconSize * ratio;

        // Bar background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y + iconSize + 4, iconSize, 8);

        // Active bar (blink when low)
        const isLow = effect.remainingTime < 2000;
        const blink = isLow && Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.fillStyle = blink ? '#FF0000' : effect.color;
        this.ctx.fillRect(x, y + iconSize + 4, barWidth, 8);
      }
    }
  }

  /**
   * Draw a power-up icon (simplified version for HUD)
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {string} type - Power-up type
   * @param {string} color - Color
   */
  drawPowerUpIcon(cx, cy, type, color) {
    const size = 14;
    this.ctx.fillStyle = color;

    switch (type) {
      case 'SHIELD':
        // Shield shape
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - size);
        this.ctx.lineTo(cx + size * 0.8, cy - size * 0.3);
        this.ctx.lineTo(cx + size * 0.8, cy + size * 0.3);
        this.ctx.lineTo(cx, cy + size);
        this.ctx.lineTo(cx - size * 0.8, cy + size * 0.3);
        this.ctx.lineTo(cx - size * 0.8, cy - size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'RAPID_FIRE':
        // Lightning bolt
        this.ctx.beginPath();
        this.ctx.moveTo(cx + size * 0.3, cy - size);
        this.ctx.lineTo(cx - size * 0.2, cy);
        this.ctx.lineTo(cx + size * 0.2, cy);
        this.ctx.lineTo(cx - size * 0.3, cy + size);
        this.ctx.lineTo(cx + size * 0.2, cy);
        this.ctx.lineTo(cx - size * 0.2, cy);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'MULTI_SHOT':
        // Three arrows
        this.ctx.font = `${size * 1.5}px ${UI.FONT_FAMILY}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('↗', cx, cy);
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.textAlign = 'left';
        break;

      default:
        // Default circle
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
  }

  /**
   * Draw shield bubble effect around player position
   * Note: This is an overlay method for special shield visual
   * @param {number} x - Player center X
   * @param {number} y - Player center Y
   * @param {number} radius - Shield radius
   */
  drawShieldBubble(x, y, radius) {
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.5;

    // Outer glow
    this.ctx.save();
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = pulse;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Inner glow
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = pulse * 0.5;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Draw combo HUD display on the right side
   * @param {number} comboCount - Number of consecutive hits
   * @param {number} multiplier - Score multiplier (e.g., 1.5, 2.0)
   * @param {boolean} isActive - Whether combo is currently active
   */
  drawComboHUD(comboCount, multiplier, isActive) {
    if (!isActive || comboCount < 2) return;

    const x = GAME.WIDTH - 180;
    const y = UI.SCORE_Y;

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = `${UI.FONT_SIZE}px ${UI.FONT_FAMILY}`;

    // Format: "COMBO: 3x (×2.0)"
    const comboText = `COMBO: ${comboCount}x (×${multiplier.toFixed(1)})`;
    this.ctx.fillText(comboText, x, y);

    // Subtle scale animation when combo changes
    const scale = 1 + Math.sin(Date.now() / 150) * 0.05;
    this.ctx.save();
    this.ctx.translate(x + comboText.length * 3, y - 5);
    this.ctx.scale(scale, scale);
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = `14px ${UI.FONT_FAMILY}`;
    this.ctx.fillText('!', 0, 0);
    this.ctx.restore();
  }

  /**
   * Draw array of floating popup messages
   * @param {Array<{text: string, x: number, y: number, color: string, opacity: number, fontSize: number}>} popups
   */
  drawPopups(popups) {
    if (!popups || popups.length === 0) return;

    for (const popup of popups) {
      this.ctx.save();

      // Set opacity
      this.ctx.globalAlpha = popup.opacity;

      // Set text properties
      this.ctx.fillStyle = popup.color;
      this.ctx.font = `${popup.fontSize}px ${UI.FONT_FAMILY}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Draw text centered at position
      this.ctx.fillText(popup.text, popup.x, popup.y);

      this.ctx.restore();
    }

    // Ensure globalAlpha is reset
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw formation announcement with animated entrance
   * Shows "FORMATION: V-FORMATION" with fade in and scale up effects
   * @param {string} formationType - Formation type identifier
   * @param {string} formationName - Display name of the formation
   * @param {string} formationColor - Color for the formation text
   * @param {number} progress - Animation progress (0-1)
   */
  drawFormationAnnouncement(formationType, formationName, formationColor, progress) {
    this.ctx.save();

    // Semi-transparent dark background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Calculate animation values
    const scale = 0.5 + (progress * 0.5); // Scales from 0.5 to 1.0
    const opacity = progress; // Fades from 0 to 1.0

    // Set up text with animation
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = formationColor;
    this.ctx.font = `48px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';

    // Apply scale transformation centered on canvas center
    this.ctx.translate(GAME.WIDTH / 2, GAME.HEIGHT / 2);
    this.ctx.scale(scale, scale);

    // Draw formation announcement text
    const text = `FORMATION: ${formationName}`;
    this.ctx.fillText(text, 0, 0);

    this.ctx.restore();
  }

  /**
   * Draw entrance progress bar with "INCOMING..." text
   * Shows progress during enemy entrance animation
   * @param {number} progress - Progress (0-1) for entrance animation
   * @param {string} formationType - Formation type for color matching
   * @param {string} [formationColor='#00FF00'] - Optional color override
   */
  drawEntranceProgress(progress, formationType, formationColor = '#00FF00') {
    const barWidth = 200;
    const barHeight = 10;
    const barX = (GAME.WIDTH - barWidth) / 2;
    const barY = GAME.HEIGHT - 80;

    // Draw "INCOMING..." text above bar
    this.ctx.fillStyle = formationColor;
    this.ctx.font = `16px ${UI.FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('INCOMING...', GAME.WIDTH / 2, barY - 20);

    // Draw background bar
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress fill
    const fillWidth = barWidth * Math.min(progress, 1);
    this.ctx.fillStyle = formationColor;
    this.ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Draw bar border
    this.ctx.strokeStyle = formationColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.textAlign = 'left';
  }

  /**
   * Get canvas context for direct drawing
   * @returns {CanvasRenderingContext2D}
   */
  getContext() {
    return this.ctx;
  }
}
