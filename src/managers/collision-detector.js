import { rectsOverlap } from '../utils/helpers.js';

/**
 * Handles collision detection between entities
 */
export class CollisionDetector {
  /**
   * Check collision between two entities using AABB
   * @param {Object} a - First entity with getBounds()
   * @param {Object} b - Second entity with getBounds()
   * @returns {boolean} True if colliding
   */
  static checkCollision(a, b) {
    const boundsA = a.getBounds ? a.getBounds() : a;
    const boundsB = b.getBounds ? b.getBounds() : b;
    return rectsOverlap(boundsA, boundsB);
  }

  /**
   * Check player projectiles against enemies
   * @param {Projectile[]} projectiles
   * @param {Enemy[]} enemies
   * @returns {Object[]} Collision pairs [{projectile, enemy}]
   */
  static checkPlayerProjectilesVsEnemies(projectiles, enemies) {
    const collisions = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        if (this.checkCollision(projectile, enemy)) {
          collisions.push({ projectile, enemy });
          break; // Each projectile can only hit one enemy
        }
      }
    }

    return collisions;
  }

  /**
   * Check player projectiles against mystery ship
   * @param {Projectile[]} projectiles
   * @param {MysteryShip} mysteryShip
   * @returns {Object|null} Collision {projectile, mysteryShip} or null
   */
  static checkPlayerProjectilesVsMysteryShip(projectiles, mysteryShip) {
    if (!mysteryShip || !mysteryShip.active) return null;

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      if (this.checkCollision(projectile, mysteryShip)) {
        return { projectile, mysteryShip };
      }
    }

    return null;
  }

  /**
   * Check enemy projectiles against player
   * @param {Projectile[]} projectiles
   * @param {Player} player
   * @returns {Projectile|null} Projectile that hit player
   */
  static checkEnemyProjectilesVsPlayer(projectiles, player) {
    if (!player.active || player.invulnerable) return null;

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      if (this.checkCollision(projectile, player)) {
        return projectile;
      }
    }

    return null;
  }

  /**
   * Check projectiles against bunkers
   * @param {Projectile[]} projectiles
   * @param {Bunker[]} bunkers
   * @returns {Object[]} Collisions [{projectile, bunker}]
   */
  static checkProjectilesVsBunkers(projectiles, bunkers) {
    const collisions = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      const center = projectile.getCenter();

      for (const bunker of bunkers) {
        if (bunker.hitTest(center.x, center.y, 2)) {
          collisions.push({ projectile, bunker });
          break;
        }
      }
    }

    return collisions;
  }

  /**
   * Check enemies against bunkers (for enemy descent damage)
   * @param {Enemy[]} enemies
   * @param {Bunker[]} bunkers
   * @returns {Object[]} Collisions [{enemy, bunker}]
   */
  static checkEnemiesVsBunkers(enemies, bunkers) {
    const collisions = [];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      for (const bunker of bunkers) {
        if (this.checkCollision(enemy, bunker)) {
          collisions.push({ enemy, bunker });
        }
      }
    }

    return collisions;
  }

  /**
   * Check enemies against player (game over condition)
   * @param {Enemy[]} enemies
   * @param {Player} player
   * @returns {boolean} True if any enemy touches player
   */
  static checkEnemiesVsPlayer(enemies, player) {
    if (!player.active) return false;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (this.checkCollision(enemy, player)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check power-ups against player (for collection)
   * @param {PowerUp[]} powerUps - Active power-ups
   * @param {Player} player - Player object
   * @returns {PowerUp[]} Array of power-ups that were collected
   */
  static checkPowerUpsVsPlayer(powerUps, player) {
    const collected = [];

    if (!player.active) return collected;

    for (const powerUp of powerUps) {
      if (!powerUp.active) continue;

      if (this.checkCollision(powerUp, player)) {
        collected.push(powerUp);
      }
    }

    return collected;
  }
}
