import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionDetector } from '../../src/managers/collision-detector.js';

// Simple mock entities for testing
function createEntity(x, y, width, height, active = true) {
  return {
    x,
    y,
    width,
    height,
    active,
    invulnerable: false,
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
    },
    getCenter() {
      return {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
      };
    },
    deactivate() {
      this.active = false;
    },
  };
}

describe('CollisionDetector', () => {
  describe('checkCollision', () => {
    it('should detect overlapping rectangles', () => {
      const a = createEntity(0, 0, 50, 50);
      const b = createEntity(25, 25, 50, 50);

      expect(CollisionDetector.checkCollision(a, b)).toBe(true);
    });

    it('should not detect non-overlapping rectangles', () => {
      const a = createEntity(0, 0, 50, 50);
      const b = createEntity(100, 100, 50, 50);

      expect(CollisionDetector.checkCollision(a, b)).toBe(false);
    });

    it('should detect touching edges as collision', () => {
      const a = createEntity(0, 0, 50, 50);
      const b = createEntity(49, 0, 50, 50);

      expect(CollisionDetector.checkCollision(a, b)).toBe(true);
    });

    it('should handle exact boundary (no collision)', () => {
      const a = createEntity(0, 0, 50, 50);
      const b = createEntity(50, 0, 50, 50);

      expect(CollisionDetector.checkCollision(a, b)).toBe(false);
    });
  });

  describe('checkPlayerProjectilesVsEnemies', () => {
    it('should find collisions between projectiles and enemies', () => {
      const projectiles = [createEntity(50, 50, 4, 12)];
      const enemies = [createEntity(40, 40, 30, 24)];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(1);
      expect(collisions[0].projectile).toBe(projectiles[0]);
      expect(collisions[0].enemy).toBe(enemies[0]);
    });

    it('should not find collisions for inactive projectiles', () => {
      const projectiles = [createEntity(50, 50, 4, 12, false)];
      const enemies = [createEntity(40, 40, 30, 24)];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(0);
    });

    it('should not find collisions for inactive enemies', () => {
      const projectiles = [createEntity(50, 50, 4, 12)];
      const enemies = [createEntity(40, 40, 30, 24, false)];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(0);
    });

    it('should only collide each projectile once', () => {
      const projectiles = [createEntity(50, 50, 4, 12)];
      const enemies = [
        createEntity(40, 40, 30, 24),
        createEntity(45, 45, 30, 24),
      ];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(1);
    });
  });

  describe('checkEnemyProjectilesVsPlayer', () => {
    it('should detect projectile hitting player', () => {
      const projectiles = [createEntity(405, 555, 4, 12)];
      const player = createEntity(400, 550, 40, 30);

      const hit = CollisionDetector.checkEnemyProjectilesVsPlayer(
        projectiles,
        player
      );

      expect(hit).toBe(projectiles[0]);
    });

    it('should not detect hit when player is invulnerable', () => {
      const projectiles = [createEntity(405, 555, 4, 12)];
      const player = createEntity(400, 550, 40, 30);
      player.invulnerable = true;

      const hit = CollisionDetector.checkEnemyProjectilesVsPlayer(
        projectiles,
        player
      );

      expect(hit).toBeNull();
    });

    it('should not detect hit when player is inactive', () => {
      const projectiles = [createEntity(405, 555, 4, 12)];
      const player = createEntity(400, 550, 40, 30, false);

      const hit = CollisionDetector.checkEnemyProjectilesVsPlayer(
        projectiles,
        player
      );

      expect(hit).toBeNull();
    });
  });

  describe('checkEnemiesVsPlayer', () => {
    it('should detect enemy touching player', () => {
      const enemies = [createEntity(395, 545, 30, 24)];
      const player = createEntity(400, 550, 40, 30);

      const collision = CollisionDetector.checkEnemiesVsPlayer(enemies, player);

      expect(collision).toBe(true);
    });

    it('should not detect collision with inactive enemies', () => {
      const enemies = [createEntity(395, 545, 30, 24, false)];
      const player = createEntity(400, 550, 40, 30);

      const collision = CollisionDetector.checkEnemiesVsPlayer(enemies, player);

      expect(collision).toBe(false);
    });

    it('should not detect when enemies are far from player', () => {
      const enemies = [createEntity(100, 100, 30, 24)];
      const player = createEntity(400, 550, 40, 30);

      const collision = CollisionDetector.checkEnemiesVsPlayer(enemies, player);

      expect(collision).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty projectile array', () => {
      const projectiles = [];
      const enemies = [createEntity(40, 40, 30, 24)];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(0);
    });

    it('should handle empty enemy array', () => {
      const projectiles = [createEntity(50, 50, 4, 12)];
      const enemies = [];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(0);
    });

    it('should handle multiple collisions', () => {
      const projectiles = [
        createEntity(50, 50, 4, 12),
        createEntity(150, 50, 4, 12),
      ];
      const enemies = [
        createEntity(40, 40, 30, 24),
        createEntity(140, 40, 30, 24),
      ];

      const collisions = CollisionDetector.checkPlayerProjectilesVsEnemies(
        projectiles,
        enemies
      );

      expect(collisions).toHaveLength(2);
    });
  });
});
