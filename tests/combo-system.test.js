import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComboManager } from '../src/managers/combo-manager.js';
import { PopupManager } from '../src/managers/popup-manager.js';
import { COMBO } from '../src/constants.js';

describe('ComboManager', () => {
  let comboManager;

  beforeEach(() => {
    comboManager = new ComboManager();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor initializes state correctly', () => {
    it('should initialize count to 0', () => {
      expect(comboManager.count).toBe(0);
    });

    it('should initialize multiplier to 1.0', () => {
      expect(comboManager.multiplier).toBe(1.0);
    });

    it('should initialize lastKillTime to null', () => {
      expect(comboManager.lastKillTime).toBeNull();
    });

    it('should initialize maxCombo to 0', () => {
      expect(comboManager.maxCombo).toBe(0);
    });

    it('should initialize _isActive to false', () => {
      expect(comboManager._isActive).toBe(false);
    });

    it('should initialize accumulatedGrace to 0', () => {
      expect(comboManager.accumulatedGrace).toBe(0);
    });
  });

  describe('First kill starts combo at 1 with multiplier 1.0', () => {
    it('should set count to 1 on first kill', () => {
      const result = comboManager.registerKill(Date.now());
      expect(comboManager.count).toBe(1);
      expect(result.comboCount).toBe(1);
    });

    it('should set isNewCombo to true for first kill', () => {
      const result = comboManager.registerKill(Date.now());
      expect(result.isNewCombo).toBe(true);
    });

    it('should keep multiplier at 1.0 for single kill', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.multiplier).toBe(1.0);
      expect(comboManager.getMultiplier()).toBe(1.0);
    });

    it('should update lastKillTime on first kill', () => {
      const now = Date.now();
      comboManager.registerKill(now);
      expect(comboManager.lastKillTime).toBe(now);
    });

    it('should add grace period after first kill', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD);
    });
  });

  describe('Quick consecutive kills increment combo', () => {
    it('should increment count from 1 to 2 on quick second kill', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      const result = comboManager.registerKill(Date.now());
      expect(comboManager.count).toBe(2);
      expect(result.comboCount).toBe(2);
    });

    it('should not mark second kill as new combo', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      const result = comboManager.registerKill(Date.now());
      expect(result.isNewCombo).toBe(false);
    });

    it('should increment count from 2 to 3', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      const result = comboManager.registerKill(Date.now());
      expect(comboManager.count).toBe(3);
      expect(result.comboCount).toBe(3);
    });

    it('should accumulate grace periods', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD);

      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD * 2);

      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD * 3);
    });

    it('should continue combo for 5 consecutive rapid kills', () => {
      for (let i = 1; i <= 5; i++) {
        comboManager.registerKill(Date.now());
        expect(comboManager.count).toBe(i);
        vi.advanceTimersByTime(100);
      }
    });
  });

  describe('Combo resets after timeout', () => {
    it('should reset combo when kill exceeds timeout', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      expect(comboManager.count).toBe(1);
      // accumulatedGrace = GRACE_PERIOD = 200

      // Jump past timeout window (TIMEOUT + grace)
      // Timeout = 1500 + 200 = 1700
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD + 1);
      const result = comboManager.registerKill(Date.now());

      expect(comboManager.count).toBe(1);
      expect(result.isNewCombo).toBe(true);
    });

    it('should reset multiplier when combo times out', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2); // count = 2, multiplier should be 1.5
      expect(comboManager.multiplier).toBe(1.5);
      // accumulatedGrace = GRACE_PERIOD * 2 = 400

      // Jump past timeout and register new kill
      // Timeout = 1500 + 400 = 1900
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD * 2 + 1);
      comboManager.registerKill(Date.now());
      expect(comboManager.multiplier).toBe(1.0);
    });

    it('should reset accumulatedGrace when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD);

      // Jump past timeout window (TIMEOUT + grace)
      // Timeout = 1500 + 200 = 1700
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD + 1);
      comboManager.registerKill(Date.now());
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD);
    });

    it('should not reset if kill is within timeout window', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      const initialCount = comboManager.count;

      // Kill within timeout but not immediately after
      vi.advanceTimersByTime(COMBO.TIMEOUT - 50);
      const result = comboManager.registerKill(Date.now());

      expect(comboManager.count).toBe(initialCount + 1);
      expect(result.isNewCombo).toBe(false);
    });
  });

  describe('Multiplier scales correctly', () => {
    it('should be 1.5 at 2x combo', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager.multiplier).toBe(1.5);
      expect(comboManager.getMultiplier()).toBe(1.5);
    });

    it('should be 2.0 at 3x combo', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager.multiplier).toBe(2.0);
    });

    it('should be 2.5 at 4x combo', () => {
      for (let i = 0; i < 4; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.multiplier).toBe(2.5);
    });

    it('should be 3.0 at 5x combo', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.multiplier).toBe(3.0);
    });

    it('should stay at 3.0 for 5+ combos', () => {
      for (let i = 0; i < 10; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.multiplier).toBe(3.0);
    });

    it('should be 1.0 for single kill', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.multiplier).toBe(1.0);
    });
  });

  describe('Max combo is tracked correctly', () => {
    it('should initialize maxCombo to 0', () => {
      expect(comboManager.maxCombo).toBe(0);
      expect(comboManager.getMaxCombo()).toBe(0);
    });

    it('should update maxCombo when combo exceeds previous max', () => {
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.maxCombo).toBe(3);
      expect(comboManager.getMaxCombo()).toBe(3);
    });

    it('should not decrease maxCombo when combo resets', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.maxCombo).toBe(5);
      // accumulatedGrace = GRACE_PERIOD * 5 = 1000

      // Let combo timeout and start new one
      // Timeout = 1500 + 1000 = 2500
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD * 5 + 1);
      comboManager.registerKill(Date.now());
      expect(comboManager.count).toBe(1);
      expect(comboManager.maxCombo).toBe(5); // Should not decrease
    });

    it('should track highest combo from multiple sessions', () => {
      // First session: 3 kills
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.maxCombo).toBe(3);
      // accumulatedGrace = GRACE_PERIOD * 3 = 600

      // Reset combo - timeout = 1500 + 600 = 2100
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD * 3 + 1);
      comboManager.registerKill(Date.now());

      // Second session: 6 more kills (for total of 7, but first is already done)
      for (let i = 1; i < 7; i++) {
        vi.advanceTimersByTime(100);
        comboManager.registerKill(Date.now());
      }
      expect(comboManager.maxCombo).toBe(7);
    });
  });

  describe('Grace period extends timeout window', () => {
    it('should extend timeout by GRACE_PERIOD per kill', () => {
      // First kill at t=0
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);

      // Second kill at t=100ms
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      // accumulatedGrace is now GRACE_PERIOD * 2 = 400

      // Can still continue at just inside window from killTime2
      // Timeout from killTime2 = 1500 + 400 = 1900
      // Check at 1850ms after killTime2 (within window)
      vi.advanceTimersByTime(COMBO.TIMEOUT + COMBO.GRACE_PERIOD - 50);
      const result1 = comboManager.registerKill(Date.now());
      expect(result1.isNewCombo).toBe(false);

      // But after full timeout + grace, it should reset
      vi.setSystemTime(0);
      comboManager.reset();

      const killTime3 = Date.now();
      comboManager.registerKill(killTime3);
      // accumulatedGrace = GRACE_PERIOD = 200
      vi.advanceTimersByTime(100);
      const killTime4 = Date.now();
      comboManager.registerKill(killTime4);
      // accumulatedGrace = GRACE_PERIOD * 2 = 400

      // Now try at just past timeout without grace beyond second kill
      // Timeout from killTime4 = 1500 + 400 = 1900
      // Try at 1500.5 which is JUST past the base TIMEOUT from killTime4
      vi.advanceTimersByTime(COMBO.TIMEOUT + 0.5); // Just past timeout
      const result2 = comboManager.registerKill(Date.now());
      // This should still be within the grace period window, so NOT a new combo
      // So this test expectation needs to be adjusted
      expect(result2.isNewCombo).toBe(false);
    });

    it('should allow combo to extend with accumulated grace periods', () => {
      // Build up grace periods
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      // accumulatedGrace should be 3 * GRACE_PERIOD

      const totalTimeout = COMBO.TIMEOUT + 3 * COMBO.GRACE_PERIOD;

      // Should still be able to continue at just before timeout + grace
      vi.advanceTimersByTime(totalTimeout - 150);
      const result = comboManager.registerKill(Date.now());
      expect(result.isNewCombo).toBe(false);
      expect(comboManager.count).toBe(4);
    });
  });

  describe('isMilestone returns true for expected milestones', () => {
    it('should return true for 2x combo', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      const result = comboManager.registerKill(Date.now());
      expect(result.isMilestone).toBe(true);
      expect(comboManager.isMilestoneCount(2)).toBe(true);
    });

    it('should return true for 3x combo', () => {
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.isMilestoneCount(3)).toBe(true);
    });

    it('should return true for 5x combo', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.isMilestoneCount(5)).toBe(true);
    });

    it('should return true for 10x combo', () => {
      expect(comboManager.isMilestoneCount(10)).toBe(true);
    });

    it('should return true for 15x combo', () => {
      expect(comboManager.isMilestoneCount(15)).toBe(true);
    });

    it('should return true for 20x combo', () => {
      expect(comboManager.isMilestoneCount(20)).toBe(true);
    });

    it('should return true for all 5-count milestones (25, 30, 35...)', () => {
      expect(comboManager.isMilestoneCount(25)).toBe(true);
      expect(comboManager.isMilestoneCount(30)).toBe(true);
      expect(comboManager.isMilestoneCount(35)).toBe(true);
      expect(comboManager.isMilestoneCount(50)).toBe(true);
    });
  });

  describe('isMilestone returns false for non-milestones', () => {
    it('should return false for 1x combo', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.isMilestoneCount(1)).toBe(false);
    });

    it('should return false for 4x combo', () => {
      expect(comboManager.isMilestoneCount(4)).toBe(false);
    });

    it('should return false for 6x combo', () => {
      expect(comboManager.isMilestoneCount(6)).toBe(false);
    });

    it('should return false for 7x combo', () => {
      expect(comboManager.isMilestoneCount(7)).toBe(false);
    });

    it('should return false for 8x combo', () => {
      expect(comboManager.isMilestoneCount(8)).toBe(false);
    });

    it('should return false for 9x combo', () => {
      expect(comboManager.isMilestoneCount(9)).toBe(false);
    });

    it('should return false for non-5-multiple combos above 5 (11, 12, 13, 14)', () => {
      expect(comboManager.isMilestoneCount(11)).toBe(false);
      expect(comboManager.isMilestoneCount(12)).toBe(false);
      expect(comboManager.isMilestoneCount(13)).toBe(false);
      expect(comboManager.isMilestoneCount(14)).toBe(false);
    });
  });

  describe('isActive returns true when combo >= 2', () => {
    it('should be false initially', () => {
      expect(comboManager.isActive()).toBe(false);
      expect(comboManager._isActive).toBe(false);
    });

    it('should be false after first kill', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.isActive()).toBe(false);
    });

    it('should be true after second kill', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager.isActive()).toBe(true);
    });

    it('should remain true as combo increases', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        expect(comboManager.isActive()).toBe(comboManager.count >= 2);
        vi.advanceTimersByTime(100);
      }
    });

    it('should become false when combo resets', () => {
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.isActive()).toBe(true);
      // accumulatedGrace = GRACE_PERIOD * 3 = 600

      // Let combo timeout via update()
      // Timeout = 1500 + 600 = 2100
      const lastKillTime = comboManager.lastKillTime;
      comboManager.update(lastKillTime + 2101);
      expect(comboManager.isActive()).toBe(false);
    });
  });

  describe('update() correctly detects expired combos', () => {
    it('should return comboBroken=false if combo is still active', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);

      // accumulatedGrace is now GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check at 500ms after killTime2 (well within timeout)
      const result = comboManager.update(killTime2 + 500);
      expect(result.comboBroken).toBe(false);
      expect(result.previousCount).toBe(0);
    });

    it('should return comboBroken=true when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      const result2 = comboManager.registerKill(killTime2);
      expect(result2.comboCount).toBe(2);

      // accumulatedGrace is GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check well after timeout expires
      const updateResult = comboManager.update(killTime2 + 1901);
      expect(updateResult.comboBroken).toBe(true);
    });

    it('should return previousCount when combo is broken', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      vi.advanceTimersByTime(100);
      const killTime3 = Date.now();
      comboManager.registerKill(killTime3);
      expect(comboManager.count).toBe(3);

      // accumulatedGrace is GRACE_PERIOD * 3 = 600
      // timeout is COMBO.TIMEOUT + 600 = 2100
      // Check well after timeout expires
      const updateResult = comboManager.update(killTime3 + 2101);
      expect(updateResult.previousCount).toBe(3);
    });

    it('should reset count to 0 when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      expect(comboManager.count).toBe(2);

      // accumulatedGrace is GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check well after timeout expires
      comboManager.update(killTime2 + 1901);
      expect(comboManager.count).toBe(0);
    });

    it('should reset multiplier to 1.0 when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      expect(comboManager.multiplier).toBe(1.5);

      // accumulatedGrace is GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check well after timeout expires
      comboManager.update(killTime2 + 1901);
      expect(comboManager.multiplier).toBe(1.0);
    });

    it('should set _isActive to false when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      expect(comboManager._isActive).toBe(true);

      // accumulatedGrace is GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check well after timeout expires
      comboManager.update(killTime2 + 1901);
      expect(comboManager._isActive).toBe(false);
    });

    it('should reset accumulatedGrace when combo expires', () => {
      const killTime1 = Date.now();
      comboManager.registerKill(killTime1);
      vi.advanceTimersByTime(100);
      const killTime2 = Date.now();
      comboManager.registerKill(killTime2);
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD * 2);

      // accumulatedGrace is GRACE_PERIOD * 2 = 400
      // timeout is COMBO.TIMEOUT + 400 = 1900
      // Check well after timeout expires
      comboManager.update(killTime2 + 1901);
      expect(comboManager.accumulatedGrace).toBe(0);
    });

    it('should not break combo when kill count is 0', () => {
      const result = comboManager.update(Date.now() + 1000);
      expect(result.comboBroken).toBe(false);
      expect(result.previousCount).toBe(0);
    });

    it('should not break combo if lastKillTime is null', () => {
      expect(comboManager.lastKillTime).toBeNull();
      const result = comboManager.update(Date.now() + 1000);
      expect(result.comboBroken).toBe(false);
    });
  });

  describe('reset() clears all state', () => {
    it('should reset count to 0', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.count).toBe(5);

      comboManager.reset();
      expect(comboManager.count).toBe(0);
    });

    it('should reset multiplier to 1.0', () => {
      for (let i = 0; i < 5; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.multiplier).toBe(3.0);

      comboManager.reset();
      expect(comboManager.multiplier).toBe(1.0);
    });

    it('should reset lastKillTime to null', () => {
      comboManager.registerKill(Date.now());
      expect(comboManager.lastKillTime).not.toBeNull();

      comboManager.reset();
      expect(comboManager.lastKillTime).toBeNull();
    });

    it('should reset maxCombo to 0 on reset', () => {
      for (let i = 0; i < 7; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.maxCombo).toBe(7);

      comboManager.reset();
      expect(comboManager.maxCombo).toBe(0);
    });

    it('should reset _isActive to false', () => {
      comboManager.registerKill(Date.now());
      vi.advanceTimersByTime(100);
      comboManager.registerKill(Date.now());
      expect(comboManager._isActive).toBe(true);

      comboManager.reset();
      expect(comboManager._isActive).toBe(false);
    });

    it('should reset accumulatedGrace to 0', () => {
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.accumulatedGrace).toBe(COMBO.GRACE_PERIOD * 3);

      comboManager.reset();
      expect(comboManager.accumulatedGrace).toBe(0);
    });
  });

  describe('Getter methods work correctly', () => {
    it('getCount() returns current count', () => {
      for (let i = 0; i < 4; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.getCount()).toBe(4);
    });

    it('getMultiplier() returns current multiplier', () => {
      for (let i = 0; i < 3; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.getMultiplier()).toBe(2.0);
    });

    it('getMaxCombo() returns max combo achieved', () => {
      for (let i = 0; i < 6; i++) {
        comboManager.registerKill(Date.now());
        vi.advanceTimersByTime(100);
      }
      expect(comboManager.getMaxCombo()).toBe(6);
    });
  });
});

