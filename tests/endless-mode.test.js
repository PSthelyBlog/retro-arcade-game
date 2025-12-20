import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnemyManager } from '../src/managers/enemy-manager.js';
import { ScoreManager } from '../src/managers/score-manager.js';
import { ENDLESS_MODE, GameMode, GameState } from '../src/constants.js';

describe('Endless Mode Tests', () => {
  let localStorageMock;

  beforeEach(() => {
    // Create fresh mock localStorage for each test
    let store = {};
    localStorageMock = {
      store,
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constants validation', () => {
    it('should have ENDLESS_MODE constants defined with correct values', () => {
      expect(ENDLESS_MODE).toBeDefined();
      expect(ENDLESS_MODE.SPEED_INCREASE_PER_WAVE).toBe(0.05);
      expect(ENDLESS_MODE.FIRE_RATE_INCREASE_PER_WAVE).toBe(0.03);
      expect(ENDLESS_MODE.MAX_SPEED_MULTIPLIER).toBe(3.0);
      expect(ENDLESS_MODE.MAX_FIRE_RATE_MULTIPLIER).toBe(2.5);
      expect(ENDLESS_MODE.MYSTERY_SHIP_INTERVAL_DECREASE).toBe(0.05);
      expect(ENDLESS_MODE.MIN_MYSTERY_SHIP_INTERVAL).toBe(8000);
      expect(ENDLESS_MODE.DANGER_WAVE_THRESHOLD).toBe(15);
    });

    it('should have GameMode enum with CLASSIC and ENDLESS', () => {
      expect(GameMode).toBeDefined();
      expect(GameMode.CLASSIC).toBe('classic');
      expect(GameMode.ENDLESS).toBe('endless');
    });

    it('should have GameState with MODE_SELECT', () => {
      expect(GameState).toBeDefined();
      expect(GameState.MODE_SELECT).toBe('modeselect');
      expect(GameState.MENU).toBe('menu');
      expect(GameState.PLAYING).toBe('playing');
      expect(GameState.GAME_OVER).toBe('gameover');
    });
  });

  describe('EnemyManager endless mode', () => {
    let enemyManager;

    beforeEach(() => {
      enemyManager = new EnemyManager();
    });

    describe('game mode switching', () => {
      it('should start in classic mode', () => {
        expect(enemyManager.gameMode).toBe('classic');
      });

      it('should switch to endless mode correctly', () => {
        enemyManager.setGameMode('endless');
        expect(enemyManager.gameMode).toBe('endless');
      });

      it('should switch back to classic mode', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setGameMode('classic');
        expect(enemyManager.gameMode).toBe('classic');
      });

      it('should handle invalid mode strings by defaulting to classic', () => {
        enemyManager.setGameMode('invalid');
        expect(enemyManager.gameMode).toBe('classic');

        enemyManager.setGameMode('xyz');
        expect(enemyManager.gameMode).toBe('classic');
      });
    });

    describe('wave tracking', () => {
      it('should start at wave 1', () => {
        expect(enemyManager.wave).toBe(1);
      });

      it('should set wave number correctly', () => {
        enemyManager.setWave(5);
        expect(enemyManager.wave).toBe(5);

        enemyManager.setWave(20);
        expect(enemyManager.wave).toBe(20);
      });

      it('should prevent wave from going below 1', () => {
        enemyManager.setWave(0);
        expect(enemyManager.wave).toBe(1);

        enemyManager.setWave(-5);
        expect(enemyManager.wave).toBe(1);
      });
    });

    describe('difficulty multiplier calculation', () => {
      it('should have difficulty multiplier of 1.0 in classic mode', () => {
        enemyManager.setGameMode('classic');
        enemyManager.createFormation();
        expect(enemyManager.getDifficultyMultiplier()).toBe(1.0);
      });

      it('should calculate difficulty multiplier correctly at wave 1', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(1);
        enemyManager.createFormation();

        // Wave 1: 1 + (1-1) * 0.05 = 1.0
        expect(enemyManager.getDifficultyMultiplier()).toBe(1.0);
      });

      it('should calculate difficulty multiplier at wave 5', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(5);
        enemyManager.createFormation();

        // Wave 5: 1 + (5-1) * 0.05 = 1.2
        expect(enemyManager.getDifficultyMultiplier()).toBe(1.2);
      });

      it('should calculate difficulty multiplier at wave 10', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(10);
        enemyManager.createFormation();

        // Wave 10: 1 + (10-1) * 0.05 = 1.45
        expect(enemyManager.getDifficultyMultiplier()).toBeCloseTo(1.45, 5);
      });

      it('should calculate difficulty multiplier at wave 20', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(20);
        enemyManager.createFormation();

        // Wave 20: 1 + (20-1) * 0.05 = 1.95
        expect(enemyManager.getDifficultyMultiplier()).toBeCloseTo(1.95, 5);
      });

      it('should cap difficulty multiplier at MAX_SPEED_MULTIPLIER (3.0)', () => {
        enemyManager.setGameMode('endless');

        // Wave that would exceed cap: (3.0 - 1) / 0.05 + 1 = 41
        enemyManager.setWave(50);
        enemyManager.createFormation();
        expect(enemyManager.getDifficultyMultiplier()).toBe(3.0);

        enemyManager.setWave(100);
        enemyManager.createFormation();
        expect(enemyManager.getDifficultyMultiplier()).toBe(3.0);
      });
    });

    describe('formation creation with difficulty', () => {
      it('should create formation with correct speed in classic mode', () => {
        enemyManager.setGameMode('classic');
        enemyManager.createFormation();

        expect(enemyManager.enemies.length).toBe(55); // 5 rows * 11 cols
        expect(enemyManager.speed).toBe(1); // BASE_SPEED
      });

      it('should create formation with scaled speed in endless mode', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(1);
        enemyManager.createFormation();

        expect(enemyManager.enemies.length).toBe(55);
        expect(enemyManager.speed).toBe(1); // Wave 1: 1.0 multiplier
      });

      it('should apply speed scaling to formation in endless mode wave 10', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(10);
        enemyManager.createFormation();

        // Wave 10: BASE_SPEED * 1.45 = 1 * 1.45 = 1.45
        expect(enemyManager.speed).toBeCloseTo(1.45, 5);
      });

      it('should apply max speed cap in formation creation', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(100);
        enemyManager.createFormation();

        // Should be capped at BASE_SPEED * 3.0 = 3.0
        expect(enemyManager.speed).toBe(3.0);
      });
    });

    describe('speed scaling across various waves', () => {
      it('should have correct speed at wave 1', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(1);
        enemyManager.createFormation();

        const multiplier = enemyManager.getDifficultyMultiplier();
        expect(multiplier).toBe(1.0);
      });

      it('should have progressive speed increase from wave 1 to 10', () => {
        const speeds = [];
        enemyManager.setGameMode('endless');

        for (let wave = 1; wave <= 10; wave++) {
          enemyManager.setWave(wave);
          enemyManager.createFormation();
          speeds.push(enemyManager.getDifficultyMultiplier());
        }

        // Each wave should be greater than the previous
        for (let i = 1; i < speeds.length; i++) {
          expect(speeds[i]).toBeGreaterThan(speeds[i - 1]);
        }

        // Wave 1 should be exactly 1.0
        expect(speeds[0]).toBe(1.0);

        // Wave 10 should be 1.45
        expect(speeds[9]).toBeCloseTo(1.45, 5);
      });

      it('should have correct speed at wave 20', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(20);
        enemyManager.createFormation();

        // 1 + (20-1) * 0.05 = 1.95
        expect(enemyManager.getDifficultyMultiplier()).toBeCloseTo(1.95, 5);
      });

      it('should cap speed correctly and maintain cap across waves', () => {
        enemyManager.setGameMode('endless');

        // Calculate the wave where we hit the cap: (3.0 - 1) / 0.05 + 1 = 41
        const testWaves = [41, 50, 100, 500];

        for (const wave of testWaves) {
          enemyManager.setWave(wave);
          enemyManager.createFormation();
          expect(enemyManager.getDifficultyMultiplier()).toBe(3.0);
        }
      });
    });

    describe('difficulty multiplier returns correct values', () => {
      it('should return multiplier before formation creation', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(5);
        // getDifficultyMultiplier should return current multiplier even if formation not created
        expect(enemyManager.getDifficultyMultiplier()).toBe(1.0); // Default until createFormation is called
      });

      it('should return updated multiplier after formation creation', () => {
        enemyManager.setGameMode('endless');
        enemyManager.setWave(5);
        enemyManager.createFormation();
        expect(enemyManager.getDifficultyMultiplier()).toBeCloseTo(1.2, 5);
      });

      it('should return multiplier matching wave changes', () => {
        enemyManager.setGameMode('endless');

        enemyManager.setWave(5);
        enemyManager.createFormation();
        const mult5 = enemyManager.getDifficultyMultiplier();

        enemyManager.setWave(15);
        enemyManager.createFormation();
        const mult15 = enemyManager.getDifficultyMultiplier();

        expect(mult15).toBeGreaterThan(mult5);
      });
    });
  });

  describe('ScoreManager endless mode', () => {
    let scoreManager;

    beforeEach(() => {
      scoreManager = new ScoreManager();
    });

    describe('game mode management', () => {
      it('should start in classic mode', () => {
        expect(scoreManager.getGameMode()).toBe('classic');
      });

      it('should switch to endless mode correctly', () => {
        scoreManager.setGameMode('endless');
        expect(scoreManager.getGameMode()).toBe('endless');
      });

      it('should switch back to classic mode', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setGameMode('classic');
        expect(scoreManager.getGameMode()).toBe('classic');
      });

      it('should reload high scores when switching modes', () => {
        // Add a classic mode high score
        scoreManager.setGameMode('classic');
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('AAA');

        // Switch to endless mode - should have no high scores
        scoreManager.setGameMode('endless');
        expect(scoreManager.getHighScores().length).toBe(0);

        // Add endless mode high score
        scoreManager.addPoints(2000);
        scoreManager.addHighScore('BBB');

        // Switch back to classic - should have original score
        scoreManager.setGameMode('classic');
        expect(scoreManager.getHighScores().length).toBe(1);
        expect(scoreManager.getHighScores()[0].initials).toBe('AAA');

        // Switch back to endless - should have endless score
        scoreManager.setGameMode('endless');
        expect(scoreManager.getHighScores().length).toBe(1);
        expect(scoreManager.getHighScores()[0].initials).toBe('BBB');
      });
    });

    describe('wave tracking', () => {
      it('should start at wave 1', () => {
        expect(scoreManager.getWave()).toBe(1);
      });

      it('should set wave number correctly', () => {
        scoreManager.setWave(5);
        expect(scoreManager.getWave()).toBe(5);

        scoreManager.setWave(20);
        expect(scoreManager.getWave()).toBe(20);
      });

      it('should track wave in endless mode', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(15);
        expect(scoreManager.getWave()).toBe(15);
      });
    });

    describe('separate storage keys', () => {
      it('should use different storage keys for classic and endless modes', () => {
        const classicKey = 'retroArcadeHighScores';
        const endlessKey = 'retroArcadeEndlessHighScores';

        // Add classic score
        scoreManager.setGameMode('classic');
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('AAA');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          classicKey,
          expect.any(String)
        );

        // Add endless score
        scoreManager.setGameMode('endless');
        scoreManager.addPoints(2000);
        scoreManager.addHighScore('BBB');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          endlessKey,
          expect.any(String)
        );
      });

      it('should load from correct storage key based on mode', () => {
        // Setup classic mode scores
        const classicScores = JSON.stringify([
          { initials: 'AAA', score: 1000, level: 5, timestamp: Date.now() },
        ]);

        // Setup endless mode scores
        const endlessScores = JSON.stringify([
          { initials: 'BBB', score: 2000, wave: 10, timestamp: Date.now() },
        ]);

        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'retroArcadeHighScores') return classicScores;
          if (key === 'retroArcadeEndlessHighScores') return endlessScores;
          return null;
        });

        // Load classic scores
        const classicManager = new ScoreManager();
        classicManager.setGameMode('classic');
        expect(classicManager.getHighScores()[0].initials).toBe('AAA');

        // Load endless scores
        classicManager.setGameMode('endless');
        expect(classicManager.getHighScores()[0].initials).toBe('BBB');
      });
    });

    describe('high score entry with wave property', () => {
      it('should include wave property in endless mode high score entry', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(10);
        scoreManager.addPoints(1500);

        scoreManager.addHighScore('WAV');

        const scores = scoreManager.getHighScores();
        expect(scores[0].wave).toBe(10);
        expect(scores[0].score).toBe(1500);
        expect(scores[0].initials).toBe('WAV');
      });

      it('should include level property in classic mode, not wave', () => {
        scoreManager.setGameMode('classic');
        scoreManager.setLevel(5);
        scoreManager.addPoints(1500);

        scoreManager.addHighScore('LEV');

        const scores = scoreManager.getHighScores();
        expect(scores[0].level).toBe(5);
        expect(scores[0].wave).toBeUndefined();
        expect(scores[0].score).toBe(1500);
      });

      it('should store different properties for classic vs endless', () => {
        // Classic mode score
        scoreManager.setGameMode('classic');
        scoreManager.setLevel(3);
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('CLS');

        // Endless mode score
        scoreManager.setGameMode('endless');
        scoreManager.setWave(15);
        scoreManager.addPoints(2000);
        scoreManager.addHighScore('END');

        // Check classic
        scoreManager.setGameMode('classic');
        const classicScores = scoreManager.getHighScores();
        expect(classicScores[0].level).toBe(3);
        expect(classicScores[0].wave).toBeUndefined();

        // Check endless
        scoreManager.setGameMode('endless');
        const endlessScores = scoreManager.getHighScores();
        expect(endlessScores[0].wave).toBe(15);
        expect(endlessScores[0].level).toBeUndefined();
      });

      it('should handle multiple endless mode entries with different waves', () => {
        scoreManager.setGameMode('endless');

        // Add first endless score at wave 10
        scoreManager.setWave(10);
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('WV1');
        scoreManager.reset();

        // Add second endless score at wave 20
        scoreManager.setWave(20);
        scoreManager.addPoints(2000);
        scoreManager.addHighScore('WV2');
        scoreManager.reset();

        // Add third endless score at wave 15
        scoreManager.setWave(15);
        scoreManager.addPoints(1500);
        scoreManager.addHighScore('WV3');

        const scores = scoreManager.getHighScores();
        // Should be sorted by score (highest first)
        expect(scores[0].wave).toBe(20);
        expect(scores[1].wave).toBe(15);
        expect(scores[2].wave).toBe(10);
      });
    });

    describe('reset functionality in endless mode', () => {
      it('should reset wave to 1 on reset', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(25);
        scoreManager.addPoints(500);

        scoreManager.reset();

        expect(scoreManager.getWave()).toBe(1);
        expect(scoreManager.getScore()).toBe(0);
      });

      it('should reset all properties including wave and level', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(15);
        scoreManager.setLevel(5);
        scoreManager.addPoints(2000);

        scoreManager.reset();

        expect(scoreManager.getScore()).toBe(0);
        expect(scoreManager.getLevel()).toBe(1);
        expect(scoreManager.getWave()).toBe(1);
      });

      it('should keep high scores intact after reset', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(10);
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('TST');

        const highScoresBefore = scoreManager.getHighScores().length;

        scoreManager.setWave(5);
        scoreManager.addPoints(500);
        scoreManager.reset();

        const highScoresAfter = scoreManager.getHighScores().length;
        expect(highScoresAfter).toBe(highScoresBefore);
      });
    });

    describe('high score storage for endless mode', () => {
      it('should save endless mode high score with wave to correct storage', () => {
        scoreManager.setGameMode('endless');
        scoreManager.setWave(12);
        scoreManager.addPoints(1500);
        scoreManager.addHighScore('END');

        const stored = localStorageMock.store['retroArcadeEndlessHighScores'];
        expect(stored).toBeDefined();

        const scores = JSON.parse(stored);
        expect(scores[0].wave).toBe(12);
      });

      it('should not interfere with classic mode storage', () => {
        // Add classic score
        scoreManager.setGameMode('classic');
        scoreManager.setLevel(5);
        scoreManager.addPoints(1000);
        scoreManager.addHighScore('CLS');

        // Add endless score
        scoreManager.setGameMode('endless');
        scoreManager.setWave(10);
        scoreManager.addPoints(2000);
        scoreManager.addHighScore('END');

        // Verify both are stored separately
        const classicStored = localStorageMock.store['retroArcadeHighScores'];
        const endlessStored = localStorageMock.store['retroArcadeEndlessHighScores'];

        expect(classicStored).toBeDefined();
        expect(endlessStored).toBeDefined();

        const classicScores = JSON.parse(classicStored);
        const endlessScores = JSON.parse(endlessStored);

        expect(classicScores[0].initials).toBe('CLS');
        expect(endlessScores[0].initials).toBe('END');
      });
    });

    describe('endless mode integration scenarios', () => {
      it('should handle complete endless mode game session', () => {
        scoreManager.setGameMode('endless');

        // Simulate progressing through waves
        for (let wave = 1; wave <= 10; wave++) {
          scoreManager.setWave(wave);
          scoreManager.addPoints(100 * wave); // 100, 200, 300... per wave
        }

        // Final score should be 100+200+...+1000 = 5500
        expect(scoreManager.getScore()).toBe(5500);
        expect(scoreManager.getWave()).toBe(10);

        // Add as high score
        scoreManager.addHighScore('PRO');

        const scores = scoreManager.getHighScores();
        expect(scores[0].score).toBe(5500);
        expect(scores[0].wave).toBe(10);
      });

      it('should maintain separate leaderboards for classic and endless', () => {
        // Classic mode: 3 scores
        scoreManager.setGameMode('classic');
        for (let i = 1; i <= 3; i++) {
          scoreManager.reset();
          scoreManager.setLevel(i);
          scoreManager.addPoints(i * 500);
          scoreManager.addHighScore(`CLS${i}`);
        }

        // Endless mode: 2 scores
        scoreManager.setGameMode('endless');
        for (let i = 1; i <= 2; i++) {
          scoreManager.reset();
          scoreManager.setWave(i * 10);
          scoreManager.addPoints(i * 1000);
          scoreManager.addHighScore(`END${i}`);
        }

        // Verify classic has 3
        scoreManager.setGameMode('classic');
        expect(scoreManager.getHighScores().length).toBe(3);

        // Verify endless has 2
        scoreManager.setGameMode('endless');
        expect(scoreManager.getHighScores().length).toBe(2);
      });
    });
  });

  describe('Endless mode integration', () => {
    let enemyManager;
    let scoreManager;

    beforeEach(() => {
      enemyManager = new EnemyManager();
      scoreManager = new ScoreManager();
    });

    it('should synchronize game mode between managers', () => {
      enemyManager.setGameMode('endless');
      scoreManager.setGameMode('endless');

      expect(enemyManager.gameMode).toBe('endless');
      expect(scoreManager.getGameMode()).toBe('endless');
    });

    it('should synchronize wave between managers', () => {
      enemyManager.setGameMode('endless');
      scoreManager.setGameMode('endless');

      enemyManager.setWave(15);
      scoreManager.setWave(15);

      expect(enemyManager.wave).toBe(15);
      expect(scoreManager.getWave()).toBe(15);
    });

    it('should reset both managers together', () => {
      enemyManager.setGameMode('endless');
      scoreManager.setGameMode('endless');

      enemyManager.setWave(20);
      scoreManager.setWave(20);
      scoreManager.addPoints(1000);

      // Reset both
      enemyManager.setWave(1);
      scoreManager.reset();

      expect(enemyManager.wave).toBe(1);
      expect(scoreManager.getWave()).toBe(1);
      expect(scoreManager.getScore()).toBe(0);
    });

    it('should handle difficulty progression in endless mode', () => {
      enemyManager.setGameMode('endless');
      scoreManager.setGameMode('endless');

      const difficultyProgression = [];

      for (let wave = 1; wave <= 20; wave++) {
        enemyManager.setWave(wave);
        scoreManager.setWave(wave);
        enemyManager.createFormation();

        difficultyProgression.push(enemyManager.getDifficultyMultiplier());
      }

      // Verify monotonic increase (with cap at 3.0)
      for (let i = 1; i < difficultyProgression.length; i++) {
        expect(difficultyProgression[i]).toBeGreaterThanOrEqual(difficultyProgression[i - 1]);
      }

      // Verify cap is applied
      expect(difficultyProgression[difficultyProgression.length - 1]).toBeLessThanOrEqual(3.0);
    });
  });
});
