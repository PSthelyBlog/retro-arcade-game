import {
  Keys,
  GamepadButtons,
  GamepadAxes,
  ControllerConfig,
} from '../constants.js';

/**
 * Handles keyboard and gamepad input
 * Supports multiple controllers and provides unified input interface
 */
export class InputHandler {
  constructor() {
    // Keyboard state
    this.keys = new Set();
    this.justPressed = new Set();

    // Gamepad state
    this.gamepads = new Map(); // Connected gamepads
    this.gamepadButtons = new Map(); // Current button states per gamepad
    this.gamepadButtonsPrev = new Map(); // Previous frame button states
    this.activeGamepadIndex = null; // Currently active gamepad
    this.controllerConnected = false;
    this.controllerName = '';

    this.enabled = true;

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
  }

  /**
   * Start listening for input
   */
  start() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Gamepad events
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisconnected
    );

    // Check for already connected gamepads (Firefox requires this)
    this.pollGamepads();
  }

  /**
   * Stop listening for input
   */
  stop() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisconnected
    );
  }

  // ======================
  // KEYBOARD HANDLERS
  // ======================

  /**
   * Handle key down event
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    // Prevent default for game keys
    if (this.isGameKey(e.code)) {
      e.preventDefault();
    }

    if (!this.keys.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.keys.add(e.code);
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} e
   */
  handleKeyUp(e) {
    this.keys.delete(e.code);
  }

  /**
   * Check if a key is currently held
   * @param {string[]} keyCodes - Array of key codes to check
   * @returns {boolean} True if any key is held
   */
  isKeyHeld(keyCodes) {
    return keyCodes.some((code) => this.keys.has(code));
  }

  /**
   * Check if a key was just pressed this frame
   * @param {string[]} keyCodes - Array of key codes to check
   * @returns {boolean} True if any key was just pressed
   */
  isKeyJustPressed(keyCodes) {
    return keyCodes.some((code) => this.justPressed.has(code));
  }

  /**
   * Check if code is a game key
   * @param {string} code - Key code
   * @returns {boolean}
   */
  isGameKey(code) {
    return (
      Keys.LEFT.includes(code) ||
      Keys.RIGHT.includes(code) ||
      Keys.FIRE.includes(code) ||
      Keys.PAUSE.includes(code)
    );
  }

  // ======================
  // GAMEPAD HANDLERS
  // ======================

  /**
   * Handle gamepad connection
   * @param {GamepadEvent} e
   */
  handleGamepadConnected(e) {
    const gamepad = e.gamepad;
    console.log(
      `🎮 Controller connected: ${gamepad.id} (index: ${gamepad.index})`
    );

    this.gamepads.set(gamepad.index, gamepad);
    this.gamepadButtons.set(gamepad.index, new Array(17).fill(false));
    this.gamepadButtonsPrev.set(gamepad.index, new Array(17).fill(false));

    // Set as active gamepad if none is active
    if (this.activeGamepadIndex === null) {
      this.activeGamepadIndex = gamepad.index;
      this.controllerConnected = true;
      this.controllerName = this.getControllerName(gamepad.id);
    }
  }

  /**
   * Handle gamepad disconnection
   * @param {GamepadEvent} e
   */
  handleGamepadDisconnected(e) {
    const gamepad = e.gamepad;
    console.log(
      `🎮 Controller disconnected: ${gamepad.id} (index: ${gamepad.index})`
    );

    this.gamepads.delete(gamepad.index);
    this.gamepadButtons.delete(gamepad.index);
    this.gamepadButtonsPrev.delete(gamepad.index);

    // Find new active gamepad
    if (this.activeGamepadIndex === gamepad.index) {
      const remaining = Array.from(this.gamepads.keys());
      if (remaining.length > 0) {
        this.activeGamepadIndex = remaining[0];
        const newGamepad = this.gamepads.get(this.activeGamepadIndex);
        this.controllerName = this.getControllerName(newGamepad.id);
      } else {
        this.activeGamepadIndex = null;
        this.controllerConnected = false;
        this.controllerName = '';
      }
    }
  }

  /**
   * Get user-friendly controller name
   * @param {string} id - Gamepad ID string
   * @returns {string} Friendly name
   */
  getControllerName(id) {
    const idLower = id.toLowerCase();

    if (idLower.includes('xbox')) return 'Xbox Controller';
    if (idLower.includes('playstation') || idLower.includes('dualshock'))
      return 'PlayStation Controller';
    if (idLower.includes('dualsense')) return 'DualSense';
    if (idLower.includes('switch') || idLower.includes('pro controller'))
      return 'Nintendo Switch Pro';
    if (idLower.includes('joy-con')) return 'Joy-Con';
    if (idLower.includes('8bitdo')) return '8BitDo Controller';

    // Extract vendor name if possible
    const match = id.match(/^([^(]+)/);
    if (match) {
      return match[1].trim().slice(0, 20);
    }

    return 'Controller';
  }

  /**
   * Poll gamepad state (call every frame)
   */
  pollGamepads() {
    if (!this.enabled) return;

    // Get fresh gamepad state
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    for (const gamepad of gamepads) {
      if (!gamepad) continue;

      // Store previous state
      const prevButtons = this.gamepadButtons.get(gamepad.index);
      if (prevButtons) {
        this.gamepadButtonsPrev.set(gamepad.index, [...prevButtons]);
      }

      // Update current state
      const currentButtons = [];
      for (let i = 0; i < gamepad.buttons.length; i++) {
        currentButtons[i] = gamepad.buttons[i].pressed;
      }
      this.gamepadButtons.set(gamepad.index, currentButtons);

      // Update gamepad reference
      this.gamepads.set(gamepad.index, gamepad);

      // Update connected state
      if (this.activeGamepadIndex === null && currentButtons.some((b) => b)) {
        this.activeGamepadIndex = gamepad.index;
        this.controllerConnected = true;
        this.controllerName = this.getControllerName(gamepad.id);
      }
    }
  }

  /**
   * Check if a gamepad button is held
   * @param {number} buttonIndex - Button index
   * @param {number} [gamepadIndex] - Specific gamepad or active
   * @returns {boolean}
   */
  isGamepadButtonHeld(buttonIndex, gamepadIndex = this.activeGamepadIndex) {
    if (gamepadIndex === null) return false;
    const buttons = this.gamepadButtons.get(gamepadIndex);
    return buttons ? buttons[buttonIndex] === true : false;
  }

  /**
   * Check if a gamepad button was just pressed
   * @param {number} buttonIndex - Button index
   * @param {number} [gamepadIndex] - Specific gamepad or active
   * @returns {boolean}
   */
  isGamepadButtonJustPressed(
    buttonIndex,
    gamepadIndex = this.activeGamepadIndex
  ) {
    if (gamepadIndex === null) return false;
    const current = this.gamepadButtons.get(gamepadIndex);
    const prev = this.gamepadButtonsPrev.get(gamepadIndex);
    if (!current || !prev) return false;
    return current[buttonIndex] === true && prev[buttonIndex] === false;
  }

  /**
   * Get analog stick axis value with deadzone
   * @param {number} axisIndex - Axis index
   * @param {number} [gamepadIndex] - Specific gamepad or active
   * @returns {number} Value between -1 and 1
   */
  getAxis(axisIndex, gamepadIndex = this.activeGamepadIndex) {
    if (gamepadIndex === null) return 0;
    const gamepad = this.gamepads.get(gamepadIndex);
    if (!gamepad || !gamepad.axes[axisIndex]) return 0;

    const value = gamepad.axes[axisIndex];

    // Apply deadzone
    if (Math.abs(value) < ControllerConfig.DEADZONE) {
      return 0;
    }

    // Normalize value accounting for deadzone
    const sign = value > 0 ? 1 : -1;
    return (
      sign *
      ((Math.abs(value) - ControllerConfig.DEADZONE) /
        (1 - ControllerConfig.DEADZONE))
    );
  }

  /**
   * Get horizontal movement from left stick
   * @returns {number} -1 (left) to 1 (right)
   */
  getHorizontalAxis() {
    return this.getAxis(GamepadAxes.LEFT_STICK_X);
  }

  /**
   * Trigger haptic feedback (vibration)
   * @param {number} [intensity=0.3] - Vibration intensity (0-1)
   * @param {number} [duration=100] - Duration in ms
   */
  vibrate(
    intensity = ControllerConfig.VIBRATION_INTENSITY,
    duration = ControllerConfig.VIBRATION_DURATION
  ) {
    if (this.activeGamepadIndex === null) return;

    const gamepad = this.gamepads.get(this.activeGamepadIndex);
    if (!gamepad) return;

    // Check for vibration actuator (Chrome)
    if (gamepad.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity,
        strongMagnitude: intensity,
      });
    }

    // Check for hapticActuators (older API)
    if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
      gamepad.hapticActuators[0].pulse(intensity, duration);
    }
  }

  // ======================
  // UNIFIED INPUT (Keyboard + Gamepad)
  // ======================

  /**
   * Clear just pressed state (call at end of frame)
   */
  clearJustPressed() {
    this.justPressed.clear();
  }

  /**
   * Enable/disable input
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.justPressed.clear();
    }
  }

  /**
   * Check if left movement is held (keyboard or gamepad)
   * @returns {boolean}
   */
  isLeftHeld() {
    // Keyboard
    if (this.isKeyHeld(Keys.LEFT)) return true;

    // Gamepad D-Pad
    if (this.isGamepadButtonHeld(GamepadButtons.DPAD_LEFT)) return true;

    // Gamepad Left Stick
    if (this.getHorizontalAxis() < -0.5) return true;

    return false;
  }

  /**
   * Check if right movement is held (keyboard or gamepad)
   * @returns {boolean}
   */
  isRightHeld() {
    // Keyboard
    if (this.isKeyHeld(Keys.RIGHT)) return true;

    // Gamepad D-Pad
    if (this.isGamepadButtonHeld(GamepadButtons.DPAD_RIGHT)) return true;

    // Gamepad Left Stick
    if (this.getHorizontalAxis() > 0.5) return true;

    return false;
  }

  /**
   * Check if fire was just pressed (keyboard or gamepad)
   * @returns {boolean}
   */
  isFireJustPressed() {
    // Keyboard
    if (this.isKeyJustPressed(Keys.FIRE)) return true;

    // Gamepad - A button or Right Trigger
    if (this.isGamepadButtonJustPressed(GamepadButtons.A)) return true;
    if (this.isGamepadButtonJustPressed(GamepadButtons.RT)) return true;
    if (this.isGamepadButtonJustPressed(GamepadButtons.RB)) return true;

    return false;
  }

  /**
   * Check if fire is held (keyboard or gamepad)
   * @returns {boolean}
   */
  isFireHeld() {
    // Keyboard
    if (this.isKeyHeld(Keys.FIRE)) return true;

    // Gamepad - A button or Right Trigger
    if (this.isGamepadButtonHeld(GamepadButtons.A)) return true;
    if (this.isGamepadButtonHeld(GamepadButtons.RT)) return true;
    if (this.isGamepadButtonHeld(GamepadButtons.RB)) return true;

    return false;
  }

  /**
   * Check if pause was just pressed (keyboard or gamepad)
   * @returns {boolean}
   */
  isPauseJustPressed() {
    // Keyboard
    if (this.isKeyJustPressed(Keys.PAUSE)) return true;

    // Gamepad - Start button
    if (this.isGamepadButtonJustPressed(GamepadButtons.START)) return true;

    return false;
  }

  /**
   * Check if restart was just pressed (keyboard or gamepad)
   * @returns {boolean}
   */
  isRestartJustPressed() {
    // Keyboard
    if (this.isKeyJustPressed(Keys.RESTART)) return true;

    // Gamepad - Select button
    if (this.isGamepadButtonJustPressed(GamepadButtons.SELECT)) return true;

    return false;
  }

  /**
   * Check if mute was just pressed (keyboard or gamepad)
   * @returns {boolean}
   */
  isMuteJustPressed() {
    // Keyboard
    if (this.isKeyJustPressed(Keys.MUTE)) return true;

    // Gamepad - Y button
    if (this.isGamepadButtonJustPressed(GamepadButtons.Y)) return true;

    return false;
  }

  // Legacy support - keep isHeld working for keyboard
  isHeld(keyCodes) {
    return this.isKeyHeld(keyCodes);
  }

  isJustPressed(keyCodes) {
    return this.isKeyJustPressed(keyCodes);
  }

  /**
   * Get controller status for display
   * @returns {Object} Controller status info
   */
  getControllerStatus() {
    return {
      connected: this.controllerConnected,
      name: this.controllerName,
      count: this.gamepads.size,
    };
  }
}
