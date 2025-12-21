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
  DROP_DISTANCE: 8,
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

/**
 * Power-up configuration
 * Power-ups drop from enemies and provide temporary/permanent bonuses
 */
export const POWERUPS = {
  FALL_SPEED: 1.5,           // Pixels per frame
  SIZE: 24,                   // Power-up size in pixels
  DROP_CHANCE: 0.15,          // 15% chance to drop on enemy kill
  EXPIRE_TIME: 10000,         // Time before uncollected power-up disappears (ms)
  PULSE_SPEED: 0.1,           // Animation pulse speed

  TYPES: {
    SHIELD: {
      name: 'SHIELD',
      color: '#00FFFF',        // Cyan
      dropWeight: 5,           // 5% relative weight
      duration: Infinity,      // Permanent until hit
      description: 'Absorbs one hit',
    },
    RAPID_FIRE: {
      name: 'RAPID_FIRE',
      color: '#FF6600',        // Orange
      dropWeight: 10,          // 10% relative weight
      duration: 10000,         // 10 seconds
      fireRateMultiplier: 0.5, // 50% reduction in fire cooldown
      description: 'Faster shooting',
    },
    MULTI_SHOT: {
      name: 'MULTI_SHOT',
      color: '#FF00FF',        // Magenta
      dropWeight: 8,           // 8% relative weight
      duration: 8000,          // 8 seconds
      projectileCount: 3,      // Number of projectiles
      spreadAngle: 15,         // Degrees between projectiles
      description: 'Triple spread shot',
    },
    BOMB: {
      name: 'BOMB',
      color: '#FFFF00',        // Yellow
      dropWeight: 2,           // 2% relative weight
      duration: 0,             // Instant effect
      description: 'Clear all enemies',
    },
    EXTRA_LIFE: {
      name: 'EXTRA_LIFE',
      color: '#00FF00',        // Green
      dropWeight: 1,           // 1% relative weight
      duration: 0,             // Instant effect
      description: '+1 Life',
    },
  },
};

/**
 * Combo system configuration
 * Tracks consecutive enemy kills and applies multipliers to score
 */
