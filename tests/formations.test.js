import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormationGenerator } from '../src/managers/formation-generator.js';
import { EnemyManager } from '../src/managers/enemy-manager.js';
import { ENEMY, FORMATIONS, GAME } from '../src/constants.js';

describe('FormationGenerator', () => {
  describe('getFormationType', () => {
    it('should return classic formation for level 1', () => {
      expect(FormationGenerator.getFormationType(1)).toBe('classic');
    });

    it('should return classic formation for level 2', () => {
      expect(FormationGenerator.getFormationType(2)).toBe('classic');
    });

    it('should return vshape formation for level 3', () => {
      expect(FormationGenerator.getFormationType(3)).toBe('vshape');
    });

    it('should return vshape formation for level 4', () => {
      expect(FormationGenerator.getFormationType(4)).toBe('vshape');
    });

    it('should return diamond formation for level 5', () => {
      expect(FormationGenerator.getFormationType(5)).toBe('diamond');
    });

    it('should return diamond formation for level 6', () => {
      expect(FormationGenerator.getFormationType(6)).toBe('diamond');
    });

    it('should return spiral formation for level 7', () => {
      expect(FormationGenerator.getFormationType(7)).toBe('spiral');
    });

    it('should return spiral formation for level 8', () => {
      expect(FormationGenerator.getFormationType(8)).toBe('spiral');
    });

    it('should return cross formation for level 9', () => {
      expect(FormationGenerator.getFormationType(9)).toBe('cross');
    });

    it('should return cross formation for level 10', () => {
      expect(FormationGenerator.getFormationType(10)).toBe('cross');
    });

    it('should return random formation for level 11', () => {
      expect(FormationGenerator.getFormationType(11)).toBe('random');
    });

    it('should return random formation for level 12', () => {
      expect(FormationGenerator.getFormationType(12)).toBe('random');
    });

    it('should return random formation for level 100', () => {
      expect(FormationGenerator.getFormationType(100)).toBe('random');
    });

    it('should handle edge case of level 0', () => {
      // Level 0 should return classic (first condition level <= 2)
      expect(FormationGenerator.getFormationType(0)).toBe('classic');
    });

    it('should handle negative levels', () => {
      expect(FormationGenerator.getFormationType(-5)).toBe('classic');
    });
  });

  describe('generate', () => {
    it('should return an array of positions', () => {
      const positions = FormationGenerator.generate('classic');
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should return positions with required properties', () => {
      const positions = FormationGenerator.generate('classic');
      const pos = positions[0];
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(pos).toHaveProperty('row');
      expect(pos).toHaveProperty('col');
      expect(pos).toHaveProperty('delay');
    });

    it('should default to classic formation for unknown type', () => {
      const positions = FormationGenerator.generate('unknown_type');
      expect(positions.length).toBeGreaterThan(0);
      // Should match classic formation count
      expect(positions.length).toBe(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should handle all formation types', () => {
      const types = ['classic', 'vshape', 'diamond', 'spiral', 'cross', 'random'];
      for (const type of types) {
        const positions = FormationGenerator.generate(type);
        expect(Array.isArray(positions)).toBe(true);
        expect(positions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateClassic', () => {
    it('should generate 5x11 grid (55 enemies)', () => {
      const positions = FormationGenerator.generateClassic();
      expect(positions.length).toBe(ENEMY.ROWS * ENEMY.COLS);
      expect(positions.length).toBe(55);
    });

    it('should space enemies horizontally', () => {
      const positions = FormationGenerator.generateClassic();
      const row0 = positions.slice(0, ENEMY.COLS);
      for (let i = 1; i < row0.length; i++) {
        const spacing = row0[i].x - row0[i - 1].x;
        expect(spacing).toBe(ENEMY.HORIZONTAL_SPACING);
      }
    });

    it('should space enemies vertically', () => {
      const positions = FormationGenerator.generateClassic();
      const col0Rows = [];
      for (let i = 0; i < positions.length; i += ENEMY.COLS) {
        col0Rows.push(positions[i]);
      }
      for (let i = 1; i < col0Rows.length; i++) {
        const spacing = col0Rows[i].y - col0Rows[i - 1].y;
        expect(spacing).toBe(ENEMY.VERTICAL_SPACING);
      }
    });

    it('should have increasing delay per enemy', () => {
      const positions = FormationGenerator.generateClassic();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThan(positions[i - 1].delay);
      }
    });

    it('should handle extra rows', () => {
      const positions = FormationGenerator.generateClassic(2);
      expect(positions.length).toBe((ENEMY.ROWS + 2) * ENEMY.COLS);
      expect(positions.length).toBe(77);
    });

    it('should have correct row and column indices', () => {
      const positions = FormationGenerator.generateClassic();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.row).toBeLessThan(ENEMY.ROWS);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should start at correct position', () => {
      const positions = FormationGenerator.generateClassic();
      expect(positions[0].x).toBe(ENEMY.START_X);
      expect(positions[0].y).toBe(ENEMY.START_Y);
    });
  });

  describe('generateVShape', () => {
    it('should generate valid positions array', () => {
      const positions = FormationGenerator.generateVShape();
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.length).toBeLessThanOrEqual(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should have valid row and column indices', () => {
      const positions = FormationGenerator.generateVShape();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should have increasing width with rows', () => {
      const positions = FormationGenerator.generateVShape();
      const rowWidths = new Map();
      for (const pos of positions) {
        if (!rowWidths.has(pos.row)) {
          rowWidths.set(pos.row, 0);
        }
        rowWidths.set(pos.row, rowWidths.get(pos.row) + 1);
      }
      // Verify width generally increases with row number
      const widthArray = Array.from(rowWidths.values());
      for (let i = 1; i < Math.min(3, widthArray.length); i++) {
        expect(widthArray[i]).toBeGreaterThanOrEqual(widthArray[i - 1]);
      }
    });

    it('should handle extra rows', () => {
      const basePositions = FormationGenerator.generateVShape(0);
      const withExtraRows = FormationGenerator.generateVShape(2);
      expect(withExtraRows.length).toBeGreaterThan(basePositions.length);
    });

    it('should have valid delays', () => {
      const positions = FormationGenerator.generateVShape();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThanOrEqual(positions[i - 1].delay);
      }
    });
  });

  describe('generateDiamond', () => {
    it('should generate valid positions array', () => {
      const positions = FormationGenerator.generateDiamond();
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.length).toBeLessThanOrEqual(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should have valid row and column indices', () => {
      const positions = FormationGenerator.generateDiamond();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should have diamond-like shape (width max in middle)', () => {
      const positions = FormationGenerator.generateDiamond();
      const rowWidths = new Map();
      for (const pos of positions) {
        if (!rowWidths.has(pos.row)) {
          rowWidths.set(pos.row, 0);
        }
        rowWidths.set(pos.row, rowWidths.get(pos.row) + 1);
      }
      // Get widths array
      const widthArray = Array.from(rowWidths.values());
      // Diamond should have maximum width somewhere in the middle
      const maxWidth = Math.max(...widthArray);
      const maxIndex = widthArray.indexOf(maxWidth);
      expect(maxIndex).toBeGreaterThan(0);
      expect(maxIndex).toBeLessThan(widthArray.length - 1);
    });

    it('should handle extra rows', () => {
      const basePositions = FormationGenerator.generateDiamond(0);
      const withExtraRows = FormationGenerator.generateDiamond(2);
      expect(withExtraRows.length).toBeGreaterThan(basePositions.length);
    });

    it('should have valid delays', () => {
      const positions = FormationGenerator.generateDiamond();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThanOrEqual(positions[i - 1].delay);
      }
    });
  });

  describe('generateSpiral', () => {
    it('should generate fixed number of enemies', () => {
      const positions = FormationGenerator.generateSpiral();
      expect(positions.length).toBe(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should have all required properties', () => {
      const positions = FormationGenerator.generateSpiral();
      for (const pos of positions) {
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(pos).toHaveProperty('row');
        expect(pos).toHaveProperty('col');
        expect(pos).toHaveProperty('delay');
      }
    });

    it('should clamp positions within game bounds', () => {
      const positions = FormationGenerator.generateSpiral();
      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(50);
        expect(pos.x).toBeLessThanOrEqual(GAME.WIDTH - 50);
        expect(pos.y).toBeGreaterThanOrEqual(ENEMY.START_Y);
        expect(pos.y).toBeLessThanOrEqual(ENEMY.START_Y + ENEMY.ROWS * ENEMY.VERTICAL_SPACING);
      }
    });

    it('should have valid row and column indices', () => {
      const positions = FormationGenerator.generateSpiral();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.row).toBeLessThan(ENEMY.ROWS);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should have increasing delays', () => {
      const positions = FormationGenerator.generateSpiral();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThanOrEqual(positions[i - 1].delay);
      }
    });

    it('should handle extra rows', () => {
      const basePositions = FormationGenerator.generateSpiral(0);
      const withExtraRows = FormationGenerator.generateSpiral(2);
      expect(withExtraRows.length).toBeGreaterThan(basePositions.length);
    });
  });

  describe('generateCross', () => {
    it('should generate valid positions array', () => {
      const positions = FormationGenerator.generateCross();
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should have horizontal and vertical bars', () => {
      const positions = FormationGenerator.generateCross();
      const rows = new Set(positions.map(p => p.row));
      const cols = new Set(positions.map(p => p.col));
      // Should have multiple rows and columns (cross shape)
      expect(rows.size).toBeGreaterThan(1);
      expect(cols.size).toBeGreaterThan(1);
    });

    it('should have valid row and column indices', () => {
      const positions = FormationGenerator.generateCross();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should have increasing delays', () => {
      const positions = FormationGenerator.generateCross();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThanOrEqual(positions[i - 1].delay);
      }
    });

    it('should handle extra rows', () => {
      const basePositions = FormationGenerator.generateCross(0);
      const withExtraRows = FormationGenerator.generateCross(2);
      expect(withExtraRows.length).toBeGreaterThan(basePositions.length);
    });
  });

  describe('generateRandom', () => {
    it('should generate fixed number of enemies', () => {
      const positions = FormationGenerator.generateRandom();
      expect(positions.length).toBe(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should have no overlapping positions', () => {
      const positions = FormationGenerator.generateRandom();
      const positionSet = new Set();
      for (const pos of positions) {
        const key = `${pos.x},${pos.y}`;
        expect(positionSet.has(key)).toBe(false);
        positionSet.add(key);
      }
    });

    it('should have valid row and column indices', () => {
      const positions = FormationGenerator.generateRandom();
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(ENEMY.COLS);
      }
    });

    it('should have valid x and y coordinates', () => {
      const positions = FormationGenerator.generateRandom();
      for (const pos of positions) {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(pos.x).toBeGreaterThanOrEqual(ENEMY.START_X);
        expect(pos.y).toBeGreaterThanOrEqual(ENEMY.START_Y);
      }
    });

    it('should have increasing delays', () => {
      const positions = FormationGenerator.generateRandom();
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].delay).toBeGreaterThanOrEqual(positions[i - 1].delay);
      }
    });

    it('should produce different layouts on multiple calls', () => {
      const positions1 = FormationGenerator.generateRandom();
      const positions2 = FormationGenerator.generateRandom();
      // Positions should be different (very high probability)
      let isDifferent = false;
      for (let i = 0; i < positions1.length; i++) {
        if (positions1[i].x !== positions2[i].x || positions1[i].y !== positions2[i].y) {
          isDifferent = true;
          break;
        }
      }
      expect(isDifferent).toBe(true);
    });

    it('should handle extra rows', () => {
      const basePositions = FormationGenerator.generateRandom(0);
      const withExtraRows = FormationGenerator.generateRandom(2);
      expect(withExtraRows.length).toBeGreaterThan(basePositions.length);
    });
  });

  describe('getDisplayName', () => {
    it('should return correct display name for classic', () => {
      expect(FormationGenerator.getDisplayName('classic')).toBe('CLASSIC');
    });

    it('should return correct display name for vshape', () => {
      expect(FormationGenerator.getDisplayName('vshape')).toBe('V-FORMATION');
    });

    it('should return correct display name for diamond', () => {
      expect(FormationGenerator.getDisplayName('diamond')).toBe('DIAMOND');
    });

    it('should return correct display name for spiral', () => {
      expect(FormationGenerator.getDisplayName('spiral')).toBe('SPIRAL');
    });

    it('should return correct display name for cross', () => {
      expect(FormationGenerator.getDisplayName('cross')).toBe('CROSS');
    });

    it('should return correct display name for random', () => {
      expect(FormationGenerator.getDisplayName('random')).toBe('CHAOS');
    });

    it('should return UNKNOWN for invalid type', () => {
      expect(FormationGenerator.getDisplayName('invalid')).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for empty string', () => {
      expect(FormationGenerator.getDisplayName('')).toBe('UNKNOWN');
    });
  });

  describe('getColor', () => {
    it('should return hex color for classic', () => {
      const color = FormationGenerator.getColor('classic');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#00FF00');
    });

    it('should return hex color for vshape', () => {
      const color = FormationGenerator.getColor('vshape');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#FF6600');
    });

    it('should return hex color for diamond', () => {
      const color = FormationGenerator.getColor('diamond');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#00FFFF');
    });

    it('should return hex color for spiral', () => {
      const color = FormationGenerator.getColor('spiral');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#FF00FF');
    });

    it('should return hex color for cross', () => {
      const color = FormationGenerator.getColor('cross');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#FFFF00');
    });

    it('should return hex color for random', () => {
      const color = FormationGenerator.getColor('random');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#FF0000');
    });

    it('should return white for invalid type', () => {
      expect(FormationGenerator.getColor('invalid')).toBe('#FFFFFF');
    });

    it('should return white for empty string', () => {
      expect(FormationGenerator.getColor('')).toBe('#FFFFFF');
    });

    it('should return valid hex color strings', () => {
      const types = ['classic', 'vshape', 'diamond', 'spiral', 'cross', 'random'];
      for (const type of types) {
        const color = FormationGenerator.getColor(type);
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });
  });
});

