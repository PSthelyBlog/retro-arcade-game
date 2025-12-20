import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/entities/player.js';
import { PLAYER, GAME } from '../../src/constants.js';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player(400, 550);
  });

  describe('initialization', () => {
    it('should initialize at the correct position', () => {
      expect(player.x).toBe(400);
      expect(player.y).toBe(550);
    });

    it('should have correct dimensions', () => {
      expect(player.width).toBe(PLAYER.WIDTH);
      expect(player.height).toBe(PLAYER.HEIGHT);
    });

    it('should start with default lives', () => {
      expect(player.lives).toBe(PLAYER.LIVES);
    });

    it('should be active by default', () => {
      expect(player.active).toBe(true);
    });

    it('should not be invulnerable initially', () => {
      expect(player.invulnerable).toBe(false);
    });
  });

  describe('movement', () => {
    it('should move left when moveLeft is called', () => {
      const initialX = player.x;
      player.moveLeft();
      expect(player.x).toBe(initialX - PLAYER.SPEED);
    });

    it('should move right when moveRight is called', () => {
      const initialX = player.x;
      player.moveRight();
      expect(player.x).toBe(initialX + PLAYER.SPEED);
    });

    it('should not move past left boundary', () => {
      player.x = 2;
      player.moveLeft();
      expect(player.x).toBe(0);
    });

    it('should not move past right boundary', () => {
      player.x = GAME.WIDTH - PLAYER.WIDTH - 2;
      player.moveRight();
      expect(player.x).toBe(GAME.WIDTH - PLAYER.WIDTH);
    });
  });

  describe('shooting', () => {
    it('should create projectile data when shooting', () => {
      const projectiles = player.shoot(PLAYER.FIRE_RATE + 1);
      expect(projectiles).not.toBeNull();
      expect(Array.isArray(projectiles)).toBe(true);
      expect(projectiles[0].isPlayerBullet).toBe(true);
    });

    it('should position projectile at center top of player', () => {
      const projectiles = player.shoot(PLAYER.FIRE_RATE + 1);
      expect(projectiles[0].x).toBe(player.x + player.width / 2 - 2);
      expect(projectiles[0].y).toBe(player.y - 10);
    });

    it('should respect fire rate cooldown', () => {
      player.shoot(0);
      const secondShot = player.shoot(100); // Within cooldown
      expect(secondShot).toBeNull();
    });

    it('should allow shooting after cooldown', () => {
      player.shoot(0);
      const secondShot = player.shoot(PLAYER.FIRE_RATE + 1);
      expect(secondShot).not.toBeNull();
    });

    it('should fire multiple projectiles with multi-shot enabled', () => {
      player.setMultiShotConfig({ projectileCount: 3, spreadAngle: 15 });
      const projectiles = player.shoot(PLAYER.FIRE_RATE + 1);
      expect(projectiles.length).toBe(3);
    });

    it('should respect fire rate multiplier', () => {
      player.setFireRateMultiplier(0.5); // Faster fire rate
      player.shoot(0);
      // With 0.5 multiplier, cooldown is half
      const secondShot = player.shoot(PLAYER.FIRE_RATE * 0.5 + 1);
      expect(secondShot).not.toBeNull();
    });
  });

  describe('taking damage', () => {
    it('should decrease lives when hit', () => {
      const initialLives = player.lives;
      player.hit();
      expect(player.lives).toBe(initialLives - 1);
    });

    it('should become invulnerable after being hit', () => {
      player.hit();
      expect(player.invulnerable).toBe(true);
    });

    it('should return died=true when no lives remaining', () => {
      player.lives = 1;
      const result = player.hit();
      expect(result.died).toBe(true);
      expect(result.shieldConsumed).toBe(false);
    });

    it('should return died=false when lives remaining', () => {
      player.lives = 3;
      const result = player.hit();
      expect(result.died).toBe(false);
      expect(result.shieldConsumed).toBe(false);
    });

    it('should not take damage while invulnerable', () => {
      player.setInvulnerable();
      const initialLives = player.lives;
      player.hit();
      expect(player.lives).toBe(initialLives);
    });

    it('should consume shield instead of losing life', () => {
      player.setShield(true);
      const initialLives = player.lives;
      const result = player.hit();
      expect(result.died).toBe(false);
      expect(result.shieldConsumed).toBe(true);
      expect(player.lives).toBe(initialLives); // Lives unchanged
      expect(player.hasShield()).toBe(false); // Shield consumed
    });
  });

  describe('invulnerability', () => {
    it('should end invulnerability after duration', () => {
      player.setInvulnerable();
      player.update(player.invulnerableDuration + 100);
      expect(player.invulnerable).toBe(false);
    });

    it('should blink during invulnerability', () => {
      player.setInvulnerable();
      player.update(player.blinkRate / 2);
      const visible1 = player.visible;
      player.update(player.blinkRate);
      const visible2 = player.visible;
      expect(visible1).not.toBe(visible2);
    });
  });

  describe('reset', () => {
    it('should reset position to center', () => {
      player.x = 100;
      player.y = 100;
      player.reset();
      expect(player.x).toBe(GAME.WIDTH / 2 - PLAYER.WIDTH / 2);
      expect(player.y).toBe(PLAYER.START_Y);
    });

    it('should reset lives', () => {
      player.lives = 1;
      player.reset();
      expect(player.lives).toBe(PLAYER.LIVES);
    });

    it('should clear invulnerability', () => {
      player.invulnerable = true;
      player.reset();
      expect(player.invulnerable).toBe(false);
    });
  });

  describe('bounding box', () => {
    it('should return correct bounds', () => {
      const bounds = player.getBounds();
      expect(bounds.left).toBe(player.x);
      expect(bounds.right).toBe(player.x + player.width);
      expect(bounds.top).toBe(player.y);
      expect(bounds.bottom).toBe(player.y + player.height);
    });
  });
});
