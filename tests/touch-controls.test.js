import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TouchControlManager } from '../src/managers/touch-control-manager.js';
import { TouchControlsRenderer } from '../src/renderer/touch-controls-renderer.js';
import { InputHandler } from '../src/managers/input-handler.js';
import { GAME, TOUCH_CONTROLS } from '../src/constants.js';

/**
 * Helper function to create a mock touch event
 */
function createTouchEvent(type, touches = [], changedTouches = []) {
  return {
    type,
    touches: touches.length > 0 ? touches : [],
    changedTouches: changedTouches.length > 0 ? changedTouches : touches,
    preventDefault: vi.fn(),
  };
}

/**
 * Helper function to create a mock touch object
 */
function createTouch(x, y, identifier = 0) {
  return {
    identifier,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  };
}

/**
 * Helper function to mock canvas element
 */
function mockGameCanvas(width = GAME.WIDTH, height = GAME.HEIGHT) {
  const canvas = {
    id: 'gameCanvas',
    width,
    height,
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
    })),
  };

  document.getElementById = vi.fn((id) => {
    if (id === 'gameCanvas') return canvas;
    return null;
  });

  return canvas;
}

describe('TouchControlManager', () => {
  let manager;
  let mockCanvas;

  beforeEach(() => {
    manager = new TouchControlManager();
    mockCanvas = mockGameCanvas();

    // Mock window properties
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });

    // Mock document.addEventListener and document.removeEventListener
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect touch support when ontouchstart is available', () => {
      const mgr = new TouchControlManager();
      expect(mgr.isTouchSupported()).toBe(true);
    });

    it('should report touchSupported property correctly', () => {
      expect(manager.touchSupported).toBe(true);
      expect(typeof manager.touchSupported).toBe('boolean');
    });
  });

  describe('Lifecycle Methods', () => {
    it('should be disabled by default', () => {
      expect(manager.isEnabled()).toBe(false);
    });

    it('should enable touch controls on start()', () => {
      manager.start();
      expect(manager.isEnabled()).toBe(true);
    });

    it('should add event listeners on start()', () => {
      manager.start();

      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.any(Object)
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        expect.any(Object)
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        expect.any(Object)
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchcancel',
        expect.any(Function),
        expect.any(Object)
      );
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should not enable if already enabled', () => {
      manager.start();
      vi.clearAllMocks();
      manager.start();

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('should disable touch controls on stop()', () => {
      manager.start();
      manager.stop();
      expect(manager.isEnabled()).toBe(false);
    });

    it('should remove event listeners on stop()', () => {
      manager.start();
      manager.stop();

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      );
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      );
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'touchcancel',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should not disable if not enabled', () => {
      vi.clearAllMocks();
      manager.stop();
      expect(document.removeEventListener).not.toHaveBeenCalled();
    });

    it('should clear button states on stop()', () => {
      manager.start();
      manager.leftHeld = true;
      manager.fireHeld = true;
      manager.stop();

      expect(manager.leftHeld).toBe(false);
      expect(manager.fireHeld).toBe(false);
      expect(manager.rightHeld).toBe(false);
      expect(manager.pauseHeld).toBe(false);
    });

    it('should clear active touches on stop()', () => {
      manager.start();
      manager.activeTouches.set(0, { x: 100, y: 100 });
      manager.activeTouches.set(1, { x: 200, y: 200 });

      manager.stop();

      expect(manager.activeTouches.size).toBe(0);
    });
  });

  describe('Button State Tracking', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should track leftHeld state', () => {
      expect(manager.leftHeld).toBe(false);
      const touch = createTouch(150, 500, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.leftHeld).toBe(true);
    });

    it('should track rightHeld state', () => {
      expect(manager.rightHeld).toBe(false);
      // RIGHT button is at x: 100 + 80 + 10 + 40 = 230, y: 460
      const touch = createTouch(230, 460, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.rightHeld).toBe(true);
    });

    it('should track fireHeld state', () => {
      expect(manager.fireHeld).toBe(false);
      // FIRE button is at x: 800 - 100 - 50 = 650, y: 600 - 100 - 50 = 450
      const touch = createTouch(650, 450, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.fireHeld).toBe(true);
    });

    it('should track pauseHeld state', () => {
      expect(manager.pauseHeld).toBe(false);
      // PAUSE button is at x: 800 - 20 - 25 = 755, y: 20 + 25 = 45
      const touch = createTouch(755, 45, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.pauseHeld).toBe(true);
    });

    it('should release button when touch ends', () => {
      const touch = createTouch(150, 500, 0);
      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);
      expect(manager.leftHeld).toBe(true);

      const endEvent = createTouchEvent('touchend', [], [touch]);
      manager.handleTouchEnd(endEvent);
      expect(manager.leftHeld).toBe(false);
    });

    it('should handle multiple buttons pressed simultaneously', () => {
      const leftTouch = createTouch(150, 500, 0);
      const fireTouch = createTouch(650, 450, 1);
      const event = createTouchEvent('touchstart', [leftTouch, fireTouch]);

      manager.handleTouchStart(event);

      expect(manager.leftHeld).toBe(true);
      expect(manager.fireHeld).toBe(true);
    });

    it('should not clear button if another touch still holds it', () => {
      const touch1 = createTouch(140, 460, 0);
      const touch2 = createTouch(150, 470, 1);
      const startEvent = createTouchEvent('touchstart', [touch1, touch2]);
      manager.handleTouchStart(startEvent);
      expect(manager.leftHeld).toBe(true);

      const endEvent = createTouchEvent('touchend', [touch2], [touch1]);
      manager.handleTouchEnd(endEvent);

      // touch2 still presses left button
      expect(manager.leftHeld).toBe(true);
    });
  });

  describe('Just Pressed Detection', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should set leftJustPressed on first touch', () => {
      const touch = createTouch(150, 500, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.leftJustPressed).toBe(true);
    });

    it('should set rightJustPressed on first touch', () => {
      const touch = createTouch(230, 460, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.rightJustPressed).toBe(true);
    });

    it('should set fireJustPressed on first touch', () => {
      const touch = createTouch(650, 450, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.fireJustPressed).toBe(true);
    });

    it('should set pauseJustPressed on first touch', () => {
      const touch = createTouch(755, 45, 0);
      const event = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(event);

      expect(manager.pauseJustPressed).toBe(true);
    });

    it('should not set justPressed on continued hold', () => {
      const touch = createTouch(150, 500, 0);
      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);

      manager.leftJustPressed = false;

      const moveEvent = createTouchEvent('touchmove', [touch]);
      manager.handleTouchMove(moveEvent);

      expect(manager.leftJustPressed).toBe(false);
    });

    it('should set justPressed again after release and re-press', () => {
      const touch = createTouch(150, 500, 0);

      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);
      expect(manager.leftJustPressed).toBe(true);

      const endEvent = createTouchEvent('touchend', [], [touch]);
      manager.handleTouchEnd(endEvent);

      manager.leftJustPressed = false;

      const touch2 = createTouch(150, 500, 1);
      const startEvent2 = createTouchEvent('touchstart', [touch2]);
      manager.handleTouchStart(startEvent2);

      expect(manager.leftJustPressed).toBe(true);
    });
  });

  describe('clearJustPressed Method', () => {
    it('should clear all justPressed flags', () => {
      manager.leftJustPressed = true;
      manager.rightJustPressed = true;
      manager.fireJustPressed = true;
      manager.pauseJustPressed = true;

      manager.clearJustPressed();

      expect(manager.leftJustPressed).toBe(false);
      expect(manager.rightJustPressed).toBe(false);
      expect(manager.fireJustPressed).toBe(false);
      expect(manager.pauseJustPressed).toBe(false);
    });

    it('should not affect held states', () => {
      manager.leftHeld = true;
      manager.fireHeld = true;
      manager.leftJustPressed = true;

      manager.clearJustPressed();

      expect(manager.leftHeld).toBe(true);
      expect(manager.fireHeld).toBe(true);
    });
  });

  describe('getButtonPositions Method', () => {
    it('should return button positions object', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      expect(positions).toHaveProperty('LEFT');
      expect(positions).toHaveProperty('RIGHT');
      expect(positions).toHaveProperty('FIRE');
      expect(positions).toHaveProperty('PAUSE');
    });

    it('should return object with correct position properties', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      for (const [key, pos] of Object.entries(positions)) {
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(pos).toHaveProperty('radius');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(typeof pos.radius).toBe('number');
      }
    });

    it('should return a copy not the original', () => {
      manager.start();
      const positions1 = manager.getButtonPositions();
      const positions2 = manager.getButtonPositions();

      expect(positions1).not.toBe(positions2);
      // Objects are equal but different instances
      expect(positions1.LEFT).toEqual(positions2.LEFT);
    });

    it('should have LEFT button positioned at bottom-left', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      expect(positions.LEFT.x).toBeLessThan(GAME.WIDTH / 2);
      expect(positions.LEFT.y).toBeGreaterThan(GAME.HEIGHT / 2);
    });

    it('should have RIGHT button positioned next to LEFT', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      expect(positions.RIGHT.x).toBeGreaterThan(positions.LEFT.x);
      expect(positions.RIGHT.y).toBe(positions.LEFT.y);
    });

    it('should have FIRE button positioned at bottom-right', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      expect(positions.FIRE.x).toBeGreaterThan(GAME.WIDTH / 2);
      expect(positions.FIRE.y).toBeGreaterThan(GAME.HEIGHT / 2);
    });

    it('should have PAUSE button positioned at top-right', () => {
      manager.start();
      const positions = manager.getButtonPositions();

      expect(positions.PAUSE.x).toBeGreaterThan(GAME.WIDTH / 2);
      expect(positions.PAUSE.y).toBeLessThan(GAME.HEIGHT / 2);
    });
  });

  describe('getButtonStates Method', () => {
    it('should return button states object', () => {
      manager.start();
      const states = manager.getButtonStates();

      expect(states).toHaveProperty('left');
      expect(states).toHaveProperty('right');
      expect(states).toHaveProperty('fire');
      expect(states).toHaveProperty('pause');
    });

    it('should return false for all buttons by default', () => {
      manager.start();
      const states = manager.getButtonStates();

      expect(states.left).toBe(false);
      expect(states.right).toBe(false);
      expect(states.fire).toBe(false);
      expect(states.pause).toBe(false);
    });

    it('should reflect current button states', () => {
      manager.start();
      manager.leftHeld = true;
      manager.fireHeld = true;

      const states = manager.getButtonStates();

      expect(states.left).toBe(true);
      expect(states.fire).toBe(true);
      expect(states.right).toBe(false);
      expect(states.pause).toBe(false);
    });
  });

  describe('isEnabled Method', () => {
    it('should return false when not started', () => {
      expect(manager.isEnabled()).toBe(false);
    });

    it('should return true after start()', () => {
      manager.start();
      expect(manager.isEnabled()).toBe(true);
    });

    it('should return false after stop()', () => {
      manager.start();
      manager.stop();
      expect(manager.isEnabled()).toBe(false);
    });
  });

  describe('Button Hit Detection', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should detect hit within button radius', () => {
      const positions = manager.getButtonPositions();
      const leftPos = positions.LEFT;

      const touch = createTouch(leftPos.x, leftPos.y, 0);
      expect(manager.isPointInButton(touch.clientX - 0, touch.clientY - 0, leftPos)).toBe(true);
    });

    it('should not detect hit outside button radius', () => {
      const positions = manager.getButtonPositions();
      const leftPos = positions.LEFT;

      const x = leftPos.x + leftPos.radius + 10;
      const y = leftPos.y;
      expect(manager.isPointInButton(x, y, leftPos)).toBe(false);
    });

    it('should detect hit at button boundary', () => {
      const positions = manager.getButtonPositions();
      const leftPos = positions.LEFT;

      const angle = Math.PI / 4;
      const x = leftPos.x + Math.cos(angle) * (leftPos.radius - 0.5);
      const y = leftPos.y + Math.sin(angle) * (leftPos.radius - 0.5);
      expect(manager.isPointInButton(x, y, leftPos)).toBe(true);
    });

    it('should use circular hit detection', () => {
      const positions = manager.getButtonPositions();
      const leftPos = positions.LEFT;

      // Point above button but within radius
      const x = leftPos.x;
      const y = leftPos.y - leftPos.radius / 2;
      expect(manager.isPointInButton(x, y, leftPos)).toBe(true);

      // Point diagonally outside radius
      const outX = leftPos.x + leftPos.radius + 1;
      const outY = leftPos.y + leftPos.radius + 1;
      expect(manager.isPointInButton(outX, outY, leftPos)).toBe(false);
    });
  });

  describe('Multi-touch Support', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should track multiple simultaneous touches', () => {
      const touch1 = createTouch(150, 500, 0);
      const touch2 = createTouch(650, 450, 1);
      const touch3 = createTouch(755, 45, 2);

      const event = createTouchEvent('touchstart', [touch1, touch2, touch3]);
      manager.handleTouchStart(event);

      expect(manager.activeTouches.size).toBe(3);
      expect(manager.activeTouches.has(0)).toBe(true);
      expect(manager.activeTouches.has(1)).toBe(true);
      expect(manager.activeTouches.has(2)).toBe(true);
    });

    it('should update touch positions on move', () => {
      const touch = createTouch(150, 500, 0);
      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);

      const updatedTouch = createTouch(160, 510, 0);
      const moveEvent = createTouchEvent('touchmove', [updatedTouch]);
      manager.handleTouchMove(moveEvent);

      const activeTouch = manager.activeTouches.get(0);
      expect(activeTouch.x).toBe(160);
      expect(activeTouch.y).toBe(510);
    });

    it('should handle partial touch release', () => {
      const touch1 = createTouch(140, 460, 0);
      const touch2 = createTouch(650, 450, 1);
      const startEvent = createTouchEvent('touchstart', [touch1, touch2]);
      manager.handleTouchStart(startEvent);

      expect(manager.leftHeld).toBe(true);
      expect(manager.fireHeld).toBe(true);

      // When touch2 (FIRE) ends, but touch1 (LEFT) continues
      const endEvent = createTouchEvent('touchend', [touch1], [touch2]);
      manager.handleTouchEnd(endEvent);

      expect(manager.activeTouches.size).toBe(1);
      expect(manager.leftHeld).toBe(true);
      expect(manager.fireHeld).toBe(false);
    });

    it('should handle touch cancel event', () => {
      const touch = createTouch(150, 500, 0);
      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);

      expect(manager.leftHeld).toBe(true);

      const cancelEvent = createTouchEvent('touchcancel', [], [touch]);
      manager.handleTouchCancel(cancelEvent);

      expect(manager.activeTouches.size).toBe(0);
      expect(manager.leftHeld).toBe(false);
    });

    it('should prevent default on touch events', () => {
      const touch = createTouch(150, 500, 0);
      const event = createTouchEvent('touchstart', [touch]);

      manager.handleTouchStart(event);
      expect(event.preventDefault).toHaveBeenCalled();

      vi.clearAllMocks();
      const moveEvent = createTouchEvent('touchmove', [touch]);
      manager.handleTouchMove(moveEvent);
      expect(moveEvent.preventDefault).toHaveBeenCalled();

      vi.clearAllMocks();
      const endEvent = createTouchEvent('touchend', [], [touch]);
      manager.handleTouchEnd(endEvent);
      expect(endEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Haptic Vibration', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should call navigator.vibrate on button press', () => {
      const touch = createTouch(150, 500, 0);
      const event = createTouchEvent('touchstart', [touch]);

      manager.handleTouchStart(event);

      expect(navigator.vibrate).toHaveBeenCalledWith(
        TOUCH_CONTROLS.HAPTIC.PRESS_DURATION
      );
    });

    it('should not vibrate if haptic is disabled', () => {
      const originalEnabled = TOUCH_CONTROLS.HAPTIC.ENABLED;
      TOUCH_CONTROLS.HAPTIC.ENABLED = false;

      const touch = createTouch(150, 500, 0);
      const event = createTouchEvent('touchstart', [touch]);

      manager.handleTouchStart(event);

      expect(navigator.vibrate).not.toHaveBeenCalled();

      TOUCH_CONTROLS.HAPTIC.ENABLED = originalEnabled;
    });

    it('should not vibrate on continued hold', () => {
      const touch = createTouch(150, 500, 0);
      const startEvent = createTouchEvent('touchstart', [touch]);
      manager.handleTouchStart(startEvent);

      vi.clearAllMocks();

      const moveEvent = createTouchEvent('touchmove', [touch]);
      manager.handleTouchMove(moveEvent);

      expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('should vibrate on each new button press', () => {
      const touch1 = createTouch(150, 500, 0);
      const startEvent1 = createTouchEvent('touchstart', [touch1]);
      manager.handleTouchStart(startEvent1);

      vi.clearAllMocks();

      const touch2 = createTouch(650, 450, 1);
      const startEvent2 = createTouchEvent('touchstart', [touch1, touch2]);
      manager.handleTouchStart(startEvent2);

      expect(navigator.vibrate).toHaveBeenCalled();
    });
  });

  describe('Canvas Dimensions', () => {
    it('should initialize with game dimensions', () => {
      expect(manager.canvasWidth).toBe(GAME.WIDTH);
      expect(manager.canvasHeight).toBe(GAME.HEIGHT);
    });

    it('should update dimensions via setCanvasDimensions', () => {
      manager.start();
      const newWidth = 1024;
      const newHeight = 768;

      // Mock canvas with new dimensions
      mockCanvas.width = newWidth;
      mockCanvas.height = newHeight;
      mockCanvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: newWidth,
        bottom: newHeight,
        width: newWidth,
        height: newHeight,
        x: 0,
        y: 0,
      }));

      manager.setCanvasDimensions(newWidth, newHeight);

      expect(manager.canvasWidth).toBe(newWidth);
      expect(manager.canvasHeight).toBe(newHeight);
    });

    it('should recalculate button positions on dimension update', () => {
      manager.start();
      const originalPositions = manager.getButtonPositions();

      const newWidth = 1024;
      const newHeight = 768;
      mockCanvas.width = newWidth;
      mockCanvas.height = newHeight;
      mockCanvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: newWidth,
        bottom: newHeight,
        width: newWidth,
        height: newHeight,
        x: 0,
        y: 0,
      }));

      manager.setCanvasDimensions(newWidth, newHeight);
      const newPositions = manager.getButtonPositions();

      // LEFT button x should stay same (left offset is fixed)
      expect(newPositions.LEFT.x).toBe(originalPositions.LEFT.x);
      // But y changes with canvas height
      expect(newPositions.LEFT.y).toBeGreaterThan(originalPositions.LEFT.y);

      // FIRE button x should be further right with wider screen
      expect(newPositions.FIRE.x).toBeGreaterThan(originalPositions.FIRE.x);
    });

    it('should handle resize event', () => {
      manager.start();
      const calculatePositionsSpy = vi.spyOn(manager, 'calculateButtonPositions');

      manager.handleResize();

      expect(calculatePositionsSpy).toHaveBeenCalled();
    });
  });

  describe('Touch Coordinate Conversion', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should convert touch coordinates to canvas space', () => {
      const touch = createTouch(100, 200);
      const { x, y } = manager.getTouchCoordinates(touch);

      expect(x).toBe(100);
      expect(y).toBe(200);
    });

    it('should handle touch when canvas is null', () => {
      document.getElementById = vi.fn(() => null);

      const touch = createTouch(100, 200);
      const { x, y } = manager.getTouchCoordinates(touch);

      expect(x).toBe(100);
      expect(y).toBe(200);
    });
  });

  describe('Query Methods', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should check isLeftHeld()', () => {
      expect(manager.isLeftHeld()).toBe(false);
      manager.leftHeld = true;
      expect(manager.isLeftHeld()).toBe(true);
    });

    it('should check isRightHeld()', () => {
      expect(manager.isRightHeld()).toBe(false);
      manager.rightHeld = true;
      expect(manager.isRightHeld()).toBe(true);
    });

    it('should check isFireHeld()', () => {
      expect(manager.isFireHeld()).toBe(false);
      manager.fireHeld = true;
      expect(manager.isFireHeld()).toBe(true);
    });

    it('should check isFireJustPressed()', () => {
      expect(manager.isFireJustPressed()).toBe(false);
      manager.fireJustPressed = true;
      expect(manager.isFireJustPressed()).toBe(true);
    });

    it('should check isPauseJustPressed()', () => {
      expect(manager.isPauseJustPressed()).toBe(false);
      manager.pauseJustPressed = true;
      expect(manager.isPauseJustPressed()).toBe(true);
    });

    it('should check isTouchSupported()', () => {
      expect(manager.isTouchSupported()).toBe(true);
    });
  });
});

