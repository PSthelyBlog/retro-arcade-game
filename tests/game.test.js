import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game.js';
import { GameState } from '../src/constants.js';

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  describe('initialization', () => {
    it('should start in MENU state', () => {
      expect(game.state).toBe(GameState.MENU);
    });

    it('should initialize at level 1', () => {
      expect(game.level).toBe(1);
    });

    it('should have all managers initialized', () => {
      expect(game.renderer).toBeDefined();
      expect(game.input).toBeDefined();
      expect(game.enemyManager).toBeDefined();
      expect(game.projectileManager).toBeDefined();
      expect(game.scoreManager).toBeDefined();
      expect(game.soundManager).toBeDefined();
    });

    it('should not have player until game starts', () => {
      expect(game.player).toBeNull();
    });
  });

  describe('startNewGame', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should change state to PLAYING', () => {
      expect(game.state).toBe(GameState.PLAYING);
    });

    it('should create player', () => {
      expect(game.player).not.toBeNull();
    });

    it('should create bunkers', () => {
      expect(game.bunkers.length).toBeGreaterThan(0);
    });

    it('should create enemy formation', () => {
      expect(game.enemyManager.getEnemyCount()).toBeGreaterThan(0);
    });

    it('should reset score', () => {
      game.scoreManager.addPoints(1000);
      game.startNewGame();
      expect(game.scoreManager.getScore()).toBe(0);
    });

    it('should reset level to 1', () => {
      game.level = 5;
      game.startNewGame();
      expect(game.level).toBe(1);
    });
  });

  describe('state transitions', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should transition to GAME_OVER on gameOver()', () => {
      game.gameOver();
      expect(game.state).toBe(GameState.GAME_OVER);
    });

    it('should transition to LEVEL_COMPLETE on levelComplete()', () => {
      game.levelComplete();
      expect(game.state).toBe(GameState.LEVEL_COMPLETE);
    });
  });

  describe('startNextLevel', () => {
    beforeEach(() => {
      game.startNewGame();
      game.level = 1;
      game.startNextLevel();
    });

    it('should increment level', () => {
      expect(game.level).toBe(2);
    });

    it('should clear projectiles', () => {
      expect(game.projectileManager.getActivePlayerProjectiles()).toHaveLength(0);
      expect(game.projectileManager.getActiveEnemyProjectiles()).toHaveLength(0);
    });

    it('should recreate enemy formation', () => {
      expect(game.enemyManager.getEnemyCount()).toBeGreaterThan(0);
    });

    it('should change state to PLAYING', () => {
      expect(game.state).toBe(GameState.PLAYING);
    });
  });

  describe('bunkers', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should create 4 bunkers', () => {
      expect(game.bunkers).toHaveLength(4);
    });

    it('should space bunkers evenly', () => {
      const bunker1 = game.bunkers[0];
      const bunker2 = game.bunkers[1];
      const spacing = bunker2.x - bunker1.x;

      expect(spacing).toBeGreaterThan(bunker1.width);
    });
  });

  describe('mystery ship', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should not have mystery ship initially', () => {
      expect(game.mysteryShip).toBeNull();
    });

    it('should spawn mystery ship after timer', () => {
      game.mysteryShipTimer = game.nextMysteryShipTime + 1;
      game.updateMysteryShip(0);
      expect(game.mysteryShip).not.toBeNull();
    });

    it('should clear mystery ship when it goes off screen', () => {
      game.spawnMysteryShip();
      game.mysteryShip.active = false;
      game.updateMysteryShip(0);
      expect(game.mysteryShip).toBeNull();
    });
  });

  describe('explosions', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should add explosion', () => {
      game.addExplosion(100, 100);
      expect(game.explosions).toHaveLength(1);
    });

    it('should animate explosions', () => {
      game.addExplosion(100, 100);
      const initialFrame = game.explosions[0].frame;
      game.updateExplosions(100);
      expect(game.explosions[0].frame).toBeGreaterThan(initialFrame);
    });

    it('should remove finished explosions', () => {
      game.addExplosion(100, 100);
      game.explosions[0].frame = 10;
      game.explosions[0].timer = 1000;
      game.updateExplosions(100);
      expect(game.explosions).toHaveLength(0);
    });
  });

  describe('game conditions', () => {
    beforeEach(() => {
      game.startNewGame();
    });

    it('should trigger level complete when all enemies destroyed', () => {
      // Remove all enemies
      for (const enemy of game.enemyManager.enemies) {
        enemy.deactivate();
      }
      game.checkGameConditions();
      expect(game.state).toBe(GameState.LEVEL_COMPLETE);
    });
  });
});
