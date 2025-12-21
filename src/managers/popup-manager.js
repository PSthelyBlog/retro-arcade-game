import { COMBO } from '../constants.js';

/**
 * PopupManager
 * Manages temporary on-screen text popups like "3x COMBO!" and "COMBO BROKEN!"
 * Popups rise upward, fade out over time, and are automatically removed when expired
 */
export class PopupManager {
  /**
   * Initialize empty popups array
   */
  constructor() {
    this.popups = [];
  }

  /**
   * Add a new popup to the display
   * @param {string} text - The text to display
   * @param {number} x - X position of the popup
   * @param {number} y - Y position of the popup
   * @param {string} color - Color of the text (hex string)
   * @param {number} duration - How long the popup stays visible in ms (default: COMBO.POPUP.DURATION)
   * @param {number} fontSize - Size of the text (default: COMBO.POPUP.FONT_SIZE)
   */
  add(
    text,
    x,
    y,
    color,
    duration = COMBO.POPUP.DURATION,
    fontSize = COMBO.POPUP.FONT_SIZE
  ) {
    const popup = {
      text,
      x,
      y,
      color,
      createdAt: Date.now(),
      duration,
      fontSize,
      opacity: 1.0,
      velocityY: -COMBO.POPUP.RISE_SPEED,
    };

    this.popups.push(popup);
  }

  /**
   * Add a combo popup with formatted text like "3x COMBO!"
   * Displays the combo count and multiplier
   * @param {number} comboCount - The current combo count
   * @param {number} x - X position of the popup
   * @param {number} y - Y position of the popup
   */
  addComboPopup(comboCount, x, y) {
    const text = `${comboCount}x COMBO!`;
    this.add(
      text,
      x,
      y,
      COMBO.POPUP.COLOR,
      COMBO.POPUP.DURATION,
      COMBO.POPUP.FONT_SIZE
    );
  }

  /**
   * Add a combo broken popup if the previous combo was >= 2
   * Displays red "COMBO BROKEN" text
   * @param {number} previousCount - The combo count before it was broken
   * @param {number} x - X position of the popup
   * @param {number} y - Y position of the popup
   */
  addComboBrokenPopup(previousCount, x, y) {
    // Only show combo broken if there was a meaningful combo
    if (previousCount >= 2) {
      this.add(
        'COMBO BROKEN',
        x,
        y,
        COMBO.POPUP.BROKEN_COLOR,
        COMBO.POPUP.DURATION,
        COMBO.POPUP.FONT_SIZE
      );
    }
  }

  /**
   * Update all popups (rise upward, fade out, remove expired)
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    // Update each popup
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const popup = this.popups[i];
      const elapsedTime = Date.now() - popup.createdAt;
      const progress = elapsedTime / popup.duration;

      // Update vertical position (rise upward)
      popup.y += popup.velocityY;

      // Calculate opacity (fade out after FADE_START of duration)
      if (progress >= COMBO.POPUP.FADE_START) {
        const fadeProgress =
          (progress - COMBO.POPUP.FADE_START) /
          (1 - COMBO.POPUP.FADE_START);
        popup.opacity = Math.max(0, 1.0 - fadeProgress);
      } else {
        popup.opacity = 1.0;
      }

      // Remove popup if duration has elapsed
      if (elapsedTime >= popup.duration) {
        this.popups.splice(i, 1);
      }
    }
  }

  /**
   * Get array of active popups for rendering
   * @returns {Array} Array of popup objects
   */
  getPopups() {
    return this.popups;
  }

  /**
   * Remove all popups
   */
  clear() {
    this.popups = [];
  }

  /**
   * Alias for clear() - remove all popups
   */
  reset() {
    this.clear();
  }
}
