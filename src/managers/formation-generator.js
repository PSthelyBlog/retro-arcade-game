import { ENEMY, GAME, FORMATIONS } from '../constants.js';

/**
 * Generates enemy formation patterns for different levels
 */
export class FormationGenerator {
  /**
   * Get formation type for a given level
   * @param {number} level - Current level number
   * @returns {string} Formation type
   */
  static getFormationType(level) {
    // Map level to formation type
    // Levels 1-2: classic, 3-4: vshape, 5-6: diamond, 7-8: spiral, 9-10: cross, 11+: random
    if (level <= 2) return 'classic';
    if (level <= 4) return 'vshape';
    if (level <= 6) return 'diamond';
    if (level <= 8) return 'spiral';
    if (level <= 10) return 'cross';
    return 'random';
  }

  /**
   * Generate formation positions
   * @param {string} type - Formation type
   * @param {number} extraRows - Additional rows for endless mode scaling
   * @returns {Array<{x: number, y: number, row: number, col: number, delay: number}>}
   */
  static generate(type, extraRows = 0) {
    // Call the appropriate pattern generator
    switch (type) {
      case 'classic':
        return this.generateClassic(extraRows);
      case 'vshape':
        return this.generateVShape(extraRows);
      case 'diamond':
        return this.generateDiamond(extraRows);
      case 'spiral':
        return this.generateSpiral(extraRows);
      case 'cross':
        return this.generateCross(extraRows);
      case 'random':
        return this.generateRandom(extraRows);
      default:
        return this.generateClassic(extraRows);
    }
  }

