/**
 * Game constants for Retro Arcade Game
 * All magic numbers centralized here for easy balancing
 */

export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  FPS: 60,
  TICK_RATE: 1000 / 60, // ~16.67ms per tick
  BACKGROUND_COLOR: '#000000',
};

export const PLAYER = {
  WIDTH: 40,
  HEIGHT: 30,
  SPEED: 5,
  LIVES: 3,
  FIRE_RATE: 500, // ms between shots
  COLOR: '#00FF00',
  START_Y: 550,
};

export const ENEMY = {
  WIDTH: 30,
  HEIGHT: 24,
  ROWS: 5,
  COLS: 11,
  HORIZONTAL_SPACING: 50,
  VERTICAL_SPACING: 40,
  BASE_SPEED: 1,
  SPEED_INCREMENT: 0.1, // Speed increase per enemy killed
  DROP_DISTANCE: 20,
  FIRE_CHANCE: 0.001, // Per enemy per frame
  START_X: 100,
  START_Y: 80,
  COLORS: ['#FF0000', '#FF6600', '#FFFF00', '#00FFFF', '#FF00FF'],
};

export const PROJECTILE = {
  WIDTH: 4,
  HEIGHT: 12,
  PLAYER_SPEED: 8,
  ENEMY_SPEED: 4,
  PLAYER_COLOR: '#00FF00',
  ENEMY_COLOR: '#FF0000',
};

export const BUNKER = {
  WIDTH: 80,
  HEIGHT: 50,
  COUNT: 4,
  COLOR: '#00FF00',
  PIXEL_SIZE: 5,
};

export const MYSTERY_SHIP = {
  WIDTH: 50,
  HEIGHT: 20,
  SPEED: 3,
  MIN_INTERVAL: 20000, // ms
  MAX_INTERVAL: 30000, // ms
  SCORES: [50, 100, 150, 200, 250, 300],
  COLOR: '#FF0000',
};

export const SCORE = {
  ENEMY_POINTS: [10, 10, 20, 20, 30], // Points per row (bottom to top)
  EXTRA_LIFE_THRESHOLD: 10000,
};

/**
 * Endless mode configuration for progressive difficulty
 * Difficulty increases per wave with exponential scaling
 */
export const ENDLESS_MODE = {
  SPEED_INCREASE_PER_WAVE: 0.05,        // 5% speed increase per wave
  FIRE_RATE_INCREASE_PER_WAVE: 0.03,    // 3% fire rate increase per wave
  MAX_SPEED_MULTIPLIER: 3.0,            // Cap at 3x speed
  MAX_FIRE_RATE_MULTIPLIER: 2.5,        // Cap at 2.5x fire rate
  MYSTERY_SHIP_INTERVAL_DECREASE: 0.05, // 5% shorter intervals per wave
  MIN_MYSTERY_SHIP_INTERVAL: 8000,      // Minimum 8 seconds between mystery ships
  DANGER_WAVE_THRESHOLD: 15,            // Show danger indicator after wave 15
};

export const UI = {
  FONT_SIZE: 20,
  FONT_FAMILY: '"Press Start 2P", monospace',
  TEXT_COLOR: '#FFFFFF',
  SCORE_X: 20,
  SCORE_Y: 30,
  LIVES_X: 600,
  LIVES_Y: 30,
  LEVEL_X: 350,
  LEVEL_Y: 30,
};

export const GameState = {
  MENU: 'menu',
  MODE_SELECT: 'modeselect',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  LEVEL_COMPLETE: 'levelcomplete',
  NAME_ENTRY: 'nameentry',
};

/**
 * Game mode selection
 */
export const GameMode = {
  CLASSIC: 'classic',
  ENDLESS: 'endless',
};

/**
 * Name entry configuration for high score
 */
export const NAME_ENTRY = {
  MAX_INITIALS: 3,               // Classic arcade: 3 characters
  ALLOWED_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
  DEFAULT_CHAR: 'A',
  BLINK_RATE: 300,               // Cursor blink rate in ms
  CONFIRM_DELAY: 500,            // Delay after confirming name
};

/**
 * Starfield parallax scrolling configuration
 * Defines layered star fields for depth effect in background
 */
export const STARFIELD = {
  LAYERS: [
    { count: 50, size: 1, speed: 0.2, color: '#444444' },  // Far (dim, slow)
    { count: 40, size: 2, speed: 0.5, color: '#888888' },  // Mid (medium)
    { count: 30, size: 3, speed: 1.0, color: '#FFFFFF' },  // Near (bright, fast)
  ],
  BASE_SPEED: 50, // pixels per second at speed 1.0
};

export const Keys = {
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  UP: ['ArrowUp', 'KeyW'],
  DOWN: ['ArrowDown', 'KeyS'],
  FIRE: ['Space'],
  PAUSE: ['KeyP'],
  RESTART: ['KeyR'],
  MUTE: ['KeyM'],
  CONFIRM: ['Enter'],
};

/**
 * Gamepad button mappings (Standard Gamepad Layout)
 * @see https://w3c.github.io/gamepad/#remapping
 */
export const GamepadButtons = {
  // Face buttons
  A: 0,           // Fire (Xbox A, PS Cross)
  B: 1,           // Fire alt (Xbox B, PS Circle)
  X: 2,           // (Xbox X, PS Square)
  Y: 3,           // (Xbox Y, PS Triangle)

  // Shoulder buttons
  LB: 4,          // Left bumper
  RB: 5,          // Right bumper
  LT: 6,          // Left trigger
  RT: 7,          // Right trigger (Fire alt)

  // Center buttons
  SELECT: 8,      // Select/Back/Share
  START: 9,       // Start/Options (Pause)

  // Stick buttons
  L3: 10,         // Left stick click
  R3: 11,         // Right stick click

  // D-Pad
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,  // Move left
  DPAD_RIGHT: 15, // Move right
};

/**
 * Gamepad axis mappings
 */
export const GamepadAxes = {
  LEFT_STICK_X: 0,   // Left/Right movement
  LEFT_STICK_Y: 1,
  RIGHT_STICK_X: 2,
  RIGHT_STICK_Y: 3,
};

/**
 * Controller settings
 */
export const ControllerConfig = {
  DEADZONE: 0.25,           // Analog stick deadzone
  TRIGGER_THRESHOLD: 0.5,   // Trigger activation threshold
  VIBRATION_DURATION: 100,  // Haptic feedback duration (ms)
  VIBRATION_INTENSITY: 0.3, // Haptic feedback intensity (0-1)
};

