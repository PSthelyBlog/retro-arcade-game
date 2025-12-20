import { PowerUp } from '../entities/power-up.js';
import { POWERUPS } from '../constants.js';

/**
 * Manages power-up spawning, collection, and active effects
 */
export class PowerUpManager {
  constructor() {
    this.powerUps = [];        // Active power-ups on screen
    this.activeEffects = {};   // Currently active power-up effects {type: {endTime, ...data}}
    this.shieldActive = false; // Special flag for shield (permanent until hit)
  }

  /**
   * Reset all power-ups and effects
   */
  reset() {
    this.powerUps = [];
    this.activeEffects = {};
    this.shieldActive = false;
  }

  /**
   * Attempt to spawn a power-up at position (based on drop chance)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {boolean} True if power-up was spawned
   */
  trySpawn(x, y) {
    if (Math.random() > POWERUPS.DROP_CHANCE) {
      return false;
    }

    const type = this.getRandomType();
    this.spawn(x, y, type);
    return true;
  }

  /**
   * Force spawn a power-up of specific type
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Power-up type key
   */
  spawn(x, y, type) {
    const powerUp = new PowerUp(x, y, type);
    this.powerUps.push(powerUp);
  }

  /**
   * Get random power-up type based on weighted probability
   * @returns {string} Power-up type key
   */
  getRandomType() {
    const types = POWERUPS.TYPES;
    const totalWeight = Object.values(types).reduce((sum, t) => sum + t.dropWeight, 0);
    let random = Math.random() * totalWeight;

    for (const [key, config] of Object.entries(types)) {
      random -= config.dropWeight;
      if (random <= 0) {
        return key;
      }
    }

    // Fallback
    return Object.keys(types)[0];
  }

  /**
   * Get all active power-ups
   * @returns {PowerUp[]}
   */
  getActivePowerUps() {
    return this.powerUps.filter(p => p.active);
  }

  /**
   * Update all power-ups and effects
   * @param {number} deltaTime - Time since last update
   * @param {number} currentTime - Current game time
   */
  update(deltaTime, currentTime) {
    // Update power-ups on screen
    for (const powerUp of this.powerUps) {
      if (powerUp.active) {
        powerUp.update(deltaTime);
      }
    }

    // Remove inactive power-ups
    this.powerUps = this.powerUps.filter(p => p.active);

    // Update timed effects
    for (const [type, effect] of Object.entries(this.activeEffects)) {
      if (effect.endTime !== Infinity && currentTime >= effect.endTime) {
        delete this.activeEffects[type];
      }
    }
  }

  /**
   * Activate a power-up effect
   * @param {string} type - Power-up type
   * @param {number} currentTime - Current game time
   * @returns {Object} Effect data for game to process
   */
  activateEffect(type, currentTime) {
    const config = POWERUPS.TYPES[type];
    const result = { type, instant: false, data: {} };

    switch (type) {
      case 'SHIELD':
        this.shieldActive = true;
        result.data.shieldActive = true;
        break;

      case 'RAPID_FIRE':
        this.activeEffects.RAPID_FIRE = {
          endTime: currentTime + config.duration,
          multiplier: config.fireRateMultiplier,
        };
        result.data.fireRateMultiplier = config.fireRateMultiplier;
        break;

      case 'MULTI_SHOT':
        this.activeEffects.MULTI_SHOT = {
          endTime: currentTime + config.duration,
          projectileCount: config.projectileCount,
          spreadAngle: config.spreadAngle,
        };
        result.data.projectileCount = config.projectileCount;
        result.data.spreadAngle = config.spreadAngle;
        break;

      case 'BOMB':
        result.instant = true;
        result.data.clearEnemies = true;
        break;

      case 'EXTRA_LIFE':
        result.instant = true;
        result.data.extraLife = true;
        break;
    }

    return result;
  }

  /**
   * Consume shield (when player is hit)
   * @returns {boolean} True if shield was active and consumed
   */
  consumeShield() {
    if (this.shieldActive) {
      this.shieldActive = false;
      return true;
    }
    return false;
  }

  /**
   * Check if shield is active
   * @returns {boolean}
   */
  hasShield() {
    return this.shieldActive;
  }

  /**
   * Get current fire rate multiplier
   * @returns {number} Multiplier (1.0 = normal, 0.5 = faster)
   */
  getFireRateMultiplier() {
    const effect = this.activeEffects.RAPID_FIRE;
    return effect ? effect.multiplier : 1.0;
  }

  /**
   * Check if multi-shot is active
   * @returns {boolean}
   */
  hasMultiShot() {
    return !!this.activeEffects.MULTI_SHOT;
  }

  /**
   * Get multi-shot configuration
   * @returns {Object|null} {projectileCount, spreadAngle} or null
   */
  getMultiShotConfig() {
    return this.activeEffects.MULTI_SHOT || null;
  }

  /**
   * Get all active effects with remaining time
   * @param {number} currentTime - Current game time
   * @returns {Object[]} Array of {type, remainingTime, color}
   */
  getActiveEffectsStatus(currentTime) {
    const status = [];

    if (this.shieldActive) {
      status.push({
        type: 'SHIELD',
        remainingTime: Infinity,
        color: POWERUPS.TYPES.SHIELD.color,
      });
    }

    for (const [type, effect] of Object.entries(this.activeEffects)) {
      const remaining = effect.endTime === Infinity ? Infinity : effect.endTime - currentTime;
      if (remaining > 0) {
        status.push({
          type,
          remainingTime: remaining,
          color: POWERUPS.TYPES[type].color,
        });
      }
    }

    return status;
  }

  /**
   * Clear all power-ups (for level transitions)
   */
  clearPowerUps() {
    this.powerUps = [];
  }

  /**
   * Draw all power-ups
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const powerUp of this.getActivePowerUps()) {
      powerUp.draw(ctx);
    }
  }
}
