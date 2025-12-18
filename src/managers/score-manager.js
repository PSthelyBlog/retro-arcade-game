import { SCORE } from '../constants.js';

/**
 * Manages score and high score
 */
export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.extraLivesAwarded = 0;
  }

  /**
   * Load high score from localStorage
   * @returns {number}
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem('retroArcadeHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    try {
      localStorage.setItem('retroArcadeHighScore', this.highScore.toString());
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Add points to score
   * @param {number} points
   * @returns {boolean} True if extra life earned
   */
  addPoints(points) {
    this.score += points;

    // Check for new high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
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
   * Reset score for new game
   */
  reset() {
    this.score = 0;
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
}
