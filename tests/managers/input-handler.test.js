import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../../src/managers/input-handler.js';
import { Keys, GamepadButtons } from '../../src/constants.js';

describe('InputHandler', () => {
  let inputHandler;

  beforeEach(() => {
    inputHandler = new InputHandler();
    // Mock navigator.getGamepads
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => []),
    });
  });

  describe('Keyboard Input', () => {
    it('should detect key press', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      inputHandler.handleKeyDown(event);

      expect(inputHandler.isKeyHeld(['Space'])).toBe(true);
      expect(inputHandler.isKeyJustPressed(['Space'])).toBe(true);
    });

    it('should detect key release', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));
      inputHandler.handleKeyUp(new KeyboardEvent('keyup', { code: 'Space' }));

      expect(inputHandler.isKeyHeld(['Space'])).toBe(false);
    });

    it('should clear just pressed after frame', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));

      expect(inputHandler.isKeyJustPressed(['Space'])).toBe(true);

      inputHandler.clearJustPressed();

      expect(inputHandler.isKeyJustPressed(['Space'])).toBe(false);
      expect(inputHandler.isKeyHeld(['Space'])).toBe(true);
    });

    it('should detect left movement keys', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(inputHandler.isLeftHeld()).toBe(true);

      inputHandler.handleKeyUp(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyA' }));
      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should detect right movement keys', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
      expect(inputHandler.isRightHeld()).toBe(true);

      inputHandler.handleKeyUp(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyD' }));
      expect(inputHandler.isRightHeld()).toBe(true);
    });

    it('should detect fire key', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(inputHandler.isFireHeld()).toBe(true);
      expect(inputHandler.isFireJustPressed()).toBe(true);
    });

    it('should detect pause key', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyP' }));
      expect(inputHandler.isPauseJustPressed()).toBe(true);
    });

    it('should detect restart key', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyR' }));
      expect(inputHandler.isRestartJustPressed()).toBe(true);
    });

    it('should detect mute key', () => {
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyM' }));
      expect(inputHandler.isMuteJustPressed()).toBe(true);
    });

    it('should not register when disabled', () => {
      inputHandler.setEnabled(false);
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));

      expect(inputHandler.isKeyHeld(['Space'])).toBe(false);
    });
  });

  describe('Gamepad Input', () => {
    const createMockGamepad = (index = 0, buttons = [], axes = [0, 0, 0, 0]) => ({
      index,
      id: 'Xbox Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)',
      buttons: buttons.map((pressed) => ({ pressed, value: pressed ? 1 : 0 })),
      axes,
      connected: true,
      mapping: 'standard',
      vibrationActuator: {
        playEffect: vi.fn(),
      },
    });

    it('should detect gamepad connection', () => {
      const mockGamepad = createMockGamepad(0, new Array(17).fill(false));
      const event = { gamepad: mockGamepad };

      inputHandler.handleGamepadConnected(event);

      expect(inputHandler.controllerConnected).toBe(true);
      expect(inputHandler.controllerName).toBe('Xbox Controller');
    });

    it('should detect gamepad disconnection', () => {
      const mockGamepad = createMockGamepad(0, new Array(17).fill(false));
      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      inputHandler.handleGamepadDisconnected({ gamepad: mockGamepad });

      expect(inputHandler.controllerConnected).toBe(false);
    });

    it('should detect gamepad buttons', () => {
      const buttons = new Array(17).fill(false);
      buttons[GamepadButtons.A] = true; // A button pressed
      const mockGamepad = createMockGamepad(0, buttons);

      // Connect gamepad
      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });

      // Mock navigator.getGamepads to return the gamepad
      vi.stubGlobal('navigator', {
        getGamepads: () => [mockGamepad],
      });

      inputHandler.pollGamepads();

      expect(inputHandler.isGamepadButtonHeld(GamepadButtons.A)).toBe(true);
      expect(inputHandler.isFireHeld()).toBe(true);
    });

    it('should detect D-pad left', () => {
      const buttons = new Array(17).fill(false);
      buttons[GamepadButtons.DPAD_LEFT] = true;
      const mockGamepad = createMockGamepad(0, buttons);

      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should detect D-pad right', () => {
      const buttons = new Array(17).fill(false);
      buttons[GamepadButtons.DPAD_RIGHT] = true;
      const mockGamepad = createMockGamepad(0, buttons);

      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      expect(inputHandler.isRightHeld()).toBe(true);
    });

    it('should detect analog stick movement with deadzone', () => {
      const mockGamepad = createMockGamepad(0, new Array(17).fill(false), [-0.8, 0, 0, 0]);

      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      expect(inputHandler.getHorizontalAxis()).toBeLessThan(0);
      expect(inputHandler.isLeftHeld()).toBe(true);
    });

    it('should apply deadzone to small movements', () => {
      const mockGamepad = createMockGamepad(0, new Array(17).fill(false), [0.1, 0, 0, 0]);

      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      expect(inputHandler.getHorizontalAxis()).toBe(0);
      expect(inputHandler.isLeftHeld()).toBe(false);
      expect(inputHandler.isRightHeld()).toBe(false);
    });

    it('should detect Start button for pause', () => {
      // First poll with button NOT pressed to establish baseline
      const buttonsOff = new Array(17).fill(false);
      const mockGamepadOff = createMockGamepad(0, buttonsOff);

      inputHandler.handleGamepadConnected({ gamepad: mockGamepadOff });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepadOff] });
      inputHandler.pollGamepads();

      // Now poll with button pressed - this should trigger "just pressed"
      const buttonsOn = new Array(17).fill(false);
      buttonsOn[GamepadButtons.START] = true;
      const mockGamepadOn = createMockGamepad(0, buttonsOn);
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepadOn] });
      inputHandler.pollGamepads();

      expect(inputHandler.isPauseJustPressed()).toBe(true);
    });

    it('should identify controller type from ID', () => {
      expect(inputHandler.getControllerName('Xbox Wireless Controller')).toBe('Xbox Controller');
      expect(inputHandler.getControllerName('PlayStation DualShock 4')).toBe('PlayStation Controller');
      expect(inputHandler.getControllerName('DualSense Wireless Controller')).toBe('DualSense');
      expect(inputHandler.getControllerName('Nintendo Switch Pro Controller')).toBe('Nintendo Switch Pro');
      expect(inputHandler.getControllerName('8BitDo Pro 2')).toBe('8BitDo Controller');
    });

    it('should return controller status', () => {
      expect(inputHandler.getControllerStatus()).toEqual({
        connected: false,
        name: '',
        count: 0,
      });

      const mockGamepad = createMockGamepad(0, new Array(17).fill(false));
      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });

      expect(inputHandler.getControllerStatus()).toEqual({
        connected: true,
        name: 'Xbox Controller',
        count: 1,
      });
    });

    it('should trigger vibration when available', () => {
      const mockGamepad = createMockGamepad(0, new Array(17).fill(false));
      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      inputHandler.vibrate(0.5, 100);

      expect(mockGamepad.vibrationActuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
        startDelay: 0,
        duration: 100,
        weakMagnitude: 0.5,
        strongMagnitude: 0.5,
      });
    });
  });

  describe('Unified Input', () => {
    it('should detect fire from keyboard or gamepad', () => {
      // Keyboard
      inputHandler.handleKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(inputHandler.isFireHeld()).toBe(true);

      inputHandler.handleKeyUp(new KeyboardEvent('keyup', { code: 'Space' }));
      expect(inputHandler.isFireHeld()).toBe(false);

      // Gamepad
      const buttons = new Array(17).fill(false);
      buttons[GamepadButtons.A] = true;
      const mockGamepad = {
        index: 0,
        id: 'Test Controller',
        buttons: buttons.map((pressed) => ({ pressed })),
        axes: [0, 0, 0, 0],
        connected: true,
      };

      inputHandler.handleGamepadConnected({ gamepad: mockGamepad });
      vi.stubGlobal('navigator', { getGamepads: () => [mockGamepad] });
      inputHandler.pollGamepads();

      expect(inputHandler.isFireHeld()).toBe(true);
    });
  });
});
