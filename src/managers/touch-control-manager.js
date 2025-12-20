import { GAME, TOUCH_CONTROLS } from '../constants.js';

/**
 * Manages touch input for mobile gameplay
 * Handles virtual on-screen buttons and multi-touch tracking
 */
export class TouchControlManager {
  constructor() {
    // Device capability detection
    this.touchSupported = 'ontouchstart' in window;
    this.enabled = false;

    // Track all active touches
    this.activeTouches = new Map(); // touchId -> {x, y, identifier}

    // Button states (current frame)
    this.leftHeld = false;
    this.rightHeld = false;
    this.fireHeld = false;
    this.pauseHeld = false;

    // Just pressed tracking (set each frame, cleared at end of frame)
    this.leftJustPressed = false;
    this.rightJustPressed = false;
    this.fireJustPressed = false;
    this.pauseJustPressed = false;

    // Button position cache (updated on resize)
    this.buttonPositions = {
      LEFT: { x: 0, y: 0, radius: 0 },
      RIGHT: { x: 0, y: 0, radius: 0 },
      FIRE: { x: 0, y: 0, radius: 0 },
      PAUSE: { x: 0, y: 0, radius: 0 },
    };

    // Canvas dimensions
    this.canvasWidth = GAME.WIDTH;
    this.canvasHeight = GAME.HEIGHT;

    // Bind event handlers
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Start listening for touch events
   */
  start() {
    if (!this.touchSupported || this.enabled) return;

    this.enabled = true;

    // Touch event listeners
    document.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    });
    document.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: false,
    });

    // Window resize listener
    window.addEventListener('resize', this.handleResize);

    // Initial button position calculation
    this.calculateButtonPositions();
  }

  /**
   * Stop listening for touch events
   */
  stop() {
    if (!this.enabled) return;

    this.enabled = false;

    // Remove event listeners
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchCancel);

    window.removeEventListener('resize', this.handleResize);

    // Clear all state
    this.activeTouches.clear();
    this.clearButtonStates();
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} event
   */
  handleTouchStart(event) {
    if (!this.enabled) return;

    // Prevent browser default behaviors (scrolling, zooming)
    event.preventDefault();

    const touches = event.touches;

    // Track each new touch
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const { x, y } = this.getTouchCoordinates(touch);

      // Store the touch
      this.activeTouches.set(touch.identifier, { x, y, identifier: touch.identifier });

      // Check which button was pressed
      this.checkButtonPress(x, y);
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} event
   */
  handleTouchMove(event) {
    if (!this.enabled) return;

    // Prevent browser default behaviors
    event.preventDefault();

    const touches = event.touches;

    // Update touch positions
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const { x, y } = this.getTouchCoordinates(touch);

      // Update stored touch position
      if (this.activeTouches.has(touch.identifier)) {
        this.activeTouches.set(touch.identifier, { x, y, identifier: touch.identifier });
      }

      // Re-check which buttons are under this touch
      this.updateButtonStates(x, y);
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} event
   */
  handleTouchEnd(event) {
    if (!this.enabled) return;

    // Prevent browser default behaviors
    event.preventDefault();

    const changedTouches = event.changedTouches;

    // Remove ended touches and check for button releases
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    // Recalculate button states based on remaining touches
    this.recalculateButtonStates();
  }

  /**
   * Handle touch cancel event
   * @param {TouchEvent} event
   */
  handleTouchCancel(event) {
    if (!this.enabled) return;

    event.preventDefault();

    // Cancel all touches
    const changedTouches = event.changedTouches;
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    // Reset button states
    this.recalculateButtonStates();
  }

  /**
   * Handle window resize event
   */
  handleResize() {
    this.calculateButtonPositions();
  }

  /**
   * Get touch coordinates relative to canvas
   * @param {Touch} touch
   * @returns {{x: number, y: number}}
   */
  getTouchCoordinates(touch) {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
      return { x: touch.clientX, y: touch.clientY };
    }

    const rect = gameCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    return { x, y };
  }

  /**
   * Calculate button positions based on canvas size
   */
  calculateButtonPositions() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      this.canvasWidth = canvas.width || GAME.WIDTH;
      this.canvasHeight = canvas.height || GAME.HEIGHT;
    }

    const { DPAD, FIRE, PAUSE, BUTTON_SIZE, HIT_PADDING } = TOUCH_CONTROLS;
    const padding = BUTTON_SIZE / 2 + HIT_PADDING;

    // LEFT button (bottom-left area)
    this.buttonPositions.LEFT = {
      x: DPAD.LEFT_OFFSET + BUTTON_SIZE / 2,
      y: this.canvasHeight - DPAD.BOTTOM_OFFSET - BUTTON_SIZE / 2,
      radius: BUTTON_SIZE / 2 + HIT_PADDING,
    };

    // RIGHT button (bottom-left area, to the right of LEFT)
    this.buttonPositions.RIGHT = {
      x: DPAD.LEFT_OFFSET + BUTTON_SIZE + DPAD.BUTTON_GAP + BUTTON_SIZE / 2,
      y: this.canvasHeight - DPAD.BOTTOM_OFFSET - BUTTON_SIZE / 2,
      radius: BUTTON_SIZE / 2 + HIT_PADDING,
    };

    // FIRE button (bottom-right area)
    this.buttonPositions.FIRE = {
      x: this.canvasWidth - FIRE.RIGHT_OFFSET - FIRE.SIZE / 2,
      y: this.canvasHeight - FIRE.BOTTOM_OFFSET - FIRE.SIZE / 2,
      radius: FIRE.SIZE / 2 + HIT_PADDING,
    };

    // PAUSE button (top-right area)
    this.buttonPositions.PAUSE = {
      x: this.canvasWidth - PAUSE.RIGHT_OFFSET - PAUSE.SIZE / 2,
      y: PAUSE.TOP_OFFSET + PAUSE.SIZE / 2,
      radius: PAUSE.SIZE / 2 + HIT_PADDING,
    };
  }

  /**
   * Check if a touch point hits a button and update state
   * @param {number} x
   * @param {number} y
   */
  checkButtonPress(x, y) {
    // Check LEFT button
    if (this.isPointInButton(x, y, this.buttonPositions.LEFT)) {
      if (!this.leftHeld) {
        this.leftJustPressed = true;
        this.vibrate();
      }
      this.leftHeld = true;
    }

    // Check RIGHT button
    if (this.isPointInButton(x, y, this.buttonPositions.RIGHT)) {
      if (!this.rightHeld) {
        this.rightJustPressed = true;
        this.vibrate();
      }
      this.rightHeld = true;
    }

    // Check FIRE button
    if (this.isPointInButton(x, y, this.buttonPositions.FIRE)) {
      if (!this.fireHeld) {
        this.fireJustPressed = true;
        this.vibrate();
      }
      this.fireHeld = true;
    }

    // Check PAUSE button
    if (this.isPointInButton(x, y, this.buttonPositions.PAUSE)) {
      if (!this.pauseHeld) {
        this.pauseJustPressed = true;
        this.vibrate();
      }
      this.pauseHeld = true;
    }
  }

  /**
   * Update button states based on current touch position
   * Called during touchmove to handle multi-touch scenarios
   * @param {number} x
   * @param {number} y
   */
  updateButtonStates(x, y) {
    // This is called for each moving touch
    // We update states but don't set "justPressed" again
    // since that's only for initial touch

    if (this.isPointInButton(x, y, this.buttonPositions.LEFT)) {
      this.leftHeld = true;
    }
    if (this.isPointInButton(x, y, this.buttonPositions.RIGHT)) {
      this.rightHeld = true;
    }
    if (this.isPointInButton(x, y, this.buttonPositions.FIRE)) {
      this.fireHeld = true;
    }
    if (this.isPointInButton(x, y, this.buttonPositions.PAUSE)) {
      this.pauseHeld = true;
    }
  }

  /**
   * Recalculate button states based on all active touches
   * Called when touches end to properly release buttons
   */
  recalculateButtonStates() {
    // Reset all states
    this.leftHeld = false;
    this.rightHeld = false;
    this.fireHeld = false;
    this.pauseHeld = false;

    // Check all remaining active touches
    for (const touch of this.activeTouches.values()) {
      this.updateButtonStates(touch.x, touch.y);
    }
  }

  /**
   * Check if a point is within a circular button hit area
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number, radius: number}} button
   * @returns {boolean}
   */
  isPointInButton(x, y, button) {
    const dx = x - button.x;
    const dy = y - button.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= button.radius;
  }

  /**
   * Trigger haptic feedback (vibration) if available
   */
  vibrate() {
    if (!TOUCH_CONTROLS.HAPTIC.ENABLED) return;

    if (navigator.vibrate) {
      navigator.vibrate(TOUCH_CONTROLS.HAPTIC.PRESS_DURATION);
    }
  }

  /**
   * Clear all button states
   */
  clearButtonStates() {
    this.leftHeld = false;
    this.rightHeld = false;
    this.fireHeld = false;
    this.pauseHeld = false;
  }

  /**
   * Clear just-pressed flags (call at end of frame)
   */
  clearJustPressed() {
    this.leftJustPressed = false;
    this.rightJustPressed = false;
    this.fireJustPressed = false;
    this.pauseJustPressed = false;
  }

  /**
   * Check if LEFT button is held
   * @returns {boolean}
   */
  isLeftHeld() {
    return this.leftHeld;
  }

  /**
   * Check if RIGHT button is held
   * @returns {boolean}
   */
  isRightHeld() {
    return this.rightHeld;
  }

  /**
   * Check if FIRE button is held
   * @returns {boolean}
   */
  isFireHeld() {
    return this.fireHeld;
  }

  /**
   * Check if FIRE button was just pressed
   * @returns {boolean}
   */
  isFireJustPressed() {
    return this.fireJustPressed;
  }

  /**
   * Check if PAUSE button was just pressed
   * @returns {boolean}
   */
  isPauseJustPressed() {
    return this.pauseJustPressed;
  }

  /**
   * Get button positions for rendering
   * @returns {Object} Button position data
   */
  getButtonPositions() {
    return { ...this.buttonPositions };
  }

  /**
   * Get button states for rendering
   * @returns {Object} Current button states
   */
  getButtonStates() {
    return {
      left: this.leftHeld,
      right: this.rightHeld,
      fire: this.fireHeld,
      pause: this.pauseHeld,
    };
  }

  /**
   * Update canvas dimensions (call when canvas resizes)
   * @param {number} width
   * @param {number} height
   */
  setCanvasDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.calculateButtonPositions();
  }

  /**
   * Check if touch is supported on this device
   * @returns {boolean}
   */
  isTouchSupported() {
    return this.touchSupported;
  }

  /**
   * Check if touch controls are currently enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}
