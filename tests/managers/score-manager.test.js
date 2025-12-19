import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScoreManager } from '../../src/managers/score-manager.js';

describe('ScoreManager', () => {
  let scoreManager;

  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
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
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
    vi.clearAllMocks();

    scoreManager = new ScoreManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic scoring', () => {
    it('should start with zero score', () => {
      expect(scoreManager.getScore()).toBe(0);
    });

    it('should add points correctly', () => {
      scoreManager.addPoints(100);
      expect(scoreManager.getScore()).toBe(100);

      scoreManager.addPoints(50);
      expect(scoreManager.getScore()).toBe(150);
    });

    it('should reset score for new game', () => {
      scoreManager.addPoints(500);
      scoreManager.setLevel(3);
      scoreManager.reset();

      expect(scoreManager.getScore()).toBe(0);
      expect(scoreManager.getLevel()).toBe(1);
    });
  });

  describe('level tracking', () => {
    it('should track level', () => {
      expect(scoreManager.getLevel()).toBe(1);
      scoreManager.setLevel(5);
      expect(scoreManager.getLevel()).toBe(5);
    });
  });

  describe('high score detection', () => {
    it('should detect first score as high score', () => {
      scoreManager.addPoints(100);
      expect(scoreManager.isHighScore()).toBe(true);
    });

    it('should detect zero score as not a high score', () => {
      expect(scoreManager.isHighScore()).toBe(false);
    });

    it('should calculate correct rank', () => {
      scoreManager.addPoints(100);
      expect(scoreManager.getScoreRank()).toBe(1);
    });

    it('should calculate rank among existing scores', () => {
      // Add some scores
      scoreManager.addPoints(100);
      scoreManager.addHighScore('AAA');
      scoreManager.reset();

      scoreManager.addPoints(200);
      scoreManager.addHighScore('BBB');
      scoreManager.reset();

      scoreManager.addPoints(150);
      expect(scoreManager.getScoreRank()).toBe(2); // Between 200 and 100
    });
  });

  describe('high score management', () => {
    it('should add high score entry', () => {
      scoreManager.addPoints(1000);
      scoreManager.setLevel(5);

      const rank = scoreManager.addHighScore('ACE');
      expect(rank).toBe(1);

      const scores = scoreManager.getHighScores();
      expect(scores.length).toBe(1);
      expect(scores[0].initials).toBe('ACE');
      expect(scores[0].score).toBe(1000);
      expect(scores[0].level).toBe(5);
    });

    it('should sort high scores correctly', () => {
      scoreManager.addPoints(100);
      scoreManager.addHighScore('LOW');
      scoreManager.reset();

      scoreManager.addPoints(300);
      scoreManager.addHighScore('HI');
      scoreManager.reset();

      scoreManager.addPoints(200);
      scoreManager.addHighScore('MID');

      const scores = scoreManager.getHighScores();
      expect(scores[0].initials).toBe('HI');
      expect(scores[1].initials).toBe('MID');
      expect(scores[2].initials).toBe('LOW');
    });

    it('should limit high scores to MAX_HIGH_SCORES', () => {
      for (let i = 0; i < 15; i++) {
        scoreManager.reset();
        scoreManager.addPoints((i + 1) * 100);
        scoreManager.addHighScore(`P${i.toString().padStart(2, '0')}`);
      }

      const scores = scoreManager.getHighScores();
      expect(scores.length).toBe(ScoreManager.MAX_HIGH_SCORES);
      expect(scores[0].score).toBe(1500); // Highest
      expect(scores[9].score).toBe(600); // 10th highest
    });

    it('should not add score below lowest when board is full', () => {
      // Fill up the board with scores 100-1000
      for (let i = 0; i < 10; i++) {
        scoreManager.reset();
        scoreManager.addPoints((i + 1) * 100);
        scoreManager.addHighScore(`P${i}`);
      }

      scoreManager.reset();
      scoreManager.addPoints(50); // Below lowest (100)

      expect(scoreManager.isHighScore()).toBe(false);
      expect(scoreManager.getScoreRank()).toBe(0);
      expect(scoreManager.addHighScore('LOW')).toBe(0);
    });

    it('should get top N high scores', () => {
      for (let i = 0; i < 8; i++) {
        scoreManager.reset();
        scoreManager.addPoints((i + 1) * 100);
        scoreManager.addHighScore(`P${i}`);
      }

      const top3 = scoreManager.getTopHighScores(3);
      expect(top3.length).toBe(3);
      expect(top3[0].score).toBe(800);
      expect(top3[2].score).toBe(600);
    });
  });

  describe('persistence', () => {
    it('should save high scores to localStorage', () => {
      scoreManager.addPoints(500);
      scoreManager.addHighScore('TST');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'retroArcadeHighScores',
        expect.any(String)
      );
    });

    it('should load high scores from localStorage', () => {
      const savedScores = JSON.stringify([
        { initials: 'AAA', score: 1000, level: 5, timestamp: Date.now() },
        { initials: 'BBB', score: 500, level: 3, timestamp: Date.now() },
      ]);
      localStorageMock.getItem.mockReturnValue(savedScores);

      const newManager = new ScoreManager();
      const scores = newManager.getHighScores();

      expect(scores.length).toBe(2);
      expect(scores[0].initials).toBe('AAA');
    });

    it('should migrate legacy high score format', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'retroArcadeHighScores') return null;
        if (key === 'retroArcadeHighScore') return '12345';
        return null;
      });

      const newManager = new ScoreManager();
      const scores = newManager.getHighScores();

      expect(scores.length).toBe(1);
      expect(scores[0].score).toBe(12345);
      expect(scores[0].initials).toBe('???');
    });

    it('should clear high scores', () => {
      scoreManager.addPoints(500);
      scoreManager.addHighScore('TST');

      scoreManager.clearHighScores();

      expect(scoreManager.getHighScores().length).toBe(0);
      expect(scoreManager.getHighScore()).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('retroArcadeHighScores');
    });
  });

  describe('formatScore', () => {
    it('should format score with leading zeros', () => {
      expect(scoreManager.formatScore(123)).toBe('000123');
      expect(scoreManager.formatScore(123, 8)).toBe('00000123');
      expect(scoreManager.formatScore(999999)).toBe('999999');
    });
  });
});
