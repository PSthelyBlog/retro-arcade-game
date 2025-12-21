import { COMBO } from '../constants.js';

/**
 * Combo state object returned from registerKill
 * @typedef {Object} ComboState
 * @property {number} comboCount - Current combo count
 * @property {number} multiplier - Current score multiplier
 * @property {boolean} isNewCombo - True if this kill started a new combo
 * @property {boolean} isMilestone - True if this count is a milestone
 */

/**
 * Combo update result
 * @typedef {Object} ComboUpdateResult
 * @property {boolean} comboBroken - True if combo expired
 * @property {number} previousCount - The combo count before update (0 if not broken)
 */

/**
 * Manages the combo system for consecutive enemy kills
 * Tracks combo count, multipliers, and milestones for scoring
 */
export class ComboManager {
  /**
   * Initialize combo manager state
   */
  constructor() {
    this.count = 0;
    this.multiplier = 1.0;
    this.lastKillTime = null;
    this.maxCombo = 0;
    this._isActive = false;
    this.accumulatedGrace = 0;
  }

  /**
   * Register an enemy kill and update combo state
   * @param {number} timestamp - Current timestamp (ms) from performance.now()
   * @returns {ComboState} Updated combo state
   */
  registerKill(timestamp) {
    let isNewCombo = false;

    // Check if combo should continue or reset
    if (this.lastKillTime === null) {
      // First kill
      this.count = 1;
      isNewCombo = true;
      this.accumulatedGrace = 0;
    } else {
      const timeSinceLastKill = timestamp - this.lastKillTime;
      const comboTimeout = COMBO.TIMEOUT + this.accumulatedGrace;

      if (timeSinceLastKill < comboTimeout) {
        // Continue combo
        this.count += 1;
      } else {
        // Combo expired, start new
        this.count = 1;
        isNewCombo = true;
        this.accumulatedGrace = 0;
      }
    }

    // Update last kill time
    this.lastKillTime = timestamp;

    // Add grace period for next kill
    if(this.accumulatedGrace <= 1000)
      this.accumulatedGrace += COMBO.GRACE_PERIOD;

    // Update multiplier
    this.multiplier = this.calculateMultiplier();

    // Update active state
    this._isActive = this.count >= 2;

    // Track max combo
    if (this.count > this.maxCombo) {
      this.maxCombo = this.count;
    }

    // Check if this is a milestone
    const isMilestone = this.isMilestoneCount(this.count);

    return {
      comboCount: this.count,
      multiplier: this.multiplier,
      isNewCombo,
      isMilestone,
    };
  }

  /**
   * Update combo state, checking if it has expired
   * @param {number} timestamp - Current timestamp (ms) from performance.now()
   * @returns {ComboUpdateResult} Result indicating if combo was broken
   */
  update(timestamp) {
    const previousCount = this.count;
    let comboBroken = false;

    // Check if combo has expired
    if (this.lastKillTime !== null && this.count > 0) {
      const timeSinceLastKill = timestamp - this.lastKillTime;
      const comboTimeout = COMBO.TIMEOUT + this.accumulatedGrace;

      if (timeSinceLastKill >= comboTimeout) {
        // Combo expired
        this.count = 0;
        this.multiplier = 1.0;
        this._isActive = false;
        this.accumulatedGrace = 0;
        comboBroken = previousCount > 0;
      }
    }

    return {
      comboBroken,
      previousCount: comboBroken ? previousCount : 0,
    };
  }

  /**
   * Calculate the multiplier based on current combo count
   * @returns {number} Current score multiplier (min 1.0, max COMBO.MAX_MULTIPLIER)
   */
  calculateMultiplier() {
    if (this.count < 2) {
      return 1.0;
    }

    // Check for exact multiplier values
    if (COMBO.MULTIPLIERS[this.count]) {
      return COMBO.MULTIPLIERS[this.count];
    }

    // For counts beyond the defined multipliers, use max
    return COMBO.MULTIPLIERS[5] || COMBO.MAX_MULTIPLIER;
  }

  /**
   * Check if a combo count is a milestone (2, 3, 5, 10, 15, 20, etc.)
   * @param {number} count
   * @returns {boolean}
   */
  isMilestoneCount(count) {
    if (count < 2) return false;

    // Milestones: 2, 3, 5, 10, 15, 20, 25, 30, ...
    if (count === 2 || count === 3 || count === 5) {
      return true;
    }

    // Every 5 kills after 5
    if (count >= 10 && count % 5 === 0) {
      return true;
    }

    return false;
  }

  /**
   * Get the current multiplier value
   * @returns {number}
   */
  getMultiplier() {
    return this.multiplier;
  }

  /**
   * Get the current combo count
   * @returns {number}
   */
  getCount() {
    return this.count;
  }

  /**
   * Get the maximum combo achieved in this game session
   * @returns {number}
   */
  getMaxCombo() {
    return this.maxCombo;
  }

  /**
   * Check if combo is currently active (count >= 2)
   * @returns {boolean}
   */
  isActive() {
    return this._isActive;
  }

  /**
   * Reset combo system for new game
   */
  reset() {
    this.count = 0;
    this.multiplier = 1.0;
    this.lastKillTime = null;
    this.maxCombo = 0;
    this._isActive = false;
    this.accumulatedGrace = 0;
  }
}