describe('EnemyManager', () => {
  let enemyManager;

  beforeEach(() => {
    enemyManager = new EnemyManager();
  });

  describe('initialization', () => {
    it('should initialize with empty enemies array', () => {
      expect(enemyManager.enemies).toEqual([]);
    });

    it('should initialize with direction right (1)', () => {
      expect(enemyManager.direction).toBe(1);
    });

    it('should have classic game mode by default', () => {
      expect(enemyManager.gameMode).toBe('classic');
    });

    it('should have classic formation type by default', () => {
      expect(enemyManager.currentFormationType).toBe('classic');
    });

    it('should not have entrance active initially', () => {
      expect(enemyManager.entranceActive).toBe(false);
    });

    it('should have entrance progress at 0', () => {
      expect(enemyManager.entranceProgress).toBe(0);
    });

    it('should have wave 1 by default', () => {
      expect(enemyManager.wave).toBe(1);
    });

    it('should have difficulty multiplier of 1.0', () => {
      expect(enemyManager.difficultyMultiplier).toBe(1.0);
    });
  });

  describe('createFormation', () => {
    it('should create enemies from formation', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.enemies.length).toBeGreaterThan(0);
    });

    it('should create classic formation for level 1', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.getFormationType()).toBe('classic');
      expect(enemyManager.enemies.length).toBe(ENEMY.ROWS * ENEMY.COLS);
    });

    it('should create vshape formation for level 3', () => {
      enemyManager.createFormation(3, false);
      expect(enemyManager.getFormationType()).toBe('vshape');
    });

    it('should create diamond formation for level 5', () => {
      enemyManager.createFormation(5, false);
      expect(enemyManager.getFormationType()).toBe('diamond');
    });

    it('should create spiral formation for level 7', () => {
      enemyManager.createFormation(7, false);
      expect(enemyManager.getFormationType()).toBe('spiral');
    });

    it('should create cross formation for level 9', () => {
      enemyManager.createFormation(9, false);
      expect(enemyManager.getFormationType()).toBe('cross');
    });

    it('should create random formation for level 11', () => {
      enemyManager.createFormation(11, false);
      expect(enemyManager.getFormationType()).toBe('random');
    });

    it('should set up entrance animation when withEntrance is true', () => {
      enemyManager.createFormation(1, true);
      expect(enemyManager.entranceActive).toBe(true);
      expect(enemyManager.entranceProgress).toBe(0);
    });

    it('should skip entrance animation when withEntrance is false', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.entranceActive).toBe(false);
      expect(enemyManager.entranceProgress).toBe(1);
    });

    it('should set enemies to starting y position when entrance is enabled', () => {
      enemyManager.createFormation(1, true);
      for (const enemy of enemyManager.enemies) {
        expect(enemy.y).toBe(FORMATIONS.ENTRANCE.START_Y);
      }
    });

    it('should set enemies to target position when entrance is disabled', () => {
      enemyManager.createFormation(1, false);
      for (const enemy of enemyManager.enemies) {
        expect(enemy.y).toBe(enemy.targetY);
      }
    });

    it('should reset enemies array', () => {
      enemyManager.createFormation(1, false);
      const firstCount = enemyManager.enemies.length;
      enemyManager.createFormation(1, false);
      expect(enemyManager.enemies.length).toBe(firstCount);
    });

    it('should set totalEnemies count', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.totalEnemies).toBe(enemyManager.enemies.length);
    });

    it('should reset direction to right', () => {
      enemyManager.direction = -1;
      enemyManager.createFormation(1, false);
      expect(enemyManager.direction).toBe(1);
    });

    it('should apply difficulty multiplier in endless mode', () => {
      enemyManager.setGameMode('endless');
      enemyManager.setWave(5);
      enemyManager.createFormation(1, false);
      expect(enemyManager.difficultyMultiplier).toBeGreaterThan(1.0);
    });

    it('should not apply multiplier in classic mode', () => {
      enemyManager.setGameMode('classic');
      enemyManager.createFormation(1, false);
      expect(enemyManager.difficultyMultiplier).toBe(1.0);
    });

    it('should scale with extra rows in endless mode', () => {
      enemyManager.setGameMode('classic');
      enemyManager.createFormation(1, false);
      const classicCount = enemyManager.enemies.length;

      enemyManager.setGameMode('endless');
      enemyManager.setWave(10);
      enemyManager.createFormation(1, false);
      const endlessCount = enemyManager.enemies.length;

      expect(endlessCount).toBeGreaterThan(classicCount);
    });
  });

  describe('getFormationType', () => {
    it('should return current formation type', () => {
      enemyManager.createFormation(3, false);
      expect(enemyManager.getFormationType()).toBe('vshape');
    });

    it('should return classic after creating classic formation', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.getFormationType()).toBe('classic');
    });
  });

  describe('getFormationDisplayName', () => {
    it('should return display name for current formation', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.getFormationDisplayName()).toBe('CLASSIC');
    });

    it('should return correct display name for vshape', () => {
      enemyManager.createFormation(3, false);
      expect(enemyManager.getFormationDisplayName()).toBe('V-FORMATION');
    });

    it('should return correct display name for diamond', () => {
      enemyManager.createFormation(5, false);
      expect(enemyManager.getFormationDisplayName()).toBe('DIAMOND');
    });

    it('should return correct display name for spiral', () => {
      enemyManager.createFormation(7, false);
      expect(enemyManager.getFormationDisplayName()).toBe('SPIRAL');
    });

    it('should return correct display name for cross', () => {
      enemyManager.createFormation(9, false);
      expect(enemyManager.getFormationDisplayName()).toBe('CROSS');
    });

    it('should return correct display name for random', () => {
      enemyManager.createFormation(11, false);
      expect(enemyManager.getFormationDisplayName()).toBe('CHAOS');
    });
  });

  describe('getFormationColor', () => {
    it('should return hex color for current formation', () => {
      enemyManager.createFormation(1, false);
      const color = enemyManager.getFormationColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return green for classic', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.getFormationColor()).toBe('#00FF00');
    });

    it('should return orange for vshape', () => {
      enemyManager.createFormation(3, false);
      expect(enemyManager.getFormationColor()).toBe('#FF6600');
    });

    it('should return cyan for diamond', () => {
      enemyManager.createFormation(5, false);
      expect(enemyManager.getFormationColor()).toBe('#00FFFF');
    });

    it('should return magenta for spiral', () => {
      enemyManager.createFormation(7, false);
      expect(enemyManager.getFormationColor()).toBe('#FF00FF');
    });

    it('should return yellow for cross', () => {
      enemyManager.createFormation(9, false);
      expect(enemyManager.getFormationColor()).toBe('#FFFF00');
    });

    it('should return red for random', () => {
      enemyManager.createFormation(11, false);
      expect(enemyManager.getFormationColor()).toBe('#FF0000');
    });
  });

  describe('isEntranceActive', () => {
    it('should return false when entrance is not active', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.isEntranceActive()).toBe(false);
    });

    it('should return true when entrance is active', () => {
      enemyManager.createFormation(1, true);
      expect(enemyManager.isEntranceActive()).toBe(true);
    });

    it('should return false after entrance completes', () => {
      enemyManager.createFormation(1, true);
      expect(enemyManager.isEntranceActive()).toBe(true);
      // Simulate entrance completion by setting progress to 1
      enemyManager.entranceProgress = 1;
      enemyManager.entranceActive = false;
      expect(enemyManager.isEntranceActive()).toBe(false);
    });
  });

  describe('getEntranceProgress', () => {
    it('should return 0 when entrance just started', () => {
      enemyManager.createFormation(1, true);
      expect(enemyManager.getEntranceProgress()).toBe(0);
    });

    it('should return 1 when entrance not active', () => {
      enemyManager.createFormation(1, false);
      expect(enemyManager.getEntranceProgress()).toBe(1);
    });

    it('should return value between 0 and 1 during animation', () => {
      enemyManager.createFormation(1, true);
      enemyManager.updateEntrance(16.67);
      const progress = enemyManager.getEntranceProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe('updateEntrance', () => {
    beforeEach(() => {
      enemyManager.createFormation(1, true);
    });

    it('should not crash when entrance not active', () => {
      enemyManager.entranceActive = false;
      expect(() => enemyManager.updateEntrance(16.67)).not.toThrow();
    });

    it('should increase entrance progress over time', () => {
      const initial = enemyManager.getEntranceProgress();
      // Use vi.useFakeTimers to control time
      vi.useFakeTimers();
      vi.advanceTimersByTime(500);
      enemyManager.updateEntrance(500);
      const after = enemyManager.getEntranceProgress();
      vi.useRealTimers();
      expect(after).toBeGreaterThan(initial);
    });

    it('should move enemies toward target position', () => {
      const enemy = enemyManager.enemies[0];
      const initialY = enemy.y;
      const targetY = enemy.targetY;
      vi.useFakeTimers();
      vi.advanceTimersByTime(500);
      enemyManager.updateEntrance(500);
      vi.useRealTimers();
      expect(enemy.y).toBeGreaterThan(initialY);
      expect(enemy.y).toBeLessThanOrEqual(targetY);
    });

    it('should complete entrance when duration elapsed', () => {
      vi.useFakeTimers();
      vi.advanceTimersByTime(FORMATIONS.ENTRANCE.DURATION + 100);
      enemyManager.updateEntrance(FORMATIONS.ENTRANCE.DURATION + 100);
      vi.useRealTimers();
      expect(enemyManager.entranceActive).toBe(false);
      expect(enemyManager.entranceProgress).toBe(1);
    });

    it('should position enemies at target y when complete', () => {
      vi.useFakeTimers();
      vi.advanceTimersByTime(FORMATIONS.ENTRANCE.DURATION + 100);
      enemyManager.updateEntrance(FORMATIONS.ENTRANCE.DURATION + 100);
      vi.useRealTimers();
      for (const enemy of enemyManager.enemies) {
        expect(enemy.y).toBe(enemy.targetY);
      }
    });

    it('should respect entrance delay per enemy', () => {
      // First enemy with no delay should move immediately
      // Last enemy with high delay should stay in place longer
      const firstEnemy = enemyManager.enemies[0];
      const lastEnemy = enemyManager.enemies[enemyManager.enemies.length - 1];

      const beforeY1 = firstEnemy.y;
      const beforeY2 = lastEnemy.y;

      vi.useFakeTimers();
      vi.advanceTimersByTime(100);
      enemyManager.updateEntrance(100);
      vi.useRealTimers();

      // First enemy should have moved more
      const afterY1 = firstEnemy.y;
      const afterY2 = lastEnemy.y;

      const move1 = afterY1 - beforeY1;
      const move2 = afterY2 - beforeY2;

      expect(move1).toBeGreaterThanOrEqual(move2);
    });

    it('should apply easing function', () => {
      const startY = FORMATIONS.ENTRANCE.START_Y;

      vi.useFakeTimers();
      vi.advanceTimersByTime(500);
      enemyManager.updateEntrance(500);
      const y1 = enemyManager.enemies[0].y;
      const ratio1 = (y1 - startY) / (enemyManager.enemies[0].targetY - startY);

      // Create new formation and update at longer time
      enemyManager.createFormation(1, true);
      vi.advanceTimersByTime(1000);
      enemyManager.updateEntrance(1000);
      const y2 = enemyManager.enemies[0].y;
      const ratio2 = (y2 - startY) / (enemyManager.enemies[0].targetY - startY);
      vi.useRealTimers();

      // Position at 1000ms should be closer to target than 500ms
      expect(ratio2).toBeGreaterThan(ratio1);
    });
  });

  describe('formation position validity', () => {
    it('should create formations with no duplicate positions', () => {
      const types = ['classic', 'vshape', 'diamond', 'spiral', 'cross', 'random'];
      for (const type of types) {
        const positions = FormationGenerator.generate(type);
        const positionSet = new Set();
        for (const pos of positions) {
          const key = `${pos.x},${pos.y}`;
          expect(positionSet.has(key)).toBe(false);
          positionSet.add(key);
        }
      }
    });

    it('should generate positions within game bounds', () => {
      const types = ['classic', 'vshape', 'diamond', 'spiral', 'cross', 'random'];
      for (const type of types) {
        const positions = FormationGenerator.generate(type);
        for (const pos of positions) {
          expect(pos.x).toBeGreaterThanOrEqual(ENEMY.START_X - 100);
          expect(pos.x).toBeLessThanOrEqual(GAME.WIDTH);
          expect(pos.y).toBeGreaterThanOrEqual(ENEMY.START_Y - 100);
          expect(pos.y).toBeLessThanOrEqual(GAME.HEIGHT);
        }
      }
    });

    it('should maintain row and col indices validity', () => {
      const types = ['classic', 'vshape', 'diamond', 'spiral', 'cross', 'random'];
      for (const type of types) {
        const positions = FormationGenerator.generate(type);
        for (const pos of positions) {
          expect(pos.row).toBeGreaterThanOrEqual(0);
          expect(pos.col).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('endless mode scaling', () => {
    it('should increase difficulty multiplier with waves', () => {
      enemyManager.setGameMode('endless');
      enemyManager.setWave(1);
      enemyManager.createFormation(1, false);
      const mult1 = enemyManager.difficultyMultiplier;

      enemyManager.setWave(5);
      enemyManager.createFormation(1, false);
      const mult5 = enemyManager.difficultyMultiplier;

      expect(mult5).toBeGreaterThan(mult1);
    });

    it('should cap difficulty multiplier at maximum', () => {
      enemyManager.setGameMode('endless');
      enemyManager.setWave(100);
      enemyManager.createFormation(1, false);
      expect(enemyManager.difficultyMultiplier).toBeLessThanOrEqual(3.0);
    });

    it('should add extra rows with waves in endless mode', () => {
      enemyManager.setGameMode('endless');
      enemyManager.setWave(1);
      enemyManager.createFormation(1, false);
      const count1 = enemyManager.enemies.length;

      enemyManager.setWave(10);
      enemyManager.createFormation(1, false);
      const count10 = enemyManager.enemies.length;

      expect(count10).toBeGreaterThan(count1);
    });

    it('should cap extra rows at maximum', () => {
      enemyManager.setGameMode('endless');
      enemyManager.setWave(100);
      enemyManager.createFormation(1, false);
      // Max extra rows is 3, so max enemies = 55 + (3 * 11) = 88
      expect(enemyManager.enemies.length).toBeLessThanOrEqual(88);
    });
  });

  describe('edge cases', () => {
    it('should handle creating formation with level 0', () => {
      enemyManager.createFormation(0, false);
      expect(enemyManager.enemies.length).toBeGreaterThan(0);
    });

    it('should handle creating formation with negative level', () => {
      expect(() => enemyManager.createFormation(-5, false)).not.toThrow();
    });

    it('should handle creating formation with very high level', () => {
      enemyManager.createFormation(1000, false);
      expect(enemyManager.getFormationType()).toBe('random');
    });

    it('should handle setWave with value less than 1', () => {
      enemyManager.setWave(0);
      expect(enemyManager.wave).toBe(1);
    });

    it('should handle setGameMode with invalid string', () => {
      enemyManager.setGameMode('invalid');
      expect(enemyManager.gameMode).toBe('classic');
    });

    it('should handle setGameMode case-insensitive', () => {
      enemyManager.setGameMode('ENDLESS');
      expect(enemyManager.gameMode).toBe('classic');
    });
  });
});
