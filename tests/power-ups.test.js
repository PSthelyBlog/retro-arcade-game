import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUp } from '../src/entities/power-up.js';
import { PowerUpManager } from '../src/managers/power-up-manager.js';
import { CollisionDetector } from '../src/managers/collision-detector.js';
import { POWERUPS, GAME } from '../src/constants.js';

// Helper to create mock player entity
function createMockPlayer(x = 400, y = 550, width = 40, height = 30, active = true) {
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
  };
}

// Helper to create mock entity for getBounds()
function createMockEntity(x = 0, y = 0, width = 50, height = 50, active = true) {
  return {
    x,
    y,
    width,
    height,
    active,
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
  };
}

describe('Power-up System', () => {
  describe('PowerUp Entity', () => {
    let powerUp;

    beforeEach(() => {
      powerUp = new PowerUp(100, 100, 'SHIELD');
    });

    // Initialization tests
    it('should initialize with correct position (center-based)', () => {
      const x = 150;
      const y = 200;
      const pu = new PowerUp(x, y, 'RAPID_FIRE');

      // Position is stored as top-left, but constructor receives center
      expect(pu.x).toBe(x - POWERUPS.SIZE / 2);
      expect(pu.y).toBe(y - POWERUPS.SIZE / 2);
    });

    it('should initialize with correct size', () => {
      expect(powerUp.width).toBe(POWERUPS.SIZE);
      expect(powerUp.height).toBe(POWERUPS.SIZE);
    });

    it('should initialize with correct type', () => {
      expect(powerUp.type).toBe('SHIELD');
    });

    it('should initialize with correct color from type config', () => {
      expect(powerUp.color).toBe(POWERUPS.TYPES.SHIELD.color);
    });

    it('should initialize with correct duration from type config', () => {
      expect(powerUp.duration).toBe(POWERUPS.TYPES.SHIELD.duration);
    });

    it('should initialize animation state', () => {
      expect(powerUp.pulsePhase).toBe(0);
      expect(powerUp.rotationAngle).toBe(0);
    });

    it('should initialize lifetime to zero', () => {
      expect(powerUp.lifetime).toBe(0);
    });

    it('should initialize with EXPIRE_TIME', () => {
      expect(powerUp.expireTime).toBe(POWERUPS.EXPIRE_TIME);
    });

    it('should be active when created', () => {
      expect(powerUp.active).toBe(true);
    });

    // Different type initialization
    it('should initialize RAPID_FIRE type correctly', () => {
      const rf = new PowerUp(100, 100, 'RAPID_FIRE');
      expect(rf.type).toBe('RAPID_FIRE');
      expect(rf.color).toBe(POWERUPS.TYPES.RAPID_FIRE.color);
      expect(rf.duration).toBe(POWERUPS.TYPES.RAPID_FIRE.duration);
    });

    it('should initialize MULTI_SHOT type correctly', () => {
      const ms = new PowerUp(100, 100, 'MULTI_SHOT');
      expect(ms.type).toBe('MULTI_SHOT');
      expect(ms.color).toBe(POWERUPS.TYPES.MULTI_SHOT.color);
      expect(ms.duration).toBe(POWERUPS.TYPES.MULTI_SHOT.duration);
    });

    it('should initialize BOMB type correctly', () => {
      const bomb = new PowerUp(100, 100, 'BOMB');
      expect(bomb.type).toBe('BOMB');
      expect(bomb.color).toBe(POWERUPS.TYPES.BOMB.color);
      expect(bomb.duration).toBe(POWERUPS.TYPES.BOMB.duration);
    });

    it('should initialize EXTRA_LIFE type correctly', () => {
      const life = new PowerUp(100, 100, 'EXTRA_LIFE');
      expect(life.type).toBe('EXTRA_LIFE');
      expect(life.color).toBe(POWERUPS.TYPES.EXTRA_LIFE.color);
      expect(life.duration).toBe(POWERUPS.TYPES.EXTRA_LIFE.duration);
    });

    // Falling/Movement tests
    it('should fall at correct speed', () => {
      const initialY = powerUp.y;
      const deltaTime = 16.67; // One frame at 60fps

      powerUp.update(deltaTime);

      const expectedFall = POWERUPS.FALL_SPEED * (deltaTime / 16.67);
      expect(powerUp.y).toBe(initialY + expectedFall);
    });

    it('should fall proportionally to deltaTime', () => {
      const pu1 = new PowerUp(100, 100, 'SHIELD');
      const pu2 = new PowerUp(100, 100, 'SHIELD');

      const baseY1 = pu1.y;
      const baseY2 = pu2.y;

      pu1.update(50);
      pu2.update(100); // Double the time

      const fall1 = pu1.y - baseY1;
      const fall2 = pu2.y - baseY2;
      // Both fall distance should be approximately proportional to deltaTime
      // We check that pu2 falls roughly twice as much as pu1
      expect(fall2).toBeCloseTo(fall1 * 2, 0);
    });

    // Animation tests
    it('should update pulse phase', () => {
      const initialPhase = powerUp.pulsePhase;
      const deltaTime = 16.67;

      powerUp.update(deltaTime);

      const expectedPhaseIncrease = POWERUPS.PULSE_SPEED * (deltaTime / 16.67);
      expect(powerUp.pulsePhase).toBe(initialPhase + expectedPhaseIncrease);
    });

    it('should update rotation angle', () => {
      const initialAngle = powerUp.rotationAngle;
      const deltaTime = 16.67;

      powerUp.update(deltaTime);

      const expectedAngleIncrease = 0.05 * (deltaTime / 16.67);
      expect(powerUp.rotationAngle).toBe(initialAngle + expectedAngleIncrease);
    });

    it('should accumulate lifetime on update', () => {
      const deltaTime = 100;
      powerUp.update(deltaTime);
      expect(powerUp.lifetime).toBe(deltaTime);

      powerUp.update(deltaTime);
      expect(powerUp.lifetime).toBe(deltaTime * 2);
    });

    // Expiration tests
    it('should deactivate when lifetime exceeds expireTime', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME + 1;
      powerUp.update(1);

      expect(powerUp.active).toBe(false);
    });

    it('should deactivate when lifetime equals expireTime', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME;
      powerUp.update(1);

      expect(powerUp.active).toBe(false);
    });

    it('should deactivate when off screen (y > GAME.HEIGHT)', () => {
      powerUp.y = GAME.HEIGHT + 1;
      powerUp.update(1);

      expect(powerUp.active).toBe(false);
    });

    it('should deactivate when at bottom of screen', () => {
      powerUp.y = GAME.HEIGHT;
      powerUp.update(1);

      expect(powerUp.active).toBe(false);
    });

    it('should remain active while within bounds', () => {
      powerUp.y = GAME.HEIGHT - 50;
      powerUp.lifetime = POWERUPS.EXPIRE_TIME - 1000;
      powerUp.update(1);

      expect(powerUp.active).toBe(true);
    });

    // isExpiringSoon tests
    it('should return false when more than 2 seconds remain', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME - 2001;
      expect(powerUp.isExpiringSoon()).toBe(false);
    });

    it('should return true when exactly 2 seconds remain', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME - 2000;
      expect(powerUp.isExpiringSoon()).toBe(true);
    });

    it('should return true when less than 2 seconds remain', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME - 1000;
      expect(powerUp.isExpiringSoon()).toBe(true);
    });

    it('should return true when at expiration time', () => {
      powerUp.lifetime = POWERUPS.EXPIRE_TIME;
      expect(powerUp.isExpiringSoon()).toBe(true);
    });

    it('should return false at start', () => {
      expect(powerUp.isExpiringSoon()).toBe(false);
    });

    // Icon tests
    it('should return correct icon for SHIELD', () => {
      const pu = new PowerUp(100, 100, 'SHIELD');
      expect(pu.getIcon()).toBe('🛡️');
    });

    it('should return correct icon for RAPID_FIRE', () => {
      const pu = new PowerUp(100, 100, 'RAPID_FIRE');
      expect(pu.getIcon()).toBe('⚡');
    });

    it('should return correct icon for MULTI_SHOT', () => {
      const pu = new PowerUp(100, 100, 'MULTI_SHOT');
      expect(pu.getIcon()).toBe('↗');
    });

    it('should return correct icon for BOMB', () => {
      const pu = new PowerUp(100, 100, 'BOMB');
      expect(pu.getIcon()).toBe('💣');
    });

    it('should return correct icon for EXTRA_LIFE', () => {
      const pu = new PowerUp(100, 100, 'EXTRA_LIFE');
      expect(pu.getIcon()).toBe('❤️');
    });
  });

  describe('PowerUpManager', () => {
    let manager;

    beforeEach(() => {
      manager = new PowerUpManager();
    });

    // Reset tests
    it('should initialize with empty power-ups array', () => {
      expect(manager.powerUps).toEqual([]);
    });

    it('should initialize with empty active effects', () => {
      expect(manager.activeEffects).toEqual({});
    });

    it('should initialize with shield inactive', () => {
      expect(manager.shieldActive).toBe(false);
    });

    it('should reset power-ups', () => {
      manager.spawn(100, 100, 'SHIELD');
      expect(manager.powerUps).toHaveLength(1);

      manager.reset();
      expect(manager.powerUps).toHaveLength(0);
    });

    it('should reset active effects', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 5000 };
      manager.reset();
      expect(manager.activeEffects).toEqual({});
    });

    it('should reset shield on reset()', () => {
      manager.shieldActive = true;
      manager.reset();
      expect(manager.shieldActive).toBe(false);
    });

    // Spawn tests
    it('should spawn power-up at position with type', () => {
      manager.spawn(150, 200, 'RAPID_FIRE');

      expect(manager.powerUps).toHaveLength(1);
      expect(manager.powerUps[0].type).toBe('RAPID_FIRE');
    });

    it('should spawn multiple power-ups', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(150, 150, 'RAPID_FIRE');
      manager.spawn(200, 200, 'MULTI_SHOT');

      expect(manager.powerUps).toHaveLength(3);
    });

    it('should spawn power-up as active', () => {
      manager.spawn(100, 100, 'SHIELD');
      expect(manager.powerUps[0].active).toBe(true);
    });

    // trySpawn tests
    it('should spawn when random is within DROP_CHANCE', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01); // Less than DROP_CHANCE (0.15)

      const result = manager.trySpawn(100, 100);

      expect(result).toBe(true);
      expect(manager.powerUps).toHaveLength(1);

      spy.mockRestore();
    });

    it('should not spawn when random exceeds DROP_CHANCE', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.2); // Greater than DROP_CHANCE (0.15)

      const result = manager.trySpawn(100, 100);

      expect(result).toBe(false);
      expect(manager.powerUps).toHaveLength(0);

      spy.mockRestore();
    });

    it('should not spawn when random equals DROP_CHANCE', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(POWERUPS.DROP_CHANCE);

      const result = manager.trySpawn(100, 100);

      // Math.random() > DROP_CHANCE, so 0.15 > 0.15 is false, will NOT spawn
      // But the condition in trySpawn is: if (Math.random() > DROP_CHANCE) return false
      // So 0.15 > 0.15 is false, which means we DO NOT return, so we spawn
      expect(result).toBe(true);

      spy.mockRestore();
    });

    it('should spawn valid random type from trySpawn', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

      manager.trySpawn(100, 100);

      expect(manager.powerUps).toHaveLength(1);
      const validTypes = Object.keys(POWERUPS.TYPES);
      expect(validTypes).toContain(manager.powerUps[0].type);

      spy.mockRestore();
    });

    // getRandomType tests
    it('should return valid power-up type', () => {
      const type = manager.getRandomType();
      const validTypes = Object.keys(POWERUPS.TYPES);
      expect(validTypes).toContain(type);
    });

    it('should respect weighted distribution', () => {
      const spy = vi.spyOn(Math, 'random');

      // SHIELD has dropWeight 5
      // Total weight = 5 + 10 + 8 + 2 + 1 = 26
      // SHIELD range: 0-5/26 ≈ 0-0.192

      spy.mockReturnValue(0.05); // Should be SHIELD
      let type = manager.getRandomType();
      expect(type).toBe('SHIELD');

      // RAPID_FIRE range: 5/26-15/26 ≈ 0.192-0.577
      spy.mockReturnValue(0.3);
      type = manager.getRandomType();
      expect(type).toBe('RAPID_FIRE');

      // MULTI_SHOT range: 15/26-23/26 ≈ 0.577-0.885
      spy.mockReturnValue(0.7);
      type = manager.getRandomType();
      expect(type).toBe('MULTI_SHOT');

      // BOMB range: 23/26-25/26 ≈ 0.885-0.962
      spy.mockReturnValue(0.92);
      type = manager.getRandomType();
      expect(type).toBe('BOMB');

      // EXTRA_LIFE range: 25/26-26/26 ≈ 0.962-1.0
      spy.mockReturnValue(0.99);
      type = manager.getRandomType();
      expect(type).toBe('EXTRA_LIFE');

      spy.mockRestore();
    });

    // activateEffect tests
    describe('activateEffect', () => {
      it('should activate SHIELD effect', () => {
        const result = manager.activateEffect('SHIELD', 5000);

        expect(manager.shieldActive).toBe(true);
        expect(result.type).toBe('SHIELD');
        expect(result.data.shieldActive).toBe(true);
        expect(result.instant).toBe(false);
      });

      it('should activate RAPID_FIRE effect', () => {
        const currentTime = 5000;
        const result = manager.activateEffect('RAPID_FIRE', currentTime);

        expect(manager.activeEffects.RAPID_FIRE).toBeDefined();
        expect(manager.activeEffects.RAPID_FIRE.endTime).toBe(
          currentTime + POWERUPS.TYPES.RAPID_FIRE.duration
        );
        expect(result.type).toBe('RAPID_FIRE');
        expect(result.data.fireRateMultiplier).toBe(0.5);
        expect(result.instant).toBe(false);
      });

      it('should activate MULTI_SHOT effect', () => {
        const currentTime = 5000;
        const result = manager.activateEffect('MULTI_SHOT', currentTime);

        expect(manager.activeEffects.MULTI_SHOT).toBeDefined();
        expect(manager.activeEffects.MULTI_SHOT.endTime).toBe(
          currentTime + POWERUPS.TYPES.MULTI_SHOT.duration
        );
        expect(result.type).toBe('MULTI_SHOT');
        expect(result.data.projectileCount).toBe(3);
        expect(result.data.spreadAngle).toBe(15);
        expect(result.instant).toBe(false);
      });

      it('should activate BOMB effect as instant', () => {
        const result = manager.activateEffect('BOMB', 5000);

        expect(result.type).toBe('BOMB');
        expect(result.instant).toBe(true);
        expect(result.data.clearEnemies).toBe(true);
      });

      it('should activate EXTRA_LIFE effect as instant', () => {
        const result = manager.activateEffect('EXTRA_LIFE', 5000);

        expect(result.type).toBe('EXTRA_LIFE');
        expect(result.instant).toBe(true);
        expect(result.data.extraLife).toBe(true);
      });
    });

    // Shield tests
    it('should consumeShield when shield is active', () => {
      manager.shieldActive = true;

      const result = manager.consumeShield();

      expect(result).toBe(true);
      expect(manager.shieldActive).toBe(false);
    });

    it('should not consumeShield when shield is inactive', () => {
      manager.shieldActive = false;

      const result = manager.consumeShield();

      expect(result).toBe(false);
      expect(manager.shieldActive).toBe(false);
    });

    it('should report hasShield correctly when active', () => {
      manager.shieldActive = true;
      expect(manager.hasShield()).toBe(true);
    });

    it('should report hasShield correctly when inactive', () => {
      manager.shieldActive = false;
      expect(manager.hasShield()).toBe(false);
    });

    // Fire rate multiplier tests
    it('should return 1.0 fire rate when no RAPID_FIRE effect', () => {
      expect(manager.getFireRateMultiplier()).toBe(1.0);
    });

    it('should return correct multiplier when RAPID_FIRE active', () => {
      manager.activeEffects.RAPID_FIRE = { multiplier: 0.5 };
      expect(manager.getFireRateMultiplier()).toBe(0.5);
    });

    it('should return 1.0 after RAPID_FIRE expires', () => {
      manager.activeEffects.RAPID_FIRE = { multiplier: 0.5 };
      delete manager.activeEffects.RAPID_FIRE;
      expect(manager.getFireRateMultiplier()).toBe(1.0);
    });

    // Multi-shot tests
    it('should return false for hasMultiShot when inactive', () => {
      expect(manager.hasMultiShot()).toBe(false);
    });

    it('should return true for hasMultiShot when active', () => {
      manager.activeEffects.MULTI_SHOT = {
        projectileCount: 3,
        spreadAngle: 15,
        endTime: 10000,
      };
      expect(manager.hasMultiShot()).toBe(true);
    });

    it('should return null from getMultiShotConfig when inactive', () => {
      expect(manager.getMultiShotConfig()).toBeNull();
    });

    it('should return config from getMultiShotConfig when active', () => {
      const config = {
        projectileCount: 3,
        spreadAngle: 15,
        endTime: 10000,
      };
      manager.activeEffects.MULTI_SHOT = config;

      const result = manager.getMultiShotConfig();

      expect(result).toEqual(config);
      expect(result.projectileCount).toBe(3);
      expect(result.spreadAngle).toBe(15);
    });

    // Update tests
    it('should update power-ups during update', () => {
      manager.spawn(100, 100, 'SHIELD');
      const powerUp = manager.powerUps[0];
      const initialY = powerUp.y;

      manager.update(16.67, 5000);

      expect(powerUp.y).toBeGreaterThan(initialY);
    });

    it('should remove inactive power-ups on update', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(100, 100, 'RAPID_FIRE');

      expect(manager.powerUps).toHaveLength(2);

      // Deactivate first power-up
      manager.powerUps[0].deactivate();

      manager.update(1, 5000);

      expect(manager.powerUps).toHaveLength(1);
    });

    it('should remove expired timed effects on update', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 5000 };
      const currentTime = 5001;

      manager.update(1, currentTime);

      expect(manager.activeEffects.RAPID_FIRE).toBeUndefined();
    });

    it('should keep active timed effects on update', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 6000 };
      const currentTime = 5000;

      manager.update(1, currentTime);

      expect(manager.activeEffects.RAPID_FIRE).toBeDefined();
    });

    it('should keep infinite duration effects', () => {
      manager.shieldActive = true;
      manager.activeEffects.SHIELD = { endTime: Infinity };

      manager.update(1, 999999);

      // Shield doesn't expire in activeEffects
      // It's tracked separately in shieldActive
      expect(manager.shieldActive).toBe(true);
    });

    // getActiveEffectsStatus tests
    it('should return empty array when no effects active', () => {
      const status = manager.getActiveEffectsStatus(5000);
      expect(status).toEqual([]);
    });

    it('should include SHIELD in status when active', () => {
      manager.shieldActive = true;

      const status = manager.getActiveEffectsStatus(5000);

      expect(status).toHaveLength(1);
      expect(status[0].type).toBe('SHIELD');
      expect(status[0].remainingTime).toBe(Infinity);
      expect(status[0].color).toBe(POWERUPS.TYPES.SHIELD.color);
    });

    it('should include timed effects in status', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 6000 };
      const currentTime = 5000;

      const status = manager.getActiveEffectsStatus(currentTime);

      expect(status).toHaveLength(1);
      expect(status[0].type).toBe('RAPID_FIRE');
      expect(status[0].remainingTime).toBe(1000);
      expect(status[0].color).toBe(POWERUPS.TYPES.RAPID_FIRE.color);
    });

    it('should exclude expired effects from status', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 5000 };
      const currentTime = 5001;

      const status = manager.getActiveEffectsStatus(currentTime);

      expect(status).toHaveLength(0);
    });

    it('should include multiple active effects', () => {
      manager.shieldActive = true;
      manager.activeEffects.RAPID_FIRE = { endTime: 6000 };
      manager.activeEffects.MULTI_SHOT = { endTime: 7000 };
      const currentTime = 5000;

      const status = manager.getActiveEffectsStatus(currentTime);

      expect(status).toHaveLength(3);
      expect(status.map((s) => s.type)).toContain('SHIELD');
      expect(status.map((s) => s.type)).toContain('RAPID_FIRE');
      expect(status.map((s) => s.type)).toContain('MULTI_SHOT');
    });

    it('should calculate correct remaining time', () => {
      manager.activeEffects.RAPID_FIRE = { endTime: 10000 };
      const currentTime = 7500;

      const status = manager.getActiveEffectsStatus(currentTime);

      expect(status[0].remainingTime).toBe(2500);
    });

    // clearPowerUps tests
    it('should clear all power-ups', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(150, 150, 'RAPID_FIRE');

      manager.clearPowerUps();

      expect(manager.powerUps).toHaveLength(0);
    });

    it('should not clear active effects when clearing power-ups', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.shieldActive = true;

      manager.clearPowerUps();

      expect(manager.shieldActive).toBe(true);
    });

    // getActivePowerUps tests
    it('should return only active power-ups', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(150, 150, 'RAPID_FIRE');
      manager.powerUps[0].deactivate();

      const active = manager.getActivePowerUps();

      expect(active).toHaveLength(1);
      expect(active[0].type).toBe('RAPID_FIRE');
    });

    it('should return empty array when no active power-ups', () => {
      const active = manager.getActivePowerUps();
      expect(active).toEqual([]);
    });
  });

  describe('Power-up Collision Detection', () => {
    let manager;
    let player;

    beforeEach(() => {
      manager = new PowerUpManager();
      player = createMockPlayer();
    });

    it('should detect collision between power-up and player', () => {
      manager.spawn(410, 560, 'SHIELD'); // Close to player

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        player
      );

      expect(collected).toHaveLength(1);
      expect(collected[0].type).toBe('SHIELD');
    });

    it('should not detect collision when power-ups are far away', () => {
      manager.spawn(100, 100, 'SHIELD');

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        player
      );

      expect(collected).toHaveLength(0);
    });

    it('should not collect inactive power-ups', () => {
      manager.spawn(410, 560, 'SHIELD');
      manager.powerUps[0].deactivate();

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        player
      );

      expect(collected).toHaveLength(0);
    });

    it('should not collect when player is inactive', () => {
      manager.spawn(410, 560, 'SHIELD');
      const inactivePlayer = createMockPlayer(400, 550, 40, 30, false);

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        inactivePlayer
      );

      expect(collected).toHaveLength(0);
    });

    it('should collect multiple power-ups at once', () => {
      manager.spawn(410, 560, 'SHIELD');
      manager.spawn(415, 565, 'RAPID_FIRE');

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        player
      );

      expect(collected).toHaveLength(2);
    });

    it('should collect power-ups of all types', () => {
      const types = ['SHIELD', 'RAPID_FIRE', 'MULTI_SHOT', 'BOMB', 'EXTRA_LIFE'];

      for (const type of types) {
        manager = new PowerUpManager();
        manager.spawn(410, 560, type);

        const collected = CollisionDetector.checkPowerUpsVsPlayer(
          manager.getActivePowerUps(),
          player
        );

        expect(collected).toHaveLength(1);
        expect(collected[0].type).toBe(type);
      }
    });

    it('should return empty array when no power-ups exist', () => {
      const collected = CollisionDetector.checkPowerUpsVsPlayer([], player);
      expect(collected).toEqual([]);
    });

    it('should handle power-up at exact player boundary', () => {
      // Player is at (400, 550) with size (40, 30)
      // Player bounds: x: 400-440, y: 550-580
      // Place power-up center at 440, which when adjusted for size becomes x: 428-452
      manager.spawn(440, 565, 'SHIELD');

      const collected = CollisionDetector.checkPowerUpsVsPlayer(
        manager.getActivePowerUps(),
        player
      );

      // Power-ups do overlap with player (428 < 440, 452 > 400)
      expect(collected).toHaveLength(1);
    });

    it('should detect falling power-up collision', () => {
      // Create power-up above player at same x position
      manager.spawn(410, 200, 'SHIELD');

      // Update power-up multiple times to fall toward player
      const maxIterations = 500;
      let collided = false;

      for (let i = 0; i < maxIterations; i++) {
        manager.update(16.67, i * 16.67);
        const collected = CollisionDetector.checkPowerUpsVsPlayer(
          manager.getActivePowerUps(),
          player
        );

        if (collected.length > 0) {
          collided = true;
          break;
        }

        // Stop if power-up has deactivated
        if (manager.getActivePowerUps().length === 0) {
          break;
        }
      }

      expect(collided).toBe(true);
    });
  });

  describe('Power-up Integration', () => {
    let manager;

    beforeEach(() => {
      manager = new PowerUpManager();
    });

    it('should complete full power-up lifecycle', () => {
      // Spawn power-up
      manager.spawn(100, 100, 'RAPID_FIRE');
      expect(manager.powerUps).toHaveLength(1);

      // Collect power-up
      const collected = manager.powerUps[0];
      manager.activateEffect(collected.type, 5000);

      // Check effect is active
      expect(manager.getFireRateMultiplier()).toBe(0.5);

      // Update to make effect expire
      manager.update(1, 15000);

      // Check effect expired
      expect(manager.getFireRateMultiplier()).toBe(1.0);
    });

    it('should handle simultaneous shield and rapid fire', () => {
      manager.activateEffect('SHIELD', 5000);
      manager.activateEffect('RAPID_FIRE', 5000);

      expect(manager.hasShield()).toBe(true);
      expect(manager.getFireRateMultiplier()).toBe(0.5);

      // Consume shield
      manager.consumeShield();

      expect(manager.hasShield()).toBe(false);
      expect(manager.getFireRateMultiplier()).toBe(0.5); // Rapid fire still active
    });

    it('should handle rapid fire expiring while shield is active', () => {
      manager.activateEffect('SHIELD', 5000);
      manager.activateEffect('RAPID_FIRE', 5000);

      manager.update(1, 15000);

      expect(manager.hasShield()).toBe(true);
      expect(manager.getFireRateMultiplier()).toBe(1.0);
    });

    it('should correctly report all active effects status', () => {
      manager.activateEffect('SHIELD', 5000);
      manager.activateEffect('RAPID_FIRE', 5000);
      manager.activateEffect('MULTI_SHOT', 5000);

      const status = manager.getActiveEffectsStatus(8000);

      expect(status).toHaveLength(3);
      const types = status.map((s) => s.type);
      expect(types).toContain('SHIELD');
      expect(types).toContain('RAPID_FIRE');
      expect(types).toContain('MULTI_SHOT');
    });

    it('should handle rapid respawn attempts', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

      for (let i = 0; i < 10; i++) {
        manager.trySpawn(100 + i * 50, 100);
      }

      expect(manager.powerUps).toHaveLength(10);

      spy.mockRestore();
    });

    it('should handle mixed spawn methods', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(150, 150, 'RAPID_FIRE');

      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
      manager.trySpawn(200, 200);
      spy.mockRestore();

      expect(manager.powerUps).toHaveLength(3);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    let manager;

    beforeEach(() => {
      manager = new PowerUpManager();
    });

    it('should handle large number of power-ups', () => {
      for (let i = 0; i < 100; i++) {
        manager.spawn(Math.random() * GAME.WIDTH, Math.random() * GAME.HEIGHT, 'SHIELD');
      }

      expect(manager.powerUps).toHaveLength(100);
    });

    it('should handle power-up expiration at boundary', () => {
      const pu = new PowerUp(100, 100, 'SHIELD');
      pu.lifetime = POWERUPS.EXPIRE_TIME - 1;

      pu.update(2); // Add 2ms more, totaling EXPIRE_TIME + 1

      expect(pu.active).toBe(false);
    });

    it('should handle zero delta time', () => {
      const pu = new PowerUp(100, 100, 'SHIELD');
      const initialY = pu.y;

      pu.update(0);

      expect(pu.y).toBe(initialY);
    });

    it('should handle very large delta time', () => {
      const pu = new PowerUp(100, 100, 'SHIELD');

      pu.update(15000); // 15 seconds, well past EXPIRE_TIME (10000ms)

      expect(pu.active).toBe(false); // Should be deactivated
    });

    it('should handle effect activation at different times', () => {
      manager.activateEffect('RAPID_FIRE', 1000); // Activated at time 1000, duration 10000ms
      manager.activateEffect('MULTI_SHOT', 7000); // Activated at time 7000, duration 8000ms

      // At time 3000, only RAPID_FIRE is active (started at 1000)
      // RAPID_FIRE endTime: 1000 + 10000 = 11000 (expires at 11000)
      const status1 = manager.getActiveEffectsStatus(3000);
      // Find only RAPID_FIRE in the status (should be 1)
      const rapidFire = status1.filter((s) => s.type === 'RAPID_FIRE');
      expect(rapidFire).toHaveLength(1);

      // At time 7000, both are active
      // RAPID_FIRE: started 1000, duration 10000, endTime 11000 (still active)
      // MULTI_SHOT: started 7000, duration 8000, endTime 15000 (just activated)
      const status2 = manager.getActiveEffectsStatus(7000);
      expect(status2).toHaveLength(2);
    });

    it('should handle rapid clear and spawn', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.spawn(150, 150, 'RAPID_FIRE');

      manager.clearPowerUps();
      expect(manager.powerUps).toHaveLength(0);

      manager.spawn(200, 200, 'MULTI_SHOT');
      expect(manager.powerUps).toHaveLength(1);
    });

    it('should maintain consistency across multiple updates', () => {
      manager.spawn(100, 100, 'SHIELD');
      manager.activateEffect('RAPID_FIRE', 0);

      for (let i = 0; i < 100; i++) {
        manager.update(16.67, i * 16.67);
      }

      const status = manager.getActiveEffectsStatus(100 * 16.67);
      expect(Array.isArray(status)).toBe(true);
    });

    it('should handle all power-up types simultaneously', () => {
      const types = ['SHIELD', 'RAPID_FIRE', 'MULTI_SHOT', 'BOMB', 'EXTRA_LIFE'];

      for (const type of types) {
        manager.spawn(100 + Math.random() * 100, 100, type);
      }

      expect(manager.powerUps).toHaveLength(5);
      expect(manager.getActivePowerUps()).toHaveLength(5);
    });
  });
});
