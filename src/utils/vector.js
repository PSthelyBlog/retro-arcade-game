/**
 * Simple 2D vector utility class
 */
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add another vector to this one
   * @param {Vector2} v - Vector to add
   * @returns {Vector2} New vector with sum
   */
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtract another vector from this one
   * @param {Vector2} v - Vector to subtract
   * @returns {Vector2} New vector with difference
   */
  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiply vector by scalar
   * @param {number} scalar - Value to multiply by
   * @returns {Vector2} New scaled vector
   */
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * Get magnitude (length) of vector
   * @returns {number} Vector length
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalize vector to unit length
   * @returns {Vector2} New normalized vector
   */
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(this.x / mag, this.y / mag);
  }

  /**
   * Calculate distance to another vector
   * @param {Vector2} v - Other vector
   * @returns {number} Distance between vectors
   */
  distanceTo(v) {
    return this.subtract(v).magnitude();
  }

  /**
   * Clone this vector
   * @returns {Vector2} New vector with same values
   */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Set values
   * @param {number} x
   * @param {number} y
   */
  set(x, y) {
    this.x = x;
    this.y = y;
  }
}