export const COMBO = {
  TIMEOUT: 1500,         // ms before combo resets
  GRACE_PERIOD: 200,     // ms added per kill
  MAX_MULTIPLIER: 3.0,   // Cap at 3x
  MULTIPLIERS: {
    2: 1.5,
    3: 2.0,
    4: 2.5,
    5: 3.0,  // 5+ stays at 3.0
  },
  POPUP: {
    DURATION: 1000,      // How long popup shows
    RISE_SPEED: 1.5,     // Pixels per frame
    FADE_START: 0.7,     // Start fading at 70% through duration
    FONT_SIZE: 24,
    COLOR: '#FFFF00',    // Yellow for combo messages
    BROKEN_COLOR: '#FF4444', // Red for "COMBO BROKEN"
  },
  EFFECTS: {
    SCREEN_SHAKE: false,  // Shake on 5x combo?
    COLOR_FLASH: true,    // Flash combo counter color
  },
  SOUNDS: {
    COMBO_2: true,        // Play sound at 2x combo
    COMBO_3: true,        // Play sound at 3x combo
    COMBO_5: true,        // Play sound at 5x combo
    BROKEN: true,         // Play sound when combo breaks
  },
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

/**
 * Touch control configuration for mobile devices
 * Virtual on-screen buttons for touch screens
 */
export const TOUCH_CONTROLS = {
  ENABLED: true,                    // Enable touch controls
  BUTTON_SIZE: 80,                  // Base button size in pixels
  BUTTON_OPACITY: 0.6,              // Default opacity
  BUTTON_ACTIVE_OPACITY: 0.9,       // Opacity when pressed
  BUTTON_MARGIN: 20,                // Margin from screen edges

  // Colors
  BUTTON_COLOR: '#FFFFFF',          // Button outline/fill color
  BUTTON_ACTIVE_COLOR: '#00FF00',   // Color when pressed

  // Left side directional controls
  DPAD: {
    LEFT_OFFSET: 100,               // X offset from left edge
    BOTTOM_OFFSET: 100,             // Y offset from bottom edge
    BUTTON_GAP: 10,                 // Gap between left/right buttons
  },

  // Right side fire button
  FIRE: {
    RIGHT_OFFSET: 100,              // X offset from right edge
    BOTTOM_OFFSET: 100,             // Y offset from bottom edge
    SIZE: 100,                      // Fire button is larger
    HOLD_TO_AUTOFIRE: true,         // Enable hold-to-autofire
  },

  // Top right pause button
  PAUSE: {
    TOP_OFFSET: 20,
    RIGHT_OFFSET: 20,
    SIZE: 50,
  },

  // Haptic feedback
  HAPTIC: {
    ENABLED: true,
    PRESS_DURATION: 10,             // Light tap on button press (ms)
    FIRE_DURATION: 5,               // Very light for firing
  },

  // Hit detection
  HIT_PADDING: 20,                  // Extra padding around buttons for easier tapping
};

/**
 * Music configuration for chiptune background music
 * All music synthesized via Web Audio API - no external files needed
 */
export const MUSIC = {
  // Global music settings
  MASTER_VOLUME: 0.15,         // Music is quieter than SFX
  FADE_DURATION: 500,          // Crossfade duration in ms

  // Note timing
  BPM: {
    TITLE: 100,                // Mysterious, inviting
    BATTLE: 140,               // Intense, driving
    BOSS: 160,                 // Urgent, dramatic
    GAME_OVER: 80,             // Somber
    VICTORY: 120,              // Triumphant
  },

  // Track durations (in measures of 4/4)
  MEASURES: {
    TITLE: 8,                  // 8 measures loop
    BATTLE: 8,                 // 8 measures loop
    BOSS: 4,                   // 4 measures loop (more intense)
    GAME_OVER: 2,              // One-shot, ~5 seconds
    VICTORY: 1,                // One-shot, ~3 seconds
  },

  // Oscillator types for authentic 8-bit sound
  VOICES: {
    LEAD: 'square',            // Classic chiptune lead
    BASS: 'triangle',          // Deep bass (NES style)
    HARMONY: 'square',         // Supporting melody
    NOISE: 'noise',            // Percussion/hi-hats
  },

  // Musical scales (frequencies in Hz)
  NOTES: {
    // Octave 3
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    // Octave 3 sharp/flat notes
    Cs3: 138.59, Ds3: 155.56, Fs3: 185.00, Gs3: 207.65, As3: 233.08,
    // Octave 4
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    // Octave 4 sharp/flat notes
    Cs4: 277.18, Ds4: 311.13, Fs4: 369.99, Gs4: 415.30, As4: 466.16,
    // Octave 5
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    // Octave 5 sharp/flat notes
    Cs5: 554.37, Ds5: 622.25, Fs5: 739.99, Gs5: 830.61, As5: 932.33,
    // Octave 6
    C6: 1046.50,
    // Rest (silence)
    REST: 0,
  },

  // Boss wave threshold for switching to boss theme
  BOSS_WAVE_THRESHOLD: 10,

  // NES 2A03 pulse width modulation (duty cycle options)
  PULSE_WIDTH: {
    THIN: 0.125,      // 12.5% - thin, nasal, buzzy
    NARROW: 0.25,     // 25% - slightly hollow
    SQUARE: 0.5,      // 50% - pure square wave
    WIDE: 0.75,       // 75% - same as 25% (symmetric)
  },

  // Fast arpeggiator settings for chord effects
  ARPEGGIO: {
    SPEED: 0.05,           // 50ms per step (very fast)
    PATTERNS: {
      MAJOR: [0, 4, 7],    // Major chord intervals (semitones)
      MINOR: [0, 3, 7],    // Minor chord
      SUS4: [0, 5, 7],     // Suspended 4th
      POWER: [0, 7, 12],   // Power chord (octave)
      OCTAVE: [0, 12],     // Octave jump
      SIXTH: [0, 4, 7, 9], // Major 6th
    },
  },

  // LFO pitch modulation for vibrato effects
  VIBRATO: {
    RATE: 6,        // Hz - LFO speed
    DEPTH: 15,      // Cents (100 cents = 1 semitone)
    DELAY: 0.1,     // Seconds before vibrato kicks in
  },

  // Pulse Width Modulation for dynamic timbre
  PWM: {
    RATE: 2,        // Hz - modulation speed
    DEPTH: 0.2,     // How much to vary duty cycle (0-0.5)
  },

  // ADSR envelope presets for different instrument sounds
  ENVELOPE: {
    LEAD: { attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.1 },
    BASS: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    STACCATO: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.01 },
    PAD: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 },
  },

  // Dynamic tempo scaling based on game difficulty/wave
  DYNAMIC_TEMPO: {
    ENABLED: true,
    BASE_MULTIPLIER: 1.0,
    WAVE_SCALING: 0.02,    // +2% per wave
    MAX_MULTIPLIER: 1.5,   // Cap at 150% speed
  },

  // Common game music chord progressions (semitone intervals from root)
  CHORD_PROGRESSIONS: {
    VICTORY: [[0, 'major'], [5, 'major'], [7, 'major']], // I - IV - V
    INTENSE: [[0, 'minor'], [5, 'minor'], [7, 'major']], // i - iv - V
    MYSTERIOUS: [[0, 'minor'], [3, 'major'], [5, 'minor']], // i - III - iv
  },
};