  /**
   * Classic grid formation (5 rows x 11 cols)
   */
  static generateClassic(extraRows = 0) {
    const positions = [];
    const rows = ENEMY.ROWS + extraRows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < ENEMY.COLS; col++) {
        const x = ENEMY.START_X + col * ENEMY.HORIZONTAL_SPACING;
        const y = ENEMY.START_Y + row * ENEMY.VERTICAL_SPACING;
        const delay = (row * ENEMY.COLS + col) * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY;
        positions.push({ x, y, row, col, delay });
      }
    }
    return positions;
  }

  /**
   * V-Shape formation (inverted V pointing down)
   */
  static generateVShape(extraRows = 0) {
    const positions = [];
    const rows = ENEMY.ROWS + extraRows;
    const centerCol = Math.floor(ENEMY.COLS / 2);
    let posIndex = 0;

    for (let row = 0; row < rows; row++) {
      // Width increases with each row (V pointing down)
      const width = Math.min(row * 2 + 1, ENEMY.COLS);
      const startCol = centerCol - Math.floor(width / 2);

      for (let i = 0; i < width; i++) {
        const col = startCol + i;
        if (col >= 0 && col < ENEMY.COLS) {
          const x = ENEMY.START_X + col * ENEMY.HORIZONTAL_SPACING;
          const y = ENEMY.START_Y + row * ENEMY.VERTICAL_SPACING;
          const delay = posIndex * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY;
          positions.push({ x, y, row, col, delay });
          posIndex++;
        }
      }
    }
    return positions;
  }

  /**
   * Diamond formation (rhombus shape)
   */
  static generateDiamond(extraRows = 0) {
    const positions = [];
    const baseRows = ENEMY.ROWS + extraRows;
    const centerCol = Math.floor(ENEMY.COLS / 2);
    const halfRows = Math.floor(baseRows / 2);
    let posIndex = 0;

    for (let row = 0; row < baseRows; row++) {
      // Diamond: width increases then decreases
      const distFromCenter = Math.abs(row - halfRows);
      const width = Math.max(1, baseRows - distFromCenter * 2);
      const startCol = centerCol - Math.floor(width / 2);

      for (let i = 0; i < width; i++) {
        const col = startCol + i;
        const x = ENEMY.START_X + col * ENEMY.HORIZONTAL_SPACING;
        const y = ENEMY.START_Y + row * ENEMY.VERTICAL_SPACING;
        const delay = posIndex * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY;
        positions.push({ x, y, row, col, delay });
        posIndex++;
      }
    }
    return positions;
  }

  /**
   * Spiral formation (enemies arranged from center outward)
   */
  static generateSpiral(extraRows = 0) {
    const positions = [];
    const rows = ENEMY.ROWS + extraRows;
    const centerX = GAME.WIDTH / 2;
    const centerY = ENEMY.START_Y + (rows * ENEMY.VERTICAL_SPACING) / 2;
    const totalEnemies = rows * ENEMY.COLS;

    for (let i = 0; i < totalEnemies; i++) {
      const angle = i * 0.5;  // Radians per step
      const radius = 30 + i * 6;  // Expanding spiral
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.6;  // Flatten vertically

      // Clamp to game bounds
      const clampedX = Math.max(50, Math.min(GAME.WIDTH - 50, x));
      const clampedY = Math.max(ENEMY.START_Y, Math.min(ENEMY.START_Y + rows * ENEMY.VERTICAL_SPACING, y));

      const row = Math.floor((clampedY - ENEMY.START_Y) / ENEMY.VERTICAL_SPACING);
      const col = Math.floor((clampedX - ENEMY.START_X) / ENEMY.HORIZONTAL_SPACING);

      positions.push({
        x: clampedX,
        y: clampedY,
        row: Math.min(row, rows - 1),
        col: Math.min(col, ENEMY.COLS - 1),
        delay: i * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY,
      });
    }
    return positions;
  }

  /**
   * Cross formation (plus sign shape)
   */
  static generateCross(extraRows = 0) {
    const positions = [];
    const rows = ENEMY.ROWS + extraRows;
    const centerCol = Math.floor(ENEMY.COLS / 2);
    const centerRow = Math.floor(rows / 2);
    let posIndex = 0;

    // Horizontal bar
    for (let col = 0; col < ENEMY.COLS; col++) {
      const x = ENEMY.START_X + col * ENEMY.HORIZONTAL_SPACING;
      const y = ENEMY.START_Y + centerRow * ENEMY.VERTICAL_SPACING;
      positions.push({
        x, y,
        row: centerRow,
        col,
        delay: posIndex * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY,
      });
      posIndex++;
    }

    // Vertical bar (excluding center which is already placed)
    for (let row = 0; row < rows; row++) {
      if (row === centerRow) continue;
      const x = ENEMY.START_X + centerCol * ENEMY.HORIZONTAL_SPACING;
      const y = ENEMY.START_Y + row * ENEMY.VERTICAL_SPACING;
      positions.push({
        x, y,
        row,
        col: centerCol,
        delay: posIndex * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY,
      });
      posIndex++;
    }

    return positions;
  }

  /**
   * Random scattered formation
   */
  static generateRandom(extraRows = 0) {
    const positions = [];
    const rows = ENEMY.ROWS + extraRows;
    const totalEnemies = rows * ENEMY.COLS;
    const usedPositions = new Set();

    for (let i = 0; i < totalEnemies; i++) {
      let x, y, key;
      let attempts = 0;

      do {
        x = ENEMY.START_X + Math.random() * (ENEMY.COLS - 1) * ENEMY.HORIZONTAL_SPACING;
        y = ENEMY.START_Y + Math.random() * (rows - 1) * ENEMY.VERTICAL_SPACING;
        // Round to grid to prevent overlapping
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
        key = `${x},${y}`;
        attempts++;
      } while (usedPositions.has(key) && attempts < 100);

      usedPositions.add(key);

      const row = Math.floor((y - ENEMY.START_Y) / ENEMY.VERTICAL_SPACING);
      const col = Math.floor((x - ENEMY.START_X) / ENEMY.HORIZONTAL_SPACING);

      positions.push({
        x,
        y,
        row: Math.max(0, Math.min(row, rows - 1)),
        col: Math.max(0, Math.min(col, ENEMY.COLS - 1)),
        delay: i * FORMATIONS.ENTRANCE.DELAY_PER_ENEMY,
      });
    }

    return positions;
  }

  /**
   * Get display name for formation type
   */
  static getDisplayName(type) {
    return FORMATIONS.DISPLAY_NAMES[type] || 'UNKNOWN';
  }

  /**
   * Get color for formation type
   */
  static getColor(type) {
    return FORMATIONS.COLORS[type] || '#FFFFFF';
  }
}
