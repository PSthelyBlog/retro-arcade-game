import { NAME_ENTRY } from '../constants.js';

/**
 * Manages classic arcade-style name entry for high scores
 * Supports 3-character initials with up/down character selection
 */
export class NameEntryManager {
  constructor() {
    this.initials = [
      NAME_ENTRY.DEFAULT_CHAR,
      NAME_ENTRY.DEFAULT_CHAR,
      NAME_ENTRY.DEFAULT_CHAR,
    ];
    this.currentPosition = 0;
    this.confirmed = false;
    this.confirmTimer = 0;

    // Character selection
    this.allowedChars = NAME_ENTRY.ALLOWED_CHARS;
  }

  /**
   * Reset for new name entry session
   */
  reset() {
    this.initials = [
      NAME_ENTRY.DEFAULT_CHAR,
      NAME_ENTRY.DEFAULT_CHAR,
      NAME_ENTRY.DEFAULT_CHAR,
    ];
    this.currentPosition = 0;
    this.confirmed = false;
    this.confirmTimer = 0;
  }

  /**
   * Get the current character index in the allowed characters string
   * @param {number} position - Position in initials array
   * @returns {number} Index in allowedChars
   */
  getCharIndex(position) {
    return this.allowedChars.indexOf(this.initials[position]);
  }

  /**
   * Move to the next character (up)
   */
  nextChar() {
    if (this.confirmed) return;

    const currentIndex = this.getCharIndex(this.currentPosition);
    const nextIndex = (currentIndex + 1) % this.allowedChars.length;
    this.initials[this.currentPosition] = this.allowedChars[nextIndex];
  }

  /**
   * Move to the previous character (down)
   */
  prevChar() {
    if (this.confirmed) return;

    const currentIndex = this.getCharIndex(this.currentPosition);
    const prevIndex =
      (currentIndex - 1 + this.allowedChars.length) % this.allowedChars.length;
    this.initials[this.currentPosition] = this.allowedChars[prevIndex];
  }

  /**
   * Move cursor to the next position (right)
   * @returns {boolean} True if moved, false if at end
   */
  nextPosition() {
    if (this.confirmed) return false;

    if (this.currentPosition < NAME_ENTRY.MAX_INITIALS - 1) {
      this.currentPosition++;
      return true;
    }
    return false;
  }

  /**
   * Move cursor to the previous position (left)
   * @returns {boolean} True if moved, false if at start
   */
  prevPosition() {
    if (this.confirmed) return false;

    if (this.currentPosition > 0) {
      this.currentPosition--;
      return true;
    }
    return false;
  }

  /**
   * Confirm current position and move to next, or finish if at end
   * @returns {boolean} True if name entry is complete
   */
  confirm() {
    if (this.confirmed) return true;

    if (this.currentPosition < NAME_ENTRY.MAX_INITIALS - 1) {
      this.currentPosition++;
      return false;
    } else {
      this.confirmed = true;
      return true;
    }
  }

  /**
   * Update timer for confirmation delay
   * @param {number} deltaTime
   * @returns {boolean} True if confirmation delay is complete
   */
  update(deltaTime) {
    if (this.confirmed) {
      this.confirmTimer += deltaTime;
      return this.confirmTimer >= NAME_ENTRY.CONFIRM_DELAY;
    }
    return false;
  }

  /**
   * Check if name entry is fully confirmed
   * @returns {boolean}
   */
  isConfirmed() {
    return this.confirmed;
  }

  /**
   * Check if confirmation delay is complete
   * @returns {boolean}
   */
  isDelayComplete() {
    return this.confirmed && this.confirmTimer >= NAME_ENTRY.CONFIRM_DELAY;
  }

  /**
   * Get the entered initials as a string
   * @returns {string} 3-character initials
   */
  getInitials() {
    return this.initials.join('');
  }

  /**
   * Get current cursor position
   * @returns {number}
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Get individual character at position
   * @param {number} position
   * @returns {string}
   */
  getCharAt(position) {
    return this.initials[position];
  }

  /**
   * Set character directly (for keyboard input)
   * @param {string} char - Single character
   * @returns {boolean} True if character was valid and set
   */
  setChar(char) {
    if (this.confirmed) return false;

    const upperChar = char.toUpperCase();
    if (this.allowedChars.includes(upperChar)) {
      this.initials[this.currentPosition] = upperChar;
      return true;
    }
    return false;
  }

  /**
   * Handle direct character input and auto-advance
   * @param {string} char - Single character
   * @returns {boolean} True if name entry is complete
   */
  inputChar(char) {
    if (this.setChar(char)) {
      return this.confirm();
    }
    return false;
  }
}
