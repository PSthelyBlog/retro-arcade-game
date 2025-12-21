import { SCORE } from '../constants.js';

/**
 * High score entry structure
 * @typedef {Object} HighScoreEntry
 * @property {string} initials - 3-character player initials
 * @property {number} score - Player's score
 * @property {number} level - Level reached (classic mode)
 * @property {number} wave - Wave reached (endless mode)
 * @property {number} timestamp - Date recorded (ms since epoch)
 */

/**
 * Manages score, high scores with initials, and leaderboard
 */
export class ScoreManager {
  /**
   * Maximum number of high scores to keep
   */
  static MAX_HIGH_SCORES = 10;

  constructor() {
    this.score = 0;
    this.level = 1;
    this.extraLivesAwarded = 0;
    this.gameMode = 'classic';
    this.wave = 1;
    this.maxCombo = 0;

    // Load high scores (array of entries) and legacy high score
    this.highScores = this.loadHighScores();
    this.highScore = this.getTopScore();
  }

  /**
   * Get the storage key based on current game mode
   * @returns {string}
   */
  getStorageKey() {
    return this.gameMode === 'endless' ? 'retroArcadeEndlessHighScores' : 'retroArcadeHighScores';
  }

  /**
   * Load high scores from localStorage
   * @returns {HighScoreEntry[]}
   */
  loadHighScores() {
    try {
      const storageKey = this.getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const scores = JSON.parse(saved);
        if (Array.isArray(scores)) {
          return scores;
        }
      }

      // For classic mode, check for legacy single high score and migrate
      if (this.gameMode === 'classic') {
        const legacyScore = localStorage.getItem('retroArcadeHighScore');
        if (legacyScore) {
          const score = parseInt(legacyScore, 10);
          if (score > 0) {
            return [{
              initials: '???',
              score,
              level: 1,
              timestamp: Date.now(),
            }];
          }
        }
      }

      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save high scores to localStorage
   */
  saveHighScores() {
    try {
      const storageKey = this.getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(this.highScores));
      // Also save legacy format for backwards compatibility (classic mode only)
      if (this.gameMode === 'classic' && this.highScores.length > 0) {
        localStorage.setItem('retroArcadeHighScore', this.highScores[0].score.toString());
      }
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Get the top score value
   * @returns {number}
   */
  getTopScore() {
    return this.highScores.length > 0 ? this.highScores[0].score : 0;
  }

  /**
   * Load high score from localStorage (legacy support)
   * @returns {number}
   */
  loadHighScore() {
    return this.getTopScore();
  }

  /**
   * Save high score to localStorage (legacy support)
   */
  saveHighScore() {
    this.saveHighScores();
  }

  /**
   * Add points to score
   * @param {number} points
   * @returns {boolean} True if extra life earned
   */
  addPoints(points) {
    this.score += points;

    // Update high score display (but don't save until name entered)
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Check for extra life
    const livesThreshold = Math.floor(this.score / SCORE.EXTRA_LIFE_THRESHOLD);
    if (livesThreshold > this.extraLivesAwarded) {
      this.extraLivesAwarded = livesThreshold;
      return true;
    }

    return false;
  }

  /**
   * Get current score
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Get high score
   * @returns {number}
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * Set current level (for tracking in high scores)
   * @param {number} level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Get current level
   * @returns {number}
   */
  getLevel() {
    return this.level;
  }

  /**
   * Set game mode and reload high scores
   * @param {string} mode - 'classic' or 'endless'
   */
  setGameMode(mode) {
    if (this.gameMode !== mode) {
      this.gameMode = mode;
      // Reload high scores for the new mode
      this.highScores = this.loadHighScores();
      this.highScore = this.getTopScore();
    }
  }

  /**
   * Get current game mode
   * @returns {string}
   */
  getGameMode() {
    return this.gameMode;
  }

  /**
   * Set current wave for endless mode
   * @param {number} wave
   */
  setWave(wave) {
    this.wave = wave;
  }

  /**
   * Get current wave
   * @returns {number}
   */
  getWave() {
    return this.wave;
  }

  /**
   * Update maximum combo if the new value is higher
   * @param {number} combo
   */
  setMaxCombo(combo) {
    if (combo > this.maxCombo) {
      this.maxCombo = combo;
    }
  }

  /**
   * Get maximum combo achieved
   * @returns {number}
   */
  getMaxCombo() {
    return this.maxCombo;
  }

  /**
   * Check if current score qualifies for high score board
   * @returns {boolean}
   */
  isHighScore() {
    if (this.score === 0) return false;

    // If we have less than MAX scores, any score qualifies
    if (this.highScores.length < ScoreManager.MAX_HIGH_SCORES) {
      return true;
    }

    // Otherwise, must beat the lowest score
    const lowestScore = this.highScores[this.highScores.length - 1].score;
    return this.score > lowestScore;
  }

  /**
   * Get the rank this score would be (1-based)
   * @returns {number} Rank (1 = top score), or 0 if not on board
   */
  getScoreRank() {
    if (!this.isHighScore()) return 0;

    for (let i = 0; i < this.highScores.length; i++) {
      if (this.score > this.highScores[i].score) {
        return i + 1;
      }
    }
    return this.highScores.length + 1;
  }

  /**
   * Add a high score entry with initials
   * @param {string} initials - 3-character player initials
   * @returns {number} The rank achieved (1-based), or 0 if not added
   */
  addHighScore(initials) {
    if (!this.isHighScore()) return 0;

    const entry = {
      initials: initials.toUpperCase().substring(0, 3),
      score: this.score,
      maxCombo: this.maxCombo,
      timestamp: Date.now(),
    };

    // Include level for classic mode, wave for endless mode
    if (this.gameMode === 'endless') {
      entry.wave = this.wave;
    } else {
      entry.level = this.level;
    }

    // Find insertion point
    let insertIndex = this.highScores.length;
    for (let i = 0; i < this.highScores.length; i++) {
      if (this.score > this.highScores[i].score) {
        insertIndex = i;
        break;
      }
    }

    // Insert and trim to max
    this.highScores.splice(insertIndex, 0, entry);
    if (this.highScores.length > ScoreManager.MAX_HIGH_SCORES) {
      this.highScores.pop();
    }

    // Save to localStorage
    this.saveHighScores();

    return insertIndex + 1;
  }

  /**
   * Get all high scores
   * @returns {HighScoreEntry[]}
   */
  getHighScores() {
    return [...this.highScores];
  }

  /**
   * Get high scores for display (top N)
   * @param {number} count - Number of scores to return
   * @returns {HighScoreEntry[]}
   */
  getTopHighScores(count = 5) {
    return this.highScores.slice(0, count);
  }

  /**
   * Reset score for new game
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.wave = 1;
    this.extraLivesAwarded = 0;
    this.maxCombo = 0;
  }

  /**
   * Format score with leading zeros
   * @param {number} num
   * @param {number} digits
   * @returns {string}
   */
  formatScore(num, digits = 6) {
    return String(num).padStart(digits, '0');
  }

  /**
   * Clear all high scores (for testing/reset)
   */
  clearHighScores() {
    this.highScores = [];
    this.highScore = 0;
    try {
      localStorage.removeItem('retroArcadeHighScores');
      localStorage.removeItem('retroArcadeHighScore');
      localStorage.removeItem('retroArcadeEndlessHighScores');
    } catch (e) {
      // localStorage not available
    }
  }
}