describe('PopupManager', () => {
  let popupManager;

  beforeEach(() => {
    popupManager = new PopupManager();
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor initializes empty popups array', () => {
    it('should initialize with empty popups array', () => {
      expect(popupManager.popups).toEqual([]);
      expect(Array.isArray(popupManager.popups)).toBe(true);
    });

    it('should have length 0', () => {
      expect(popupManager.popups.length).toBe(0);
    });

    it('should be able to push to popups array', () => {
      popupManager.popups.push({ text: 'test' });
      expect(popupManager.popups.length).toBe(1);
    });
  });

  describe('add() creates popup with correct properties', () => {
    it('should add popup with all provided parameters', () => {
      popupManager.add('Test Text', 100, 200, '#FFFF00', 1000, 24);
      expect(popupManager.popups.length).toBe(1);
      const popup = popupManager.popups[0];
      expect(popup.text).toBe('Test Text');
      expect(popup.x).toBe(100);
      expect(popup.y).toBe(200);
      expect(popup.color).toBe('#FFFF00');
      expect(popup.duration).toBe(1000);
      expect(popup.fontSize).toBe(24);
    });

    it('should set createdAt to current Date.now()', () => {
      popupManager.add('Test', 0, 0, '#FFF');
      expect(popupManager.popups[0].createdAt).toBe(Date.now());
    });

    it('should initialize opacity to 1.0', () => {
      popupManager.add('Test', 0, 0, '#FFF');
      expect(popupManager.popups[0].opacity).toBe(1.0);
    });

    it('should initialize velocityY to negative RISE_SPEED', () => {
      popupManager.add('Test', 0, 0, '#FFF');
      expect(popupManager.popups[0].velocityY).toBe(-COMBO.POPUP.RISE_SPEED);
    });

    it('should use default duration from COMBO.POPUP.DURATION if not provided', () => {
      popupManager.add('Test', 0, 0, '#FFF');
      expect(popupManager.popups[0].duration).toBe(COMBO.POPUP.DURATION);
    });

    it('should use default fontSize from COMBO.POPUP.FONT_SIZE if not provided', () => {
      popupManager.add('Test', 0, 0, '#FFF');
      expect(popupManager.popups[0].fontSize).toBe(COMBO.POPUP.FONT_SIZE);
    });

    it('should add multiple popups', () => {
      popupManager.add('First', 10, 20, '#FFF');
      popupManager.add('Second', 30, 40, '#F00');
      popupManager.add('Third', 50, 60, '#0F0');
      expect(popupManager.popups.length).toBe(3);
      expect(popupManager.popups[0].text).toBe('First');
      expect(popupManager.popups[1].text).toBe('Second');
      expect(popupManager.popups[2].text).toBe('Third');
    });
  });

  describe('addComboPopup() formats text as "3x COMBO!"', () => {
    it('should format combo popup with 1x', () => {
      popupManager.addComboPopup(1, 100, 100);
      const popup = popupManager.popups[0];
      expect(popup.text).toBe('1x COMBO!');
    });

    it('should format combo popup with 3x', () => {
      popupManager.addComboPopup(3, 100, 100);
      const popup = popupManager.popups[0];
      expect(popup.text).toBe('3x COMBO!');
    });

    it('should format combo popup with 10x', () => {
      popupManager.addComboPopup(10, 100, 100);
      const popup = popupManager.popups[0];
      expect(popup.text).toBe('10x COMBO!');
    });

    it('should use COMBO.POPUP.COLOR', () => {
      popupManager.addComboPopup(5, 100, 100);
      expect(popupManager.popups[0].color).toBe(COMBO.POPUP.COLOR);
    });

    it('should use COMBO.POPUP.DURATION', () => {
      popupManager.addComboPopup(5, 100, 100);
      expect(popupManager.popups[0].duration).toBe(COMBO.POPUP.DURATION);
    });

    it('should use COMBO.POPUP.FONT_SIZE', () => {
      popupManager.addComboPopup(5, 100, 100);
      expect(popupManager.popups[0].fontSize).toBe(COMBO.POPUP.FONT_SIZE);
    });

    it('should set correct position', () => {
      popupManager.addComboPopup(5, 250, 350);
      const popup = popupManager.popups[0];
      expect(popup.x).toBe(250);
      expect(popup.y).toBe(350);
    });
  });

  describe('addComboBrokenPopup() only adds popup if previousCount >= 2', () => {
    it('should add popup when previousCount is 2', () => {
      popupManager.addComboBrokenPopup(2, 100, 100);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('COMBO BROKEN');
    });

    it('should add popup when previousCount is 3', () => {
      popupManager.addComboBrokenPopup(3, 100, 100);
      expect(popupManager.popups.length).toBe(1);
    });

    it('should add popup when previousCount is 5', () => {
      popupManager.addComboBrokenPopup(5, 100, 100);
      expect(popupManager.popups.length).toBe(1);
    });

    it('should add popup when previousCount is 10', () => {
      popupManager.addComboBrokenPopup(10, 100, 100);
      expect(popupManager.popups.length).toBe(1);
    });

    it('should not add popup when previousCount is 0', () => {
      popupManager.addComboBrokenPopup(0, 100, 100);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should not add popup when previousCount is 1', () => {
      popupManager.addComboBrokenPopup(1, 100, 100);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should use COMBO.POPUP.BROKEN_COLOR', () => {
      popupManager.addComboBrokenPopup(2, 100, 100);
      expect(popupManager.popups[0].color).toBe(COMBO.POPUP.BROKEN_COLOR);
    });

    it('should use COMBO.POPUP.DURATION', () => {
      popupManager.addComboBrokenPopup(2, 100, 100);
      expect(popupManager.popups[0].duration).toBe(COMBO.POPUP.DURATION);
    });

    it('should use COMBO.POPUP.FONT_SIZE', () => {
      popupManager.addComboBrokenPopup(2, 100, 100);
      expect(popupManager.popups[0].fontSize).toBe(COMBO.POPUP.FONT_SIZE);
    });

    it('should set correct position', () => {
      popupManager.addComboBrokenPopup(2, 200, 300);
      const popup = popupManager.popups[0];
      expect(popup.x).toBe(200);
      expect(popup.y).toBe(300);
    });
  });

  describe('update() moves popups upward', () => {
    it('should decrease y position (move upward)', () => {
      popupManager.add('Test', 100, 200, '#FFF');
      const initialY = popupManager.popups[0].y;
      popupManager.update(16); // ~1 frame at 60fps
      const newY = popupManager.popups[0].y;
      expect(newY).toBeLessThan(initialY);
    });

    it('should move by velocityY each frame', () => {
      popupManager.add('Test', 100, 200, '#FFF');
      const popup = popupManager.popups[0];
      const initialY = popup.y;
      const expectedVelocity = -COMBO.POPUP.RISE_SPEED;
      popupManager.update(16);
      expect(popup.y).toBe(initialY + expectedVelocity);
    });

    it('should continuously rise on multiple updates', () => {
      popupManager.add('Test', 100, 200, '#FFF');
      const popup = popupManager.popups[0];
      const initialY = popup.y;
      const expectedVelocity = -COMBO.POPUP.RISE_SPEED;

      popupManager.update(16);
      const afterFirstUpdate = popup.y;
      expect(afterFirstUpdate).toBe(initialY + expectedVelocity);

      popupManager.update(16);
      const afterSecondUpdate = popup.y;
      expect(afterSecondUpdate).toBe(afterFirstUpdate + expectedVelocity);
    });

    it('should update multiple popups independently', () => {
      popupManager.add('First', 100, 200, '#FFF');
      popupManager.add('Second', 100, 300, '#FFF');
      popupManager.update(16);
      const expectedVelocity = -COMBO.POPUP.RISE_SPEED;
      expect(popupManager.popups[0].y).toBe(200 + expectedVelocity);
      expect(popupManager.popups[1].y).toBe(300 + expectedVelocity);
    });
  });

  describe('update() fades popups after FADE_START', () => {
    it('should maintain opacity 1.0 before FADE_START', () => {
      popupManager.add('Test', 100, 100, '#FFF', 1000);
      const popup = popupManager.popups[0];
      expect(popup.opacity).toBe(1.0);

      // Update at 50% duration (before FADE_START at 70%)
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.5);
      popupManager.update(16);
      expect(popup.opacity).toBe(1.0);
    });

    it('should start fading at FADE_START point', () => {
      popupManager.add('Test', 100, 100, '#FFF', 1000);
      const popup = popupManager.popups[0];

      // Update at FADE_START point
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * COMBO.POPUP.FADE_START);
      popupManager.update(16);
      expect(popup.opacity).toBeLessThanOrEqual(1.0);
    });

    it('should fade from 1.0 to 0.0 during fade period', () => {
      popupManager.add('Test', 100, 100, '#FFF', 1000);
      const popup = popupManager.popups[0];

      // At 80% duration (20% through fade)
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.8);
      popupManager.update(16);
      const opacityAt80 = popup.opacity;
      expect(opacityAt80).toBeGreaterThan(0);
      expect(opacityAt80).toBeLessThan(1.0);

      // At 95% duration (more faded)
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.15);
      popupManager.update(16);
      const opacityAt95 = popup.opacity;
      expect(opacityAt95).toBeLessThan(opacityAt80);
    });

    it('should reach opacity close to 0 at end of duration', () => {
      popupManager.add('Test', 100, 100, '#FFF', 1000);
      const popup = popupManager.popups[0];

      vi.advanceTimersByTime(COMBO.POPUP.DURATION - 1);
      popupManager.update(16);
      expect(popup.opacity).toBeLessThan(0.01);
    });

    it('should use correct fade calculation formula', () => {
      popupManager.add('Test', 100, 100, '#FFF', 1000);
      const popup = popupManager.popups[0];
      const createdAt = popup.createdAt;

      // At 85% duration (15% through fade period which is 30%)
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.85);
      popupManager.update(16);

      const expectedProgress = 0.85;
      const fadeProgress = (expectedProgress - COMBO.POPUP.FADE_START) / (1 - COMBO.POPUP.FADE_START);
      const expectedOpacity = Math.max(0, 1.0 - fadeProgress);
      expect(popup.opacity).toBeCloseTo(expectedOpacity, 1);
    });
  });

  describe('update() removes expired popups', () => {
    it('should remove popup when duration elapses', () => {
      popupManager.add('Test', 100, 100, '#FFF', 500);
      expect(popupManager.popups.length).toBe(1);

      vi.advanceTimersByTime(500);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should remove popup just after duration', () => {
      popupManager.add('Test', 100, 100, '#FFF', 500);
      vi.advanceTimersByTime(501);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should not remove popup before duration', () => {
      popupManager.add('Test', 100, 100, '#FFF', 500);
      vi.advanceTimersByTime(499);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(1);
    });

    it('should remove only expired popups, keep active ones', () => {
      popupManager.add('First', 100, 100, '#FFF', 500);
      const firstCreatedAt = popupManager.popups[0].createdAt;

      vi.advanceTimersByTime(300);
      popupManager.add('Second', 100, 100, '#FFF', 500);
      expect(popupManager.popups.length).toBe(2);

      // Advance to remove first but not second
      vi.setSystemTime(firstCreatedAt + 501);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('Second');
    });

    it('should remove all expired popups when multiple expire', () => {
      popupManager.add('First', 100, 100, '#FFF', 500);
      popupManager.add('Second', 100, 100, '#FFF', 500);
      popupManager.add('Third', 100, 100, '#FFF', 500);
      expect(popupManager.popups.length).toBe(3);

      vi.advanceTimersByTime(501);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });
  });

  describe('getPopups() returns popups array', () => {
    it('should return empty array initially', () => {
      const popups = popupManager.getPopups();
      expect(popups).toEqual([]);
      expect(Array.isArray(popups)).toBe(true);
    });

    it('should return array with added popups', () => {
      popupManager.add('Test1', 100, 100, '#FFF');
      popupManager.add('Test2', 200, 200, '#FFF');
      const popups = popupManager.getPopups();
      expect(popups.length).toBe(2);
      expect(popups[0].text).toBe('Test1');
      expect(popups[1].text).toBe('Test2');
    });

    it('should return reference to internal popups array', () => {
      popupManager.add('Test', 100, 100, '#FFF');
      const popups = popupManager.getPopups();
      expect(popups).toBe(popupManager.popups);
    });

    it('should reflect changes after update()', () => {
      popupManager.add('Test', 100, 100, '#FFF', 100);
      vi.advanceTimersByTime(101);
      popupManager.update(16);
      const popups = popupManager.getPopups();
      expect(popups.length).toBe(0);
    });
  });

  describe('clear() removes all popups', () => {
    it('should empty popups array', () => {
      popupManager.add('Test1', 100, 100, '#FFF');
      popupManager.add('Test2', 100, 100, '#FFF');
      expect(popupManager.popups.length).toBe(2);

      popupManager.clear();
      expect(popupManager.popups.length).toBe(0);
    });

    it('should create new empty array', () => {
      popupManager.add('Test', 100, 100, '#FFF');
      const oldArray = popupManager.popups;
      popupManager.clear();
      expect(popupManager.popups).not.toBe(oldArray);
      expect(popupManager.popups).toEqual([]);
    });

    it('should work when already empty', () => {
      expect(popupManager.popups.length).toBe(0);
      popupManager.clear();
      expect(popupManager.popups.length).toBe(0);
    });

    it('should allow adding popups after clear', () => {
      popupManager.add('Test1', 100, 100, '#FFF');
      popupManager.clear();
      popupManager.add('Test2', 200, 200, '#FFF');
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('Test2');
    });
  });

  describe('reset() is alias for clear()', () => {
    it('should remove all popups', () => {
      popupManager.add('Test1', 100, 100, '#FFF');
      popupManager.add('Test2', 100, 100, '#FFF');
      popupManager.reset();
      expect(popupManager.popups.length).toBe(0);
    });

    it('should work the same as clear()', () => {
      popupManager.add('Test1', 100, 100, '#FFF');
      popupManager.add('Test2', 100, 100, '#FFF');
      const lenBeforeClear = popupManager.popups.length;

      popupManager.clear();
      const lenAfterClear = popupManager.popups.length;

      popupManager.add('Test3', 100, 100, '#FFF');
      popupManager.add('Test4', 100, 100, '#FFF');
      popupManager.reset();
      const lenAfterReset = popupManager.popups.length;

      expect(lenAfterClear).toBe(lenAfterReset);
    });

    it('should create new array like clear()', () => {
      popupManager.add('Test', 100, 100, '#FFF');
      const oldArray = popupManager.popups;
      popupManager.reset();
      expect(popupManager.popups).not.toBe(oldArray);
    });
  });

  describe('Integration tests', () => {
    it('should handle combo popup lifecycle', () => {
      popupManager.addComboPopup(5, 100, 200);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('5x COMBO!');

      // Update mid-duration
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.5);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].opacity).toBe(1.0);

      // Update past FADE_START
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.3);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].opacity).toBeLessThan(1.0);

      // Update past duration
      vi.advanceTimersByTime(COMBO.POPUP.DURATION * 0.2);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should handle combo broken popup lifecycle', () => {
      popupManager.addComboBrokenPopup(3, 150, 250);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('COMBO BROKEN');
      expect(popupManager.popups[0].color).toBe(COMBO.POPUP.BROKEN_COLOR);

      vi.advanceTimersByTime(COMBO.POPUP.DURATION + 1);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });

    it('should handle multiple popups with different lifespans', () => {
      popupManager.add('First', 100, 100, '#FFF', 500);
      const firstCreatedAt = Date.now();

      vi.advanceTimersByTime(100);
      popupManager.add('Second', 100, 100, '#FFF', 800);
      const secondCreatedAt = Date.now();

      // First expires
      vi.setSystemTime(firstCreatedAt + 501);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(1);
      expect(popupManager.popups[0].text).toBe('Second');

      // Second expires
      vi.setSystemTime(secondCreatedAt + 801);
      popupManager.update(16);
      expect(popupManager.popups.length).toBe(0);
    });
  });
});