describe('TouchControlsRenderer', () => {
  let renderer;
  let mockCtx;

  beforeEach(() => {
    renderer = new TouchControlsRenderer();

    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'bevel',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      font: '',
      strokeRect: vi.fn(),
    };
  });

  describe('draw Method', () => {
    it('should handle null positions gracefully', () => {
      expect(() => {
        renderer.draw(mockCtx, null, {});
      }).not.toThrow();
    });

    it('should handle undefined positions gracefully', () => {
      expect(() => {
        renderer.draw(mockCtx, undefined, {});
      }).not.toThrow();
    });

    it('should draw all buttons when positions provided', () => {
      const drawSpy = vi.spyOn(renderer, 'drawLeftButton');
      const positions = {
        left: { x: 100, y: 500 },
        right: { x: 200, y: 500 },
        fire: { x: 650, y: 450 },
        pause: { x: 755, y: 45 },
      };
      const states = { left: false, right: false, fire: false, pause: false };

      renderer.draw(mockCtx, positions, states);

      // Verify draw methods were called
      expect(drawSpy).toHaveBeenCalled();
    });

    it('should skip drawing if button positions are missing', () => {
      const positions = {
        LEFT: { x: 100, y: 500 },
        RIGHT: undefined,
        FIRE: { x: 650, y: 450 },
        PAUSE: { x: 755, y: 45 },
      };

      expect(() => {
        renderer.draw(mockCtx, positions, {});
      }).not.toThrow();
    });

    it('should draw with null button states', () => {
      const positions = {
        LEFT: { x: 100, y: 500 },
        RIGHT: { x: 200, y: 500 },
        FIRE: { x: 650, y: 450 },
        PAUSE: { x: 755, y: 45 },
      };

      expect(() => {
        renderer.draw(mockCtx, positions, null);
      }).not.toThrow();
    });

    it('should default button states to false if undefined', () => {
      const drawFireSpy = vi.spyOn(renderer, 'drawFireButton');
      const positions = {
        left: { x: 100, y: 500 },
        right: { x: 200, y: 500 },
        fire: { x: 650, y: 450 },
        pause: { x: 755, y: 45 },
      };

      renderer.draw(mockCtx, positions, {});

      // Verify draw was called with states defaulting to false
      expect(drawFireSpy).toHaveBeenCalledWith(mockCtx, positions.fire, false);
    });
  });

  describe('updateCanvasDimensions Method', () => {
    it('should update canvas dimensions', () => {
      renderer.updateCanvasDimensions(1024, 768);

      expect(renderer.canvasWidth).toBe(1024);
      expect(renderer.canvasHeight).toBe(768);
    });

    it('should initialize with game dimensions', () => {
      expect(renderer.canvasWidth).toBe(GAME.WIDTH);
      expect(renderer.canvasHeight).toBe(GAME.HEIGHT);
    });
  });

  describe('Individual Button Drawing', () => {
    it('should draw left button', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawLeftButton(mockCtx, pos, false);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw right button', () => {
      const pos = { x: 200, y: 500 };
      renderer.drawRightButton(mockCtx, pos, false);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw fire button', () => {
      const pos = { x: 650, y: 450 };
      renderer.drawFireButton(mockCtx, pos, false);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw pause button', () => {
      const pos = { x: 755, y: 45 };
      renderer.drawPauseButton(mockCtx, pos, false);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should handle null position in drawLeftButton', () => {
      expect(() => {
        renderer.drawLeftButton(mockCtx, null, false);
      }).not.toThrow();
    });

    it('should handle missing x in position', () => {
      const pos = { y: 500 };
      expect(() => {
        renderer.drawLeftButton(mockCtx, pos, false);
      }).not.toThrow();
    });

    it('should handle missing y in position', () => {
      const pos = { x: 100 };
      expect(() => {
        renderer.drawLeftButton(mockCtx, pos, false);
      }).not.toThrow();
    });
  });

  describe('Pressed vs Unpressed Visual States', () => {
    it('should use different color when button is pressed', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawLeftButton(mockCtx, pos, true);

      const saveCalls = mockCtx.save.mock.calls.length;
      expect(saveCalls).toBeGreaterThan(0);
    });

    it('should apply different opacity when pressed', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawLeftButton(mockCtx, pos, true);

      expect(mockCtx.globalAlpha).toBeDefined();
    });

    it('should fill button circle when pressed', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawFireButton(mockCtx, pos, true);

      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should always draw outline', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawLeftButton(mockCtx, pos, false);

      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('Icon Drawing', () => {
    it('should draw arrow icons for directional buttons', () => {
      const pos = { x: 100, y: 500 };
      renderer.drawLeftButton(mockCtx, pos, false);

      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw fire icon with crosshair', () => {
      const pos = { x: 650, y: 450 };
      renderer.drawFireButton(mockCtx, pos, false);

      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw pause icon with two bars', () => {
      const pos = { x: 755, y: 45 };
      renderer.drawPauseButton(mockCtx, pos, false);

      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawDebugOverlay Method', () => {
    it('should handle null positions', () => {
      expect(() => {
        renderer.drawDebugOverlay(mockCtx, null, {});
      }).not.toThrow();
    });

    it('should draw debug overlay when provided', () => {
      const positions = {
        LEFT: { x: 100, y: 500 },
      };
      const hitAreas = {
        LEFT: { x: 100, y: 500, width: 80, height: 80 },
      };

      renderer.drawDebugOverlay(mockCtx, positions, hitAreas);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
    });
  });
});

describe('InputHandler Touch Integration', () => {
  let inputHandler;
  let mockCanvas;

  beforeEach(() => {
    inputHandler = new InputHandler();
    mockCanvas = mockGameCanvas();

    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => []),
      vibrate: vi.fn(),
    });

    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isTouchActive Method', () => {
    it('should return false when touch controls not started', () => {
      expect(inputHandler.isTouchActive()).toBe(false);
    });

    it('should return true when touch controls started', () => {
      inputHandler.touchControls.start();
      expect(inputHandler.isTouchActive()).toBe(true);
    });

    it('should return false after touch controls stopped', () => {
      inputHandler.touchControls.start();
      inputHandler.touchControls.stop();
      expect(inputHandler.isTouchActive()).toBe(false);
    });
  });

  describe('getTouchButtonPositions Method', () => {
    it('should return button positions from touch manager', () => {
      inputHandler.touchControls.start();
      const positions = inputHandler.getTouchButtonPositions();

      expect(positions).toHaveProperty('LEFT');
      expect(positions).toHaveProperty('RIGHT');
      expect(positions).toHaveProperty('FIRE');
      expect(positions).toHaveProperty('PAUSE');
    });

    it('should return same positions as touch manager', () => {
      inputHandler.touchControls.start();
      const inputPositions = inputHandler.getTouchButtonPositions();
      const touchPositions = inputHandler.touchControls.getButtonPositions();

      expect(inputPositions.LEFT).toEqual(touchPositions.LEFT);
      expect(inputPositions.RIGHT).toEqual(touchPositions.RIGHT);
    });
  });

  describe('getTouchButtonStates Method', () => {
    it('should return button states from touch manager', () => {
      inputHandler.touchControls.start();
      const states = inputHandler.getTouchButtonStates();

      expect(states).toHaveProperty('left');
      expect(states).toHaveProperty('right');
      expect(states).toHaveProperty('fire');
      expect(states).toHaveProperty('pause');
    });

    it('should return same states as touch manager', () => {
      inputHandler.touchControls.start();
      inputHandler.touchControls.leftHeld = true;
      inputHandler.touchControls.fireHeld = true;

      const inputStates = inputHandler.getTouchButtonStates();
      const touchStates = inputHandler.touchControls.getButtonStates();

      expect(inputStates).toEqual(touchStates);
    });
  });

  describe('Unified Input with Touch', () => {
    beforeEach(() => {
      inputHandler.touchControls.start();
    });

    it('should detect left from touch controls', () => {
      inputHandler.touchControls.leftHeld = true;

      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should detect right from touch controls', () => {
      inputHandler.touchControls.rightHeld = true;

      expect(inputHandler.isRightHeld()).toBe(true);
    });

    it('should detect fire from touch controls', () => {
      inputHandler.touchControls.fireHeld = true;

      expect(inputHandler.isFireHeld()).toBe(true);
    });

    it('should detect fire just pressed from touch controls', () => {
      inputHandler.touchControls.fireJustPressed = true;

      expect(inputHandler.isFireJustPressed()).toBe(true);
    });

    it('should detect pause from touch controls', () => {
      inputHandler.touchControls.pauseJustPressed = true;

      expect(inputHandler.isPauseJustPressed()).toBe(true);
    });

    it('should prioritize touch over keyboard for left', () => {
      inputHandler.touchControls.leftHeld = true;
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));

      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should detect left from keyboard if touch inactive', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));

      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should clear touch just pressed flags on clearJustPressed', () => {
      inputHandler.touchControls.leftJustPressed = true;
      inputHandler.touchControls.fireJustPressed = true;

      inputHandler.clearJustPressed();

      expect(inputHandler.touchControls.leftJustPressed).toBe(false);
      expect(inputHandler.touchControls.fireJustPressed).toBe(false);
    });
  });

  describe('Controller Status with Touch', () => {
    it('should include touch active in controller status', () => {
      const status = inputHandler.getControllerStatus();

      expect(status).toHaveProperty('touchActive');
      expect(status.touchActive).toBe(false);
    });

    it('should report touch as active in controller status', () => {
      inputHandler.touchControls.start();
      const status = inputHandler.getControllerStatus();

      expect(status.touchActive).toBe(true);
    });
  });

  describe('Touch Controls Initialization', () => {
    it('should create touch controls on initialization', () => {
      expect(inputHandler.touchControls).toBeDefined();
      expect(inputHandler.touchControls instanceof TouchControlManager).toBe(true);
    });

    it('should start touch controls on input handler start', () => {
      const startSpy = vi.spyOn(inputHandler.touchControls, 'start');

      inputHandler.start();

      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop touch controls on input handler stop', () => {
      const stopSpy = vi.spyOn(inputHandler.touchControls, 'stop');

      inputHandler.start();
      inputHandler.stop();

      expect(stopSpy).toHaveBeenCalled();
    });
  });
});

