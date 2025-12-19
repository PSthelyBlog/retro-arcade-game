import { SCORE } from '../constants.js';

/**
 * High score entry structure
 * @typedef {Object} HighScoreEntry
 * @property {string} initials - 3-character player initials
 * @property {number} score - Player's score
 * @property {number} level - Level reached
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

    // Load high scores (array of entries) and legacy high score
    this.highScores = this.loadHighScores();
    this.highScore = this.getTopScore();
  }

  /**
   * Load high scores from localStorage
   * @returns {HighScoreEntry[]}
   */
  loadHighScores() {
    try {
      const saved = localStorage.getItem('retroArcadeHighScores');
      if (saved) {
        const scores = JSON.parse(saved);
        if (Array.isArray(scores)) {
          return scores;
        }
      }

      // Check for legacy single high score and migrate
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
      localStorage.setItem('retroArcadeHighScores', JSON.stringify(this.highScores));
      // Also save legacy format for backwards compatibility
      if (this.highScores.length > 0) {
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
      level: this.level,
      timestamp: Date.now(),
    };

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
    this.extraLivesAwarded = 0;
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
    } catch (e) {
      // localStorage not available
    }
  }
}
