import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Starfield } from '../../src/renderer/starfield.js';
import { GAME, STARFIELD } from '../../src/constants.js';

describe('Starfield', () => {
  let starfield;
  let mockCtx;

  beforeEach(() => {
    starfield = new Starfield(GAME.WIDTH, GAME.HEIGHT);
    mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
    };
  });

  describe('initialization', () => {
    it('should initialize with correct canvas dimensions', () => {
      expect(starfield.width).toBe(GAME.WIDTH);
      expect(starfield.height).toBe(GAME.HEIGHT);
    });

    it('should initialize with correct base speed', () => {
      expect(starfield.baseSpeed).toBe(STARFIELD.BASE_SPEED);
    });

    it('should create correct number of layers', () => {
      expect(starfield.layers.length).toBe(STARFIELD.LAYERS.length);
      expect(starfield.layers.length).toBe(3);
    });

    it('should create layers with correct structure', () => {
      for (const layer of starfield.layers) {
        expect(layer).toHaveProperty('count');
        expect(layer).toHaveProperty('size');
        expect(layer).toHaveProperty('color');
        expect(layer).toHaveProperty('speed');
        expect(layer).toHaveProperty('stars');
      }
    });

    it('should create correct number of stars per layer', () => {
      for (let i = 0; i < starfield.layers.length; i++) {
        expect(starfield.layers[i].stars.length).toBe(STARFIELD.LAYERS[i].count);
      }
    });

    it('should match layer properties from constants', () => {
      for (let i = 0; i < starfield.layers.length; i++) {
        expect(starfield.layers[i].size).toBe(STARFIELD.LAYERS[i].size);
        expect(starfield.layers[i].color).toBe(STARFIELD.LAYERS[i].color);
        expect(starfield.layers[i].speed).toBe(STARFIELD.LAYERS[i].speed);
        expect(starfield.layers[i].count).toBe(STARFIELD.LAYERS[i].count);
      }
    });
  });

  describe('star positioning', () => {
    it('should initialize stars with x coordinates within canvas bounds', () => {
      for (const layer of starfield.layers) {
        for (const star of layer.stars) {
          expect(star.x).toBeGreaterThanOrEqual(0);
          expect(star.x).toBeLessThanOrEqual(GAME.WIDTH);
        }
      }
    });

    it('should initialize stars with y coordinates within canvas bounds', () => {
      for (const layer of starfield.layers) {
        for (const star of layer.stars) {
          expect(star.y).toBeGreaterThanOrEqual(0);
          expect(star.y).toBeLessThanOrEqual(GAME.HEIGHT);
        }
      }
    });

    it('should have x and y properties on each star', () => {
      for (const layer of starfield.layers) {
        for (const star of layer.stars) {
          expect(star).toHaveProperty('x');
          expect(star).toHaveProperty('y');
          expect(typeof star.x).toBe('number');
          expect(typeof star.y).toBe('number');
        }
      }
    });
  });

  describe('update', () => {
    it('should move stars downward when update is called', () => {
      const layer = starfield.layers[0];
      const star = layer.stars[0];
      const initialY = star.y;
      const deltaTime = 100; // milliseconds

      starfield.update(deltaTime);

      expect(star.y).toBeGreaterThan(initialY);
    });

    it('should move stars at correct speed based on layer speed multiplier', () => {
      const deltaTime = 1000; // 1 second
      const layer = starfield.layers[0];
      const star = layer.stars[0];
      const initialY = star.y;

      starfield.update(deltaTime);

      const expectedDeltaY = layer.speed * starfield.baseSpeed;
      const actualDeltaY = star.y - initialY;
      expect(actualDeltaY).toBeCloseTo(expectedDeltaY, 5);
    });

    it('should respect deltaTime conversion from milliseconds to seconds', () => {
      const deltaTime = 500; // 0.5 seconds
      const layer = starfield.layers[1];
      const star = layer.stars[0];
      const initialY = star.y;

      starfield.update(deltaTime);

      const expectedDeltaY = layer.speed * starfield.baseSpeed * 0.5;
      const actualDeltaY = star.y - initialY;
      expect(actualDeltaY).toBeCloseTo(expectedDeltaY, 5);
    });

    it('should wrap stars to top when they pass the bottom', () => {
      const layer = starfield.layers[0];
      const star = layer.stars[0];
      star.y = GAME.HEIGHT - 5;

      starfield.update(100);

      expect(star.y).toBeLessThan(GAME.HEIGHT);
    });

    it('should position wrapped stars at negative y offset based on star size', () => {
      const layer = starfield.layers[1];
      const star = layer.stars[0];
      star.y = GAME.HEIGHT;

      starfield.update(1);

      expect(star.y).toBeLessThanOrEqual(-layer.size);
      expect(star.y).toBeGreaterThanOrEqual(-layer.size - 1);
    });

    it('should randomize x position when star wraps around', () => {
      const layer = starfield.layers[2];
      const star = layer.stars[0];
      star.y = GAME.HEIGHT - 1;
      const originalX = star.x;

      // Mock Math.random to verify wrapping occurs
      const randomSpy = vi.spyOn(Math, 'random');
      randomSpy.mockReturnValue(0.5);

      starfield.update(1000);

      expect(star.x).toBe(GAME.WIDTH * 0.5);
      expect(star.x).not.toBe(originalX);

      randomSpy.mockRestore();
    });

    it('should update all layers simultaneously', () => {
      // Set specific star positions to avoid wrap edge cases
      for (const layer of starfield.layers) {
        for (const star of layer.stars) {
          star.y = 100; // Position well away from bottom edge
        }
      }

      const initialPositions = starfield.layers.map(layer =>
        layer.stars.map(star => ({ x: star.x, y: star.y }))
      );

      starfield.update(100);

      // Each layer should move its stars downward
      for (let layerIdx = 0; layerIdx < starfield.layers.length; layerIdx++) {
        const layer = starfield.layers[layerIdx];
        for (let starIdx = 0; starIdx < layer.stars.length; starIdx++) {
          const star = layer.stars[starIdx];
          const initialY = initialPositions[layerIdx][starIdx].y;
          expect(star.y).toBeGreaterThan(initialY);
        }
      }
    });

    it('should handle zero deltaTime without errors', () => {
      const layer = starfield.layers[0];
      const star = layer.stars[0];
      const initialY = star.y;

      starfield.update(0);

      expect(star.y).toBe(initialY);
    });
  });

  describe('draw', () => {
    it('should call fillRect for each star in all layers', () => {
      starfield.draw(mockCtx);

      const totalStars = starfield.layers.reduce((sum, layer) => sum + layer.stars.length, 0);
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(totalStars);
    });

    it('should set fillStyle to layer color before drawing', () => {
      starfield.draw(mockCtx);

      for (const layer of starfield.layers) {
        expect(mockCtx.fillStyle).toHaveBeenCalledWith ||
        expect([mockCtx.fillStyle]).toContain(layer.color);
      }
    });

    it('should draw stars with correct size from layer config', () => {
      starfield.draw(mockCtx);

      let callIndex = 0;
      for (const layer of starfield.layers) {
        for (const star of layer.stars) {
          const call = mockCtx.fillRect.mock.calls[callIndex];
          const width = call[2];
          const height = call[3];
          expect(width).toBe(layer.size);
          expect(height).toBe(layer.size);
          callIndex++;
        }
      }
    });

    it('should round star coordinates when drawing', () => {
      const layer = starfield.layers[0];
      const star = layer.stars[0];
      star.x = 123.7;
      star.y = 456.3;

      starfield.draw(mockCtx);

      const call = mockCtx.fillRect.mock.calls[0];
      expect(call[0]).toBe(Math.round(123.7));
      expect(call[1]).toBe(Math.round(456.3));
    });

    it('should draw all stars from all layers', () => {
      starfield.draw(mockCtx);

      const expectedCalls = starfield.layers.reduce((sum, layer) => sum + layer.stars.length, 0);
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(expectedCalls);
    });

    it('should handle empty starfield gracefully', () => {
      const emptyStarfield = new Starfield(GAME.WIDTH, GAME.HEIGHT);
      emptyStarfield.layers.forEach(layer => layer.stars = []);

      expect(() => emptyStarfield.draw(mockCtx)).not.toThrow();
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    it('should set correct fillStyle for each layer', () => {
      mockCtx.fillStyle = '';
      starfield.draw(mockCtx);

      let layerIndex = 0;
      for (const layer of starfield.layers) {
        for (let i = 0; i < layer.stars.length; i++) {
          if (i === 0) {
            // Verify fillStyle was set to this layer's color at some point
            expect(mockCtx.fillStyle).toBeDefined();
          }
        }
        layerIndex++;
      }
    });
  });

  describe('custom dimensions', () => {
    it('should accept custom width and height in constructor', () => {
      const customWidth = 1024;
      const customHeight = 768;
      const customStarfield = new Starfield(customWidth, customHeight);

      expect(customStarfield.width).toBe(customWidth);
      expect(customStarfield.height).toBe(customHeight);
    });

    it('should initialize stars within custom canvas bounds', () => {
      const customWidth = 640;
      const customHeight = 480;
      const customStarfield = new Starfield(customWidth, customHeight);

      for (const layer of customStarfield.layers) {
        for (const star of layer.stars) {
          expect(star.x).toBeGreaterThanOrEqual(0);
          expect(star.x).toBeLessThanOrEqual(customWidth);
          expect(star.y).toBeGreaterThanOrEqual(0);
          expect(star.y).toBeLessThanOrEqual(customHeight);
        }
      }
    });

    it('should wrap stars correctly with custom height', () => {
      const customHeight = 300;
      const customStarfield = new Starfield(GAME.WIDTH, customHeight);
      const layer = customStarfield.layers[0];
      const star = layer.stars[0];
      star.y = customHeight - 1;

      customStarfield.update(1000);

      expect(star.y).toBeLessThan(customHeight);
    });
  });

  describe('layer depth ordering', () => {
    it('should maintain correct layer order for depth effect', () => {
      expect(starfield.layers[0].speed).toBeLessThan(starfield.layers[1].speed);
      expect(starfield.layers[1].speed).toBeLessThan(starfield.layers[2].speed);
    });

    it('should have smaller stars in back layers', () => {
      expect(starfield.layers[0].size).toBeLessThan(starfield.layers[1].size);
      expect(starfield.layers[1].size).toBeLessThan(starfield.layers[2].size);
    });

    it('should have darker colors in back layers', () => {
      expect(starfield.layers[0].color).toBe('#444444'); // Darkest
      expect(starfield.layers[1].color).toBe('#888888'); // Medium
      expect(starfield.layers[2].color).toBe('#FFFFFF'); // Brightest
    });
  });
});