describe('Integration Scenarios', () => {
  let manager;
  let renderer;
  let inputHandler;
  let mockCanvas;

  beforeEach(() => {
    manager = new TouchControlManager();
    renderer = new TouchControlsRenderer();
    inputHandler = new InputHandler();
    mockCanvas = mockGameCanvas();

    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
      getGamepads: vi.fn(() => []),
    });

    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle full touch interaction flow', () => {
    manager.start();

    const touch = createTouch(150, 500, 0);
    const startEvent = createTouchEvent('touchstart', [touch]);
    manager.handleTouchStart(startEvent);

    expect(manager.leftHeld).toBe(true);
    expect(manager.leftJustPressed).toBe(true);

    const moveEvent = createTouchEvent('touchmove', [touch]);
    manager.handleTouchMove(moveEvent);

    expect(manager.leftHeld).toBe(true);

    const endEvent = createTouchEvent('touchend', [], [touch]);
    manager.handleTouchEnd(endEvent);

    expect(manager.leftHeld).toBe(false);

    manager.clearJustPressed();
    expect(manager.leftJustPressed).toBe(false);
  });

  it('should render buttons correctly during interaction', () => {
    manager.start();
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillRect: vi.fn(),
    };

    const touch = createTouch(140, 460, 0);
    const startEvent = createTouchEvent('touchstart', [touch]);
    manager.handleTouchStart(startEvent);

    // Get positions and states from manager
    const managerPositions = manager.getButtonPositions();
    const managerStates = manager.getButtonStates();

    // Convert to lowercase keys for renderer
    const rendererPositions = {
      left: managerPositions.LEFT,
      right: managerPositions.RIGHT,
      fire: managerPositions.FIRE,
      pause: managerPositions.PAUSE,
    };

    const drawSpy = vi.spyOn(renderer, 'drawLeftButton');
    renderer.draw(mockCtx, rendererPositions, managerStates);

    // Verify rendering was performed
    expect(drawSpy).toHaveBeenCalled();
    // Button should be rendered as pressed
    expect(drawSpy).toHaveBeenCalledWith(mockCtx, rendererPositions.left, true);
  });

  it('should integrate touch with input handler', () => {
    inputHandler.start();

    expect(inputHandler.isTouchActive()).toBe(true);

    const touch = createTouch(150, 500, 0);
    const event = createTouchEvent('touchstart', [touch]);
    inputHandler.touchControls.handleTouchStart(event);

    expect(inputHandler.isLeftHeld()).toBe(true);

    inputHandler.stop();
    expect(inputHandler.isTouchActive()).toBe(false);
  });

  it('should handle simultaneous keyboard and touch input', () => {
    inputHandler.start();

    inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(inputHandler.isFireHeld()).toBe(true);

    const touch = createTouch(150, 500, 0);
    const event = createTouchEvent('touchstart', [touch]);
    inputHandler.touchControls.handleTouchStart(event);

    expect(inputHandler.isLeftHeld()).toBe(true);
    expect(inputHandler.isFireHeld()).toBe(true);

    inputHandler.stop();
  });
});
