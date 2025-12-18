import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Enemy } from '../../src/entities/enemy.js';
import { ENEMY } from '../../src/constants.js';

describe('Enemy', () => {
  let enemy;

  beforeEach(() => {
    enemy = new Enemy(100, 80, 2, 5); // row 2, col 5
  });

  describe('initialization', () => {
    it('should initialize at correct position', () => {
      expect(enemy.x).toBe(100);
      expect(enemy.y).toBe(80);
    });

    it('should store row and column', () => {
      expect(enemy.row).toBe(2);
      expect(enemy.col).toBe(5);
    });

    it('should have correct dimensions', () => {
      expect(enemy.width).toBe(ENEMY.WIDTH);
      expect(enemy.height).toBe(ENEMY.HEIGHT);
    });

    it('should have color based on row', () => {
      expect(enemy.color).toBe(ENEMY.COLORS[2]);
    });

    it('should be active by default', () => {
      expect(enemy.active).toBe(true);
    });
  });

  describe('points value', () => {
    it('should return 30 points for top row enemies', () => {
      const topEnemy = new Enemy(0, 0, ENEMY.ROWS - 1, 0);
      expect(topEnemy.getPoints()).toBe(30);
    });

    it('should return 20 points for middle row enemies', () => {
      const midEnemy = new Enemy(0, 0, ENEMY.ROWS - 3, 0);
      expect(midEnemy.getPoints()).toBe(20);
    });

    it('should return 10 points for bottom row enemies', () => {
      const bottomEnemy = new Enemy(0, 0, 0, 0);
      expect(bottomEnemy.getPoints()).toBe(10);
    });
  });

  describe('shooting', () => {
    it('should sometimes return projectile data', () => {
      // Mock random to always fire
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const shot = enemy.shoot();
      expect(shot).not.toBeNull();
      expect(shot.isPlayerBullet).toBe(false);

      vi.restoreAllMocks();
    });

    it('should sometimes not fire', () => {
      // Mock random to never fire
      vi.spyOn(Math, 'random').mockReturnValue(1);

      const shot = enemy.shoot();
      expect(shot).toBeNull();

      vi.restoreAllMocks();
    });

    it('should position projectile at bottom center', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const shot = enemy.shoot();
      expect(shot.x).toBe(enemy.x + enemy.width / 2 - 2);
      expect(shot.y).toBe(enemy.y + enemy.height);

      vi.restoreAllMocks();
    });
  });

  describe('animation', () => {
    it('should update animation frame over time', () => {
      const initialFrame = enemy.animationFrame;
      enemy.update(enemy.animationSpeed + 1);
      expect(enemy.animationFrame).not.toBe(initialFrame);
    });

    it('should cycle between animation frames', () => {
      enemy.update(enemy.animationSpeed + 1);
      expect(enemy.animationFrame).toBe(1);

      enemy.update(enemy.animationSpeed + 1);
      expect(enemy.animationFrame).toBe(0);
    });
  });

  describe('bounding box', () => {
    it('should return correct bounds', () => {
      const bounds = enemy.getBounds();
      expect(bounds.x).toBe(enemy.x);
      expect(bounds.y).toBe(enemy.y);
      expect(bounds.width).toBe(enemy.width);
      expect(bounds.height).toBe(enemy.height);
    });
  });

  describe('deactivation', () => {
    it('should deactivate when destroyed', () => {
      enemy.deactivate();
      expect(enemy.active).toBe(false);
    });
  });
});
